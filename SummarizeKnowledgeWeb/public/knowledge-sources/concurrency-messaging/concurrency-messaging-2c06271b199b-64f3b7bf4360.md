# MediaProcessingSample — xử lý ảnh, video và audio đa luồng

## 1. Mục tiêu

`MediaProcessingSample` là Console App .NET 9 minh họa một media-processing
pipeline gần với ứng dụng thực tế. Chương trình xử lý ba nhóm dữ liệu:

- **Ảnh:** auto-orient, resize giữ tỷ lệ và chuyển sang JPEG tối ưu.
- **Video:** transcode sang H.264/AAC 720p, thêm fast-start và tạo thumbnail.
- **Audio:** transcode sang MP3 192 kbps và tạo ảnh waveform.

Nhiều file được xử lý đồng thời nhưng mỗi loại media có giới hạn concurrency riêng
để tránh sử dụng CPU, RAM và disk I/O không kiểm soát.

## 2. Công nghệ sử dụng

- .NET 9 và C#.
- `SixLabors.ImageSharp` 3.1.12 để xử lý ảnh trực tiếp trong .NET.
- FFmpeg để decode, encode, filter video và audio.
- `Xabe.FFmpeg.Downloader` 6.0.2 chỉ dùng để tải FFmpeg khi máy chưa có sẵn.
- `Parallel.ForEachAsync` để xử lý nhiều file có giới hạn.
- `ConcurrentBag<T>` để gom kết quả thread-safe.
- `ProcessStartInfo.ArgumentList` để gọi FFmpeg mà không ghép shell command.
- `CancellationToken` để dừng pipeline và child process an toàn.

## 3. Cấu trúc project

```text
MediaProcessingSample/
├── Assets/
│   └── Input/
│       ├── Images/                 # PNG, JPG, JPEG, WebP, BMP
│       ├── Videos/                 # MP4, MOV, MKV, AVI, WebM
│       └── Audio/                  # WAV, MP3, AAC, M4A, FLAC, OGG
├── Output/
│   ├── Images/                     # JPEG đã resize/tối ưu
│   ├── Videos/                     # MP4 720p và thumbnail
│   ├── Audio/                      # MP3 và waveform PNG
│   └── media-processing-report.json
├── Tools/
│   └── FFmpeg/                     # Binary tự tải, không commit Git
├── Program.cs
├── Models.cs
├── FfmpegLocator.cs
├── FfmpegProcessRunner.cs
├── OutputPathBuilder.cs
├── SampleMediaGenerator.cs
├── ImageMediaProcessor.cs
├── VideoMediaProcessor.cs
├── AudioMediaProcessor.cs
└── MediaProcessingPipeline.cs
```

## 4. Cách chạy

### Yêu cầu

- .NET SDK 9.0 trở lên.
- Internet ở lần chạy đầu nếu máy chưa có FFmpeg.

Kiểm tra .NET:

```powershell
dotnet --version
```

Restore và build:

```powershell
dotnet restore .\MediaProcessingSample\MediaProcessingSample.csproj
dotnet build .\MediaProcessingSample\MediaProcessingSample.csproj
```

Chạy với input/output mặc định:

```powershell
dotnet run --project .\MediaProcessingSample\MediaProcessingSample.csproj
```

Lần chạy đầu, chương trình:

1. Tìm FFmpeg từ biến `FFMPEG_PATH`.
2. Nếu không có, tìm `ffmpeg` trong hệ thống `PATH`.
3. Nếu không có, tìm bản đã tải trong `Tools/FFmpeg`.
4. Nếu vẫn không có, tải FFmpeg vào folder local của project.
5. Tự sinh input mẫu nếu từng nhóm chưa có dữ liệu.
6. Chạy pipeline và ghi output/report.

Những lần sau sử dụng lại binary local nên không cần tải lại.

### Dùng FFmpeg đã cài sẵn

Có thể thêm FFmpeg vào `PATH`, hoặc chỉ rõ executable/folder:

```powershell
$env:FFMPEG_PATH = 'C:\Tools\ffmpeg\bin\ffmpeg.exe'
dotnet run --project .\MediaProcessingSample\MediaProcessingSample.csproj
```

### Chạy với thư mục tùy chọn

Argument thứ nhất là input root, argument thứ hai là output root:

```powershell
dotnet run --project .\MediaProcessingSample\MediaProcessingSample.csproj -- "C:\Media\Input" "C:\Media\Output"
```

