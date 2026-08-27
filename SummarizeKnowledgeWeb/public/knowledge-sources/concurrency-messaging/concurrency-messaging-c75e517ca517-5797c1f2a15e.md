# BatchEtlSample — hướng dẫn luồng xử lý và kỹ thuật sử dụng

## 1. Mục tiêu của project

`BatchEtlSample` minh họa cách xây dựng một ETL pipeline có khả năng xử lý dữ
liệu theo batch và chạy nhiều worker đồng thời trong .NET.

Pipeline thực hiện ba bước chính:

1. **Extract:** đọc từng dòng từ file CSV nguồn.
2. **Transform:** kiểm tra dữ liệu, chuẩn hóa kiểu dữ liệu và loại record trùng.
3. **Load:** ghi từng batch hợp lệ vào repository, sau đó export kết quả ra CSV.

Project không dùng package ngoài. `InMemoryOrderRepository` đóng vai trò database
giả lập để sample có thể chạy ngay. Trong ứng dụng thực tế, class này có thể được
thay bằng SQL Server, PostgreSQL hoặc một hệ thống lưu trữ khác.

## 2. Sơ đồ tổng thể

```text
BatchEtlSample/Assets/orders-input.csv
        │
        ▼
CsvOrderExtractor
  đọc streaming từng dòng
        │
        ▼
EtlPipeline.ProducePartitionsAsync
  gom N dòng thành một OrderPartition
        │
        ▼
Bounded Channel<OrderPartition>
  hàng đợi có giới hạn dung lượng
        │
        ├──────────────┬──────────────┐
        ▼              ▼              ▼
     Worker 1       Worker 2       Worker N
        │              │              │
        └────── OrderTransformer ─────┘
               validate + filter
                       │
                       ▼
          InMemoryOrderRepository
                 bulk upsert
                       │
                       ▼
 BatchEtlSample/Output/orders-output.csv
```

Producer chỉ chịu trách nhiệm đọc và chia partition. Các consumer worker lấy
partition từ channel, transform rồi load song song. Cấu trúc này tách biệt từng
giai đoạn và tránh phải nạp toàn bộ file nguồn vào RAM.

## 3. Flow code đi qua các file

### Bước 1 — Khởi động trong `Program.cs`

Đây là composition root và entry point của chương trình.

Flow khởi động:

1. Đọc đường dẫn input và output từ command-line arguments. Input mặc định là
   `BatchEtlSample/Assets/orders-input.csv` khi chạy từ thư mục solution, hoặc
   `Assets/orders-input.csv` khi chạy từ thư mục project.
2. Nếu input chưa tồn tại, tạo thư mục `Assets` rồi gọi
   `GenerateSampleInputAsync` để tạo 10.000 dòng mẫu.
3. Khởi tạo `EtlOptions` với kích thước batch, số worker và sức chứa channel.
4. Khởi tạo extractor, transformer, repository và `EtlPipeline`.
5. Đăng ký sự kiện `Console.CancelKeyPress` để nhận `Ctrl+C`.
6. Gọi `pipeline.RunAsync(...)`.
7. Tạo folder `Output` nếu cần; khi pipeline hoàn thành, gọi
   `repository.ExportAsync(...)`.
8. In thống kê và thời gian thực thi.

Các đối tượng được tạo thủ công thay vì dùng dependency-injection container để
giữ sample nhỏ và tập trung vào ETL. Với Worker Service hoặc ASP.NET Core, các
class này có thể được đăng ký vào `IServiceCollection`.

### Bước 2 — Định nghĩa dữ liệu trong `Models.cs`

File này chứa các record và cấu hình được truyền giữa các bước:

- `RawOrder`: dữ liệu thô vừa đọc từ CSV; mọi field vẫn là `string`.
- `Order`: dữ liệu đã được validate và chuyển sang kiểu domain phù hợp.
- `OrderPartition`: một batch dữ liệu kèm số thứ tự partition.
- `EtlOptions`: cấu hình `BatchSize`, `WorkerCount` và `ChannelCapacity`.

Việc tách `RawOrder` khỏi `Order` giúp dữ liệu chưa kiểm tra không bị nhầm với dữ
liệu đã hợp lệ. Nó cũng làm ranh giới giữa Extract và Transform rõ ràng hơn.

### Bước 3 — Extract trong `CsvOrderExtractor.cs`

`ExtractAsync` mở file bằng `StreamReader` và trả về
`IAsyncEnumerable<RawOrder>`.

