---
name: bmad-adapter
description: Route BMAD-style product and software delivery through this repository's existing skills and canonical artifacts. Use when the user asks for BMAD/BMad, planning-path selection, epic or story slicing, implementation readiness, or an evidence-backed retrospective; this is not the official BMAD runtime.
---

# BMAD Adapter

Apply BMAD's right-sized, evidence-carrying delivery method without duplicating the official BMAD agent suite.

1. Read the applicable `AGENTS.md`, project overview, current change/spec, and [references/method-map.md](references/method-map.md).
2. Classify the smallest safe path or bypass:
   - **direct:** an obvious, low-risk, independently verifiable edit; route straight to the relevant specialist (normally `$gen-code`) without a BMAD workflow or new delivery artifact;
   - **quick:** one material, well-defined outcome that fits one implementation session but benefits from an explicit change contract and readiness check;
   - **epic:** one coherent outcome requiring several ordered implementation sessions;
   - **project:** multiple epics, shared product/architecture decisions, teams, or high coordination risk.
3. State the chosen path, why smaller paths are insufficient, required artifacts, owner/approval gates, and exit criteria. Do not create documents merely to imitate ceremony.
4. Route analysis to `$study`, scope and acceptance to `$change-request`, implementation to `$gen-code`, review to `$review-code`/`$review-doc`, and final evidence to `$verify-delivery`. Use `$kb-orchestrator` for independent workstreams.
5. Before implementation on quick, epic, or project paths, run a readiness gate: intent, boundaries, acceptance, dependencies, architecture/security constraints, test evidence, ownership, and rollback must be sufficient for the chosen risk. For direct work, use the target skill's normal scope and verification checks.
6. Build one bounded story/change at a time. Parallel stories require explicit boundaries, disjoint writes, stable contracts, and an integration owner.
7. Close an epic/project with integrated verification and a retrospective. Proposed lessons remain episodic or enter the promotion queue through `$kb-curator`; never auto-promote them.

Read [references/planning-paths.md](references/planning-paths.md) when selecting or executing a path. Read [references/artifact-contracts.md](references/artifact-contracts.md) only when creating, validating, or slicing delivery artifacts.

This adapter is BMAD-compatible repository guidance, not an installation or endorsement of the official BMAD Method. If the user requests the official runtime/plugin, treat that as a separate installation task.
