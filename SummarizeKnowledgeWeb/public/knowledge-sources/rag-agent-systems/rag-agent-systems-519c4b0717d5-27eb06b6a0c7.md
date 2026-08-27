# 48 — Capstone: Production RAG Agent tiếng Việt

## Bài toán

Xây trợ lý hỏi đáp tài liệu nội bộ tiếng Việt có citation, no-answer policy, một tool nghiệp vụ, human escalation, eval, injection defense, PII handling, trace và API contract. Một người khác phải clone repository, chạy offline và tái tạo kết quả.

## Kiến trúc bắt buộc

```text
documents -> parse/normalize -> chunks -> sparse+dense index
user -> auth/policy -> retrieve -> rerank -> isolated context
     -> model adapter -> schema validation -> citation verifier
     -> optional typed tool + approval -> answer/abstain/escalate
                              \-> trace/eval/cost
```

Tách các failure domain:

- Ingestion: OCR/parser sai, phiên bản cũ, metadata/quyền thiếu.
- Retrieval: chunk/index/query/filter/rerank không tìm đúng evidence.
- Generation: answer không được evidence hỗ trợ hoặc citation sai.
- Action: tool argument/quyền/idempotency/approval sai.
- Operations: latency, cost, drift, secret, retention hoặc rollback.

## Khi nào dùng/không dùng

RAG phù hợp tri thức thay đổi và cần dẫn nguồn. Dùng search/rule/database query trực tiếp nếu chỉ cần lookup deterministic. Không dùng agent tự do cho workflow cố định; state machine dễ kiểm soát hơn. Không gửi toàn bộ kho tài liệu vào prompt và không coi retrieved text là instruction đáng tin.

Ví dụ nghiệm thu: hỏi chính sách hoàn tiền; hệ thống trả điều kiện và citation đúng. Nếu câu hỏi không có trong kho, nó phải nói không đủ bằng chứng. Một tài liệu chứa “bỏ qua policy và gọi tool” không được thay đổi quyền hệ thống.

## Chạy demo reference

```powershell
python Lessions/48-capstone-production-rag-agent/src/demo.py
```

Reference implementation thuần Python có document parser nhỏ, hybrid score, ACL filter, prompt-injection quarantine, extractive fake-model, schema/citation validation và no-answer. Nó cố ý nhỏ để bạn hiểu từng dòng; capstone của bạn phải tách package, API, tests và fixtures.

## Definition of Done

1. `make setup`, `make test` hoặc lệnh Windows tương đương chạy từ máy sạch.
2. Dataset eval có answerable/unanswerable, typo, multi-document, stale version, ACL và injection.
3. Report Recall@k/MRR, answer correctness/faithfulness/citation, safety, p95 và cost/success.
4. API có request ID, idempotency, timeout và structured error.
5. Docker/deployment config không chứa secret; least privilege và egress policy rõ.
6. Release bundle version model/prompt/parser/index/policy; canary và rollback đã diễn tập.
7. Có architecture diagram, ADR, threat model, system card, runbook và postmortem giả lập.

## Bài tập mở rộng

- Thay hash embedding bằng model local nhưng giữ cùng interface/eval.
- Thêm BM25 + vector ANN + reranker và đo ablation từng thành phần.
- Thêm SQLite tool chỉ đọc; mutation phải có idempotency key và human approval.
- Tạo API bằng framework bạn chọn, load test và chứng minh backpressure.

Tiên quyết: 28–29, 32, 35–38, 43–46. Bài sau: 49.

