# Daily arXiv discovery

RSI Paper keeps curated notes in `content/papers.json` and automatically discovered metadata in `content/arxiv-feed.json`. The feed contains original titles, abstracts, versioned arXiv links, and provisional research topics. It never invents paper analysis or labels a title match as evidence of recursive capability.

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

Review the original paper before promoting a feed item into `content/papers.json`. Preserve the English original title and technical terminology, using `content/terminology.json` as the canonical glossary; retain Chinese explanatory prose. Supply Research Problem, Insight, Observation, Method, Results, Limitations, Relation to RSI, and Outlook, with precise sources and the actual verification scope. Separate editorial interpretation from paper observations. Pin the reviewed arXiv version and date; do not silently update an existing note to a revision that has not been reviewed.

Choose the primary research topic independently of the RSI relation. Automatic feed classifications are provisional and do not assign an RSI relation. After promotion, rerun the collector so the item is removed from the discovery feed; the UI also hides any ID already present in the curated collection.

API documentation: https://info.arxiv.org/help/api/user-manual.html
API terms: https://info.arxiv.org/help/api/tou.html
