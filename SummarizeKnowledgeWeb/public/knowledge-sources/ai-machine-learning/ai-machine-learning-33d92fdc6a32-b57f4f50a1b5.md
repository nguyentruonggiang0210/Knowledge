# 06 — Đại số tuyến tính cho AI

## Mục tiêu

Bạn sẽ hiểu scalar, vector, matrix, shape, phép nhân ma trận-vector, dot product, norm và cosine similarity. Bạn có thể đọc các công thức ML cơ bản và lý giải tại sao embedding, linear layer và attention đều dựa trên các phép toán này.

## Bản chất và cách hoạt động

Vector là dãy số có thứ tự biểu diễn một điểm hoặc đặc trưng; matrix là bảng số thường biểu diễn phép biến đổi tuyến tính hay một batch dữ liệu. Shape phải tương thích: matrix m×n nhân vector n chiều tạo vector m chiều.

Dot product đo mức thẳng hàng có tính cả độ lớn. Norm L2 là độ dài Euclid. Cosine similarity lấy dot product chia cho tích hai norm nên tập trung vào góc, cho kết quả từ -1 đến 1 khi vector thực. Embedding ánh xạ text/image/user thành vector để các đối tượng có quan hệ nằm gần nhau theo metric đã chọn.

Demo tự cài dot, norm, cosine và matrix-vector bằng standard library. Code vòng lặp giúp nhìn rõ cơ chế; hệ thống thật dùng NumPy/PyTorch với kernel vector hóa và GPU.

## Khi nào dùng / không dùng

Dùng dot product cho linear model và scoring; cosine cho retrieval khi hướng quan trọng hơn độ lớn; matrix multiplication cho biến đổi hàng loạt. Không dùng cosine với zero vector; không so sánh embedding từ hai model/phiên bản khác nhau như cùng không gian; không tự viết vòng lặp Python cho workload production lớn.

## Ví dụ thực tế

Trong semantic search, query và tài liệu được encode thành embedding. Hệ thống xếp hạng tài liệu theo cosine similarity. Một tài liệu có nhiều từ hơn có thể có norm lớn, nên cosine thường hợp lý hơn raw dot product nếu embedding chưa normalize.

## Chạy demo

~~~powershell
python .\Lessions\06-linear-algebra\src\demo.py
~~~

## Bài tập

1. Thêm hàm normalize vector và chứng minh dot của hai vector đã normalize bằng cosine.
2. Viết transpose và matrix-matrix multiplication kèm kiểm tra shape.
3. Tạo ba embedding giả và xếp hạng top-k cho một query.

## Checklist

- [ ] Tôi theo dõi được shape qua phép toán.
- [ ] Tôi phân biệt dot product, norm và cosine.
- [ ] Tôi biết zero vector làm cosine không xác định.
- [ ] Tôi hiểu embedding là biểu diễn học được, không phải “ý nghĩa tuyệt đối”.

## Liên kết bài trước / sau

- Bài trước: 05 — cấu trúc biểu diễn có kiểm soát.
- Bài sau: 07 — đạo hàm và tối ưu tham số.
