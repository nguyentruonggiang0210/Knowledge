# D13 - SRE, SLI/SLO, reliability và performance

## Mục tiêu

- Chuyển nhu cầu user thành SLI/SLO và error-budget policy.
- Thiết kế alert theo burn rate, on-call bền vững và giảm toil.
- Capacity/load-test hệ thống theo tail latency và overload behavior.
- Chạy chaos/game day có hypothesis, safety guardrail và learning.

## SLI, SLO và SLA

- SLI: phép đo một behavior người dùng quan tâm.
- SLO: target/range cho SLI trong cửa sổ rõ.
- SLA: cam kết với hệ quả business/contract khi vi phạm.

Ví dụ availability:

~~~text
good events = HTTP requests trả outcome thành công trong dưới 300 ms
valid events = tất cả HTTP requests hợp lệ, loại health/admin theo contract
SLI = good events / valid events
SLO = 99.9% trong rolling 30 ngày
~~~

Một SLO 99.9% cho 30 ngày cho phép 0.1%, tương đương khoảng 43.2 phút nếu đo đơn thuần theo
thời gian. Event-based SLI phải tính bằng event, không đổi máy móc sang phút.

Chọn từ user journey rồi map sang telemetry. Đừng chọn CPU vì dễ đo nếu user quan tâm order
được xác nhận.

## Error budget và burn rate

Error budget = 1 - SLO. Với 99.9%, budget là 0.1% bad events. Burn rate 1 tiêu budget đúng
tốc độ cho phép; 10 nghĩa nhanh gấp mười. Multi-window alert tìm cả sự cố cháy nhanh và chậm:

- window ngắn xác nhận còn đang xảy ra;
- window dài giảm nhiễu và đo impact;
- threshold/severity dựa trên phần budget sẽ mất và thời gian phản ứng.

Error-budget policy phải ghi ai làm gì: tiếp tục release, tăng review, dừng risky change,
ưu tiên reliability hay exception business. Nó là công cụ ra quyết định chung, không là cơ
chế phạt team.

Xem [SLO sample](lab/slo-order-api.yaml) và [Prometheus rules](lab/prometheus-rules.yml).
PromQL là mẫu học; chỉnh metric/label/window theo hệ thống và test trên dữ liệu thật.

## Reliability design

Failure là bình thường; tránh một lỗi thành cascade:

- deadline/timeout ở mọi remote call;
- bounded retry chỉ cho transient + retry-safe, exponential backoff + jitter;
- circuit breaker ngắt dependency lỗi;
- bulkhead tách resource pool/blast radius;
- rate limit/quota/admission control;
- queue bounded, backpressure và load shedding;
- cache/fallback/stale result có data semantics rõ;
- redundancy qua failure domain và graceful degradation.

Retry nhân ở nhiều layer làm số call bùng nổ. Chọn một layer chịu retry và dùng retry budget.

## Capacity và performance

Workload model cần arrival rate, concurrency, request mix, payload, dependency, dataset,
cache state và growth. Little's Law ở steady state: concurrency L = throughput λ × time W.
Nếu arrival vượt service rate, queue tăng đến timeout/OOM.

Test types:

| Test | Mục đích |
|---|---|
| Baseline | Đường chuẩn ít load |
| Load | Expected/peak workload và SLO |
| Stress | Điểm bão hòa và behavior khi quá tải |
| Spike | Tăng/giảm đột ngột |
| Soak | Leak/fragmentation/queue trong thời gian dài |
| Scalability | Throughput/latency khi tăng resource/replica |
| Failover | Capacity còn lại khi mất failure domain |

Đo p50/p95/p99, error, saturation, queue, throttling, GC, DB pool và cost. Tránh coordinated
omission: load generator chờ response rồi mới gửi có thể bỏ sót latency lúc hệ thống kẹt.

## Availability math và dependency

Các dependency nối tiếp có thể làm availability end-to-end thấp hơn từng service. Redundancy
song song chỉ giúp nếu failure độc lập và failover thật sự hoạt động. Đừng nhân/chia SLA máy
móc khi request path, fallback và correlated failure khác nhau; mô phỏng dependency graph.

## Toil và on-call

Toil là việc thủ công, lặp, có thể tự động, phản ứng và tăng tuyến tính. Đo thời gian/volume
và loại root cause; tự động hóa task hiếm nguy hiểm có thể tốn hơn runbook tốt.

On-call cần:

- service ownership và production-readiness gate;
- page action-oriented, shift/handoff/escalation;
- quyền/telemetry/runbook/sandbox phù hợp;
- workload bền vững, psychological safety và compensatory policy;
- review page/incident và thời gian engineering sửa nguồn toil.

## Chaos engineering và game day

1. Steady-state hypothesis dựa trên SLI.
2. Failure cụ thể và blast radius nhỏ.
3. Preconditions, owner, communication, abort threshold.
4. Inject trong sandbox/canary trước.
5. Quan sát detection, mitigation, recovery và data integrity.
6. Cleanup/verify; tạo action có owner/deadline.

Chaos không phải phá ngẫu nhiên production. Không chạy khi hệ thống đang mất ổn định/error
budget cạn hoặc chưa có quyền/rollback.

## Lab: overload và error-budget decision

1. Định nghĩa availability/latency SLO cho Order API.
2. Tạo dashboard và multi-window burn alert.
3. Load test đến điểm saturation; vẽ throughput-latency-error curve.
4. Inject payment latency; retry không jitter để thấy amplification.
5. Sửa deadline/retry budget/bulkhead/load shedding.
6. Mất một replica/failure domain; verify capacity N-1.
7. Tính budget trước/sau, quyết định có promote release và viết lý do.
8. Viết game-day report bằng template, không chỉ ảnh dashboard.

## Hoàn thành D13 khi

- SLI đo user outcome, SLO có scope/window/exclusion/data quality.
- Burn alert page đúng urgency và không page trên transient.
- Load model tái lập; tìm được saturation và N-1 capacity.
- Failure không tạo unbounded queue/retry cascade.
- Game day có hypothesis/abort/recovery/action evidence.
- On-call/toil được xem là system design, không hero culture.

Nguồn: [Google SRE book - SLOs](https://sre.google/sre-book/service-level-objectives/),
[Google SRE Workbook](https://sre.google/workbook/table-of-contents/) và
[OpenSLO specification](https://openslo.com/).

Tiếp theo: [D14 - Data, database và messaging](../14-data-databases-messaging/README.md).
