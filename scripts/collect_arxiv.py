#!/usr/bin/env python3
"""Collect arXiv metadata without changing reviewed paper notes.

The API supports lastUpdatedDate sorting, while its documented date filter is
submittedDate. We therefore walk newest updates until the overlap boundary,
including revisions of papers submitted before that boundary. A partial/error
response never advances the checkpoint or replaces the last successful feed.

Docs: https://info.arxiv.org/help/api/user-manual.html
Terms: https://info.arxiv.org/help/api/tou.html
"""
from __future__ import annotations

import argparse
import copy
from datetime import datetime, timedelta, timezone
import email.utils
import json
import math
import os
from pathlib import Path
import re
import sys
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
API = "https://export.arxiv.org/api/query"
NS = {"a": "http://www.w3.org/2005/Atom", "o": "http://a9.com/-/spec/opensearch/1.1/"}
ID_PATTERN = re.compile(r"^(?P<id>(?:\d{4}\.\d{4,5}|[a-zA-Z.-]+/\d{7}))(?P<version>v[1-9]\d*)?$")
CATEGORY_RULES = (
    ("Surveys & Frameworks", ("survey", "systematic review", "taxonomy", "perspective")),
    ("Evaluation & Limits", ("benchmark", "evaluation", "evaluating", "limitation", "limits", "collapse", "safety")),
    ("Memory & Skills", ("memory", "memories", "skill", "lifelong", "continual learning")),
    ("Models & Rewards", ("reward", "fine tuning", "finetuning", "reinforcement learning", "self training", "distillation")),
    ("Search & Discovery", ("scientific discovery", "scientific research", "research agent", "algorithm discovery", "bayesian optimization")),
    ("Output Refinement", ("self correction", "self refinement", "self refine", "iterative refinement")),
    ("Agents & Code", ("agent", "agentic", "workflow", "code", "program", "prompt")),
)


class CollectionError(RuntimeError):
    """A collection could not be completed safely."""


def timestamp(value: str) -> datetime:
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except (ValueError, AttributeError) as exc:
        raise CollectionError(f"Invalid timestamp: {value!r}") from exc
    if parsed.tzinfo is None:
        raise CollectionError(f"Timestamp must include a timezone: {value!r}")
    return parsed.astimezone(timezone.utc)


