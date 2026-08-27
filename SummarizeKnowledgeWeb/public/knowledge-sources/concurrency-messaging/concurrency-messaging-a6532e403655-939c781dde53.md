# FileProcessingSample — hướng dẫn chạy và flow source code

## 1. Bài toán thực tế

Ứng dụng mô phỏng một file-processing service thường gặp trong hệ thống backend:

- Quét toàn bộ file `.log`, `.txt`, `.csv` trong thư mục input.
- Giữ nguyên cấu trúc thư mục con.
- Phân phối file cho nhiều worker xử lý đồng thời.
- Đếm số dòng, số từ, dòng chứa `ERROR` và dòng chứa `WARN`.
- Tính SHA-256 để kiểm tra tính toàn vẹn hoặc nhận diện nội dung file.
- Nén từng file thành GZip.
- Ghi kết quả tổng hợp vào `processing-report.json`.
- Một file lỗi không làm dừng toàn bộ batch.
- Hỗ trợ dừng an toàn bằng `Ctrl+C`.

Sample chỉ sử dụng thư viện có sẵn trong .NET 9, không cần database hay package
NuGet bên ngoài.

## 2. Cấu trúc thư mục

```text
FileProcessingSample/
├── Assets/
│   └── Input/                    # File cần xử lý
│       ├── Api/
│       │   ├── api-01.log
│       │   └── api-02.log
│       ├── Orders/
│       │   └── orders.csv
│       └── notes.txt
├── Output/
│   ├── Compressed/               # File .gz sau xử lý
│   └── processing-report.json    # Báo cáo tổng hợp
├── Program.cs
├── Models.cs
├── InputFileDiscovery.cs
├── TextFileAnalyzer.cs
├── GzipFileCompressor.cs
├── FileProcessor.cs
├── FileProcessingPipeline.cs
├── ProcessingStatistics.cs
└── JsonReportWriter.cs
```

Nội dung trong `Output` được tạo khi chạy và bị Git bỏ qua. File `.gitkeep` chỉ
dùng để giữ folder trong repository.

## 3. Cách chạy

### Yêu cầu

- .NET SDK 9.0 trở lên.
- Chạy terminal tại thư mục `MultiThreadDotnet`.

Kiểm tra SDK:

```powershell
dotnet --version
```

Build project:

```powershell
dotnet build .\FileProcessingSample\FileProcessingSample.csproj
```

Chạy với input/output mặc định:

```powershell
dotnet run --project .\FileProcessingSample\FileProcessingSample.csproj
```

Đường dẫn mặc định:

```text
Input : FileProcessingSample/Assets/Input
Output: FileProcessingSample/Output
```

Nếu input không chứa file `.log`, `.txt` hoặc `.csv`, chương trình tự tạo bốn
file mẫu.

### Chạy với thư mục riêng

Argument thứ nhất là input, argument thứ hai là output:

```powershell
dotnet run --project .\FileProcessingSample\FileProcessingSample.csproj -- C:\Data\Incoming C:\Data\Processed
```

Đặt path trong dấu nháy nếu có khoảng trắng:

```powershell
dotnet run --project .\FileProcessingSample\FileProcessingSample.csproj -- "C:\My Data\Input" "C:\My Data\Output"
```

Nhấn `Ctrl+C` để yêu cầu pipeline dừng an toàn.

## 4. Flow tổng thể

```text
Assets/Input
     │
     ▼
InputFileDiscovery (producer)
     │ tạo FileJob
     ▼
Bounded Channel<FileJob>
     │
     ├───────────────┬───────────────┐
     ▼               ▼               ▼
  Worker 1        Worker 2        Worker N
     │               │               │
     └──────── FileProcessor ─────────┘
                      │
            ┌─────────┴─────────┐
            ▼                   ▼
    TextFileAnalyzer     GzipFileCompressor
            │                   │
            └─────────┬─────────┘
                      ▼
        Channel<FileProcessingResult>
                      │
                      ▼
             single result collector
                      │
                      ▼
              JsonReportWriter
                      │
                      ▼
       Output/processing-report.json
```

Ứng dụng có hai luồng dữ liệu độc lập:

1. Job channel đưa công việc từ file discovery tới các worker.
2. Result channel đưa kết quả từ nhiều worker về một collector duy nhất.