```text
Đọc một dòng → parse cột → yield RawOrder → tiếp tục dòng kế tiếp
```

Do sử dụng `yield return`, mỗi record được đẩy tiếp vào pipeline ngay sau khi đọc.
File 100 MB hay 10 GB không cần được giữ toàn bộ trong bộ nhớ.

Nếu một dòng không có đúng bốn cột, extractor vẫn trả một `RawOrder` rỗng. Bước
Transform sẽ nhận diện record này là invalid và cập nhật thống kê. Cách làm này
giữ logic thống kê lỗi ở một nơi.

> Parser hiện tại dùng `string.Split(',')` để sample dễ đọc. Với CSV production có
> dấu phẩy, dấu nháy hoặc xuống dòng trong field, nên thay bằng một CSV parser đầy
> đủ như CsvHelper.

### Bước 4 — Tạo pipeline trong `EtlPipeline.cs`

`RunAsync` tạo bounded channel và hai nhóm task:

- Một producer task chạy `ProducePartitionsAsync`.
- `WorkerCount` consumer task cùng chạy `ConsumeAsync`.

Sau đó `Task.WhenAll` đợi producer và toàn bộ worker hoàn thành:

```csharp
await Task.WhenAll(workers.Prepend(producer));
```

Pipeline chỉ kết thúc khi không còn dữ liệu trong channel và tất cả batch đã được
xử lý xong.

### Bước 5 — Chia partition trong `ProducePartitionsAsync`

Producer duyệt bất đồng bộ qua kết quả của extractor và thêm record vào một
`List<RawOrder>` có capacity bằng `BatchSize`.

Khi list đủ kích thước:

1. Tăng số partition.
2. Cập nhật số record extracted.
3. Đóng gói list thành `OrderPartition`.
4. Gọi `writer.WriteAsync(...)` để đưa partition vào channel.
5. Tạo list mới cho partition tiếp theo.

Sau khi đọc hết file, batch cuối vẫn được gửi dù số record nhỏ hơn `BatchSize`.

Khối `finally` gọi `writer.TryComplete(error)`. Điều này rất quan trọng vì nó báo
cho các consumer rằng không còn partition mới. Nếu producer gặp lỗi, lỗi cũng được
gắn vào channel và truyền tới phía đọc.

### Bước 6 — Phân phối cho nhiều worker trong `ConsumeAsync`

Tất cả worker cùng đọc từ một `ChannelReader<OrderPartition>`:

```csharp
await foreach (var partition in reader.ReadAllAsync(cancellationToken))
```

Mỗi partition chỉ được channel giao cho đúng một worker. Worker nào xử lý xong
trước sẽ lấy partition tiếp theo, vì vậy tải được phân phối động thay vì gắn cứng
một vùng dữ liệu cho một thread cụ thể.

Với mỗi partition, worker:

1. Gọi `OrderTransformer.Transform`.
2. Bỏ qua thao tác load nếu batch không còn record hợp lệ.
3. Gọi `BulkUpsertAsync` cho danh sách hợp lệ.
4. Cập nhật số record loaded.
5. In worker ID và kết quả partition ra console.

### Bước 7 — Transform trong `OrderTransformer.cs`

Transformer thực hiện các rule:

- `OrderId` và `Customer` không được rỗng.
- `Amount` phải parse được bằng invariant culture và lớn hơn 0.
- `CreatedAt` phải là ngày giờ hợp lệ.
- `Customer` được trim.
- `Amount` được làm tròn hai chữ số thập phân.
- `CreatedAt` được chuẩn hóa về UTC.
- `OrderId` trùng bị loại bỏ.

`ConcurrentDictionary<string, byte>` lưu các `OrderId` đã gặp. Vì một instance
transformer được dùng chung bởi nhiều worker, collection thông thường như
`HashSet<string>` sẽ gây race condition. `TryAdd` thực hiện kiểm tra-và-thêm như
một thao tác atomic, nên chỉ một worker có thể nhận một `OrderId`.

### Bước 8 — Load trong `InMemoryOrderRepository.cs`

Repository dùng `ConcurrentDictionary<string, Order>` để giả lập bảng Orders.

`BulkUpsertAsync` nhận cả batch thay vì insert từng record. `Task.Delay` mô phỏng
thời gian chờ I/O của database. Sau đó `AddOrUpdate` thực hiện upsert theo
`OrderId` theo cách thread-safe.

