# Practical labs — Đề bài

Mỗi lab phải có thư mục nộp riêng gồm notes.md, setup.sql, solution.sql và evidence/. Không chép solution tham khảo; tự tạo bằng chứng trên máy của bạn trước. Dùng database/schema quiz để không ảnh hưởng dữ liệu khác.

## Quy ước bằng chứng

Mỗi report phải ghi:

- version, cấu hình liên quan, số rows và phân phối dữ liệu;
- query baseline và query sau thay đổi;
- ít nhất ba lần chạy, phân biệt cold/warm cache nếu có thể;
- elapsed, rows/bytes/buffers/temp/memory phù hợp từng database;
- trade-off ghi/disk/consistency và cách rollback;
- một hidden bug bạn chủ động tái hiện.

Không so sánh hai query trả kết quả khác nhau. Luôn đối soát row count/checksum trước khi kết luận nhanh hơn.

---

## PG-L01 — Sargability và covering index

**Mục tiêu:** chứng minh tác động của expression trên cột timestamp, composite order và visibility map.

**Chuẩn bị:** dùng quiz_pg.orders từ đề PostgreSQL.

**Nhiệm vụ:**

1. Đo query tenant 7 trong một ngày bằng date(created_at).
2. Tạo index (tenant_id, created_at) INCLUDE (order_id, total_amount).
3. Viết lại bằng half-open range theo Asia/Bangkok và đo lại.
4. Ghi Index Scan/Bitmap/Seq Scan, rows removed, heap fetches và buffers.
5. Chạy VACUUM (ANALYZE) ngoài transaction, đo lại index-only behavior.
6. Thêm một UPDATE làm 20% rows thay đổi total_amount; đo tác động trước/sau VACUUM.

**Hidden condition:** prepared statement nhận status/date parameter hoặc bảng quá nhỏ có thể tạo plan khác dự đoán. Giải thích chứ không ép planner.

**Hoàn thành khi:** kết quả hai query bằng nhau, có plan trước/sau và giải thích được khi nào index không đáng dùng.

---

## PG-L02 — Race condition và job queue

**Mục tiêu:** tái hiện check-then-act race bằng hai session và sửa bằng statement nguyên tử/row locking.

**Chuẩn bị:** mở hai terminal psql A/B, reset SKU-RED = 5 và jobs về ready.

**Nhiệm vụ:**

1. Ở READ COMMITTED, để A và B cùng SELECT available rồi cùng quyết định đặt 4 sản phẩm. Ghi timeline và kết quả sai nếu application ghi giá trị đã tính.
2. Thay bằng UPDATE ... WHERE available >= quantity RETURNING; chứng minh chỉ một request thành công.
3. Cho A/B claim mỗi worker 10 jobs bằng FOR UPDATE SKIP LOCKED + UPDATE RETURNING.
4. Chứng minh hai tập job_id không giao nhau.
5. Mô phỏng worker crash sau claim; thiết kế lease/reaper và max attempts.

**Hidden condition:** request timeout sau COMMIT rồi client retry có thể đặt hàng hai lần. Thêm reservation_id có unique constraint để chứng minh idempotency.

**Hoàn thành khi:** có timeline lock, query pg_stat_activity/pg_locks và invariant available không âm + job không bị claim đồng thời.

---

## PG-L03 — Skew, statistics và plan stability

**Mục tiêu:** làm planner đối mặt dữ liệu lệch và correlation, rồi sửa estimate có bằng chứng.

**Setup gợi ý:**

~~~sql
DROP TABLE IF EXISTS quiz_pg.skew_orders;
CREATE TABLE quiz_pg.skew_orders AS
SELECT g AS id,
       CASE WHEN g <= 950000 THEN 1 ELSE 2 + g % 100 END AS tenant_id,
       CASE WHEN g <= 900000 THEN 'paid' ELSE 'pending' END AS status,
       now() - (g % 365) * interval '1 day' AS created_at,
       repeat('x', 80) AS payload
FROM generate_series(1, 1000000) g;
CREATE INDEX ON quiz_pg.skew_orders (tenant_id, status, created_at);
ANALYZE quiz_pg.skew_orders;
~~~

**Nhiệm vụ:**

1. So sánh plan tenant 1 với tenant hiếm, literal với PREPARE/EXECUTE lặp lại.
2. Ghi estimated/actual rows và plan shape.
3. Xem pg_stats; tăng statistics target cục bộ và tạo extended statistics (mcv, dependencies) cho tenant_id/status.
4. ANALYZE và đo lại estimate.
5. Quan sát custom/generic plan; nêu biện pháp ở application nếu một generic plan không phù hợp mọi tenant.

