---
id: kb.standard.policy-enforcement
title: Deterministic policy enforcement and structured generation
summary: Contract policy-as-code, pre-action authorization và schema-constrained output cho agent, retrieval và tool use.
kind: standard
scope: shared
status: approved
owners: [kb-maintainers, security]
tags: [policy-as-code, opa, authorization, constrained-decoding, structured-output]
valid_from: 2026-11-13
valid_to: null
recorded_at: 2026-11-13
last_verified: 2026-11-13
review_by: 2027-01-13
confidence: high
sensitivity: internal
sources: [opa-policy-as-code, jsonschemabench, openai-agent-safety]
relations: [constrains:kb.pattern.agent-orchestration, constrains:kb.pattern.interoperable-agent-runtime, constrains:kb.pattern.retrieval]
---

# Deterministic policy enforcement and structured generation

Natural-language guardrail là guidance, không phải enforcement. Quyết định access, tool execution, external write, approval và promotion phải có policy decision deterministic đặt trước side effect.

## Policy decision contract

Policy engine nhận structured input gồm caller identity, delegated authority, project/tenant, sensitivity, requested action, target resource, workflow/node/version, risk, approval evidence và current time. Output là:

```json
{
  "decision": "allow | deny | escalate",
  "reason_codes": ["stable-machine-readable-code"],
  "policy_version": "content-hash-or-release",
  "obligations": ["redact", "require-approval", "limit-scope"],
  "expires_at": "optional-short-lived-bound"
}
```

Không có identity, policy version hoặc required context thì fail closed. Policy engine như OPA/Rego là adapter tùy chọn; canonical contract không phụ thuộc một vendor.

## Enforcement points

Policy check chạy tại ingest/promotion, trước retrieval, sau external retrieval, trước tool/remote agent call, trước write/merge/deploy và trước canonical promotion. Model không được tự tạo approval evidence hay sửa policy input sau decision.

Decision log ưu tiên stable IDs, reason code, policy version và artifact hash; không lưu raw sensitive query/payload nếu không cần. Cache policy decision phải key theo identity, authority, action, resource, policy version và validity window.

## Schema-constrained generation

JSON Schema validation sau generation vẫn bắt buộc. Khi provider hỗ trợ constrained decoding, adapter có thể giới hạn token để output hợp schema ngay lúc sinh. Đây không chứng minh semantic correctness: output đúng JSON vẫn có thể sai fact hoặc vượt authority.

Fallback provider-neutral:

1. Generate theo versioned schema.
2. Parse và validate deterministic.
3. Retry bounded chỉ với validation error đã sanitize.
4. Nếu tiếp tục invalid, abstain/escalate; không tự đoán field bị thiếu.
5. Kiểm semantic invariants, authorization và evidence riêng sau schema compliance.

## Evaluation gates

- schema compliance và semantic acceptance được đo tách biệt;
- test unknown/extra field, enum/date, nesting sâu, malicious string và oversized output;
- policy tests gồm allow, deny, missing context, stale approval, cross-project và confused deputy;
- provider/model swap không được thay đổi authorization result;
- high-impact `allow` cần audit record và authority đúng vai trò.
