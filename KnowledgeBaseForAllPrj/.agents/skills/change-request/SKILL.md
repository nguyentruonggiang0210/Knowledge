---
name: change-request
description: Normalize a proposed change and produce an impact-aware, approval-ready delivery plan. Use before implementation when scope, dependencies, migration, risk, or acceptance criteria need analysis.
---

# Change Request

1. Convert the request into current state, desired outcome, motivation, non-goals, constraints, and observable acceptance criteria.
2. Inspect affected architecture, requirements, interfaces, decisions, operations, and prior changes.
3. Run impact, dependency, security/operational risk, and test/documentation analysis in parallel only when they are independent and read-only.
4. Reconcile conflicts into one proposal with affected artifacts, compatibility and migration strategy, rollout/rollback, verification, estimates or unknowns, and explicit approval gates.
5. Do not implement during a planning-only request. After approval, invoke `$gen-code` with the frozen contract and finish with `$verify-delivery` where appropriate.

Use [references/change-contract.md](references/change-contract.md) for the plan template and risk classification.