def iso(value: datetime) -> str:
    return value.astimezone(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def normalize(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", value.lower()).strip()


def has_term(text: str, term: str) -> bool:
    # Word boundaries prevent matches such as "agent" inside "reagent".
    return f" {normalize(term)} " in f" {normalize(text)} "


def arxiv_id(value: str) -> tuple[str, str | None]:
    if value.startswith(("https://", "http://")):
        parsed = urllib.parse.urlsplit(value)
        if parsed.hostname not in ("arxiv.org", "www.arxiv.org", "export.arxiv.org"):
            raise CollectionError(f"Unexpected identifier host: {parsed.hostname}")
        value = re.sub(r"^/(?:abs|pdf)/", "", parsed.path).removesuffix(".pdf")
    match = ID_PATTERN.fullmatch(value)
    if not match:
        raise CollectionError(f"Malformed arXiv identifier: {value!r}")
    return match["id"], match["version"]


def checked_config(config: dict) -> dict:
    config = copy.deepcopy(config)
    for key in ("terms", "agentTerms", "agentOptimizationTerms", "categories"):
        values = config.get(key)
        if not isinstance(values, list) or not values or not all(isinstance(x, str) and x.strip() for x in values):
            raise CollectionError(f"Config {key} must be a nonempty string array")
        if any('"' in value or "\n" in value for value in values):
            raise CollectionError(f"Config {key} contains unsupported quote/newline characters")
    if not all(re.fullmatch(r"(?:cs\.(?:AI|LG|CL|MA|RO)|stat\.ML)", x) for x in config["categories"]):
        raise CollectionError("Config categories must remain in AI/ML-related arXiv categories")
    bounds = {"lookbackDays": (1, 90), "initialLookbackDays": (1, 90), "pageSize": (1, 200), "maxResults": (1, 5000), "maxRetries": (0, 5)}
    for key, (low, high) in bounds.items():
        if not isinstance(config.get(key), int) or not low <= config[key] <= high:
            raise CollectionError(f"Config {key} must be between {low} and {high}")
    if not isinstance(config.get("requestDelaySeconds"), (int, float)) or config["requestDelaySeconds"] < 3.1:
        raise CollectionError("requestDelaySeconds must be at least 3.1 seconds")
    if not isinstance(config.get("requestTimeoutSeconds"), (int, float)) or not 5 <= config["requestTimeoutSeconds"] <= 120:
        raise CollectionError("requestTimeoutSeconds must be between 5 and 120")
    return config


def build_query(config: dict) -> str:
    direct = " OR ".join(f'all:"{term}"' for term in config["terms"])
    optimizations = " OR ".join(f'all:"{term}"' for term in config["agentOptimizationTerms"])
    agents = " OR ".join(f'all:"{term}"' for term in config["agentTerms"])
    categories = " OR ".join(f"cat:{term}" for term in config["categories"])
    return f"(({direct}) OR (({optimizations}) AND ({agents}))) AND ({categories})"


def relevance(entry: dict, config: dict) -> list[str]:
    if not set(entry["_categories"]).intersection(config["categories"]):
        return []
    text = entry["title"] + " " + entry["abstract"]
    matches = [term for term in config["terms"] if has_term(text, term)]
    if any(has_term(text, term) for term in config["agentTerms"]):
        matches += [term for term in config["agentOptimizationTerms"] if has_term(text, term)]
    return list(dict.fromkeys(matches))


def classify(entry: dict) -> tuple[str, str]:
    # Labels describe a tentative research theme, never evidence of true RSI.
    # Title signals precede abstract signals; all results require later analysis.
    for location in ("title", "abstract"):
        for category, terms in CATEGORY_RULES:
            found = [term for term in terms if has_term(entry[location], term)]
            if found:
                return category, f"Provisional topic: {location} contains '{found[0]}'. Full-paper review is required; this is not an RSI capability claim."
    return "Agents & Code", "Provisional fallback for an agent/self-improvement query match; the main research problem requires full-paper review. No RSI capability is inferred."


def parse_page(xml: bytes) -> tuple[int, int, list[dict]]:
    try:
        root = ET.fromstring(xml)
    except ET.ParseError as exc:
        raise CollectionError(f"Malformed Atom XML: {exc}") from exc
    if root.tag != f"{{{NS['a']}}}feed":
        raise CollectionError("Response is not an Atom feed")
    entries = root.findall("a:entry", NS)
    for node in entries:
        ident = node.findtext("a:id", default="", namespaces=NS)
        title = node.findtext("a:title", default="", namespaces=NS)
        if "/api/errors" in ident or title.strip().lower() == "error":
            detail = node.findtext("a:summary", default="Unknown arXiv API error", namespaces=NS)
            raise CollectionError("arXiv API error: " + detail.strip())
    try:
        total = int(root.findtext("o:totalResults", namespaces=NS))
        start = int(root.findtext("o:startIndex", namespaces=NS))
    except (TypeError, ValueError) as exc:
        raise CollectionError("Missing/invalid Atom pagination metadata") from exc
    if total < 0 or start < 0 or start + len(entries) > total:
        raise CollectionError("Inconsistent Atom pagination metadata")
    parsed = []
    for node in entries:
        def required(path: str) -> str:
            raw = node.findtext(path, namespaces=NS)
            if not raw or not raw.strip():
                raise CollectionError(f"Malformed entry: missing {path}")
            return " ".join(raw.split())
        ident, version = arxiv_id(required("a:id"))
        if not version:
            raise CollectionError(f"Entry {ident} does not identify an arXiv version")
        published, updated = timestamp(required("a:published")), timestamp(required("a:updated"))
        if updated < published:
            raise CollectionError(f"Entry {ident} was updated before publication")
        authors = [" ".join((author.findtext("a:name", default="", namespaces=NS)).split()) for author in node.findall("a:author", NS)]
        categories = [category.get("term", "") for category in node.findall("a:category", NS)]
        if not authors or not all(authors) or not categories or not all(categories):
            raise CollectionError(f"Entry {ident} lacks authors/categories")
        parsed.append({
            "id": ident, "title": required("a:title"), "authors": authors,
            "published": published.date().isoformat(), "updated": updated.date().isoformat(),
            "version": version, "abstract": required("a:summary"),
            "arxivUrl": f"https://arxiv.org/abs/{ident}{version}",
            "pdfUrl": f"https://arxiv.org/pdf/{ident}{version}",
            "_updatedAt": updated, "_categories": categories,
        })
    return total, start, parsed


class ArxivClient:
    def __init__(self, config: dict, progress=None):
        self.config = config
        self.last_request = None
        self.progress = progress or (lambda message: None)

    def get(self, url: str) -> bytes:
        for attempt in range(self.config["maxRetries"] + 1):
            if self.last_request is not None:
                time.sleep(max(0, self.config["requestDelaySeconds"] - (time.monotonic() - self.last_request)))
            self.last_request = time.monotonic()
            parameters = urllib.parse.parse_qs(urllib.parse.urlsplit(url).query)
            self.progress(f"Requesting arXiv page at offset {parameters.get('start', ['0'])[0]} (attempt {attempt + 1}/{self.config['maxRetries'] + 1}).")
            request = urllib.request.Request(url, headers={
                "User-Agent": "RSI-Paper/1.0 (https://zzzriven.github.io/rsi/; daily metadata discovery)",
                "Accept": "application/atom+xml",
            })
            try:
                with urllib.request.urlopen(request, timeout=self.config["requestTimeoutSeconds"]) as response:
                    body = response.read(25_000_001)
                    if len(body) > 25_000_000:
                        raise CollectionError("Atom response exceeds safe size limit")
                    return body
            except urllib.error.HTTPError as exc:
                # HTTPError also owns a response stream. Close it before another
                # attempt so retries never keep simultaneous connections open.
                code = exc.code
                retry_after = exc.headers.get("Retry-After") if exc.headers else None
                exc.close()
                if code != 429 and not 500 <= code < 600:
                    raise CollectionError(f"arXiv returned HTTP {code}") from exc
                wait = 0
                if retry_after:
                    try:
                        wait = float(retry_after)
                    except ValueError:
                        try:
                            wait = (email.utils.parsedate_to_datetime(retry_after) - datetime.now(timezone.utc)).total_seconds()
                        except (ValueError, TypeError):
                            pass
                if not math.isfinite(wait):
                    wait = 0
                if wait > 120:
                    raise CollectionError(f"arXiv returned HTTP {code} and requested Retry-After {math.ceil(wait)} seconds. No early retry was made; wait for that interval before running again.") from exc
                error = f"HTTP {code}"
            except (urllib.error.URLError, TimeoutError, OSError) as exc:
                error, wait = str(exc), 0
            if attempt == self.config["maxRetries"]:
                raise CollectionError(f"arXiv request failed after {attempt + 1} attempts: {error}")
            delay = max(self.config["requestDelaySeconds"] * (2 ** attempt), wait)
            self.progress(f"arXiv {error}; retrying in {delay:g} seconds.")
            time.sleep(delay)
        raise AssertionError("unreachable")


def window_start(existing: dict, now: datetime, config: dict, lookback_days: int | None) -> datetime:
    days = lookback_days if lookback_days is not None else config["lookbackDays"]
    checkpoint = existing.get("updatedAt")
    if checkpoint:
        successful = timestamp(checkpoint)
        if successful > now:
            raise CollectionError("Last successful run is in the future; refusing to move its checkpoint backwards")
        return successful - timedelta(days=days)
    return now - timedelta(days=lookback_days if lookback_days is not None else config["initialLookbackDays"])


def collect(config: dict, existing: dict, curated: list[dict], now: datetime, *, get=None, lookback_days=None, max_results=None, progress=None) -> dict:
    config = checked_config(config)
    if lookback_days is not None and not 1 <= lookback_days <= 90:
        raise CollectionError("lookback-days must be between 1 and 90")
    cap = max_results if max_results is not None else config["maxResults"]
    if not 1 <= cap <= 5000:
        raise CollectionError("max-results must be between 1 and 5000")
    query = build_query(config)
    since = window_start(existing, now, config, lookback_days)
    curated_ids = {arxiv_id(paper["id"])[0] for paper in curated}
    backlog = {}
    for item in existing.get("items", []):
        ident, _ = arxiv_id(item["id"])
        if ident in backlog:
            raise CollectionError(f"Existing feed contains duplicate ID {ident}")
        if ident not in curated_ids:
            backlog[ident] = copy.deepcopy(item)
    log = progress or (lambda message: None)
    log(f"Scanning arXiv updates since {iso(since)}; maximum {cap} results, {config['pageSize']} per page.")
    fetch = get or ArxivClient(config, progress=log).get
    start, total, fetched = 0, None, 0
    previous_time = None
    seen_pages = set()
    candidates = {}
    while True:
        limit = min(config["pageSize"], cap - fetched)
        if limit <= 0:
            raise CollectionError(f"Result cap ({cap}) reached before the lookback boundary. Increase --max-results or narrow configured terms; feed remains unchanged.")
        url = API + "?" + urllib.parse.urlencode({"search_query": query, "start": start, "max_results": limit, "sortBy": "lastUpdatedDate", "sortOrder": "descending"})
        page_total, page_start, entries = parse_page(fetch(url))
        if page_start != start or (total is not None and total != page_total):
            raise CollectionError("Pagination changed during collection; retry later without advancing the checkpoint")
        total = page_total
        if len(entries) > limit:
            raise CollectionError("API returned more entries than requested")
        signature = tuple((item["id"], item["version"]) for item in entries)
        if entries and signature in seen_pages:
            raise CollectionError("API repeated a result page; refusing an incomplete collection")
        seen_pages.add(signature)
        if not entries and start < total:
            raise CollectionError("API returned an empty page before totalResults was exhausted")
        fetched += len(entries)
        log(f"Validated {len(entries)} entries; scanned {fetched} of {total} search results.")
        crossed_boundary = False
        for item in entries:
            updated = item["_updatedAt"]
            if previous_time is not None and updated > previous_time:
                raise CollectionError("API results are not sorted by lastUpdatedDate descending")
            previous_time = updated
            if updated < since:
                crossed_boundary = True
                continue
            if updated > now:
                # A fixed --now may replay older snapshots; never publish future entries.
                continue
            previous = candidates.get(item["id"])
            if previous is None or int(item["version"][1:]) > int(previous["version"][1:]):
                candidates[item["id"]] = item
        start += len(entries)
        if crossed_boundary or start >= total:
            log("Reached the lookback boundary." if crossed_boundary else "Reached the end of the matching results.")
            break
    added, updated_count, excluded_curated = 0, 0, 0
    stamp = iso(now)
    for ident, entry in candidates.items():
        if ident in curated_ids:
            excluded_curated += 1
            continue
        matches = relevance(entry, config)
        if not matches:
            continue
        category, reason = classify(entry)
        public = {key: value for key, value in entry.items() if not key.startswith("_")}
        public.update({"category": category, "provisional": True, "classificationReason": reason, "matchedTerms": matches, "firstSeenAt": stamp, "lastSeenAt": stamp, "status": "awaiting-analysis"})
        old = backlog.get(ident)
        if old:
            public["firstSeenAt"] = old["firstSeenAt"]
            if int(public["version"][1:]) < int(old["version"][1:]) or (public["version"] == old["version"] and public["updated"] < old["updated"]):
                old["lastSeenAt"] = stamp
                continue
            ignore = {"firstSeenAt", "lastSeenAt"}
            if {k: v for k, v in old.items() if k not in ignore} != {k: v for k, v in public.items() if k not in ignore}:
                updated_count += 1
        else:
            added += 1
        backlog[ident] = public
    items = sorted(backlog.values(), key=lambda item: (item["updated"], item["published"], item["id"]), reverse=True)
    return {"updatedAt": stamp, "source": "arXiv", "query": query, "status": "ok", "items": items,
            "lastRun": {"startedAt": stamp, "completedAt": stamp, "fetched": fetched, "added": added, "updated": updated_count, "excludedCurated": excluded_curated, "lookbackDays": math.ceil((now - since).total_seconds() / 86400)}}


def atomic_write(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = None
    try:
        with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=path.parent, prefix=f".{path.name}.", suffix=".tmp", delete=False) as handle:
            temporary = Path(handle.name)
            json.dump(data, handle, ensure_ascii=False, indent=2)
            handle.write("\n")
            handle.flush()
            os.fsync(handle.fileno())
        os.chmod(temporary, 0o644)
        os.replace(temporary, path)
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)


def run(config_path: Path, feed_path: Path, curated_path: Path, *, dry_run=False, now=None, get=None, lookback_days=None, max_results=None, progress=None) -> dict:
    started = now or datetime.now(timezone.utc)
    config = json.loads(config_path.read_text(encoding="utf-8"))
    existing = json.loads(feed_path.read_text(encoding="utf-8")) if feed_path.exists() else {"updatedAt": None, "items": []}
    curated = json.loads(curated_path.read_text(encoding="utf-8"))
    result = collect(config, existing, curated, started, get=get, lookback_days=lookback_days, max_results=max_results, progress=progress)
    result["lastRun"]["completedAt"] = iso(now or datetime.now(timezone.utc))
    # updatedAt is the start of the successful request window, so a paper added
    # while this run is in progress remains within the next overlap.
    if not dry_run:
        atomic_write(feed_path, result)
    return result


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--config", type=Path, default=ROOT / "content/arxiv-config.json")
    parser.add_argument("--feed", type=Path, default=ROOT / "content/arxiv-feed.json")
    parser.add_argument("--curated", type=Path, default=ROOT / "content/papers.json")
    parser.add_argument("--dry-run", action="store_true", help="Fetch and validate, but never write the feed")
    parser.add_argument("--now", help="Fixed timezone-aware ISO timestamp for reproducible fixtures/replays")
    parser.add_argument("--lookback-days", type=int, help="Overlap after checkpoint (1–90 days); first run uses this as its initial window")
    parser.add_argument("--max-results", type=int, help="Hard request cap (1–5000); an incomplete window fails without writing")
    args = parser.parse_args(argv)
    try:
        result = run(args.config, args.feed, args.curated, dry_run=args.dry_run, now=timestamp(args.now) if args.now else None, lookback_days=args.lookback_days, max_results=args.max_results, progress=lambda message: print(message, file=sys.stderr, flush=True))
    except (CollectionError, OSError, ValueError, KeyError, TypeError) as exc:
        print(f"arXiv collection failed: {exc}", file=sys.stderr)
        return 1
    print(json.dumps({"dryRun": args.dry_run, "status": result["status"], "items": len(result["items"]), **result["lastRun"]}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
