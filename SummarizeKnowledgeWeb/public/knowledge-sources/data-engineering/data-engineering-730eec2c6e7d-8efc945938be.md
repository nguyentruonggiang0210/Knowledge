# Lesson 15 — HTTP APIs, concurrency và streaming

## Mục tiêu

Sau bài này bạn có thể thiết kế một API inference có contract rõ ràng, phân biệt lỗi có thể retry với lỗi dữ liệu, dùng idempotency để một yêu cầu không bị xử lý hai lần, và hiểu khi nào cần concurrency hoặc streaming.

## Bản chất và cách hoạt động

HTTP contract mô tả method, đường dẫn, schema request/response và status code. Client chỉ nên retry lỗi tạm thời như 429, 502, 503 hoặc timeout; retry lỗi 400 thường chỉ lặp lại một request sai. Exponential backoff làm khoảng chờ tăng dần để tránh dồn tải.

Idempotency key đại diện cho một thao tác logic. Server lưu key cùng kết quả đầu tiên; các lần gửi lại trả đúng kết quả đó thay vì tạo giao dịch mới. Đây là yêu cầu quan trọng với thanh toán, tạo job inference và tool có side effect.

Concurrency giúp nhiều tác vụ I/O chờ mạng/đĩa tiến triển đồng thời. Streaming gửi từng event hoặc token trước khi toàn bộ kết quả hoàn tất, giảm time-to-first-byte nhưng không tự làm tổng thời gian tính toán ngắn hơn.

## Khi dùng

- API tạo job, thanh toán hoặc ghi dữ liệu có khả năng client retry.
- Gateway gọi model/provider có timeout và lỗi tạm thời.
- Chat hoặc xử lý tài liệu dài cần cập nhật tiến độ sớm.

## Khi không dùng

- Không retry vô hạn hay retry lỗi validation.
- Không dùng concurrency không giới hạn; nó có thể làm cạn connection, RAM hoặc quota.
- Không dùng streaming nếu consumer chỉ chấp nhận một object hoàn chỉnh và atomic.

## Ví dụ thực tế

Một hệ thống nhận yêu cầu phân tích hóa đơn. Mobile client mất kết nối sau khi gửi và gửi lại. Cùng idempotency key phải trả cùng job, không trừ tiền và xử lý hóa đơn hai lần. Nếu worker tạm lỗi, gateway retry tối đa ba lần với backoff.

## Demo

Tệp src/demo.py mô phỏng HTTP contract, kho idempotency trong bộ nhớ và một dịch vụ async thất bại tạm thời hai lần.

~~~powershell
python .\Lessions\15-http-apis-concurrency-streaming\src\demo.py
~~~

Output cuối phải có dòng PASS. Demo không mở cổng mạng và không cần API key.

## Bài tập

1. Bổ sung trường client_id vào idempotency scope để hai khách hàng được dùng cùng key.
2. Thêm jitter vào backoff và kiểm thử số lần gọi mà không dùng sleep thật.
3. Viết async generator phát các trạng thái queued, running và completed.
4. Quy định status code cho invalid payload, duplicate request và service unavailable.

## Checklist

- [ ] Contract kiểm tra kiểu và trường bắt buộc.
- [ ] Một idempotency key không tạo hai side effect.
- [ ] Retry có giới hạn, backoff và chỉ áp dụng cho lỗi tạm thời.
- [ ] Concurrency có semaphore hoặc giới hạn tương đương.
- [ ] Log không chứa secret hay toàn bộ dữ liệu nhạy cảm.

## Bài trước và bài sau

- Bài trước: Lesson 14 — nền tảng dữ liệu/ML theo lộ trình tổng.
- Bài sau: Lesson 16 — học không giám sát, giảm chiều và phát hiện bất thường.
