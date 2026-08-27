# 11 — Workflow ML, validation và data leakage

## Mục tiêu

Bạn sẽ đi trọn workflow ML: định nghĩa mục tiêu, thu thập nhãn, split, baseline, preprocessing, train, đánh giá, error analysis, đóng gói và giám sát. Bạn có thể nhận diện target leakage, temporal leakage, duplicate leakage và preprocessing leakage.

## Bản chất và cách hoạt động

Model chỉ tối ưu proxy được biểu diễn bởi dữ liệu và metric. Trước code cần chốt prediction unit, prediction time, feature availability, label window, business action và chi phí sai. Baseline đơn giản cho biết model phức tạp có thực sự tạo giá trị.

Train dùng để học tham số; validation dùng chọn feature/hyperparameter/threshold; test chỉ dùng gần cuối để ước lượng tổng quát hóa. Với dữ liệu thời gian, random split có thể cho quá khứ nhìn tương lai. Mọi transform có state như mean, vocabulary hay imputer phải fit trên train rồi áp dụng validation/test.

Demo chia quan sát theo thời gian, fit standardizer chỉ trên train và đánh giá baseline chỉ học target mean từ train. Dữ liệu validation có distribution shift cố ý để thấy mean toàn bộ dữ liệu sẽ rò rỉ thông tin tương lai.

## Khi nào dùng / không dùng

Dùng random stratified split cho quan sát độc lập, time split cho dự báo tương lai, group split khi nhiều hàng thuộc cùng user/patient/device. Không tune trên test; không fit scaler trước split; không để cùng document gần trùng ở cả train và validation; không dùng feature chỉ có sau thời điểm quyết định.

## Ví dụ thực tế

Model dự đoán ticket có vi phạm SLA lúc ticket vừa mở. Feature resolution_minutes chỉ tồn tại sau khi ticket đóng nên là target leakage. Feature “tổng ticket của khách đến hiện tại” hợp lệ nếu được tính point-in-time, nhưng aggregate toàn bảng gồm tương lai là temporal leakage.

## Chạy demo

~~~powershell
python .\Lessions\11-ml-workflow-validation-leakage\src\demo.py
~~~

## Bài tập

1. Thêm group_id và viết group split không để cùng khách ở hai tập.
2. Chứng minh fit mean trên toàn bộ dữ liệu làm validation trông dễ hơn.
3. Tạo model card nhỏ ghi data version, metric, slice yếu và limitation.

## Checklist

- [ ] Prediction time và label window được viết rõ.
- [ ] Train/validation/test có vai trò tách biệt.
- [ ] Transform có state chỉ fit trên train.
- [ ] Tôi kiểm tra leak theo thời gian, nhóm và bản ghi trùng.

## Liên kết bài trước / sau

- Bài trước: 10 — feature point-in-time đúng.
- Bài sau: 12 — regression và residual analysis.
