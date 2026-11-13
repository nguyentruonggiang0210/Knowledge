# Delivery artifact contracts

Create only artifacts required by the selected path. All canonical pages use the repository knowledge contract and stable IDs.

## Initiative or product brief

Problem/opportunity, target users, desired outcomes, evidence, non-goals, constraints, success measures, risks, open decisions, owner, and next decision.

## PRD or shared product contract

Product outcomes, actors/journeys, functional and non-functional requirements with stable IDs, policy/data constraints, success metrics, scope/non-goals, dependencies, rollout, owner approvals, and links to source evidence. Use when multiple people or epics must share product decisions.

## Architecture spine

System boundary, trust boundaries, component responsibilities, shared interfaces/data contracts, cross-cutting quality attributes, deployment/operations, compatibility/migration, decisions/ADRs, and constraints every story must preserve.

## Epic

One coherent outcome, parent requirements, boundaries, dependencies, shared decisions, integrated done-when checks, owner, risk, and retrospective status. Materialize its executable story list from `kb/projects/_template/delivery/story-inventory.template.json`; the JSON dependency and write-scope fields are authoritative for fan-out.

## Story

Parent epic/requirements, bounded outcome, context links, explicit non-goals, dependencies, read/write scope, Given/When/Then acceptance where useful, test/observability evidence, risk/approval, and status. A story must fit one implementation session or be split again.

For project path, materialize `kb/projects/_template/delivery/epic-map.template.json`. Validate and compile either inventory with `python scripts/kb.py compile-fanout`; Markdown summaries do not drive execution.

## Readiness review

Artifact versions reviewed, requirement/story coverage, unresolved decisions, dependency and ownership checks, architecture/security/operations/test coverage, verdict `PASS|CONCERNS|FAIL`, evidence, approver, and allowed next action.

## Retrospective

Start from `kb/memory/episodic/retrospective-template.md`. Record parent intent and artifact versions, completed/unfinished units, integrated acceptance evidence, review findings and resolution, deviations, operational outcomes, lessons with confidence, follow-up ownership, promotion candidates, and verdict. This is episodic evidence, not a canonical project lesson; no unfinished story is silently counted as complete, and promotion requires `$kb-curator`.
