# D12 - Observability và OpenTelemetry

## Mục tiêu

- Chọn signal theo câu hỏi vận hành, không “thu mọi thứ”.
- Correlate metrics, logs và traces qua context/resource metadata.
- Thiết kế dashboard/alert theo user outcome và kiểm soát cardinality/cost/privacy.
- Vận hành chính telemetry pipeline, không chỉ workload.

## Monitoring và observability

Monitoring trả lời câu hỏi biết trước bằng check/dashboard/alert. Observability là khả năng
suy luận trạng thái nội tại từ output của hệ thống, đặc biệt khi gặp câu hỏi chưa dự đoán.
Thêm thật nhiều log không tự tạo observability; signal cần context, semantics và query được.

## Các signal

| Signal | Mạnh ở | Cẩn trọng |
|---|---|---|
| Metrics | Aggregate/trend/alert hiệu quả | Label cardinality, mất chi tiết từng event |
| Logs | Event/context chi tiết | Volume, schema, PII/secret, search cost |
| Traces | Causal path/latency qua service | Sampling, context loss, instrumentation |
| Profiles | Code/resource hot path | Overhead và maturity/tool support |
| Events | Thay đổi/deploy/config/incident | Cần correlation và taxonomy |

OpenTelemetry chuẩn hóa API/SDK, semantic conventions, context propagation, OTLP và Collector
cho traces/metrics/logs. Baggage mang context qua service nhưng không nên chứa secret/PII và
có cost/security boundary. Profiles đang tiến hóa; luôn kiểm tra trạng thái signal/SDK hiện
hành trước production.

## OTel flow

~~~mermaid
flowchart LR
  App[Application SDK auto/manual] -->|OTLP| Agent[Collector agent optional]
  Infra[Host K8s cloud signals] --> Agent
  Agent --> Gateway[Collector gateway]
  Gateway --> M[Metrics backend]
  Gateway --> L[Log backend]
  Gateway --> T[Trace backend]
  Gateway --> P[Profile backend]
  Deploy[Deploy/change events] --> Gateway
~~~

- Instrumentation tạo signal.
- Resource attributes mô tả service.name, version, environment, region/instance.
- Context propagation nối span/request qua process boundary.
- Collector receive/process/batch/filter/redact/sample/export.
- Backend lưu/query/visualize/alert.

Collector không phải durable queue mặc định. Thiết kế retry/buffer/backpressure và failure
behavior; telemetry không được làm app sập nhưng mất telemetry cũng cần báo.

## Instrumentation contract

Mỗi service nên có:

- service name/version/environment/owner;
- request/trace ID trong log;
- duration/status/error theo semantic convention;
- deploy/config/version event;
- domain metric như orders_accepted, không chỉ CPU;
- schema/version và data classification;
- sampling/retention/cardinality budget.

Không dùng user_id, request_id, raw URL, timestamp hoặc unbounded error text làm metric label.
Đưa chi tiết đó vào trace/log có kiểm soát.

## RED, USE và user journey

RED cho request-driven service:

- Rate: request/work per time.
- Errors: tỷ lệ outcome không thành công theo user semantics.
- Duration: distribution/tail latency.

USE cho resource:

- Utilization: bận bao nhiêu.
- Saturation: queue/pressure.
- Errors: lỗi resource.

Bắt đầu dashboard bằng user journey/SLO, rồi drill xuống dependency/resource. Dashboard đầy
CPU nhưng không cho biết checkout thành công là dashboard hạ tầng, chưa phải service health.

Kết hợp white-box instrumentation với black-box probe/synthetic transaction từ góc nhìn
người dùng. Với web/mobile, Real User Monitoring cho thấy geography/device/browser thực nhưng
cần consent/privacy/sampling. Synthetic xanh không chứng minh mọi user xanh; RUM lỗi không tự
chỉ ra component—correlate cả hai với backend signals.

## Histogram và percentile

