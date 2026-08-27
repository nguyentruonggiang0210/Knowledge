# Kế hoạch học 52 tuần

Mặc định 12–15 giờ/tuần. Một tuần gồm 30% đọc/ghi chú, 45% code và biến đổi demo, 15% quiz/error analysis, 10% viết learning log. Nếu thiếu giờ, kéo dài tuần; không bỏ quality gate.

## Lịch chuẩn

| Tuần | Lessons | Output bắt buộc |
|---:|---:|---|
| 1 | 00–01 | Sơ đồ AI system; môi trường và Git workflow tái tạo được |
| 2 | 02 | CLI xử lý dữ liệu bẩn, có edge cases |
| 3 | 03 | Package typed/tested với fake backend |
| 4 | 04–05 | Complexity note và parser không dùng `eval` |
| 5 | 06 | Notebook/markdown tự tính vector, matrix, cosine |
| 6 | 07 | Gradient descent + finite-difference check |
| 7 | 08 | A/B report có effect size/CI/assumptions |
| 8 | 09 | ETL SQLite có contract/quarantine/lineage |
| 9 | 10 | Feature pipeline tránh future leakage |
| 10 | 11 | Baseline + split/CV experiment contract |
| 11 | 12–13 | Regression/classification report; threshold theo cost |
| 12 | 14 | Tree/ensemble error analysis |
| 13 | 15 | Idempotent API + bounded retry/backpressure |
| 14 | 16 | Clustering/PCA/anomaly experiment |
| 15 | 17 | Temporal forecast + recommender ranking |
| 16 | 18 | Graph message-passing demo và task taxonomy |
| 17 | 19 | Fairness slices + causal assumptions note |
| 18 | Checkpoint 01–02 | Foundations/ML ≥80%, mini-build pass |
| 19 | 20 | Autodiff/backprop + gradient test |
| 20 | 21 | Reusable training/eval loop + checkpoint |
| 21 | 22 | CNN shape/augmentation analysis |
| 22 | 23 | Vietnamese tokenizer/embedding/sequence masks |
| 23 | 24 | Attention từ đầu; causal/padding mask tests |
| 24 | 25 | Decoding/KV-cache/latency lab |
| 25 | 26 | Structured extractor + invalid/adversarial fixtures |
| 26 | 27 | Vector search + local/quantization trade-off |
| 27 | Checkpoint 03 | DL/LLM ≥80%, tiny language pipeline pass |
| 28 | 28 | RAG cơ bản có citation/no-answer |
| 29 | 29 | Parser + hybrid/RRF/rerank/GraphRAG ablation |
| 30 | 30 | Typed tools + bounded state-machine agent |
| 31 | 31–32 | Planner/verifier và mini agent harness |
| 32 | 33 | Memory/compaction/provenance; Metis disambiguation |
| 33 | 34–35 | Multi-agent baseline và MCP-like trust-boundary tests |
| 34 | Checkpoint 04 | RAG/agents ≥80%, support-agent safety invariants pass |
| 35 | 36 | Versioned eval suite + CI regression gate |
| 36 | 37 | Trace, p50/p95, token/cost scorecard |
| 37 | 38 | Threat model + prompt-injection/tool-abuse red-team |
| 38 | 39 | LoRA/quantization decision record và measurement |
| 39 | 40 | Bandit/DPO lab + reward-hacking analysis |
| 40 | 41 | Synthetic-data provenance/filter/student eval |
| 41 | 42 | Multimodal pipeline + perception/reasoning eval split |
| 42 | 43 | Serving/load/backpressure/cache experiment |
| 43 | 44 | Release bundle, canary và rollback drill |
| 44 | 45 | Capacity/memory/parallelism estimate |
| 45 | 46 | Data-flow, risk register, HITL/product metrics |
| 46 | Checkpoint 05 | Production review pass, rollback đã chạy thật |
| 47 | 47 | Frozen coding-agent bake-off protocol và first results |
| 48–49 | 48 | Production RAG capstone + docs/evals/security/load test |
| 50–51 | 49 | Coding harness capstone + frozen unseen tasks |
| 52 | 50 + Checkpoint 06 | Portfolio defense, mock interview và 90-day next plan |

## Fast track cho software engineer

Làm Checkpoint 01 trước. Nếu đạt ≥90% và hoàn thành debug challenge không xem tài liệu, học 00–10 trong 3–4 tuần nhưng vẫn làm 05, 08, 09, 11 vì parser/statistics/data leakage là lỗi phổ biến của người đã biết code.

## Slow track cho người mới

Tách mỗi hàng thành hai tuần và dành thêm 4–8 tuần cho Python/SQL/toán. Mục tiêu không phải đúng 52 tuần; mục tiêu là mỗi gate có artifact và giải thích được failure mode.

## Learning log mẫu

```text
Lesson / ngày:
Tôi có thể giải thích:
Demo đã thay đổi input nào:
Failure tôi đã tạo và trace:
Assumption / invariant:
Câu còn mơ hồ và nguồn sẽ đọc:
Bằng chứng (command, test, commit):
```

Mỗi bốn tuần, xóa bớt “framework shopping”: chọn một stack để build, nhưng giữ interface/fake backend để nguyên lý không phụ thuộc vendor.

