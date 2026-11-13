---
id: kb.runbook.maintenance
title: Knowledge maintenance runbook
summary: Quy trình ingest, freshness audit, conflict resolution, promotion và index rebuild.
kind: runbook
scope: shared
status: approved
owners: [kb-maintainers]
tags: [maintenance, freshness, promotion]
valid_from: 2026-11-12
valid_to: null
recorded_at: 2026-11-12
last_verified: 2026-11-12
review_by: 2027-02-12
confidence: high
sensitivity: internal
sources: [w3c-prov, openai-skill-guidance]
relations: [implements:kb.standard.knowledge-contract, implements:kb.standard.security]
---

# Knowledge maintenance runbook

## Ingest hoặc update

1. Xác định owner, scope, authority, sensitivity, valid time và canonical URI.
2. Tính/so sánh content hash khi có local source; tìm stable ID, duplicate và supersession.
3. Quarantine input không tin cậy; tách source material khỏi synthesis.
4. Viết candidate page hoặc promotion record; thêm typed relations và provenance.
5. Resolve conflict với owner. Không overwrite history.
6. Chạy `python scripts/kb.py validate` và relevant evals.
7. Promote sau review, rồi chạy `python scripts/kb.py build-index`.

## Freshness audit

Theo dõi `review_by`, owner bị thiếu, source URL/version thay đổi, page không còn được link, conflict chưa đóng và page approved nhưng source bị deprecated. Page quá SLA không tự thành false; đánh dấu stale, giảm confidence và route tới owner.

## Rollback

Canonical content rollback bằng version control hoặc supersession record. Derived index rollback bằng rebuild từ canonical version đã chọn. Không rollback bằng cách sửa trực tiếp catalog/index generated.
