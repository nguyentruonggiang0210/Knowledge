# 03 — Python chuyên nghiệp: typing, test và thiết kế biên

## Mục tiêu

Bạn sẽ dùng type hints, Protocol, dependency injection, exception có chủ đích và unit test. Một hàm “chạy được” phải đồng thời dễ đọc, có hợp đồng, kiểm thử được và không phụ thuộc cứng vào database hay dịch vụ ngoài.

## Bản chất và cách hoạt động

Type hints là metadata để IDE và static checker tìm lỗi trước runtime; chúng không tự validate input. Protocol mô tả hành vi cần có mà không buộc class kế thừa trực tiếp. Dependency injection truyền repository vào hàm thay vì tạo database bên trong, nhờ đó test dùng bản in-memory.

Test tốt kiểm tra hành vi quan sát được, gồm happy path, boundary và failure path. Test không nên phụ thuộc mạng, thời gian thực hay thứ tự chạy. Demo xây luồng đăng ký: chuẩn hóa email, kiểm tra password, băm bằng PBKDF2 và lưu qua UserRepository. Salt được truyền vào để test lặp lại; production phải sinh salt ngẫu nhiên riêng cho từng password.

## Khi nào dùng / không dùng

Dùng typing cho codebase cộng tác; Protocol khi nhiều adapter cùng thực hiện một hợp đồng; unit test cho logic nhanh, cô lập. Không coi type hint là validation bảo mật; không mock mọi dòng; không test implementation detail. Integration test vẫn cần cho database/API thật.

## Ví dụ thực tế

Dịch vụ đăng ký có thể lưu vào PostgreSQL ở production nhưng dùng repository trong bộ nhớ khi test. Business rule không đổi. Mẫu này cũng phổ biến trong API, feature store và agent tool: lõi logic không biết chi tiết hạ tầng.

## Chạy demo

~~~powershell
python .\Lessions\03-professional-python-testing-typing\src\demo.py
~~~

Chương trình chạy assert và test suite bằng unittest; exit code khác 0 nếu test lỗi.

## Bài tập

1. Buộc password có chữ và số, thêm test cho từng failure path.
2. Tạo FileUserRepository ghi JSON trong thư mục tạm của test.
3. Chạy static checker và giải thích một lỗi runtime chưa chắc phát hiện.

## Checklist

- [ ] Hàm public có type hints và docstring hữu ích.
- [ ] Dependency bên ngoài được truyền vào ở biên.
- [ ] Test gồm đường thành công, biên và lỗi.
- [ ] Tôi phân biệt static typing với runtime validation.

## Liên kết bài trước / sau

- Bài trước: 02 — cấu trúc Python cốt lõi.
- Bài sau: 04 — thuật toán và độ phức tạp.
