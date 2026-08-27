# SEV1 game day - OrderFlow

## Safety

- Chỉ dùng local/sandbox, không dùng production hoặc dữ liệu thật.
- Có facilitator, abort signal và thời lượng tối đa 90 phút.
- Observer giữ đáp án; participant chỉ nhận inject theo timeline.

## Initial inject

09:00 UTC: 35% request tạo order timeout. Error alert page on-call. CPU app bình thường,
database connection pool gần đầy. Một deployment application hoàn tất 20 phút trước.

Facilitator chỉ cung cấp evidence khi participant hỏi query cụ thể.

## Hidden chain

Không đọc phần này nếu bạn là participant:

1. Phiên bản mới retry payment timeout ba lần không jitter.
2. Payment mock latency tăng từ 100 ms lên 2 s.
3. Request giữ database transaction/connection trong lúc gọi payment.
4. Pool cạn, readiness vẫn xanh vì chỉ kiểm process.
5. Autoscaling app làm tổng connection tăng và incident nặng hơn.

## Additional injects

- 09:10: customer support báo duplicate email cho một số order.
- 09:15: finance hỏi payment có duplicate không.
- 09:20: một engineer đề xuất scale app gấp 5.
- 09:25: status page vẫn chưa update.
- 09:30: database replica lag tăng.

## Success criteria

- Declare/roles/severity và first update trong 10 phút.
- Hypothesis/evidence có thứ tự; không scale/restart mù.
- Mitigation giảm retry/disable feature/traffic hoặc roll-forward/rollback có risk rõ.
- Validate order/payment/email data, không chỉ HTTP 200.
- Emergency change được ghi và reconcile.
- Postmortem nhận ra deadline/retry, transaction boundary, pool budget, readiness và
  progressive delivery gaps.
