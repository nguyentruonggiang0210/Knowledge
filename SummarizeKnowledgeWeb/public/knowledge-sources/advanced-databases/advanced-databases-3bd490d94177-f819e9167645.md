# Roadmap PostgreSQL nâng cao

Lộ trình này dành cho người đã biết viết `SELECT`, `INSERT`, `UPDATE`, `DELETE` và muốn làm việc với PostgreSQL ở mức production. Chỉ có **một bài nền tảng** để ôn nhanh; phần còn lại đi từ intermediate đến expert.

## Mục tiêu đầu ra

Sau khi hoàn thành, bạn có thể:

- giải thích MVCC, isolation level, lock và xử lý deadlock;
- chọn đúng B-tree, GiST, GIN, BRIN, partial, expression và covering index;
- đọc `EXPLAIN (ANALYZE, BUFFERS)` và sửa truy vấn dựa trên bằng chứng;
- dùng window function, CTE, `LATERAL`, recursive query, JSONB và full-text search;
- thiết kế partition, RLS, function/trigger mà không tạo lỗ hổng hoặc bottleneck;
- vận hành vacuum/autovacuum, connection pool, backup, PITR, replication và HA;
- thiết kế domain/generated/range/exclusion, idempotency và transactional outbox;
- giải thích commit durability từ WAL flush đến checkpoint và full-page image;
- triển khai schema/extension/major upgrade theo expand-contract và rollback window;
- lập capacity budget cho disk, memory, connection, WAL và maintenance;
- thiết kế deadline, timeout, cancel/terminate mà không tạo retry storm;
- điều tra sự cố bằng catalog, log và runbook có thể lặp lại.

## Môi trường miễn phí

PostgreSQL là mã nguồn mở. Khóa học dùng **một môi trường chuẩn duy nhất** từ
file Compose ở root repository. Đứng tại `DatabaseAdvance/` và chạy:

```bash
docker compose up -d postgres
docker compose ps
docker exec -it database-advance-postgres psql -U student -d lab
```

Image được ghim ở PostgreSQL `17.11`; mọi block được kiểm chứng trên đúng major
17 và không phụ thuộc extension trả phí. Phần lớn khái niệm áp dụng cho 16,
nhưng các điểm chỉ có ở 17 như `transaction_timeout`/`pg_stat_checkpointer`
được ghi rõ. Chuỗi kết nối từ host là
`postgresql://student:student@localhost:5432/lab`. Credentials này chỉ dành
cho lab local.

> **Bug ẩn / production:** Không dùng password mẫu, không publish cổng `5432` ra Internet, và không coi volume lab là backup. Không khởi động thêm một PostgreSQL container khác cùng cổng `5432`; hãy dùng đúng stack ở root để command, credentials và dữ liệu luôn thống nhất.

## Quy ước thực hành

- Chạy bằng `psql` để thấy đầy đủ warning và timing.
- Mỗi bài dùng schema riêng (`adv_sql`, `mvcc_lab`, ...), tránh đụng dữ liệu bài khác.
- Các block SQL được thiết kế và smoke-test cho PostgreSQL 17.11. Block có ghi **Session A/B** phải chạy trên hai cửa sổ `psql`.
- Bật đo thời gian khi benchmark:

```sql
\timing on
SELECT version();
SHOW server_version;
```

> **Bug ẩn / production:** `EXPLAIN ANALYZE` thực sự chạy câu lệnh. Với `UPDATE`, `DELETE`, hoặc function có side effect, hãy chạy trong `BEGIN; ... ROLLBACK;` trên bản sao dữ liệu.

## Lộ trình đề xuất

| Chặng | Bài học | Kết quả chính | Thực hành gợi ý |
|---|---|---|---|
| 0 | [00 — Nền tảng duy nhất](00-nen-tang-duy-nhat.md) | Schema, kiểu dữ liệu, `NULL`, constraint | 1 buổi |
| 1 | [01 — Advanced SQL](01-advanced-sql.md) | Window, CTE, recursive, `LATERAL` | 2 buổi |
| 2 | [02 — MVCC, isolation và lock](02-mvcc-isolation-locks.md) | Race condition, deadlock, retry | 3 buổi |
| 3 | [03 — Index chuyên sâu](03-index-chuyen-sau.md) | Chọn và kiểm chứng index | 3 buổi |
| 4 | [04 — Optimizer và EXPLAIN](04-explain-optimizer-thong-ke.md) | Đọc plan, statistics, estimate | 3 buổi |
| 5 | [05 — Partitioning](05-partitioning.md) | Pruning, lifecycle, uniqueness | 2 buổi |
| 6 | [06 — JSONB và full-text search](06-jsonb-full-text-search.md) | Semi-structured data, tìm kiếm | 2 buổi |
| 7 | [07 — Function, trigger, RLS và security](07-functions-triggers-rls-security.md) | Logic DB an toàn, multi-tenant | 3 buổi |
| 8 | [08 — Hiệu năng, pooling, vacuum và bloat](08-performance-pooling-vacuum-bloat.md) | Giữ database ổn định khi tải cao | 3 buổi |
| 9 | [09 — Backup, PITR, replication và HA](09-backup-pitr-replication-ha.md) | RPO/RTO và phục hồi | 3 buổi |
| 10 | [10 — Observability và troubleshooting](10-observability-troubleshooting.md) | Điều tra sự cố có hệ thống | 2 buổi |
| 11 | [11 — Data modeling và integrity nâng cao](11-data-modeling-integrity-advanced.md) | Domain, generated, range, idempotency, outbox | 3 buổi |
| 12 | [12 — WAL, checkpoint và durability](12-wal-checkpoint-durability.md) | Commit path, FPI, checkpoint, checksum | 3 buổi |
| 13 | [13 — Zero-downtime schema migrations](13-zero-downtime-schema-migrations.md) | Expand-contract, backfill, lock budget | 3 buổi |
| 14 | [14 — Extension lifecycle và version upgrades](14-extension-lifecycle-version-upgrades.md) | Extension supply chain, pg_upgrade, cutover | 3 buổi |
| 15 | [15 — Capacity, timeout và cancellation](15-capacity-timeouts-cancellation.md) | Headroom, runway, deadline, load shedding | 3 buổi |
| 16 | [16 — Capstone production](16-capstone.md) | Thiết kế, benchmark, recovery drill | 4–6 buổi |

