# 12 — Regression

## Mục tiêu

Bạn sẽ hiểu regression dự đoán đại lượng liên tục, linear regression, residual, loss và các metric MAE, MSE, RMSE, R². Bạn có thể fit mô hình một biến bằng nghiệm bình phương tối thiểu và đánh giá bằng nhiều góc nhìn.

## Bản chất và cách hoạt động

Linear regression giả sử kỳ vọng của target là tổ hợp tuyến tính của feature. Ordinary Least Squares chọn hệ số làm tổng bình phương residual nhỏ nhất. Bình phương phạt lỗi lớn mạnh và cho nghiệm thuận tiện, nhưng nhạy với outlier. Residual là y - y_hat; pattern trong residual thường chỉ ra phi tuyến, phương sai thay đổi hoặc feature thiếu.

MAE có cùng đơn vị target và bền hơn với outlier; RMSE nhấn mạnh lỗi lớn; R² so sánh với baseline dự đoán mean và có thể âm trên dữ liệu đánh giá. Metric phải gắn chi phí nghiệp vụ, không chọn vì quen thuộc.

## Khi nào dùng / không dùng

Dùng regression cho giá, thời gian, nhu cầu, nhiệt độ và score liên tục. Linear model là baseline mạnh, nhanh và dễ giải thích. Không ngoại suy xa miền train mà không kiểm tra; không diễn giải hệ số như nhân quả khi có confounder; không dùng MAPE khi target gần 0; không đánh giá trên train rồi báo là hiệu năng tổng quát.

## Ví dụ thực tế

Ước lượng phút xử lý batch theo số nghìn record giúp cấp tài nguyên và đặt timeout. Demo fit đường thẳng bằng covariance/variance rồi tính metric. Dữ liệu hoàn hảo để assert công thức; bài thực tế cần validation và residual plot.

## Chạy demo

~~~powershell
python .\Lessions\12-regression\src\demo.py
~~~

## Bài tập

1. Thêm outlier và so sánh thay đổi MAE với RMSE.
2. Thêm feature bậc hai rồi giải thích đó vẫn là linear theo tham số.
3. Chia time-based validation và so sánh với mean baseline.

## Checklist

- [ ] Tôi phân biệt prediction, residual và target.
- [ ] Tôi chọn metric dựa trên chi phí lỗi.
- [ ] Tôi kiểm tra residual và phạm vi ngoại suy.
- [ ] Tôi không suy ra quan hệ nhân quả chỉ từ hệ số.

## Liên kết bài trước / sau

- Bài trước: 11 — split và đánh giá không leakage.
- Bài sau: 13 — classification, threshold và imbalance.
