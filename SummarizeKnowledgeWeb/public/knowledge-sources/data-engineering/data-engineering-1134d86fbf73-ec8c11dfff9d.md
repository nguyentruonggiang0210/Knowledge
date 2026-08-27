# 10 — Phân tích dữ liệu và feature engineering

## Mục tiêu

Bạn sẽ biết đặt câu hỏi EDA, kiểm tra missing/outlier/distribution, xây feature theo cutoff thời gian và tránh train-serving skew. Bạn có thể biến lịch sử giao dịch thành feature khách hàng mà không nhìn vào tương lai.

## Bản chất và cách hoạt động

EDA không phải tạo thật nhiều biểu đồ; đó là quá trình tìm hiểu đơn vị quan sát, kiểu dữ liệu, phạm vi, missingness, phân phối, quan hệ và lỗi thu thập. Feature engineering biến dữ liệu thành tín hiệu phù hợp với inductive bias của model: count, ratio, bucket, recency, rolling window, encoding hoặc interaction.

Mọi feature phải có thời điểm quan sát. Với prediction tại cutoff, chỉ được dùng event xảy ra trước hoặc đúng cutoff. Nếu feature offline dùng dữ liệu tương lai nhưng online không có, đó là leakage và train-serving skew. Demo tạo các feature RFM đơn giản: số giao dịch, tổng/giá trị trung bình, số ngày từ giao dịch gần nhất.

## Khi nào dùng / không dùng

Dùng feature thủ công khi domain knowledge mạnh, dữ liệu tabular hoặc cần giải thích. Chuẩn hóa khi thuật toán nhạy scale; one-hot cho categorical ít giá trị; hashing/embedding khi cardinality cao có cân nhắc collision. Không điền missing bằng mean trước khi split; không tạo aggregate toàn bộ lịch sử nếu có record sau cutoff; không dùng ID ngẫu nhiên như tín hiệu.

## Ví dụ thực tế

Model dự đoán churn vào đầu tháng. Tổng chi tiêu và recency phải được tính tại đúng đầu tháng cho từng training example. Giao dịch phát sinh cuối tháng là tương lai của nhãn dự đoán và phải bị loại. Demo cố tình có một giao dịch tương lai để xác minh nó không lọt vào feature.

## Chạy demo

~~~powershell
python .\Lessions\10-data-analysis-feature-engineering\src\demo.py
~~~

## Bài tập

1. Thêm feature số giao dịch trong 7 và 30 ngày.
2. Quy định rõ cách biểu diễn khách hàng chưa từng giao dịch.
3. Viết test so sánh feature batch với feature tính từng event.

## Checklist

- [ ] Tôi biết đơn vị của mỗi hàng và thời điểm quan sát.
- [ ] Tôi điều tra missing/outlier thay vì xử lý máy móc.
- [ ] Feature không dùng event sau cutoff.
- [ ] Logic feature offline và online dùng cùng định nghĩa.

## Liên kết bài trước / sau

- Bài trước: 09 — pipeline tạo dữ liệu đáng tin cậy.
- Bài sau: 11 — workflow ML, validation và leakage.
