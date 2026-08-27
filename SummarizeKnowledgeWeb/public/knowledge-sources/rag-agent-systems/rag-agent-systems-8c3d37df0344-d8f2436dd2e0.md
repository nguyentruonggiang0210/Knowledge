# Quiz screenshot tool

Tool mở trang practice quiz, bấm **Tất cả**, sau đó xử lý lần lượt câu 1 đến 162.
Ở mỗi câu, tool chọn một option, bấm **Kiểm tra/Check answer**, chờ giao diện hiện
đáp án đúng màu xanh (và option đã chọn màu đỏ nếu chọn sai), rồi mới đưa mọi vùng
cuộn về đầu trang và lưu ảnh theo thứ tự vào thư mục `images`.

## Cài đặt

```powershell
python -m pip install -r requirements.txt
python -m playwright install chromium
```

Nếu chưa tải Chromium, tool sẽ tự dùng Microsoft Edge đã cài trên Windows.
Chỉ cần chạy `python -m playwright install chromium` khi máy không có cả hai.

## Chạy

```powershell
python capture_quiz.py "https://guided.maithienan.com/certifications/ccar-f/quiz/practice"
```

Ảnh mặc định là `images/001.png` đến `images/162.png`. Tool ghi đè ảnh cũ
để bảo đảm ảnh phản ánh lần chạy hiện tại.

Các tùy chọn thường dùng:

```powershell
# Hiện trình duyệt để quan sát hoặc đăng nhập
python capture_quiz.py "URL" --headed

# Tiếp tục lần chạy dở, không chụp lại file đã có
python capture_quiz.py "URL" --resume

# Chụp toàn bộ chiều dài trang
python capture_quiz.py "URL" --full-page

# Dùng profile riêng để giữ phiên đăng nhập
python capture_quiz.py "URL" --headed --profile .browser-profile
```

Có thể đổi phạm vi bằng `--start`, `--end`; đổi thư mục bằng `--output`; và
tăng thời gian chờ giao diện bằng `--delay`, ví dụ `--delay 1500`.

Sau khi chạy, tool kiểm tra lại toàn bộ phạm vi và trả mã lỗi nếu có file bị
thiếu hoặc rỗng. Các lỗi riêng lẻ không làm dừng cả lượt chụp, nên danh sách cuối
cùng cho biết chính xác những câu cần chạy lại.
