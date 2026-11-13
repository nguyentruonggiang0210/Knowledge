---
id: kb.standard.evaluation
title: Evaluation and improvement standard
summary: Evals tách retrieval, generation, workflow và governance với deterministic-first gates.
kind: standard
scope: shared
status: approved
owners: [kb-maintainers]
tags: [evaluation, rag, traces, improvement, metamorphic-testing, prompt-optimization]
valid_from: 2026-11-12
valid_to: null
recorded_at: 2026-11-12
last_verified: 2026-11-13
review_by: 2027-02-12
confidence: high
sensitivity: internal
sources: [openai-agent-evals, openai-trace-grading, ragas, ares, llm-judge, metamorphic-llm-testing, gepa, otel-genai-semconv]
relations: [validates:kb.pattern.retrieval, validates:kb.pattern.agent-orchestration]
---

# Evaluation and improvement standard

Không dùng một quality score duy nhất.

## Layers

- **Retrieval:** Recall@k, Precision@k, MRR, nDCG, evidence-set coverage, latency.
- **Generation:** correctness, claim faithfulness, unsupported-claim rate, citation precision/recall/completeness, contradiction, abstention.
- **Agent workflow:** task success, routing/handoff/tool correctness, policy violation, retries, budget và trace quality.
- **Governance:** freshness SLA, stale answer, authority distribution, ACL/cross-project leakage, security bypass và risk–coverage.

Golden, holdout và adversarial sets được version độc lập. Không tune trên sealed holdout. Một thay đổi chỉ promote khi regression suite đạt tolerance đã khai báo và không có critical security failure.

## Metamorphic evaluation

Khi không có exact oracle, định nghĩa relation giữa các execution thay vì chỉ chấm từng output: paraphrase giữ evidence/answer; thêm unauthorized scope không mở rộng kết quả; đổi order source không đổi verdict; query `as_of` chỉ chọn version hợp lệ; rename path không đổi stable ID; retry không lặp committed effect. Biến đổi phải được human-calibrate để chứng minh giữ nghĩa, nếu không test có thể tạo false alarm.

## Judge policy

Chạy deterministic checks trước. Khi dùng LLM-as-judge: rubric cố định, structured result, evidence bắt buộc, record model/prompt version, đảo thứ tự A/B cho pairwise, calibrate với human-labeled set và route disagreement/low-confidence tới human review. Judge không là release gate duy nhất cho high-risk criterion.

## Improvement loop

Trace/feedback → failure taxonomy → select high-value cases → human label → candidate dataset → proposed change → regression + holdout + red team → approval → canary → promote/rollback. Không cho agent tự promote prompt/skill/knowledge dựa trên eval nó vừa tối ưu.

### Optimizer isolation

GEPA/DSPy-style trajectory or prompt optimization chỉ chạy trong sandbox trên training/dev split. Optimizer không thấy sealed holdout, production secrets, approval token hoặc canonical write tool. Mỗi candidate lưu parent/version, prompt/skill diff, trace sample, metrics, cost và failure taxonomy. Candidate phải qua holdout, red team, human disposition, canary và rollback như mọi thay đổi khác; natural-language reflection không phải proof.

Trace adapter nên dùng OpenTelemetry GenAI profile versioned khi có runtime, nhưng raw prompt/retrieved sensitive content mặc định không export. Evaluation dùng stable artifact IDs và redacted evidence locators.
