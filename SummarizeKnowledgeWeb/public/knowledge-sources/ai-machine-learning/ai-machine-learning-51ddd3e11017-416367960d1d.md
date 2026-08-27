# Bản đồ kiến thức và thứ tự học

Mỗi lesson là một đơn vị có thể chạy độc lập, nhưng kiến thức được sắp theo dependency. Không nhảy vào RAG/agent trước khi hiểu validation, parser, metric và software engineering.

## 1 — Nền móng

| # | Lesson | Câu hỏi phải trả lời được |
|---:|---|---|
| 00 | `roadmap-ai-engineer` | AI, ML, model, workflow, agent và harness khác nhau thế nào? |
| 01 | `computing-cli-git` | Process, filesystem, environment, version control giúp reproducibility ra sao? |
| 02 | `python-foundations` | Làm sao biến input bẩn thành chương trình có output tin cậy? |
| 03 | `professional-python-testing-typing` | Interface, typing, log, test và dependency injection giảm lỗi gì? |
| 04 | `algorithms-data-structures-complexity` | Chọn cấu trúc dữ liệu/thuật toán theo latency và memory thế nào? |
| 05 | `parsers-ast-schemas` | Lexer, parser, AST và schema validator khác nhau ở đâu? |
| 06 | `linear-algebra` | Vector, matrix, dot product và cosine liên quan embedding ra sao? |
| 07 | `calculus-optimization` | Gradient, chain rule và learning rate làm model học thế nào? |
| 08 | `probability-statistics-experiments` | Metric tăng có thật hay chỉ là nhiễu? |
| 09 | `data-engineering-sql-etl-quality` | Dữ liệu được version, kiểm tra, truy lineage và quarantine ra sao? |
| 10 | `data-analysis-feature-engineering` | EDA và feature pipeline tránh train-serving skew thế nào? |

## 2 — Machine Learning

| # | Lesson | Trọng tâm |
|---:|---|---|
| 11 | `ml-workflow-validation-leakage` | framing, baseline, split, cross-validation, leakage, reproducibility |
| 12 | `regression` | linear regression, loss, regularization, residual |
| 13 | `classification-metrics-imbalance` | probability, threshold, calibration, precision/recall, cost matrix |
| 14 | `trees-ensembles` | decision tree, bagging, boosting, overfit, importance |
| 15 | `http-apis-concurrency-streaming` | API contract, auth concept, idempotency, async, retry, backpressure |
| 16 | `unsupervised-dimensionality-anomaly` | clustering, PCA, anomaly detection, evaluation không nhãn |
| 17 | `time-series-recommenders-ranking` | temporal split, forecasting, collaborative filtering, ranking |
| 18 | `graph-ml-and-gnns` | graph representation, message passing, node/link/graph task |
| 19 | `explainability-fairness-causality` | explanation, subgroup metrics, counterfactual, correlation ≠ causation |

## 3 — Deep Learning và LLM

| # | Lesson | Trọng tâm |
|---:|---|---|
| 20 | `neural-networks-backprop-autodiff` | computational graph, activation, backprop, gradient check |
| 21 | `deep-learning-training-pytorch` | tensor shape, training/eval loop, optimizer, checkpoint, reproducibility |
| 22 | `computer-vision-cnns` | convolution, augmentation, transfer learning, detection/segmentation map |
| 23 | `nlp-tokenization-embeddings-sequences` | Unicode Việt, BPE, TF-IDF, embedding, sequence mask |
| 24 | `attention-transformers` | Q/K/V, mask, multi-head, position, residual, encoder/decoder |
| 25 | `llm-training-inference-decoding` | pretrain/SFT, sampling, KV cache, batching, hallucination |
| 26 | `prompting-context-structured-output` | instruction hierarchy, few-shot, context, JSON Schema, repair/fallback |
| 27 | `vector-search-local-inference` | cosine/dot/L2, ANN concepts, metadata filter, quantization/local model |

## 4 — Retrieval và Agents