## Cách học một keyword

Với mỗi khái niệm, làm đủ bốn bước:

1. Viết lại bằng lời của bạn: nó giải quyết vấn đề gì?
2. Chạy sample SQL và dự đoán kết quả trước khi xem.
3. Cố tình tạo tình huống ở mục **Bug ẩn / production**.
4. Ghi lại bằng chứng: execution plan, lock, số buffer hoặc thời gian phục hồi.

Đừng tối ưu chỉ bằng cảm giác. Một thay đổi được xem là tốt khi workload đại diện cho production nhanh hoặc ổn định hơn, và không phá correctness.

## Checklist hoàn thành

- [ ] Giải thích vì sao một transaction nhìn thấy hoặc không nhìn thấy một row.
- [ ] Chứng minh index được chọn bằng execution plan, không chỉ vì đã `CREATE INDEX`.
- [ ] Tạo được deadlock có kiểm soát và viết retry có giới hạn.
- [ ] Chứng minh partition pruning bằng plan.
- [ ] Chứng minh tenant A không đọc/sửa được tenant B bằng RLS.
- [ ] Chứng minh idempotency/outbox chịu được retry và worker crash mà không mất event.
- [ ] Đo WAL/checkpoint, giải thích durability guarantee của từng transaction class.
- [ ] Rehearse migration expand-contract với lock timeout, backfill và catalog validation.
- [ ] Lập disk/memory/connection/WAL capacity budget có failure headroom.
- [ ] Cancel query đúng target và phục hồi connection/transaction sau timeout.
- [ ] Khôi phục được backup vào instance mới và đo RTO thực tế.
- [ ] Hoàn tất capstone kèm báo cáo benchmark và runbook sự cố.

## Tự kiểm tra theo từng bài

- Làm [entry diagnostic](../Quiz/ENTRY_DIAGNOSTIC_QUESTIONS.md) trước bài 01; nếu chưa đạt gate PostgreSQL, chỉ cần ôn lại bài 00 rồi thử lại.
- Dùng [coverage matrix](../Quiz/COVERAGE_MATRIX.md) để tìm đúng câu hỏi và lab tương ứng với từng bài 00–16.
- Làm [đề PostgreSQL nâng cao](../Quiz/POSTGRESQL_ADVANCED_QUESTIONS.md) trước khi mở [đáp án](../Quiz/POSTGRESQL_ADVANCED_ANSWERS.md).
- Các bài thực hành có tiêu chí nghiệm thu nằm trong [Practical Labs](../Quiz/PRACTICAL_LABS.md); capstone được chấm theo [rubric](../Quiz/CAPSTONE_RUBRIC.md).

## Nguồn chuẩn để tra cứu

Các bài dùng PostgreSQL 17 làm baseline. Khi gặp khác biệt phiên bản, ưu tiên tài liệu chính thức đúng major version:

- [PostgreSQL 17 Documentation](https://www.postgresql.org/docs/17/index.html)
- [Indexes](https://www.postgresql.org/docs/17/indexes.html)
- [Concurrency Control](https://www.postgresql.org/docs/17/mvcc.html)
- [Table Partitioning](https://www.postgresql.org/docs/17/ddl-partitioning.html)
- [Monitoring Database Activity](https://www.postgresql.org/docs/17/monitoring.html)
- [Backup and Restore](https://www.postgresql.org/docs/17/backup.html)
- [Reliability and the Write-Ahead Log](https://www.postgresql.org/docs/17/wal.html)
- [ALTER TABLE](https://www.postgresql.org/docs/17/sql-altertable.html)
- [Extension Packaging and Lifecycle](https://www.postgresql.org/docs/17/extend-extensions.html)
- [Upgrading a PostgreSQL Cluster](https://www.postgresql.org/docs/17/upgrading.html)

> **Bug ẩn / production — lệch phiên bản:** Catalog columns, progress views và option có thể đổi giữa major versions. Không copy runbook từ server 17 sang 16 mà không chạy `SHOW server_version` và test trên đúng version.