Các file có thể nằm ở bất kỳ folder con nào dưới input root. Chương trình phân loại
theo extension, không bắt buộc tên folder phải là `Images`, `Videos`, `Audio`.

Nhấn `Ctrl+C` để hủy pipeline.

## 5. Flow tổng thể

```text
Program
  │
  ├─ FfmpegLocator.EnsureAvailableAsync
  │      └─ env → PATH → local Tools → download
  │
  ├─ SampleMediaGenerator.GenerateAsync
  │      ├─ sinh PNG bằng ImageSharp
  │      ├─ sinh WAV PCM bằng C#
  │      └─ sinh MP4 test bằng FFmpeg
  │
  └─ MediaProcessingPipeline.RunAsync
         │
         ├─ DiscoverJobs + classify extension
         │
         ├─ Image group ─ Parallel.ForEachAsync(max N)
         │      └─ ImageMediaProcessor
         │
         ├─ Video group ─ Parallel.ForEachAsync(max 2)
         │      └─ VideoMediaProcessor → FFmpeg child processes
         │
         ├─ Audio group ─ Parallel.ForEachAsync(max 2)
         │      └─ AudioMediaProcessor → FFmpeg child processes
         │
         ├─ ConcurrentBag<MediaResult>
         │
         └─ media-processing-report.json
```

Ba group được khởi động cùng lúc bằng `Task.WhenAll`. Bên trong mỗi group,
`Parallel.ForEachAsync` giới hạn số file của loại đó được chạy đồng thời.

## 6. Flow qua từng file source

### `Program.cs`

Đây là entry point và composition root:

1. Xác định đường dẫn project khi chạy từ workspace root hoặc project folder.
2. Lấy input/output từ command line hoặc dùng mặc định.
3. Đăng ký `Ctrl+C` vào `CancellationTokenSource`.
4. Tìm hoặc tải FFmpeg.
5. Tạo `MediaProcessingOptions`.
6. Sinh input mẫu nếu cần.
7. Khởi tạo ba processor và pipeline.
8. Chạy pipeline rồi in thống kê.

### `Models.cs`

Chứa các immutable record:

- `MediaJob`: file input, relative path và loại media.
- `MediaResult`: trạng thái, output, thời gian và lỗi của một file.
- `MediaProcessingOptions`: giới hạn concurrency và chất lượng output.
- `MediaProcessingReport`: report tổng hợp.
- `MediaKind`: `Image`, `Video`, `Audio`.

Record giúp giảm shared mutable state khi nhiều task truyền dữ liệu cho nhau.

### `FfmpegLocator.cs`

Resolver tìm FFmpeg theo thứ tự ưu tiên:

```text
FFMPEG_PATH → system PATH → Tools/FFmpeg → download
```

Binary tải về được đặt trong project nhưng bị `.gitignore`. Production thường
đóng gói một phiên bản FFmpeg cố định trong container/image thay vì tải bản mới
nhất khi application start.

### `FfmpegProcessRunner.cs`

Runner tạo một child process cho mỗi FFmpeg operation. Các argument được thêm bằng:

```csharp
startInfo.ArgumentList.Add(argument);
```

Không ghép một command string rồi đưa qua shell. Cách này xử lý đúng path có khoảng
trắng và giảm nguy cơ command injection.

`stdout` và `stderr` được đọc đồng thời để tránh child process bị deadlock khi OS
pipe đầy. `stderr` chỉ giữ tối đa 16.000 ký tự nhằm tránh log lỗi chiếm RAM không
giới hạn.

Khi token bị cancel:

```csharp
process.Kill(entireProcessTree: true);
```

FFmpeg cùng các child process liên quan được dừng, sau đó runner chờ process kết
thúc để không để orphan process.

### `SampleMediaGenerator.cs`

Generator giúp project chạy ngay mà không cần người dùng chuẩn bị media:

- Tạo ba ảnh gradient 1920×1080 bằng `Image<Rgba32>`.
- Tạo WAV PCM mono 44.1 kHz, 16-bit chứa sine wave 440 Hz.
- Ghi WAV header RIFF bằng `BinaryPrimitives`.
- Dùng FFmpeg `testsrc2` và sine filter để tạo video MP4 ba giây.

Generator chỉ tạo sample còn thiếu, không ghi đè input của người dùng.

### `OutputPathBuilder.cs`

