# Bài 14 — Bytecode, class loading, JPMS, GC/JIT và diagnostics

## Bar senior

Phân biệt lỗi compile/link/init/runtime; giải thích class identity, module boundary và binary compatibility; chọn đúng artifact khi điều tra CPU, memory, lock hoặc class-loader leak. [Sample JPMS/SPI](../SourceSamples/14-modules-classloading/src/main/java/module-info.java).

## 1. Từ source đến execution

Class file chứa magic/version, constant pool, field/method metadata, attributes và bytecode. JVM frame có local variables và operand stack. `javap -c -v` giúp thấy boxing, bridge method, `invokevirtual`, `invokestatic`, `invokedynamic` và constant pool; không cần thuộc opcode nhưng phải đọc được call shape.

Lifecycle:

1. **Loading:** class loader tìm bytes và tạo `Class`.
2. **Linking:** verify bytecode/type safety; prepare static storage/defaults; resolve symbolic reference có thể lazy.
3. **Initialization:** chạy static initializer theo trigger của JLS; một lần, synchronized per class.

Class identity là `(binary name, defining class loader)`. Hai `com.acme.Plugin` do hai loader độc lập định nghĩa không cast được cho nhau. Bootstrap → platform → application loader thường theo parent delegation; plugin/container có thể dùng topology khác. C# gần nhất là `AssemblyLoadContext`, nhưng chi tiết không map 1:1.

### Failure taxonomy

| Failure | Ý nghĩa thường gặp |
|---|---|
| `ClassNotFoundException` | code chủ động load tên class nhưng loader không tìm thấy |
| `NoClassDefFoundError` | JVM resolution cần định nghĩa class nhưng definition không khả dụng; cũng có thể class đã ở erroneous state do init trước đó fail |
| `ExceptionInInitializerError` | static initialization ném exception |
| `NoSuchMethodError`/`AbstractMethodError` | binary runtime khác bản compile, linkage incompatibility |
| `UnsupportedClassVersionError` | class file mới hơn JVM đang chạy |
| `ClassCastException` cùng tên type | thường kiểm tra defining class loader |

## 2. Classpath, JPMS và SPI

Classpath là flat search path, dễ split package/version shadowing. JPMS module khai báo `requires`, `exports`, `opens`, `uses`, `provides`:

- `exports` cho compile/runtime access public API.
- `opens` cho deep reflection; mở package rộng chỉ để framework chạy làm yếu encapsulation.
- `requires transitive` truyền readability cho consumer; dùng thiếu kiểm soát làm API surface/coupling lớn.
- `ServiceLoader` là SPI built-in: consumer phụ thuộc interface, provider được discover qua module metadata/service file.

Automatic/unnamed module giúp migration nhưng không thay một modular design thật. Spring app không bắt buộc JPMS; biết trade-off trước khi thêm complexity.

## 3. Compatibility và library evolution

Phân biệt:

- **Source compatible:** client source compile lại được.
- **Binary compatible:** client bytecode cũ chạy với library mới.
- **Behavior compatible:** kết quả/side effect/SLA vẫn đúng.

Đổi method signature/remove class thường phá binary. Thêm abstract method vào interface là binary-compatible với binary cũ theo JLS, nhưng implementation recompile phải bổ sung method và client mới gọi method trên implementation cũ có thể gặp `AbstractMethodError`. Thêm default method cũng formally binary-compatible nhưng có thể tạo default-method conflict/`IncompatibleClassChangeError`. Thêm overload có thể làm source ambiguous; thay constant `public static final` primitive/String có thể không cập nhật client vì inlining. Public serialized form/database/event schema là compatibility surface ngoài compiler.

## 4. JVM memory/GC/JIT sâu hơn

- GC root gồm live thread stack, static, JNI và internal roots; leak là object vẫn reachable ngoài ý định.
- Strong/soft/weak/phantom reference có contract khác; `WeakHashMap` không phải cache production mặc định. `Cleaner` chỉ fallback, không thay resource scope.
- Allocation thường đi qua TLAB nhanh; collector vẫn trả cost ở allocation rate, live set, promotion và barriers.
- Parallel ưu tiên throughput; G1 cân bằng/region-based; ZGC/Shenandoah nhắm pause thấp với trade-off CPU/memory/version. Chọn từ heap/SLO/workload rồi load-test, không từ folklore.
- Safepoint/STW có thể do nguyên nhân ngoài GC. Heap, metaspace, code cache, direct memory và native thread stack đều góp vào RSS/OOM.
- Tiered JIT dùng profiling, inlining/speculation, OSR/escape analysis và có thể deoptimize; đó là lý do warm-up/microbenchmark ngây thơ sai.

## 5. Chọn đúng công cụ

| Triệu chứng | Bắt đầu bằng | Tiếp theo |
|---|---|---|
| CPU/p99 cao | metrics + JFR CPU/lock/I/O | flame graph, thread dump, query trace |
| heap/live set tăng | GC log + class histogram | heap dump, dominator/retained path |
| RSS tăng nhưng heap ổn | native metrics + NMT đã bật | direct buffer, metaspace, thread count, code cache |
| hang/deadlock | nhiều thread dump cách nhau | JFR locks, owner/wait graph |
| allocation churn | JFR allocation samples | JMH/end-to-end verify change |
| class tăng sau redeploy | class histogram/classloader stats | heap path từ loader, ThreadLocal/static/driver cleanup |

Lệnh lab (PID thay bằng process thật):

```powershell
jcmd <pid> VM.version
jcmd <pid> Thread.print
jcmd <pid> GC.class_histogram
jcmd <pid> JFR.start name=lesson settings=profile duration=60s filename=lesson.jfr
javap -c -v -classpath SourceSamples/14-modules-classloading/target/classes course.modules.ModuleDemo
```

Native Memory Tracking phải bật từ startup và có overhead; heap dump có thể pause/chiếm disk và chứa dữ liệu nhạy cảm. Production runbook phải xét impact/retention/access.

## Lab

1. Build module sample rồi chạy đúng module path: `java --module-path SourceSamples/14-modules-classloading/target/classes --module course.modules/course.modules.ModuleDemo`; thêm provider thứ hai qua `ServiceLoader`. Thử classpath để hiểu vì sao `provides` trong `module-info.java` không được dùng như `META-INF/services`.
2. Dùng `javap` tìm `invokeinterface` và synthetic/bridge method trong một generic subtype.
3. Tạo một static field giữ plugin object rồi mô tả retention path làm loader không unload.
4. Thu JFR ngắn; ghi một hypothesis, evidence, action và verification—không chỉ chụp screenshot.

## Interview drill

- Cùng fully-qualified name có chắc cùng type? Vì sao?
- Phân biệt `ClassNotFoundException`, `NoClassDefFoundError`, `NoSuchMethodError`.
- `exports` khác `opens`; reflection framework cần gì?
- Heap ổn nhưng container OOMKilled: điều tra gì?
- Leak và allocation churn hiện khác nhau thế nào trong GC/JFR?
- G1/ZGC/Parallel: input nào quyết định, metric nào chứng minh?

## Quiz

1. Preparation có chạy static initializer không?
2. Vì sao đổi `public static final int TIMEOUT` ở library chưa chắc đổi client cũ?
3. Thread dump đơn lẻ có đủ kết luận CPU hotspot?
4. Tại sao class-loader leak thường xuất hiện ở redeploy/plugin?

<details><summary>Đáp án/rubric</summary>

1. Không; preparation cấp/default static storage, initialization mới chạy initializer.
2. Compile-time constant có thể được inline vào client bytecode; phải recompile client hoặc tránh public constant thay đổi.
3. Không; đó là snapshot. Lấy nhiều dump/JFR/profile và correlate metric.
4. Loader chỉ unload khi loader và toàn bộ class/object của nó không còn reachable; static, thread, ThreadLocal, driver/listener từ parent thường giữ graph lại.
</details>
