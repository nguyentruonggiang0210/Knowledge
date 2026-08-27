# Đáp án phỏng vấn Database — Middle/Senior

Đây là khung chấm có chủ đích ngắn gọn. Câu trả lời mạnh phải gắn semantics SQL và bảo đảm dữ liệu với engine/version, workload, execution plan đo được và failure mode thực tế.

## Mô hình dữ liệu quan hệ

### DB-001 — [Middle] Xác định entity, relationship, cardinality và aggregate boundary trong mô hình quan hệ như thế nào?
**Tình huống:** Thiết kế dữ liệu cho đơn hàng gồm khách hàng, sản phẩm, dòng hàng, thanh toán và giao vận có vòng đời khác nhau.

**Trả lời:** Bắt đầu từ invariant và vòng đời: Order có OrderLine snapshot giá/sản phẩm tại lúc mua; Payment và Shipment thường là entity riêng có thể một-nhiều và chuyển trạng thái độc lập. PK định danh, FK thể hiện cardinality/ownership, UNIQUE/CHECK bảo vệ quy tắc cục bộ; aggregate boundary là phạm vi cần consistency transaction, không nhất thiết trùng mọi object API. Tránh nhét danh sách vào một cột nếu phải ràng buộc/join. **Tiêu chí:** ứng viên hỏi về partial payment, split shipment, lịch sử giá, delete policy và không tạo một “God table”.

### DB-002 — [Middle] 1NF, 2NF, 3NF và BCNF loại bỏ loại phụ thuộc và anomaly nào?
**Tình huống:** Một bảng duy nhất chứa đơn hàng, thông tin khách, sản phẩm và nhà cung cấp đang sinh duplicate/update anomaly.

**Trả lời:** 1NF yêu cầu giá trị thuộc miền nguyên tử theo mô hình; 2NF loại phụ thuộc một phần vào composite key; 3NF loại phụ thuộc bắc cầu của non-key; BCNF yêu cầu mọi determinant là superkey. Tách Customer, Order, Product, Supplier và OrderLine để insert/update/delete không làm mất hoặc lệch fact. Normalization dựa functional dependency và meaning, không phải máy móc “mỗi bảng ít cột”. **Tiêu chí:** đưa được anomaly cụ thể, key/candidate key, lossless join/dependency preservation và biết khi nào read model được denormalize.

### DB-003 — [Senior] Khi nào denormalization hợp lý và làm sao kiểm soát dữ liệu dẫn xuất bị lệch?
**Tình huống:** Read latency của dashboard quá cao vì phải join nhiều bảng nhưng dữ liệu vẫn cập nhật liên tục.

**Trả lời:** Denormalize khi access pattern, đo plan và SLA chứng minh join/aggregate là bottleneck; xác định một source of truth và field dẫn xuất. Đồng bộ mạnh có thể cập nhật trong cùng transaction/trigger; eventual dùng outbox/CDC và projection idempotent, kèm version/checkpoint. Cần reconciliation định kỳ, metric lag, rebuild và schema ownership. **Tiêu chí:** lượng hóa write amplification, staleness budget, backfill/failure recovery; không copy dữ liệu mà không có cơ chế sửa drift.

### DB-004 — [Middle] Chọn natural key, surrogate key, UUID hay sequence dựa trên tiêu chí nào?
**Tình huống:** Dữ liệu được tạo ở nhiều region, cần merge và vẫn hỗ trợ index locality tốt.

**Trả lời:** Natural key có meaning và vẫn nên UNIQUE nếu ổn định, nhưng đổi/lớn/nhạy cảm khiến FK đắt; surrogate tách identity khỏi business. Sequence nhỏ, tăng dần, locality tốt nhưng cần cấp phát/coordination và lộ volume. UUID v4 phân tán tốt nhưng random insert/index lớn; UUID v7/ULID gần theo thời gian cải thiện locality song cần xử lý clock/tie và privacy. **Tiêu chí:** phân biệt ID với business uniqueness, tính secondary-index width, merge region, enumeration threat và không dùng timestamp đơn thuần làm unique ID.

### DB-005 — [Middle] `NULL` và three-valued logic ảnh hưởng predicate, uniqueness và aggregate ra sao?
**Tình huống:** Báo cáo thiếu record vì dùng `NOT IN`, phép so sánh hoặc unique constraint trên cột nullable.

**Trả lời:** So sánh với NULL cho UNKNOWN; `WHERE` chỉ giữ TRUE, nên dùng `IS NULL`. `NOT IN` chứa một NULL có thể làm mọi kết quả UNKNOWN; `NOT EXISTS` với predicate tương quan thường an toàn hơn. `COUNT(col)` bỏ NULL, `COUNT(*)` không; `SUM` bỏ NULL nhưng trả NULL nếu không có input. UNIQUE xử lý nhiều NULL khác nhau theo engine/option, phải kiểm chứng. **Tiêu chí:** ứng viên không dùng `= NULL`, hiểu outer join và thiết kế NOT NULL/default khi “không biết” khác “không áp dụng”.

### DB-006 — [Middle] Nên đặt invariant ở application hay bằng PK, FK, UNIQUE, CHECK và NOT NULL trong database?
**Tình huống:** Nhiều service cùng ghi vào database và dữ liệu xấu xuất hiện dù code đã validate.

**Trả lời:** Constraint DB là hàng rào atomic cho mọi writer và race: identity bằng PK, reference bằng FK, uniqueness bằng UNIQUE, miền cục bộ bằng CHECK/NOT NULL. Application vẫn cần validation thân thiện và invariant xuyên service/phức tạp, nhưng “check rồi insert” không thay unique constraint. Trigger chỉ nên dùng khi semantics/ownership rõ vì side effect khó thấy. **Tiêu chí:** nói về index/lock cost, deferred constraint nếu engine hỗ trợ, migration dữ liệu cũ và mapping lỗi constraint thành domain error.

### DB-007 — [Middle] Mô hình many-to-many có thuộc tính riêng và lịch sử thay đổi như thế nào?
**Tình huống:** User thuộc nhiều role, mỗi membership có phạm vi, ngày hiệu lực và người phê duyệt.

**Trả lời:** Dùng junction entity `Membership(user_id, role_id, scope, valid_from, valid_to, approved_by, ...)`, với PK surrogate hoặc composite theo identity/lịch sử. FK bảo vệ hai đầu; UNIQUE/filtered unique ngăn membership active trùng nếu engine hỗ trợ. Nếu cần temporal history, không overwrite mà đóng validity cũ và insert version mới trong transaction. **Tiêu chí:** định nghĩa overlap/biên thời gian, revoke/audit, index theo user/role/scope và tránh comma-separated role IDs.

### DB-008 — [Senior] Thiết kế soft delete, audit history và temporal validity mà không làm sai unique/query như thế nào?
**Tình huống:** Bản ghi có thể khôi phục, cần biết giá trị tại một thời điểm và vẫn không cho hai record active trùng key.

**Trả lời:** Soft delete dùng `deleted_at/by` nhưng mọi query/relationship phải có policy rõ; partial/filtered UNIQUE trên row active hoặc generated key giải quyết uniqueness tùy engine. Audit append-only lưu actor, reason, before/after; temporal có system-time và valid-time, thường dùng `[valid_from, valid_to)` để tránh biên mơ hồ. Soft delete làm index/bloat tăng và có thể không đáp ứng quyền xóa thật. **Tiêu chí:** cascade/restore, retention/anonymization, overlap constraint, ORM global filter có thể bị bypass và archive/purge job.

### DB-009 — [Senior] Mô hình polymorphic association hoặc subtype bằng single-table, class-table hay concrete-table inheritance thế nào?
**Tình huống:** Payment có nhiều loại với field khác nhau nhưng cần truy vấn và ràng buộc chung.

**Trả lời:** Single-table đọc chung đơn giản nhưng nhiều NULL và CHECK phức tạp; class-table có bảng base + bảng subtype cùng PK/FK, chuẩn hóa và constraint tốt nhưng join nhiều; concrete-table lặp field chung và union khi query toàn bộ. `type + arbitrary_id` polymorphic FK thường không được DB bảo vệ. Với Payment, base giữ amount/status, subtype giữ card/bank detail và CHECK/trigger bảo đảm đúng một subtype. **Tiêu chí:** cân subtype rate, migration loại mới, FK integrity, query pattern và dữ liệu nhạy cảm.

### DB-010 — [Middle] OLTP schema và OLAP star/snowflake schema tối ưu cho mục tiêu khác nhau ra sao?
**Tình huống:** Không nên chạy báo cáo tổng hợp nặng trực tiếp trên database giao dịch nhưng cần dữ liệu gần real-time.

**Trả lời:** OLTP ưu tiên transaction ngắn, normalized data, point lookup và write concurrency. OLAP dùng fact theo grain rõ, dimension denormalized/star, columnar scan/partition và aggregate lớn; slowly changing dimension giữ lịch sử. ETL/ELT hoặc CDC đưa dữ liệu sang read store với freshness/quality checkpoint. **Tiêu chí:** xác định grain trước metric, tránh double count, nói rõ lag/reconciliation và workload isolation thay vì chỉ “thêm replica”.

## SQL và cách thực thi truy vấn

### DB-011 — [Middle] Logical query processing order của `SELECT` khác thứ tự viết như thế nào?
**Tình huống:** Một alias không dùng được trong `WHERE`, và filter đặt sai vị trí làm đổi kết quả outer join.

