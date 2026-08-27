# Lesson 17 — Time series, recommender systems và ranking

## Mục tiêu

Bạn sẽ biết chia dữ liệu theo thời gian để tránh nhìn tương lai, xây baseline forecast, tạo content-based recommender và đánh giá thứ tự gợi ý bằng NDCG.

## Bản chất và cách hoạt động

Time series có thứ tự thời gian, trend, seasonality và autocorrelation. Random split có thể đưa tương lai vào tập train. Baseline như “giá trị gần nhất” hoặc moving average phải được đánh bại trước khi dùng model phức tạp.

Recommender thường gồm candidate generation rồi ranking. Content-based dùng thuộc tính item; collaborative filtering dùng hành vi nhiều người. Ranking quan tâm vị trí của item hữu ích, không chỉ đúng/sai. NDCG thưởng item liên quan xuất hiện ở đầu danh sách.

## Khi dùng

- Dự báo nhu cầu, tải hệ thống, tồn kho.
- Gợi ý khóa học, sản phẩm, bài viết.
- Xếp hạng search result hoặc lead bán hàng.

## Khi không dùng

- Không random split chuỗi thời gian.
- Không dùng recommender chỉ tối ưu click nếu click gây hại mục tiêu dài hạn.
- Không báo accuracy classification cho một bài toán thứ tự mà bỏ qua ranking metric.

## Ví dụ thực tế

Một cửa hàng dùng moving average dự báo nhu cầu ngày kế tiếp, đồng thời gợi ý sản phẩm có tag gần lịch sử khách hàng. NDCG kiểm tra sản phẩm mua thật có nằm gần đầu danh sách hay không.

## Demo

~~~powershell
python .\Lessions\17-time-series-recommenders-ranking\src\demo.py
~~~

Demo chỉ dùng dữ liệu cố định và Python standard library.

## Bài tập

1. Thêm seasonal-naive forecast cho chu kỳ bảy ngày.
2. Viết walk-forward validation thay vì chỉ một split.
3. Thêm popularity fallback cho user cold-start.
4. So sánh precision@k, recall@k, MRR và NDCG@k.

## Checklist

- [ ] Mọi feature tại thời điểm t chỉ dùng thông tin có trước hoặc tại t.
- [ ] Có naive baseline.
- [ ] Offline metric phù hợp vị trí và mục tiêu nghiệp vụ.
- [ ] Có chiến lược cold-start và diversity.
- [ ] Theo dõi feedback loop/popularity bias.

## Bài trước và bài sau

- Bài trước: Lesson 16 — unsupervised learning và anomaly.
- Bài sau: Lesson 18 — graph ML và GNN.
