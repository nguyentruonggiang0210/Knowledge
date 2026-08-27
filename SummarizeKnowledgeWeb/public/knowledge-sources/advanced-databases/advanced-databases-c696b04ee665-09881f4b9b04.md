# Entry diagnostic — Đề kiểm tra đầu vào

Bài này xác định bạn đã sẵn sàng vào phần nâng cao hay cần ôn lesson nền tảng. Không mở file đáp án trong khi làm.

## Luật đạt

- PostgreSQL: đạt ít nhất 8/10 và bắt buộc đúng hai SQL gate PG-D09, PG-D10.
- ClickHouse: đạt ít nhất 10/12 và bắt buộc đúng hai SQL gate CH-D11, CH-D12.
- Mỗi câu 1 điểm. Kết luận đúng nhưng không giải thích được bẫy vẫn chỉ nhận nửa điểm.
- Nếu trượt một nhánh, chỉ cần ôn và làm lại nhánh đó sau 24–48 giờ.

Ghi phiên bản trước khi làm:

~~~sql
-- PostgreSQL
SELECT version(), current_database(), current_user;

-- ClickHouse
SELECT version(), currentDatabase(), currentUser();
~~~

## PostgreSQL basic — PG-D01..PG-D10

### PG-D01 — Schema và search_path

Vì sao SELECT * FROM orders có thể đọc nhầm object dù query không đổi? Viết cách gọi an toàn khi migration hoặc SECURITY DEFINER function truy cập bảng app.orders.

### PG-D02 — Kiểu tiền và thời gian

Chọn kiểu phù hợp cho amount cần tính chính xác và thời điểm event đến từ nhiều múi giờ. Giải thích vì sao double precision và timestamp without time zone có thể tạo bug.

### PG-D03 — NULL và logic ba giá trị

Kết quả logic của NULL = NULL là gì? Vì sao NOT IN có thể trả 0 hàng khi subquery chứa NULL, và anti-join nào an toàn hơn?

### PG-D04 — CHECK, UNIQUE và NULL

CHECK (price > 0) có cấm NULL không? Khi domain yêu cầu email phải duy nhất kể cả giá trị NULL, PostgreSQL hiện đại hỗ trợ cú pháp nào?

### PG-D05 — Foreign key và index

PostgreSQL có tự tạo index trên cột foreign key ở bảng con không? Nêu tác động khi xóa/update row ở bảng cha.

### PG-D06 — DML an toàn

Vì sao UPDATE/DELETE hợp lệ dù thiếu WHERE? RETURNING giúp API tránh một SELECT riêng như thế nào?

### PG-D07 — Join multiplicity

Một order có nhiều order_items và nhiều payments. Vì sao join thẳng cả ba rồi SUM có thể nhân doanh thu? Nêu cách sửa.

### PG-D08 — Transaction boundary

Ứng dụng ghi order thành công rồi ghi outbox ở transaction khác. Nó crash giữa hai bước. Invariant nào bị phá và boundary đúng là gì?

### PG-D09 — SQL gate: constraint cơ bản

Viết DDL tạo bảng app_user với:

- user_id identity primary key;
- tenant_id bắt buộc;
- email bắt buộc;
- uniqueness theo tenant, không phải toàn hệ thống;
- created_at lưu instant tuyệt đối.

### PG-D10 — SQL gate: cập nhật nguyên tử

Viết một statement trừ 3 đơn vị inventory cho SKU-RED chỉ khi đủ hàng và trả số lượng còn lại. Kết quả rỗng phải biểu diễn điều gì?

## ClickHouse basic — CH-D01..CH-D12

### CH-D01 — OLTP hay OLAP

Trong hai workload sau, workload nào phù hợp ClickHouse hơn và vì sao: cập nhật số dư từng row có serializable transaction; hay aggregate hàng tỷ event chỉ đọc 5 cột?

### CH-D02 — Metadata đầu tiên

Viết query xác nhận version, database hiện tại và liệt kê active parts của ecommerce.events. Vì sao count parts có ý nghĩa khi debug ingest?

### CH-D03 — Part và partition

Phân biệt data part với logical partition. Một INSERT thường tạo gì, và background merge được phép merge qua ranh giới partition không?

### CH-D04 — Column pruning và PREWHERE

Vì sao SELECT hai cột trên bảng rộng có thể rẻ hơn SELECT *? PREWHERE giảm công việc theo cơ chế nào?

### CH-D05 — ORDER BY không phải unique

ORDER BY của MergeTree quyết định điều gì? Nó có cấm hai row cùng key không?

### CH-D06 — Numeric và time

Chọn kiểu cho tenant_id không âm, revenue chính xác hai chữ số và event_time có mili-giây UTC. Nêu rủi ro khi chỉ dùng Float64 cho tiền.

### CH-D07 — LowCardinality và Nullable

Cột event_type lặp lại vài chục giá trị phù hợp wrapper nào? Nullable thêm dữ liệu phụ gì, và vì sao không nên thay mọi NULL bằng 0?

### CH-D08 — Array, Tuple, Map, Nested

Khi nào Map(String, String) tiện cho thuộc tính thưa? Vì sao field nóng dùng để filter/join thường nên được promoted thành typed column?

### CH-D09 — DEFAULT, MATERIALIZED, ALIAS

Phân biệt ba loại expression column này về việc client có thể insert và việc giá trị có được lưu trên disk.

### CH-D10 — Partition và sorting key

Với event SaaS luôn lọc tenant và khoảng ngày, vì sao PARTITION BY event_id và ORDER BY event_id đều là lựa chọn kém cho dashboard đó?

### CH-D11 — SQL gate: MergeTree DDL

Viết DDL cho diag_events gồm event_time DateTime64 UTC, event_date dẫn xuất, event_id UUID, tenant_id UInt32, event_type LowCardinality(String), revenue Decimal. Partition theo tháng và sort theo tenant, ngày, loại event, thời gian, ID.

### CH-D12 — SQL gate: query và pruning

Viết query tính count và revenue theo event_date/event_type cho tenant 7 trong half-open range bảy ngày. Viết thêm lệnh EXPLAIN để xem partition/primary-key pruning.

## Phiếu kết quả

~~~text
PostgreSQL: __/10 | PG-D09: pass/fail | PG-D10: pass/fail | Kết luận: pass/review
ClickHouse: __/12 | CH-D11: pass/fail | CH-D12: pass/fail | Kết luận: pass/review
Ngày làm lại nếu trượt: __________
~~~