Average che tail. Dùng histogram/distribution phù hợp để hỏi p50/p95/p99 và aggregate đúng.
Client/server latency boundary khác nhau. Percentile không cộng trực tiếp qua service và
việc average percentile thường vô nghĩa; giữ histogram bucket/trace để phân tích.

## Logs tốt

Structured event:

~~~json
{
  "timestamp": "2026-08-28T10:00:00Z",
  "level": "error",
  "service": "order-api",
  "event": "payment_timeout",
  "trace_id": "example-not-production",
  "dependency": "payment",
  "duration_ms": 2100,
  "outcome": "timeout"
}
~~~

Log decision/outcome, không dump toàn request/environment. Normalize time UTC, severity và
field; sampling/rate-limit repetitive log. Error stack cần nơi phù hợp và retention.

## Trace và sampling

Span có parent, operation, time, status, attributes/events. Propagate W3C Trace Context qua
HTTP/message metadata. Async consumer cần link/causal semantics phù hợp. Sampling:

- head sampling quyết định sớm, rẻ nhưng có thể bỏ trace hiếm;
- tail sampling xem toàn trace rồi giữ error/slow/interesting, cần buffer/capacity;
- sampling rate phải được ghi để query không suy luận sai.

Không tin baggage từ external client; validate/strip theo trust boundary.

## Alert engineering

Alert page người khi cần hành động ngay để bảo vệ user/SLO. Mỗi page có:

- symptom/user impact, severity và owner;
- threshold/window/for đủ tránh transient;
- link dashboard, query, recent change và runbook;
- expected first action/escalation;
- test và review sau incident.

Ticket/non-urgent signal không nên page. Alert nguyên nhân thấp như CPU có thể hữu ích khi nó
thực sự action-oriented; ưu tiên SLO burn/user symptom.

## Telemetry pipeline health và cost

Theo dõi ingest/export error, dropped data, queue, retry, collector CPU/memory, sampling rate,
schema change, query/alert evaluation và backend availability. Quản budget theo signal/team:
retention tier, filter debug, metric aggregation, log sampling, trace sampling. Redact trước
khi data rời trust boundary.

## Chạy Collector local

[lab/otel-collector.yaml](lab/otel-collector.yaml) nhận OTLP, thêm memory limiter/batch rồi
in ra debug exporter. Cần binary/image OpenTelemetry Collector Contrib phiên bản tương thích:

~~~bash
otelcol-contrib --config Devops/12-observability-opentelemetry/lab/otel-collector.yaml
~~~

Production thay debug exporter bằng backend, bật authentication/TLS, secret reference,
capacity/buffer và network policy; không expose OTLP receiver công khai.

## Lab: từ symptom tới root cause

1. Instrument Order API → payment mock → worker bằng OTel.
2. Propagate context qua HTTP và message; correlate log với trace ID.
3. Dashboard RED + dependency latency + version event.
4. Inject 1% payment latency và mất trace context ở worker.
5. Alert theo user error/latency; dùng trace/log/profile/resource để tìm root cause.
6. Sửa propagation, so before/after và kiểm telemetry cost/cardinality.
7. Làm Collector exporter lỗi; alert telemetry loss mà app vẫn phục vụ.

## Hoàn thành D12 khi

- Mỗi signal trả lời câu hỏi rõ, có schema/owner/retention.
- Một request nối được metric exemplar hoặc event, trace và structured log.
- Không có unbounded metric label/secret/PII.
- Alert action-oriented, test được và có runbook.
- Telemetry pipeline có SLO/health/capacity riêng.

Nguồn: [OpenTelemetry concepts](https://opentelemetry.io/docs/concepts/),
[OpenTelemetry signals](https://opentelemetry.io/docs/concepts/signals/) và
[W3C Trace Context](https://www.w3.org/TR/trace-context/).

Tiếp theo: [D13 - SRE, reliability và performance](../13-sre-reliability-performance/README.md).
