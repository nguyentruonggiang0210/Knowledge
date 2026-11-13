---
id: <project>.change.epic-<slug>
title: Epic <epic-id> <outcome>
summary: <One coherent outcome delivered through several bounded build sessions>
kind: change
scope: <project>
status: proposed
owners: [<epic-owner>]
tags: [bmad, epic]
valid_from: <YYYY-MM-DD>
valid_to: null
recorded_at: <YYYY-MM-DD>
last_verified: <YYYY-MM-DD>
review_by: <YYYY-MM-DD>
confidence: medium
sensitivity: internal
sources: [<source-id>]
relations: [implements:<project>.requirements.<requirement-set>]
---

# Epic <epic-id>: <outcome>

## Outcome, boundaries and non-goals

## Parent requirement coverage

| Requirement ID | Story IDs | Verification |
|---|---|---|
| <req-id> | <story-id> | <integrated check> |

## Shared decisions and context

Link architecture, interfaces, ADRs, research and policies that every story must preserve.

## Dependencies and ordered story inventory

The machine-readable execution inventory is `delivery/<epic-id>/story-inventory.json`, created from `story-inventory.template.json`. This page may summarize it for humans, but the JSON inventory is authoritative for fan-out, dependencies, and write-scope conflict checks.

## Integrated done-when

## Risk, rollout, rollback and approvals

## Readiness and retrospective

- Readiness review:
- Approval:
- Integrated verification:
- Retrospective:
