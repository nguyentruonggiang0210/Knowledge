# Channel và Bounded Channel trong .NET

## 1. Channel là gì?

`Channel<T>` trong .NET là một hàng đợi bất đồng bộ, thread-safe, dùng để truyền
dữ liệu giữa producer và consumer.

Channel không phải một thread. Nó là cơ chế phối hợp các `Task` hoặc worker mà
không cần tự xây dựng queue bằng `Queue<T>`, `lock`, `Monitor` hoặc vòng lặp
polling.

Một channel có hai đầu:

```text
ChannelWriter<T>  →  Channel<T>  →  ChannelReader<T>
    Producer                              Consumer
```

- `ChannelWriter<T>` ghi dữ liệu bằng `WriteAsync`.
- `ChannelReader<T>` đọc dữ liệu bằng `ReadAsync` hoặc `ReadAllAsync`.
- Channel có thể hỗ trợ nhiều producer và nhiều consumer cùng lúc.
- Mỗi item được giao cho đúng một reader, không broadcast tới mọi reader.
- Khi chưa có dữ liệu, reader chờ bất đồng bộ thay vì chiếm một thread để polling.
- Khi writer complete, reader xử lý hết dữ liệu còn lại rồi kết thúc.

Ví dụ cơ bản:

```csharp
using System.Threading.Channels;

var channel = Channel.CreateBounded<string>(10);

await channel.Writer.WriteAsync("file-01.log");

var fileName = await channel.Reader.ReadAsync();
Console.WriteLine(fileName);
```

## 2. Channel trong `FileProcessingSample`

Source hiện tại sử dụng hai channel:

| Channel | Loại | Dữ liệu | Vai trò |
|---|---|---|---|
| `jobs` | Bounded | `FileJob` | Chuyển file từ discovery tới các worker |
| `results` | Unbounded | `FileProcessingResult` | Gom kết quả từ nhiều worker về một collector |

Hai channel tạo thành pipeline:

```text
Assets/Input
     │
     ▼
InputFileDiscovery
     │ FileJob
     ▼
Bounded Channel<FileJob>
     │
     ├───────────────┬───────────────┐
     ▼               ▼               ▼
  Worker 1        Worker 2        Worker N
     │               │               │
     └────── FileProcessingResult ────┘
                     │
                     ▼
Unbounded Channel<FileProcessingResult>
                     │
                     ▼
           Single result collector
                     │
                     ▼
          processing-report.json
```

## 3. Bounded channel là gì?

Bounded channel là channel có giới hạn số item được giữ trong queue.

Trong `FileProcessingPipeline.cs`, job channel được tạo như sau:

```csharp
var jobs = Channel.CreateBounded<FileJob>(new BoundedChannelOptions(
    options.QueueCapacity)
{
    SingleWriter = true,
    FullMode = BoundedChannelFullMode.Wait
});
```

`QueueCapacity` được cấu hình trong `Program.cs`:

```csharp
QueueCapacity: 16
```

Điều này có nghĩa:

- Channel giữ tối đa 16 `FileJob` đang chờ.
- Nếu channel đầy, producer gọi `WriteAsync` sẽ tạm dừng.
- Khi một worker lấy job ra, producer có chỗ để ghi job tiếp theo.
- Thao tác chờ là async và không block một thread.

## 4. Backpressure

Cơ chế producer phải chờ khi bounded channel đầy được gọi là backpressure.

File discovery thường nhanh hơn các công việc xử lý file như:

- Đọc toàn bộ nội dung theo streaming.
- Phân tích số dòng và số từ.
- Tính SHA-256.
- Nén GZip.
- Ghi dữ liệu ra disk.

Nếu job channel là unbounded:

```text
Producer scan file rất nhanh
        │
        ▼
Queue ngày càng lớn
        │
        ▼
Hàng trăm nghìn FileJob nằm trong RAM
        │
        ▼
Tăng memory và có nguy cơ OutOfMemoryException
```

Với bounded channel:

```text
Producer nhanh ── queue đầy ── chờ
                         │
Worker xử lý xong ───────┘
                         │
Producer tiếp tục scan ──┘
```

Ví dụ với cấu hình:

```text
WorkerCount   = 8
QueueCapacity = 16
Số file       = 100.000
```

Tại một thời điểm có thể có:

```text
Tối đa 8 file đang được các worker xử lý
Tối đa 16 FileJob đang chờ trong channel
Các file còn lại chưa được producer đưa vào queue
```

Producer không cần tạo 100.000 `FileJob` và giữ tất cả trong RAM.

## 5. Producer tương tác với bounded channel

Producer nằm trong `FileProcessingSample/InputFileDiscovery.cs`.

Nó quét file và ghi từng job vào channel:

