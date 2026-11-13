# Tooling

Suggested CI checks:

1. Parse every non-reserved `.md` file.
2. Require YAML frontmatter and non-empty `type`.
3. Check reserved `index.md` / `log.md`.
4. Detect broken relative Markdown links.
5. Detect duplicate concepts by title or canonical resource.
6. Detect missing provenance on source-backed pages.
7. Detect stale pages according to project policy.
8. Scan for secrets before commit.

The project can later add a custom validator without changing the OKF corpus.
