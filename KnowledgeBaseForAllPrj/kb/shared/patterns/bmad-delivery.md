---
id: kb.pattern.bmad-delivery
title: BMAD-compatible evidence-driven delivery
summary: Áp dụng planning path, bounded build, readiness và retrospective của BMAD bằng các skill và knowledge contract hiện có.
kind: pattern
scope: shared
status: approved
owners: [kb-maintainers]
tags: [bmad, agile-ai-development, delivery, epics, stories]
valid_from: 2026-11-12
valid_to: null
recorded_at: 2026-11-12
last_verified: 2026-11-12
review_by: 2027-01-12
confidence: high
sensitivity: internal
sources: [bmad-docs, bmad-planning-paths, bmad-install-guide, bmad-github]
relations: [depends-on:kb.pattern.agent-orchestration, constrained-by:kb.standard.knowledge-contract, validated-by:kb.standard.evaluation]
---

# BMAD-compatible evidence-driven delivery

BMAD được áp dụng như một delivery pattern, không phải bản sao runtime/persona chính thức. `$bmad-adapter` chọn process nhỏ nhất đủ an toàn rồi route sang các skill hiện có. Canonical KB, workflow policy, security và evaluation của repository vẫn là source of truth.

Theo tài liệu BMAD chính thức, intent rõ và nhỏ có thể đi thẳng vào Build; một epic cần nhiều build sessions và story breakdown; project nhiều epic cần shared product/architecture decisions, per-epic delivery và integrated verification. Quy mô process tăng theo ambiguity, risk, architectural reach và coordination—not theo một checklist cố định.

## Direct bypass và ba planning path

| Path | Dùng khi | Artifact tối thiểu | Gate |
|---|---|---|---|
| Direct bypass | Sửa đổi hiển nhiên, cục bộ, ít rủi ro, đã rõ acceptance | Không tạo artifact BMAD mới | routing thẳng đến skill chuyên môn → kiểm chứng theo skill |
| Quick | Một outcome quan trọng nhưng rõ, một implementation session | change/spec + acceptance | readiness → human approval → final verification |
| Epic | Một outcome cần nhiều ordered sessions | epic spec, stories, architecture/test constraints | story coverage + readiness → per-story build → integrated verification |
| Project | Nhiều epic/teams hoặc shared high-risk decisions | brief/PRD khi cần, architecture spine, epic map | project readiness → per-epic gates → cross-epic verification |

Direct không phải planning path BMAD riêng; đây là guardrail chống over-processing của adapter. Không tạo PRD hay BMAD workflow cho một local fix ít rủi ro. Không nhét một epic vào một agent session. Không tự động hóa các story đầu tiên khi kiến trúc/pattern còn chưa ổn định.

## Delivery invariants

1. Intent nói rõ desired state, non-goals và điều không được phá vỡ.
2. Requirement, epic và story giữ stable IDs và traceability hai chiều.
3. Story là unit implementation bounded; mỗi story có acceptance và evidence riêng.
4. Parallel story/epic chỉ chạy khi boundaries, contracts, ownership và integration checks rõ.
5. Readiness verifier read-only và trả `PASS`, `CONCERNS`, hoặc `FAIL`; owner khác mới sửa/approve artifact.
6. Final verification dùng integrated state, không cộng các story pass riêng lẻ rồi suy ra hệ thống pass.
7. Retrospective được ghi trước vào `kb/memory/episodic/`, giữ unfinished work và deviations nhìn thấy; lesson chỉ promote qua `$kb-curator`.

## Official-version boundary

Ngày 2026-11-12, hướng dẫn cài đặt chính thức phân biệt stable v6.12 với v7 preview alpha. Adapter này pin **method invariants**, không pin internal runtime layout hoặc tên skill preview. Nếu cần official BMAD runtime/plugin, thực hiện một installation/security review riêng theo tài liệu chính thức, không trộn nó với adapter này.
