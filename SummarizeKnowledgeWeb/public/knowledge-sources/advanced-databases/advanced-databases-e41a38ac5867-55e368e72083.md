# Câu hỏi phỏng vấn Database — Middle/Senior

Mỗi câu có mã ổn định để đối chiếu với `Anwsers/database.md`. Ứng viên nên nêu giả định về workload, tính đúng đắn, execution plan, failure mode và trade-off vận hành.

## Mô hình dữ liệu quan hệ

### DB-001 — [Middle] Xác định entity, relationship, cardinality và aggregate boundary trong mô hình quan hệ như thế nào?
**Tình huống:** Thiết kế dữ liệu cho đơn hàng gồm khách hàng, sản phẩm, dòng hàng, thanh toán và giao vận có vòng đời khác nhau.

### DB-002 — [Middle] 1NF, 2NF, 3NF và BCNF loại bỏ loại phụ thuộc và anomaly nào?
**Tình huống:** Một bảng duy nhất chứa đơn hàng, thông tin khách, sản phẩm và nhà cung cấp đang sinh duplicate/update anomaly.

### DB-003 — [Senior] Khi nào denormalization hợp lý và làm sao kiểm soát dữ liệu dẫn xuất bị lệch?
**Tình huống:** Read latency của dashboard quá cao vì phải join nhiều bảng nhưng dữ liệu vẫn cập nhật liên tục.

### DB-004 — [Middle] Chọn natural key, surrogate key, UUID hay sequence dựa trên tiêu chí nào?
**Tình huống:** Dữ liệu được tạo ở nhiều region, cần merge và vẫn hỗ trợ index locality tốt.

### DB-005 — [Middle] `NULL` và three-valued logic ảnh hưởng predicate, uniqueness và aggregate ra sao?
**Tình huống:** Báo cáo thiếu record vì dùng `NOT IN`, phép so sánh hoặc unique constraint trên cột nullable.

### DB-006 — [Middle] Nên đặt invariant ở application hay bằng PK, FK, UNIQUE, CHECK và NOT NULL trong database?
**Tình huống:** Nhiều service cùng ghi vào database và dữ liệu xấu xuất hiện dù code đã validate.

### DB-007 — [Middle] Mô hình many-to-many có thuộc tính riêng và lịch sử thay đổi như thế nào?
**Tình huống:** User thuộc nhiều role, mỗi membership có phạm vi, ngày hiệu lực và người phê duyệt.

### DB-008 — [Senior] Thiết kế soft delete, audit history và temporal validity mà không làm sai unique/query như thế nào?
**Tình huống:** Bản ghi có thể khôi phục, cần biết giá trị tại một thời điểm và vẫn không cho hai record active trùng key.

### DB-009 — [Senior] Mô hình polymorphic association hoặc subtype bằng single-table, class-table hay concrete-table inheritance thế nào?
**Tình huống:** Payment có nhiều loại với field khác nhau nhưng cần truy vấn và ràng buộc chung.

### DB-010 — [Middle] OLTP schema và OLAP star/snowflake schema tối ưu cho mục tiêu khác nhau ra sao?
**Tình huống:** Không nên chạy báo cáo tổng hợp nặng trực tiếp trên database giao dịch nhưng cần dữ liệu gần real-time.

## SQL và cách thực thi truy vấn

### DB-011 — [Middle] Logical query processing order của `SELECT` khác thứ tự viết như thế nào?
**Tình huống:** Một alias không dùng được trong `WHERE`, và filter đặt sai vị trí làm đổi kết quả outer join.

### DB-012 — [Middle] INNER, LEFT/RIGHT/FULL, CROSS và semi/anti join khác nhau về semantics ra sao?
**Tình huống:** Tìm khách chưa từng đặt hàng mà không tạo duplicate hoặc vô tình loại hàng do `NULL`.

### DB-013 — [Middle] Khi nào dùng window function thay cho `GROUP BY`, self-join hoặc correlated subquery?
**Tình huống:** Cần top-3 giao dịch mỗi khách, running total và so sánh với dòng trước mà vẫn giữ từng row.

