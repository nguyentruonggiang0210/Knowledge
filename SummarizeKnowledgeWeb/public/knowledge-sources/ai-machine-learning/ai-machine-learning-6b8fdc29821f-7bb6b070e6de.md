# 08 — Xác suất, thống kê và thí nghiệm

## Mục tiêu

Bạn sẽ hiểu biến ngẫu nhiên, phân phối, kỳ vọng, phương sai, sampling, confidence interval, hypothesis test, p-value, effect size và các điều kiện của A/B test. Bạn có thể phân tích chênh lệch conversion mà không nhầm tương quan với quan hệ nhân quả.

## Bản chất và cách hoạt động

Xác suất mô hình hóa bất định; thống kê suy luận về quần thể từ mẫu. Mean tóm tắt trung tâm nhưng nhạy với outlier; variance đo độ phân tán. Một estimate luôn đi cùng uncertainty. Confidence interval 95% là quy trình mà qua nhiều mẫu lặp sẽ phủ tham số thật khoảng 95%, không phải xác suất hậu nghiệm 95% cho một interval đã tính.

Trong A/B test conversion, giả thuyết không cho rằng hai tỷ lệ bằng nhau. Two-proportion z-test dùng tỷ lệ gộp để ước lượng standard error dưới giả thuyết đó. P-value là xác suất quan sát thống kê ít nhất cực đoan như hiện tại nếu giả thuyết không đúng; nó không phải xác suất giả thuyết đúng.

## Khi nào dùng / không dùng

Dùng randomized experiment để ước lượng tác động nhân quả khi phân nhóm, exposure và metric được xác định trước. Dùng confidence interval để nhìn cả effect size lẫn uncertainty. Không dừng test ngay khi p-value vừa nhỏ; không chạy nhiều metric rồi chỉ báo metric thắng; không dùng xấp xỉ chuẩn khi số success/failure quá ít; không bỏ qua sample-ratio mismatch.

## Ví dụ thực tế

Nhóm sản phẩm thay prompt onboarding và muốn biết conversion từ trial sang kích hoạt có tăng không. Control có 40/1000, treatment 70/1000. Demo tính z-test hai phía và Wilson interval cho từng nhóm. Trước khi rollout vẫn cần xem guardrail như latency, khiếu nại và chi phí.

## Chạy demo

~~~powershell
python .\Lessions\08-probability-statistics-experiments\src\demo.py
~~~

## Bài tập

1. Thay sample size nhỏ và kiểm tra điều kiện xấp xỉ chuẩn.
2. Tính absolute lift, relative lift và giải thích metric nào dễ gây hiểu nhầm.
3. Mô phỏng 1000 A/B test không có effect để ước lượng false-positive rate.

## Checklist

- [ ] Tôi tách effect size khỏi statistical significance.
- [ ] Tôi giải thích p-value đúng điều kiện.
- [ ] Tôi xác định metric và thời gian test trước khi nhìn kết quả.
- [ ] Tôi kiểm tra randomization, sample size và multiple testing.

## Liên kết bài trước / sau

- Bài trước: 07 — tối ưu model từ dữ liệu.
- Bài sau: 09 — thu thập và bảo đảm chất lượng dữ liệu.
