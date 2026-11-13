# Delivery contract

Before editing, capture:

- outcome and observable acceptance criteria;
- allowed write scope and protected areas;
- compatibility, data, security, and operational constraints;
- test levels and commands;
- documentation and rollout impact.

Delivery evidence should contain changed behavior, changed files, test commands with observed outcomes, skipped checks with reasons, compatibility or migration notes, and residual risks. Evidence must refer to the final integrated state.

Parallel component work requires frozen interfaces, disjoint write scopes, and either isolated worktrees or an explicit integration owner. If those conditions are absent, implement sequentially.