Builder ánh xạ từng loại vào một category output và giữ lại các folder con. Với
input mặc định đã bắt đầu bằng `Images`, `Videos` hoặc `Audio`, builder bỏ category
đầu vào trước khi ghép để tránh đường dẫn lặp như `Output/Images/Images`.

### `ImageMediaProcessor.cs`

Flow ảnh:

```text
Load async
  → đọc EXIF orientation và AutoOrient
  → ResizeMode.Max trong khung 1280×720
  → encode JPEG quality 82
  → save async
```

`ResizeMode.Max` giữ tỷ lệ ảnh và không crop. ImageSharp thực hiện decode, resize,
color conversion và encode trong process .NET.

### `VideoMediaProcessor.cs`

Mỗi video tạo hai output.

Transcode:

```text
Input
  → scale giữ tỷ lệ
  → pad thành 1280×720
  → H.264/libx264 CRF 23
  → AAC 128 kbps
  → MP4 fast-start
```

`CRF` điều khiển chất lượng: số thấp hơn cho chất lượng và kích thước cao hơn.
`+faststart` chuyển MP4 metadata về đầu file để phát qua HTTP sớm hơn.

Thumbnail được lấy tại giây thứ nhất và resize chiều rộng 480 px.

### `AudioMediaProcessor.cs`

Mỗi audio tạo hai output:

- MP3 stereo/mono theo nguồn, 44.1 kHz, bitrate 192 kbps.
- Waveform PNG 1200×240 bằng filter `showwavespic`.

`-vn` đảm bảo bỏ video stream nếu input là media container có cả audio và video.

### `MediaProcessingPipeline.cs`

Pipeline duyệt file lazy bằng `Directory.EnumerateFiles`, phân loại extension và
tạo `MediaJob`.

Ba lời gọi `ProcessGroupAsync` chạy song song:

```csharp
await Task.WhenAll(imageTask, videoTask, audioTask);
```

Mỗi group dùng:

```csharp
await Parallel.ForEachAsync(
    jobs,
    new ParallelOptions
    {
        MaxDegreeOfParallelism = concurrency,
        CancellationToken = cancellationToken
    },
    async (job, token) => { /* process */ });
```

Lỗi được bắt ở phạm vi từng file. Một file hỏng sinh failed result nhưng không làm
dừng các file còn lại. Cancellation được ném tiếp vì đó là yêu cầu dừng toàn bộ
pipeline.

Kết quả được đưa vào `ConcurrentBag<MediaResult>`, sau đó sort theo kind/path để
report có thứ tự ổn định.

## 7. Các khái niệm và kỹ thuật chính

### `Parallel.ForEachAsync`

API này xử lý collection bằng nhiều task nhưng tôn trọng
`MaxDegreeOfParallelism`. Nó phù hợp khi mỗi item có cùng một loại operation và cần
giới hạn số item đồng thời.

Source không tạo một `Task` cho mọi file rồi `WhenAll`, vì hàng chục nghìn file có
thể tạo quá nhiều task và FFmpeg process cùng lúc.

### Concurrency riêng theo workload

```csharp
ImageConcurrency: 2..6
VideoConcurrency: 2
AudioConcurrency: 2
```

Ảnh thường nhẹ hơn nên được phép chạy nhiều job hơn. Video transcode nặng CPU/RAM
nên giới hạn thấp. Trong production, các giá trị phải được benchmark theo CPU,
GPU, codec, độ phân giải và storage.

### Nested parallelism và CPU oversubscription

Pipeline chạy nhiều file song song, đồng thời mỗi FFmpeg process có thể tự dùng
nhiều encoding thread. Nếu chạy 8 video và mỗi FFmpeg dùng 8 thread, hệ thống có
thể phải schedule 64 encoding thread.

Sample giới hạn cả hai tầng:

```text
VideoConcurrency = 2
FfmpegThreadsPerProcess = 2
```

Đây là kỹ thuật tránh oversubscription, context switching và latency tăng mạnh.

### CPU-bound và I/O-bound

- Decode, resize, SHA/filter và encode thường là CPU-bound.
- Đọc input và ghi output là I/O-bound.
- FFmpeg là external process kết hợp cả CPU và I/O.

`async` giúp phần chờ I/O/process không block thread, nhưng không làm encode
CPU-bound tự nhiên nhanh hơn. Tốc độ CPU-bound đến từ parallelism có giới hạn hoặc
hardware acceleration.

### Thread-safe result collection

