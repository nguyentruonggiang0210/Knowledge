# Bài 12 — Capstone: Order & Inventory Service

## Mục tiêu

Tích hợp kiến thức thành một service nhỏ có quyết định kiến trúc giải thích được. [Starter sample](../SourceSamples/12-capstone/src/main/java/course/capstone/CapstoneDemo.java) chỉ là domain/use-case skeleton; bạn hoàn thiện dần.

## Yêu cầu chức năng

1. Tạo order gồm nhiều SKU; quantity > 0; tiền dùng value object/`BigDecimal`.
2. Reserve stock chống âm và chống lost update.
3. Idempotent theo `requestId`.
4. Trả order summary và phát `OrderPlaced` qua outbox.
5. Query danh sách theo keyset pagination và tổng doanh thu theo ngày.

## Yêu cầu kỹ thuật

- Code compatibility target Java 21 trước, sau đó review/migrate trên Java 25 LTS; ghi ADR chọn runtime theo estate/support/tooling thay vì chỉ chạy bản mới nhất.
- Domain không phụ thuộc HTTP/ORM; port cho clock, repository, event store.
- JDBC/H2 cho local; script migration có constraint/index.
- Transaction ngắn bao gồm order + stock + outbox.
- Unit test invariant; integration test SQL/transaction; contract test input/output.
- Concurrency test: hai request tranh stock cuối, chỉ một thành công.
- Timeout/cancellation cho remote price service giả lập; giới hạn concurrency.
- README có lệnh chạy, sơ đồ boundary, assumptions và failure modes.
- Spring Boot adapter thật; OAuth/resource authorization; structured log/metric/trace; Docker/Kubernetes manifest và graceful shutdown.
- PostgreSQL/Testcontainers cho query/isolation quan trọng; H2 chỉ dùng cho fast local feedback không phụ thuộc dialect.

## Milestone

| Mốc | Nội dung | Definition of done |
|---|---|---|
| M1 | domain + use case in-memory | unit tests, không framework |
| M2 | JDBC transaction | rollback test, optimistic/atomic stock update |
| M3 | outbox + idempotency | retry request không tạo order/event kép |
| M4 | API adapter | validation/error mapping/contract test |
| M5 | observability/performance | structured log, metrics plan, load-test notes |

## ADR bắt buộc

Viết ngắn 1 trang cho mỗi quyết định: record hay class; exception hay result; JDBC/MyBatis hay JPA; optimistic hay pessimistic lock; virtual thread hay future; mapping domain/persistence riêng hay chung. Mỗi ADR nêu context, decision, alternatives, consequences. Nếu chọn MyBatis, tham chiếu [bài 27](27-mybatis-dapper-sql-mapper.md) và nêu rõ SQL ownership, mapper test, cache/batch policy.

## Review checklist

- Không dùng `double` cho tiền; rounding mode explicit.
- Equality/hash ổn định; collection trả ra không bị mutate ngoài ý muốn.
- Không stream/filter toàn bảng thay SQL.
- Resource đóng đúng; exception giữ cause; không log trùng.
- Executor/connection có capacity và lifecycle; deadline được propagate.
- Query không N+1, có index hợp lý và test transaction thật.

## Quiz tổng kết

1. Vì sao outbox giải quyết “DB commit thành công nhưng publish event thất bại”?
2. Idempotency key cần lưu cùng transaction nào?
3. Hai cách chống oversell mà không khóa toàn bảng?
4. Bạn sẽ đo gì trước khi chọn GC/concurrency optimization?

<details><summary>Gợi ý</summary>

1. State và outbox record commit atomically; publisher retry độc lập.
2. Cùng transaction tạo business result để retry nhìn thấy cùng kết quả.
3. Atomic conditional update hoặc optimistic version; row lock cũng có thể phù hợp.
4. Workload và SLO thực: latency percentiles, throughput, saturation, allocation/GC, CPU/I/O/lock profile.
</details>
