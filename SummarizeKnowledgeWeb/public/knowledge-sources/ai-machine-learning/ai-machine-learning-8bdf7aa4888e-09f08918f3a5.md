# 43 — Model serving và inference optimization

## Mục tiêu

Thiết kế service ổn định theo latency, throughput, memory và cost; hiểu queue, batching, streaming, cache, backpressure, rate limit, warmup và graceful shutdown.

## Bản chất

Model nhanh trong notebook chưa đồng nghĩa service tốt. Request đi qua admission control → queue → scheduler/batcher → model worker → postprocess/stream. Batching tăng throughput nhưng chờ batch làm tăng latency; cache giảm compute nhưng cần key/version/TTL đúng; streaming cải thiện time-to-first-token (TTFT), không nhất thiết giảm tổng thời gian.

Khi arrival rate vượt service rate, queue tăng vô hạn sẽ biến overload thành timeout hàng loạt. Backpressure phải giới hạn queue/concurrency và trả lỗi có thể retry. Đo ít nhất p50/p95/p99, TTFT, tokens/s, queue time, saturation, error/retry và cost per successful task.

## Khi nào dùng

- Dynamic batching cho nhiều request tương tự và GPU chưa bão hòa.
- Prefix/prompt/result cache cho input lặp lại, kèm tenant và model version trong key.
- Async queue cho workload có thể chờ; sync path cho latency-sensitive.
- Không cache dữ liệu nhạy cảm thiếu policy; không retry vô hạn request không idempotent.

Ví dụ: chatbot có SLO p95 2 giây. Scheduler chỉ chờ tối đa 20 ms để gom batch, từ chối sớm khi queue đầy và route request dài sang worker riêng.

## Demo

```powershell
python Lessions/43-serving-inference-optimization/src/demo.py
```

Demo mô phỏng dynamic batch, TTL/LRU cache và admission control, hoàn toàn offline.

## Bài tập và checklist

1. Đổi `max_batch_size` và `max_wait_ms`; so sánh số batch với latency giả lập.
2. Thêm tenant/model version vào cache key và test không rò chéo tenant.
3. Thiết kế graceful shutdown: ngừng nhận, drain queue, checkpoint, đóng worker.

- [ ] Có SLO và load profile thay vì chỉ benchmark một request.
- [ ] Queue/concurrency/memory đều có giới hạn.
- [ ] Cache key, TTL, invalidation và privacy rõ ràng.
- [ ] Có overload test, timeout budget và retry policy có jitter.

Bài trước: 42. Bài sau: 44.

