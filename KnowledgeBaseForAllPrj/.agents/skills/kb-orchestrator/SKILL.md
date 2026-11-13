---
name: kb-orchestrator
description: Coordinate a complex repository task as a dependency-aware multi-agent workflow. Use when work has multiple independent investigations, components, or review tracks; skip for a small single-stream task.
---

# KB Orchestrator

Keep ownership of scope, integration, approvals, and the final answer. Use specialists as bounded capabilities; hand off conversation ownership only when the user asks for it.

1. Read the applicable `AGENTS.md`, project profile, relevant KB pages, and `orchestration/policy.json`.
2. Define the outcome, non-goals, acceptance evidence, risk, budget, and unknowns.
3. Build the smallest useful task DAG. Give every delegated node a narrow objective, frozen inputs, `read_set`, `write_set`, output contract, and acceptance checks.
4. Run ready nodes in parallel only when they have no dependency path, overlapping writes, mutable shared side effect, or approval dependency. Keep short or dependent work local and sequential.
5. Validate each result before unlocking downstream nodes. Reconcile side effects before retrying; retry only unfinished transient failures within the declared limit.
6. Integrate centrally, then use an independent verifier for material or high-risk deliveries.
7. Finish with achieved outcome, changed artifacts, verification evidence, unresolved risks, and follow-ups.

When orchestration is non-trivial, read [references/orchestration-contract.md](references/orchestration-contract.md). Do not create agents merely to satisfy a count, and never let parallel agents edit the same file in a shared workspace.
