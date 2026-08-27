# Bài 22 — Observability, SRE, capacity và incident diagnostics

## Bar senior

Định nghĩa SLI/SLO, instrument signal có thể hành động, điều tra p99 bằng evidence và viết runbook/RCA. Không coi “có log/dashboard” là observable. [Sample telemetry model](../SourceSamples/22-observability/src/main/java/course/observability/ObservabilityDemo.java).

OpenTelemetry chuẩn hóa traces, metrics, logs và context/baggage; xem [official signals](https://opentelemetry.io/docs/concepts/signals/). Spring Boot dùng Micrometer/Observation và Actuator để instrument/export, nhưng semantic/cardinality vẫn là trách nhiệm của team.

## 1. SLI, SLO và error budget

- SLI là measurement: successful request ratio, good-event latency, freshness, durability.
- SLO là target trên rolling window: ví dụ 99.9% successful trong 30 ngày; không phải 100% mơ hồ.
- SLA là external agreement/consequence; không đồng nhất SLO nội bộ.
- Error budget `1 - SLO` giúp quyết định release/risk/reliability work. Burn-rate alert phát hiện tiêu budget quá nhanh ở nhiều window.

Định nghĩa “good event” từ user outcome, không chỉ HTTP 200 (response sai/stale cũng bad). Low traffic cần cân nhắc statistical noise; batch/message có SLI riêng như completion/freshness/lag.

## 2. Bốn signal và correlation

| Signal | Trả lời | Bẫy |
|---|---|---|
| logs | event/context cụ thể | PII, volume, text khó query, log trùng |
| metrics | trend/rate/distribution/alert | high-cardinality label, average che tail |
| traces | request đi qua đâu/critical path | sampling, missing context async/message |
| profiles/JFR | CPU/allocation/lock ở code level | overhead/production access/interpretation |

Structured log có timestamp, level, service/version, event name, trace/span, request/business ID, outcome/error code; không dùng customer/email/order ID làm metric label nếu cardinality không bound. Log exception một lần ở accountable boundary với cause/context.

Context propagation phải đi qua HTTP headers, future/executor, virtual thread và message headers. Không serialize arbitrary baggage/PII; trace ID không phải security identity.

## 3. Metrics đúng cách

- Counter cho monotonic events; gauge cho current state; histogram cho distribution/percentiles aggregation.
- RED cho service: Rate, Errors, Duration. USE cho resource: Utilization, Saturation, Errors.
- p99 không lấy trung bình của p99 từng instance. Histogram bucket cần phù hợp SLO; client/server metric có semantics khác.
- Measure queue time, pool wait, remote time, DB query, cache, GC và CPU throttling để tìm bottleneck.
- Cardinality budget trước label; route template thay raw URL, error category thay message.

## 4. Performance/capacity method

1. Requirement: throughput, concurrency, payload, p95/p99, availability, growth.
2. Baseline dưới workload đại diện, warm-up ổn; tách service time và queue time.
3. Quan sát saturation: CPU quota/throttling, heap/GC, thread/executor, connection pool, DB IOPS/locks.
4. Hypothesis → one change → measure → regress/cost review.
5. Load, stress, soak và spike test trả câu hỏi khác nhau. Correctness/invariant luôn được assert.

Little's Law ổn định: `L = λW` giúp sanity-check concurrency. Ví dụ 1.000 req/s × 0,2 s ≈ 200 request in-flight trung bình; tail/burst/headroom cần thêm. Coordinated omission làm load generator bỏ qua latency trong lúc hệ thống chậm; dùng tool/mode đo đúng arrival process.

JMH chỉ microbenchmark code; không chứng minh system throughput. Fork/warm-up/measurement/Blackhole/state scope tránh JIT dead-code/constant folding. Sau JMH vẫn đo end-to-end.

## 5. Incident workflow

1. Stabilize: incident commander, impact/SLO, stop risky deploy, shed/load/failover theo runbook.
2. Preserve evidence: timeline/version/config/metrics/traces/log samples/thread/JFR phù hợp.
3. Narrow by change/time/dependency/saturation, không đoán root cause từ một graph.
4. Mitigate/recover, verify user outcome và backlog/reconciliation.
5. Blameless RCA: trigger, contributing/systemic factors, detection gap, why safeguards failed, actions có owner/date/verification.

### p99 spike decision tree

- Traffic/payload/routing/version/config thay đổi?
- CPU quota/throttling/safepoint/GC/allocation?
- Thread dump: RUNNABLE CPU/native I/O, BLOCKED monitor, WAITING pool/future?
- Executor/HTTP/DB pool queue/wait/rejection?
- DB plan/lock/replica lag/cache miss?
- Downstream trace span/timeout/retry amplification?

Heap dump/JFR có data nhạy cảm và overhead/disk; quyền truy cập/retention phải controlled.

## 6. Availability/DR

Health check không thay end-to-end SLI. Multi-AZ không tự có DR; backup chỉ hữu ích khi restore-tested. Xác định RPO/RTO, failover/failback, dependency/DNS/key/queue/data reconciliation. Game day/chaos experiment có hypothesis, blast radius, abort condition và observability—không “random kill production”.

## C#/.NET refresh và mapping

- `.NET ILogger`, `ActivitySource`, `Meter` gần structured logging, tracing span và metrics API trong Java/Micrometer/OpenTelemetry; semantic convention/cardinality/context propagation là concern chung.
- `dotnet-counters`, `dotnet-trace`/EventPipe, dump và PerfView gần vai trò của JFR/JMC, `jcmd`, heap/thread dump và profiler—artifact/command không map 1:1.
- `Stopwatch` dùng monotonic clock cho duration như `System.nanoTime`; không lấy `DateTime.UtcNow`/`Instant.now` để đo elapsed latency.
- Cả hai stack phải correlate application telemetry với DB, broker, container và deployment version; log nhiều không đồng nghĩa observable.

## Lab

1. Sample tạo low-cardinality metric keys và trace context; thử raw user ID label rồi tính series growth.
2. Đặt SLO cho order API và viết multi-window burn alert bằng lời/pseudocode.
3. Thu JFR của một sample; tìm CPU/allocation/lock event và ghi evidence.
4. Incident drill: DB latency tăng + retry storm; viết timeline, mitigation, RCA actions.

Sample dùng monotonic clock cho duration và whitelist toàn bộ metric dimensions. UUID `TraceContext` chỉ minh họa correlation, **không phải OpenTelemetry implementation**: lab production phải có W3C `traceparent`, span/parent relationship, context propagation, sampling và exporter bằng SDK/agent thật.

## Interview drill

- SLI/SLO/SLA/error budget khác gì? “99.9%” đo event nào/window nào?
- Average latency che gì? Histogram/percentile aggregation thế nào?
- Metric cardinality giết backend ra sao? Trace context qua Kafka?
- Heap ổn nhưng RSS tăng; p99 tăng nhưng CPU thấp—next checks?
- Load/stress/soak/spike/JMH trả câu hỏi khác nhau gì?
- Liveness/readiness sai gây cascade thế nào?

## Quiz

1. Log mọi request body giúp observability tốt hơn?
2. Trace 100% luôn là lựa chọn tốt nhất?
3. Alert CPU 80% có chắc user impact?
4. Restart thành công có nghĩa incident resolved?

<details><summary>Đáp án/rubric</summary>

1. Không; privacy/cost/noise/security, cần schema/sampling/redaction và purpose.
2. Không; cost/volume/privacy. Chọn head/tail/adaptive sampling và giữ error/slow trace theo policy.
3. Không; là cause/saturation signal, correlate symptom SLI. CPU cao còn có thể là healthy utilization.
4. Chưa; verify user SLI, backlog/data consistency, recurrence và root/contributing causes.
</details>
