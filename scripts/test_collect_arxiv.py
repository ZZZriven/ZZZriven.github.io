#!/usr/bin/env python3
"""Network-free regression tests for the daily arXiv metadata collector."""
import copy
from datetime import datetime, timedelta, timezone
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest import mock
import urllib.parse
from xml.sax.saxutils import escape

HERE = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location("collect_arxiv", HERE / "collect_arxiv.py")
c = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(c)
CONFIG = json.loads((HERE.parent / "content/arxiv-config.json").read_text())
NOW = datetime(2026, 9, 13, 1, 0, tzinfo=timezone.utc)


def entry(ident="2609.12345v1", title="Self-evolving agents with memory", updated="2026-09-12T12:00:00Z", published="2026-09-01T12:00:00Z", abstract="We study memory evolution for self-evolving agents.", category="cs.AI"):
    return f'''<entry><id>http://arxiv.org/abs/{ident}</id><title>{escape(title)}</title><published>{published}</published><updated>{updated}</updated><summary>{escape(abstract)}</summary><author><name>A. Researcher</name></author><category term="{category}"/></entry>'''


def page(entries, *, total=None, start=0):
    return (f'''<feed xmlns="http://www.w3.org/2005/Atom" xmlns:opensearch="http://a9.com/-/spec/opensearch/1.1/"><opensearch:totalResults>{len(entries) if total is None else total}</opensearch:totalResults><opensearch:startIndex>{start}</opensearch:startIndex>''' + "".join(entries) + "</feed>").encode()


def empty():
    return {"updatedAt": None, "source": "arXiv", "query": "", "status": "never-run", "items": [], "lastRun": None}


def collect(entries, *, existing=None, curated=None, config=None, **kwargs):
    return c.collect(config or CONFIG, existing or empty(), curated or [], NOW, get=lambda _: page(entries), **kwargs)