**Trả lời:** Mô hình logic thường là `FROM/JOIN -> ON -> WHERE -> GROUP BY -> aggregate -> HAVING -> window -> SELECT -> DISTINCT -> ORDER BY -> OFFSET/LIMIT` (chi tiết dialect khác). Alias SELECT chưa tồn tại ở WHERE; muốn filter window thường cần subquery/CTE hoặc `QUALIFY` nếu có. Predicate bên nullable của LEFT JOIN đặt ở WHERE có thể biến semantics thành INNER; đặt đúng trong ON nếu muốn giữ row trái. **Tiêu chí:** phân biệt logic với optimizer có quyền reorder tương đương và dự đoán NULL row chính xác.

### DB-012 — [Middle] INNER, LEFT/RIGHT/FULL, CROSS và semi/anti join khác nhau về semantics ra sao?
**Tình huống:** Tìm khách chưa từng đặt hàng mà không tạo duplicate hoặc vô tình loại hàng do `NULL`.

**Trả lời:** INNER chỉ match; outer giữ phía được bảo toàn và NULL-extend; CROSS là tích Descartes. Semi join trả row trái nếu tồn tại match (`EXISTS`) mà không nhân bản; anti join trả row trái không có match (`NOT EXISTS`). `LEFT JOIN ... WHERE right.pk IS NULL` dùng được khi cột test non-null, nhưng `NOT IN` nguy hiểm với NULL. **Tiêu chí:** ứng viên nhận ra cardinality one-to-many, không chữa duplicate bằng DISTINCT che lỗi và chọn EXISTS cho existence.

### DB-013 — [Middle] Khi nào dùng window function thay cho `GROUP BY`, self-join hoặc correlated subquery?
**Tình huống:** Cần top-3 giao dịch mỗi khách, running total và so sánh với dòng trước mà vẫn giữ từng row.

**Trả lời:** Window tính trên partition nhưng không collapse row: `ROW_NUMBER/RANK`, `SUM() OVER`, `LAG/LEAD`. Top-N per group dùng row_number trong subquery rồi filter; running total phải chỉ rõ `ORDER BY` và frame (`ROWS` thường tránh peer semantics bất ngờ). GROUP BY tạo một row mỗi group. **Tiêu chí:** phân biệt ROW_NUMBER/RANK/DENSE_RANK và tie, biết sort/memory/spill cost, tạo index hỗ trợ partition+order khi đáng.

### DB-014 — [Senior] CTE, derived table, recursive CTE và materialization có trade-off gì?
**Tình huống:** Một truy vấn cây phân cấp chậm, và việc tách CTE có thể khiến optimizer inline hoặc materialize khác nhau theo engine/version.

**Trả lời:** Non-recursive CTE chủ yếu tổ chức query; engine/version có thể inline hoặc coi là optimization fence/materialize, nên không mặc định nhanh hơn hay cache một lần. Recursive CTE có anchor + recursive member + termination, cần chống cycle/depth explosion. Materialize hữu ích khi kết quả đắt được reuse nhưng tốn temp I/O và mất pushdown. **Tiêu chí:** đọc actual plan theo PostgreSQL/SQL Server/MySQL version, `UNION ALL` khi không cần dedup và có path/visited/cycle guard.

### DB-015 — [Middle] Phân biệt `WHERE`, `HAVING`, aggregate và window evaluation để filter đúng ở từng tầng.
**Tình huống:** Lọc nhóm có doanh thu cao và sau đó chỉ lấy các nhóm có rank trong top 10.

**Trả lời:** WHERE lọc row trước grouping; HAVING lọc group sau aggregate. Window chạy trên kết quả sau grouping/HAVING nhưng trước final order, nên muốn filter rank thường bọc query hoặc dùng QUALIFY. Đẩy predicate không làm đổi semantics xuống WHERE giảm input sớm. **Tiêu chí:** không đưa điều kiện row vào HAVING vô cớ, xử lý NULL aggregate/tie và viết query theo từng tầng dễ kiểm chứng.

### DB-016 — [Senior] Vì sao offset pagination chậm hoặc trả dữ liệu trùng/thiếu, và keyset pagination được thiết kế thế nào?
**Tình huống:** API duyệt hàng triệu record trong khi dữ liệu liên tục được insert/update.

**Trả lời:** OFFSET vẫn phải tìm/bỏ qua nhiều row, chi phí tăng theo trang; mutation trước offset làm row dịch nên trùng/thiếu dưới read committed. Keyset dùng total order ổn định, ví dụ `(created_at,id)`, với predicate tuple “sau cursor” và index cùng order, chi phí gần O(page size log n). Cursor chứa mọi tie-break và direction, nên opaque/signed. **Tiêu chí:** unique deterministic order, NULL/collation, backward pagination, snapshot requirement và không chỉ dùng timestamp có duplicate.

### DB-017 — [Senior] Viết UPSERT/get-or-create an toàn trước race condition và xác định idempotency như thế nào?
**Tình huống:** Hai request đồng thời cùng tạo một customer theo external key và một request gặp unique violation.

**Trả lời:** Đặt UNIQUE trên external key rồi dùng primitive atomic đúng dialect (`INSERT ... ON CONFLICT`, phù hợp `MERGE`/locking semantics của engine) hoặc thử insert, bắt unique violation và select row thắng. Không “SELECT rồi INSERT” nếu không có constraint/lock. Idempotency key phải cùng payload/tenant và duplicate trả cùng kết quả; transaction bao business effect. **Tiêu chí:** hiểu race, isolation/deadlock retry, trigger/affected-row nuance và không nuốt mọi unique violation không liên quan.

### DB-018 — [Middle] N+1 query phát sinh ra sao và batch/join/eager loading có trade-off nào?
**Tình huống:** Trang trả 100 order nhưng ORM tạo 201 truy vấn và latency tăng theo số dòng.

**Trả lời:** Một query lấy parent rồi lazy-load child cho từng parent tạo N+1 round trip. Sửa bằng join/eager load, batch `IN`, data loader hoặc projection; join nhiều collection có thể Cartesian explosion và duplicate payload, split query/batch đôi khi tốt hơn. Cần cap page và index FK. **Tiêu chí:** đo query count/bytes, không chỉ bật eager toàn cục, xử lý ORM tracking/identity và regression test bằng telemetry.

### DB-019 — [Middle] Predicate SARGable là gì và function/cast/leading wildcard làm mất khả năng index seek như thế nào?
**Tình huống:** Có index trên timestamp nhưng truy vấn lọc theo ngày vẫn full scan.

**Trả lời:** SARGable nghĩa optimizer có thể biến predicate thành range trên index. Thay `DATE(ts)=d` bằng `ts >= d AND ts < d+1`; tránh implicit cast ở phía indexed column. `LIKE '%x'` không dùng B-tree prefix; cần full-text/trigram/index chuyên biệt. Expression/generated-column index có thể hỗ trợ biểu thức cố định. **Tiêu chí:** giữ semantics timezone/collation, parameter type đúng và xác nhận actual plan—scan vẫn có thể hợp lý nếu trả nhiều row.

### DB-020 — [Senior] Statistics, histogram và cardinality estimation ảnh hưởng optimizer chọn plan ra sao?
**Tình huống:** Cùng câu SQL chạy nhanh trên staging nhưng chậm trên production có dữ liệu skew.

**Trả lời:** Optimizer ước lượng row từ sample/histogram, distinct count và giả định independence/correlation; estimate quyết định join order/type, index, memory grant và parallelism. Stats cũ, skew, correlated columns hoặc parameter value làm lệch estimate; dùng update/analyze, extended/multi-column stats, filtered stats/index hoặc plan strategy theo engine. **Tiêu chí:** so estimated với actual ở operator đầu tiên lệch, không “update stats” mù quáng, kiểm tra data distribution và parameter sensitivity.

## Index và execution plan

### DB-021 — [Middle] B+Tree index tổ chức page, seek, range scan, split và fill factor như thế nào?
**Tình huống:** Insert ngẫu nhiên gây page split và write amplification trong khi truy vấn range cần nhanh.

**Trả lời:** Internal page giữ separator/child; leaf giữ key + locator/payload và liên kết để range scan. Seek O(log fanout N), range thêm O(k/pages). Insert vào page đầy gây split, log/fragmentation; fill factor chừa chỗ giảm split nhưng tăng page/read/storage, còn sequential key gây right-edge hotspot chứ ít middle split. **Tiêu chí:** nói theo page I/O/cache, maintenance/rebuild, key width và phân biệt logical fragmentation với nguyên nhân latency.

### DB-022 — [Middle] Thứ tự cột trong composite index và quy tắc leftmost-prefix quyết định truy vấn được hỗ trợ ra sao?
**Tình huống:** Có index `(tenant_id, status, created_at)` nhưng các query dùng tập filter/order khác nhau.

**Trả lời:** B-tree được sort lexicographic: equality trên cột đầu rồi range trên cột kế thường dùng tốt; sau range, cột sau ít giúp thu hẹp seek nhưng có thể giúp covering/filter/order. Query bỏ `tenant_id` thường không seek hiệu quả theo status. Chọn thứ tự từ access pattern, tenant boundary, equality/range/order—không chỉ “cột selectivity cao nhất”. **Tiêu chí:** vẽ key range cụ thể, xem skip-scan/engine capability là ngoại lệ và tránh tạo mọi permutation.

### DB-023 — [Senior] Covering index/INCLUDE giảm key lookup nhưng làm tăng chi phí gì?
**Tình huống:** Một query hot chỉ lấy vài cột nhưng chạy hàng nghìn lần mỗi giây và table được update thường xuyên.

**Trả lời:** Khi index chứa mọi cột query cần, engine có thể tránh lookup về base/clustered row; INCLUDE/non-key không ảnh hưởng sort key theo cùng cách key columns. Đổi lại index rộng hơn, ít entry/page, nhiều cache/storage/WAL, update amplification; MVCC visibility như PostgreSQL có thể vẫn cần heap trừ khi visibility map cho index-only scan. **Tiêu chí:** cover đúng projection/predicate, đo lookup count, không include LOB tùy tiện và cân read QPS với write rate.

