# Lesson 37 — Observability, latency và cost

## Mục tiêu

Sau bài này, bạn có thể:

- mô hình hóa request bằng trace và span cha–con;
- phân biệt log, metric và trace;
- tính TTFT, end-to-end latency, p50/p95/p99 và error rate;
- quy đổi input/output token thành chi phí theo bảng giá được version;
- thiết kế SLI/SLO mà không làm rò dữ liệu nhạy cảm.

## Bản chất và cách hoạt động

Observability cho phép trả lời “hệ thống đang làm gì và vì sao thất bại?” từ dữ liệu bên ngoài:

- **Log:** event rời rạc có timestamp/level/context; phù hợp chi tiết lỗi.
- **Metric:** chuỗi số tổng hợp như request rate, error rate, p95; phù hợp alert/dashboard.
- **Trace:** cây các span xuyên qua model, retrieval, tool và verifier; phù hợp tìm critical path.

Một span nên có trace/span ID, parent ID, operation, start/end, status, model/tool version, token/cost và error taxonomy. Không ghi raw prompt, secret hay PII theo mặc định. Dùng correlation ID, redaction, retention và access control.

Các chỉ số không thay thế nhau:

- **TTFT** đo thời gian đến token/byte hữu ích đầu tiên khi streaming.
- **End-to-end latency** là thời gian người dùng chờ toàn request.
- **p95** cho biết 95% observation không vượt ngưỡng đó; average có thể che long tail.
- Tổng duration của các child span có thể lớn hơn wall time vì chúng lồng nhau hoặc chạy song song.
- Token chỉ là một cost driver; production còn compute, vector DB, network, storage và human review.

Giá model thay đổi theo thời gian. Lưu `provider/model/price_version`, input/cached/output tokens và đơn vị tiền; không hard-code một con số rồi dùng mãi.

## Khi nào dùng / không dùng

**Dùng khi:** có service/agent nhiều bước; cần SLO, capacity planning, cost attribution, debug regression hoặc incident response.

**Không nên làm:** tạo label cardinality vô hạn từ prompt/user ID; ghi payload nhạy cảm; alert trên mọi spike đơn lẻ; chỉ nhìn average; cộng duration span để suy ra wall time; tối ưu cost mà bỏ qua chất lượng/safety.

## Ví dụ thực tế

Một request gồm root span, retrieval và model call. Demo kiểm tra quan hệ cha–con, tính p50/p95 trên năm request, cộng token và quy đổi cost theo bảng giá giả lập. Một request chậm tạo long tail để thấy p95 khác median rõ rệt.

## Lệnh chạy

```powershell
python Lessions/37-observability-latency-cost/src/demo.py
```

Mọi timestamp và giá trong demo là dữ liệu giả lập offline.

## Bài tập

1. Thêm hai child span chạy chồng thời gian và chứng minh không cộng duration để tính wall time.
2. Tạo error taxonomy `model_timeout/tool_denied/invalid_output/verifier_failed`.
3. Thêm sampling: giữ 100% error trace và 10% success trace.
4. Đặt SLO p95 rồi mô phỏng burn-rate alert theo hai cửa sổ.

## Checklist hoàn thành

- [ ] Tôi phân biệt log, metric, trace và span.
- [ ] Tôi phân biệt TTFT với end-to-end latency.
- [ ] Tôi tính percentile trên nhiều request, không trên một request.
- [ ] Cost có model/rate/version và tách input/output token.
- [ ] Telemetry được redact và giới hạn cardinality/retention.

## Bài trước / bài sau

- Bài trước: [Lesson 36 — Evals, benchmarks và experiment design](../36-evals-benchmarks-experiment-design/README.md)
- Bài sau: [Lesson 38 — Safety, security và red teaming](../38-safety-security-red-teaming/README.md)
