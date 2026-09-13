# RSI operational taxonomy

This is an editorial working standard informed by the cited primary literature, not a universal consensus or a claim of unbounded capability growth.

Within an explicit System Boundary, Recursive Self-Improvement involves persistent updates to components that participate again in producing, evaluating, selecting or integrating subsequent improvements. Generation of later learning experience is included as a functional feedback path. Record three different questions:

1. Does an update persist beyond the current answer?
2. Does the updated component actually re-enter an improvement role?
3. Does it produce better successors under controlled conditions?

Recursive Reuse answers question 2, not question 3. Model-generated training data can establish a structural feedback path while the training algorithm stays fixed. Mark that boundary explicitly. Solver gain, judge gain and controlled successor gain are separate evidence categories. Recursion can also amplify errors; a demonstrated feedback path does not imply positive gain.

## Independent axes

- Evolution Target: Model Evolution, Prompt & Context Evolution, Memory Evolution, Tool & Skill Evolution, Architecture Evolution. Targets may overlap. Use an empty list when a setting changes only an external task artifact or has no persistent system update.
- Paper Type: Method, Survey, Theory, Benchmark, Empirical Analysis. A Survey's topics describe coverage, not performed updates. A Benchmark protocol does not inherit the capabilities of an evaluated agent.
- Loop Role: Solver, Experience Generator, Evaluator, Proposer, Selector, Integrator. Record the function of the component actually updated, not every fixed component used in the loop. A component can have multiple roles.
- Persistence: Ephemeral, Across Attempts, Across Tasks, Across Improvement Rounds, Across Training Updates, Not Applicable. These distinguish experimental settings, not levels of intelligence.
- Recursive Reuse: Demonstrated, Not Demonstrated, Unclear, Not Applicable. Require a traced update/reuse path; repeated iterations or the word “self” in a title are insufficient.
- Evidence: Task Gain, Held-out Transfer, Recursive Reuse, Improver Quality Gain, Controlled Successor Gain, Negative Result, Theoretical Guarantee, Benchmark Measurement, Conceptual Synthesis, Feasibility Demonstration. These are evidence types, not an ordinal ladder.

Controlled Successor Gain requires a comparison of updated versus baseline improvement mechanisms with the same starting target, candidate budget and evaluator, or an equally discriminating control. Report the actual controls and any remaining confounds. A formal theorem applies only within its stated assumptions.

## Unit of classification

The unit is an Experiment / Variant, not an entire title. Record targets, roles, persistence, reuse, evidence, System Boundary, Feedback, Evidence Scope, rationale and fixed-version source for every variant. Separate TextGrad instance optimization from reusable prompt optimization, RISE training from deployment, and ablations that remove the recursive component. Filters combining these axes must match the same variant. Never combine one variant's persistence with another variant's evidence.

Five topic counts can overlap and need not sum to All Papers. Keep enabling methods and boundary papers available through All Papers even without a persistent target. Preserve legacy category URLs only for compatibility; do not present the previous mixed categories as the current standard.

## Discovery versus review

The collector may suggest overlapping topics and a title-supported Paper Type; use Unclassified when evidence is insufficient. This is Provisional Classification. It must not assign roles, persistent update, Recursive Reuse or gain based on keywords. Read the original setting before promoting a paper.

Primary perspectives: https://arxiv.org/abs/2507.21046v4, https://arxiv.org/abs/2607.13104v1, https://arxiv.org/abs/2603.19461v1, https://arxiv.org/abs/2609.11873v1.
