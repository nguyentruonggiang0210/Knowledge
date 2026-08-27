# 14 — Decision tree và ensemble

## Mục tiêu

Bạn sẽ hiểu cách cây chia không gian feature, impurity, depth, overfitting, pruning, bagging, random forest và boosting. Bạn có thể huấn luyện decision stump và một ensemble bagged stumps bằng Python thuần.

## Bản chất và cách hoạt động

Decision tree lặp lại câu hỏi feature_j <= threshold để chia dữ liệu thành vùng ngày càng thuần. Classification thường dùng Gini hoặc entropy; regression dùng squared error. Cây dễ diễn giải cục bộ, xử lý quan hệ phi tuyến và ít cần scaling, nhưng cây sâu có variance cao và dễ ghi nhớ noise.

Bagging huấn luyện nhiều model trên bootstrap sample rồi vote/average để giảm variance. Random forest còn lấy ngẫu nhiên subset feature tại mỗi split để giảm tương quan giữa cây. Gradient boosting xây cây tuần tự để sửa residual/lỗi của ensemble trước; thường chính xác mạnh trên tabular nhưng nhạy hyperparameter hơn.

Demo dùng stump — cây sâu một split — chọn threshold có ít lỗi nhất. Ensemble lấy bootstrap sample và ngẫu nhiên một feature cho mỗi stump. Đây là mô hình giáo khoa minh họa cơ chế bagging/random feature, không phải implementation random forest production.

## Khi nào dùng / không dùng

Dùng tree ensemble cho dữ liệu bảng, quan hệ phi tuyến, interaction và baseline mạnh. Random forest thường ổn định, dễ tune; gradient boosting thường cho độ chính xác cao. Không dùng feature importance mặc định như bằng chứng nhân quả; không để ID/cardinality cao tạo split giả; không extrapolate regression tree ngoài range; không bỏ validation chỉ vì model ít preprocessing.

## Ví dụ thực tế

Hệ thống cảnh báo incident dựa trên latency và error rate. Một rule đơn khó mô tả cả hai tín hiệu. Nhiều stump học từ bootstrap sample và feature khác nhau sẽ vote. Hệ thống thật còn phải chọn threshold cảnh báo theo chi phí như bài 13.

## Chạy demo

~~~powershell
python .\Lessions\14-trees-ensembles\src\demo.py
~~~

## Bài tập

1. Đổi criterion từ số lỗi sang weighted Gini.
2. Viết cây depth 2 bằng recursion và đặt minimum samples per leaf.
3. Đo accuracy nhiều seed, giải thích variance và tăng số cây.
4. So sánh bagging song song với boosting tuần tự.

## Checklist

- [ ] Tôi mô tả split, leaf, depth và impurity.
- [ ] Tôi hiểu vì sao cây sâu dễ overfit.
- [ ] Tôi phân biệt bagging, random forest và boosting.
- [ ] Tôi không diễn giải feature importance như quan hệ nhân quả.

## Liên kết bài trước / sau

- Bài trước: 13 — decision threshold và metric classification.
- Bài sau: 15 — unsupervised learning và dimensionality reduction trong roadmap mở rộng.