### DB-024 — [Senior] Clustered index, heap, nonclustered index và secondary index của InnoDB khác nhau thế nào?
**Tình huống:** Chọn primary/cluster key sai làm mọi secondary index phình lớn và insert hotspot.

**Trả lời:** SQL Server clustered leaf là data row, mỗi table tối đa một; nonclustered leaf chứa key + row locator/cluster key. Heap dùng RID và có forwarded record khi row lớn lên. InnoDB table cluster theo PK (hoặc key được chọn nội bộ), secondary leaf chứa PK nên PK rộng làm mọi index rộng và lookup secondary cần bước về primary. PostgreSQL heap tách rời index qua TID. **Tiêu chí:** chọn cluster key hẹp, ổn định, gần tăng nhưng cân hotspot; hiểu “clustered” không có cùng semantics mọi engine.

### DB-025 — [Middle] Selectivity, clustering/correlation và kích thước kết quả ảnh hưởng quyết định scan hay seek thế nào?
**Tình huống:** Optimizer bỏ qua index trên cột boolean dù index tồn tại.

**Trả lời:** Boolean selectivity thấp; nếu query lấy phần lớn table, nhiều random lookup từ index đắt hơn sequential scan. Correlation giữa index order và physical rows, covering và cache thay đổi break-even. Partial index chỉ cho rare value có thể rất hiệu quả. **Tiêu chí:** không ép index vì “đã tạo”, xem row width/result fraction/actual plan và nhận ra scan song song đôi khi là plan đúng.

### DB-026 — [Senior] Partial/filtered index, expression/function index và generated column phù hợp trường hợp nào?
**Tình huống:** Chỉ 1% record ở trạng thái pending và query thường lọc biểu thức chuẩn hóa email.

**Trả lời:** Partial/filtered index chỉ chứa row thỏa predicate, nhỏ và rẻ cho subset hot nhưng query predicate phải imply filter và parameterization có thể cản match. Expression index hỗ trợ đúng biểu thức deterministic/collation; MySQL thường dùng functional/generated-column index tùy version. Unique partial index bảo vệ uniqueness có điều kiện. **Tiêu chí:** exact expression/type, update cost, stats và portability; không dùng function volatile/time-dependent.

### DB-027 — [Middle] Vì sao “thêm index cho mọi cột” làm hệ thống tệ hơn và phát hiện index thừa ra sao?
**Tình huống:** Write latency, dung lượng và thời gian maintenance tăng sau nhiều đợt tối ưu cục bộ.

**Trả lời:** Mỗi insert/delete/update key phải sửa index, sinh log, lock/latch, cache churn và kéo dài backup/vacuum/rebuild; index đơn cột còn có thể không hỗ trợ query composite. Dùng usage stats kết hợp workload/plan để tìm unused, duplicate/prefix-overlap, nhưng reset stats, FK enforcement và query hiếm quan trọng là bẫy. Drop theo quy trình quan sát/canary/rollback. **Tiêu chí:** định lượng read benefit/write cost, không xóa chỉ vì counter 0 và giữ constraint-backed index cần thiết.

### DB-028 — [Senior] Đọc execution plan và phân biệt estimated/actual rows, scan/seek, residual predicate và spill như thế nào?
**Tình huống:** Query có cost estimate thấp nhưng runtime cao, temp I/O lớn và row estimate lệch hàng nghìn lần.

**Trả lời:** Bắt đầu từ runtime/waits và operator nơi actual lệch estimated sớm nhất; xem loops × rows, I/O, predicate, lookup, join, sort/hash memory grant và spill. Seek có thể đọc nhiều row rồi residual-filter; scan không mặc định xấu. Actual plan có thể thực thi query và tăng overhead nên thận trọng production. **Tiêu chí:** nối symptom với root như stats/skew/SARGability, không chỉ nhìn phần trăm cost hoặc đề xuất hint ngay.

### DB-029 — [Senior] Nested-loop, hash join và merge join phù hợp input nào và cần memory/order/index ra sao?
**Tình huống:** Join hai bảng lớn bị spill, trong khi một tham số khác lại chỉ trả vài row.

**Trả lời:** Nested loop tốt khi outer nhỏ và inner có indexed lookup, nhưng estimate sai làm lặp khổng lồ. Hash join hợp equality/large unsorted input, cần memory cho build side và spill nếu thiếu; merge join hợp hai input đã sort/index, stream tốt nhưng sort có thể đắt. Optimizer chọn theo cardinality/cost, không phải cú pháp. **Tiêu chí:** chọn build side, hiểu non-equi hạn chế hash, memory/parallelism và parameter-dependent plan.

### DB-030 — [Senior] Parameter sniffing/sensitive plan và prepared statement generic plan gây regression như thế nào?
**Tình huống:** Stored procedure chạy rất nhanh cho tenant nhỏ nhưng cực chậm cho tenant lớn tùy lần compile đầu.

**Trả lời:** Plan compile/cached theo parameter distribution ban đầu có thể tối ưu cho selective hoặc broad value rồi reuse sai; PostgreSQL còn cân custom/generic prepared plan, SQL Server có parameter-sensitive features tùy version. Sửa bằng stats/index/data partition, query variants/bucketing, recompile/optimize hint có kiểm soát hoặc dynamic SQL parameterized. **Tiêu chí:** bắt plan + parameter, không xóa cache toàn hệ thống, cân compile CPU và tránh hint đóng băng plan khi dữ liệu đổi.

## Transaction, concurrency và consistency

### DB-031 — [Middle] ACID thực sự bảo đảm gì và durability phụ thuộc WAL/fsync/replica như thế nào?
**Tình huống:** Database báo commit thành công nhưng cần phân tích điều gì xảy ra nếu process, máy hoặc cả region hỏng ngay sau đó.

**Trả lời:** Atomicity all-or-nothing; Consistency là invariant do schema/transaction đúng đưa state hợp lệ sang hợp lệ; Isolation giới hạn quan sát concurrent; Durability giữ commit qua failure trong phạm vi cấu hình. WAL phải được flush tới stable storage trước data page; disabled fsync/lying storage có thể phá durability. Local durable không đồng nghĩa region-durable—cần synchronous remote acknowledgement phù hợp RPO, đổi lấy latency/availability. **Tiêu chí:** phân biệt DB consistency với distributed consistency, nêu failure domain và kiểm tra restore chứ không chỉ replication.

### DB-032 — [Middle] Dirty read, non-repeatable read, phantom và lost update xuất hiện ở isolation level nào?
**Tình huống:** Chọn isolation cho quy trình giữ chỗ tồn kho mà không khóa quá mức.

**Trả lời:** ANSI: Read Uncommitted cho dirty; Read Committed chặn dirty nhưng có non-repeatable/phantom và lost update nếu read-modify-write; Repeatable Read chặn thêm theo định nghĩa nhưng phantom/serialization semantics khác engine; Serializable tương đương một thứ tự tuần tự hoặc abort. Snapshot variants dùng MVCC và anomaly khác. **Tiêu chí:** không thuộc bảng chung rồi áp cho mọi engine; bảo vệ invariant bằng atomic update/lock/serializable và có retry.

### DB-033 — [Senior] MVCC dùng version/snapshot ra sao và vì sao reader không chặn writer vẫn có chi phí?
**Tình huống:** Transaction chạy lâu làm table bloat, vacuum không dọn được và replica lag tăng.

**Trả lời:** Mỗi transaction đọc version visible theo snapshot; update tạo version mới/undo record thay vì ghi đè ngay, nên read thường không block write. Old version phải giữ tới khi không snapshot nào cần, gây bloat/undo growth, WAL, cache và cleanup/vacuum; writer-writer vẫn conflict/lock. Transaction idle lâu và replica slot/snapshot giữ horizon. **Tiêu chí:** engine-specific storage (PostgreSQL tuple vs InnoDB undo), monitor oldest transaction và không quảng cáo MVCC là “không khóa”.

### DB-034 — [Senior] Snapshot isolation ngăn anomaly nào nhưng vẫn có write skew ra sao?
**Tình huống:** Hai bác sĩ đồng thời tự chuyển khỏi ca trực, mỗi transaction vẫn thấy còn một người khác.

**Trả lời:** Snapshot cho mỗi transaction ảnh nhất quán và thường abort khi cùng ghi một row, nên tránh dirty/non-repeatable và lost update kiểu write-write. Nhưng hai transaction đọc cùng predicate rồi ghi hai row khác nhau đều có thể commit, phá invariant tổng—write skew. Sửa bằng serializable/SSI với retry, khóa row/sentinel chung, hoặc mô hình constraint để các giao dịch xung đột thật. **Tiêu chí:** dựng interleaving cụ thể, không gọi snapshot là serializable và xem invariant có biểu diễn bằng UNIQUE/exclusion/atomic statement không.

### DB-035 — [Middle] Deadlock khác lock wait như thế nào; database phát hiện và application retry ra sao?
**Tình huống:** Hai transaction cập nhật cùng hai account theo thứ tự ngược nhau.

**Trả lời:** Lock wait có thể tiến khi holder commit; deadlock là cycle wait-for nên DB chọn victim và rollback. Giảm bằng thứ tự khóa nhất quán (ví dụ account ID tăng), transaction ngắn, index để khóa ít row và không gọi remote khi giữ lock. Application retry *toàn transaction* với backoff/jitter và giới hạn, vì state đã rollback. **Tiêu chí:** thu deadlock graph, không nhầm lock timeout với deadlock, giữ idempotency và không retry vô hạn.

### DB-036 — [Senior] Chọn optimistic concurrency, pessimistic locking hay serializable transaction theo contention thế nào?
**Tình huống:** Cập nhật booking hiếm xung đột ở ngày thường nhưng tranh chấp rất cao khi mở bán.