## 5. Flow qua từng file source

### 5.1 `Program.cs` — entry point và cấu hình

`Program.cs` thực hiện:

1. Xác định project đang được chạy từ solution root hay project directory.
2. Nhận input/output từ command line hoặc dùng đường dẫn mặc định.
3. Tạo folder nếu chưa tồn tại.
4. Tạo input mẫu nếu không tìm thấy định dạng được hỗ trợ.
5. Khởi tạo `FileProcessingOptions`.
6. Ghép các dependency để tạo `FileProcessingPipeline`.
7. Chuyển sự kiện `Ctrl+C` thành cancellation signal.
8. Chạy pipeline và in thống kê cuối cùng.

Cấu hình hiện tại:

```csharp
var options = new FileProcessingOptions(
    WorkerCount: Math.Clamp(Environment.ProcessorCount, 2, 8),
    QueueCapacity: 16,
    StreamBufferSize: 64 * 1024,
    SupportedExtensions: supportedExtensions);
```

- `WorkerCount`: từ 2 đến 8 worker tùy số logical processor.
- `QueueCapacity`: tối đa 16 job chờ trong bộ nhớ.
- `StreamBufferSize`: buffer 64 KB cho file I/O.
- `SupportedExtensions`: chỉ nhận `.txt`, `.log`, `.csv`.

### 5.2 `Models.cs` — contract giữa các stage

Các immutable record trong file này gồm:

- `FileJob`: absolute source path và relative path.
- `FileAnalysis`: số dòng, từ, lỗi, cảnh báo và SHA-256.
- `FileProcessingResult`: kết quả thành công/thất bại của một file.
- `FileProcessingOptions`: cấu hình pipeline.
- `ProcessingReport`: nội dung report cuối cùng.
- `ProcessingSnapshot`: ảnh chụp các counter tại thời điểm kết thúc.

`RelativePath` cho phép output giữ nguyên cây thư mục input mà không phụ thuộc máy
đang chạy.

### 5.3 `InputFileDiscovery.cs` — producer

`DiscoverAsync` dùng `Directory.EnumerateFiles` để duyệt cây input một cách lazy.
Mỗi path có extension hợp lệ được chuyển thành `FileJob`, sau đó ghi vào bounded
channel bằng `WriteAsync`.

Producer không tạo một `List<string>` chứa toàn bộ file. Với hàng triệu file, cách
duyệt lazy giảm lượng bộ nhớ cần thiết.

Trong `finally`, producer luôn gọi `TryComplete`:

- Không có lỗi: báo cho worker rằng đã hết job.
- Có lỗi khi scan: gắn exception vào channel để lỗi được propagate.

### 5.4 `FileProcessingPipeline.cs` — điều phối concurrency

`RunAsync` tạo hai channel:

```text
Channel<FileJob>              bounded, 1 writer, nhiều reader
Channel<FileProcessingResult> unbounded, nhiều writer, 1 reader
```

Sau đó pipeline:

1. Start producer `DiscoverAsync`.
2. Tạo `WorkerCount` task chạy `RunWorkerAsync`.
3. Mỗi worker lấy job kế tiếp từ channel.
4. Kết quả được ghi vào result channel.
5. `CompleteResultsWhenWorkersFinishAsync` đóng result channel sau khi producer và
   toàn bộ worker kết thúc.
6. `CollectResultsAsync` là single reader gom kết quả vào list.
7. Sort kết quả theo relative path và ghi JSON report.

Channel tự phân phối job: một job chỉ tới một worker. Worker hoàn thành nhanh sẽ
lấy job tiếp theo, giúp cân bằng tải động khi kích thước file khác nhau.

### 5.5 `FileProcessor.cs` — xử lý một file

Đây là orchestration ở mức một file:

1. Đọc kích thước file nguồn.
2. Gọi `TextFileAnalyzer.AnalyzeAsync`.
3. Tạo output path từ relative path.
4. Gọi `GzipFileCompressor.CompressAsync`.
5. Trả `FileProcessingResult` kèm elapsed time.

Một worker xử lý tuần tự các bước của cùng một file, nhưng nhiều file khác nhau
được các worker xử lý đồng thời. Cách này kiểm soát tốt số file handle và lượng
I/O đang diễn ra.

