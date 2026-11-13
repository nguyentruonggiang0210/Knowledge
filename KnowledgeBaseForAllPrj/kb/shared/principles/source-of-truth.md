---
id: kb.principle.source-of-truth
title: Source of truth and precedence
summary: Quy tắc phân biệt canonical knowledge, evidence, memory và derived artifacts.
kind: principle
scope: shared
status: approved
owners: [kb-maintainers]
tags: [truth, provenance, precedence]
valid_from: 2026-11-12
valid_to: null
recorded_at: 2026-11-12
last_verified: 2026-11-12
review_by: 2027-02-12
confidence: high
sensitivity: internal
sources: [w3c-prov, openai-skills]
relations: [constrains:kb.standard.knowledge-contract]
---

# Source of truth and precedence

Canonical pages diễn giải tri thức đã được owner chấp thuận; source registry ghi nơi kiểm chứng; episodic memory lưu điều đã xảy ra trong một run; procedural memory nằm trong skills; generated index chỉ giúp truy hồi.

Không biến output model thành sự thật chỉ vì nó được viết trôi chảy. Một claim được promote cần source phù hợp, owner, validity, sensitivity, conflict check và kết quả validation.

Precedence mặc định:

1. Explicit user requirement cho task hiện tại, trong phạm vi được phép.
2. Project-specific approved/current contract.
3. Shared approved/current standard hoặc pattern.
4. Proposed/draft knowledge, chỉ dùng như lựa chọn chưa duyệt.
5. Episodic memory và external material chưa promote, chỉ dùng làm lead/evidence candidate.

Khi hai nguồn cùng authority nhưng mâu thuẫn, không tự hợp nhất. Ghi conflict, thời gian hiệu lực, affected claims và owner cần quyết định.
