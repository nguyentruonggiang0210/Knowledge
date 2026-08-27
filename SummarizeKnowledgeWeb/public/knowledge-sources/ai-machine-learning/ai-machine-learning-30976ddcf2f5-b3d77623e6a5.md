# 46 — Governance, privacy, human-in-the-loop và AI product

## Mục tiêu

Biến accuracy thành một sản phẩm chịu trách nhiệm: xác định user/job-to-be-done, rủi ro, dữ liệu tối thiểu, quyền/retention, human escalation, system card và KPI sản phẩm.

## Bản chất

AI product là socio-technical system, không chỉ model. Cùng một false negative có hậu quả khác nhau trong gợi ý phim và chẩn đoán y tế. Governance phải bắt đầu từ intended use, affected people, prohibited use, data flow và authority boundary.

Privacy by design gồm data minimization, purpose limitation, consent/legal basis phù hợp, access control, encryption, retention/deletion và audit. Redaction giảm rủi ro nhưng không thay thế toàn bộ policy. Human-in-the-loop hiệu quả cần định nghĩa lúc nào bắt buộc escalate, thông tin nào người duyệt thấy, SLA và cách tránh automation bias.

Product metric phải nối chuỗi: task success → user outcome → business KPI, đồng thời có guardrail quality/safety/fairness/cost. Engagement cao không chứng minh câu trả lời đúng.

## Khi nào dùng

Áp dụng cho mọi hệ thống; mức độ kiểm soát tăng theo khả năng gây hại và tính không thể đảo ngược. Quyết định tuyển dụng, tín dụng, y tế, pháp lý hoặc hành động tài chính cần domain/legal review và authority gate mạnh. Không để agent tự quyết hành động high-impact chỉ vì confidence score cao.

## Demo

```powershell
python Lessions/46-governance-privacy-ai-product/src/demo.py
```

Demo data minimization, PII redaction, risk scoring và approval gate. Đây là minh họa kỹ thuật, không phải tư vấn pháp lý.

## Bài tập và checklist

1. Vẽ data-flow diagram cho capstone 48, đánh dấu storage/processor/retention.
2. Viết risk register: hazard, affected group, likelihood, impact, mitigation, owner, residual risk.
3. Thiết kế UX để người dùng sửa và khiếu nại output.

- [ ] Intended/prohibited use và limitation được công khai.
- [ ] Thu thập đúng dữ liệu cần thiết, có retention/deletion test.
- [ ] Có audit, incident response, human escalation và appeal path.
- [ ] KPI có quality/safety/fairness/cost guardrails.

Bài trước: 45. Bài sau: 47.

