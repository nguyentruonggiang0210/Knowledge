# 02 — Nền tảng Python cho AI

## Mục tiêu

Bạn sẽ dùng kiểu dữ liệu, điều kiện, vòng lặp, hàm, exception, dataclass và collection trong một luồng dữ liệu thực tế. Sau bài học, bạn có thể biến dữ liệu thô thành object có quy tắc rõ và tách logic thành các hàm kiểm thử được.

## Bản chất và cách hoạt động

Python là ngôn ngữ động: object mang kiểu tại runtime, còn tên tham chiếu đến object. List giữ thứ tự; tuple thường biểu diễn bản ghi bất biến; dict ánh xạ khóa sang giá trị; set phù hợp kiểm tra thành viên. Hàm tạo ranh giới: đầu vào, đầu ra và lỗi dự kiến phải rõ.

Dataclass giảm mã lặp cho object dữ liệu nhưng không tự bảo đảm dữ liệu đúng. Ta vẫn cần parse và validate ở biên. Demo đọc ticket hỗ trợ dạng CSV, chuyển thành Ticket, tính điểm ưu tiên và chọn ticket xử lý trước. Parse, scoring và selection được tách để dễ thay đổi.

## Khi nào dùng / không dùng

Dùng Python cho pipeline dữ liệu, API, thí nghiệm ML, automation và glue code. Dùng dataclass khi cần bản ghi có tên trường và hành vi nhỏ. Không dùng dict tùy ý xuyên suốt hệ thống khi schema đã ổn định; không bắt Exception quá rộng rồi bỏ lỗi; không dùng mutable default chung giữa object.

## Ví dụ thực tế

Đội hỗ trợ sản phẩm AI ưu tiên sự cố theo mức nghiêm trọng, thời gian chờ và khách VIP. Nếu nhúng mọi quy tắc vào một vòng lặp dài, đổi trọng số rất dễ gây lỗi. Các hàm nhỏ cho phép kiểm tra từng quy tắc và sau này thay heuristic bằng model.

## Chạy demo

~~~powershell
python .\Lessions\02-python-foundations\src\demo.py
~~~

## Bài tập

1. Thêm channel và tăng điểm cho sự cố do hệ thống giám sát phát hiện.
2. Parse nhiều dòng và báo chính xác số dòng lỗi.
3. Nhóm ticket theo severity mà không sửa danh sách đầu vào.

## Checklist

- [ ] Tôi chọn đúng list, tuple, dict hoặc set.
- [ ] Tôi tách parse/validate khỏi business logic.
- [ ] Tôi dùng exception cho dữ liệu không hợp lệ có thể giải thích.
- [ ] Tôi viết hàm có đầu vào và đầu ra rõ.

## Liên kết bài trước / sau

- Bài trước: 01 — chạy và quan sát chương trình bằng CLI/Git.
- Bài sau: 03 — typing và test.