class CollectorTests(unittest.TestCase):
    def test_topics_and_paper_type_are_independent(self):
        axes = c.classify_axes({"title": "A Survey of Memory and Prompt Optimization", "abstract": "We discuss skill libraries and workflow evolution."})
        self.assertEqual(axes["paperType"], "Survey")
        self.assertEqual(set(axes["topics"]), {"Memory Evolution", "Prompt & Context Evolution", "Tool & Skill Evolution", "Architecture Evolution"})
        self.assertIn("No RSI capability is inferred", axes["classificationReason"])

    def test_unknown_is_not_forced_into_an_evolution_target(self):
        entry = {"title": "A self-improving agent", "abstract": "We study an emerging research question."}
        self.assertEqual(c.classify(entry)[0], "Unclassified")
        self.assertEqual(c.classify_axes(entry)["topics"], [])
        self.assertEqual(c.classify_axes(entry)["paperType"], "Unclassified")

    def test_atom_metadata_and_provisional_classification(self):
        result = collect([entry()])
        item = result["items"][0]
        self.assertEqual(item["id"], "2609.12345")
        self.assertEqual(item["version"], "v1")
        self.assertEqual(item["authors"], ["A. Researcher"])
        self.assertEqual(item["category"], "Memory Evolution")
        self.assertTrue(item["provisional"])
        self.assertEqual(item["status"], "awaiting-analysis")
        self.assertEqual(item["arxivUrl"], "https://arxiv.org/abs/2609.12345v1")
        self.assertEqual(item["pdfUrl"], "https://arxiv.org/pdf/2609.12345v1")
        self.assertEqual(result["lastRun"]["lookbackDays"], 30)
        self.assertNotIn("method", item)
        self.assertNotIn("mode", item)

    def test_duplicate_versions_collapse_to_latest(self):
        result = collect([entry("2609.12345v2"), entry("2609.12345v1", updated="2026-09-11T12:00:00Z")])
        self.assertEqual(len(result["items"]), 1)
        self.assertEqual(result["items"][0]["version"], "v2")
        self.assertEqual(result["lastRun"]["added"], 1)

    def test_refresh_preserves_first_seen_and_backlog(self):
        old = collect([entry(), entry("2609.54321v1")])
        old["updatedAt"] = "2026-09-12T01:00:00Z"
        old["items"][1]["firstSeenAt"] = "2026-09-02T01:00:00Z"
        saved = copy.deepcopy(old)
        result = collect([entry("2609.12345v2", title="Self-evolving agents with new memory")], existing=old)
        updated = next(item for item in result["items"] if item["id"] == "2609.12345")
        self.assertEqual(updated["firstSeenAt"], "2026-09-02T01:00:00Z")
        self.assertEqual(updated["version"], "v2")
        self.assertEqual(result["lastRun"]["updated"], 1)
        self.assertEqual(len(result["items"]), 2)
        self.assertEqual(old, saved)

    def test_curated_notes_and_pinned_version_never_change(self):
        curated = [{"id": "2609.12345", "version": "v1", "method": "Hand-reviewed content"}]
        saved = copy.deepcopy(curated)
        old = collect([entry()])
        result = collect([entry("2609.12345v7")], curated=curated, existing=old)
        self.assertEqual(result["items"], [])
        self.assertEqual(result["lastRun"]["excludedCurated"], 1)
        self.assertEqual(curated, saved)

    def test_financial_rsi_and_unrelated_categories_do_not_match(self):
        result = collect([
            entry(title="RSI stock market signals", abstract="A relative strength index trading strategy."),
            entry("2609.12346v1", category="q-fin.TR"),
            entry("2609.12347v1", title="Workflow optimization in chemistry", abstract="We optimize reagent schedules."),
        ])
        self.assertEqual(result["items"], [])
        query = c.build_query(CONFIG)
        self.assertNotIn('all:"RSI"', query)
        self.assertIn("cat:cs.AI", query)

    def test_agent_context_required_for_optimization_terms(self):
        result = collect([entry(title="Workflow optimization for language agents", abstract="We optimize execution plans.")])
        self.assertEqual(len(result["items"]), 1)
        self.assertIn("workflow optimization", result["items"][0]["matchedTerms"])

    def test_new_version_of_old_paper_is_included(self):
        result = collect([entry(published="2022-01-01T12:00:00Z")])
        self.assertEqual(len(result["items"]), 1)
        self.assertEqual(result["items"][0]["published"], "2022-01-01")

    def test_incremental_overlap_uses_last_success_after_outage(self):
        old = empty()
        old["updatedAt"] = "2026-09-01T01:00:00Z"
        self.assertEqual(c.window_start(old, NOW, CONFIG, None), datetime(2026, 8, 22, 1, 0, tzinfo=timezone.utc))
        result = collect([entry(updated="2026-09-02T12:00:00Z")], existing=old)
        self.assertEqual(result["lastRun"]["lookbackDays"], 22)
        self.assertEqual(len(result["items"]), 1)

    def test_pagination_walks_until_overlap_not_total_history(self):
        config = {**CONFIG, "pageSize": 1}
        requests = []
        pages = [page([entry()], total=99), page([entry("2501.00001v1", updated="2025-01-02T00:00:00Z", published="2025-01-01T00:00:00Z")], total=99, start=1)]
        def get(url):
            requests.append(urllib.parse.parse_qs(urllib.parse.urlsplit(url).query))
            return pages.pop(0)
        result = c.collect(config, empty(), [], NOW, get=get)
        self.assertEqual(len(requests), 2)
        self.assertEqual(requests[1]["start"], ["1"])
        self.assertEqual(requests[0]["sortBy"], ["lastUpdatedDate"])
        self.assertEqual(result["lastRun"]["fetched"], 2)
        self.assertEqual(len(result["items"]), 1)

    def test_result_cap_fails_instead_of_silently_truncating(self):
        with self.assertRaisesRegex(c.CollectionError, "Result cap"):
            c.collect(CONFIG, empty(), [], NOW, get=lambda _: page([entry()], total=2), max_results=1)

    def test_api_errors_and_malformed_xml_fail(self):
        for xml in (b"<broken", b"<html>Unavailable</html>", b'<feed xmlns="http://www.w3.org/2005/Atom"><entry><id>http://arxiv.org/api/errors#incorrect_id_format_for_1</id><title>Error</title><summary>Invalid query</summary></entry></feed>', page([entry().replace("<title>Self-evolving agents with memory</title>", "")])):
            with self.subTest(xml=xml[:70]), self.assertRaises(c.CollectionError):
                c.parse_page(xml)

    def test_incomplete_and_unsorted_pages_fail(self):
        with self.assertRaisesRegex(c.CollectionError, "empty page"):
            c.collect(CONFIG, empty(), [], NOW, get=lambda _: page([], total=1))
        with self.assertRaisesRegex(c.CollectionError, "not sorted"):
            collect([entry(updated="2026-09-11T12:00:00Z"), entry("2609.12346v1")])

    def test_failure_preserves_disk_state_and_curated_bytes(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            config, feed, curated = root / "config.json", root / "feed.json", root / "papers.json"
            config.write_text(json.dumps(CONFIG))
            feed.write_text(json.dumps(empty()))
            curated.write_text('[{"id":"2609.12345","version":"v1","method":"Reviewed"}]\n')
            before, reviewed = feed.read_bytes(), curated.read_bytes()
            with self.assertRaises(c.CollectionError):
                c.run(config, feed, curated, now=NOW, get=lambda _: b"not xml")
            self.assertEqual(feed.read_bytes(), before)
            self.assertEqual(curated.read_bytes(), reviewed)
            c.run(config, feed, curated, now=NOW, get=lambda _: page([entry()]), dry_run=True)
            self.assertEqual(feed.read_bytes(), before)
            self.assertEqual(curated.read_bytes(), reviewed)

    def test_atomic_replace_failure_leaves_valid_previous_json(self):
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / "feed.json"
            before = '{"status": "ok"}\n'
            path.write_text(before)
            with mock.patch.object(c.os, "replace", side_effect=OSError("disk failure")):
                with self.assertRaises(OSError):
                    c.atomic_write(path, {"status": "new"})
            self.assertEqual(path.read_text(), before)
            self.assertEqual(list(Path(temp).iterdir()), [path])
            c.atomic_write(path, {"status": "ok", "items": []})
            self.assertEqual(json.loads(path.read_text())["items"], [])

    def test_lower_version_cannot_downgrade_backlog(self):
        old = collect([entry("2609.12345v3")])
        result = collect([entry("2609.12345v2")], existing=old)
        self.assertEqual(result["items"][0]["version"], "v3")
        self.assertEqual(result["lastRun"]["updated"], 0)

    def test_invalid_configuration_cannot_disable_rate_limit(self):
        with self.assertRaisesRegex(c.CollectionError, "3.1"):
            c.checked_config({**CONFIG, "requestDelaySeconds": 0})
        with self.assertRaisesRegex(c.CollectionError, "AI/ML"):
            c.checked_config({**CONFIG, "categories": ["q-fin.TR"]})

    def test_http_retries_are_serial_and_rate_limited(self):
        config = {**CONFIG, "maxRetries": 1}
        response = mock.MagicMock()
        response.__enter__.return_value.read.return_value = page([])
        from urllib.error import HTTPError
        failure = HTTPError(c.API, 429, "slow down", {"Retry-After": "4"}, io.BytesIO(b"Rate limited"))
        with mock.patch.object(c.urllib.request, "urlopen", side_effect=[failure, response]) as request, mock.patch.object(c.time, "sleep") as sleep:
            client = c.ArxivClient(config)
            self.assertEqual(client.get(c.API), page([]))
            self.assertEqual(request.call_count, 2)
            self.assertGreaterEqual(sleep.call_args_list[0].args[0], 4)
        failure = HTTPError(c.API, 400, "bad query", {}, io.BytesIO(b"Bad query"))
        with mock.patch.object(c.urllib.request, "urlopen", side_effect=failure) as request:
            with self.assertRaisesRegex(c.CollectionError, "HTTP 400"):
                c.ArxivClient(config).get(c.API)
            self.assertEqual(request.call_count, 1)


    def test_phrase_variants_and_workflow_agent_context(self):
        result = collect([
            entry("2609.12345v1", title="A self-improving language model", abstract="Learning through retained weight updates."),
            entry("2609.12346v1", title="The self-evolution of agents", abstract="We investigate persistent optimization."),
            entry("2609.12347v1", title="Self-evolving workflows", abstract="Language agents optimize execution plans."),
            entry("2609.12348v1", title="Self-evolving workflows", abstract="A study of laboratory scheduling without an autonomous system."),
        ])
        self.assertEqual({item["id"] for item in result["items"]}, {"2609.12345", "2609.12346", "2609.12347"})

    def test_retry_after_is_never_shortened_and_response_is_closed(self):
        from urllib.error import HTTPError
        for retry_after in ("3600", "Wed, 31 Dec 2098 23:59:59 GMT"):
            response = io.BytesIO(b"Rate limited")
            failure = HTTPError(c.API, 429, "slow down", {"Retry-After": retry_after}, response)
            with self.subTest(retry_after=retry_after), mock.patch.object(c.urllib.request, "urlopen", side_effect=failure) as request, mock.patch.object(c.time, "sleep") as sleep:
                with self.assertRaisesRegex(c.CollectionError, "No early retry"):
                    c.ArxivClient(CONFIG).get(c.API)
                self.assertEqual(request.call_count, 1)
                sleep.assert_not_called()
                self.assertTrue(response.closed)

    def test_retry_progress_reports_state_without_full_query(self):
        from urllib.error import HTTPError
        error_body = io.BytesIO(b"Unavailable")
        failure = HTTPError(c.API, 503, "unavailable", {}, error_body)
        response = mock.MagicMock()
        response.__enter__.return_value.read.return_value = page([])
        messages = []
        with mock.patch.object(c.urllib.request, "urlopen", side_effect=[failure, response]), mock.patch.object(c.time, "sleep"):
            c.ArxivClient(CONFIG, progress=messages.append).get(c.API + "?search_query=private-unnecessary-query&start=100")
        self.assertTrue(error_body.closed)
        self.assertTrue(any("offset 100" in message for message in messages))
        self.assertTrue(any("503" in message and "retrying" in message for message in messages))
        self.assertFalse(any("private-unnecessary-query" in message for message in messages))


if __name__ == "__main__":
    unittest.main()
