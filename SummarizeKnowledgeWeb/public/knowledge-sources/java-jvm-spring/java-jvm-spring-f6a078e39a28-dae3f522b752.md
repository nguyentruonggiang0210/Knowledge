# Bài 07 — JVM memory, GC, JIT và performance

## Đích học

Có mental model đủ chính xác để điều tra memory/latency, tránh “tối ưu theo truyền thuyết”.

## Mental model

- **Heap:** object/array, do GC quản lý; có thể chia generation tùy collector.
- **Thread stack:** frame, local/operand stack; reference local ở stack nhưng object thường ở heap (JIT có thể scalar replace).
- **Metaspace:** metadata class, dùng native memory.
- **Off-heap/native:** direct buffer, thread stack, JIT code cache, native library; heap ổn vẫn có thể hết process memory.

CLR có khái niệm tương tự managed heap/generations/LOH, JIT và native memory, nhưng collector/tuning/diagnostic flags không map 1:1.

### GC và JIT

Chọn collector theo SLO và workload, không theo “collector X luôn nhanh nhất”. Throughput, pause, footprint là trade-off. Allocation ngắn hạn thường rẻ; giữ object sống lâu và retention graph mới hay gây pressure. JIT cần warm-up, có inlining, escape analysis và deoptimization.

Senior mental model cần thêm: GC roots/reachability; TLAB/promotion/live set; mark-copy-sweep-compact; safepoint không chỉ do GC; strong/soft/weak/phantom reference; heap/metaspace/code cache/direct/thread stack. Parallel ưu tiên throughput, G1 cân bằng region/pause, ZGC/Shenandoah nhắm pause thấp với CPU/memory trade-off. Container OOMKilled có thể đến từ RSS/limit mà không có Java heap OOM.

JIT tiered C1/C2 dùng runtime profile, OSR, speculative inlining và deoptimization; benchmark phải có fork/warm-up/measurement và chống dead-code elimination. [Bài 14](14-jpms-classloading-compatibility.md) đi sâu bytecode/class loading/GC-JIT; [bài 22](22-observability-sre-performance.md) có quy trình SRE/performance.

### Quy trình điều tra

1. Xác định SLI: p95/p99 latency, throughput, allocation rate, RSS.
2. Reproduce workload đại diện; lấy JFR/GC log/metrics.
3. Phân biệt leak (live set tăng) với high churn (allocation rate cao).
4. Dùng heap dump/dominator tree khi nghi retention; async-profiler/JFR cho CPU/allocation/lock.
5. Benchmark micro bằng JMH; đổi một biến; đo lại end-to-end.

Đừng gọi `System.gc()` để “sửa leak”. Đừng dùng object pool cho object rẻ; pool có thể tăng retention/contention. Cache phải có bound, eviction và metric.

## Trong dự án

- OOM với heap còn trống: kiểm tra direct memory, native thread, metaspace/container limit.
- Latency spike: correlate GC pause, safepoint, lock, I/O và CPU throttling.
- String/boxing churn: chỉ tối ưu khi allocation profile chỉ ra hotspot.

## Thực hành

[Java memory sample](../SourceSamples/07-jvm-memory/src/main/java/course/jvm/JvmMemoryDemo.java) · [C# mapping](../SourceSamples/07-jvm-memory/csharp/Program.cs)

Chạy với `java -Xlog:gc` sau khi package; thay bounded cache bằng map không bound và giải thích retention risk (không cần tạo OOM).

## Quiz

1. Object Java luôn nằm vật lý trên heap sau tối ưu JIT?
2. Heap usage cao có tự động là leak?
3. Vì sao benchmark bằng vòng lặp + stopwatch dễ sai?
4. Cache không giới hạn khác leak thế nào về ý định, và giống ở triệu chứng nào?

<details><summary>Đáp án</summary>

1. Language model coi object là heap-managed, nhưng JIT có thể escape-analyze/scalar-replace nên không allocation vật lý.
2. Không; cần xem live set sau GC và xu hướng retention.
3. Warm-up, dead-code elimination, constant folding, tiered JIT, GC và noise.
4. Cache giữ object có chủ đích nhưng thiếu policy; cả hai làm live set tăng và cuối cùng OOM.
</details>
