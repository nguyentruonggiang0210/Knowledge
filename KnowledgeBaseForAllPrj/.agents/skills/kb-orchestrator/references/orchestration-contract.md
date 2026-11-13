# Orchestration contract

Use a task contract with: `id`, `objective`, `depends_on`, frozen `inputs`, `read_set`, `write_set`, external `resources`, `side_effects`, `idempotency_key`, `exclusive_locks`, `output`, `acceptance`, `risk`, `approval`, `budget`, and `retry`.

Schedule nodes topologically in waves. Two ready nodes may share a wave only if their write sets do not intersect, neither mutates the same non-idempotent external resource, and neither consumes the other's output. Read-only work can normally overlap. Merge, migration, approval, integration, repair-after-review, and final verification are sequential gates.

Use the lifecycle `pending -> ready -> running -> produced -> verified -> accepted`, with terminal alternatives `failed`, `blocked`, and `superseded`. The manager owns transitions.

For repeated work, declare a machine-readable `fanout` that names the source inventory, dependency field, bounded concurrency, per-instance write scope, completion rule, and subworkflow. A downstream `join` must depend on that fanout, reject incomplete instances unless explicitly allowed, and run integration before system-level verification. Human high-risk gates declare the required approval authorities; a generic `approval: human` is not sufficient.

Before dispatching a fan-out, run `python scripts/kb.py compile-fanout --workflow <workflow-id> --node <fanout-node> --inventory <inventory.json>`. Dispatch only the emitted waves; each instance carries its parameters, disjoint write scope, subworkflow and completion contract. A failed inventory compile is a planning failure, not permission to fall back to prose scheduling.

For each agent request, include:

- one bounded question or outcome;
- exact source and write boundaries;
- required result structure and evidence;
- explicit exclusions;
- a stop condition.

Before retry, inspect artifacts and external state. Retry transient unfinished work only, up to the declared limit. Never repeat a successful side effect merely because the response was lost.

Stop when acceptance is met, a required approval is missing, the budget is exhausted, or no meaningful progress is possible. Preserve partial evidence and clearly identify unfinished nodes.