### DB-014 — [Senior] CTE, derived table, recursive CTE và materialization có trade-off gì?
**Tình huống:** Một truy vấn cây phân cấp chậm, và việc tách CTE có thể khiến optimizer inline hoặc materialize khác nhau theo engine/version.

### DB-015 — [Middle] Phân biệt `WHERE`, `HAVING`, aggregate và window evaluation để filter đúng ở từng tầng.
**Tình huống:** Lọc nhóm có doanh thu cao và sau đó chỉ lấy các nhóm có rank trong top 10.

### DB-016 — [Senior] Vì sao offset pagination chậm hoặc trả dữ liệu trùng/thiếu, và keyset pagination được thiết kế thế nào?
**Tình huống:** API duyệt hàng triệu record trong khi dữ liệu liên tục được insert/update.

### DB-017 — [Senior] Viết UPSERT/get-or-create an toàn trước race condition và xác định idempotency như thế nào?
**Tình huống:** Hai request đồng thời cùng tạo một customer theo external key và một request gặp unique violation.

### DB-018 — [Middle] N+1 query phát sinh ra sao và batch/join/eager loading có trade-off nào?
**Tình huống:** Trang trả 100 order nhưng ORM tạo 201 truy vấn và latency tăng theo số dòng.

### DB-019 — [Middle] Predicate SARGable là gì và function/cast/leading wildcard làm mất khả năng index seek như thế nào?
**Tình huống:** Có index trên timestamp nhưng truy vấn lọc theo ngày vẫn full scan.

### DB-020 — [Senior] Statistics, histogram và cardinality estimation ảnh hưởng optimizer chọn plan ra sao?
**Tình huống:** Cùng câu SQL chạy nhanh trên staging nhưng chậm trên production có dữ liệu skew.

## Index và execution plan

### DB-021 — [Middle] B+Tree index tổ chức page, seek, range scan, split và fill factor như thế nào?
**Tình huống:** Insert ngẫu nhiên gây page split và write amplification trong khi truy vấn range cần nhanh.

### DB-022 — [Middle] Thứ tự cột trong composite index và quy tắc leftmost-prefix quyết định truy vấn được hỗ trợ ra sao?
**Tình huống:** Có index `(tenant_id, status, created_at)` nhưng các query dùng tập filter/order khác nhau.

### DB-023 — [Senior] Covering index/INCLUDE giảm key lookup nhưng làm tăng chi phí gì?
**Tình huống:** Một query hot chỉ lấy vài cột nhưng chạy hàng nghìn lần mỗi giây và table được update thường xuyên.

### DB-024 — [Senior] Clustered index, heap, nonclustered index và secondary index của InnoDB khác nhau thế nào?
**Tình huống:** Chọn primary/cluster key sai làm mọi secondary index phình lớn và insert hotspot.

### DB-025 — [Middle] Selectivity, clustering/correlation và kích thước kết quả ảnh hưởng quyết định scan hay seek thế nào?
**Tình huống:** Optimizer bỏ qua index trên cột boolean dù index tồn tại.

### DB-026 — [Senior] Partial/filtered index, expression/function index và generated column phù hợp trường hợp nào?
**Tình huống:** Chỉ 1% record ở trạng thái pending và query thường lọc biểu thức chuẩn hóa email.

### DB-027 — [Middle] Vì sao “thêm index cho mọi cột” làm hệ thống tệ hơn và phát hiện index thừa ra sao?
**Tình huống:** Write latency, dung lượng và thời gian maintenance tăng sau nhiều đợt tối ưu cục bộ.

### DB-028 — [Senior] Đọc execution plan và phân biệt estimated/actual rows, scan/seek, residual predicate và spill như thế nào?
**Tình huống:** Query có cost estimate thấp nhưng runtime cao, temp I/O lớn và row estimate lệch hàng nghìn lần.

### DB-029 — [Senior] Nested-loop, hash join và merge join phù hợp input nào và cần memory/order/index ra sao?
**Tình huống:** Join hai bảng lớn bị spill, trong khi một tham số khác lại chỉ trả vài row.

