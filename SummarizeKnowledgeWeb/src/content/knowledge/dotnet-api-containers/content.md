## Nguồn và trạng thái thực tế

| Nguồn | Nội dung | Trạng thái |
|---|---|---|
| `AspNetDeployWithDocker` | Minimal API .NET 8 + Docker Linux | template chạy thử |
| `AspNetDeployWithDockerWindows` | cùng API + Docker Windows Nano Server | biến thể hệ điều hành |
| `GraphQLFromConsole` | ý định Hot Chocolate + EF Core SQL Server | **draft chưa hoàn chỉnh** |

Hai project Docker trùng gần như toàn bộ `Program.cs`, appsettings, Swagger, request mẫu và launch profile. Vì vậy kiến thức chung chỉ được trình bày một lần; Linux và Windows là hai biến thể build/runtime, không phải hai chủ đề API riêng.

Hai bộ `Interview/c_sharp.md` và `Interview/dotnet_aspnet.md` cùng answer tương ứng bổ sung phần ngôn ngữ/runtime/framework còn thiếu trong ba demo. Question và answer được xem là một cặp học tập, không nhân thành tab mới.

## C# type system, object model và API design

C# phân biệt value type và reference type theo semantics lưu trữ/copy, không đơn giản là “stack so với heap”. Boxing biến value thành object và có allocation/copy; unboxing cần đúng underlying type. `record` cung cấp value-based equality mặc định, còn class thường dùng reference equality trừ khi override `Equals`/`GetHashCode`. Key trong dictionary phải giữ hash/equality ổn định khi đang được lưu.

Các abstraction quan trọng:

- **Generics** giữ type safety và tránh boxing cho nhiều value type; constraint mô tả capability. Variance chỉ áp dụng ở vị trí an toàn của interface/delegate (`out` producer, `in` consumer).
- **Delegate** là typed callable; event giới hạn quyền raise cho publisher. Closure có thể capture biến và kéo dài lifetime ngoài dự kiến.
- **Nullable reference types** là static analysis contract, không phải runtime null guard; vẫn validate input ở boundary.
- **LINQ** thường deferred: query chạy khi enumerate. Enumerate nhiều lần có thể gọi DB/tính toán nhiều lần; `IQueryable` còn được provider dịch expression tree, không phải mọi .NET method đều dịch được.
- **Reflection/expression/dynamic** hữu ích cho framework/tooling nhưng làm mất compile-time guarantee và tăng cost; cache metadata/delegate khi ở hot path.
- `Span<T>`/`Memory<T>` giúp xử lý buffer ít allocation. `Span<T>` là `ref struct`, bị giới hạn lifetime và không đi qua `await`/heap tùy ý.

Public API nên nhỏ, nullable/exception/cancellation semantics rõ và ưu tiên immutable DTO/value. `IDisposable`/`await using` biểu diễn ownership của resource; GC không thay việc đóng socket, stream hoặc database connection đúng lúc.

## CLR, assembly, GC và chẩn đoán hiệu năng

C# compile thành IL + metadata trong assembly; CLR load type và JIT native code theo runtime/architecture. Assembly load context, version và dependency resolution ảnh hưởng plugin, unload và type identity. ReadyToRun/AOT có thể giảm startup nhưng đổi build size, reflection/dynamic support và peak optimization—phải benchmark theo workload.

Managed heap chia generation để collection object sống ngắn rẻ hơn; object lớn đi vào LOH, pinned buffer có thể tăng fragmentation. Finalizer là safety net đắt và không deterministic. Dùng allocation profile, GC pause/time, thread-pool queue, exception rate và trace trước khi tối ưu; tránh đoán từ một snapshot CPU.

Async I/O giải phóng thread trong lúc chờ; nó không làm CPU work nhanh hơn. `Task` là handle, exception/cancellation phải được observe và truyền `CancellationToken` đến operation thật. Chi tiết backpressure, bounded concurrency và pipeline nằm ở tab Concurrency & Messaging; tại API boundary, mục tiêu là deadline đầu cuối và không để request bị bỏ nhưng work vẫn chạy vô hạn.

## ASP.NET Core application model

