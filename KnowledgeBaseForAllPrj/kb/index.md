---
id: kb.catalog.home
title: Knowledge base home
summary: Điểm vào và bản đồ nguồn tri thức canonical của KB.
kind: catalog
scope: shared
status: approved
owners: [kb-maintainers]
tags: [catalog, navigation]
valid_from: 2026-11-12
valid_to: null
recorded_at: 2026-11-12
last_verified: 2026-11-12
review_by: 2027-02-12
confidence: high
sensitivity: internal
sources: [openai-skills, w3c-prov]
relations: []
---

# Knowledge base home

## Bắt đầu theo intent

- Hiểu cấu trúc và loại tri thức: [Taxonomy](catalog/taxonomy.md).
- Thêm hoặc cập nhật tri thức: [Knowledge contract](shared/standards/knowledge-contract.md).
- Thiết kế truy hồi: [Retrieval architecture](shared/patterns/retrieval.md).
- Thiết kế graph/provenance/deletion: [Knowledge graph and provenance](shared/patterns/knowledge-graph-and-provenance.md).
- Điều phối nhiều agent: [Agent orchestration](shared/patterns/agent-orchestration.md).
- Kết nối MCP/A2A và runtime bền vững: [Interoperable agent runtime](shared/patterns/interoperable-agent-runtime.md).
- Chạy delivery theo BMAD với process vừa đủ: [BMAD-compatible delivery](shared/patterns/bmad-delivery.md).
- Đánh giá thay đổi: [Evaluation standard](shared/standards/evaluation.md).
- Xử lý nguồn hoặc nội dung không tin cậy: [Security standard](shared/standards/security.md).
- Enforce policy và structured output: [Policy enforcement](shared/standards/policy-enforcement.md).
- Dọn stale/conflict và promote knowledge: [Maintenance runbook](shared/runbooks/maintenance.md).

## Source of truth

Canonical knowledge là Markdown đã được review trong `kb/shared/` và `kb/projects/<id>/`. Registry nguồn nằm tại `kb/sources/registry.json`. `kb/indexes/` và output trong `.kb/runs/` là derived artifacts, không được dùng làm nguồn duy nhất.

Khi có mâu thuẫn, ưu tiên trang `approved` đúng project và còn hiệu lực; sau đó mới đến shared knowledge. Không tự chọn giữa hai nguồn authoritative đang mâu thuẫn: nêu rõ conflict và route tới owner.
