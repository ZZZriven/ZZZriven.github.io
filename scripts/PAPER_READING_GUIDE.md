# Research note standard

RSI Paper uses English paper titles and technical terminology with clear Chinese explanatory prose. Follow this guide when adding or revising any curated paper. Read the fixed arXiv version, relevant methods, experimental setup and limitations; inspect equations or figures directly when text extraction is ambiguous. Record exactly what was checked. Never imply independent replication from reading.

## Twelve required sections

Each ID below is required in `content/deep-notes.json`. Write paper-specific explanations. Length should follow the difficulty, not a filler quota.

1. `problem`: Research Problem & Background. State the precise question, necessary background, why it matters and the value of solving it.
2. `prior-work`: Prior Work & Research Gap. Explain what earlier work already solved, what remains and why previous approaches fail. Cite the original related literature.
3. `idea-reconstruction`: Idea Reconstruction. Start only from knowledge available before this work, empirical observations and failure modes. Rebuild a plausible chain of thought before introducing the proposed method. Label it Inference; do not claim access to the authors' actual thought process or assume the paper's contributions as premises.
4. `intuition`: Core Intuition. Explain the essential mechanism plainly and precisely.
5. `method`: Method & Worked Example. Walk through input, processing and output in a concrete task, including retained state and feedback. Prefer a real case from the paper. Label constructed teaching examples explicitly and distinguish them from reported experiments.
6. `mathematics`: Mathematical Foundations. Define every symbol, explain prerequisites and derive the core equation step by step where relevant. Distinguish a paper's theorem from an intuitive surrogate. If there is no central mathematical derivation, say so and teach the mechanism without inventing one. Never translate a conditional theorem into an unconditional guarantee.
7. `experiments`: Experiments & Claims. Use Research Question → Experiment → Answer. Explain the controls and the scope of each answer. Preserve important dataset splits, budgets and baselines; avoid drowning the reader in scores.
8. `takeaways`: Takeaways. State what the evidence changes about our understanding and what remains unsupported.
9. `assumptions`: Most Fragile Assumption. Identify a specific dependency whose failure would undermine the method; explain why.
10. `reproduction`: One-Week Reproduction. Propose one falsifiable claim, a feasible small setup, a baseline, a schedule and a success/failure criterion. State compute assumptions. A toy reproduction cannot establish the full paper's claim.
11. `counterexample`: Counterexample Design. Construct an intervention that discriminates between the authors' mechanism and an alternative explanation. Stay within the claim's assumptions or explicitly identify a test of generalization outside them.
12. `follow-up`: Follow-up Research. Start from a limitation and an unmet need, search current primary literature, compare the closest work, then propose a valuable question and discriminating experiment. Avoid mere scale increases or generic feature additions. Treat novelty as provisional, never guaranteed. Later literature belongs here, not in historical idea reconstruction.

## Four information kinds

Every paragraph is a block with `kind`, `text`, source `refs` where applicable and optionally a multiline `equation`:

- `paper` / Paper Claim: explicitly stated or reported in the paper. Attach the primary source. Attribute empirical claims to the authors, including relevant conditions.
- `prior` / Prior Work: an existing result or mechanism in related literature. Attach the source that actually establishes it. Date-check historical background.
- `inference` / Inference: evidence-based interpretation, derivation for teaching, causal speculation constrained by observations, or idea reconstruction. Cite the evidence and make the inferential status clear.
- `hypothesis` / Hypothesis: an unexecuted experiment, uncertain conjecture or research proposal. Give a way to disprove it. Do not report proposed results as observations.

Separate blocks when the information kind changes. `references` contains unique local IDs, accurate titles, versioned primary URLs and a precise verification scope. Every supplied block reference must resolve. Original experimental proposals may omit a citation; do not fabricate a source for an unexecuted design. Source links should support the attached claims, not merely share a topic. Label editorial taxonomy as Editorial Assessment. Preserve existing versions until a revision is actually reviewed.

## Prose and review

Use intuition-first teaching, concrete examples and connected paragraphs. Every sentence should add a claim, reason, mechanism, condition or evidence. Avoid generic praise, empty transitions, excessive quotation marks/dashes and the repeated “不是……而是……” construction. Explain technical concepts before relying on them. Do not imitate a living author's distinctive voice.

Before promotion, add consistent records to all three files: `papers.json` (bibliographic metadata and compact legacy summary), `taxonomy.json` (reviewed variants), `deep-notes.json` (all twelve sections and references). Follow `TAXONOMY.md`, run `npm run check:papers`, collector tests, TypeScript checks and the static build. An incomplete or insufficiently verified paper stays in the feed as Awaiting Analysis.