Generic Host gom configuration, logging, DI và lifecycle. DI lifetime phải khớp ownership: singleton sống toàn app, scoped thường theo request, transient tạo mỗi lần resolve; singleton giữ scoped service tạo **captive dependency**. Options nên bind + validate khi startup cho config bắt buộc.

Middleware chạy theo thứ tự đăng ký cả chiều vào và chiều ra. Exception handling, forwarded headers/HTTPS, routing, CORS, authentication, authorization, rate limit và endpoint mapping phải đặt theo semantics, không copy thứ tự mù. Model binding tạo input nhưng validation/business invariant vẫn cần error contract ổn định. Health check phân biệt liveness với readiness; shutdown cần ngừng nhận traffic rồi drain trong deadline.

Outbound HTTP dùng `IHttpClientFactory`/handler lifetime để tránh socket exhaustion và DNS stale; vẫn cần connect/read/total timeout, retry có jitter chỉ cho lỗi/thao tác an toàn, circuit/bulkhead và telemetry. Cache cần key/TTL/invalidation/stampede strategy; response/output cache không thay authorization và data ownership.

## EF Core, transaction và data access

`DbContext` là unit-of-work ngắn hạn, không thread-safe và thường scoped theo request/use case. Tracking phù hợp update aggregate; query chỉ đọc dùng `AsNoTracking` khi đo thấy lợi. Projection ở database tránh materialize thừa; eager/lazy loading thiếu kiểm soát gây N+1. Xem generated SQL và query plan thay vì suy từ LINQ đẹp.

Transaction bảo vệ invariant trong một database boundary. Optimistic concurrency token phát hiện lost update nhưng cần conflict/retry/UX rõ; retry cả transaction phải idempotent. Migration production dùng additive/expand–migrate–contract, backup/rollback và compatibility giữa hai version app. Connection pool là tài nguyên hữu hạn: async không tạo thêm connection, nên bound concurrency và đặt command timeout/cancellation.

Repository abstraction chỉ hữu ích khi che một boundary/domain query thật; bọc EF bằng CRUD generic thường làm mất capability và vẫn leak `IQueryable`. Integration test với database gần production cần thiết cho mapping, constraint, transaction và migration.

## Minimal API và request pipeline

Composition root đăng ký endpoint discovery và Swagger, build application, bật Swagger trong Development, chuyển hướng HTTPS rồi map endpoint:

```csharp
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.MapGet("/weatherforecast", () => /* result */)
   .WithName("GetWeatherForecast")
   .WithOpenApi();
app.Run();
```

`WeatherForecast` là record response; `TemperatureF` là computed property. Đây là template minh họa endpoint và OpenAPI, chưa có application/domain/persistence boundary, validation, authentication, test hay telemetry chuyên biệt.

## Multi-stage Docker build

Cả hai Dockerfile dùng bốn stage có cùng vai trò:

```text
base (runtime) ← final (artifact nhỏ để chạy)
       ↑
build (SDK, restore/build) → publish
```

Thứ tự copy `.csproj` rồi restore trước khi copy toàn source giúp Docker cache dependency layer. `dotnet publish /p:UseAppHost=false` tạo output framework-dependent; final image chỉ nhận thư mục publish và chạy DLL.

Các port `8080` và `8081` được `EXPOSE`, nhưng `EXPOSE` chỉ là metadata. Mapping host port, certificate và scheme vẫn do Docker/Visual Studio/orchestrator cấu hình.

## Linux và Windows là hai biến thể

| Điểm | Linux project | Windows project |
|---|---|---|
| Runtime image | `aspnet:8.0` | `aspnet:8.0-nanoserver-1809` |
| SDK image | `sdk:8.0` | `sdk:8.0-nanoserver-1809` |
| Build variable | `$BUILD_CONFIGURATION` | `%BUILD_CONFIGURATION%` |
| Runtime user | `USER $APP_UID` | sample không khai báo `USER` |
| Project property | `DockerDefaultTargetOS=Linux` | `DockerDefaultTargetOS=Windows` |
| Entry assembly | `AspNetDeployWithDocker.dll` | `AspNetDeployWithDockerWindows.dll` |