### DB-030 — [Senior] Parameter sniffing/sensitive plan và prepared statement generic plan gây regression như thế nào?
**Tình huống:** Stored procedure chạy rất nhanh cho tenant nhỏ nhưng cực chậm cho tenant lớn tùy lần compile đầu.

## Transaction, concurrency và consistency

### DB-031 — [Middle] ACID thực sự bảo đảm gì và durability phụ thuộc WAL/fsync/replica như thế nào?
**Tình huống:** Database báo commit thành công nhưng cần phân tích điều gì xảy ra nếu process, máy hoặc cả region hỏng ngay sau đó.

### DB-032 — [Middle] Dirty read, non-repeatable read, phantom và lost update xuất hiện ở isolation level nào?
**Tình huống:** Chọn isolation cho quy trình giữ chỗ tồn kho mà không khóa quá mức.

### DB-033 — [Senior] MVCC dùng version/snapshot ra sao và vì sao reader không chặn writer vẫn có chi phí?
**Tình huống:** Transaction chạy lâu làm table bloat, vacuum không dọn được và replica lag tăng.

### DB-034 — [Senior] Snapshot isolation ngăn anomaly nào nhưng vẫn có write skew ra sao?
**Tình huống:** Hai bác sĩ đồng thời tự chuyển khỏi ca trực, mỗi transaction vẫn thấy còn một người khác.

### DB-035 — [Middle] Deadlock khác lock wait như thế nào; database phát hiện và application retry ra sao?
**Tình huống:** Hai transaction cập nhật cùng hai account theo thứ tự ngược nhau.

### DB-036 — [Senior] Chọn optimistic concurrency, pessimistic locking hay serializable transaction theo contention thế nào?
**Tình huống:** Cập nhật booking hiếm xung đột ở ngày thường nhưng tranh chấp rất cao khi mở bán.

### DB-037 — [Middle] Tránh lost update cho counter hoặc state transition bằng atomic SQL/version column như thế nào?
**Tình huống:** Nhiều worker cùng tăng số dư hoặc chuyển trạng thái order từ pending.

### DB-038 — [Senior] Predicate/range lock, next-key/gap lock và phantom protection khác nhau giữa các engine ra sao?
**Tình huống:** Quy tắc “không được có hai booking giao nhau” không thể bảo vệ chỉ bằng row lock hiện có.

### DB-039 — [Senior] Xác định transaction boundary thế nào để vừa giữ invariant vừa tránh transaction dài?
**Tình huống:** Một request mở transaction rồi gọi HTTP service, khiến lock và connection bị giữ hàng chục giây.

### DB-040 — [Senior] Khi nào dùng distributed transaction/2PC, Saga orchestration/choreography hoặc compensation?
**Tình huống:** Tạo order phải phối hợp payment, inventory và shipping trên các database độc lập.

## Đặc thù engine và vận hành hiệu năng

### DB-041 — [Senior] PostgreSQL WAL, VACUUM/autovacuum, HOT update và transaction ID wraparound liên quan nhau thế nào?
**Tình huống:** Table update nhiều bị bloat, autovacuum không theo kịp và disk tăng liên tục.

### DB-042 — [Senior] SQL Server clustered index, tempdb, columnstore và Query Store hỗ trợ workload nào?
**Tình huống:** Hệ thống vừa có OLTP point lookup vừa có báo cáo scan lớn và cần điều tra plan regression.

### DB-043 — [Senior] InnoDB clustered primary key, redo/undo log và binary log đảm nhận vai trò gì?
**Tình huống:** Phân tích crash recovery, MVCC và replication khi MySQL nhận nhiều transaction concurrent.

### DB-044 — [Senior] Quy trình điều tra và tối ưu một slow query production nên đi theo thứ tự nào?
**Tình huống:** Không được phép thử index tùy tiện trên production và query chỉ chậm vào giờ cao điểm.

### DB-045 — [Senior] Table partitioning giúp pruning/maintenance nhưng không thay thế index hoặc sharding như thế nào?
**Tình huống:** Bảng event hàng tỷ dòng cần xóa theo tháng và query chủ yếu theo thời gian cộng tenant.