Khi pipeline hoàn tất, `ExportAsync` sắp xếp dữ liệu theo `OrderId` và ghi ra
`BatchEtlSample/Output/orders-output.csv`.

Trong production:

- SQL Server: có thể dùng `SqlBulkCopy` vào staging table rồi chạy `MERGE` hoặc
  câu lệnh upsert phù hợp.
- EF Core: tạo một `DbContext` riêng cho từng worker hoặc từng batch.
- Không dùng chung một `DbContext` cho nhiều worker vì `DbContext` không
  thread-safe.

### Bước 9 — Thu thập số liệu trong `EtlStatistics.cs`

Nhiều worker cùng cập nhật một instance `EtlStatistics`. Các counter không dùng
phép cộng thông thường mà sử dụng:

- `Interlocked.Increment` để tăng một đơn vị.
- `Interlocked.Add` để cộng số lượng của batch.
- `Interlocked.Read` để đọc giá trị 64-bit hiện tại.

Nhờ vậy các phép cập nhật không bị mất khi hai worker thay đổi counter cùng lúc.

## 4. Các kỹ thuật được sử dụng

### Async streaming với `IAsyncEnumerable<T>`

Extractor vừa đọc vừa phát dữ liệu. Kỹ thuật này phù hợp với nguồn I/O lớn vì:

- Không phải đợi đọc hết file mới bắt đầu transform.
- Không giữ toàn bộ file trong RAM.
- `await foreach` hỗ trợ cancellation tự nhiên.

### Producer–consumer

Pipeline có một producer và nhiều consumer:

- Producer đọc file và tạo partition.
- Consumer transform và load partition.
- Channel là hàng đợi giao tiếp an toàn giữa hai phía.

Mỗi thành phần có trách nhiệm rõ ràng và tốc độ xử lý của từng giai đoạn có thể
được điều chỉnh độc lập.

### Bounded `Channel<T>` và backpressure

Channel có giới hạn `ChannelCapacity`. Khi channel đầy, `WriteAsync` của producer
sẽ chờ cho đến khi worker lấy bớt dữ liệu.

Đây là backpressure: phía đọc nguồn không được phép chạy nhanh vô hạn so với phía
load. Nếu không có giới hạn, producer có thể tạo hàng nghìn partition đang chờ và
làm tăng bộ nhớ đến mức ứng dụng bị lỗi.

`SingleWriter = true` cho runtime biết chỉ có một producer, giúp channel tối ưu
đường ghi. Có nhiều reader nên không đặt `SingleReader = true`.

### Data partitioning

Dữ liệu được gom theo `BatchSize` thay vì tạo một task cho mỗi record. Partition
giúp:

- Giảm overhead tạo và schedule task.
- Tận dụng bulk insert/bulk upsert của database.
- Giới hạn lượng dữ liệu mà một worker giữ tại một thời điểm.
- Dễ retry hoặc ghi log theo batch.

Batch quá nhỏ tạo nhiều overhead; batch quá lớn tăng RAM, thời gian lock và chi
phí retry. Giá trị phù hợp cần được benchmark với dữ liệu và database thực tế.

### Task-based concurrency

Source không tạo `Thread` trực tiếp. Các worker là `Task` và được .NET runtime
điều phối trên thread pool. Đây là abstraction phù hợp hơn vì:

- Không cần tự quản lý lifetime của thread.
- Hoạt động tốt với `async/await` khi chờ file hoặc database.
- Runtime có thể sử dụng thread hiệu quả hơn.

Số worker giới hạn bởi `WorkerCount`; pipeline không tạo task không giới hạn.

### Thread-safe shared state

Hai loại shared state được bảo vệ:

- Tập `OrderId` và repository dùng `ConcurrentDictionary`.
- Counter thống kê dùng `Interlocked`.

Không có `List<T>`, `Dictionary<TKey,TValue>` hoặc biến counter thông thường nào
được nhiều worker ghi đồng thời.

### Atomic duplicate filtering

`_seenOrderIds.TryAdd(orderId, 0)` kết hợp hai hành động “đã tồn tại chưa?” và
“thêm vào tập” thành một thao tác thread-safe. Việc viết tách thành
`ContainsKey` rồi `Add` sẽ có khoảng trống để hai worker cùng chấp nhận một ID.

### Bulk operation

Repository nhận `IReadOnlyList<Order>` cho mỗi lần load. Dù repository mẫu lưu
in-memory, interface xử lý theo batch phản ánh cách tối ưu database thực tế: giảm
số round-trip và tăng throughput so với ghi từng dòng.

