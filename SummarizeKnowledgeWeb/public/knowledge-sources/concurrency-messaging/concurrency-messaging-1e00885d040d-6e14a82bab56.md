# Các kỹ thuật khác được sử dụng trong FileProcessingSample

Ngoài `Channel<T>`, `FileProcessingSample` còn sử dụng nhiều kỹ thuật concurrency
và xử lý file thường gặp trong ứng dụng thực tế.

## 1. Task-based concurrency

Ứng dụng tạo nhiều worker dưới dạng `Task`:

```csharp
var workers = Enumerable.Range(1, options.WorkerCount)
    .Select(workerId => RunWorkerAsync(...))
    .ToArray();
```

.NET tự điều phối các task qua thread pool. Ứng dụng không phải tạo và quản lý
`Thread` trực tiếp.

Lợi ích:

- Không phải quản lý lifetime của từng thread.
- Kết hợp tự nhiên với `async/await`.
- Thread pool có thể tái sử dụng thread.
- Dễ chờ nhiều worker bằng `Task.WhenAll`.

## 2. Giới hạn concurrency

Số worker được giới hạn trong `Program.cs`:

```csharp
WorkerCount: Math.Clamp(Environment.ProcessorCount, 2, 8)
```

Chỉ tối đa 8 file được xử lý đồng thời. Giới hạn này giúp tránh:

- Mở quá nhiều file handle.
- Disk I/O bị quá tải.
- CPU bị chiếm hết bởi SHA-256 và GZip.
- Sử dụng quá nhiều buffer và bộ nhớ.

Tăng số worker không phải lúc nào cũng làm chương trình nhanh hơn. Với HDD, nhiều
worker cùng đọc có thể làm tăng random seek. SSD, NVMe hoặc nhiều disk thường xử
lý concurrency tốt hơn.

## 3. Producer–consumer

Pipeline được tách thành producer và consumer:

```text
InputFileDiscovery → Job Queue → Multiple Workers
```

- `InputFileDiscovery` là producer tìm file và tạo `FileJob`.
- Các worker là consumer lấy job và xử lý file.
- Producer và consumer có thể chạy với tốc độ khác nhau.
- Queue tạo ranh giới rõ ràng giữa khâu discovery và processing.

## 4. Fan-out và fan-in

```text
                         ┌→ Worker 1 ─┐
Producer → Job Channel ──┼→ Worker 2 ─┼→ Result Channel → Collector
                         └→ Worker N ─┘
```

- **Fan-out:** một luồng job được phân phối cho nhiều worker.
- **Fan-in:** kết quả từ nhiều worker được gom về một collector.

Fan-out tăng throughput. Fan-in tạo một nơi duy nhất sở hữu danh sách kết quả,
tránh nhiều worker cùng thay đổi một `List<T>` không thread-safe.

## 5. Async file I/O

Source sử dụng các API bất đồng bộ:

```csharp
await reader.ReadLineAsync(cancellationToken);
await SHA256.HashDataAsync(stream, cancellationToken);
await source.CopyToAsync(gzip, bufferSize, cancellationToken);
await JsonSerializer.SerializeAsync(...);
```

Trong lúc chờ disk hoàn thành I/O, worker không cần giữ một thread ở trạng thái
blocking. Thread pool có thể dùng thread đó để phục vụ công việc khác.

Async I/O đặc biệt hữu ích khi:

- Có nhiều file cần xử lý.
- Đọc từ network drive hoặc cloud storage.
- Disk có độ trễ cao.
- Ứng dụng còn phải phục vụ các task khác.

## 6. Streaming processing

File được đọc từng dòng:

```csharp
while (await reader.ReadLineAsync(cancellationToken) is { } line)
{
    // Phân tích một dòng.
}
```

Source không sử dụng:

```csharp
File.ReadAllText(...);
File.ReadAllLines(...);
```

Vì vậy, ứng dụng có thể xử lý file lớn mà không nạp toàn bộ nội dung vào RAM.
Lượng bộ nhớ chủ yếu phụ thuộc vào số worker, buffer và độ dài dòng hiện tại.

## 7. Lazy file discovery

Ứng dụng quét file bằng:

```csharp
Directory.EnumerateFiles(
    inputDirectory,
    "*",
    SearchOption.AllDirectories);
```

`EnumerateFiles` trả path lần lượt theo kiểu lazy. Nó không cần tạo toàn bộ mảng
path trước khi producer bắt đầu ghi job.

Kết hợp với bounded channel:

```text
Tìm một file → tạo job → đưa vào queue → tìm file tiếp theo
```

Đây là điểm quan trọng khi input có hàng trăm nghìn hoặc hàng triệu file.

## 8. Thread-safe counter bằng Interlocked

Nhiều worker cùng cập nhật `ProcessingStatistics`:

```csharp
Interlocked.Increment(ref _succeeded);
Interlocked.Add(ref _sourceBytes, sourceBytes);
Interlocked.Read(ref _succeeded);
```

`counter++` không thread-safe vì thực tế gồm ba bước:

```text
Đọc counter → tăng giá trị → ghi lại
```

Hai thread có thể cùng đọc một giá trị và ghi đè kết quả của nhau.
`Interlocked` thực hiện cập nhật atomic, tránh race condition mà không cần khóa cả
object bằng `lock`.

## 9. Immutable data bằng record

Các model sử dụng immutable record:

```csharp
public sealed record FileJob(...);
public sealed record FileProcessingResult(...);
```

Dữ liệu được tạo rồi truyền giữa các stage mà không bị thay đổi. Điều này giúp:

- Giảm shared mutable state.
- Giảm nguy cơ race condition.
- Làm ownership của dữ liệu rõ ràng.
- Dễ log, test và so sánh kết quả.

## 10. Graceful cancellation

Một `CancellationToken` được truyền xuyên suốt pipeline:

```text
Program
  → FileProcessingPipeline
    → InputFileDiscovery
    → Channel read/write
    → TextFileAnalyzer
    → SHA-256
    → GzipFileCompressor
    → JsonReportWriter
```

Khi người dùng nhấn `Ctrl+C`:

```csharp
cancellation.Cancel();
```

Pipeline dừng tại cancellation point gần nhất thay vì kill process ngay lập tức.
Các stream được dispose thông qua `using` và `await using`.

## 11. Per-file fault isolation

Mỗi file được xử lý trong một `try/catch` riêng:

```csharp
try
{
    result = await processor.ProcessAsync(...);
}
catch (Exception exception)
{
    result = new FileProcessingResult(
        Success: false,
        Error: exception.Message,
        ...);
}
```

Một file lỗi không làm dừng các file còn lại. Lỗi được chuyển thành
`FileProcessingResult` và xuất hiện trong report.

Riêng `OperationCanceledException` được ném tiếp vì cancellation là yêu cầu dừng
toàn pipeline, không phải lỗi nghiệp vụ của một file.

## 12. Atomic file output

File nén được ghi vào một file tạm:

```text
source.log
    │
    ▼
random-name.tmp
    │ ghi và flush hoàn tất
    ▼
source.log.gz
```

Sau khi nén thành công:

```csharp
File.Move(temporaryPath, destinationPath, overwrite: true);
```

Nếu compression lỗi hoặc bị cancel, khối `finally` xóa file tạm. Consumer khác
sẽ không nhìn thấy một file `.gz` mang tên chính thức nhưng chỉ chứa dữ liệu dở
dang.

## 13. Idempotent output

Source publish output bằng:

```csharp
File.Move(temporaryPath, destinationPath, overwrite: true);
```

Chạy lại pipeline sẽ thay thế output cùng tên thay vì tạo nhiều bản sao:

```text
file.log.gz
file.log (1).gz
file.log (2).gz
```

Đây là một phần của tính idempotent: cùng input có thể chạy lại mà không tạo thêm
output trùng tên. Trong production vẫn cần checksum, database hoặc checkpoint nếu
muốn đảm bảo idempotency cho toàn bộ workflow.

## 14. Error propagation và task completion

Producer và các worker được chờ bằng:

```csharp
await Task.WhenAll(workers.Prepend(producer));
```

Pipeline chỉ hoàn thành sau khi các task liên quan kết thúc. Nếu có lỗi ở cấp
pipeline:

