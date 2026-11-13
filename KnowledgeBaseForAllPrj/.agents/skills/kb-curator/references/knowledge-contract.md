# Canonical knowledge contract

Canonical Markdown uses stable identity independent of path and includes: `id`, `title`, `summary`, `kind`, `scope`, `status`, `owners`, `tags`, `valid_from`, `last_verified`, `review_by`, `confidence`, `sensitivity`, sources, and typed relations.

Use bitemporal reasoning: `valid_from`/`valid_to` describe when a fact applies; `recorded_at` describes when the KB learned it. Supersede old knowledge with an explicit relation rather than overwriting history.

Sources need a stable source ID, canonical URI or repository locator, authority tier, version/effective date, and content hash when material is copied. Generated summaries, graph edges, embeddings, and indexes are derived and rebuildable.

Promotion requires an owner, adequate provenance, conflict resolution, sensitivity classification, and successful validation. Session traces and unreviewed conclusions remain episodic or in the promotion queue.
