# Bài 17 — JPA/Hibernate, PostgreSQL, transaction và schema evolution

## Bar senior

Phân biệt entity state/persistence context/DB transaction; chủ động fetch plan và SQL; chứng minh locking/isolation bằng integration test với engine gần production. [Sample JPA/H2](../SourceSamples/17-jpa-hibernate/src/main/java/course/jpa/JpaApplication.java) để học mapping; bài tập bắt buộc nâng sang Testcontainers PostgreSQL trước production claim.

Nếu use case cần SQL-first thay vì persistence context/change tracking, học song song [MyBatis ↔ Dapper](27-mybatis-dapper-sql-mapper.md) rồi viết ADR so sánh query shape, transaction, cache và test strategy.

## 1. Entity lifecycle và persistence context

Entity có state transient, managed, detached, removed. Persistence context là identity map + unit of work; cùng ID thường trả cùng Java instance trong context. Dirty checking phát hiện change managed entity và sinh SQL lúc flush.

- `flush` đồng bộ pending changes với DB trong transaction; không đồng nghĩa commit.
- Query/commit có thể trigger auto-flush, nên exception constraint xuất hiện sớm hơn dự đoán.
- `save()` không phải lúc nào lập tức INSERT; ID strategy ảnh hưởng batching/round trip.
- Detached object không tự dirty-check; `merge` copy state vào managed instance và trả instance đó—không nên tiếp tục giả định argument trở thành managed.

JPA entity thường cần no-arg/proxy-compatible design; Java record/final class không phải lựa chọn entity portable mặc định. DTO/projection có thể là record.

## 2. Relationship ownership và cascade

Owning side quyết định foreign-key update; helper method nên giữ hai phía object graph nhất quán. `cascade` truyền lifecycle operation, không phải database cascade; `orphanRemoval` xóa child bị tách khỏi aggregate. `CascadeType.ALL` toàn cục dễ xóa/merge ngoài ý định.

Equality entity khó vì generated ID null trước persist và proxy/subclass. Chiến lược:

- natural immutable key thật sự unique;
- application-assigned UUID/ID ổn định;
- generated DB ID với equality policy cẩn trọng, không đặt transient entity vào hash collection rồi đổi hash.

## 3. Fetch plan, N+1 và query shape

LAZY/EAGER mapping không thay query design. N+1 xảy ra khi load N parents rồi access association, tạo N query. Cách sửa tùy use case:

- DTO projection cho read model;
- fetch join/entity graph/batch fetching;
- query riêng theo IDs rồi assemble;
- không đổi mọi association sang EAGER—dễ cartesian product/over-fetch.

Collection fetch join + pagination có thể paginate in-memory hoặc duplicate row; dùng two-step ID page rồi fetch detail. Tắt OSIV cho service/API thường buộc fetch boundary rõ, nhưng cần refactor chứ không chỉ đổi flag.

Luôn xem generated SQL, bind timing, query count và `EXPLAIN (ANALYZE, BUFFERS)` trên data distribution đại diện. ORM không loại nhu cầu hiểu SQL/index.

## 4. PostgreSQL/MVCC/isolation mental model

MVCC cho snapshot/version row; không có nghĩa “reader và writer không bao giờ conflict”. `READ COMMITTED` mỗi statement có snapshot mới và vẫn lost update nếu read-modify-write ở app.

| Vấn đề | Giải pháp thường xét |
|---|---|
| oversell counter | atomic conditional update |
| concurrent edit ít conflict | optimistic `@Version`, retry use case có budget |
| conflict cao/critical row | pessimistic row lock, short transaction |
| idempotent create | unique constraint + insert/upsert/return existing |
| write skew/multi-row invariant | stronger isolation, explicit lock/materialized invariant |
| deadlock | consistent lock order, short scope, detect/retry whole transaction |

Isolation/anomaly khác theo database; integration test H2 không chứng minh PostgreSQL locking/planner. Testcontainers giúp chạy dialect thật; production scale/managed configuration vẫn cần staging/load test.

## 5. Index/query senior topics

- B-tree composite theo leading columns/order; equality columns thường trước range nhưng selectivity/workload quyết định.
- Covering/include giảm heap lookup trong điều kiện phù hợp; partial/expression index tối ưu query cụ thể nhưng tăng write/storage.
- Function/cast trên indexed column có thể làm predicate non-sargable.
- Join algorithms: nested loop/hash/merge phụ thuộc row estimate/order/memory/index. Estimate sai thường do statistics/data correlation.
- Offset sâu scan/discard; keyset cần deterministic composite cursor và semantics khi data đổi.
- Window function giữ detail rows; CTE materialization behavior phụ thuộc DB/version/query.
- Connection pool không “càng lớn càng nhanh”: capacity DB/CPU/query latency và concurrent demand quyết định; monitor wait/acquire timeout/leak.