`ConcurrentBag<T>` cho phép nhiều task thêm result đồng thời. Dùng `List<T>.Add`
từ nhiều task có thể làm hỏng internal state hoặc mất dữ liệu.

### Per-file fault isolation

Mỗi file có `try/catch` riêng. File codec không hỗ trợ hoặc corrupt được ghi vào
report với `Success = false`; các job khác vẫn tiếp tục.

### Graceful cancellation

Token đi xuyên suốt:

```text
Console Ctrl+C
  → Parallel.ForEachAsync
  → ImageSharp async APIs
  → FfmpegProcessRunner
  → Kill entire child process tree
```

Không kill FFmpeg khi cancel có thể để encoder tiếp tục dùng CPU và ghi output dù
ứng dụng chính đã dừng.

### Safe process invocation

`ProcessStartInfo.ArgumentList` truyền từng argument riêng, không dùng shell và
không tự nối quote. Tuy nhiên input không tin cậy vẫn cần giới hạn path, kích thước,
duration và codec để chống resource exhaustion.

### Streaming media processing

ImageSharp và FFmpeg đọc/ghi qua stream hoặc native pipeline. Application không
đọc toàn bộ video/audio vào một `byte[]`, nên bộ nhớ không tăng theo toàn bộ kích
thước file.

### Deterministic report

Thứ tự hoàn thành thay đổi theo scheduler và kích thước file. Source sort result
trước khi serialize JSON, giúp report ổn định và dễ diff.

## 8. Output mong đợi

Sau khi chạy sample mặc định:

```text
Output/
├── Images/
│   ├── sample-1-optimized.jpg
│   ├── sample-2-optimized.jpg
│   └── sample-3-optimized.jpg
├── Videos/
│   ├── sample-video-720p.mp4
│   └── sample-video-thumbnail.jpg
├── Audio/
│   ├── sample-tone-192k.mp3
│   └── sample-tone-waveform.png
└── media-processing-report.json
```

Console mẫu:

```text
[Audio] Audio\sample-tone.wav => OK
[Image] Images\sample-1.png => OK
[Video] Videos\sample-video.mp4 => OK

Media processing completed
Images    : 3
Videos    : 1
Audio     : 1
Succeeded : 5
Failed    : 0
```

## 9. Cấu hình chất lượng

Trong `Program.cs`:

```csharp
var options = new MediaProcessingOptions(
    ImageConcurrency: Math.Clamp(Environment.ProcessorCount, 2, 6),
    VideoConcurrency: 2,
    AudioConcurrency: 2,
    FfmpegThreadsPerProcess: 2);
```

Trong `MediaProcessingOptions`:

- `ImageMaxWidth`/`ImageMaxHeight`: khung resize ảnh.
- `JpegQuality`: chất lượng JPEG từ 1 đến 100.
- `FfmpegThreadsPerProcess`: thread tối đa được yêu cầu cho mỗi encode.

Trong video processor:

- `crf 18`: chất lượng cao, file lớn hơn.
- `crf 23`: mặc định cân bằng của sample.
- `crf 28`: chất lượng thấp, file nhỏ hơn.
- Preset chậm hơn thường nén hiệu quả hơn nhưng tốn CPU lâu hơn.

## 10. Hướng nâng cấp production

1. Pin và đóng gói FFmpeg version trong Docker image thay vì download lúc startup.
2. Dùng `ffprobe` để validate duration, resolution, streams và codec trước xử lý.
3. Giới hạn dung lượng, số pixel, thời lượng và bitrate của input không tin cậy.
4. Ghi output vào temporary file rồi atomic rename để tránh publish file dở dang.
5. Dùng queue broker để phân phối job giữa nhiều service instance.
6. Lưu trạng thái/idempotency trong database.
7. Retry lỗi tạm thời và đưa file hỏng vào dead-letter/quarantine.
8. Thêm metrics cho queue time, processing time, throughput và failure rate.
9. Dùng GPU/hardware encoding như NVENC, QSV hoặc VideoToolbox khi phù hợp.
10. Tách image, video và audio thành worker pool/deployment riêng để scale độc lập.

## 11. Lưu ý bản quyền và triển khai

FFmpeg hỗ trợ nhiều codec với điều kiện giấy phép khác nhau tùy binary build và
tham số build. ImageSharp cũng có license riêng. Trước khi dùng trong sản phẩm
thương mại, cần kiểm tra license của package, FFmpeg build và các codec được chọn.
