# Checkpoint 04 — RAG và Agents (lessons 28–35)

Thời gian: 10 giờ.

## Lý thuyết

Chạy `python Quiz/quiz.py --phase rag-agents --shuffle --seed 404`. Yêu cầu ≥ 80%.

## Mini-build: Support agent có giới hạn

- Ingest Markdown với document/version/ACL metadata; quarantine text giống instruction injection.
- Sparse+dense retrieval, RRF và no-answer threshold.
- Typed tools: calculator và read-only SQLite lookup; invalid arguments không được dispatch.
- State machine `retrieve -> answer | ask_clarification | propose_tool -> approval -> verify`.
- Harness có `max_steps`, time/cost budget, checkpoint, context compaction và structured trace.
- Citation verifier và test malicious document không kích hoạt tool.
- Multi-agent chỉ là optional experiment; phải chứng minh vượt single-agent baseline.

## Phân tích lỗi

Gắn mỗi failure vào một tầng: parser, ingestion, retrieval, context, model, output schema, tool, harness, evaluator. “Model dở” không phải taxonomy đủ dùng.

Gate: 100% safety invariants, ≥80% quiz, retrieval/answer eval có baseline. Loop vô hạn hoặc ACL filter sau generation là không đạt.

