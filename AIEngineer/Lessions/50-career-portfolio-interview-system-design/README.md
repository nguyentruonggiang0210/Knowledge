# 50 — Career, portfolio, interview và AI system design

## Mục tiêu

Chuyển kiến thức thành bằng chứng tuyển dụng và năng lực thiết kế: chọn scope, nêu trade-off, ước lượng capacity/cost, thiết kế eval/safety/operations, giao tiếp với product/data/platform/security.

## “Pro” nghĩa là gì?

Không phải thuộc nhiều tên framework nhất. Một AI Engineer mạnh có thể:

1. Frame đúng bài toán và baseline; biết lúc **không cần AI**.
2. Xây data/model/application pipeline có test và reproducibility.
3. Đánh giá failure theo tầng, không cherry-pick demo đẹp.
4. Thiết kế quyền, privacy, safety, human escalation và incident response.
5. Ước lượng latency/throughput/memory/cost và vận hành release/rollback.
6. Đọc paper/docs, làm experiment nhỏ và thay công nghệ mà không mất nguyên lý.

## Portfolio có bằng chứng

Hai capstone 48–49 đủ mạnh nếu mỗi dự án có:

- README một-lệnh chạy, demo offline và architecture diagram.
- ADR cho quyết định lớn; data/model/system card và threat model.
- Versioned eval dataset, baseline, ablation, confidence interval và failure gallery.
- Tests, CI gate, trace/metrics, load test, cost model, runbook và rollback.
- Video 3–5 phút: problem → architecture → live failure → fix/evidence.
- Postmortem trung thực: điều không hoạt động, nguyên nhân và bước tiếp theo.

Một repo sâu tốt hơn mười notebook copy tutorial. Không đưa secret/dữ liệu công ty vào portfolio.

## Interview loop tự luyện

- Coding/Python/SQL/DSA: viết rõ, test edge cases, phân tích complexity.
- ML: framing, split/leakage, metric/threshold, bias–variance, error analysis.
- DL/LLM: backprop, attention/mask, tokenization, inference/cache/quantization.
- RAG/agent: retrieval eval, parser/schema, harness, termination, permissions.
- System design: requirement/SLO → estimates → data/API/components → failure/security → observability/rollout.
- Behavioral: dùng STAR nhưng phải có số liệu và nói rõ phần mình chịu trách nhiệm.

## Demo

```powershell
python Lessions/50-career-portfolio-interview-system-design/src/demo.py
```

Demo chấm portfolio theo evidence và ước lượng số worker theo traffic/token throughput. Đây là starting point; benchmark thật phải đo trên model/hardware mục tiêu.

## Kế hoạch 30 ngày cuối

1. Tuần 1: audit gaps bằng Quiz, sửa capstone cho chạy từ máy sạch.
2. Tuần 2: hoàn thiện eval/threat model/load test/cost và failure gallery.
3. Tuần 3: mock interview 3 vòng; ghi lại, phân loại lỗi, luyện lại.
4. Tuần 4: viết case study ngắn, CV theo outcome, ứng tuyển có feedback loop.

- [ ] Có ít nhất hai capstone end-to-end với test/eval/operations.
- [ ] Giải thích được mọi dòng quan trọng và trade-off.
- [ ] Có benchmark không cherry-pick và limitations công khai.
- [ ] Có kế hoạch cập nhật nguồn theo quý thay vì học thuộc bảng công cụ.

Tiên quyết: hoàn thành checkpoint và capstone 48–49.

