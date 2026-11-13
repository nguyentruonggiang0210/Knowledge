# Verification rubric

Evidence strength, strongest first: deterministic automated check on final state; reproducible manual observation; static inspection tied to a contract; model judgment with cited evidence; unverified claim.

Use model judgment only where deterministic checks cannot express the criterion. For a model judge, use a fixed rubric, require evidence, record model/prompt version, and send low-confidence or disputed cases to human review.

`accept` requires every blocking criterion to pass. `accept-with-known-risk` requires all blocking criteria to pass and explicit ownership of non-blocking risk. `reject` applies to any failed blocking criterion, unbounded critical risk, or evidence from a stale pre-integration state.
