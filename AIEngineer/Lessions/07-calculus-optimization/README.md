# 07 — Giải tích và tối ưu hóa

## Mục tiêu

Bạn sẽ hiểu đạo hàm, gradient, chain rule, loss surface, learning rate và gradient descent. Sau bài này, bạn có thể theo dõi một bước cập nhật tham số của linear regression và liên hệ nó với backpropagation trong neural network.

## Bản chất và cách hoạt động

Đạo hàm đo tốc độ thay đổi cục bộ của hàm theo một biến. Gradient gom các đạo hàm riêng theo mọi tham số và chỉ hướng tăng nhanh nhất; đi ngược gradient làm loss giảm cục bộ. Chain rule truyền ảnh hưởng qua chuỗi phép toán, là lõi của automatic differentiation/backpropagation.

Với dự đoán y_hat = w*x + b và mean squared error, đạo hàm theo w là trung bình của 2*x*(y_hat-y), còn theo b là trung bình 2*(y_hat-y). Gradient descent cập nhật w và b bằng cách trừ learning_rate nhân gradient. Learning rate quá lớn có thể dao động/phân kỳ; quá nhỏ hội tụ chậm.

## Khi nào dùng / không dùng

Dùng gradient-based optimization cho hàm khả vi và mô hình nhiều tham số. Feature scaling giúp loss surface dễ tối ưu. Không mặc định gradient descent tìm global optimum trong mạng sâu; không chọn learning rate chỉ qua một lần chạy; không dùng đạo hàm số cho training lớn vì chậm và sai số.

## Ví dụ thực tế

Ta học thời gian xử lý đơn hàng theo số mặt hàng. Dữ liệu giả tuân theo gần đúng y = 3x + 2. Demo tính gradient giải tích và cập nhật tham số cho tới khi loss nhỏ. Thư viện deep learning tự xây computation graph và làm cùng nguyên lý ở quy mô lớn.

## Chạy demo

~~~powershell
python .\Lessions\07-calculus-optimization\src\demo.py
~~~

## Bài tập

1. Thử learning rate 0.5 và giải thích loss bất ổn.
2. So sánh gradient giải tích với finite difference tại cùng tham số.
3. Thêm early stopping khi loss không cải thiện đủ nhỏ.

## Checklist

- [ ] Tôi giải thích gradient chỉ là thông tin cục bộ.
- [ ] Tôi tự tính được gradient MSE của linear model.
- [ ] Tôi hiểu vai trò learning rate và feature scaling.
- [ ] Tôi liên hệ chain rule với backpropagation.

## Liên kết bài trước / sau

- Bài trước: 06 — vector/matrix biểu diễn tham số và dữ liệu.
- Bài sau: 08 — xác suất, thống kê và thí nghiệm.
