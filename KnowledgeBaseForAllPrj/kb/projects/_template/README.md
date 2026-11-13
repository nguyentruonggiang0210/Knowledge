# Project pack template

Copy this directory to `kb/projects/<project-id>/`, replace every `<...>` placeholder, register its sources, and run validation. Keep page IDs stable even when files move.

The minimum useful pack is `overview.md` plus the artifacts that already exist for the project. Do not create empty enterprise process merely to fill every template.

For explicit BMAD-compatible delivery, `delivery/` provides epic, story, and readiness contracts. Retrospectives start from `kb/memory/episodic/retrospective-template.md`; promote only reviewed, reusable claims through `$kb-curator`. `design/experience-template.md` is optional and belongs only in work where multiple delivery units need shared UX decisions.

Materialize `delivery/epic-map.template.json` as `delivery/epic-map.json` for a project and `delivery/story-inventory.template.json` as `delivery/<epic-id>/story-inventory.json` for each epic. The JSON inventories—not Markdown tables—drive dependency scheduling and cross-instance write conflict checks.