```csharp
foreach (var path in Directory.EnumerateFiles(
             inputDirectory,
             "*",
             SearchOption.AllDirectories))
{
    cancellationToken.ThrowIfCancellationRequested();

    if (!options.SupportedExtensions.Contains(Path.GetExtension(path)))
    {
        continue;
    }

    var relativePath = Path.GetRelativePath(inputDirectory, path);

    await writer.WriteAsync(
        new FileJob(path, relativePath),
        cancellationToken);
}
```

Flow của producer:

```text
Directory.EnumerateFiles
        │
        ▼
Kiểm tra extension
        │
        ▼
Tạo FileJob
        │
        ▼
writer.WriteAsync
        │
        ├─ Queue còn chỗ → ghi ngay và tiếp tục scan
        │
        └─ Queue đầy → chờ worker lấy bớt job
```

`Directory.EnumerateFiles` trả dữ liệu theo kiểu lazy. Kết hợp nó với bounded
channel giúp ứng dụng không phải tải toàn bộ danh sách path vào bộ nhớ.

## 6. Worker đọc job như thế nào?

Pipeline tạo nhiều worker:

```csharp
var workers = Enumerable.Range(1, options.WorkerCount)
    .Select(workerId => RunWorkerAsync(
        workerId,
        jobs.Reader,
        results.Writer,
        Path.Combine(outputDirectory, "Compressed"),
        statistics,
        cancellationToken))
    .ToArray();
```

Mỗi worker đọc từ cùng một `ChannelReader<FileJob>`:

```csharp
await foreach (var job in jobs.ReadAllAsync(cancellationToken))
{
    // Phân tích, tính hash và nén file.
}
```

Ví dụ queue đang chứa:

```text
file-01.log
file-02.log
file-03.csv
file-04.txt
```

Channel có thể phân phối:

```text
Worker 1 ← file-01.log
Worker 2 ← file-02.log
Worker 3 ← file-03.csv
Worker 4 ← file-04.txt
```

Hai worker không nhận cùng một `FileJob`. Worker hoàn thành nhanh hơn sẽ lấy job
tiếp theo, tạo cơ chế cân bằng tải động khi kích thước các file khác nhau.

## 7. Ý nghĩa của `SingleWriter`

Job channel cấu hình:

```csharp
SingleWriter = true
```

Trong source chỉ có `InputFileDiscovery` ghi job vào channel. Cấu hình này báo cho
.NET runtime rằng chỉ có một producer ghi dữ liệu, cho phép runtime tối ưu đường
ghi và không phải xử lý cạnh tranh giữa nhiều writer.

`SingleWriter = true` không có nghĩa channel chỉ có một reader. Source vẫn có
nhiều worker đọc job đồng thời.

Nếu sau này có nhiều producer cùng ghi job, cấu hình phải đổi thành:

```csharp
SingleWriter = false
```

## 8. Ý nghĩa của `FullMode = Wait`

```csharp
FullMode = BoundedChannelFullMode.Wait
```

Khi queue đầy, `WriteAsync` chờ đến khi có chỗ trống. Không job nào bị mất.

Các full mode khác gồm:

| Mode | Hành vi khi channel đầy |
|---|---|
| `Wait` | Producer chờ cho đến khi có chỗ |
| `DropWrite` | Bỏ item đang được ghi |
| `DropOldest` | Bỏ item cũ nhất trong queue |
| `DropNewest` | Bỏ item mới nhất đang nằm trong queue |

Xử lý file không được phép âm thầm bỏ job, nên `Wait` là lựa chọn phù hợp cho
source hiện tại.

## 9. Complete job channel

Producer gọi `TryComplete` trong `finally`:

```csharp
finally
{
    writer.TryComplete(completionError);
}
```

### Trường hợp hoàn thành bình thường

```text
Producer scan xong
      │
      ▼
Complete job channel
      │
      ▼
Worker tiếp tục xử lý các job còn lại
      │
      ▼
Queue hết dữ liệu
      │
      ▼
ReadAllAsync kết thúc
      │
      ▼
Worker kết thúc
```

Complete không xóa những item đang còn trong queue.

### Trường hợp producer gặp lỗi

```csharp
writer.TryComplete(exception);
```

Exception được gắn vào channel. Worker không bị chờ vô hạn và lỗi có thể
propagate trở lại pipeline.

Đặt `TryComplete` trong `finally` bảo đảm channel được đóng kể cả khi quá trình
scan thư mục thất bại.

## 10. Result channel

Source còn có một result channel:

```csharp
var results = Channel.CreateUnbounded<FileProcessingResult>(
    new UnboundedChannelOptions
    {
        SingleReader = true,
        SingleWriter = false
    });
```

Flow:

```text
Worker 1 ─┐
Worker 2 ─┼─→ Result Channel → CollectResultsAsync
Worker 3 ─┤
Worker N ─┘
```