**Trả lời:** Optimistic dùng version/compare-and-swap, tốt khi conflict hiếm nhưng dưới contention cao gây retry storm. Pessimistic `SELECT ... FOR UPDATE`/lock sớm giảm wasted work nhưng tăng wait/deadlock và không khóa được “row chưa tồn tại” nếu thiếu range/constraint. Serializable bảo vệ invariant rộng bằng lock/SSI nhưng có abort; cần bounded retry. **Tiêu chí:** quyết định theo conflict rate, duration, cost retry/fairness; load-test giờ cao điểm và không giữ DB transaction qua tương tác người dùng.

### DB-037 — [Middle] Tránh lost update cho counter hoặc state transition bằng atomic SQL/version column như thế nào?
**Tình huống:** Nhiều worker cùng tăng số dư hoặc chuyển trạng thái order từ pending.

**Trả lời:** Dùng `UPDATE ... SET count=count+1` là atomic thay vì read rồi write giá trị mới. State transition dùng compare-and-set: `UPDATE orders SET status='paid', version=version+1 WHERE id=? AND status='pending' AND version=?`; affected rows 0 nghĩa conflict/replay. Với số dư, constraint không âm và transaction ledger thường an toàn/auditable hơn counter mutable. **Tiêu chí:** kiểm tra row count, retry/reload có giới hạn, overflow và không coi ORM tracking là concurrency control tự động.

### DB-038 — [Senior] Predicate/range lock, next-key/gap lock và phantom protection khác nhau giữa các engine ra sao?
**Tình huống:** Quy tắc “không được có hai booking giao nhau” không thể bảo vệ chỉ bằng row lock hiện có.

**Trả lời:** Row lock không khóa row chưa tồn tại; serializable có thể dùng key-range/predicate mechanism để ngăn hoặc phát hiện insert làm đổi predicate. InnoDB Repeatable Read dùng next-key/gap locks cho locking range scan tùy index; SQL Server serializable có key-range lock; PostgreSQL SSI theo dõi predicate dependency và abort thay vì chặn tương tự. Overlap thường tốt hơn với PostgreSQL exclusion constraint hoặc materialized slot/guard row. **Tiêu chí:** yêu cầu index/query phù hợp, hiểu engine/version và test interleaving chứ không dựa tên isolation.

### DB-039 — [Senior] Xác định transaction boundary thế nào để vừa giữ invariant vừa tránh transaction dài?
**Tình huống:** Một request mở transaction rồi gọi HTTP service, khiến lock và connection bị giữ hàng chục giây.

**Trả lời:** Transaction bao nhóm read/write phải atomic trong một datastore, bắt đầu muộn và commit sớm; chuẩn bị/validate không cần lock ở ngoài. Không giữ transaction qua HTTP/user input; ghi intent/outbox rồi gọi async, hoặc Saga/compensation. Timeout/cancellation phải rollback và trả connection sạch về pool. **Tiêu chí:** chỉ ra invariant/crash window, isolation, idempotency và telemetry tuổi transaction/lock; không chia transaction nếu làm mất tính đúng đắn.

### DB-040 — [Senior] Khi nào dùng distributed transaction/2PC, Saga orchestration/choreography hoặc compensation?
**Tình huống:** Tạo order phải phối hợp payment, inventory và shipping trên các database độc lập.

**Trả lời:** 2PC cho atomic commit khi mọi participant/support và blocking/coordinator availability chấp nhận được; operationally đắt. Saga chia local transaction + event, orchestration dễ quan sát flow trung tâm, choreography ít coupling trung tâm nhưng dễ event spaghetti. Compensation là business action, không phải rollback hoàn hảo—payment refund có thể fail/fee. **Tiêu chí:** durable state machine/outbox, idempotent step, timeout/retry, ordering và manual recovery; phát biểu consistency/invariant nào tạm thời bị nới.

## Đặc thù engine và vận hành hiệu năng

### DB-041 — [Senior] PostgreSQL WAL, VACUUM/autovacuum, HOT update và transaction ID wraparound liên quan nhau thế nào?
**Tình huống:** Table update nhiều bị bloat, autovacuum không theo kịp và disk tăng liên tục.

**Trả lời:** Update tạo tuple version mới và WAL cho recovery/replication; VACUUM đánh dấu/recycle dead tuple khi xmin horizon cho phép, ANALYZE cập nhật stats. HOT update tránh sửa index nếu cột indexed không đổi và còn chỗ cùng page; fillfactor có thể giúp. Transaction/slot cũ giữ dead tuple; autovacuum freeze XID ngăn wraparound, bỏ mặc có thể dẫn shutdown bảo vệ. **Tiêu chí:** đo dead tuples, oldest xmin/slot, vacuum progress/WAL; không chạy `VACUUM FULL` production tùy tiện vì rewrite/lock.

### DB-042 — [Senior] SQL Server clustered index, tempdb, columnstore và Query Store hỗ trợ workload nào?
**Tình huống:** Hệ thống vừa có OLTP point lookup vừa có báo cáo scan lớn và cần điều tra plan regression.

**Trả lời:** Clustered rowstore phù hợp ordered/range OLTP theo key; nonclustered cover lookup. Columnstore nén theo cột và batch mode tốt cho scan/aggregate, có thể clustered cho warehouse hoặc nonclustered hybrid nhưng write delta/maintenance cần đo. tempdb phục vụ spill, sort, temp object, row versioning nên contention/I/O quan trọng. Query Store lưu query/plan/runtime history để tìm/force plan có kiểm soát. **Tiêu chí:** không coi plan forcing là chữa gốc, xem memory grant/spill, stats và tách workload khi resource cạnh tranh.

### DB-043 — [Senior] InnoDB clustered primary key, redo/undo log và binary log đảm nhận vai trò gì?
**Tình huống:** Phân tích crash recovery, MVCC và replication khi MySQL nhận nhiều transaction concurrent.

**Trả lời:** InnoDB data cluster theo PK; redo log ghi thay đổi page cho durability/crash recovery, undo giữ before-version để rollback/MVCC. MySQL binary log ghi logical replication/PITR ở server layer; commit cần phối hợp redo và binlog để không lệch, với durability phụ thuộc `innodb_flush_log_at_trx_commit`/`sync_binlog`. Secondary index chứa PK. **Tiêu chí:** phân biệt ba log, purge/long transaction, group commit và không gọi replica là backup.

### DB-044 — [Senior] Quy trình điều tra và tối ưu một slow query production nên đi theo thứ tự nào?
**Tình huống:** Không được phép thử index tùy tiện trên production và query chỉ chậm vào giờ cao điểm.

**Trả lời:** Xác nhận symptom/SLA và query fingerprint+parameters; tách DB time khỏi pool/network/app, xem waits, blocking, CPU/I/O/cache và concurrency. Thu plan an toàn, actual-vs-estimate, stats/skew; tái hiện trên dữ liệu gần thật rồi ưu tiên sửa query/SARGability, index hay model. Canary, đo trước/sau, theo dõi write/storage và có rollback. **Tiêu chí:** không tối ưu một execution cô lập, kiểm tra plan regression/parameter, tránh chạy `EXPLAIN ANALYZE` cho DML nguy hiểm tùy engine.

### DB-045 — [Senior] Table partitioning giúp pruning/maintenance nhưng không thay thế index hoặc sharding như thế nào?
**Tình huống:** Bảng event hàng tỷ dòng cần xóa theo tháng và query chủ yếu theo thời gian cộng tenant.

**Trả lời:** Partition theo time cho pruning nếu predicate chứa partition key và drop/detach partition nhanh hơn delete; mỗi partition vẫn cần index phù hợp. Quá nhiều partition tăng planning/metadata; query bỏ key quét nhiều partition. Partition vẫn trong một DB/resource domain, không tự scale write/compute như sharding. Unique/FK toàn partition có hạn chế theo engine. **Tiêu chí:** retention, late data/default partition, automation tạo partition, composite subpartition chỉ khi đo được và kiểm tra pruning trong plan.

### DB-046 — [Middle] Bulk insert/update/delete nên batch, stage và log như thế nào để tránh khóa và phình transaction log?
**Tình huống:** Import 100 triệu record mà hệ thống OLTP vẫn phải phục vụ bình thường.

**Trả lời:** Dùng bulk protocol/COPY, staging table rồi validate/merge theo set; batch theo log/lock/latency budget và commit checkpoint idempotent. Tạm hoãn hoặc rebuild nonessential index/constraint chỉ khi có cửa sổ và vẫn validate dữ liệu; throttle theo replica lag/log/disk. Bulk delete theo key range hoặc partition drop. **Tiêu chí:** không row-by-row, xử lý duplicate/restart, recovery model/minimal logging đúng engine và đo ảnh hưởng concurrent workload.

### DB-047 — [Senior] Connection pool sizing, timeout và transaction leak ảnh hưởng database ra sao?
**Tình huống:** Tăng pool từ 100 lên 1.000 lại làm throughput giảm và timeout nhiều hơn.

**Trả lời:** Connection/session tiêu RAM và active query tranh CPU/I/O/lock; vượt capacity làm queue chuyển từ app sang DB, tăng context switch và tail latency. Pool nên bounded theo DB capacity và tổng tất cả instance, với acquisition/command/transaction timeout riêng, backpressure và circuit breaker. Trả connection phải rollback/reset state; leak/idle-in-transaction giữ lock/snapshot. **Tiêu chí:** áp Little’s Law/đo concurrency hữu ích, metric wait/pool utilization, không dùng pool lớn để che slow query.

## NoSQL và mô hình theo access pattern

