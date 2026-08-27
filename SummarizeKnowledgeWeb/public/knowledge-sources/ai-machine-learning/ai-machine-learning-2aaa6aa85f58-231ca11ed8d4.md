# Lesson 20 — Neural networks, backpropagation và autodiff

## Mục tiêu

Bạn sẽ hiểu computational graph, chain rule, forward/backward pass, gradient descent và tự xây một scalar autodiff engine đủ để huấn luyện mô hình tuyến tính.

## Bản chất và cách hoạt động

Neural network là chuỗi phép biến đổi có tham số. Forward pass tạo dự đoán và loss. Backpropagation duyệt computational graph theo thứ tự ngược, áp dụng chain rule để tích lũy đạo hàm của loss theo từng tham số. Optimizer dùng gradient để cập nhật tham số.

Autodiff không phải symbolic algebra và cũng không phải numerical finite difference. Nó ghi graph các phép toán thật rồi áp dụng quy tắc đạo hàm cục bộ. Gradient phải được reset giữa các bước; nếu không chúng sẽ tích lũy.

Activation phi tuyến cho phép mạng biểu diễn quan hệ không tuyến tính. Initialization, learning rate, normalization và numerical stability quyết định việc train có hội tụ hay không.

## Khi dùng

- Cần hiểu framework deep learning đang làm gì dưới autograd.
- Debug gradient bằng zero, NaN, explosion hoặc loss không giảm.
- Xây custom operation/loss.

## Khi không dùng

- Không tự viết engine cho production nếu framework đã hỗ trợ tốt.
- Không dùng mạng sâu khi baseline đơn giản đã đạt yêu cầu.
- Không đánh giá bằng training loss duy nhất.

## Ví dụ thực tế

Demo học quan hệ thời gian giao hàng y = 2x + 1. Mọi phép cộng, nhân và lũy thừa tạo node trong graph; backward tự tính gradient cho weight và bias.

## Demo

~~~powershell
python .\Lessions\20-neural-networks-backprop-autodiff\src\demo.py
~~~

## Bài tập

1. Cài ReLU và sigmoid cùng backward rule.
2. Dùng finite difference kiểm tra gradient.
3. Xây MLP một hidden layer giải XOR.
4. Cố ý không reset gradient và giải thích hiện tượng.

## Checklist

- [ ] Biết shape/value của forward pass.
- [ ] Gradient được cộng khi một node đi qua nhiều nhánh.
- [ ] Reset gradient đúng thời điểm.
- [ ] Theo dõi train và validation loss.
- [ ] Có gradient check cho custom operation.

## Bài trước và bài sau

- Bài trước: Lesson 19 — explainability, fairness và causality.
- Bài sau: Lesson 21 — deep-learning training và PyTorch.
