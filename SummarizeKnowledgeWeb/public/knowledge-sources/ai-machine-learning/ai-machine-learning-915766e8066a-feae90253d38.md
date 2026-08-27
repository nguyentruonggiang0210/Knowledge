# 44 — MLOps/LLMOps: artifact, CI eval, canary, drift và rollback

## Mục tiêu

Biến quá trình thử nghiệm thành lifecycle có thể tái tạo: version data/code/config/model/prompt, lưu lineage, kiểm tra regression, promote qua môi trường, canary và rollback.

## Bản chất

Một “model version” không đủ để tái tạo hệ thống LLM. Release unit có thể gồm model/provider, prompt, parser/schema, retriever/index, tools, policy và eval set. Artifact phải content-addressed hoặc có checksum; registry quản lý trạng thái candidate/staging/production chứ không chỉ lưu file.

CI không nên chỉ chạy unit test. Quality gate cần task success/retrieval/safety/latency/cost theo threshold và so sánh baseline. Sau offline eval, shadow/canary quan sát traffic thật có guardrail; feature flag giúp rollback nhanh. Drift có thể là input data, concept, retrieval corpus, user mix hoặc output quality—mỗi loại cần signal khác nhau.

## Khi nào dùng

- Bắt đầu tracking ngay khi có hơn một experiment hoặc một người làm dự án.
- Canary khi thay model, prompt, index hay policy có ảnh hưởng user.
- Rollback artifact/prompt/index đồng bộ; không chỉ đổi model ID.
- Không promote vì average score tăng nếu safety subgroup hoặc p95/cost regression.

Ví dụ: prompt v12 tăng answer rate 2% nhưng injection pass rate giảm dưới gate; pipeline phải chặn release dù metric trung bình đẹp hơn.

## Demo

```powershell
python Lessions/44-mlops-llmops-lifecycle/src/demo.py
```

Demo tạo content hash cho release bundle, chạy multi-metric gate và quyết định canary rollback.

## Bài tập và checklist

1. Thêm data/index checksum vào bundle rồi chứng minh hash thay đổi.
2. Thêm “max cost per success” và subgroup safety gate.
3. Viết incident runbook: detect → mitigate → rollback → communicate → postmortem.

- [ ] Một run có code/data/config/seed/environment lineage.
- [ ] Eval set được version và chống contamination.
- [ ] Promotion có owner, evidence và audit log.
- [ ] Rollback được diễn tập, không chỉ tồn tại trên sơ đồ.

Bài trước: 43. Bài sau: 45.