### DB-048 — [Middle] Document database phù hợp aggregate nào và gặp hạn chế gì với join/constraint/update chéo document?
**Tình huống:** Lưu catalog sản phẩm có thuộc tính linh hoạt nhưng giá và tồn kho cập nhật độc lập.

**Trả lời:** Embed dữ liệu được đọc/ghi cùng, bounded và cùng vòng đời; reference dữ liệu lớn, shared hoặc cập nhật độc lập. Transaction/atomicity thường mạnh nhất trong một document, cross-document join/constraint có thể hạn chế/đắt; document không đồng nghĩa “không schema”—cần validation/version migration. Catalog attributes có thể embed, inventory/pricing reference/projection. **Tiêu chí:** document size/growth, duplication consistency, index nested/array và access pattern; không chọn vì JSON giống DTO.

### DB-049 — [Middle] Key-value store đem lại mô hình consistency/query/TTL nào và phải thiết kế key ra sao?
**Tình huống:** Xây session store hoặc idempotency store với lookup chính xác theo key và lưu lượng rất cao.

**Trả lời:** KV tối ưu get/put/delete theo exact key, query secondary/range tùy sản phẩm; key nên namespace tenant/type/version, phân bố đều và không chứa bí mật raw. TTL thường expiration best-effort, không phải timer chính xác; consistency có thể strong/eventual/quorum tùy store. Giá trị cần version/CAS để tránh lost update. **Tiêu chí:** max item, hot key, eviction/durability, multi-key atomicity và không giả định key scan rẻ.

### DB-050 — [Senior] Wide-column store thiết kế partition key, clustering key và denormalized table theo query như thế nào?
**Tình huống:** Ghi telemetry cực lớn nhưng một tenant nóng có thể tạo hot partition.

**Trả lời:** Partition key quyết định node/locality; clustering key sắp row trong partition và hỗ trợ range theo prefix. Thiết kế một table/projection cho query cụ thể, tránh cross-partition scan/secondary index không phù hợp. Bucket tenant theo time/hash để giới hạn partition và phân tải, nhưng query phải fan-out/merge; ước lượng row/bytes mỗi partition. **Tiêu chí:** skew/hotspot, compaction/tombstone/TTL, consistency level và duplicate projection được cập nhật idempotent.

### DB-051 — [Middle] Graph database tốt hơn relational recursive query khi nào?
**Tình huống:** Cần truy vấn quan hệ nhiều hop, đường đi và neighborhood trên mạng gian lận.

**Trả lời:** Graph DB lưu adjacency/index-free traversal nên thuận lợi khi traversal biến độ sâu, nhiều loại edge/property và pattern/path là workload chính. Relational với junction+recursive CTE vẫn tốt cho depth bounded, joins/reporting và constraint quen thuộc. Traversal có thể bùng nổ theo branching dù dùng graph; cần limit/direction/selective start. **Tiêu chí:** benchmark query thực, consistency/sharding/tooling, không chọn graph chỉ vì domain có “quan hệ”.

### DB-052 — [Senior] Vì sao NoSQL thường “query-first modeling” và cùng dữ liệu có thể được nhân bản vào nhiều projection?
**Tình huống:** Một logical entity phải phục vụ timeline theo user, tra cứu theo ID và aggregate theo ngày.

**Trả lời:** Không có arbitrary join/secondary query rẻ, nên partition/sort shape được thiết kế từ access pattern và scale; một write phát nhiều projection như by-id, user timeline, daily aggregate. Một stream/source of truth + outbox/CDC cập nhật idempotent, versioned; chấp nhận eventual consistency theo SLA. Cần rebuild, reconciliation và chống out-of-order. **Tiêu chí:** liệt kê query cùng cardinality/partition bound, write amplification, fan-out-on-write/read và ownership schema.

## Dữ liệu phân tán, tích hợp và an toàn

### DB-053 — [Senior] CAP và PACELC giúp đánh giá distributed database như thế nào mà không biến thành lựa chọn nhị phân đơn giản?
**Tình huống:** Product yêu cầu vừa luôn ghi được qua network partition vừa đọc nhất quán ở mọi region.

**Trả lời:** Khi partition P xảy ra, một operation không thể đồng thời linearizable consistency và availability cho mọi phía; hệ thống chọn fail/đợi quorum (C) hoặc chấp nhận divergence (A) theo operation. Không có partition, PACELC nhắc trade latency với consistency/coordination. Đây không phải nhãn toàn database: read/write/quorum/session có thể khác, và network partition không thể “chọn bỏ”. **Tiêu chí:** định nghĩa availability/CAP consistency đúng, đưa failure timeline và gắn lựa chọn với invariant/business.

### DB-054 — [Senior] Leader–follower replication đồng bộ/bất đồng bộ ảnh hưởng RPO, latency và availability ra sao?
**Tình huống:** Primary hỏng ngay sau khi ack một giao dịch nhưng replica chưa nhận log.

**Trả lời:** Async ack local nhanh/khả dụng hơn nhưng failover có thể mất acknowledged write (RPO>0) và split-brain cần fencing. Sync chờ một/quorum replica giảm RPO trong failure domain đó nhưng tăng write latency và có thể ngừng write khi replica/network lỗi. Replication không ngăn logical delete/corruption. **Tiêu chí:** commit acknowledgement chính xác, quorum intersection/election, lag metric, RTO/failover và kiểm tra client retry với commit outcome không chắc chắn.

### DB-055 — [Senior] Đọc từ replica có thể gặp stale read, read-your-writes và monotonic-read violation; khắc phục thế nào?
**Tình huống:** User vừa cập nhật hồ sơ nhưng refresh lại thấy dữ liệu cũ hoặc trạng thái lùi.

**Trả lời:** Async replica apply trễ và load balancer có thể gửi hai read tới replica ở vị trí log khác nhau. Sau write, pin session/key về leader một thời gian hoặc mang commit LSN/token và chỉ đọc replica đã catch up; sticky replica cho monotonic read nhưng failover cần token. Critical read dùng leader/quorum. **Tiêu chí:** đo lag theo time và log position, bounded wait/fallback, không dùng wall-clock timestamp làm causal proof.

### DB-056 — [Senior] Chọn shard key, resharding và xử lý hot shard/cross-shard query như thế nào?
**Tình huống:** Multi-tenant database tăng từ một shard lên hàng chục shard nhưng vài tenant lớn chiếm phần lớn tải.

**Trả lời:** Shard key cần xuất hiện trong query/transaction, cardinality cao, phân tải/storage đều và ổn định; tenant key cho locality nhưng whale tenant cần subshard theo bucket/entity. Directory mapping cho move linh hoạt; hash cân bằng nhưng range query fan-out. Reshard dùng dual-read/write hoặc CDC copy + checksum/cutover, kèm routing version. **Tiêu chí:** hot key không chỉ hot shard, cross-shard join/transaction, rebalance bandwidth, failure rollback và tenant isolation.

### DB-057 — [Senior] Sinh global ID và thực thi uniqueness/foreign key xuyên shard có những lựa chọn nào?
**Tình huống:** Order được tạo offline hoặc ở nhiều region nhưng ID phải gần-sortable và không collision.

**Trả lời:** UUID v4 không phối hợp nhưng random; UUID v7/ULID time-ordered; Snowflake-style gồm time+node+sequence nhỏ/sortable nhưng cần node allocation, clock rollback policy. Global uniqueness business key có thể cần routing theo key, registry/consensus, reservation hoặc chấp nhận conflict rồi reconcile. FK xuyên shard thường do service/application kiểm tra và saga, không atomic như local FK. **Tiêu chí:** bit budget, clock/sequence overflow, privacy, ID collision test và tách identity uniqueness khỏi referential consistency.

### DB-058 — [Senior] Cache-aside, write-through, write-behind và invalidation bảo đảm consistency đến mức nào?
**Tình huống:** Cache trả dữ liệu cũ sau update hoặc stampede làm database quá tải khi một hot key hết hạn.

**Trả lời:** Cache-aside đọc miss→DB→set; write DB rồi invalidate có race với reader đang fill, cần version/key generation/delayed invalidation tùy bound. Write-through đồng bộ cache+store nhưng dual-write vẫn cần atomic mechanism; write-behind nhanh song có data-loss/order risk. TTL chỉ bound stale gần đúng. Chống stampede bằng single-flight/lease, TTL jitter, stale-while-revalidate và negative cache. **Tiêu chí:** source of truth, failure ordering, hot-key protection, observability hit/stale và không hứa strong consistency từ cache độc lập.

### DB-059 — [Senior] Transactional Outbox giải quyết dual-write và kết hợp consumer idempotency như thế nào?
**Tình huống:** Commit order thành công nhưng publish event thất bại, hoặc publish trước rồi transaction rollback.

**Trả lời:** Ghi business row và outbox event trong cùng local transaction; relay polling hoặc CDC publish sau commit rồi đánh dấu/checkpoint. Relay crash quanh publish tạo duplicate, nên consumer dùng event ID/inbox/unique constraint và business effect cùng transaction. Outbox bảo đảm event không bị bỏ do dual-write, không tự bảo đảm exactly-once/order toàn cục. **Tiêu chí:** partition ordering, retry/backoff/DLQ, retention, schema version và monitor unpublished age.

### DB-060 — [Senior] Change Data Capture dựa trên log khác polling timestamp ra sao?
**Tình huống:** Đồng bộ database sang search index/data warehouse mà không bỏ sót hoặc đọc trùng thay đổi.

**Trả lời:** Log-based CDC đọc commit log nên thấy insert/update/delete, transaction order và ít query source hơn; cần slot/binlog retention, snapshot+stream handoff, schema/DDL handling. Polling `updated_at` dễ bỏ row cùng timestamp, delete và race giữa watermark/pages; vẫn cần tie-break `(time,id)`, soft delete và overlap dedupe. Cả hai thường at-least-once nên sink idempotent/version-aware. **Tiêu chí:** checkpoint theo log position, backpressure/lag, resnapshot và quyền truy cập log.