**Hidden condition:** một index scan không mặc định nhanh hơn khi tenant 1 chiếm 95%.

**Hoàn thành khi:** report chỉ ra estimate ratio trước/sau và không dùng enable_seqscan = off làm “fix”.

---

## PG-L04 — HOT, bloat và transaction dài

**Mục tiêu:** liên hệ fillfactor/indexed column, HOT update, dead tuples và snapshot horizon.

**Nhiệm vụ:**

1. Tạo hai bảng giống nhau 200.000 rows, fillfactor 100 và 70; index chỉ primary key.
2. Update cột payload không được index năm vòng; so n_tup_upd, n_tup_hot_upd và pg_total_relation_size.
3. Thêm index lên payload hoặc cột cập nhật, chạy thêm vòng và so HOT ratio.
4. Mở transaction A giữ snapshot; ở B update/delete nhiều rows rồi VACUUM. Quan sát n_dead_tup/xact age.
5. Kết thúc A, VACUUM lại và ghi khác biệt.

**Hidden condition:** pg_stat counters không đồng bộ tức thời và size file không luôn giảm sau VACUUM thường.

**Hoàn thành khi:** giải thích được reclaim để reuse khác truncate file trả OS, và đề xuất alert transaction age.

---

## PG-L05 — Partition lifecycle không gián đoạn

**Mục tiêu:** thiết kế range partition hàng tháng, pruning và quy trình attach/detach retention.

**Nhiệm vụ:**

1. Tạo orders_partitioned theo created_at với ba monthly partitions và default partition.
2. Chuyển một tập dữ liệu từ orders, đối soát count/sum.
3. EXPLAIN query một ngày, query bọc date(created_at), query dùng runtime parameter.
4. Tạo partition tháng kế tiếp trước thời hạn; thử insert ngoài bound và quan sát default.
5. Thiết kế detach/archive/drop tháng cũ có precheck, backup và rollback.

**Hidden condition:** unique constraint trên partitioned table phải bao gồm partition key nếu muốn enforce toàn cục bằng index partitioned.

**Hoàn thành khi:** plan chỉ đọc partition cần thiết và runbook không mất row rơi vào default partition.

---

## PG-L06 — Integrity và zero-downtime migration

**Mục tiêu:** kết hợp data modeling nâng cao với migration có lock/WAL budget, resume và rollback.

**Nhiệm vụ:**

1. Tạo migration_lab.orders tối thiểu 300.000 rows, có tenant key và dữ liệu skew.
2. So sánh ADD COLUMN constant default với volatile/default per-row; ghi lock duration, relation size và WAL delta.
3. Thêm token theo expand-contract: nullable → default/dual-write → keyset backfill có checkpoint → reconcile.
4. Dùng CHECK NOT VALID → VALIDATE → SET NOT NULL.
5. Tạo unique index concurrently rồi attach thành constraint; cố tình cancel một build và xử lý invalid index.
6. Thêm idempotency table có request_hash và outbox cùng transaction với một order update.
7. Mô phỏng app version cũ chỉ biết schema cũ trong toàn deployment window.

**Hidden condition:** DDL chờ transaction cũ có thể đứng đầu lock queue và chặn request mới dù bản thân metadata change rất nhanh.

**Hoàn thành khi:** migration resume được sau cancel, invariant không có NULL/duplicate, old/new app contract cùng hoạt động và có rollback từng phase.

---

## PG-L07 — WAL, capacity, timeout và upgrade readiness

**Mục tiêu:** biến durability/capacity/upgrade thành phép đo và recovery evidence.

**Nhiệm vụ:**

1. Chụp pg_stat_wal, pg_stat_checkpointer, pg_wal bytes, database/index size và durability settings.
2. Chạy một workload logged; đo WAL/FPI/checkpoint delta. Thử SET LOCAL synchronous_commit = off trong lab và mô tả ACK contract, không tắt fsync/full_page_writes.
3. Tính disk/WAL runway và upper-bound memory từ concurrency × plan nodes × workers × work_mem.
4. Tái hiện lock_timeout, statement_timeout và transaction aborted; cancel đúng PID rồi so với terminate.
5. Inventory extension, dependency, collation version và viết decision record pg_upgrade vs dump/restore vs logical blue/green.
6. Tạo logical backup, restore vào database tách biệt, chạy invariant và đo RTO. Viết PITR/WAL-chain checklist dù local compose chưa bật archive.

**Hidden condition:** client timeout/disconnect không chứng minh transaction chưa commit; workload test phải có idempotency key trước khi retry.

**Hoàn thành khi:** có capacity sheet, WAL/checkpoint evidence, timeout timeline, restore log và upgrade preflight/rollback checklist.

