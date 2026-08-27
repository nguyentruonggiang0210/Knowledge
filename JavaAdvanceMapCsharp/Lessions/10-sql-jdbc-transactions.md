# Bài 10 — SQL, JDBC, transaction và persistence

## Đích học

Ôn SQL theo góc nhìn backend senior; dùng JDBC an toàn; nhận diện N+1, lost update và transaction boundary.

## C# → Java data stack

| Ý định | C#/.NET | Java | Senior nuance |
|---|---|---|---|
| provider connection | `SqlConnection`, `NpgsqlConnection` | JDBC driver implementation của `Connection` | SQL dialect và parameter syntax vẫn provider-specific |
| connection abstraction | `DbConnection` | `java.sql.Connection` | logical session handle; không share cho concurrent operation |
| connection source | `DbDataSource` nếu provider hỗ trợ | `javax.sql.DataSource` | long-lived factory/config; lấy connection short-lived cho từng unit of work |
| direct connection | `new SqlConnection(cs)` + `OpenAsync` | `DriverManager.getConnection` | hợp tool/demo nhỏ; application production ưu tiên injected source/pool |
| pool | provider pool, ví dụ SqlClient/Npgsql | HikariCP/Tomcat/DBCP `DataSource` | `Dispose`/`close` thường trả logical connection về pool, không đóng socket vật lý |
| command | `DbCommand` + `DbParameter` | `PreparedStatement` | value phải parameterize; identifier/order direction phải whitelist |
| cursor | `DbDataReader` | `ResultSet` | streaming giữ command + connection + pool slot đến khi đóng |
| local transaction | `DbTransaction` | `setAutoCommit(false)` + commit/rollback | mọi command phải dùng đúng connection/transaction |
| ambient/framework transaction | `TransactionScope`, EF transaction | Spring `@Transactional`, JTA khi thật sự cần XA | không map 1:1; boundary vẫn là business use case |
| micro/SQL mapper | Dapper | MyBatis/JdbcTemplate; jOOQ cho typed DSL/codegen | mapping chi tiết ở [bài 27](27-mybatis-dapper-sql-mapper.md) |
| ORM context | EF `DbContext` | JPA `EntityManager`/Hibernate Session | unit of work/change tracking nằm trên JDBC/ADO.NET layer |

Tên chuẩn trong BCL là `DbConnection`; “Data Connection” thường chỉ khái niệm chung. `DataConnection` viết liền có thể là type của thư viện LINQ to DB, **không** phải abstraction ADO.NET chung. Phía Java, mapping gần nhất của `DbConnection` là `Connection`, còn mapping của `DbDataSource` là `DataSource`.

### Ownership và lifecycle

```text
application lifetime
└─ DataSource / DbDataSource / connection pool
   └─ unit of work: Connection / DbConnection
      └─ Transaction
         └─ PreparedStatement / DbCommand
            └─ ResultSet / DbDataReader
```

Đóng theo thứ tự ngược. Source/pool thường là singleton và đóng khi application shutdown; connection, transaction, command và reader đóng trong từng operation. `DataSource` chỉ là contract lấy connection, **không mặc định có pool**; H2 `JdbcDataSource` có thể unpooled, còn HikariCP là pooled implementation. `DbDataSource` cũng abstract/provider-dependent, không phải provider .NET nào cũng có concrete implementation.

Pool là bulkhead hữu hạn. Budget phải tính gần đúng `số pod × max pool/pod`, cộng admin/migration/replica, rồi đối chiếu DB connection limit. Theo dõi active, idle, pending/acquire time, timeout và leak. Virtual thread hoặc async/await không tạo thêm capacity cho DB.

### Blocking, async, timeout và cancellation

- ADO.NET có `OpenAsync`, `Execute*Async`, `ReadAsync`; chất lượng async/cancellation phụ thuộc provider. JDBC chuẩn là blocking; dùng bounded platform-thread executor hoặc virtual thread, không giả vờ JDBC là non-blocking. R2DBC là stack/programming model khác.
- Phân biệt pool acquire timeout, login/connect timeout, query/command timeout, socket/network timeout, transaction timeout và end-to-end deadline. Một con số không thay thế các tầng còn lại.
- `DbCommand.CommandTimeout` ↔ `Statement.setQueryTimeout`; `CancellationToken`/`DbCommand.Cancel` ↔ `Statement.cancel`. Cancellation thường best-effort và phụ thuộc driver/server.
- Timeout sau khi gửi write có thể để outcome **unknown**: server có thể đã commit dù client không nhận response. Chỉ retry khi operation idempotent hoặc có reconciliation/idempotency key.

## SQL cần ôn

- `WHERE` lọc row trước aggregate; `HAVING` lọc group sau `GROUP BY`.
- `LEFT JOIN` có predicate bảng phải ở `WHERE` có thể vô tình thành inner join; cân nhắc đặt predicate trong `ON`.
- Window function (`ROW_NUMBER`, `SUM() OVER`) giữ detail row, khác aggregate `GROUP BY`.
- Index composite tuân prefix/selectivity/order; index tăng read nhưng tốn write/storage.
- Keyset pagination (`WHERE (created_at,id) < (?,?)`) ổn định/nhanh hơn offset sâu.
- Luôn parameterize SQL; không nối input vào query.