### DB-061 — [Senior] Thực hiện zero/low-downtime schema migration bằng expand–migrate–contract như thế nào?
**Tình huống:** Thêm cột bắt buộc, đổi kiểu hoặc tách bảng khi nhiều version ứng dụng đang chạy đồng thời.

**Trả lời:** Expand bằng thay đổi backward-compatible (nullable/new table/index online), deploy code đọc/ghi tương thích hoặc dual-write có version; backfill theo batch idempotent và kiểm tra checksum/lag. Chuyển read, validate constraint rồi mới contract cột/đường cũ sau khi mọi instance/job không dùng. DDL lock/rewrite khác engine/version nên thử dữ liệu thật. **Tiêu chí:** rollback từng pha, observability, race dual-write/CDC, default volatile và không `NOT NULL`/type rewrite một bước trên bảng lớn.

### DB-062 — [Senior] Backup full/incremental, WAL/binlog archive và point-in-time recovery tạo chiến lược RPO/RTO ra sao?
**Tình huống:** Một operator xóa nhầm dữ liệu lúc 14:03 và bản sao lỗi đã replicate sang standby.

**Trả lời:** Base/full backup cộng incremental/differential giảm dữ liệu sao chép; archive WAL/binlog cho replay tới ngay trước 14:03. RPO do tần suất/độ bền log archive, RTO do tải base + apply chain + validate/cutover; giữ catalog/key mã hóa ngoài failure domain. Replica không thay backup vì replicate lỗi. **Tiêu chí:** automated restore drill/checksum, retention chain, immutable/offsite copy, chọn timezone/log position và phục hồi sang môi trường riêng trước khi merge.

### DB-063 — [Senior] Thiết kế disaster recovery đa vùng và kiểm chứng failover/failback thế nào?
**Tình huống:** Region chính mất hoàn toàn; runbook tồn tại nhưng chưa từng restore hoặc chuyển traffic thử.

**Trả lời:** Từ business BIA đặt RPO/RTO, chọn active-passive/active-active và sync/async theo latency/failure domain. Failover cần health/election, fencing primary cũ, promote, route/DNS, secret/dependency và client retry; failback phải resync/reconcile divergence, không chỉ đổi DNS ngược. Game day định kỳ đo dữ liệu và thời gian thật. **Tiêu chí:** split-brain, capacity vùng DR, runbook automation/owner, backup độc lập và communication/audit.

### DB-064 — [Senior] Bảo vệ database bằng least privilege, secret rotation, encryption và audit như thế nào?
**Tình huống:** Ứng dụng bị lộ credential hoặc nhân viên nội bộ truy cập dữ liệu nhạy cảm ngoài nhiệm vụ.

**Trả lời:** Tách role per service/read/write/migration, deny public/network, short-lived identity/secret manager và rotation không downtime. TLS in transit, encryption at rest/backup với KMS và key rotation; field/tokenization cho dữ liệu đặc biệt—mã hóa không chặn user DB đã được quyền đọc plaintext. Audit login/DDL/sensitive access gửi tới kho tamper-resistant, alert và retention. **Tiêu chí:** row/tenant security, break-glass, patching, restore key, data masking và kiểm thử quyền định kỳ.

### DB-065 — [Middle] Parameterized query ngăn SQL injection đến đâu và dynamic identifier/query phải xử lý thế nào?
**Tình huống:** API cho phép người dùng chọn cột sort/filter và đội phát triển đang nối chuỗi SQL trực tiếp.

**Trả lời:** Bind parameter tách *value* khỏi SQL grammar nên ngăn value đổi cấu trúc và còn giúp type/plan; không bind được table/column/direction keyword. Dynamic identifier phải ánh xạ allowlist từ enum API sang identifier cố định/quote bằng API dialect, còn filter nên xây AST/query builder với operator allowlist. Stored procedure vẫn injection nếu nối dynamic SQL bên trong. **Tiêu chí:** không tự escape chuỗi, least-privilege giảm blast radius, giới hạn complexity/page size và log template chứ không log secret value.

## Câu hỏi kinh điển bổ sung — Basic đến Senior

### DB-066 — [Basic] ⭐ Viết SQL tìm các email bị trùng và số lần xuất hiện như thế nào?
**Tình huống:** Bảng `users(id, email, created_at)` có email nullable và khác biệt hoa thường; hãy làm rõ normalization, cách xử lý NULL và điều kiện `HAVING`.

**Trả lời:** Nếu business xem khác hoa/thường và khoảng trắng là như nhau, query có thể là:

```sql
SELECT LOWER(TRIM(email)) AS normalized_email, COUNT(*) AS occurrences
FROM users
WHERE email IS NOT NULL
GROUP BY LOWER(TRIM(email))
HAVING COUNT(*) > 1;
```

`WHERE` quyết định có coi NULL là một nhóm cần báo hay không; bỏ nó sẽ gom mọi NULL thành một group dù UNIQUE semantics với NULL khác nhau theo engine. Time thường O(n) hash aggregate hoặc O(n log n) sort, và có thể cần expression/generated-column index cho dữ liệu lớn. **Pitfall:** normalization phải theo collation/Unicode/business, không tùy tiện `LOWER`; query chỉ phát hiện, chưa ngăn race. **Follow-up Senior:** backfill normalized column, chọn survivor bằng `ROW_NUMBER()`, sửa reference/audit rồi tạo UNIQUE constraint online; mọi writer phải dùng cùng canonicalization.

### DB-067 — [Basic] ⭐ `UNION` và `UNION ALL` khác nhau về kết quả và chi phí như thế nào?
**Tình huống:** Hai bảng archive/live có thể chứa cùng `order_id`; hãy chọn phép hợp dựa trên yêu cầu giữ duplicate, không dùng dedup để che lỗi dữ liệu.

**Trả lời:** `UNION ALL` nối mọi row, giữ duplicate và thường chỉ append/concatenate; `UNION` áp DISTINCT trên *toàn bộ cột output*, cần hash hoặc sort nên tốn CPU/memory/temp I/O hơn. Hai nhánh phải có số cột và type tương thích; `ORDER BY` toàn kết quả đặt ở cuối. Nếu cùng order xuất hiện ở hai nguồn do overlap, phải định nghĩa source priority/version rồi dedup có chủ đích bằng key/window, không mong `UNION` sửa vì hai row khác field vẫn không bằng. **Pitfall:** dùng `UNION` theo thói quen che duplicate và làm plan spill. **Follow-up Senior:** partition pruning/source boundary có thể bảo đảm disjoint để dùng ALL; nếu dedup hàng tỷ row, prefilter range và chọn record bằng `ROW_NUMBER() OVER(PARTITION BY order_id ORDER BY version DESC)`.

### DB-068 — [Basic] ⭐ PRIMARY KEY, UNIQUE và FOREIGN KEY bảo vệ ba loại invariant nào?
**Tình huống:** Thiết kế `customers`, `orders` và external customer code; hãy chọn constraint cho identity, business uniqueness và referential integrity.

**Trả lời:** `customers.id` và `orders.id` là PRIMARY KEY: định danh row, unique và non-null; mỗi bảng có một PK nhưng có nhiều candidate UNIQUE. External code là business key, thường `UNIQUE(tenant_id, external_code)` nếu scope theo tenant. `orders.customer_id REFERENCES customers(id)` là FK, ngăn orphan và định nghĩa RESTRICT/CASCADE/SET NULL theo lifecycle. Constraint DB bảo vệ mọi writer và race; application validation chỉ bổ sung UX. **Pitfall:** NULL trong UNIQUE khác theo engine, FK không tự tạo index ở phía child trong mọi engine, cascade có thể xóa rộng. **Follow-up Senior:** natural so với surrogate key, deferred constraint, soft-delete conditional uniqueness và migration orphan hiện có phải được quyết định rõ.

### DB-069 — [Basic] ⭐ `DELETE`, `TRUNCATE` và `DROP` khác nhau ra sao?
**Tình huống:** Cần dọn dữ liệu test nhưng vẫn giữ schema; hãy phân tích filter, logging/locking, transaction rollback, trigger và reset identity theo từng engine.

**Trả lời:** `DELETE` là DML, có `WHERE`, chạy row-level delete semantics/trigger và thường log nhiều; không có WHERE thì giữ table/schema nhưng xóa mọi row. `TRUNCATE` không có filter, thường deallocate page nhanh hơn, lấy lock mạnh hơn, có hạn chế FK và có thể reset identity. `DROP TABLE` xóa cả object/schema metadata nên không phù hợp nếu muốn giữ bảng. Rollback, trigger và identity của TRUNCATE khác PostgreSQL/SQL Server/MySQL và version, phải tra engine thay vì phát biểu tuyệt đối. **Pitfall:** chạy nhầm môi trường hoặc thiếu WHERE là destructive; replica/log/backup vẫn bị ảnh hưởng. **Follow-up Senior:** ưu tiên ephemeral test database/transaction fixture hoặc drop partition; thêm guard môi trường, least privilege, backup/restore test và estimate lock/log trước bulk cleanup.

### DB-070 — [Basic] ⭐ Dùng LEFT JOIN để đếm số nhân viên của mọi phòng ban, kể cả phòng ban rỗng, như thế nào?
**Tình huống:** Có `departments(id, name)` và `employees(id, department_id)`; hãy giải thích vì sao `COUNT(*)` có thể cho kết quả sai đối với phòng ban không có nhân viên.

**Trả lời:** Dùng cột non-null phía phải để đếm:

```sql
SELECT d.id, d.name, COUNT(e.id) AS employee_count
FROM departments AS d
LEFT JOIN employees AS e ON e.department_id = d.id
GROUP BY d.id, d.name;
```

