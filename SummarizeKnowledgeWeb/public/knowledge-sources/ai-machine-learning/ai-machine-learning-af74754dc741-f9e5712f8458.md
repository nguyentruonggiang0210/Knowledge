# Checkpoint 01 — Foundations (lessons 00–10)

Thời gian: 4 giờ, đóng tài liệu 60 phút đầu.

## Lý thuyết

Chạy `python Quiz/quiz.py --phase foundations --shuffle --seed 101`. Yêu cầu ≥ 80%. Sau đó tự viết một trang phân biệt tokenizer, lexer, parser, AST, schema validator và chunker bằng cùng ví dụ xử lý ticket.

## Debug challenge

Bạn nhận một CSV giao dịch có field thiếu, decimal sai, duplicate ID và timestamp không timezone. Viết pipeline chỉ standard library:

1. Parse và validate từng record, không dùng `eval`.
2. Quarantine record lỗi với reason code; không làm dừng toàn batch.
3. Deduplicate theo immutable ID; transaction ghi SQLite phải atomic.
4. Xuất data-quality report và checksum của input/output.
5. Có unit tests cho empty input, duplicate, invalid number và rollback.

## Phần giải thích

- Complexity theo số record và memory bottleneck.
- Data contract, invariant và lineage.
- Vì sao parse xong chưa có nghĩa dữ liệu hợp lệ về nghiệp vụ.

Gate: code/test 60%, data-quality evidence 20%, giải thích 20%; lỗi mất record silent là không đạt.

