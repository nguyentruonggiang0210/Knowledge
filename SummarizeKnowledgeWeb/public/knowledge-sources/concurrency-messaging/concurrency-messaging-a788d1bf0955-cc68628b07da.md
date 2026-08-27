# Bài 19 — Kafka, messaging và event-driven correctness

## Bar senior

Thiết kế partition key/order, producer/consumer failure, retry/DLQ, schema evolution và idempotent side effect. Không nói “Kafka exactly-once” như bảo đảm end-to-end cho database/email. [Sample idempotent consumer](../SourceSamples/19-messaging/src/main/java/course/messaging/MessagingDemo.java).

## 1. Khi nào async messaging phù hợp

Messaging tách producer/consumer theo thời gian, buffer burst, fan-out và replay. Cost: eventual consistency, duplicate/out-of-order, schema/operational complexity và khó trace. Request/response sync tốt khi caller cần result ngay và dependency latency/availability chấp nhận được. Modular monolith/internal event thường đủ trước khi thêm broker.

Event nên là fact đã xảy ra (`OrderPlaced`), command là yêu cầu có thể từ chối (`ReserveStock`). Event contract có owner, semantic, schema, ordering và retention; không publish internal entity dump.

## 2. Kafka mental model

- Topic chia partition; ordering chỉ đảm bảo trong một partition theo record order, không toàn topic.
- Key quyết định partition và do đó ordering/load locality. Hot key tạo skew; đổi partition count có thể thay key mapping.
- Replication/leader/ISR liên quan durability/availability. `acks`, idempotent producer, retries và `min.insync.replicas` phải xem cùng failure model.
- Consumer group phân partition cho members; một partition chỉ được một member trong group xử lý tại thời điểm. Rebalance làm pause/reassignment; handler phải hoàn tất/cancel/commit đúng lifecycle.
- Offset là progress marker, không phải business transaction mặc định.

## 3. Delivery semantics thực tế

| Flow | Failure |
|---|---|
| commit offset trước side effect | crash sau commit → mất xử lý |
| side effect trước commit | crash sau effect → duplicate khi replay |
| Kafka read-process-write trong transaction | Kafka EOS có thể atomic output topic + offsets |
| Kafka → external DB/email | broker transaction không tự atomic external effect |

Vì vậy consumer dùng idempotency/dedup business key + unique constraint/atomic state transition. “Exactly once” luôn phải nêu **scope**. Official Kafka/Spring docs mô tả EOS cho read-process-write transaction; read/process phía consumer vẫn có at-least-once aspects và external system cần design riêng: [Spring Kafka EOS](https://docs.spring.io/spring-kafka/reference/kafka/exactly-once.html).

## 4. Outbox, inbox và CDC

Producer DB transaction ghi aggregate + outbox row. Relay/CDC publish outbox; retry đến khi broker ack; record có event ID/aggregate ID/version. Consumer inbox/dedup ghi processed ID trong cùng transaction với local side effect. Cleanup/retention và poison event cần policy.

Outbox không làm mọi thứ exactly once: relay có thể publish duplicate, consumer cần idempotent. Dual-write DB rồi Kafka hoặc ngược lại luôn có crash window nếu không có transaction mechanism/saga/compensation phù hợp.

## 5. Retry, poison message và DLQ

- Phân loại transient vs permanent. Retry exponential backoff + jitter + limit; blocking retry giữ partition và phá throughput/order.
- Retry topic delay cho phép tiến nhưng có thể thay ordering; chọn theo requirement.
- DLQ/DLT không phải thùng rác: lưu original topic/partition/offset/key/schema/error/trace, alert, access-control PII, replay tool và resolution owner.
- Deserialization/schema error xảy ra trước handler; cần error handler riêng.
- Backpressure: monitor lag theo partition, processing latency, poll interval, rebalance, queue depth và downstream saturation. Scale consumer bị giới hạn bởi số partition/hot key.

## 6. Schema evolution

Avro/Protobuf/JSON đều cần contract governance. Tư duy compatibility:

- additive optional field + sensible default thường an toàn;
- rename/remove/change meaning/type là breaking dù wire parser vẫn đọc;
- producer/consumer deploy lệch version; test backward/forward compatibility;
- event semantic version và migration/replay strategy quan trọng hơn format preference.

Không reuse field cũ với nghĩa mới. Consumer phải tolerate unknown field theo policy nhưng vẫn validate invariant/size.

## 7. Ordering và business workflow

Per-aggregate version giúp phát hiện stale/gap. Global order đắt và thường không cần. Nếu inventory/order/payment là bounded contexts:

- saga orchestration: coordinator ra command/track state, dễ quan sát nhưng coupling trung tâm;
- choreography: service phản ứng event, loose coupling nhưng flow/error khó nhìn;
- compensation là business action, không “rollback thời gian”; phải idempotent và có manual resolution.

## C#/.NET refresh và mapping

- `BackgroundService`, `Channel<T>` hoặc in-process event trong .NET không thay broker durability/replay, giống executor/queue local trong Java.
- MassTransit/NServiceBus/Kafka .NET client và Spring Kafka khác API nhưng cùng bài toán partition/order/offset/rebalance/schema/retry/DLT.
- `TransactionScope` không biến DB + Kafka/HTTP thành atomic distributed transaction mặc định. Outbox/inbox/idempotency/reconciliation là pattern chung cho cả hai stack.
- `CancellationToken` và Java interrupt/deadline đều cần được propagate qua poll/handler/shutdown; acknowledgement/offset vẫn theo contract broker client.

## Lab

1. Sample deliver cùng event hai lần; chứng minh side effect một lần và reject cùng event ID có payload khác. Sample không giả lập Kafka offset: hãy thiết kế broker progress riêng và giải thích vì sao commit offset không thay transaction của inbox/business side effect.
2. Inject crash sau DB commit trước ack; restart và verify duplicate harmless.
3. Chọn partition key cho order events; mô tả hot customer và repartition consequence.
4. Thiết kế DLT replay không gửi lại event đã được sửa/xử lý.

Sample là state model trong một process, **không chứng minh Kafka integration/EOS**. Hai event ID khác nhau cho cùng business payment vẫn cần business idempotency key/invariant; production lưu fingerprint + inbox + side effect atomically, rồi quản lý offset/replay theo partition bằng client/broker thật.

## Interview drill

- Offset commit trước/sau side effect khác failure nào?
- Producer idempotence/Kafka transaction/EOS bảo đảm phạm vi gì, không bảo đảm gì?
- Partition key ảnh hưởng order, scale, hot key và migration ra sao?
- Rebalance/poll timeout có thể duplicate thế nào?
- Outbox + inbox transaction boundary nào? CDC thêm trade-off gì?
- Retry topic và blocking retry đánh đổi ordering/throughput ra sao?

## Quiz

1. Thêm consumer vào group luôn tăng throughput?
2. DLQ có giải quyết poison message tự động?
3. Event có optional field mới luôn behavior-compatible?
4. Commit Kafka transaction có làm email gửi exactly once?

<details><summary>Đáp án/rubric</summary>

1. Không khi consumer > partition, hoặc bottleneck là hot key/downstream.
2. Không; chỉ cô lập. Cần alert, ownership, remediation/replay/audit.
3. Không chắc; consumer/business semantic/default vẫn có thể vỡ.
4. Không; email là external side effect ngoài Kafka transaction. Dùng idempotency provider/business record hoặc reconciliation.
</details>