LEFT JOIN tạo một null-extended row cho phòng rỗng; `COUNT(*)` đếm row đó thành 1, còn `COUNT(e.id)` bỏ NULL nên trả 0. Index `employees(department_id)` hỗ trợ join, nhưng optimizer vẫn có thể chọn scan tùy kích thước. **Pitfall:** predicate về employee đặt trong WHERE có thể loại null row và biến semantics thành INNER; đặt trong ON nếu vẫn muốn giữ department. **Follow-up Senior:** nhiều one-to-many join có thể nhân count; preaggregate hoặc `COUNT(DISTINCT ...)` chỉ khi đúng business grain.

### DB-071 — [Basic] ⭐ Chuẩn hóa bảng đơn hàng dạng spreadsheet có repeating group thành các bảng quan hệ như thế nào?
**Tình huống:** Một row chứa thông tin khách hàng và các cột `product1/qty1`, `product2/qty2`; hãy xác định key, bảng Order/OrderLine và anomaly được loại bỏ.

**Trả lời:** Tách `Customer(customer_id,...)`, `Order(order_id, customer_id, ordered_at,...)`, `Product(product_id,...)` và `OrderLine(order_id, line_no/product_id, quantity, unit_price_snapshot,...)`. Repeating columns vi phạm khả năng biểu diễn số line tùy ý và gây schema change cho product3; OrderLine dùng PK `(order_id,line_no)` cùng FK. Dữ liệu khách/product không lặp trên mọi order/line nên tránh update anomaly; order không mất khi xóa product cuối. **Pitfall:** giá tại lúc mua là fact của line, không join giá hiện tại rồi thay lịch sử; quantity cần CHECK. **Follow-up Senior:** xác định aggregate/lifecycle, candidate key, refund/shipment split và chỉ denormalize read model sau khi có source-of-truth/reconciliation.

### DB-072 — [Basic] ⭐ Scalar, non-correlated và correlated subquery khác nhau như thế nào?
**Tình huống:** Tìm nhân viên có lương cao hơn mức trung bình của chính phòng ban; hãy viết query đúng và giải thích optimizer có thể decorrelate hay không.

**Trả lời:** Query correlated tham chiếu row ngoài:

```sql
SELECT e.*
FROM employees AS e
WHERE e.salary > (
  SELECT AVG(e2.salary)
  FROM employees AS e2
  WHERE e2.department_id = e.department_id
);
```

Scalar subquery phải trả tối đa một row/một cột; `AVG` đáp ứng. Non-correlated không tham chiếu outer query và về logic có thể tính độc lập; correlated được đánh giá theo outer row trong semantics, nhưng optimizer có thể decorrelate thành preaggregate+join nên không được suy chắc “chạy n lần” từ syntax. **Pitfall:** department NULL không match bằng `=`, AVG của tập rỗng là NULL. **Follow-up Senior:** viết CTE aggregate per department rồi join để grain rõ, so actual plan/index `(department_id, salary)` và tránh correlated subquery có side effect/volatile function.

### DB-073 — [Middle] ⭐ Lấy top 3 mức lương mỗi phòng ban bằng window function và xử lý tie như thế nào?
**Tình huống:** Business có thể muốn đúng ba nhân viên hoặc tất cả nhân viên đồng hạng ở ba mức lương cao nhất; hãy chọn `ROW_NUMBER`, `RANK` hoặc `DENSE_RANK`.

**Trả lời:** Với đúng ba người, dùng deterministic tie-break:

```sql
WITH ranked AS (
  SELECT e.*,
         ROW_NUMBER() OVER (
           PARTITION BY department_id ORDER BY salary DESC, id
         ) AS rn
  FROM employees AS e
)
SELECT * FROM ranked WHERE rn <= 3;
```

Muốn mọi người thuộc ba *mức lương* cao nhất dùng `DENSE_RANK()` chỉ ORDER BY salary; `RANK` tạo khoảng trống sau tie và có thể trả ít hơn ba mức. Sort/window thường O(n log n), có thể được hỗ trợ bởi index `(department_id, salary DESC, id)`. **Pitfall:** filter window cần outer query/QUALIFY tùy dialect; NULL salary ordering khác engine. **Follow-up Senior:** top-N per partition ở scale lớn có plan/sort memory khác nhau; cân lateral/index seek per group và định nghĩa tie/output size bound.

### DB-074 — [Middle] ⭐ Tính running balance bằng window frame và tránh bất ngờ với các row cùng timestamp như thế nào?
**Tình huống:** Bảng ledger có nhiều giao dịch cùng `occurred_at`; kết quả phải deterministic và mỗi row chỉ cộng đúng các giao dịch trước nó.

**Trả lời:** Thêm tie-break unique và chỉ rõ ROWS frame:

```sql
SELECT account_id, occurred_at, id, amount,
       SUM(amount) OVER (
         PARTITION BY account_id
         ORDER BY occurred_at, id
         ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
       ) AS running_balance
FROM ledger;
```

Default frame khi có ORDER BY thường là `RANGE ... CURRENT ROW` theo dialect, có thể cộng toàn bộ peer cùng timestamp vào mỗi row; `ROWS` + ID tạo thứ tự vật lý logic deterministic. Index `(account_id, occurred_at, id)` có thể giảm sort. **Pitfall:** ID phải phản ánh tie policy mong muốn, amount dùng decimal/kiểu đủ rộng, opening balance cần đưa vào model. **Follow-up Senior:** backdated event làm lịch sử sau nó đổi; ledger production cần sequence/version, immutable entry, reconciliation và snapshot balance có checkpoint.

### DB-075 — [Middle] ⭐ Tránh double-count khi join Order, OrderItem và Payment đều là quan hệ one-to-many như thế nào?
**Tình huống:** Báo cáo cần tổng hàng và tổng tiền đã thanh toán theo order nhưng join thẳng ba bảng làm các row nhân chéo.

**Trả lời:** Aggregate từng bảng về đúng grain order trước rồi join:

```sql
WITH item_totals AS (
  SELECT order_id, SUM(quantity * unit_price) AS item_total
  FROM order_items GROUP BY order_id
), payment_totals AS (
  SELECT order_id, SUM(amount) AS paid_total
  FROM payments WHERE status = 'captured' GROUP BY order_id
)
SELECT o.id,
       COALESCE(i.item_total, 0) AS item_total,
       COALESCE(p.paid_total, 0) AS paid_total
FROM orders o
LEFT JOIN item_totals i ON i.order_id = o.id
LEFT JOIN payment_totals p ON p.order_id = o.id;
```

Nếu order có x items và y payments, join thẳng tạo x×y rows. **Pitfall:** `SUM(DISTINCT amount)` không sửa đúng vì hai payment thật có thể cùng amount; filter trong WHERE có thể mất order. **Follow-up Senior:** khai báo grain của mọi metric, kiểm reconciliation và cân materialized aggregate/CDC khi report lớn thay vì đè OLTP.

### DB-076 — [Middle] ⭐ Chọn `EXISTS`, `IN` hay JOIN cho bài toán membership và anti-membership như thế nào?
**Tình huống:** Tìm sản phẩm có đơn hàng và sản phẩm chưa từng được đặt; subquery có thể chứa NULL và một sản phẩm có rất nhiều order line.

**Trả lời:** Membership chỉ cần tồn tại nên dùng semi-join:

```sql
SELECT p.* FROM products p
WHERE EXISTS (SELECT 1 FROM order_lines l WHERE l.product_id = p.id);
```

Anti-membership dùng `NOT EXISTS`; nó không bị một NULL trong subquery làm toàn predicate UNKNOWN như `NOT IN`. INNER JOIN trả một row mỗi match và nhân duplicate, chỉ phù hợp khi cần cột/detail hoặc aggregate. `IN` có thể tương đương semi-join nếu NULL semantics đúng; optimizer thường rewrite nên chọn theo semantics rồi đọc plan. **Pitfall:** `LEFT JOIN ... IS NULL` phải test cột non-null phía phải; DISTINCT che fan-out. **Follow-up Senior:** index `order_lines(product_id)` và stats quyết định plan; correlated EXISTS có thể short-circuit logic nhưng không bảo đảm physical execution cụ thể.

### DB-077 — [Middle] ⭐ Thiết kế composite index cho query equality, range và sort cụ thể như thế nào?
**Tình huống:** Query hot là `WHERE tenant_id=? AND status=? AND created_at>=? ORDER BY created_at DESC LIMIT 50`; hãy chọn thứ tự key và giải thích phần nào của index dùng để seek/sort.

**Trả lời:** Index điển hình là `(tenant_id, status, created_at DESC)`; hai equality tạo prefix, `created_at` tạo range và cùng ordering nên engine có thể seek tới range rồi đọc 50 row theo thứ tự. Nếu cần deterministic pagination thêm `id DESC` sau created_at. Không đặt created_at trước status nếu query luôn equality status, vì range thường chặn khả năng thu hẹp bằng key sau. **Pitfall:** direction có thể scan ngược tùy engine, selectivity/skew và parameter ảnh hưởng plan; index không cover projection thì có lookup. **Follow-up Senior:** INCLUDE cột nhỏ cần đọc, partial index nếu một status cố định và dialect hỗ trợ, nhưng tính write amplification/width và query variants trước khi tạo permutation.

### DB-078 — [Middle] ⭐ Thiết kế index cho trang “latest orders” dùng keyset cursor và projection nhỏ như thế nào?
**Tình huống:** Query lọc theo `tenant_id`, đi lùi theo `(created_at,id)` và chỉ đọc `status,total`; hãy cân nhắc key direction, tie-break và covering cost.

**Trả lời:** Dùng total order và cursor predicate, ví dụ:

```sql
WHERE tenant_id = :tenant
  AND (created_at, id) < (:cursor_time, :cursor_id)
ORDER BY created_at DESC, id DESC
LIMIT 50
```

Index `(tenant_id, created_at DESC, id DESC)` hỗ trợ seek/order; INCLUDE `(status,total)` nếu engine hỗ trợ và read benefit vượt write/storage cost. ID giải tie timestamp và cursor phải mang cả hai; dialect không có tuple comparison thì khai triển `created_at < t OR (created_at=t AND id<id0)`. **Pitfall:** order key mutable làm row dịch giữa page; NULL/collation và direction backward phải rõ. **Follow-up Senior:** ký/version cursor cùng filter, MVCC snapshot/as-of nếu cần view ổn định; InnoDB secondary chứa PK còn PostgreSQL index-only phụ thuộc visibility.

### DB-079 — [Middle] ⭐ Chọn isolation và transaction boundary để tạo báo cáo nhất quán từ nhiều SELECT như thế nào?
**Tình huống:** Báo cáo đọc tổng order rồi tổng payment bằng hai câu SQL trong khi checkout vẫn ghi; hai con số phải thuộc cùng một logical point mà không chặn writer lâu hơn cần thiết.

**Trả lời:** Ở Read Committed phổ biến, mỗi statement có thể thấy snapshot khác nên order mới có thể xuất hiện giữa hai SELECT và tạo số liệu không cùng thời điểm. Mở một read-only transaction với transaction-scoped snapshot/Repeatable Read phù hợp engine để cả hai query thấy cùng version; MVCC thường không block writer, nhưng tên isolation và phantom semantics khác PostgreSQL/MySQL/SQL Server nên phải kiểm chứng. Giữ transaction ngắn, chạy hai aggregate và commit; nếu cần mốc business chính xác có thể đọc watermark/as-of hoặc dùng reporting replica/read model có freshness contract. **Pitfall:** transaction snapshot dài giữ old version/vacuum/undo và connection; đọc async replica có thể không cùng LSN, còn Serializable có thể thừa chi phí/abort. **Follow-up Senior:** báo cáo hàng giờ nên ETL/materialized snapshot theo watermark thay vì transaction OLTP dài; nhiều worker có thể dùng exported snapshot/consistent backup capability của engine và ghi lineage/checksum.

### DB-080 — [Middle] ⭐ Nhiều worker lấy job từ một bảng bằng row locking mà không xử lý trùng như thế nào?
**Tình huống:** Worker cần claim batch job pending với `FOR UPDATE SKIP LOCKED` hoặc primitive tương đương, có thể crash sau khi claim và job phải được retry.

**Trả lời:** Trong transaction ngắn, select các job eligible có deterministic order `FOR UPDATE SKIP LOCKED LIMIT n`, rồi update cùng rows thành `running`, gán `owner`, `lease_until`, tăng attempts và commit; PostgreSQL thường dùng CTE + `UPDATE ... RETURNING`, engine khác có syntax/locking khác. Worker xử lý ngoài transaction, rồi complete bằng compare-and-set owner/version. Lease hết cho phép reclaim; business effect cần idempotency/unique key vì crash sau effect trước complete tạo retry. **Pitfall:** giữ transaction suốt lúc chạy job, không index `(status, available_at, ...)`, starvation do SKIP LOCKED và clock/lease quá ngắn. **Follow-up Senior:** fencing token ngăn worker cũ complete sau lease mới, heartbeat cho job dài, DLQ/attempt policy và queue table bloat/vacuum/partition maintenance.

### DB-081 — [Senior] ⭐ Điều tra plan regression khi cardinality estimate sai nghiêm trọng do dữ liệu skew như thế nào?
**Tình huống:** Cùng prepared query chạy nhanh cho tenant nhỏ nhưng hash join spill và timeout cho tenant lớn; không được xóa toàn bộ plan cache như giải pháp lâu dài.

**Trả lời:** Bắt query fingerprint, parameter/tenant và actual plan của fast/slow case; tìm operator đầu tiên actual lệch estimated, loops, join build side, memory grant/spill và waits. Kiểm stats/histogram freshness, tenant skew, correlation giữa tenant/status, generic/parameter-sniffed plan và implicit predicate. Sửa có thể là extended/filtered stats, composite/partial index, partition whale tenant, hai query variants/bucketing, per-execution/custom/recompile hoặc parameter-sensitive plan feature tùy engine. **Pitfall:** cấp thêm RAM chỉ che estimate, force một plan cho hai distribution có thể đảo lỗi; update stats/cache clear global gây regression/CPU compile. **Follow-up Senior:** canary bằng workload representative, Query Store/plan history, automatic regression guard và threshold chuyển strategy có ADR/owner thay vì hint vĩnh viễn.

### DB-082 — [Senior] ⭐ Thêm UNIQUE constraint online vào bảng lớn đang có duplicate và write concurrent như thế nào?
**Tình huống:** Bảng 1 TB phải unique theo `(tenant_id, external_id)` nhưng production hiện có dữ liệu trùng, NULL và nhiều version ứng dụng cùng ghi.

**Trả lời:** Đầu tiên định nghĩa canonical/NULL semantics và chọn survivor/merge business; inventory duplicate theo partition/range, sửa reference và audit bằng batch idempotent. Trước hoặc song song, deploy mọi writer mới dùng canonical key và conflict-safe create; để chặn writer cũ tạo duplicate trong cửa sổ có thể dùng guard table/trigger tạm hoặc phased routing có đánh giá tải. Tạo unique index bằng cơ chế concurrent/online của engine, xử lý race/build failure rồi attach/validate constraint; monitor lock, log, disk, replica lag. **Pitfall:** `CREATE UNIQUE INDEX` sẽ fail nếu duplicate mới xuất hiện; `COALESCE` sentinel có thể collision, và NULLS NOT DISTINCT/filtered expression khác engine. **Follow-up Senior:** expand–migrate–contract qua nhiều app version, canary partition, checksum/reconciliation, rollback trước enforcement và error contract khi constraint bắt đầu reject traffic.

### DB-083 — [Senior] ⭐ Chọn mô hình NoSQL cho activity feed có fan-out, TTL và hot celebrity như thế nào?
**Tình huống:** Cần đọc feed mới nhất theo user, ghi hàng triệu event/phút và chấp nhận eventual consistency có giới hạn; hãy so sánh document, key-value và wide-column theo access pattern.

**Trả lời:** Thiết kế từ query `latest by user`: wide-column/table timeline với partition key `(user,bucket)` và clustering `(event_time,event_id DESC)` cho range/pagination/TTL; giới hạn kích thước partition. Document chứa array feed dễ chạm size/hot-document và concurrent rewrite; KV tốt cho exact key/cache/page materialized nhưng không tự có range nếu key/order không thiết kế. Fan-out-on-write cho user thường đọc nhanh; celebrity tạo write amplification nên fan-out-on-read/hybrid, lưu source event một lần và merge candidate khi đọc/cache. **Pitfall:** timestamp không unique/order causal, TTL tạo tombstone/compaction, celebrity/user hot partition và duplicate projection. **Follow-up Senior:** quota/backpressure, idempotent event ID, bucket rollover, delete/privacy, rebuild từ log, freshness SLO và benchmark distribution/cost thay vì chọn theo nhãn NoSQL.

### DB-084 — [Senior] ⭐ Xử lý failover replication khi client không biết transaction cuối đã commit hay chưa như thế nào?
**Tình huống:** Primary ack bị mất đúng lúc failover, replica có thể lag và primary cũ có nguy cơ quay lại; hệ thống không được tạo duplicate business effect.

**Trả lời:** Connection error quanh commit tạo *ambiguous outcome*: client không được suy rollback. Mỗi operation có idempotency/business key UNIQUE lưu cùng transaction; retry cùng key trên leader mới sẽ đọc kết quả đã commit hoặc thực hiện một lần nếu chưa có. Promotion chỉ replica đủ log theo policy; asynchronous replication có thể mất acknowledged write theo RPO, synchronous quorum đổi latency/availability. Dùng epoch/fencing/STONITH ngăn primary cũ ghi lại và route chỉ sau leadership chắc chắn. **Pitfall:** auto-increment ID mới cho mỗi retry tạo duplicate, DNS alone không fence, đọc replica lag để kiểm tra có thể cho false negative. **Follow-up Senior:** trả operation status/reconciliation bằng ledger/provider reference, commit LSN/session token, test kill đúng commit boundary và runbook split-brain/failback.

### DB-085 — [Senior] ⭐ Physical và logical replication khác nhau thế nào khi nâng major version hoặc chỉ đồng bộ một phần dữ liệu?
**Tình huống:** Cần migrate gần zero-downtime sang cluster mới, giữ thứ tự thay đổi, xử lý DDL/sequence/large object và có kế hoạch cutover/rollback.

**Trả lời:** Physical replication chuyển WAL/page-level state, thường exact/toàn cluster và chặt với engine/version/storage; phù hợp HA cùng version và restore nhanh. Logical replication phát row/change theo table/publication/binlog, lọc/chuyển schema và thường hỗ trợ cross-major tốt hơn, nhưng DDL, sequence, large object, unlogged table và một số operation không tự replicate tùy engine. Migration cần consistent initial copy gắn log position, replication identity/PK, schema precreate tương thích, monitor slot/binlog retention/lag và validate count/checksum/business totals. Cutover fence/quiesce writers, catch up, sync sequence, validate rồi route. **Pitfall:** schema drift làm apply stop, slot giữ log đầy disk, transaction lớn/ordering và trigger side effect ở target. **Follow-up Senior:** rollback sau target nhận write cần reverse replication hoặc roll-forward; rehearsal đo downtime/RPO, collation/timezone/extension compatibility và cleanup source chỉ sau observation window.