### 5.6 `TextFileAnalyzer.cs` — streaming analysis và hashing

Analyzer mở file với:

```csharp
FileOptions.Asynchronous | FileOptions.SequentialScan
```

- `Asynchronous` cho phép I/O bất đồng bộ.
- `SequentialScan` báo cho hệ điều hành biết file được đọc tuần tự.

File được đọc từng dòng bằng `ReadLineAsync`, không dùng `ReadAllText` hoặc
`ReadAllLines`. Vì vậy một worker chỉ giữ một dòng trong bộ nhớ thay vì giữ toàn bộ
file.

Analyzer đếm từ trực tiếp bằng vòng lặp ký tự để tránh tạo nhiều array/string tạm
từ `Split`. Sau khi phân tích text, file được đọc streaming lần hai bởi
`SHA256.HashDataAsync` để tính checksum.

Đọc hai lần là một trade-off nhằm giữ code rõ ràng và không giữ nội dung trong RAM.
Với file cực lớn và I/O là bottleneck, production có thể xây một stream pipeline
tính hash trong lần đọc đầu.

### 5.7 `GzipFileCompressor.cs` — nén và atomic publish

Compressor dùng `GZipStream` và `CopyToAsync`; dữ liệu được copy theo buffer, không
nạp cả file vào bộ nhớ.

Output không được ghi trực tiếp vào file đích. Flow thực tế là:

```text
source → random-name.tmp → đóng/flush thành công → atomic rename sang .gz
```

Nếu process bị cancel hoặc compression lỗi, khối `finally` xóa file tạm. Người
dùng sẽ không thấy một `.gz` mang tên chính thức nhưng chỉ chứa dữ liệu dở dang.
`File.Move(..., overwrite: true)` cho phép chạy lại pipeline theo hướng idempotent
đối với output file.

### 5.8 `ProcessingStatistics.cs` — counter thread-safe

Mọi worker dùng chung một `ProcessingStatistics`. Counter được cập nhật bằng
`Interlocked.Increment`, `Interlocked.Add` và đọc bằng `Interlocked.Read`.

Nếu viết `counter++`, thao tác đọc–tăng–ghi không atomic. Hai worker có thể cùng
đọc một giá trị và làm mất một lần cập nhật. `Interlocked` loại bỏ race condition
mà không cần khóa cả object.

### 5.9 `JsonReportWriter.cs` — kết quả cuối

Sau khi worker hoàn thành, report writer dùng `JsonSerializer.SerializeAsync` để
ghi report. Chỉ một component ghi report nên không có nhiều thread cùng sửa một
file JSON.

Report chứa:

- Thời điểm bắt đầu và kết thúc UTC.
- Tổng file discovered/succeeded/failed.
- Tổng byte trước và sau nén.
- Analysis, checksum, elapsed time và lỗi của từng file.

## 6. Các kỹ thuật multithreading/concurrency được dùng

### Task-based concurrency thay vì tạo `Thread`

Mỗi worker là một `Task`. .NET runtime quản lý thread pool và resume task khi thao
tác I/O hoàn thành. Tự tạo `Thread` cho từng file sẽ tốn tài nguyên và không scale
tốt khi số file lớn.

### Producer–consumer với `Channel<T>`

File discovery và file processing có tốc độ khác nhau. `Channel<T>` tách hai stage
nhưng vẫn cung cấp queue thread-safe, async read/write và completion signal.

### Bounded queue và backpressure

Job channel chỉ giữ tối đa `QueueCapacity` job. Khi queue đầy, producer chờ bằng
`WriteAsync` cho tới khi worker lấy bớt job. Nhờ đó ứng dụng không tạo vô hạn object
trong RAM nếu scan nhanh hơn xử lý.

### Giới hạn concurrency

Ứng dụng chỉ chạy tối đa `WorkerCount` file processor đồng thời. Đây là biện pháp
bảo vệ:

- File handles.
- Disk IOPS.
- CPU dùng cho SHA-256 và GZip.
- Bộ nhớ dùng cho buffers.

Tăng worker không luôn làm nhanh hơn; nhiều worker cùng đọc một ổ HDD có thể chậm
hơn do random seek. SSD/NVMe hoặc nhiều volume thường chịu concurrency tốt hơn.

