# Daily arXiv discovery

RSI Paper keeps curated metadata in `content/papers.json`, reviewed variant classifications in `content/taxonomy.json`, twelve-part analyses in `content/deep-notes.json` and automatically discovered metadata in `content/arxiv-feed.json`. The feed contains original titles, abstracts, versioned arXiv links, and provisional research topics. It never invents paper analysis or labels a title match as evidence of recursive capability.

Run from the repository root:

```sh
python3 scripts/test_collect_arxiv.py
python3 scripts/collect_arxiv.py --dry-run
python3 scripts/collect_arxiv.py
npm run build:pages
```

The collector uses the public arXiv Atom API and needs no API key. `content/arxiv-config.json` controls the search terms, AI/ML categories, and rate limits. It scans by last-updated time, including revisions of older papers: the first successful run covers 30 days; later runs overlap the previous successful checkpoint by 10 days. Longer outages therefore remain covered. It deduplicates version-independent arXiv IDs, preserves the discovery backlog, and removes items that have received curated notes. Only a complete successful scan atomically replaces the feed. HTTP errors, malformed responses, and incomplete scans do not advance the checkpoint.

The scheduled task in the current Codex conversation runs daily at 09:00 Asia/Singapore. The computer must be powered on, the app running, this checkout available, and Git push authentication valid. The schedule is managed in the app, not by the static website or a browser timer. Avoid starting a manual collection while the scheduled task is running.

Each scheduled run synchronizes the clean checkout, runs the collector, checks the result, builds the static site, and commits/pushes the relevant content and generated `docs/` output. Unrelated local changes must not be discarded, staged, or published. A network or deployment failure is reported; unchanged runs remain quiet. The website shows the last successful collection time, not a claim that every relevant paper has been found.

## From discovery to a research note

Read `PAPER_READING_GUIDE.md` and `TAXONOMY.md` before promotion. Review the original fixed-version paper and add consistent records to all three curated files. Every curated paper requires all twelve analysis sections and the four information kinds: Paper Claim, Prior Work, Inference, Hypothesis. Research current related work for Follow-up, preserve its provisional novelty status, and never present a reconstructed thought process as the authors' actual motivation.

The collector suggests overlapping Evolution Targets and a separate Paper Type when supported by the title. Unknown items remain Unclassified. These provisional tags do not assign an RSI relation, persistent update, Loop Role or evidence of recursive capability. Full-text review assigns variants separately. After promotion rerun collection to remove curated IDs from the discovery feed; the UI also hides IDs already curated.

Run `npm run check:papers`, `npm run test:arxiv`, `npx tsc --noEmit` and `npm run build:pages`. Verify new pages, citations and filters before normal commit/push. A run with no new verified analysis may publish only genuine feed metadata; incomplete analyses remain Awaiting Analysis.

API documentation: https://info.arxiv.org/help/api/user-manual.html
API terms: https://info.arxiv.org/help/api/tou.html
