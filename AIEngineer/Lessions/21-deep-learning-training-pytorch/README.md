# Lesson 21 — Deep-learning training và tư duy PyTorch

## Mục tiêu

Bạn sẽ hiểu vai trò của Tensor, Dataset/DataLoader, nn.Module, autograd, optimizer, train/eval mode, no_grad và checkpoint trong PyTorch. Demo cố ý dùng Python thuần để thấy từng bước của trainer mà không cần cài torch.

## Bản chất và cách hoạt động

Một trainer production cần nhiều hơn lời gọi backward:

1. Dataset cung cấp sample, DataLoader tạo batch và có thể shuffle train.
2. Module giữ tham số và định nghĩa forward.
3. Loss biến sai số thành scalar.
4. autograd tạo gradient; optimizer cập nhật tham số.
5. zero_grad ngăn gradient vô tình tích lũy.
6. train/eval mode điều khiển dropout/batch norm; no_grad giảm bộ nhớ lúc inference.
7. Checkpoint lưu model, optimizer, epoch, seed và config để resume đúng.

Demo ánh xạ các khái niệm đó sang list, hàm forward, tính gradient tay và SGD.

## Khi dùng

- Huấn luyện, fine-tune hoặc triển khai model neural.
- Cần trainer có checkpoint, validation và reproducibility.
- Debug data pipeline, batch shape hoặc optimizer.

## Khi không dùng

- Không bắt đầu bằng framework nặng nếu bài toán rule/linear đã đủ.
- Không gọi eval chỉ bằng training metric.
- Không pickle artifact không tin cậy rồi load tùy tiện.

## Ví dụ thực tế

Mô hình ước lượng ETA giao hàng từ khoảng cách chuẩn hóa và trạng thái trời mưa. Trainer chia minibatch, tính gradient, cập nhật tham số và đo MAE trên toàn tập.

## Demo

~~~powershell
python .\Lessions\21-deep-learning-training-pytorch\src\demo.py
~~~

## Bài tập

1. Chuyển demo sang torch.Tensor và nn.Linear.
2. Thêm validation split, early stopping và checkpoint JSON an toàn.
3. Cài gradient clipping.
4. Tạo lỗi quên zero_grad rồi so sánh learning curve.

## Checklist

- [ ] Seed và split có thể tái tạo.
- [ ] Batch shape/dtype/device đúng.
- [ ] zero_grad → forward → loss → backward → step đúng thứ tự.
- [ ] Validation chạy eval/no_grad.
- [ ] Checkpoint đủ trạng thái để resume.

## Bài trước và bài sau

- Bài trước: Lesson 20 — neural networks, backprop và autodiff.
- Bài sau: Lesson 22 — computer vision và CNN.
