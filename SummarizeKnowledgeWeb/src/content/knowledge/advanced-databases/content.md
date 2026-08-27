## Bắt đầu từ workload: OLTP và OLAP

Một thiết kế database tốt bắt đầu bằng **access pattern, invariant và SLO**, không bắt đầu bằng tên engine. PostgreSQL phù hợp transaction ngắn, constraint mạnh, update theo row và truy vấn linh hoạt. ClickHouse phù hợp scan/aggregate lượng lớn dữ liệu dạng append, nén theo cột và chấp nhận một số thao tác lifecycle mang tính eventual.

| Câu hỏi | PostgreSQL | ClickHouse |
|---|---|---|
| Mục tiêu chính | OLTP, system of record | OLAP, analytics và telemetry |
| Layout | Row-oriented | Column-oriented |
| Consistency | Transaction/MVCC và constraint phong phú | Insert-oriented; merge, mutation, dedup có thể eventual |
| Khóa quan trọng | PK/unique/FK và index theo operator | `ORDER BY`, partition và MergeTree family |
| Tối ưu | Selectivity, cardinality, join plan, vacuum | Pruning, parts, granules, compression, distributed aggregation |
| Scale read | Replica, partition, cache, query tuning | Shard/replica, pre-aggregation, projection, skipping |

Đừng chuyển dữ liệu OLTP sang ClickHouse rồi kỳ vọng constraint/transaction giống PostgreSQL; cũng đừng ép PostgreSQL phục vụ mọi scan analytics khổng lồ. Kiến trúc thường dùng PostgreSQL làm nguồn sự thật, transactional outbox/CDC làm cầu nối và ClickHouse làm read model phân tích, kèm reconciliation để chứng minh hai phía thống nhất.

## PostgreSQL: nền tảng, SQL nâng cao và mô hình dữ liệu

Nền tảng phải đúng trước khi tối ưu: schema và `search_path`; kiểu dữ liệu theo ý nghĩa; timestamp/time zone; `numeric` cho tiền; `NULL` với logic ba giá trị; PK, unique, check và FK làm tuyến phòng thủ. DML an toàn nên dùng transaction, predicate đủ chặt và `RETURNING` để quan sát kết quả.

SQL nâng cao gồm window function, `DISTINCT ON`, CTE, `LATERAL`, recursive CTE, `GROUPING SETS` và `ROLLUP`. Chọn công cụ theo semantics:

- Window function giữ từng row trong khi tính rank/running aggregate.
- `DISTINCT ON` rất gọn cho latest-per-group nếu `ORDER BY` xác định tie-break hoàn toàn.
- `LATERAL` phù hợp subquery phụ thuộc từng row bên trái.
- Recursive CTE cần termination và cơ chế chống cycle.
- CTE tăng readability nhưng không nên mặc định coi là cache hay optimization fence ở mọi phiên bản.

Mô hình dữ liệu nâng cao dùng domain cho scalar rule tái sử dụng, generated column cho giá trị dẫn xuất cùng row, composite key/foreign key cho tenant boundary, deferred constraint khi invariant chỉ đúng ở cuối transaction, range/multirange và exclusion constraint cho lịch không chồng lấn. Snapshot lịch sử phải lưu giá trị tại thời điểm nghiệp vụ thay vì luôn join vào bản ghi “hiện tại”.

Idempotency record phải ràng buộc cùng key đi với cùng request fingerprint. Transactional outbox được ghi trong cùng transaction với thay đổi domain; worker publish có retry và consumer vẫn phải idempotent vì “exactly once” end-to-end hiếm khi tồn tại.

## PostgreSQL: MVCC, isolation, lock và bảo mật dữ liệu

MVCC cho reader thấy snapshot phù hợp thay vì khóa mọi writer. `READ COMMITTED` lấy snapshot theo statement; `REPEATABLE READ` giữ snapshot theo transaction nhưng vẫn cần hiểu write skew; `SERIALIZABLE` phát hiện dependency nguy hiểm và yêu cầu ứng dụng retry toàn transaction.

Row lock bảo vệ invariant khi read-modify-write. `SELECT ... FOR UPDATE SKIP LOCKED` phù hợp claim job queue, nhưng worker phải có lease/retry/idempotency để xử lý crash. Deadlock xuất hiện khi transaction lấy lock theo thứ tự không nhất quán; database hủy một bên, còn ứng dụng cần retry có backoff. Advisory lock chỉ đúng khi mọi participant cùng tuân thủ protocol—nó không tự bảo vệ row.

Các nguyên tắc transaction:

