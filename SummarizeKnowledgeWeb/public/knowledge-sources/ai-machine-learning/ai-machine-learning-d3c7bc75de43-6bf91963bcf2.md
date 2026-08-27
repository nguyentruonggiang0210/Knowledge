# Lesson 16 — Unsupervised learning, giảm chiều và anomaly detection

## Mục tiêu

Bạn sẽ hiểu cách tìm cấu trúc khi dữ liệu không có nhãn, tự cài một vòng lặp k-means, giảm hai chiều xuống một trục bằng power iteration, và phát hiện điểm sensor bất thường bằng khoảng cách robust.

## Bản chất và cách hoạt động

Học không giám sát không có đáp án đúng sẵn. Clustering gom các điểm gần nhau theo một giả định về similarity. K-means lặp hai bước: gán điểm vào centroid gần nhất và cập nhật centroid bằng trung bình nhóm. Kết quả phụ thuộc scale, số cụm và khởi tạo.

Giảm chiều tìm biểu diễn ngắn hơn nhưng giữ cấu trúc quan trọng. PCA chọn hướng có variance lớn; variance lớn không đồng nghĩa hướng đó hữu ích cho nghiệp vụ.

Anomaly detection gán điểm số bất thường thay vì luôn trả nhãn tuyệt đối. Một điểm xa centroid có thể là lỗi sensor, fraud hoặc một trường hợp hợp lệ hiếm; hệ thống thực tế cần threshold và điều tra con người.

## Khi dùng

- Phân nhóm máy, khách hàng hoặc tài liệu khi chưa có label.
- Trực quan hóa/giảm nhiễu trước một bước downstream.
- Cảnh báo sensor, giao dịch hay log khác thường.

## Khi không dùng

- Không dùng cluster như “ground truth” về con người.
- Không dùng Euclidean distance khi feature chưa scale hoặc dữ liệu categorical chưa mã hóa phù hợp.
- Không tự động chặn giao dịch chỉ vì anomaly score cao.

## Ví dụ thực tế

Nhà máy theo dõi nhiệt độ và độ rung. Hai chế độ vận hành bình thường tạo hai cụm; một phép đo quá xa mọi centroid cần được chuyển tới kỹ sư kiểm tra.

## Demo

~~~powershell
python .\Lessions\16-unsupervised-dimensionality-anomaly\src\demo.py
~~~

Demo dùng dữ liệu sensor nhỏ, k-means và distance-based anomaly score hoàn toàn bằng standard library.

## Bài tập

1. Standardize từng feature trước clustering và so sánh nhãn.
2. Thử ba cách khởi tạo centroid và đo độ ổn định.
3. Dùng percentile validation thay threshold viết tay.
4. Thêm silhouette score cho tập dữ liệu nhỏ.

## Checklist

- [ ] Feature scale và similarity có ý nghĩa nghiệp vụ.
- [ ] Chọn số cụm bằng nhiều bằng chứng, không chỉ một biểu đồ.
- [ ] Đánh giá stability qua nhiều seed.
- [ ] Anomaly được review trước hành động rủi ro.
- [ ] Không diễn giải PCA component như quan hệ nhân quả.

## Bài trước và bài sau

- Bài trước: Lesson 15 — HTTP APIs, concurrency và streaming.
- Bài sau: Lesson 17 — time series, recommender và ranking.
