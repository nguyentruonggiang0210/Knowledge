---
name: review-code
description: Review a code change for concrete defects, regressions, security risks, and missing tests. Use for review requests or as an independent gate after implementation; do not modify code unless separately asked.
---

# Review Code

Review from the diff outward to the affected contracts and call sites. Remain read-only unless the user separately asks for fixes.

1. Establish the intended behavior, changed files, applicable repository rules, and verification evidence.
2. Trace behavior through callers, state transitions, error paths, authorization boundaries, data migrations, and tests.
3. For a sufficiently large change, parallelize independent read-only lenses such as correctness, security, compatibility, and test adequacy. Deduplicate centrally.
4. Report only actionable findings supported by evidence. Rank by user impact and likelihood, not stylistic preference.
5. If no defect is found, say so and list residual risk or untested paths.

Use the finding contract and severity model in [references/review-rubric.md](references/review-rubric.md).
