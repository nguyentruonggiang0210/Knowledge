# 41 — Synthetic data, distillation và data flywheel

## Mục tiêu

Biết tạo dữ liệu tổng hợp có kiểm soát, lọc/deduplicate, huấn luyện student từ teacher và xây feedback loop mà không tự khuếch đại lỗi.

## Bản chất

Synthetic data có ích khi dữ liệu thật hiếm, đắt, nhạy cảm hoặc thiếu edge case. Distillation chuyển một phần hành vi của teacher lớn sang student nhỏ hơn bằng nhãn cứng, xác suất mềm hoặc trajectory. Nhưng output của teacher không tự động là ground truth. Pipeline phải quản lý prompt/version, provenance, license, diversity, contamination, filter và held-out human data.

Data flywheel tốt là vòng lặp: production failures → chọn mẫu có giá trị → human/verified label → train → eval độc lập → canary. Flywheel tệ là lấy toàn bộ output model làm nhãn cho chính nó; lỗi, bias và mode collapse sẽ tích lũy.

## Khi nào dùng

- Tạo edge case cho parser, safety classifier hoặc structured output.
- Distill route/classification đơn giản từ model đắt sang model nhỏ.
- Active learning chọn các mẫu model chưa chắc chắn để con người gán nhãn.
- Không dùng synthetic data để thay toàn bộ dữ liệu thực hoặc đánh giá chính model đã sinh nó.

Ví dụ: teacher tạo nhiều biến thể ticket “không đăng nhập được”; filter loại trùng và mẫu thiếu bằng chứng, human audit một phần, student học router chạy nhanh tại edge.

## Demo

```powershell
python Lessions/41-synthetic-data-distillation/src/demo.py
```

Demo tạo/deduplicate dataset, lọc theo confidence và train Naive Bayes student thuần Python.

## Bài tập và checklist

1. Cố ý làm teacher bias một class; đo student trên holdout thật.
2. Thêm near-duplicate detector bằng token Jaccard.
3. Viết data card ghi provenance và tỷ lệ human-reviewed.

- [ ] Split holdout thật trước khi sinh dữ liệu.
- [ ] Không để cùng template xuất hiện ở train và eval.
- [ ] Theo dõi class/diversity/duplicate/toxicity/licensing.
- [ ] Có sampling để con người audit và đường rollback.

Bài trước: 40. Bài sau: 42.

