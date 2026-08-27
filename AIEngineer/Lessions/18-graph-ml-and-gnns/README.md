# Lesson 18 — Graph Machine Learning và Graph Neural Networks

## Mục tiêu

Bạn sẽ biểu diễn node/edge, hiểu message passing và tự chạy một lớp GNN nhỏ: mỗi node nhận thông tin từ hàng xóm, tổng hợp, kết hợp với feature của chính nó rồi qua phép biến đổi và activation.

## Bản chất và cách hoạt động

Graph gồm node và edge; edge có thể có hướng, loại và trọng số. Feature của một tài khoản riêng lẻ có thể trông bình thường nhưng cấu trúc liên kết với nhiều tài khoản fraud lại rất đáng ngờ.

Một GNN message-passing điển hình thực hiện:

1. Tạo message từ feature hàng xóm.
2. Aggregate bằng sum/mean/max theo cách không phụ thuộc thứ tự.
3. Kết hợp self feature với aggregated feature.
4. Áp dụng weight, bias và non-linearity.

Lặp nhiều layer làm node nhìn xa hơn nhiều hop, nhưng có thể dẫn đến over-smoothing. Train/validation split trên graph cũng phải tránh leakage qua thời gian hoặc edge.

## Khi dùng

- Fraud ring, social/network risk, molecule và knowledge graph.
- Recommendation có user–item graph.
- Dependency graph của service hoặc source code.

## Khi không dùng

- Dữ liệu không có quan hệ hữu ích hoặc edge chỉ là nhiễu.
- Một bảng feature độc lập đã giải quyết tốt và graph làm tăng chi phí lớn.
- Không dùng node identity nhạy cảm như shortcut gây leakage.

## Ví dụ thực tế

Tài khoản mới có amount bình thường nhưng kết nối trực tiếp với hai tài khoản đã có risk cao. Message passing truyền tín hiệu risk từ neighborhood để tăng score kiểm tra.

## Demo

~~~powershell
python .\Lessions\18-graph-ml-and-gnns\src\demo.py
~~~

Demo cài mean aggregation và một GNN layer thuần Python, không dùng framework.

## Bài tập

1. Hỗ trợ directed edge và edge weight.
2. So sánh sum, mean và max aggregation khi degree rất khác nhau.
3. Thêm layer thứ hai và quan sát node hai-hop.
4. Thiết kế temporal split cho graph giao dịch.

## Checklist

- [ ] Định nghĩa rõ node, edge, feature, label và thời điểm.
- [ ] Aggregator không phụ thuộc thứ tự neighbor.
- [ ] Không để test edge/label lọt vào train.
- [ ] Có baseline không dùng graph.
- [ ] Kiểm tra degree bias, isolated node và over-smoothing.

## Bài trước và bài sau

- Bài trước: Lesson 17 — time series, recommender và ranking.
- Bài sau: Lesson 19 — explainability, fairness và causality.