Linux và Windows container phải tương thích với host/container mode tương ứng. Không copy cú pháp shell, path hay base image giữa hai Dockerfile mà không kiểm tra. Trong production còn cần pin image/digest theo policy, scan artifact, cấu hình non-root, health check, resource limit, graceful shutdown và secret ngoài image.

## Port, profile và kiểm thử thủ công

`launchSettings.json` có bốn profile: HTTP, HTTPS, IIS Express và Dockerfile. Port local của hai project khác nhau; Docker profile dùng `ASPNETCORE_HTTP_PORTS=8080`, `ASPNETCORE_HTTPS_PORTS=8081`, publish all ports và mở `/swagger`.

File `.http` gọi `GET /weatherforecast` để kiểm thử nhanh. Luồng kiểm tra nên là:

1. Chạy đúng profile và xem URL thực trong console.
2. Mở `/swagger` chỉ ở Development.
3. Gọi endpoint bằng `.http` hoặc client độc lập.
4. Với container, kiểm tra port mapping chứ không suy ra từ `EXPOSE`.
5. Xác nhận HTTPS certificate/termination ở đúng boundary.

`appsettings.json` chỉ có logging và `AllowedHosts`; production cần externalized config, validation, secrets, structured logs và health endpoints phù hợp.

## Ý định của GraphQL draft

`GraphQLFromConsole` khai báo package `HotChocolate.AspNetCore`, `GraphQL.Client`, EF Core và SQL Server. `Startup.ConfigureServices` thể hiện ý định:

```csharp
services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(connectionString));

services.AddGraphQLServer()
    .AddQueryType<Query>()
    .AddType<ProductType>();
```

`Configure` muốn map endpoint bằng `endpoints.MapGraphQL()`. Kiến trúc mong đợi là HTTP GraphQL request → schema/query resolver → application/data access → EF Core/SQL Server.

GraphQL cho client chọn shape dữ liệu, nhưng production phải kiểm soát authorization theo field/object, query depth/complexity, pagination, batching/DataLoader để tránh N+1, timeout và observability. Nó không tự thay domain boundary hay transaction design.

## Vì sao GraphQL hiện chưa chạy được

> `GraphQLFromConsole` phải được hiển thị là **Draft / Incomplete**, không phải sample đã hoạt động.

Các khoảng trống nhìn thấy trực tiếp trong source:

- `Program.cs` chỉ in `Hello, World!`, không dựng web host.
- Project dùng `Microsoft.NET.Sdk` console thay vì web hosting setup hoàn chỉnh.
- Thiếu `ApplicationDbContext`, `Query` và `ProductType`.
- `Startup` dùng `Configuration` nhưng không khai báo/inject thuộc tính đó.
- Code đọc connection string tên `Defau`, trong khi JSON khai báo `DefaultConnectionString`.
- Chưa có middleware routing đầy đủ, migration/schema, resolver implementation hay test.

Đường hoàn thiện tối thiểu là chọn hosting model nhất quán, thêm model/DbContext/schema query, bind đúng cấu hình, map GraphQL endpoint, tạo migration/database và test query + authorization + error contract.

## Checklist đưa API/container gần production

- [ ] Tách transport DTO, application use case và infrastructure khi nghiệp vụ tăng.
- [ ] Validation, stable error code và trace ID; không trả stack/SQL ra client.
- [ ] Authentication, endpoint/field authorization và object ownership.
- [ ] Connect/read/total deadline, idempotency cho mutating request có retry.
- [ ] Readiness khác liveness; dừng nhận traffic trước khi drain.
- [ ] Image tối thiểu, non-root, không bake secret, có SBOM/scan/provenance.
- [ ] Chừa memory headroom ngoài managed heap và đặt CPU/memory limit có load test.
- [ ] API/schema/database deploy theo additive rồi expand/contract.
- [ ] Integration/contract test chạy trên container và dependency gần production.

Hai Docker project là điểm khởi đầu tốt để học build mechanics; GraphQL project là checklist kiến trúc cần hoàn thiện. Không project nào tự thân chứng minh production readiness.
