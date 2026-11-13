# BMAD-to-KB method map

This adapter preserves BMAD's key invariants while reusing the repository's established skills and source-of-truth model.

| BMAD capability | Local owner | Canonical output |
|---|---|---|
| Hub and path guidance | `$bmad-adapter` | direct bypass or selected path and next action |
| Idea/evidence analysis | `$study` | cited study note or candidate brief |
| Project context | `AGENTS.md` + project overview | verified durable instructions and boundaries |
| Product intent/requirements | `$change-request` | approved change/spec with acceptance criteria |
| UX/architecture spine | project architecture/interface pages + ADRs | shared cross-story decisions |
| Epic/story slicing | `$bmad-adapter` + `$kb-orchestrator` | ordered epic/story artifacts with coverage and dependencies |
| Build | `$gen-code` | bounded implementation plus test evidence |
| Independent code/document review | `$review-code`, `$review-doc` | ranked findings |
| Readiness/final acceptance | `$verify-delivery` | PASS/CONCERNS/FAIL or delivery verdict |
| Retrospective | `$bmad-adapter` | episodic outcomes, lesson candidates, follow-ups |
| Knowledge promotion | `$kb-curator` | reviewed canonical page or explicit rejection |

## Preserved principles

- Start where uncertainty begins; skip analysis documents when intent is already sufficient.
- Scale rigor with ambiguity, risk, architectural reach, and coordination—not with a fixed ceremony.
- Make decisions explicit before dependent implementation begins.
- Keep durable, versioned artifacts close to the repository.
- Implement in bounded units and verify the integrated outcome against parent intent.
- Humans/owners retain product, risk, and approval decisions.

## Deliberate differences

- This repository does not copy BMAD personas, menus, `_bmad/` runtime, modules, or installer.
- Existing project knowledge schema, skills, workflow manifests, security policy, and evaluation gates remain authoritative.
- BMAD names are used only for compatibility and routing; official BMAD installation must be separately requested and reviewed.

Primary references: [BMAD overview](https://docs.bmad-method.org/), [planning paths](https://docs.bmad-method.org/plan/choose-a-planning-path/), [skills and agents](https://docs.bmad-method.org/reference/skills-and-agents/), and [official repository](https://github.com/bmad-code-org/BMAD-METHOD).