## 6. Transaction boundary và propagation

Một transaction bao trọn application invariant, ngắn, không gọi remote tùy ý. `REQUIRES_NEW` có independent commit: outer rollback không hoàn tác audit/outbox đã commit; pool cần dư connection khi outer giữ một connection. `NESTED` thường dựa savepoint và support khác nhau.

DB + message không atomic bằng hai commit nối nhau. Outbox ghi business state + event row trong cùng DB transaction; relay publish retry. Consumer vẫn idempotent. XA/JTA chỉ phù hợp context hẹp với participants/operations hỗ trợ và operational cost chấp nhận được.

## 7. Migration expand/contract

1. Expand schema backward-compatible (nullable/default/table/index concurrently nếu engine hỗ trợ).
2. Deploy code đọc cũ/ghi dual hoặc backfill có checkpoint/rate limit.
3. Chuyển read, verify metric/data.
4. Contract sau khi mọi version cũ hết traffic/rollback window.

Flyway/Liquibase quản lý ordering/checksum, không tự làm migration an toàn. Không để mỗi pod đồng thời chạy DDL nặng. Backup không phải DR nếu chưa restore-test; xác định RPO/RTO.

## C#/.NET refresh và mapping

- EF Core `DbContext` gần persistence context/unit of work, nhưng tracking/fetch/proxy/flush semantics không map 1:1. `SaveChanges` gần flush + transaction boundary hơn là mọi call repository Java.
- EF Core concurrency token/`rowversion` và JPA `@Version` cùng là optimistic concurrency pattern; exception, generated SQL và detached update khác.
- `Include`/projection/`AsNoTracking` là công cụ kiểm soát query shape bên .NET; Java dùng fetch join/entity graph/projection/read-only scope. LINQ hay JPQL đều có thể N+1 và query-plan xấu.
- ADO.NET/EF transaction vẫn chịu MVCC/isolation/lock/index của database giống JDBC/JPA; ORM không thay kiến thức SQL.

## Lab

1. Reproduce N+1, đếm SQL; sửa bằng projection/fetch plan và tránh pagination trap.
2. Hai transaction update cùng entity `@Version`; assert một conflict.
3. Viết atomic stock update và concurrent test: tổng stock không âm.
4. Chạy query/index bằng PostgreSQL Testcontainers, lưu plan trước/sau và data volume.
5. Viết migration add non-null column theo expand/backfill/contract không downtime.

Chỉ profile `local`/test của sample dùng H2 + `ddl-auto=create-drop`; chạy local bằng `mvn -f SourceSamples/17-jpa-hibernate/pom.xml spring-boot:run -Dspring-boot.run.profiles=local`. Default main profile dùng `ddl-auto=validate` để không vô tình drop schema khi thay datasource. Constraint `stock >= 0` ở DB là defense-in-depth; test H2 tuần tự không thay concurrent PostgreSQL/Testcontainers proof ở bước 3–4.

## Interview drill

- Persistence context khác DB transaction? Flush khác commit?
- Vì sao `merge` return object cần dùng? Entity equality trước/sau persist?
- N+1 xảy ra và đo/sửa thế nào? Vì sao EAGER không phải fix chung?
- READ COMMITTED vẫn lost update ra sao? Optimistic/pessimistic/atomic update chọn khi nào?
- Connection pool size dựa vào đâu? `REQUIRES_NEW` ảnh hưởng pool thế nào?
- Thiết kế order + outbox + idempotency trong transaction nào?

## Quiz

1. `save()` xong có chắc row đã commit?
2. Fetch join nhiều collection luôn an toàn?
3. H2 integration test đủ xác nhận PostgreSQL isolation/query plan?
4. Unique constraint có còn cần khi app đã check request ID trước insert?

<details><summary>Đáp án/rubric</summary>

1. Không; persistence context có thể chưa flush và transaction chưa commit.
2. Không; cartesian explosion, duplicate, pagination/bag constraints. Thiết kế query shape theo use case.
3. Không; dùng dialect/engine thật cho behavior quan trọng.
4. Có; check-then-insert race. Constraint/atomic DB operation là arbiter, app xử lý conflict thành idempotent result.
</details>
