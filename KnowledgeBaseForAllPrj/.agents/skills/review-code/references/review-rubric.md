# Code review rubric

Order lenses by risk: correctness and data loss; authorization, secrets, and injection; concurrency and state; compatibility and migrations; error handling and observability; performance; tests; maintainability.

Each finding must include:

```text
[severity] concise title
Location: file:line or symbol
Condition: inputs/state required to trigger it
Impact: concrete user or system consequence
Evidence: code path, contract, or reproducible check
Remediation: smallest credible correction
```

Severity: `critical` for broad irreversible compromise or data loss; `high` for likely major failure/security breach; `medium` for bounded functional regression; `low` for minor but real defect. Do not report preference-only comments as defects.