### Fan-out và fan-in

- Fan-out: một job channel phân phối file ra nhiều worker.
- Fan-in: nhiều worker ghi kết quả về một result channel.
- Single result collector tạo một điểm duy nhất sở hữu list kết quả.

Mô hình này tránh việc nhiều worker cùng thay đổi một `List<T>` không thread-safe.

### Async file I/O

`FileStream`, `StreamReader`, `GZipStream`, hashing và JSON serialization đều sử
dụng async API. Worker không giữ thread ở trạng thái blocking trong thời gian chờ
disk hoàn thành I/O.

### Streaming và bounded memory

Phân tích, hashing và compression đều dựa trên stream. Lượng RAM phụ thuộc số
worker và buffer size, không tăng tuyến tính theo tổng kích thước input.

### Thread-safe shared state

Shared counter dùng `Interlocked`. Kết quả file đi qua channel. Các model là
immutable record. Vì ownership rõ ràng, source không cần `lock` thủ công.

### Per-file fault isolation

Worker bắt exception ở phạm vi từng file và tạo failed result. File lỗi không làm
mất kết quả của file khác. Riêng cancellation được rethrow vì đây là tín hiệu dừng
toàn pipeline, không phải lỗi nghiệp vụ của một file.

### Graceful cancellation

Một `CancellationToken` được truyền từ `Program` qua discovery, channel, analyzer,
compressor và report writer. `Ctrl+C` không kill process ngay mà yêu cầu các async
operation dừng tại cancellation point gần nhất.

### Atomic output

Temporary-file + rename tránh publish file nén chưa hoàn chỉnh. Đây không chỉ là
kỹ thuật file I/O mà còn là cách đảm bảo consumer khác chỉ nhìn thấy output hợp lệ.

### Deterministic reporting

Worker có thể hoàn thành theo thứ tự bất kỳ. Trước khi ghi report, kết quả được sort
theo `RelativePath`, giúp report ổn định và dễ diff giữa các lần chạy.

## 7. Cách đọc kết quả

Ví dụ console:

```text
Worker 3: Api\api-02.log => OK
Worker 4: Orders\orders.csv => OK
Worker 1: notes.txt => OK
Worker 2: Api\api-01.log => OK

File processing completed
Discovered       : 4
Succeeded        : 4
Failed           : 0
```

Worker ID khác nhau và thứ tự không cố định chứng minh các file được xử lý đồng
thời. Mở report:

```powershell
Get-Content .\FileProcessingSample\Output\processing-report.json
```

Kiểm tra danh sách file nén:

```powershell
Get-ChildItem .\FileProcessingSample\Output\Compressed -Recurse
```

File rất nhỏ đôi khi có `CompressedBytes` lớn hơn `SourceBytes` vì header và
metadata của GZip. Nén có lợi rõ hơn với file lớn và có nội dung lặp lại.

## 8. Điều chỉnh và mở rộng

### Thêm định dạng file

Thêm extension trong `Program.cs`:

```csharp
[".txt", ".log", ".csv", ".json"]
```

Nếu mỗi định dạng cần logic riêng, có thể tạo `IFileAnalyzer` và resolver theo
extension thay vì đưa mọi logic vào `TextFileAnalyzer`.

### Điều chỉnh số worker

Với tác vụ chủ yếu đọc/ghi disk, benchmark các mức 2, 4, 8 worker. Với nhiều disk
hoặc network storage, mức tối ưu có thể cao hơn. Không nên dùng một task cho mỗi
file mà không có giới hạn.

### Hướng production

Ứng dụng thật thường cần bổ sung:

1. `FileSystemWatcher` hoặc message queue để nhận file mới liên tục.
2. Kiểm tra file đã copy hoàn tất trước khi đọc.
3. Retry có exponential backoff cho lỗi sharing/network tạm thời.
4. Quarantine folder cho file thất bại.
5. Persist checkpoint để restart không xử lý lại file đã hoàn thành.
6. Structured logging, metrics và tracing.
7. Giới hạn kích thước file và chống path traversal nếu path đến từ bên ngoài.
8. Chính sách lưu trữ/xóa input sau khi output được xác nhận.
9. Distributed lock nếu nhiều instance cùng scan một thư mục.
10. Virus scanning nếu file do người dùng upload.