---

## CH-L01 — Sort key và pruning benchmark

**Mục tiêu:** đo tác động ORDER BY thay vì suy luận từ tên key.

**Chuẩn bị:** dùng quiz_ch.events, tạo events_bad cùng schema nhưng ORDER BY (event_id).

**Nhiệm vụ:**

1. INSERT SELECT toàn bộ dữ liệu sang events_bad.
2. Chạy cùng query tenant 7 + 7 ngày + event_type trên hai bảng, ít nhất ba lần.
3. Lưu EXPLAIN indexes = 1, read_rows/read_bytes, elapsed và compression size.
4. Thử query lookup event_id; giải thích vì sao winner đổi.
5. Thử một skipping index trên event_type hoặc properties device, MATERIALIZE INDEX, đo lợi ích/chi phí.

**Hidden condition:** cache và part count khác nhau làm benchmark không công bằng; chạy OPTIMIZE chỉ khi ghi rõ tác động và so cấu trúc part.

**Hoàn thành khi:** có ít nhất một query tốt hơn và một query xấu hơn với sort key mới, kèm trade-off.

---

## CH-L02 — Part explosion và batching

**Mục tiêu:** tái hiện small inserts ở quy mô an toàn và chứng minh batching giảm parts.

**Chuẩn bị:** tạo events_tiny và events_batch LIKE events. Không chạy quá 100 single-row inserts trên laptop.

**Nhiệm vụ:**

1. Gửi 50–100 INSERT riêng vào events_tiny bằng loop của client.
2. Gửi cùng số rows trong một INSERT vào events_batch.
3. So system.parts: active parts, rows/part, bytes/part; quan sát system.merges trong vài phút.
4. Lặp lại single-row workload với async_insert = 1, wait_for_async_insert = 1.
5. Viết batching policy theo rows, bytes và max latency.

**Hidden condition:** background merge có thể làm số part thay đổi giữa hai lần đo. Ghi timestamp/snapshot và dùng system.part_log nếu được bật.

**Hoàn thành khi:** chứng minh được parts/insert giảm và nêu durability semantics của async insert.

---

## CH-L03 — Eventual dedup và out-of-order events

**Mục tiêu:** hiểu ReplacingMergeTree không phải uniqueness và thiết kế serving query đúng trước merge.

**Nhiệm vụ:**

1. Tạo entity_updates dùng ReplacingMergeTree(version) ORDER BY (tenant_id, entity_id).
2. Insert version 1, 3, 2 và duplicate version 3 theo nhiều block.
3. So SELECT thường, FINAL và argMax trước/sau background merge.
4. Tạo conflict cùng version nhưng payload khác; quan sát nondeterminism/rule thiếu.
5. Thêm event_id/idempotency contract và tombstone strategy.

**Hidden condition:** OPTIMIZE FINAL che eventual window nhưng không phải giải pháp serving bền vững.

**Hoàn thành khi:** query state hiện tại đúng dù parts chưa merge và report nêu cost của FINAL.

---

## CH-L04 — Materialized view và backfill cutoff

**Mục tiêu:** tạo aggregate state đúng kiểu, backfill không gap/double count và đối soát.

**Nhiệm vụ:**

1. Tạo bảng target AggregatingMergeTree cho daily users/revenue.
2. Chọn T0 theo ingested_at; tạo MV nhận live inserts.
3. Insert một batch live sau T0.
4. Backfill chỉ miền trước T0 vào target bằng State functions.
5. Đọc bằng Merge functions và đối soát theo tenant/day/event_type.
6. Cố tình backfill overlap một bucket, tái hiện double revenue rồi mô tả correction.

**Hidden condition:** unique user state không thể đối soát bằng cách cộng daily scalar của các block; phải merge states đúng cách.

**Hoàn thành khi:** source/target khớp theo contract và có query phát hiện overlap/gap.

---

## CH-L05 — Retention, mutation và resource safety

**Mục tiêu:** so sánh row mutation, TTL và drop partition trên dữ liệu lab.

**Nhiệm vụ:**

1. Clone events thành bảng retention_lab có monthly partition và TTL ngắn chỉ dùng cho lab.
2. Chạy DELETE mutation trên một predicate nhỏ; theo dõi system.mutations đến khi done.
3. Đo parts/bytes/rows trước và sau merge; phân biệt logical result với disk reclaim.
4. Thử DETACH PARTITION trên một partition cũ, kiểm tra rồi ATTACH lại.
5. Viết runbook retention production gồm capacity, schedule, SLO và rollback.

