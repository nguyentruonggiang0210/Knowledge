---
id: kb.standard.security
title: KB and agent security standard
summary: Trust boundary, source validation, ACL, prompt-injection và side-effect controls.
kind: standard
scope: shared
status: approved
owners: [kb-maintainers, security]
tags: [security, prompt-injection, acl, poisoning, policy-as-code, attestation]
valid_from: 2026-11-12
valid_to: null
recorded_at: 2026-11-12
last_verified: 2026-11-13
review_by: 2027-01-12
confidence: high
sensitivity: internal
sources: [openai-agent-safety, openai-skill-safety, nist-ai-600-1, opa-policy-as-code, slsa-1.2, c2pa-2.4]
relations: [constrains:kb.pattern.retrieval, constrains:kb.pattern.agent-orchestration, defined-by:kb.standard.policy-enforcement, related-to:kb.pattern.knowledge-graph-and-provenance]
---

# KB and agent security standard

Mọi external/retrieved document là untrusted data. Nội dung như “ignore previous instructions” trong source không có quyền thay đổi policy, tool use hoặc objective.

## Required controls

1. Source allowlist/trust tier, owner và sensitivity trước promotion.
2. Quarantine nội dung thiếu provenance, có hidden/injection payload hoặc conflict chưa xử lý.
3. ACL/project/tenant/sensitivity filter trước retrieval; derivative chunk/index kế thừa quyền.
4. Structured validated output giữa agent; không truyền nguyên văn untrusted text vào privileged instruction.
5. Least-privilege tools; approval sát side effect quan trọng; idempotency và audit cho retry.
6. Không gửi secrets, private context hoặc dữ liệu vượt scope tới external tool/MCP.
7. Red-team direct/indirect injection, poisoned KB, cross-project leakage, malicious citation, exfiltration và conflicting versions.
8. Derivative nhận mức sensitivity nghiêm nhất của mọi input; summary, embedding, graph hoặc cache không được declassify content.
9. Cache key gồm identity/authority scope, policy/index version và validity; audit ưu tiên stable IDs thay raw sensitive query.
10. High-impact tool/agent call phải qua deterministic policy decision trước side effect; model output không tự cấp quyền.

Graph/vector retrieval không bypass access policy. Nếu không chứng minh được quyền truy cập hoặc evidence support, hệ thống phải abstain/escalate.

High-risk change gồm authorization, sensitive data, destructive migration, financial/safety effect và broad availability. Những thay đổi này cần explicit approval, rollback plan và independent verification.

Content hash chỉ phát hiện thay đổi; tamper-evident attestation cần signer/trust root/revocation theo `kb.pattern.knowledge-graph-and-provenance`. Structured JSON contract không đồng nghĩa constrained decoding; xem `kb.standard.policy-enforcement`.