- Giữ transaction ngắn; không gọi HTTP/broker trong lúc giữ DB lock.
- Chốt isolation theo anomaly cần ngăn, không theo tên nghe “an toàn hơn”.
- Sau statement error, transaction có thể ở trạng thái aborted và phải rollback.
- Timeout phải tạo thành deadline hierarchy từ request đến statement/lock/idle transaction.
- Quan sát blocker/wait event trước khi terminate; cancel query ít phá hủy hơn terminate session.

Function SQL/PL/pgSQL, trigger và dynamic SQL cần giới hạn trách nhiệm. Trigger phù hợp invariant cục bộ/audit nhưng dễ che side effect. `SECURITY DEFINER` phải khóa `search_path`; Row-Level Security cần test matrix theo role/tenant và không thay thế least privilege. View, owner, bypass RLS và connection pool đều có thể làm tenant isolation khác kỳ vọng.

## PostgreSQL: index, optimizer và đường truy cập dữ liệu

Index được chọn theo **operator + sort + workload**, không chỉ theo tên cột. B-tree phục vụ equality/range/order; expression index cần expression query khớp; partial index chỉ dùng khi planner chứng minh predicate; `INCLUDE` có thể hỗ trợ index-only scan nhưng còn phụ thuộc visibility map. GIN phù hợp JSONB/array/full-text, GiST phù hợp range/distance/exclusion, BRIN hữu ích cho bảng cực lớn có tương quan vật lý.

`EXPLAIN (ANALYZE, BUFFERS)` phải được đọc từ estimate đến actual:

1. So sánh estimated rows và actual rows để tìm sai cardinality.
2. Xem scan/join node, loops và row bị loại.
3. Xem buffer hit/read, sort/hash spill và thời gian I/O.
4. Kiểm tra predicate có sargable và type/collation có đúng không.
5. Đo lại cùng dữ liệu/workload đại diện; không kết luận từ một lần chạy cache nóng.

Statistics một cột không mô tả tốt correlation giữa nhiều cột; extended statistics có thể sửa estimate. Nested loop tốt khi outer nhỏ và inner lookup rẻ, hash join tốt cho equality lớn, merge join tốt khi hai phía đã/có thể sort. `work_mem` áp dụng theo operation và worker chứ không phải budget toàn query, nên tăng toàn cục có thể gây memory storm. Prepared statement có custom/generic plan trade-off; data skew có thể làm generic plan rất tệ.

Partitioning phục vụ lifecycle/pruning và đôi khi parallelism, không phải phép màu tăng tốc. Chọn key có số partition hữu hạn, bảo đảm predicate giúp pruning, hiểu giới hạn unique/PK/FK và quản lý attach/detach/index theo partition. JSONB hữu ích cho thuộc tính linh hoạt; field “hot” cần constraint/join/range thường nên được promote thành typed/generated column. Full-text dùng `tsvector/tsquery`; fuzzy/substring thường cần `pg_trgm`.

## PostgreSQL: vacuum, WAL, HA, observability và capacity

Update/delete tạo dead tuple; `VACUUM` làm row version cũ có thể tái sử dụng và bảo vệ transaction ID wraparound. Long-running/idle transaction giữ snapshot cũ, cản vacuum. HOT update có thể giảm index churn khi cột index không đổi và page còn chỗ; `fillfactor` là trade-off giữa density và room cho update. Bloat phải được đo trước khi chọn `VACUUM`, `REINDEX CONCURRENTLY`, `pg_repack` hay rewrite.

WAL bảo đảm thay đổi log được durable trước data page. Checkpoint, full-page image, WAL compression và tốc độ ghi ảnh hưởng I/O burst; `max_wal_size` là mục tiêu mềm, không phải hard cap. `synchronous_commit`, replica sync/async, logged/unlogged table và filesystem durability là các guarantee khác nhau, không được trộn thành một nút “nhanh/chậm”. Checksum và structural verification không thay thế semantic data validation.

Backup chỉ có giá trị sau restore test. `pg_dump` là logical backup; base backup + WAL archive cho PITR. Streaming replication phục vụ HA/read scaling nhưng không thay backup; replication slot có thể giữ WAL đến đầy disk. Failover cần fencing để tránh split brain, DNS/connection routing, timeline và failback plan. RPO/RTO phải được định nghĩa và đo bằng drill.

Observability tối thiểu gồm `pg_stat_activity`, wait event/lock graph, `pg_stat_statements`, table/index stats, `pg_stat_io`, vacuum/index progress, WAL/archive/replication health và log có kiểm soát. Runbook nên tách slow query, lock storm, connection exhaustion và autovacuum/bloat. Capacity plan phải tính data + index + WAL + temp + headroom; memory theo operation × parallel worker × concurrency; pool connection theo throughput/queueing, không theo “càng nhiều càng tốt”.

