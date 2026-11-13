# Threat model

## Assets

Canonical knowledge, source provenance, project boundaries, secrets, sensitive documents, agent tools, external side effects, eval integrity and audit records.

## Trust boundaries

- User request and authorization boundary.
- Repository instructions and installed skill boundary.
- Retrieved/imported content boundary.
- Project/tenant/ACL boundary.
- Agent-to-agent handoff boundary.
- Tool/MCP/network boundary.
- Canonical knowledge promotion boundary.

## Threats

Direct/indirect prompt injection; poisoned source or embedding; hidden content; cross-project leakage; malicious citation; source spoofing; stale/superseded facts; exfiltration through tools/URLs; over-privileged specialist; parallel write corruption; duplicated side effects; judge manipulation; eval-set contamination; memory poisoning.

## Required mitigations

Pre-retrieval access filters, source trust and quarantine, structured output validation, least privilege, approval near sensitive tools, idempotency/reconciliation, provenance and content hashes, sensitivity inheritance, independent verification, red-team datasets, sealed holdout, canary and rollback.

## Residual risk

No prompt or guardrail fully removes injection or model error. High-impact actions require external policy enforcement and human approval. Model self-critique is a signal, not proof.