### DB-046 — [Middle] Bulk insert/update/delete nên batch, stage và log như thế nào để tránh khóa và phình transaction log?
**Tình huống:** Import 100 triệu record mà hệ thống OLTP vẫn phải phục vụ bình thường.

### DB-047 — [Senior] Connection pool sizing, timeout và transaction leak ảnh hưởng database ra sao?
**Tình huống:** Tăng pool từ 100 lên 1.000 lại làm throughput giảm và timeout nhiều hơn.

## NoSQL và mô hình theo access pattern

### DB-048 — [Middle] Document database phù hợp aggregate nào và gặp hạn chế gì với join/constraint/update chéo document?
**Tình huống:** Lưu catalog sản phẩm có thuộc tính linh hoạt nhưng giá và tồn kho cập nhật độc lập.

### DB-049 — [Middle] Key-value store đem lại mô hình consistency/query/TTL nào và phải thiết kế key ra sao?
**Tình huống:** Xây session store hoặc idempotency store với lookup chính xác theo key và lưu lượng rất cao.

### DB-050 — [Senior] Wide-column store thiết kế partition key, clustering key và denormalized table theo query như thế nào?
**Tình huống:** Ghi telemetry cực lớn nhưng một tenant nóng có thể tạo hot partition.

### DB-051 — [Middle] Graph database tốt hơn relational recursive query khi nào?
**Tình huống:** Cần truy vấn quan hệ nhiều hop, đường đi và neighborhood trên mạng gian lận.

### DB-052 — [Senior] Vì sao NoSQL thường “query-first modeling” và cùng dữ liệu có thể được nhân bản vào nhiều projection?
**Tình huống:** Một logical entity phải phục vụ timeline theo user, tra cứu theo ID và aggregate theo ngày.

## Dữ liệu phân tán, tích hợp và an toàn

### DB-053 — [Senior] CAP và PACELC giúp đánh giá distributed database như thế nào mà không biến thành lựa chọn nhị phân đơn giản?
**Tình huống:** Product yêu cầu vừa luôn ghi được qua network partition vừa đọc nhất quán ở mọi region.

### DB-054 — [Senior] Leader–follower replication đồng bộ/bất đồng bộ ảnh hưởng RPO, latency và availability ra sao?
**Tình huống:** Primary hỏng ngay sau khi ack một giao dịch nhưng replica chưa nhận log.

### DB-055 — [Senior] Đọc từ replica có thể gặp stale read, read-your-writes và monotonic-read violation; khắc phục thế nào?
**Tình huống:** User vừa cập nhật hồ sơ nhưng refresh lại thấy dữ liệu cũ hoặc trạng thái lùi.

### DB-056 — [Senior] Chọn shard key, resharding và xử lý hot shard/cross-shard query như thế nào?
**Tình huống:** Multi-tenant database tăng từ một shard lên hàng chục shard nhưng vài tenant lớn chiếm phần lớn tải.

### DB-057 — [Senior] Sinh global ID và thực thi uniqueness/foreign key xuyên shard có những lựa chọn nào?
**Tình huống:** Order được tạo offline hoặc ở nhiều region nhưng ID phải gần-sortable và không collision.

### DB-058 — [Senior] Cache-aside, write-through, write-behind và invalidation bảo đảm consistency đến mức nào?
**Tình huống:** Cache trả dữ liệu cũ sau update hoặc stampede làm database quá tải khi một hot key hết hạn.

### DB-059 — [Senior] Transactional Outbox giải quyết dual-write và kết hợp consumer idempotency như thế nào?
**Tình huống:** Commit order thành công nhưng publish event thất bại, hoặc publish trước rồi transaction rollback.

### DB-060 — [Senior] Change Data Capture dựa trên log khác polling timestamp ra sao?
**Tình huống:** Đồng bộ database sang search index/data warehouse mà không bỏ sót hoặc đọc trùng thay đổi.

