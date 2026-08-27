# 04 — Thuật toán, cấu trúc dữ liệu và độ phức tạp

## Mục tiêu

Bạn sẽ ước lượng thời gian/bộ nhớ theo kích thước đầu vào, chọn cấu trúc dữ liệu theo thao tác chủ đạo và triển khai thuật toán đồ thị có kiểm soát. Trọng tâm là lý giải trade-off, không học thuộc Big-O.

## Bản chất và cách hoạt động

Big-O mô tả tốc độ tăng chi phí khi n lớn và bỏ qua hằng số. Tra cứu dict/set trung bình O(1); quét list O(n); sort thường O(n log n). Thuật toán đúng nhưng O(n²) có thể không dùng được khi số vector hoặc tài liệu tăng hàng triệu.

Demo dùng Dijkstra tìm tuyến truyền dữ liệu có độ trễ thấp nhất. Dict biểu diễn adjacency map, heap giữ ứng viên có tổng chi phí nhỏ nhất. Với V đỉnh, E cạnh, độ phức tạp xấp xỉ O((V + E) log V). Bảng predecessor dựng lại đường đi mà không lưu toàn bộ path trong mỗi phần tử heap.

## Khi nào dùng / không dùng

Phân tích độ phức tạp trước tối ưu vi mô và khi dự đoán scale. Dijkstra phù hợp trọng số không âm như latency/cost. Không dùng nếu có cạnh âm; khi mọi cạnh cùng trọng số, BFS đơn giản hơn. Với dữ liệu nhỏ vẫn phải profile latency/memory thật.

## Ví dụ thực tế

Hệ thống inference đa vùng chọn đường request qua gateway, cache và GPU. Tuyến ít hop chưa chắc nhanh nhất; tổng latency mới là trọng số. Tư duy tương tự áp dụng cho workflow agent và model routing.

## Chạy demo

~~~powershell
python .\Lessions\04-algorithms-data-structures-complexity\src\demo.py
~~~

## Bài tập

1. Thêm một cạnh nhanh hơn và dự đoán đường trước khi chạy.
2. Trả số lần pop heap để quan sát graph density.
3. So sánh BFS và Dijkstra khi mọi trọng số bằng 1.

## Checklist

- [ ] Tôi phân biệt average và worst case.
- [ ] Tôi chọn list/dict/set/heap theo thao tác cần tối ưu.
- [ ] Tôi nêu được điều kiện trọng số không âm của Dijkstra.
- [ ] Tôi đo thực tế thay vì tối ưu theo cảm giác.

## Liên kết bài trước / sau

- Bài trước: 03 — implementation đáng tin cậy.
- Bài sau: 05 — parser và AST.