### Graceful cancellation

`CancellationToken` được truyền xuyên suốt:

```text
Program
  → EtlPipeline
    → CsvOrderExtractor
    → Channel.WriteAsync/ReadAllAsync
    → BulkUpsertAsync
    → ExportAsync
```

Khi người dùng nhấn `Ctrl+C`, token bị cancel. Các thao tác đang chờ nhận tín hiệu
và pipeline dừng bằng `OperationCanceledException`, sau đó `Program.cs` xử lý để
kết thúc có kiểm soát.

### Error propagation và channel completion

Producer hoàn tất channel trong `finally`, kể cả khi đọc file thất bại. Việc truyền
exception vào `TryComplete(error)` giúp consumer không chờ vô hạn và lỗi được đưa
trở lại task đang đợi `Task.WhenAll`.

### Immutable data bằng record

`RawOrder`, `Order`, `OrderPartition` và `EtlOptions` là record. Dữ liệu được tạo
một lần và không bị thay đổi trong lúc truyền giữa worker, giúp giảm rủi ro race
condition và làm code dễ suy luận hơn.

### Culture-independent parsing

`InvariantCulture` được dùng khi parse và format số/ngày. Kết quả ETL vì vậy không
phụ thuộc máy đang chạy dùng locale Việt Nam, Mỹ hay locale khác.

### Dependency composition

`EtlPipeline` nhận extractor, transformer, repository và options qua constructor.
Các dependency không được khởi tạo bên trong pipeline, nên có thể thay thế hoặc
mock từng thành phần khi viết unit test.

## 5. Ý nghĩa các cấu hình

```csharp
var options = new EtlOptions(
    BatchSize: 500,
    WorkerCount: Math.Max(2, Environment.ProcessorCount),
    ChannelCapacity: 8);
```

| Cấu hình | Ý nghĩa | Ảnh hưởng |
|---|---|---|
| `BatchSize` | Số record trong một partition | Lớn hơn có thể tăng hiệu quả bulk nhưng dùng nhiều RAM hơn |
| `WorkerCount` | Số partition xử lý đồng thời | Quá lớn có thể làm cạn connection pool hoặc tăng contention |
| `ChannelCapacity` | Số partition tối đa đang chờ | Giới hạn RAM và quyết định mức buffer giữa producer/consumer |

Không nên mặc định rằng số worker càng lớn càng nhanh. Với ETL ghi database, giới
hạn thường nằm ở connection pool, IOPS, transaction log hoặc lock của database.

## 6. Cách chạy và quan sát

Từ thư mục solution:

```powershell
dotnet run --project .\BatchEtlSample
```

Chạy với file riêng:

```powershell
dotnet run --project .\BatchEtlSample -- .\BatchEtlSample\Assets\orders-input.csv .\BatchEtlSample\Output\orders-output.csv
```

Output console thể hiện nhiều worker nhận các partition khác nhau. Thứ tự hoàn
thành không nhất thiết giống thứ tự partition; đây là hành vi bình thường của xử
lý đồng thời. File output mặc định nằm trong `BatchEtlSample/Output`, được sort
theo `OrderId`, nên kết quả cuối vẫn ổn định.

## 7. Các điểm cần nâng cấp cho production

Sample tập trung vào concurrency nên một hệ thống thực tế nên bổ sung:

1. CSV parser đầy đủ cho quoted field và escaped delimiter.
2. Repository database thật và connection resiliency.
3. Transaction hoặc staging table cho tính atomic của mỗi batch.
4. Retry có giới hạn cho lỗi tạm thời; không retry lỗi dữ liệu.
5. Dead-letter storage cho record invalid.
6. Structured logging, metrics và distributed tracing.
7. Checkpoint để resume sau khi process dừng giữa chừng.
8. Idempotency để chạy lại batch không tạo dữ liệu trùng.
9. Unit test cho transformer và integration test cho repository.
10. Tách token dừng ứng dụng khỏi timeout riêng của từng database operation.

Một điểm quan trọng: duplicate filter hiện lưu toàn bộ `OrderId` đã gặp trong RAM.
Với tập dữ liệu cực lớn, nên chuyển việc đảm bảo uniqueness sang database, dùng
partition theo khóa, hoặc dùng external state/checkpoint thay vì giữ mọi ID trong
một `ConcurrentDictionary` của process.
