# 09 — Data engineering: SQL, ETL và chất lượng dữ liệu

## Mục tiêu

Bạn sẽ hiểu data contract, ETL/ELT, batch và stream, idempotency, khóa, index, transaction, lineage và quality check. Bạn có thể dựng pipeline nhỏ từ event thô đến bảng phân tích bằng SQLite và SQL tham số hóa.

## Bản chất và cách hoạt động

Extract lấy dữ liệu từ nguồn; transform chuẩn hóa kiểu, đơn vị và quy tắc; load ghi vào đích. ELT tải raw trước rồi transform trong warehouse. Pipeline production cần chạy lại an toàn: cùng một event_id không được nhân đôi doanh thu. Demo dùng primary key và upsert để đạt idempotency.

SQL là ngôn ngữ khai báo: ta mô tả kết quả, query planner chọn cách thực thi. Primary key bảo đảm định danh; index đổi thêm chi phí ghi/lưu trữ để tăng tốc đọc. Transaction gom nhiều thay đổi thành đơn vị atomic. Data quality không chỉ là không-null mà còn validity, uniqueness, freshness, completeness và consistency.

## Khi nào dùng / không dùng

Dùng relational database khi dữ liệu có quan hệ và cần transaction/query linh hoạt. Dùng batch khi độ trễ phút/giờ chấp nhận được; stream khi quyết định cần gần thời gian thực. Không ghép giá trị người dùng trực tiếp vào SQL; không coi retry an toàn nếu load không idempotent; không silently drop bản ghi lỗi.

## Ví dụ thực tế

Event thanh toán đến từ nhiều client với amount dạng chuỗi và timestamp khác timezone. Transform chuẩn hóa UTC và tiền thành cents; load theo event_id; truy vấn tổng doanh thu theo ngày. Nếu consumer nhận lại event sau retry, primary key ngăn double counting.

## Chạy demo

~~~powershell
python .\Lessions\09-data-engineering-sql-etl-quality\src\demo.py
~~~

Demo dùng database trong bộ nhớ, không tạo file.

## Bài tập

1. Thêm dead-letter list lưu event lỗi cùng lý do.
2. Thêm bảng customers và JOIN để tính doanh thu theo phân khúc.
3. Viết freshness check dựa trên timestamp mới nhất.

## Checklist

- [ ] Tôi tách extract, transform và load.
- [ ] Retry cùng input không nhân đôi kết quả.
- [ ] Tôi dùng SQL parameter thay vì nối chuỗi.
- [ ] Tôi kiểm tra uniqueness, validity, completeness và freshness.

## Liên kết bài trước / sau

- Bài trước: 08 — dữ liệu là mẫu dùng cho suy luận.
- Bài sau: 10 — phân tích và tạo feature từ dữ liệu sạch.