## PostgreSQL: thay đổi schema và vòng đời production

Zero-downtime migration dùng **expand → backfill → switch → contract**. Trước DDL, đặt lock budget bằng `lock_timeout`, kiểm tra transaction dài và dependency. Add column với constant default trên phiên bản hiện đại có thể nhanh; volatile default hoặc type change có thể rewrite. Backfill theo keyset batch, có throttle, checkpoint và khả năng resume.

Các kỹ thuật an toàn:

- Tạo unique index `CONCURRENTLY`, sau đó attach constraint khi phù hợp.
- Thêm `CHECK NOT VALID`, validate riêng rồi chuyển thành `NOT NULL` để tránh scan giữ lock dài.
- Thêm FK `NOT VALID`, deploy code tương thích hai schema, rồi validate.
- Rename/type change bằng dual-read/write hoặc compatibility view; chỉ contract sau khi không còn consumer cũ.
- Dùng advisory lock cho migration runner nhưng hiểu transaction boundary của lệnh concurrent.
- Monitor progress và có abort threshold; ưu tiên roll-forward khi rollback dữ liệu không an toàn.

Extension phải có inventory, schema tin cậy, dependency và kế hoạch update/drop. Minor upgrade khác major upgrade: major có thể dùng `pg_upgrade`, dump/restore hoặc logical replication blue/green; phải kiểm tra binary, extension, collation, statistics và post-upgrade validation.

Capstone PostgreSQL kết hợp multi-tenant OrderHub: constraint và RLS, checkout chống oversell, outbox, event partition/retention, query inventory + index, benchmark, observability/capacity và backup/failure drill. Definition of done là evidence tái lập, không chỉ DDL chạy thành công.

## ClickHouse: columnar architecture, schema và MergeTree

ClickHouse đọc các cột cần thiết, xử lý vectorized theo pipeline và tận dụng compression. Dữ liệu được ghi thành **parts**, background merge hợp nhất chúng; partition là lifecycle boundary, không phải từng part. Sparse primary index đánh dấu granule chứ không bảo đảm unique. `PREWHERE` và column pruning giảm bytes đọc khi filter sớm.

Kiểu dữ liệu phải đúng miền giá trị trước khi tối ưu dung lượng: integer width, Decimal, `DateTime64` và timezone, UUID/Enum/IP, Array/Tuple/Map/Nested. `Nullable` có chi phí; sentinel chỉ hợp lệ khi domain có giá trị phân biệt rõ. `LowCardinality` tốt cho chuỗi lặp vừa phải nhưng phải đo. Codec chain, sort order và cardinality cùng quyết định compression. `DEFAULT`, `MATERIALIZED`, `ALIAS` có semantics khác nhau; denormalization theo query pattern, không copy mọi thứ vô điều kiện.

Với MergeTree, bốn quyết định riêng là engine, `ORDER BY`, partition key và primary index/granularity:

- `MergeTree` giữ mọi row.
- `ReplacingMergeTree` chọn version trong quá trình merge; duplicate vật lý vẫn có thể tồn tại trước đó.
- `SummingMergeTree` cộng numeric row cùng sorting key khi merge.
- `AggregatingMergeTree` lưu aggregate state và cần hàm merge đúng.
- `CollapsingMergeTree` dùng sign/state-cancel, nhạy với ordering và dữ liệu lỗi.

Sorting key bắt đầu bằng dimension filter ổn định/selective theo workload; partition thường đủ thô như tháng/ngày tùy volume. Partition cardinality quá cao và small inserts tạo quá nhiều parts. `OPTIMIZE ... FINAL` không phải cron job sửa mọi thiết kế.

## ClickHouse: ingestion, analytics và tăng tốc truy vấn

Ingestion nên batch đủ lớn, dùng format streaming như Native/Parquet/JSONEachRow và kiểm soát retry. Async insert gom insert nhỏ nhưng cần hiểu acknowledgement. Retry không tự tạo exactly-once; dùng event ID/version, raw audit table và reconciliation. Backfill theo lát thời gian/key, có cutoff và idempotency để không chồng dữ liệu live.

Analytics gồm conditional aggregate, exact/approximate distinct và quantile, `ROLLUP/CUBE/GROUPING SETS`, funnel, retention/cohort, window và ASOF JOIN. JOIN phải kiểm soát multiplicity; `ANY`/`ALL` thay đổi correctness, không chỉ performance. CTE không mặc định materialize/cache.

Ba công cụ tăng tốc phục vụ ba mục tiêu:

| Công cụ | Mục tiêu | Bẫy chính |
|---|---|---|
| Incremental materialized view | Biến đổi/pre-aggregate block insert mới | Không tự backfill lịch sử; chỉ thấy inserted block |
| Projection | Alternate layout/order trong cùng table | Phải đo planner có dùng và chi phí storage/merge |
| Data-skipping index | Bỏ qua granule theo minmax/set/Bloom | Không phải secondary index kiểu OLTP; correlation quyết định hiệu quả |

Mutation rewrite parts và có thể rất đắt. Delete phạm vi lớn thường nên drop partition; TTL xử lý retention theo row/partition nhưng diễn ra qua merge. Replacing/latest-state cần version/tombstone và query semantics rõ. Late event phải được định tuyến vào partition còn writable và không phá cutoff.

Dictionary phù hợp lookup dimension nhỏ/đọc nhiều; layout và refresh policy ảnh hưởng latency, memory và stale data. Direct JOIN qua dictionary có semantics missing key cần định nghĩa. Chọn hash/partial-merge/grace-hash/direct join bằng benchmark với đúng kích thước phía phải.

## ClickHouse: distributed operation, CDC và schema evolution

Trong cluster, local replicated table lưu dữ liệu; Distributed table route query/insert. Sharding quyết định phân bố, replication quyết định redundancy. Keeper quản coordination metadata; cần topology độc lập failure domain. Insert acknowledgement, distributed queue, quorum và consistency setting phải khớp SLO. Distributed aggregation nên đẩy partial aggregate xuống shard; JOIN lớn có thể broadcast quá nhiều dữ liệu hoặc tạo skew.

Triage dùng `EXPLAIN`, `system.query_log`, `system.parts`, merges, mutations, disks, current queries, memory spill và replication/distribution queues. Hủy query chỉ là mitigation; root cause thường nằm ở pruning, join side, part explosion, skew hoặc resource limit. Query cache mặc định không nên được coi là correctness layer; stale result, read/write cache setting và invalidation phải rõ. Resource governance kết hợp query limit, settings profile, quota và workload scheduler; theo dõi contention thay vì chỉ đặt cap.

Security gồm RBAC, row policy, column exposure, settings profile/quota, network encryption và secret lifecycle. Backup phải có restore verification; monitoring cần error/latency, disk/parts, merge/mutation, replication và Prometheus endpoint. `CHECK TABLE` kiểm tra cấu trúc, không phải data-quality business rule.

PostgreSQL CDC cần contract chứa key, operation, version/order, source time và tombstone. Mô hình bền vững thường có raw audit table và current-state table. Snapshot + stream cutover cần high-water mark, transaction ordering, type mapping/schema evolution, heartbeat/lag và reconciliation. Live PostgreSQL table function chỉ phù hợp lookup/adhoc giới hạn, không thay CDC production.

Kafka engine và S3/S3Queue/file table functions phục vụ ingestion khác nhau. Cần xử lý retry, rejects, consumer lag, object glob/virtual column và backfill idempotent. Schema change lớn dùng expand → migrate → contract hoặc shadow table, benchmark/reconcile trước atomic cutover và giữ rollback path. Capstone ClickHouse yêu cầu SLO/workload contract, query pack, benchmark tái lập, correctness suite và failure drills.

## Học bằng evidence, quiz và capstone

Một thay đổi chỉ được coi là tối ưu khi có baseline và bằng chứng: query, dataset, version/config, plan/system-table snapshot, latency/throughput/bytes/memory trước–sau và correctness check. Không dùng cache nóng, data quá nhỏ hoặc một lần chạy để kết luận.

Checklist thực hành:

- [ ] Nêu invariant dữ liệu, anomaly chấp nhận được và SLO trước DDL.
- [ ] Dùng dataset đủ lớn và có skew/late/duplicate như production.
- [ ] Benchmark cả happy path và concurrency/failure path.
- [ ] Restore backup, không chỉ tạo backup.
- [ ] Reconcile source/target theo count, key, aggregate và sample chi tiết.
- [ ] Có timeout, cancel/rollback, cleanup và cost/resource guardrail.
- [ ] Ghi lại hidden bug: non-sargable query, stale plan/cache, small parts, retry duplicate, MV cutoff hoặc lock queue.

`sourceFolders` giữ ba nguồn độc lập: toàn bộ course `DatabaseAdvance`, câu hỏi `Interview/database.md` và đáp án tương ứng. Bên trong course, hai track `LessionPostresql`/`LessionClickHouse`, quiz, lab và capstone vẫn giữ vai trò riêng nhưng không bị đếm lại như nguồn mới. PostgreSQL và ClickHouse là hai nhánh; phần dùng chung chỉ gom ở workload, schema evolution, observability, backup, CDC và kiểm chứng. Nên học theo thứ tự lesson → practical lab → quiz/answer → capstone/rubric.