### DB-061 — [Senior] Thực hiện zero/low-downtime schema migration bằng expand–migrate–contract như thế nào?
**Tình huống:** Thêm cột bắt buộc, đổi kiểu hoặc tách bảng khi nhiều version ứng dụng đang chạy đồng thời.

### DB-062 — [Senior] Backup full/incremental, WAL/binlog archive và point-in-time recovery tạo chiến lược RPO/RTO ra sao?
**Tình huống:** Một operator xóa nhầm dữ liệu lúc 14:03 và bản sao lỗi đã replicate sang standby.

### DB-063 — [Senior] Thiết kế disaster recovery đa vùng và kiểm chứng failover/failback thế nào?
**Tình huống:** Region chính mất hoàn toàn; runbook tồn tại nhưng chưa từng restore hoặc chuyển traffic thử.

### DB-064 — [Senior] Bảo vệ database bằng least privilege, secret rotation, encryption và audit như thế nào?
**Tình huống:** Ứng dụng bị lộ credential hoặc nhân viên nội bộ truy cập dữ liệu nhạy cảm ngoài nhiệm vụ.

### DB-065 — [Middle] Parameterized query ngăn SQL injection đến đâu và dynamic identifier/query phải xử lý thế nào?
**Tình huống:** API cho phép người dùng chọn cột sort/filter và đội phát triển đang nối chuỗi SQL trực tiếp.

## Câu hỏi kinh điển bổ sung — Basic đến Senior

### DB-066 — [Basic] ⭐ Viết SQL tìm các email bị trùng và số lần xuất hiện như thế nào?
**Tình huống:** Bảng `users(id, email, created_at)` có email nullable và khác biệt hoa thường; hãy làm rõ normalization, cách xử lý NULL và điều kiện `HAVING`.

### DB-067 — [Basic] ⭐ `UNION` và `UNION ALL` khác nhau về kết quả và chi phí như thế nào?
**Tình huống:** Hai bảng archive/live có thể chứa cùng `order_id`; hãy chọn phép hợp dựa trên yêu cầu giữ duplicate, không dùng dedup để che lỗi dữ liệu.

### DB-068 — [Basic] ⭐ PRIMARY KEY, UNIQUE và FOREIGN KEY bảo vệ ba loại invariant nào?
**Tình huống:** Thiết kế `customers`, `orders` và external customer code; hãy chọn constraint cho identity, business uniqueness và referential integrity.

### DB-069 — [Basic] ⭐ `DELETE`, `TRUNCATE` và `DROP` khác nhau ra sao?
**Tình huống:** Cần dọn dữ liệu test nhưng vẫn giữ schema; hãy phân tích filter, logging/locking, transaction rollback, trigger và reset identity theo từng engine.

### DB-070 — [Basic] ⭐ Dùng LEFT JOIN để đếm số nhân viên của mọi phòng ban, kể cả phòng ban rỗng, như thế nào?
**Tình huống:** Có `departments(id, name)` và `employees(id, department_id)`; hãy giải thích vì sao `COUNT(*)` có thể cho kết quả sai đối với phòng ban không có nhân viên.

### DB-071 — [Basic] ⭐ Chuẩn hóa bảng đơn hàng dạng spreadsheet có repeating group thành các bảng quan hệ như thế nào?
**Tình huống:** Một row chứa thông tin khách hàng và các cột `product1/qty1`, `product2/qty2`; hãy xác định key, bảng Order/OrderLine và anomaly được loại bỏ.

### DB-072 — [Basic] ⭐ Scalar, non-correlated và correlated subquery khác nhau như thế nào?
**Tình huống:** Tìm nhân viên có lương cao hơn mức trung bình của chính phòng ban; hãy viết query đúng và giải thích optimizer có thể decorrelate hay không.

### DB-073 — [Middle] ⭐ Lấy top 3 mức lương mỗi phòng ban bằng window function và xử lý tie như thế nào?
**Tình huống:** Business có thể muốn đúng ba nhân viên hoặc tất cả nhân viên đồng hạng ở ba mức lương cao nhất; hãy chọn `ROW_NUMBER`, `RANK` hoặc `DENSE_RANK`.

