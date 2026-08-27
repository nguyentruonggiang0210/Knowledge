# Lesson 22 — Computer Vision và Convolutional Neural Networks

## Mục tiêu

Bạn sẽ hiểu pixel tensor, convolution kernel, stride, padding, channel, activation, pooling, receptive field và tự cài convolution/pooling 2D bằng list Python.

## Bản chất và cách hoạt động

Convolution trượt một kernel nhỏ qua ảnh, nhân từng phần tử rồi cộng để tạo feature map. Weight sharing giúp cùng detector nhận ra pattern ở nhiều vị trí. Nhiều layer mở rộng receptive field và học từ edge tới texture, bộ phận rồi object.

ReLU giữ tín hiệu dương và tạo phi tuyến. Pooling giảm kích thước nhưng làm mất chi tiết. CNN thật có nhiều channel và kernel được học bằng backprop; demo dùng Sobel-like kernel cố định để nhìn rõ cơ chế.

Transfer learning thường hiệu quả hơn train từ đầu khi dataset nhỏ. Augmentation chỉ được áp dụng hợp lý trên train và không được làm thay đổi label.

## Khi dùng

- Kiểm tra lỗi sản phẩm, phân loại ảnh, OCR, detection và segmentation.
- Pattern cục bộ, gần như bất biến theo vị trí.

## Khi không dùng

- Dữ liệu bảng không có cấu trúc không gian.
- Không dùng crop/flip nếu chúng phá ý nghĩa nhãn.
- Không triển khai khi chưa kiểm tra thay đổi ánh sáng, camera và subgroup.

## Ví dụ thực tế

Camera dây chuyền chụp bề mặt linh kiện. Kernel biên đứng tạo activation mạnh quanh một vết nứt dọc, rồi max pooling giữ tín hiệu nổi bật cho bước phân loại.

## Demo

~~~powershell
python .\Lessions\22-computer-vision-cnns\src\demo.py
~~~

## Bài tập

1. Thêm padding same và stride.
2. Hỗ trợ nhiều input/output channel.
3. So sánh kernel ngang, dọc và blur.
4. Thiết kế augmentation không làm sai label của scenario.

## Checklist

- [ ] Theo dõi đúng H × W × C qua từng layer.
- [ ] Chuẩn hóa ảnh nhất quán train/inference.
- [ ] Split theo thiết bị/thời gian để tránh ảnh gần trùng.
- [ ] Đánh giá confusion và lỗi theo điều kiện ánh sáng.
- [ ] Có baseline và kiểm tra robustness.

## Bài trước và bài sau

- Bài trước: Lesson 21 — deep-learning training và PyTorch.
- Bài sau: Lesson 23 — NLP, tokenization, embeddings và sequences.