- Exception được truyền qua channel completion.
- Reader không chờ vô hạn.
- Caller nhận được exception thay vì pipeline im lặng thất bại.

Lỗi riêng của một file vẫn được fault isolation xử lý và không làm fault toàn
pipeline.

## 15. Sequential file access optimization

`FileStream` được mở với:

```csharp
FileOptions.Asynchronous |
FileOptions.SequentialScan
```

- `Asynchronous`: cho phép sử dụng async I/O.
- `SequentialScan`: báo cho hệ điều hành rằng file được đọc tuần tự để hệ điều
  hành tối ưu buffering và cache.

Cấu hình này phù hợp vì analyzer, hashing và compressor đều đọc file từ đầu đến
cuối.

## 16. Buffering

Kích thước buffer được cấu hình:

```csharp
StreamBufferSize: 64 * 1024
```

File được đọc và copy theo block 64 KB thay vì từng byte hoặc nạp toàn bộ file.
Buffering giúp giảm số lần gọi I/O trong khi vẫn giữ lượng RAM có giới hạn.

RAM dành cho buffer tăng gần đúng theo số stream đang mở và số worker. Vì vậy
buffer size và worker count nên được benchmark cùng nhau.

## 17. Deterministic output

Worker hoàn thành không đúng thứ tự vì chạy đồng thời. Trước khi ghi report, kết
quả được sort:

```csharp
collectedResults
    .OrderBy(result => result.RelativePath)
    .ToArray();
```

Report vì vậy có thứ tự ổn định, dễ đọc và dễ diff giữa các lần chạy. Thứ tự hoàn
thành của worker không ảnh hưởng thứ tự dữ liệu cuối cùng.

## 18. SHA-256 checksum

Ứng dụng tính checksum bằng:

```csharp
var hash = await SHA256.HashDataAsync(
    hashStream,
    cancellationToken);
```

Checksum có thể được dùng để:

- Kiểm tra file có thay đổi hay không.
- Xác minh tính toàn vẹn sau khi truyền file.
- Nhận diện các file có nội dung giống nhau.
- Hỗ trợ deduplication hoặc checkpoint.

SHA-256 sử dụng CPU, nên số worker cũng giới hạn số phép hash chạy đồng thời.

## 19. GZip compression

Source dùng `GZipStream` để nén file theo streaming:

```csharp
await using var gzip = new GZipStream(
    destination,
    CompressionLevel.Optimal,
    leaveOpen: false);

await source.CopyToAsync(
    gzip,
    bufferSize,
    cancellationToken);
```

GZip vừa sử dụng CPU vừa sử dụng I/O. File rất nhỏ có thể lớn hơn sau khi nén vì
header và metadata của GZip. Hiệu quả rõ hơn với file lớn và nội dung lặp lại.

## 20. Dependency composition

Các dependency được truyền qua constructor:

```csharp
var pipeline = new FileProcessingPipeline(
    new InputFileDiscovery(options),
    new FileProcessor(
        new TextFileAnalyzer(options),
        new GzipFileCompressor(options)),
    new JsonReportWriter(),
    options);
```

`FileProcessingPipeline` không tự tạo analyzer hay compressor bên trong. Cách tổ
chức này giúp:

- Thay implementation dễ hơn.
- Unit test từng component độc lập.
- Có thể chuyển sang dependency injection của Worker Service hoặc ASP.NET Core.

## 21. Tổng hợp

Các kỹ thuật ngoài `Channel<T>` đang được sử dụng:

```text
Task-based concurrency
Concurrency limiting
Producer–consumer
Fan-out / fan-in
Async file I/O
Streaming processing
Lazy enumeration
Interlocked atomic operations
Immutable records
Graceful cancellation
Per-file fault isolation
Atomic output
Idempotent output
Error propagation
Sequential scan optimization
Buffering
Deterministic reporting
SHA-256 checksum
GZip compression
Dependency composition
```

Những kỹ thuật này phối hợp với `Channel<T>` để pipeline có thể xử lý nhiều file
đồng thời, sử dụng bộ nhớ có giới hạn, không làm mất job, cô lập lỗi từng file và
tạo output hoàn chỉnh, ổn định.