### DB-074 — [Middle] ⭐ Tính running balance bằng window frame và tránh bất ngờ với các row cùng timestamp như thế nào?
**Tình huống:** Bảng ledger có nhiều giao dịch cùng `occurred_at`; kết quả phải deterministic và mỗi row chỉ cộng đúng các giao dịch trước nó.

### DB-075 — [Middle] ⭐ Tránh double-count khi join Order, OrderItem và Payment đều là quan hệ one-to-many như thế nào?
**Tình huống:** Báo cáo cần tổng hàng và tổng tiền đã thanh toán theo order nhưng join thẳng ba bảng làm các row nhân chéo.

### DB-076 — [Middle] ⭐ Chọn `EXISTS`, `IN` hay JOIN cho bài toán membership và anti-membership như thế nào?
**Tình huống:** Tìm sản phẩm có đơn hàng và sản phẩm chưa từng được đặt; subquery có thể chứa NULL và một sản phẩm có rất nhiều order line.

### DB-077 — [Middle] ⭐ Thiết kế composite index cho query equality, range và sort cụ thể như thế nào?
**Tình huống:** Query hot là `WHERE tenant_id=? AND status=? AND created_at>=? ORDER BY created_at DESC LIMIT 50`; hãy chọn thứ tự key và giải thích phần nào của index dùng để seek/sort.

### DB-078 — [Middle] ⭐ Thiết kế index cho trang “latest orders” dùng keyset cursor và projection nhỏ như thế nào?
**Tình huống:** Query lọc theo `tenant_id`, đi lùi theo `(created_at,id)` và chỉ đọc `status,total`; hãy cân nhắc key direction, tie-break và covering cost.

### DB-079 — [Middle] ⭐ Chọn isolation và transaction boundary để tạo báo cáo nhất quán từ nhiều SELECT như thế nào?
**Tình huống:** Báo cáo đọc tổng order rồi tổng payment bằng hai câu SQL trong khi checkout vẫn ghi; hai con số phải thuộc cùng một logical point mà không chặn writer lâu hơn cần thiết.

### DB-080 — [Middle] ⭐ Nhiều worker lấy job từ một bảng bằng row locking mà không xử lý trùng như thế nào?
**Tình huống:** Worker cần claim batch job pending với `FOR UPDATE SKIP LOCKED` hoặc primitive tương đương, có thể crash sau khi claim và job phải được retry.

### DB-081 — [Senior] ⭐ Điều tra plan regression khi cardinality estimate sai nghiêm trọng do dữ liệu skew như thế nào?
**Tình huống:** Cùng prepared query chạy nhanh cho tenant nhỏ nhưng hash join spill và timeout cho tenant lớn; không được xóa toàn bộ plan cache như giải pháp lâu dài.

### DB-082 — [Senior] ⭐ Thêm UNIQUE constraint online vào bảng lớn đang có duplicate và write concurrent như thế nào?
**Tình huống:** Bảng 1 TB phải unique theo `(tenant_id, external_id)` nhưng production hiện có dữ liệu trùng, NULL và nhiều version ứng dụng cùng ghi.

### DB-083 — [Senior] ⭐ Chọn mô hình NoSQL cho activity feed có fan-out, TTL và hot celebrity như thế nào?
**Tình huống:** Cần đọc feed mới nhất theo user, ghi hàng triệu event/phút và chấp nhận eventual consistency có giới hạn; hãy so sánh document, key-value và wide-column theo access pattern.

### DB-084 — [Senior] ⭐ Xử lý failover replication khi client không biết transaction cuối đã commit hay chưa như thế nào?
**Tình huống:** Primary ack bị mất đúng lúc failover, replica có thể lag và primary cũ có nguy cơ quay lại; hệ thống không được tạo duplicate business effect.

### DB-085 — [Senior] ⭐ Physical và logical replication khác nhau thế nào khi nâng major version hoặc chỉ đồng bộ một phần dữ liệu?
**Tình huống:** Cần migrate gần zero-downtime sang cluster mới, giữ thứ tự thay đổi, xử lý DDL/sequence/large object và có kế hoạch cutover/rollback.