- Đọc execution plan: estimated vs actual rows, scan/join type, buffers/sort spill; statistics/data distribution sai có thể làm optimizer chọn plan tệ. Composite/covering/partial/expression index đều đổi write/storage cost.
- MVCC/snapshot/lock/deadlock khác theo engine. H2 phù hợp demo API nhưng query/isolation quan trọng phải test bằng PostgreSQL/Testcontainers hoặc engine production.

## Transaction

ACID không có nghĩa mọi isolation đều serializable. `READ COMMITTED` vẫn có lost update nếu read-modify-write. Cách xử lý:

- atomic SQL: `UPDATE ... SET stock = stock - ? WHERE stock >= ?`;
- optimistic locking với `version` và kiểm tra affected rows;
- pessimistic lock khi contention/use case phù hợp;
- idempotency key cho retry ở boundary.

Transaction boundary nên bao trọn một application use case, ngắn, không giữ DB transaction khi gọi remote API. Dùng outbox khi cần atomic giữa DB state và event publication; distributed transaction thường không phải lựa chọn đầu tiên.

### JDBC ownership

Đóng `Connection`, `PreparedStatement`, `ResultSet` bằng try-with-resources; C# dùng `using`/`await using`. Connection pool cho mượn logical connection; `close()`/`Dispose()` thường trả về pool. Không chia sẻ connection, transaction, statement, reader/result set giữa concurrent operation.

JDBC mặc định auto-commit từng statement. Với multi-step transaction: disable auto-commit → chạy use case → commit; khi lỗi rollback và giữ rollback failure dưới dạng suppressed; chỉ restore auto-commit sau khi chắc transaction đã kết thúc. Gọi `setAutoCommit(true)` khi transaction còn active sẽ commit transaction hiện tại, nên `finally { setAutoCommit(true); }` mù quáng là bug nguy hiểm. C# local transaction yêu cầu mọi `DbCommand.Transaction` trỏ đúng `DbTransaction`; Dapper cũng phải nhận transaction rõ trong mỗi call.

Spring/JPA/MyBatis thường quản lý connection qua injected `DataSource`, nhưng persistence context/`SqlSession` không đồng nghĩa connection vật lý. Streaming query/LOB, transaction dài và `REQUIRES_NEW` có thể giữ hoặc cần thêm pool slot; thiết kế pool phải xét các đường này.

## Thực hành

[JDBC `DataSource` + HikariCP/H2 sample](../SourceSamples/10-sql-jdbc/src/main/java/course/sql/JdbcDemo.java) · [SQL script](../SourceSamples/10-sql-jdbc/src/main/resources/schema.sql) · [ADO.NET `DbConnection` sample](../SourceSamples/10-sql-jdbc/csharp/Program.cs)

Hai sample minh họa source/factory sống lâu, connection sống ngắn, parameterized command, reader/result set, query timeout, atomic update và rollback-on-failure. Hãy hạ Java pool xuống 1, giữ một result set mở rồi thử borrow connection thứ hai để quan sát acquire timeout; sau đó thêm index và dùng `EXPLAIN`.

## Quiz

1. Predicate bảng phải của `LEFT JOIN` đặt trong `WHERE` có rủi ro gì?
2. ORM có loại bỏ N+1 tự động không?
3. Vì sao không gọi HTTP bên trong DB transaction dài?
4. Optimistic locking phát hiện conflict bằng gì?
5. `DataSource` có luôn là connection pool không?
6. Vì sao `close()`/`Dispose()` connection pooled thường không đóng socket vật lý?
7. JDBC async có map 1:1 với ADO.NET async không?
8. Sau timeout của một write, có được retry ngay không?

<details><summary>Đáp án</summary>

1. Loại row null-extended và biến semantics gần inner join.
2. Không; lazy relationship thường chính là nguồn N+1.
3. Giữ lock/connection lâu, tăng contention và failure coupling.
4. Version/timestamp trong predicate và affected-row count bằng 0.
5. Không; nó là factory contract. Pool chỉ có khi implementation/config cụ thể cung cấp.
6. Nó trả logical connection về pool để tái sử dụng physical connection; pool owner mới quản lý socket/lifecycle.
7. Không. ADO.NET có provider async API; JDBC chuẩn blocking. Virtual thread giảm chi phí thread chờ nhưng connection vẫn bị giữ.
8. Không mặc định; outcome có thể unknown. Cần idempotency/reconciliation và phân loại failure trước khi retry.
</details>

## Tài liệu chính thức

- [JDBC `DataSource`](https://docs.oracle.com/en/java/javase/25/docs/api/java.sql/javax/sql/DataSource.html) và [`Connection`](https://docs.oracle.com/en/java/javase/25/docs/api/java.sql/java/sql/Connection.html)
- [.NET `DbDataSource`](https://learn.microsoft.com/en-us/dotnet/api/system.data.common.dbdatasource) và [ADO.NET connection pooling](https://learn.microsoft.com/en-us/dotnet/framework/data/adonet/connection-pooling)
- [HikariCP configuration](https://github.com/brettwooldridge/HikariCP)
