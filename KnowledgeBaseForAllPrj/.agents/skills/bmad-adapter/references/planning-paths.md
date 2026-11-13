# Planning paths

## Direct bypass

Use for an obvious, local, low-risk edit whose scope and acceptance are already clear and independently verifiable. Route directly to the relevant specialist skill; do not instantiate a BMAD workflow or create change, epic, story, readiness, or retrospective artifacts. Escalate to quick as soon as the task needs a material decision, approval, rollback plan, cross-component coordination, or a formal acceptance contract.

## Quick path

Use when one material, clear outcome can be implemented and verified in one session with limited architectural reach, but needs an explicit change contract and readiness decision.

```text
context check -> scoped change contract -> readiness -> build
              -> code/doc review in parallel -> final verification
```

Minimum artifacts: approved intent/change, observable acceptance, affected scope, test evidence. Skip PRD, epic, and story files unless they add a real coordination contract.

## Epic path

Use for one coherent outcome requiring several bounded build sessions.

```text
analysis/context -> epic spec -> architecture + verification design
                 -> ordered story slicing -> readiness gate
                 -> build/review each story -> integration verification
                 -> retrospective
```

Every requirement maps to one or more stories; every story links to its parent requirement, dependencies, acceptance, write scope, and verification. Early foundational or risky stories receive attended implementation before repetitive work is automated.

## Project path

Use for multiple epics, shared product/UX/architecture decisions, several teams or agents, high-risk systems, or roughly many implementation sessions.

```text
independent discovery tracks -> product intent/PRD
  -> UX + architecture + security/test strategies
  -> epic map and owners -> per-epic specs/stories/readiness
  -> parallel epic streams only at stable boundaries
  -> cross-epic integration -> project verification/retrospective
```

Each epic retains one owner and follows the epic path. Shared product and architecture artifacts constrain all epics. Cross-epic changes update parent decisions first, then identify stale child artifacts; completed history remains visible.

## Path escalation and de-escalation

Escalate when implementation reveals missing intent, several sessions, cross-system effects, migration/security risk, or coordination that a smaller path cannot hold. De-escalate when analysis shows the work is local and independently verifiable. Record the reason; do not preserve unnecessary artifacts after a path changes.

## Readiness verdict

- `PASS`: implementation can proceed without inventing material decisions.
- `CONCERNS`: bounded gaps have owners and a safe resolution path; implementation may proceed only where unaffected.
- `FAIL`: a material product, architecture, security, dependency, migration, or verification decision is missing.

The verifier remains read-only. A separate owner/manager updates artifacts or approves implementation.