Mỗi worker xử lý xong sẽ ghi kết quả:

```csharp
await results.WriteAsync(result, cancellationToken);
```

Collector đọc kết quả:

```csharp
await foreach (var result in reader.ReadAllAsync(cancellationToken))
{
    collected.Add(result);
}
```

Sau khi toàn bộ kết quả được thu thập, danh sách được chuyển cho
`JsonReportWriter` để tạo `processing-report.json`.

## 11. Tại sao result channel là unbounded?

Mỗi `FileProcessingResult` là một object nhỏ và collector đọc kết quả đồng thời
trong lúc worker đang chạy. Worker vì vậy không cần chờ một result queue có giới
hạn.

Cấu hình:

```csharp
SingleReader = true,
SingleWriter = false
```

Ý nghĩa:

- `SingleReader = true`: chỉ `CollectResultsAsync` đọc kết quả.
- `SingleWriter = false`: nhiều worker cùng ghi kết quả.

Result channel giúp nhiều worker không phải cùng sửa một
`List<FileProcessingResult>`. Nếu worker ghi trực tiếp vào một `List<T>` dùng
chung, source sẽ cần `lock` vì `List<T>` không thread-safe.

Report hiện tại vẫn gom toàn bộ result vào RAM. Với hàng triệu file, nên cân nhắc:

- Ghi JSON Lines theo streaming.
- Lưu từng result vào database.
- Sử dụng bounded result channel.
- Không giữ toàn bộ `List<FileProcessingResult>` tới cuối chương trình.

## 12. Complete result channel

`CompleteResultsWhenWorkersFinishAsync` chờ producer và toàn bộ worker:

```csharp
await Task.WhenAll(workers.Prepend(producer));
```

Sau đó đóng result channel:

```csharp
resultWriter.TryComplete(completionError);
```

Thứ tự hoạt động:

```text
Producer kết thúc
      │
      ▼
Workers xử lý hết job
      │
      ▼
Workers không còn ghi result
      │
      ▼
Complete result channel
      │
      ▼
Collector đọc hết result còn lại
      │
      ▼
Collector kết thúc
      │
      ▼
JsonReportWriter tạo report
```

Result channel chỉ được đóng sau khi tất cả worker hoàn thành. Nếu đóng sớm,
worker có thể gặp lỗi khi cố ghi kết quả.

## 13. Flow hoàn chỉnh trong source hiện tại

```text
1. Program tạo FileProcessingPipeline
           │
           ▼
2. Pipeline tạo bounded job channel
   QueueCapacity = 16
           │
           ▼
3. InputFileDiscovery quét file
           │
           ▼
4. Producer ghi FileJob vào job channel
           │
           ├─ Còn chỗ → tiếp tục scan
           │
           └─ Đầy → chờ
           │
           ▼
5. N worker cùng lấy job
           │
           ▼
6. FileProcessor
   ├─ TextFileAnalyzer
   ├─ SHA-256
   └─ GzipFileCompressor
           │
           ▼
7. Worker tạo FileProcessingResult
           │
           ▼
8. Ghi vào unbounded result channel
           │
           ▼
9. Single collector gom kết quả
           │
           ▼
10. Tất cả worker hoàn thành
           │
           ▼
11. Complete result channel
           │
           ▼
12. JsonReportWriter tạo report
```

## 14. Bounded và unbounded channel

| Đặc điểm | Bounded channel | Unbounded channel |
|---|---|---|
| Giới hạn item | Có | Không |
| Backpressure | Có | Không |
| `WriteAsync` có thể chờ vì đầy | Có | Thông thường không |
| Nguy cơ tăng RAM | Được kiểm soát | Có nếu consumer chậm |
| Phù hợp | Job queue, workload lớn | Event/result nhỏ và consumer luôn theo kịp |
| Source hiện tại | `Channel<FileJob>` | `Channel<FileProcessingResult>` |

## 15. Channel mang lại gì cho source?

Channel giúp source hiện tại đạt được các mục tiêu:

- Producer và worker chạy độc lập với tốc độ khác nhau.
- Không cần tự quản lý `Thread`.
- Không cần dùng `lock` cho queue.
- Không cần polling để tìm job mới.
- Mỗi file chỉ được một worker xử lý.
- Tự động cân bằng tải giữa các worker.
- Bounded job queue bảo vệ bộ nhớ.
- Result channel gom dữ liệu an toàn từ nhiều worker.
- Completion báo chính xác khi không còn dữ liệu.
- Async read/write kết hợp trực tiếp với `CancellationToken`.

Tóm lại, bounded job channel bảo vệ tài nguyên và điều tiết tốc độ đầu vào; result
channel gom kết quả an toàn từ nhiều worker. Hai channel tạo thành mô hình
fan-out/fan-in mà không cần tự quản lý thread, `lock` hoặc polling.
