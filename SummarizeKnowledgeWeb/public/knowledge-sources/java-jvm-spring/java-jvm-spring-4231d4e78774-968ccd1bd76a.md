# Bài 27 — MyBatis production và mapping sang Dapper/ADO.NET

## Đích học

Sau bài này bạn phải giải thích và code được MyBatis theo hướng SQL-first: mapper interface/XML, parameter binding, dynamic SQL, `resultMap`, session/transaction, generated key, optimistic write, batch/cache và integration với Spring. Đồng thời map đúng sang Dapper/ADO.NET mà không nhầm MyBatis với JPA hay `SqlSession` với EF `DbContext`.

[Java MyBatis sample](../SourceSamples/27-mybatis-dapper/src/main/java/course/mybatis/MyBatisDemo.java) · [Mapper XML](../SourceSamples/27-mybatis-dapper/src/main/resources/course/mybatis/InventoryMapper.xml) · [C# Dapper sample](../SourceSamples/27-mybatis-dapper/csharp/Program.cs)

## 1. MyBatis nằm ở đâu?

MyBatis là **SQL mapper/data mapper**: bạn sở hữu SQL, framework bind parameter và map row ↔ object. Nó không phải ORM unit-of-work kiểu JPA/Hibernate/EF Core:

- không dirty checking/change tracker;
- không tự flush thay đổi của object;
- không tự cascade/lập kế hoạch update entity graph;
- relationship chỉ tồn tại vì query/`resultMap` bạn định nghĩa;
- transaction/session vẫn phải có boundary rõ.

MyBatis hợp với schema-first/legacy database, stored procedure, reporting/query phức tạp, SQL cần DBA review, hoặc hệ thống muốn kiểm soát query shape/dialect. JPA hợp hơn khi aggregate CRUD, identity/change tracking và lifecycle relationship tạo nhiều giá trị. JdbcTemplate/JdbcClient mỏng hơn; jOOQ mạnh ở schema code generation và typed SQL DSL.

Phía C#, **Dapper + ADO.NET là mapping gần nhất**, nhưng không tương đương hoàn toàn. Dapper là extension trên `DbConnection`; nó không cung cấp XML mapper, session cache hay change tracker.

## 2. Mapping Java ↔ C# theo vai trò

| Java/MyBatis | C# gần nhất | Khác biệt cần nhớ |
|---|---|---|
| mapper interface + XML/annotation | repository method + Dapper SQL string/file | Dapper core không sinh mapper proxy/XML statement registry |
| `#{value}` | Dapper anonymous/`DynamicParameters`; ADO.NET `DbParameter` | tạo bind parameter, chống injection cho **value** |
| `${fragment}` | string concat/interpolation vào raw SQL | raw substitution; chỉ dùng fragment do code whitelist, không nhận input trực tiếp |
| `resultMap`, `association`, `collection` | Dapper multi-mapping/`QueryMultiple`; reader manual | app vẫn phải split/deduplicate object graph đúng |
| `TypeHandler` | `SqlMapper.TypeHandler<T>` / provider converter | null, enum, UUID, time, JSON vẫn phụ thuộc DB/provider |
| `SqlSessionFactory` | long-lived `DbDataSource`/connection factory | factory/source sống application lifetime |
| `SqlSession` | gần `DbConnection` + transaction + mapper/cache scope | không phải EF `DbContext`; không thread-safe và MyBatis không track changes |
| `session.commit/rollback` | `DbTransaction.Commit/Rollback` | Dapper call phải nhận đúng transaction rõ ràng |
| `useGeneratedKeys/keyProperty` | `RETURNING`/`OUTPUT` + `QuerySingle`, `ExecuteScalar` | MyBatis `insert()` trả affected rows; generated id được gán vào parameter object |
| `ExecutorType.BATCH` | provider `DbBatch`, ADO batching, Dapper `Execute(IEnumerable)` | wire batching, generated key và failure timing đều provider-specific |
| local/L2 cache | EF identity map chỉ gần một phần; cache ngoài app | Dapper không result-cache; MyBatis cache không dirty-track |
| XML dynamic SQL / Dynamic SQL DSL | Dapper SqlBuilder/manual fixed fragments; EF LINQ/raw SQL | MyBatis core XML và thư viện `mybatis-dynamic-sql` là hai abstraction khác nhau |

## 3. Mapper interface, XML và annotation

Trong XML, `namespace` phải là fully-qualified name của mapper interface; statement `id` khớp method. Với nhiều tham số, dùng `@Param` để contract có tên rõ, tránh truyền `Map<String,Object>` mất type safety. Luôn liệt kê column/alias, không dùng `SELECT *` cho contract ổn định.

- Annotation hợp query ngắn, ít dynamic/nested mapping.
- XML hợp reusable `resultMap`, join phức tạp, `<sql>/<include>` và dynamic SQL dễ đọc.
- Có thể phối hợp annotation với `@ResultMap`, nhưng tránh một statement bị định nghĩa hai nơi.
- `selectOne` trả `null` khi không có row và ném `TooManyResultsException` khi nhiều row; repository/service phải chuyển semantics sang `Optional`, not-found hay conflict phù hợp.
- Immutable record/constructor mapping cần khai báo constructor args/column alias rõ. Insert cần nhận generated key thường dùng mutable command/row DTO như [`InventoryInsert`](../SourceSamples/27-mybatis-dapper/src/main/java/course/mybatis/InventoryInsert.java), rồi map sang domain immutable.

## 4. `#{}` khác `${}` — câu phỏng vấn bắt buộc

`#{sku}` trở thành JDBC bind marker và value đi qua `PreparedStatement`. `${column}` là text substitution trước khi SQL được prepare; MyBatis không escape nó.

Identifier, table name và `ORDER BY` direction không bind như value. Hãy map API enum → fragment cố định bằng `<choose>` hoặc Java switch. Không đưa `sort`, tenant/schema hoặc column name từ request thẳng vào `${}`. [Mapper XML sample](../SourceSamples/27-mybatis-dapper/src/main/resources/course/mybatis/InventoryMapper.xml) và [Dapper sample](../SourceSamples/27-mybatis-dapper/csharp/Program.cs) đều whitelist nhánh sort, còn mọi value đều parameterized.

Dynamic update/delete phải bảo đảm predicate bắt buộc không thể biến mất. `<where>` chỉ sửa cú pháp leading `AND`; nó không bảo vệ business invariant khỏi một full-table mutation.

## 5. Dynamic SQL production

MyBatis core XML có `<if>`, `<choose>`, `<where>`, `<trim>`, `<set>`, `<foreach>` và `<bind>`:

- test mọi tổ hợp null/empty/optional filter;
- empty `IN` phải có semantics rõ: trả empty, reject request hay bỏ filter—đừng vô tình full scan;
- sort/identifier dùng allowlist;
- list lớn bị giới hạn bind-parameter/SQL length; chunk, array/TVP/temp table tùy DB;
- pagination sâu dùng keyset khi phù hợp và có deterministic tie-breaker;
- log statement id/latency/row count, không log PII/secret bind values.

`mybatis-dynamic-sql` là dependency DSL riêng, hữu ích cho query composable/refactorable; nó không đồng nghĩa XML dynamic tags và không nên được quảng cáo là schema-codegen giống hệt jOOQ.

## 6. `resultMap`, relationship và N+1

Với joined object graph, khai báo `<id>` cho parent/child để MyBatis deduplicate row, dùng alias/`columnPrefix`, `association` cho to-one và `collection` cho to-many. Nested `select=` dễ sinh N+1: load N parent rồi chạy thêm N query child. Lazy loading chỉ trì hoãn; iterate cả danh sách vẫn N+1.

Cách sửa theo use case:

1. một join + nested result mapping khi row multiplication chấp nhận được;
2. page parent IDs, bulk-load children bằng một query `IN`, rồi assemble;
3. projection/read model riêng thay vì hydrate aggregate lớn.

Không `LIMIT/OFFSET` trực tiếp trên to-many join rồi giả định đang page theo parent; database page joined rows. Test query count và data shape bằng engine production, không chỉ assert object cuối.

Dapper multi-mapping cũng không tự giải quyết: `splitOn`, identity dictionary và dedup collection là trách nhiệm code C#.

## 7. Session, connection và transaction

### MyBatis core

- `SqlSessionFactory` xây một lần và share.
- `SqlSession`/`DefaultSqlSession` không thread-safe: mở cho một request/unit of work bằng try-with-resources, commit/rollback rõ, rồi đóng.
- `openSession()` mặc định mở transaction không auto-commit; quên commit làm write rollback khi close.
- `SqlSession` lấy JDBC `Connection` từ configured `DataSource`; source có thể pooled hoặc unpooled. Đừng giữ session/connection khi gọi HTTP chậm.

### MyBatis-Spring/Spring Boot

- Inject mapper proxy/`SqlSessionTemplate`; template thread-safe và bind session/connection vào Spring transaction.
- Đặt `@Transactional` ở application-service boundary để nhiều mapper cùng tham gia một transaction. Không tự gọi `openSession/commit/close` bên trong flow do Spring quản lý.
- Mapper write ngoài Spring transaction được tự commit theo MyBatis-Spring; multi-step invariant vì thế bắt buộc có transaction boundary.
- Self-invocation/proxy caveat vẫn áp dụng. Nhiều DataSource cần `SqlSessionFactory`/template/transaction manager qualifier rõ.
- `@Transactional(readOnly=true)` là hint, không phải authorization hay guarantee database từ chối write.

C# counterpart: `DbDataSource`/connection factory sống lâu; mỗi unit of work mở `DbConnection`, bắt đầu `DbTransaction`, và truyền transaction vào **mọi** Dapper command. [`Program.cs`](../SourceSamples/27-mybatis-dapper/csharp/Program.cs) chứng minh rollback không phụ thuộc cache/change tracker.

## 8. Generated key, optimistic write và batch

`mapper.insert(row)` trả affected-row count, không phải generated id. Với `useGeneratedKeys="true"`, `keyProperty` và đôi khi `keyColumn`, driver/MyBatis gán key vào parameter object; sequence/vendor đặc thù có thể dùng `<selectKey>` hoặc `RETURNING`. Test trên dialect thật.

Optimistic transition phải encode invariant trong SQL:

```sql
UPDATE inventory
SET stock = stock - :quantity, version = version + 1
WHERE sku = :sku AND version = :expectedVersion AND stock >= :quantity
```

Affected rows `0` phải được phân loại: not-found, version conflict hay insufficient stock; đừng báo success im lặng.

Với batch:

- multi-row `VALUES` khác JDBC/MyBatis `ExecutorType.BATCH`;
- batch error/update counts thường lộ ở `flushStatements`/commit, không nhất thiết tại mapper call;
- chunk để giới hạn memory/parameter count; test generated-key order và partial failure với driver thật;
- không bật BATCH toàn application và không trộn executor type khác trong cùng Spring transaction; dành top-level transaction/template riêng cho import.

## 9. Cache: biết để chủ động tắt hoặc thiết kế

- L1 local cache gắn `SqlSession`, mặc định scope SESSION; update/commit/rollback/close có rule clear riêng. Cùng query có thể trả object reference cached, nhưng MyBatis vẫn không dirty-track.
- L2 `<cache/>` là opt-in theo namespace, transactional và có serialization/copy/read-only trade-off. Nó không tự giải quyết invalidation giữa pod, external writer hay multi-namespace join.
- Dapper không có result cache; EF change tracker/identity map chỉ tương tự L1 ở một khía cạnh.

Sample cố ý đặt `cacheEnabled=false` và `localCacheScope=STATEMENT`. Chỉ bật L2 khi có freshness SLA, invalidation topology, memory bound và hit/miss/staleness metrics.

## 10. Chọn công cụ trong dự án thật

| Bối cảnh | Chọn đầu tiên | Vì sao |
|---|---|---|
| SQL phức tạp/legacy schema/stored procedure, cần kiểm soát query | MyBatis; Dapper phía C# | SQL-first, mapping nhẹ, query review rõ |
| CRUD aggregate và lifecycle relationship quan trọng | JPA/Hibernate; EF Core | unit of work/change tracking giảm boilerplate |
| cần typed SQL DSL + schema codegen | jOOQ | compile-time/refactor support mạnh hơn string/XML |
| vài query JDBC đơn giản trong Spring | JdbcClient/JdbcTemplate | ít abstraction hơn MyBatis |
| hot path cực nhỏ hoặc provider feature đặc thù | JDBC/ADO.NET trực tiếp | kiểm soát command/reader chính xác, đổi lại nhiều mapping code |

Một service có thể dùng JPA cho write aggregate và MyBatis/jOOQ cho read projection, nhưng phải thống nhất transaction, connection source, cache invalidation và ownership. Không chọn framework theo “nhanh hơn” nếu chưa đo query/network/mapping trên workload thật.

## 11. Testing và production checklist

- Mapper XML phải load trong test; test every dynamic branch, null/empty `IN`, malicious sort token, generated key và affected-row conflict.
- Test transaction gồm ít nhất hai mapper write rồi force exception để chứng minh rollback atomic.
- Test N+1/query count, pagination to-many, batch flush/rollback và cache policy.
- H2 đủ cho lab API; PostgreSQL/MySQL production behavior về JSON/array/time, key, lock/isolation, plan và dialect phải test bằng Testcontainers/real engine cùng Flyway/Liquibase migration.
- Đặt statement timeout/fetch size hợp lý; monitor pool wait, query latency/error/rows, slow mapper statement và transaction duration.
- Streaming cursor phải được consume khi session/connection còn mở; expose cursor qua layer ngoài mà mất ownership sẽ leak pool slot.
- Timeout write có thể outcome unknown; retry cần idempotency key/reconciliation.

Spring Boot 4.x lane hiện tại: `mybatis-spring-boot-starter` 4.0.x dành cho Boot 4+/Java 17+. Codebase Boot 3.2–3.5 dùng starter 3.0.x; không copy version 4 vào Boot 3. Starter tự nhận `DataSource`, tạo `SqlSessionFactory`/`SqlSessionTemplate` và scan mapper; production vẫn phải cấu hình mapper location, type handler, statement timeout, pool và transaction boundary.

## Lab

1. Chạy Java: `mvn -f SourceSamples/27-mybatis-dapper/pom.xml test`, rồi `mvn -f SourceSamples/27-mybatis-dapper/pom.xml exec:java "-Dexec.mainClass=course.mybatis.MyBatisDemo"`.
2. Chạy C#: `dotnet run --project SourceSamples/27-mybatis-dapper/csharp/MyBatisDapperMapping.csproj`.
3. Thêm filter danh sách SKU; định nghĩa rõ empty-list behavior và không dùng `${}`.
4. Thêm `warehouse` + stock rows. Viết một nested-select gây N+1, đo query count, rồi sửa bằng bulk query.
5. Tạo service hai insert + forced exception bằng MyBatis-Spring `@Transactional`; chứng minh rollback bằng integration test PostgreSQL Testcontainers.
6. Viết ADR chọn MyBatis, JPA, jOOQ hoặc JdbcTemplate cho một use case; nêu SQL ownership, transaction, test, cache và team skill.

## Interview drill

- MyBatis có phải ORM như JPA/EF không? Nó thiếu và chủ động trao quyền gì?
- `#{}` khác `${}` thế nào? API cho chọn `ORDER BY` column xử lý ra sao?
- `DefaultSqlSession` khác `SqlSessionTemplate` về thread safety/transaction thế nào?
- Mapper write ngoài `@Transactional` có semantics gì?
- `insert()` trả gì và generated id nằm đâu?
- Nested select gây N+1 thế nào; lazy loading có sửa không?
- BATCH failure xuất hiện lúc nào và vì sao không trộn executor type trong cùng transaction?
- L1/L2 cache scope/invalidation khác Dapper và EF identity map thế nào?
- Vì sao abstraction `DbConnection`/`Connection` không làm SQL portable?

## Quiz

1. MyBatis có tự update object vừa sửa trong memory khi session commit không?
2. Có thể bind tên column bằng `#{sortColumn}` không?
3. Mapper proxy Spring có cho phép share raw `SqlSession` giữa thread không?
4. `<where>` có bảo đảm dynamic DELETE luôn có predicate business không?
5. `insert()` trả `42` có chắc `42` là generated id không?
6. Bật `<cache/>` có tự nhất quán khi service khác update cùng table không?
7. Dapper có tự enlist mọi command vào local transaction chỉ vì connection đang có transaction không?
8. H2 test pass có chứng minh PostgreSQL locking/query plan đúng không?

<details><summary>Đáp án/rubric</summary>

1. Không; không có dirty checking. Phải gọi mapper update rõ.
2. Không theo nghĩa identifier; bind parameter đại diện value. Map enum sang fixed fragment.
3. Không. Proxy/template quản lý session theo transaction/thread; raw `DefaultSqlSession` vẫn không thread-safe.
4. Không; nó chỉ xử lý cú pháp. Validation/service invariant và test mọi branch vẫn bắt buộc.
5. Không; mapper insert thường trả affected rows. Generated key được gán vào `keyProperty` hoặc query bằng `RETURNING`/`selectKey`.
6. Không; external writer/cross-pod/namespace invalidation cần thiết kế riêng.
7. Không; Dapper/ADO.NET command phải nhận/gắn đúng transaction rõ ràng.
8. Không; H2 chỉ chứng minh phần lớn mapping/control flow. Dialect, key, isolation, lock và plan phải test engine production.
</details>

## Tài liệu chính thức

- [MyBatis 3.5.19 introduction/configuration](https://mybatis.org/mybatis-3/) · [Mapper XML](https://mybatis.org/mybatis-3/sqlmap-xml.html) · [Dynamic SQL XML](https://mybatis.org/mybatis-3/dynamic-sql.html) · [Java API/session/cache](https://mybatis.org/mybatis-3/java-api.html)
- [MyBatis-Spring transactions](https://mybatis.org/spring/transactions.html) · [`SqlSessionTemplate`](https://mybatis.org/spring/sqlsession.html) · [Spring Boot Starter 4.0.0](https://mybatis.org/spring-boot-starter/mybatis-spring-boot-autoconfigure/)
- [Dapper official repository](https://github.com/DapperLib/Dapper) · [ADO.NET local transactions](https://learn.microsoft.com/en-us/dotnet/framework/data/adonet/local-transactions)
