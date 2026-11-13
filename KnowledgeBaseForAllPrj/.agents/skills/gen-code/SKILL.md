---
name: gen-code
description: Implement an approved code change with focused tests and delivery evidence. Use when the requested behavior and write scope are clear enough to modify code; do not use for review-only or planning-only requests.
---

# Generate Code

1. Read repository instructions, the project profile, affected contracts, and the approved request or plan.
2. Restate observable behavior, non-goals, write scope, compatibility constraints, and verification commands. Resolve only ambiguities that materially change the result.
3. Inspect the live implementation and tests before editing. Prefer the smallest coherent change.
4. Split implementation across agents only for disjoint components with frozen interfaces and isolated write scopes. Integrate sequentially.
5. Add or update tests at the closest useful level. Preserve unrelated user changes and avoid speculative refactors.
6. Run targeted checks first, then the applicable broader suite. Record failures and skipped checks honestly.
7. For material changes, route the result to `$review-code`; use `$review-doc` when behavior, interfaces, or operations changed; finish with `$verify-delivery` when risk warrants independent verification.

Read [references/delivery-contract.md](references/delivery-contract.md) for the implementation evidence format.
