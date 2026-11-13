---
id: kb.standard.knowledge-contract
title: Canonical knowledge contract
summary: Metadata, provenance, temporal và relation contract cho mọi trang canonical.
kind: standard
scope: shared
status: approved
owners: [kb-maintainers]
tags: [schema, provenance, temporal]
valid_from: 2026-11-12
valid_to: null
recorded_at: 2026-11-12
last_verified: 2026-11-13
review_by: 2027-02-12
confidence: high
sensitivity: internal
sources: [w3c-prov]
relations: [defined-by:kb.catalog.taxonomy, extended-by:kb.pattern.knowledge-graph-and-provenance]
---

# Canonical knowledge contract

Mọi page canonical có frontmatter với các field trong `kb/schemas/knowledge.schema.json`. ID là lowercase dotted identifier, ổn định qua rename/move. `summary` phải đủ nghĩa để router quyết định có đọc page hay không.

`valid_from`/`valid_to` biểu diễn thời gian fact/contract có hiệu lực. `recorded_at` biểu diễn thời điểm KB ghi nhận. `last_verified` là lần evidence được kiểm lại; `review_by` là SLA freshness, không phải thời điểm nội dung tự động trở thành sai.

Mọi nguồn trong `sources` phải tồn tại trong registry. Claim quan trọng nên có inline locator hoặc evidence table nếu toàn-page source list chưa đủ chính xác.

Sensitivity: `public`, `internal`, `confidential`, `restricted`. Derivative không được hạ sensitivity. Status: `draft`, `proposed`, `approved`, `deprecated`, `superseded`.

Page mới phải link từ catalog hoặc một page liên quan; orphan page làm giảm khả năng discovery. Page superseded phải giữ lịch sử và relation tới replacement.

Supersession không phải deletion. Legal/privacy/security erasure dùng authorized tombstone và phải propagate tới mọi derived chunk, vector, graph, summary, cache, checkpoint và fixture theo retention policy. Tombstone chỉ giữ ID/hash và audit metadata tối thiểu, không giữ nội dung đã yêu cầu xóa. Contract chi tiết nằm tại `kb.pattern.knowledge-graph-and-provenance`.