| # | Lesson | Trọng tâm |
|---:|---|---|
| 28 | `rag-fundamentals` | ingest → chunk → index → retrieve → ground → cite/no-answer |
| 29 | `advanced-rag-document-parsers-graphrag` | document parsing, hybrid search, RRF, rerank, GraphRAG, retrieval eval |
| 30 | `tool-calling-agent-loop-workflows` | typed tool, validate, dispatch, state machine, budget, termination |
| 31 | `planning-reflection-verification` | ReAct, plan–execute, router, critic, verifier và test gate |
| 32 | `agent-harness-runtime` | context/tools/controller/sandbox/permission/retry/budget/trace/eval |
| 33 | `memory-state-compaction-metis` | short/long memory, freshness, compaction, và các nghĩa khác nhau của Metis |
| 34 | `multi-agent-orchestration` | delegation, supervisor, contract, shared state, deadlock, merge |
| 35 | `mcp-skills-connectors-protocols` | protocol vs SDK, discovery, JSON-RPC, trust boundary, interoperability |

## 5–8 — Reliability, Production và Capstone

| # | Lesson | Trọng tâm |
|---:|---|---|
| 36 | `evals-benchmarks-experiment-design` | golden/property/trajectory/human eval, LLM judge, regression gate |
| 37 | `observability-latency-cost` | trace/span, TTFT, p95, token/cost, SLI/SLO, error taxonomy |
| 38 | `safety-security-red-teaming` | injection, exfiltration, tool abuse, least privilege, sandbox, approval |
| 39 | `fine-tuning-lora-quantization` | SFT vs RAG, PEFT/LoRA/QLoRA, dataset, overfit, quantization |
| 40 | `reinforcement-learning-alignment` | bandit, MDP, reward/value/policy, RLHF, DPO, reward hacking |
| 41 | `synthetic-data-distillation` | teacher–student, filtering, dedup, active learning, data flywheel |
| 42 | `multimodal-audio-vision-diffusion` | VLM, OCR/layout, audio, fusion, diffusion và modality-specific eval |
| 43 | `serving-inference-optimization` | streaming, batching, queue, cache, backpressure, overload, shutdown |
| 44 | `mlops-llmops-lifecycle` | lineage, registry, CI eval, canary, drift, rollback, incident response |
| 45 | `distributed-gpu-cloud-systems` | memory/compute/bandwidth, parallelism, autoscale, fault tolerance |
| 46 | `governance-privacy-ai-product` | PII, retention, system card, risk register, HITL, product KPI |
| 47 | `coding-agents-comparison` | Copilot/Codex/Claude Code và bake-off có version/date/evidence |
| 48 | `capstone-production-rag-agent` | production RAG tiếng Việt: citation, tool, eval, security, API, runbook |
| 49 | `capstone-coding-agent-harness` | coding agent: search/AST/patch/test/sandbox/budget/dirty-tree protection |
| 50 | `career-portfolio-interview-system-design` | portfolio evidence, interview loop, capacity/cost/system design |

## Coverage chống bỏ sót

- Math/stat/data/software/API: 01–15.
- ML cổ điển, tabular, unsupervised, time series, ranking, graph: 11–19.
- DL/CV/NLP/Transformer/LLM: 20–27.
- Parser: 05, 26, 29, 49.
- RAG/vector/local inference: 27–29, 48.
- Agent/tool/workflow/harness/memory/multi-agent/MCP: 30–35, 49.
- Metrics/eval/observability/cost: 08, 11, 13, 29, 36–37.
- Safety/privacy/security/fairness: 19, 38, 46.
- Fine-tune/RL/synthetic/multimodal: 39–42.
- Serving/MLOps/LLMOps/distributed: 43–45.
- Coding agents: 47, 49.

Các nhánh chuyên gia sau core (robotics, autonomous driving, bio-AI, scientific ML, recommender quy mô rất lớn, compiler kernel/GPU) không thể học sâu cùng lúc. Lesson 50 hướng dẫn chọn **một** nhánh dựa trên công việc và xây tiếp từ nền tảng chung.

