# Checkpoint 05 — Reliability và Production (lessons 36–46)

Thời gian: 12 giờ.

## Lý thuyết

Chạy `python Quiz/quiz.py --phase reliability-production --shuffle --seed 505`. Yêu cầu ≥ 80%.

## Production review

Chọn capstone hoặc một service giả lập và cung cấp:

1. Versioned release bundle: code/data/model/prompt/parser/index/policy.
2. Offline scorecard có task, safety, latency, cost, subgroup và confidence interval.
3. Trace spans model/tool/parser/retry; token/cost accounting và error taxonomy.
4. Load test có p50/p95/p99, queue/saturation; backpressure và graceful shutdown.
5. Threat model: injection, exfiltration, confused deputy, path/SSRF concept, dependency/MCP supply chain.
6. PII data flow/retention/deletion, risk register và human escalation.
7. Canary rule, feature flag, rollback script/runbook và incident drill.
8. Capacity estimate cho FP16/INT8/INT4 cùng headroom; lý do scale-up/scale-out.

Gate: một safety regression chặn release dù average quality tăng. Không có rollback đã thử là chưa đạt production checkpoint.

