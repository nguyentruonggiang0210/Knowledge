---
name: verify-delivery
description: Independently verify a completed change against acceptance criteria, repository rules, and recorded evidence. Use as a delivery gate for material or risky work; do not repair the change in the same pass.
---

# Verify Delivery

Remain independent and read-only. Verification is not implementation.

1. Read the approved contract, diff or artifacts, acceptance criteria, and claimed evidence.
2. Map every criterion to an observable check. Run deterministic checks before model-based judgment.
3. Inspect negative paths, compatibility, security boundaries, documentation impact, and whether the evidence came from the final integrated state.
4. Classify each criterion as `pass`, `fail`, `blocked`, or `not-tested`; never convert missing evidence into a pass.
5. Return a release decision: `accept`, `accept-with-known-risk`, or `reject`, with exact remediation and rerun scope.

Read [references/verification-rubric.md](references/verification-rubric.md) for evidence quality and decision rules.