**Hidden condition:** TTL/mutation trên replicated cluster có trạng thái theo replica; lệnh local thành công chưa chứng minh cluster hoàn tất.

**Hoàn thành khi:** không dùng OPTIMIZE FINAL như bước định kỳ mặc định và nêu đủ disk headroom/monitoring.

---

## CH-L06 — Dictionary serving, cache và schema-quality cutover

**Mục tiêu:** vận hành lookup dimension đúng semantic trong lúc schema thay đổi và workload cạnh tranh.

**Nhiệm vụ:**

1. Tạo product_dimension + HASHED dictionary, kiểm tra missing key, refresh age/error và memory.
2. Inject duplicate dimension; so ALL, ANY và direct JOIN. Benchmark parallel_hash/grace_hash với read_rows, memory và elapsed.
3. Tái hiện query-cache stale result sau INSERT; viết freshness contract cho dashboard và reconciliation.
4. Tạo dashboard/backfill workloads + settings profile, chạy hai query cạnh tranh và quan sát system.scheduler/processes.
5. Migrate một table sang shadow layout/type, dual-write/catch-up, đối soát theo partition, EXCHANGE và rollback.
6. Tạo accepted/rejected quality path có mutually exclusive predicates và reason metrics.

**Hidden condition:** dictionary/cache/MV/grants có dependency theo object/name và không tự hiểu intent của EXCHANGE TABLES.

**Hoàn thành khi:** lookup không mất multiplicity ngoài contract, cache có bounded staleness, quality accepted + rejected khớp input và cutover rollback được.

---

## CH-L07 — Kafka/Redpanda ingestion recovery (optional, resource-heavy)

**Mục tiêu:** kiểm chứng at-least-once streaming, reject path, lag và replay trên broker miễn phí local.

**Tài nguyên:** optional; cần thêm khoảng 1–2 GB RAM và các port 19092/19644. Có thể nộp design + recorded evidence nếu máy không đủ. Không bắt buộc để pass core roadmap.

**Nhiệm vụ:**

1. Từ root, khởi động Compose cùng LessionClickHouse/docker-compose.integrations.yml với profile streaming; xác minh đúng project trước up/down.
2. Tạo topic, Kafka engine, MergeTree target, valid MV và reject MV ở chế độ handle_error_mode = stream.
3. Gửi valid, malformed và duplicate events với stable event_id; chứng minh reject không chặn valid rows.
4. Detach consumer MV, tạo lag, attach lại và đo recovery bằng system.kafka_consumers + broker end offsets.
5. Mô phỏng lost acknowledgement/replay; chứng minh serving result/reconciliation không double count.
6. Viết retention, DLQ/PII, partition/consumer sizing, poison-event và teardown runbook không xóa volume root ngoài ý muốn.

**Hidden condition:** direct SELECT từ Kafka engine không phải preview vô hại; nó có consumer/offset semantics.

**Hoàn thành khi:** có failure timeline, raw/unique counts, lag p95/max, rejected reasons và replay procedure không cần sửa tay target.

---

## X-L01 — OLTP sang OLAP và reconciliation

**Mục tiêu:** mô hình hóa ranh giới PostgreSQL system-of-record và ClickHouse analytics serving.

**Nhiệm vụ:**

1. Chọn orders PostgreSQL làm source, định nghĩa event envelope gồm event_id, aggregate_id, source_version, occurred_at, ingested_at và payload.
2. Tạo outbox table PostgreSQL, transaction ghi order + outbox nguyên tử.
3. Export một batch outbox sang ClickHouse raw table bằng CSV/JSONEachRow hoặc script client tùy chọn.
4. Retry cùng batch có chủ đích; chứng minh query serving không double count.
5. Xử lý event đến thứ tự 3,1,2 và một tombstone.
6. Viết reconciliation theo time window: source count/sum, delivered count, unique event_id, latest source_version và lag p95.

**Hidden condition:** exactly-once end-to-end thường là ảo tưởng nếu thiếu idempotency/reconciliation; mô tả semantics thực tế của bạn.

**Hoàn thành khi:** có failure matrix cho crash trước/sau publish/ack và quy trình replay không sửa tay dữ liệu.

## Checklist chung trước khi xem lời giải

- [ ] Script setup chạy lại được từ database sạch.
- [ ] Có seed cố định hoặc mô tả random distribution.
- [ ] Kết quả baseline và optimized tương đương theo checksum/count.
- [ ] Có metric trước/sau, không chỉ screenshot thời gian.
- [ ] Có ít nhất một lần giải pháp dự đoán không hiệu quả và giải thích.
- [ ] Có rollback/cleanup scoped đúng schema/table lab.
- [ ] Không chạy destructive command trên production endpoint.
