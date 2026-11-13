# AGENTS.md — Knowledge Maintenance Rules

## Mission

Maintain this repository as a durable, source-backed engineering knowledge graph for both
humans and coding agents.

## Before writing

1. Read `/index.md`.
2. Find the most specific existing concept for the subject.
3. Read that concept before creating or modifying it.
4. Search neighboring concepts and add links where useful.
5. Prefer updating an existing concept over creating duplicates.

## When creating a concept

Required:

```yaml
---
type: <descriptive type>
---
```

Recommended:

```yaml
title: <human-readable title>
description: <one sentence>
tags: [tag1, tag2]
status: active
generated:
  by: <actor>
  at: <ISO-8601 timestamp>
```

For source-backed knowledge, use:

```yaml
sources:
  - id: source-1
    title: <source title>
    uri: <canonical URI>
    retrieved_at: <ISO-8601 timestamp>
```

For claims that require review, use `verified`.

## Writing rules

- One document = one coherent knowledge unit.
- Use stable filenames; renaming changes the concept ID.
- Prefer relative Markdown links between concepts.
- Separate facts, decisions, assumptions and recommendations.
- Never invent an API, configuration value, benchmark, incident detail or requirement.
- Preserve existing content unless evidence supports changing it.
- Keep examples clearly labeled as examples.
- Prefer structured headings over giant prose blocks.
- Put volatile details behind explicit freshness metadata.

## Update rules

When changing a concept:
1. Read the current document.
2. Identify what changed and why.
3. Update provenance if the source changed.
4. Update `generated.at`.
5. Update verification if verification status changed.
6. Update `log.md`.
7. Check inbound/outbound links if the topic was renamed or split.

## Trust

Trust tiers are derived from `verified`:
- no `verified`: unverified
- machine actor: machine-confirmed
- human actor: human-reviewed

Do not upgrade trust merely because an agent is confident.

## Safety

Never store:
- passwords
- API keys
- access tokens
- private credentials
- personal secrets

Use placeholders and reference the secure system instead.

## Validation checklist

- [ ] YAML parses
- [ ] `type` exists
- [ ] reserved `index.md` and `log.md` are structurally valid
- [ ] links point to intended concepts
- [ ] sources are present for externally derived claims
- [ ] stale or obsolete knowledge is marked
- [ ] no secrets are committed
