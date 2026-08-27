# Đáp án và rubric — Mock interview Senior Backend

## Nguyên tắc chấm

- Tổng điểm **120**, mỗi case **10 điểm**.
- Mỗi case có 5 nhóm rubric, mỗi nhóm tối đa **2 điểm**: 0 = bỏ qua/sai; 1 = có ý đúng nhưng thiếu điều kiện; 2 = đầy đủ, có trade-off và verification.
- “Hướng trả lời mạnh” là tín hiệu mong đợi, không phải kiến trúc duy nhất. Cho điểm phương án khác nếu giữ invariant và giải thích được failure mode.
- Trừ tối đa 2 điểm/case nếu chọn sản phẩm trước requirement, không có rollback/recovery, hoặc dùng “exactly once/zero downtime/secure” như tuyên bố không có cơ chế.
- Với mock interview, người chấm nên hỏi “Điều gì làm bạn đổi quyết định?” và “Bạn chứng minh nó đúng thế nào?” trước khi kết luận.

## QP-001 — [Incident][Polyglot runtime][Database][Observability] — 10 điểm

**Đề bài:**

Checkout gồm gateway ASP.NET Core, pricing Java/Spring và PostgreSQL trên Kubernetes. Mười phút sau một release, p99 tăng từ 350 ms lên 8 s; CPU trung bình toàn cụm dưới 45%, error rate chỉ tăng ở một AZ. Trace của nhiều request thiếu span pricing, pool connection ở cả hai service đôi lúc chạm trần, rollback ứng dụng chưa chắc rollback migration vừa chạy.

**Yêu cầu bàn giao:**

- Kế hoạch chỉ huy và khoanh vùng trong 30 phút đầu, gồm dữ liệu cần xem và thứ tự hành động.
- Hai cây giả thuyết: runtime/application và infrastructure/database.
- Quyết định giảm thiểu có điều kiện, cách xác minh recovery và bằng chứng cần giữ.
- Danh sách thay đổi sau sự cố để ngăn lặp lại mà không chỉ “tăng tài nguyên”.

### Rubric

- **Incident command và ưu tiên — 2 điểm:** Xác định impact/SLO, owner/commander, đóng băng release, timeline và communication; ưu tiên giảm blast radius trước root cause.
- **Điều tra dựa trên bằng chứng — 2 điểm:** So sánh trước/sau release, AZ tốt/xấu và request tốt/chậm; nối trace, pool, runtime, DB wait/plan/lock và Kubernetes/network.
- **Mitigation có điều kiện — 2 điểm:** Đưa lựa chọn route khỏi AZ, giảm tải/canary rollback app hoặc roll-forward DB với trigger, verification và abort rõ.
- **Correctness/recovery — 2 điểm:** Nhận ra rollback code/schema compatibility, request in-flight, transaction/pool và cách bảo toàn dữ liệu/bằng chứng.
- **Phòng ngừa — 2 điểm:** Đề xuất progressive delivery, migration contract, telemetry context, pool/backpressure và test failure có owner/metric.

### Hướng trả lời mạnh

Trong 5 phút đầu: declare incident, dừng promotion/migration tiếp theo, ghi release/schema/AZ timeline; xác nhận user impact theo p99/error/business checkout chứ không theo CPU. Tách cohort theo AZ, version, endpoint và dependency. CPU thấp cùng pool đầy thường gợi ý chờ DB/network/lock hơn compute, nhưng chưa kết luận.

Cây application/runtime gồm thread-pool starvation/blocking, connection leak/transaction dài, GC pause, Spring proxy/retry, query/N+1 và trace context mất ở async boundary. Cây hạ tầng/data gồm DB lock/plan/stats/schema rewrite, proxy/DNS/service endpoint riêng AZ, packet loss/MTU, node throttling và replica/zone dependency. Thu actual plan/wait/deadlock, pool acquisition time, thread dump/JFR/.NET trace, GC, pod/node/AZ, ingress và trace exemplars.

Mitigation nhỏ nhất có thể là drain AZ lỗi nếu capacity còn đủ, shed checkout phụ, rollback *artifact* khi schema còn backward-compatible, hoặc roll-forward query/index/config. Xác minh bằng cohort p99, success/business rate, queue/pool/DB saturation trong đủ cửa sổ; giữ log/plan/dump trước restart. Sau sự cố: expand–contract, canary theo AZ, automated regression gate, trace propagation contract, bounded pool/queue và game day.

**Failure modes/red flags:** restart toàn cụm làm mất bằng chứng; tăng pool gây DB collapse; rollback app mù sau destructive migration; thay nhiều biến cùng lúc; coi missing span là chắc chắn pricing không chạy; chỉ nhìn average. **Tham chiếu:** NET-007, NET-052, NET-055, JAVA-044, JAVA-058, JVM-018, DB-028, DB-030, DB-044, DO-030, DO-046, DO-048.

## QP-002 — [Payment][Distributed consistency][Security][Data] — 10 điểm

**Đề bài:**

API tạo đơn hàng gọi payment provider rồi giữ tồn kho. Provider có thể timeout sau khi charge; webhook đến trùng và không bảo đảm thứ tự; mobile client retry khi mất mạng. Hiện tại bảng `orders` chỉ có `paid: boolean`, event được publish trực tiếp sau `COMMIT`, và support đôi lúc hoàn tiền thủ công. Yêu cầu mới: không charge hai lần, có audit giải trình được và tiếp tục phục vụ khi provider chập chờn.

**Yêu cầu bàn giao:**

- State model và sequence cho create/confirm/fail/unknown/refund.
- Transaction, idempotency, message/webhook và reconciliation boundary.
- Data model tối thiểu cùng các invariant phải được database bảo vệ.
- Threat model cho API/webhook/audit và quy trình xử lý case không thể tự động kết luận.

### Rubric

- **State/invariant — 2 điểm:** Có order/payment attempt/ledger state rõ, `unknown` là trạng thái thật; nêu invariant không double charge và transition hợp lệ.
- **Idempotency/transaction — 2 điểm:** Key scope/payload, unique constraint, local transaction và outbox/inbox; phân tích crash window/client retry.
- **Provider/webhook/reconciliation — 2 điểm:** Timeout không suy failure, webhook xác thực/dedup/order-independent, query/reconcile provider và manual queue.
- **Inventory/refund/audit — 2 điểm:** Reserve/expiry/confirm/release và refund đều idempotent; audit append-only giải trình actor/transition/provider reference.
- **Security/operations — 2 điểm:** Chữ ký/replay/secret/PII/least privilege, metric/SLO/alert và runbook outcome không kết luận được.

### Hướng trả lời mạnh

Thay `paid:boolean` bằng state machine Order và PaymentAttempt (`created`, `submitted`, `unknown`, `authorized/captured`, `failed`, `refund_pending/refunded`) với transition compare-and-set/version. Idempotency key unique theo merchant/operation, lưu hash request và response; cùng key được truyền tới provider. Ledger append-only lưu amount/currency/reference, không sửa balance bằng boolean.

Local DB transaction ghi order/payment intent + outbox. Worker gửi provider; timeout chuyển `unknown`, không charge lại bằng key mới. Webhook verify chữ ký trên raw body, timestamp/nonce, allow key rotation; dedup provider event ID nhưng transition phải chịu được duplicate/out-of-order. Poll/reconcile provider và settlement; mismatch vào hàng đợi support có đầy đủ evidence. Inventory reservation có TTL nhưng late payment phải có policy rõ (reacquire/refund/manual), compensation cũng có thể fail và cần durable retry.

Audit lưu actor, intent, before/after, correlation và provider reference, tách PII/token. Metric gồm unknown age, duplicate, reconcile mismatch, reserve expiry, refund backlog và tiền tổng theo ledger/provider. Test fault injection ở mọi điểm trước/sau commit/send/webhook.

**Failure modes/red flags:** timeout = failed; event publish trực tiếp sau commit; idempotency chỉ trong cache/TTL ngắn; webhook chỉ tin source IP; refund được coi là rollback; số tiền `double`; support sửa row trực tiếp. **Tham chiếu:** NET-028, JVM-032, SE-021, SD-023, SD-026, SD-027, SD-055, DB-040, DB-059, SEC-035, SEC-041, SEC-044.

## QP-003 — [Migration][Architecture][Delivery][Organization] — 10 điểm

**Đề bài:**

Một monolith 8 năm gồm C# và stored procedure, deploy mất 90 phút, 35% test flaky, database 6 TB được 7 team ghi chung. Product yêu cầu “chuyển sang microservices trong 6 tháng” đồng thời phải phát hành tính năng hàng tuần, không downtime và không tăng gấp đôi headcount. Ownership domain chưa rõ; một số batch cuối ngày phụ thuộc trực tiếp nhiều bảng.

**Yêu cầu bàn giao:**

- Tiêu chí quyết định phần nào giữ, modularize hoặc tách và cách xác định ownership.
- Roadmap 6 tháng theo lát cắt có outcome đo được, compatibility và đường lui.
- Chiến lược dữ liệu/batch/integration trong giai đoạn cùng tồn tại.
- Thay đổi test, build, observability và cách giao tiếp lại kỳ vọng với product.

### Rubric

- **Reframe và baseline — 2 điểm:** Chuyển mục tiêu từ số microservice sang lead time/reliability/ownership; đo deploy, test, dependency và domain change coupling.
- **Boundary/roadmap — 2 điểm:** Có domain discovery, modularization/seam và lát cắt đầu tiên có giá trị; roadmap theo outcome, không rewrite big bang.
- **Data/coexistence — 2 điểm:** Ownership table/write, compatibility, batch/report và integration event/anti-corruption; migration có validate/rollback.
- **Engineering system — 2 điểm:** Giảm flaky, build/test pipeline, observability, release nhỏ và platform/on-call readiness song hành.
- **Tổ chức/risk — 2 điểm:** Owner và decision forum rõ, giao tiếp lại constraint 6 tháng, milestone/stop condition và giới hạn headcount.

### Hướng trả lời mạnh

Đặt outcome 6 tháng như giảm deploy 90→x phút, flaky <y%, thay đổi độc lập một capability, ownership/schema writes được ghi nhận; không cam kết số service. Dùng event storming/dependency/change history để tìm bounded context. Trước hết tạo module boundary trong monolith, characterization test/seam, build cache/pipeline và telemetry; chọn một capability có owner rõ, ít transaction xuyên miền nhưng đem lợi ích deploy/scale để strangler thử.

Database 6 TB không tách theo class. Lập catalog bảng/writer/invariant, cấm write mới xuyên owner; dùng API/anti-corruption/outbox/CDC projection trong giai đoạn cùng tồn tại. Batch cuối ngày được version hóa input/output và chuyển từng phần, có reconciliation. Schema theo expand–migrate–contract, backfill bounded và cutover có route flag; rollback trước khi source ownership đổi hoặc reverse-sync/roll-forward được thiết kế.

Roadmap gợi ý theo outcome: tháng 1 baseline/ownership/CI; tháng 2–3 module+test+release; tháng 3–5 một extraction end-to-end; tháng 6 đánh giá evidence và scale pattern, không nhân bản sai lầm. Product được thấy capacity dành cho nền tảng và risk register. Team sở hữu build-run-on-call capability, platform chỉ cung cấp paved road.

**Failure modes/red flags:** “mỗi table một service”; shared DB vẫn ghi trực tiếp; dual-write không reconcile; rewrite sáu tháng; bỏ feature delivery; lập team platform làm mọi migration; đặt Kafka là ranh giới domain. **Tham chiếu:** SE-007, SE-018, SE-019, SE-029, SE-032, SE-045, SD-036, SD-042, DO-005, DO-010.

## QP-004 — [Scale][Flash sale][Algorithms][Database][Resilience] — 10 điểm

**Đề bài:**

Một đợt mở bán có 30.000 sản phẩm giới hạn, peak dự kiến 120.000 request/s trong 90 giây. Người dùng có thể retry qua nhiều thiết bị; hệ thống hiện đọc rồi ghi `stock_remaining`, cache TTL 5 phút và queue không giới hạn. Business chấp nhận trang xếp hàng nhưng không chấp nhận oversell, cần kết quả công bằng ở mức hợp lý và chi phí ngày thường không tăng quá 20%.

**Yêu cầu bàn giao:**

- Capacity estimate, admission flow và consistency boundary cho tồn kho.
- Data/queue/cache/key design, kể cả duplicate, hot key và kết quả đang chờ.
- Degradation, overload/failure policy và trải nghiệm client.
- Kế hoạch load/resilience test, metric gate và cách chứng minh không oversell.

### Rubric

- **Estimate/admission — 2 điểm:** Tính khoảng 10,8 triệu request/90 giây so với 30.000 item, tách browse/attempt/winner; admission/fairness/identity có bound.
- **Inventory correctness — 2 điểm:** Atomic invariant hoặc single owner/serialization per stock unit, idempotent reservation và database constraint/audit; cache không là nguồn tồn.
- **Queue/cache/hotspot — 2 điểm:** Bounded queue, dedup/key/partition, hot key mitigation và trạng thái pending/result; không fan-out vô hạn.
- **Overload/failure UX — 2 điểm:** Rate/concurrency limit, shed/degrade, retry contract, timeout và behavior khi dependency/worker fail.
- **Verification/cost — 2 điểm:** Load+fault+soak model đúng burst, invariant check/reconciliation, metric gate và scale-to-normal trong giới hạn chi phí.

### Hướng trả lời mạnh

120.000×90 = 10,8 triệu request cho tối đa 30.000 kết quả; hệ thống phải từ chối/xếp hàng gần như tất cả trước DB. Tách trang đọc cache/CDN khỏi purchase admission. Waiting-room token ký, rate theo user/account/device/risk và quota/fair queue giảm bot/tenant unfairness; admission chỉ cho lượng gần capacity xử lý, client poll/status theo operation ID thay retry tạo operation mới.

Invariant `sold + reserved_available <= stock` được giữ bằng atomic conditional update/unique reservation trong DB, hoặc command per product/partition single-writer với durable log và fencing; không dùng read-then-write. Idempotency unique `(sale,user/product/request)` theo business rule. Reservation TTL/confirm/release là state transition durable; expiry và late payment có policy. Cache chỉ hiển thị approximate availability và version, không quyết định bán.

Queue phải bounded/partitioned, có backpressure, dedup, DLQ/replay owner; hot SKU có thể tách admission token/bucket nhưng serialization correctness vẫn rõ. Degrade analytics/recommendation, trả 202/429 + retry guidance, jitter. Test theo skew/bot/multi-device, kill worker/DB latency/cache expiry, rồi đối soát tổng tồn không âm/không duplicate. Theo dõi accepted/winner, queue age, reservation unknown, DB lock, per-user fairness và cost.

**Failure modes/red flags:** tăng DB pool; queue vô hạn; Redis TTL là inventory source duy nhất; retry mọi tầng; lock phân tán không fencing; random fairness không audit; load test chỉ average. **Tham chiếu:** ALG-048, ALG-052, DB-037, SD-018, SD-019, SD-023, SD-030, SD-031, SEC-035.

## QP-005 — [Database][Sharding][Online migration][Multi-tenant] — 10 điểm

**Đề bài:**

SaaS đang có một PostgreSQL primary 12 TB. 2% tenant tạo 70% tải; truy vấn luôn có `tenant_id` trừ một số báo cáo quản trị. Cần di chuyển dần sang nhiều shard, không đổi public ID, RPO tối đa 1 phút và mỗi tenant chỉ được gián đoạn ghi dưới 10 giây. Dữ liệu có foreign key xuyên tenant do lỗi lịch sử.

**Yêu cầu bàn giao:**

- Phân tích workload và lựa chọn routing/placement cho tenant thường và tenant lớn.
- Protocol copy, bắt kịp thay đổi, validate, cutover và rollback cho một tenant.
- Xử lý ID, uniqueness, transaction/report xuyên shard và dữ liệu vi phạm hiện có.
- Operational model: rebalance, backup/restore, observability và tenant isolation.

### Rubric

- **Workload/placement — 2 điểm:** Có tenant directory/routing và phương án whale tenant; phân tích query, size, write, hotspot và failure isolation.
- **Migration protocol — 2 điểm:** Snapshot+change position/catch-up, idempotent copy/checksum, cutover epoch/fence dưới 10 giây và rollback semantics.
- **Data correctness — 2 điểm:** ID giữ nguyên, business uniqueness/FK/cross-tenant vi phạm được inventory/remediate; transaction/report cross-shard có contract.
- **Operations/DR — 2 điểm:** Rebalance, shard capacity, backup/PITR/restore tenant, RPO, routing config và failure recovery được vận hành hóa.
- **Isolation/security/verification — 2 điểm:** Không route nhầm tenant, least privilege/encryption/audit, canary tenant và metric/reconciliation đầy đủ.

### Hướng trả lời mạnh

Thu heatmap tenant theo storage/QPS/read-write/working set và query. Dùng directory `tenant -> shard, epoch, state`; tenant thường colocate theo weighted placement, whale tenant có thể dành shard hoặc subshard theo entity/time nếu access pattern cho phép. App bắt buộc tenant context trong key/query; admin report đi read model/warehouse hoặc controlled scatter-gather, không làm OLTP fan-out mặc định.

Mỗi tenant: lấy consistent snapshot tại log position, copy idempotent theo PK, stream CDC từ position, apply theo version và checksum/count/business totals. Khi lag đủ nhỏ, chuyển state `cutover`, fence old writer bằng routing epoch, pause/drain ghi <10 giây, apply tail, validate rồi route new. Rollback an toàn trước new writes; sau đó cần reverse CDC hoặc roll-forward—phải ghi rõ. Canary tenant nhỏ rồi whale giả lập.

Global public ID không đổi; global/business uniqueness cần registry/routing theo key hoặc conflict workflow. Trước migration tìm FK cross-tenant, phân loại corruption/shared reference và sửa/model lại; không silently copy. Transaction xuyên shard được loại bằng boundary/saga hoặc dịch vụ coordinator có lý do. Mỗi shard có WAL archive/PITR, restore drill và tenant-level export/replay; monitor skew, directory version, CDC lag, checksum, cross-tenant access.

**Failure modes/red flags:** hash tenant cố định không xử lý whale; dual-write không ordering; cutover DNS/cache routing stale; rollback hai nguồn đều ghi; global sequence assumed local; backup shard không test restore; FK lỗi bị vô hiệu vĩnh viễn. **Tham chiếu:** DB-004, DB-056, DB-057, DB-060, DB-062, SD-014, SD-016, SD-040, SD-042.

## QP-006 — [CI/CD][Supply chain][Secrets][Release] — 10 điểm

**Đề bài:**

Một dependency bị cài mã độc qua package registry và xuất hiện trong artifact production. Pipeline dùng runner lâu dài, cache chia sẻ, tag image mutable và credential cloud tồn tại 90 ngày. PR từ fork chạy test bằng cùng pipeline; hiện không thể xác định chính xác commit, dependency và builder tạo ra từng image. Hệ thống vẫn đang phục vụ nhưng chưa biết token nào bị truy cập.

**Yêu cầu bàn giao:**

- Incident containment và phạm vi điều tra theo thứ tự, không phá hủy bằng chứng.
- Thiết kế lại trust boundary từ source, dependency, build, artifact tới deploy.
- Cơ chế quản lý identity/secret, provenance và promotion giữa môi trường.
- Kế hoạch rollout pipeline mới, policy exception và tiêu chí chứng minh artifact đáng tin hơn.

### Rubric

- **Containment/forensics — 2 điểm:** Chặn package/artifact/digest, freeze promotion, revoke scoped credentials, inventory exposure và preserve runner/cache/log/evidence.
- **Source/dependency trust — 2 điểm:** Pinned/locked dependency, controlled registry, review/update policy, SCA/SBOM và build input reproducibility.
- **Build/artifact trust — 2 điểm:** Isolated ephemeral builder, provenance/attestation, immutable digest, signing/verification và build-once promotion.
- **Identity/secret boundary — 2 điểm:** Fork/untrusted code không nhận secret, short-lived workload identity, least privilege theo stage/environment và audit.
- **Rollout/governance — 2 điểm:** Pipeline song song/canary, policy-as-code/exception expiry, recovery/rollback và tiêu chí evidence có thể truy ngược.

### Hướng trả lời mạnh

Đầu tiên dừng deploy từ lineage bị nghi, block package/version/hash tại registry, xác định image đang chạy và cô lập workload nếu risk cao. Snapshot log/runner/cache/artifact metadata trước cleanup. Thu hồi credential có thể bị builder/package đọc, audit hành vi từ lần dependency đầu tiên xuất hiện; rebuild sạch chưa đủ nếu token đã tạo persistence. Thông báo security/owner và giữ chain of custody.

Target pipeline: source protected review+signed identity; dependency lock/hash và internal proxy/quarantine; hermetic build trên ephemeral runner/network egress giới hạn; cache namespace/verify không chia trust tùy tiện. Tạo SBOM và provenance gắn source commit, builder identity, inputs, artifact digest; ký/attest bằng keyless/short-lived identity. Registry immutable; môi trường promote cùng digest và admission verify policy.

PR fork chỉ chạy unprivileged stage không có production secret/publish permission. Deploy stage nhận short-lived workload identity sau policy/approval, giới hạn resource/environment; config runtime tách artifact. Rollout pipeline mới shadow/prove, migrate service theo risk, block mutable tag dần; exception có owner/expiry/audit. Chứng minh từ pod digest truy được commit/dependency/builder và artifact không được deploy khi verify fail.

**Failure modes/red flags:** chỉ đổi package version; xóa runner làm mất bằng chứng; ký artifact do compromised builder mà tin tuyệt đối; SBOM không gắn digest; secret masking nhưng vẫn cấp cho fork; credential 90 ngày ở env; cache dùng chung privileged/untrusted. **Tham chiếu:** DO-003, DO-005, DO-007, DO-013, DO-014, DO-015, SEC-038, SEC-046.

## QP-007 — [Security incident][Identity][Cloud][Forensics] — 10 điểm

**Đề bài:**

SOC phát hiện một access token production trong paste site. Audit cloud cho thấy token đọc object storage từ hai quốc gia trong ba ngày; bucket có file export chứa PII của nhiều tenant. Token cũng có quyền đọc secret của service khác. Log ứng dụng có thể chứa URL ký sẵn nhưng retention chỉ 7 ngày. Chưa có bằng chứng dữ liệu bị sửa.

**Yêu cầu bàn giao:**

- Kế hoạch containment, preservation, scoping và communication trong 24 giờ đầu.
- Cách xác định dữ liệu/tenant bị ảnh hưởng và mức tin cậy của kết luận.
- Thiết kế quyền, credential, export, audit và data protection sau remediation.
- Điều kiện khôi phục dịch vụ, theo dõi attacker persistence và follow-up dài hạn.

### Rubric

- **Containment — 2 điểm:** Revoke/rotate token và credential có thể truy cập, chặn path exfiltration, bảo toàn service tối thiểu và không phá evidence.
- **Scope/evidence — 2 điểm:** Lập timeline, map permission→object/tenant, kết hợp cloud/storage/app/network audit và diễn đạt confidence/gap do retention.
- **Response/communication — 2 điểm:** Incident roles, legal/privacy/customer/regulator decision theo policy, chain of custody và cập nhật có kiểm chứng.
- **Remediation architecture — 2 điểm:** Least privilege/short-lived identity, export isolation, encryption/key, audit immutable, retention/minimization và tenant boundary.
- **Recovery/persistence — 2 điểm:** Điều kiện đưa lại service, hunt credential/persistence, rotate downstream, monitor và action dài hạn có owner.

### Hướng trả lời mạnh

Kích hoạt security incident, preserve audit/log/image/config rồi revoke token; vì token đọc được secret khác, xác định và rotate toàn credential/token/key có thể dẫn xuất, không chỉ token paste. Chặn principal/network bất thường, tạm dừng hoặc giới hạn export, snapshot policy/bucket version. Dùng break-glass có audit để service critical tiếp tục với quyền nhỏ hơn.

Scope bằng `issued/first seen/last use`, cloud control/data-plane log, object access/version/bytes, IP/ASN/user-agent, signed URL issuance, app trace và tenant manifest export. Map chính xác object→data category→tenant; absence trong retention 7 ngày không chứng minh không truy cập, phải ghi lower/upper bound và confidence. Phối hợp legal/privacy/compliance cho notification và không phỏng đoán trong customer communication.

Sau containment: workload identity ngắn hạn, secret permission riêng từng service, deny privilege chaining, bucket/prefix/tenant boundary và export job least privilege/TTL. Mã hóa/KMS không ngăn principal hợp lệ đọc plaintext nên cần access control, approval, data minimization, watermark/DLP và immutable audit đủ retention. Recovery yêu cầu clean credential lineage, policy review, no unknown sessions, alert canary và theo dõi persistence/anomaly.

**Failure modes/red flags:** xóa paste/log là containment; kết luận “không sửa = không breach”; rotate token nhưng bỏ secret đã đọc; public statement trước scope; log PII thêm để điều tra; chỉ bật encryption at rest; khôi phục broad IAM cũ. **Tham chiếu:** SEC-004, SEC-020, SEC-040, SEC-041, SEC-042, SEC-043, SEC-046, INF-025, INF-026.

## QP-008 — [Data platform][CDC][Privacy][Schema evolution] — 10 điểm

**Đề bài:**

Order database phải cấp dữ liệu gần real-time cho search và warehouse. Job hiện poll `updated_at`, bỏ sót delete và đôi lúc ghi đè bản mới bằng event cũ. Warehouse chứa PII không còn cần thiết; yêu cầu xóa theo người dùng phải phản ánh cả cache, search, analytics và backup theo policy. Các team phát hành schema độc lập.

**Yêu cầu bàn giao:**

- Data flow, ownership và consistency/freshness contract cho từng sink.
- Protocol snapshot, incremental change, ordering, duplicate và replay/rebuild.
- Schema/version compatibility, quality controls và xử lý sink chậm/hỏng.
- Data classification, deletion/retention và bằng chứng tuân thủ end-to-end.

### Rubric

- **Contract/ownership — 2 điểm:** Source of truth, owner, freshness/consistency và purpose của search/warehouse rõ; data classification/grain được xác định.
- **Capture/bootstrap — 2 điểm:** Consistent snapshot + log position, CDC commit order/delete, checkpoint, duplicate/replay và không có gap snapshot-stream.
- **Sink correctness — 2 điểm:** Version/idempotent apply, per-key ordering/tombstone, backpressure/DLQ/rebuild và quality reconciliation.
- **Schema evolution — 2 điểm:** Version/compatibility contract, consumer rollout, quarantine/observability và migration không làm producer/consumer khóa nhau.
- **Privacy lifecycle — 2 điểm:** Deletion/retention xuyên sink/cache/backup có evidence, restore không tái sinh dữ liệu và quyền truy cập/minimization hợp lý.

### Hướng trả lời mạnh

Order DB là source transaction; search có eventual freshness SLO và rebuild được, warehouse có grain/lineage/checkpoint và dữ liệu chỉ theo purpose. Bootstrap bằng consistent snapshot gắn LSN/binlog position rồi stream log từ đúng position; buffer/coordinate để không gap. CDC mang primary key, operation, transaction/version/schema; sink ghi idempotent theo source version, delete thành tombstone và không để event cũ ghi đè mới.

Partition/order theo aggregate key; checkpoint chỉ sau durable sink. Sink chậm tạo lag/backpressure và retention alert, không kéo sập source; DLQ có owner/replay và raw log đủ retention. Rebuild version mới song song, checksum/count/business aggregate rồi alias/cutover. Schema registry/contract đặt compatible add-first, consumer-first khi breaking, unknown field tolerant; poison schema bị quarantine có alert thay vì chặn vô hạn.

Lập data inventory/lineage từ user→order→mọi projection. Deletion command durable, version cao/fencing để thắng event cũ; cache/search/warehouse xác nhận và audit receipt. Immutable backup giữ theo retention hợp pháp, access hạn chế; khi restore phải replay deletion ledger trước phục vụ. PII không cần cho analytics được bỏ/tokenize từ ingestion, không chờ delete.

**Failure modes/red flags:** polling timestamp tiếp tục với “overlap lớn hơn”; snapshot rồi mới ghi watermark; DLQ chôn message; last-write theo sink clock; delete chỉ source; sửa backup trực tiếp không policy; event chứa toàn row PII. **Tham chiếu:** DB-060, DB-061, SD-024, SD-038, SD-039, SD-050, SEC-042, SEC-045.

## QP-009 — [Kubernetes][Runtime][Capacity][Cost] — 10 điểm

**Đề bài:**

Hai service xử lý ảnh: một .NET, một Java. Pod thường dùng 500 MiB nhưng tăng tới 2,5 GiB khi file lớn; một số pod `OOMKilled`, số khác CPU throttled. HPA theo CPU tạo từ 10 lên 200 pod, làm database metadata và object storage throttling. 70% chi phí tháng đến từ ba ngày cao điểm; yêu cầu p95 dưới 20 giây và không mất job.

**Yêu cầu bàn giao:**

- Mô hình memory/CPU/concurrency cho từng stage và bằng chứng phân biệt leak với working set hợp lệ.
- Thiết kế admission, scheduling, resource request/limit và autoscaling theo bottleneck thật.
- Job lifecycle, retry/dedup/checkpoint/shutdown và degradation khi downstream giới hạn.
- Kế hoạch giảm chi phí có load/soak test và SLO guardrail.

### Rubric

- **Resource model/evidence — 2 điểm:** Tách input size/concurrency/stage, managed heap và native/buffer/thread; dùng profile/cgroup để phân biệt leak, retention, fragmentation và valid working set.
- **Admission/scheduling — 2 điểm:** Bounded input/file/concurrency, workload class/queue, request-limit hợp lý và placement; không dựa HPA CPU duy nhất.
- **Job correctness — 2 điểm:** Durable state, idempotency/checkpoint, retry classification, lease/fencing, graceful shutdown và không mất job.
- **Downstream/resilience — 2 điểm:** Quota/rate/concurrency theo DB/object store, backpressure/degradation, timeout và poison/large job isolation.
- **Cost/SLO verification — 2 điểm:** Scale metric theo queue/work, cap theo downstream, load/soak/fault test, p95 guard và cost model ba ngày/normal day.

### Hướng trả lời mạnh

Đo RSS/cgroup working set, .NET GC heap/LOH/POH/allocation và JVM heap/metaspace/direct/thread/native; correlate với file dimensions, stage và concurrency. Heap sau GC tăng theo mọi job là leak/retention signal; spike rồi hạ có thể là working set, nhưng fragmentation/pool vẫn giữ RSS. Profile allocation/dominator/native memory, không chỉ heap dump sau restart.

Đặt max input/dimension/decompression ratio. Tách queue/lane cho small/large job với resource class khác, bounded worker concurrency và streaming/chunk/spill thay buffer toàn file khi thuật toán cho phép. Kubernetes request phản ánh working set để schedule, memory limit có headroom cho native, CPU limit/throttling được benchmark; large worker có node class riêng. HPA/KEDA theo queue age/work units, nhưng max replica và admission gắn quota DB/object store.

Job có ID/idempotent output, lease+heartbeat/fencing, checkpoint stage, retry transient với backoff và DLQ/manual cho poison. Shutdown ngừng nhận, checkpoint/return lease rồi exit trong grace. Cost: pre-scale ngắn cho peak, bin-pack/right-size, spot cho retryable stages, scale-to-zero/min thấp ngoài peak, lifecycle temp data; xác nhận bằng load distribution thật, 3-day soak/fault và p95/queue age/loss/cost per image.

**Failure modes/red flags:** tăng limit tới 3 GiB cho mọi pod; HPA lên 200 bất kể downstream; retry file độc vô hạn; ack trước output durable; object pool giữ 2,5 GiB; spot cho stage không checkpoint; request thấp để “tiết kiệm”. **Tham chiếu:** NET-008, JVM-015, JVM-054, INF-022, INF-023, INF-024, INF-029, DO-021, DO-047.

## QP-010 — [Disaster recovery][Multi-region][Database][Operations] — 10 điểm

**Đề bài:**

Nền tảng B2B chạy một region với database managed có standby cùng region, object storage và ba external provider. Cam kết mới yêu cầu RPO 5 phút, RTO 30 phút nếu mất region. DNS TTL hiện 24 giờ, encryption key chỉ tồn tại ở region chính, backup chưa restore thử 14 tháng và một provider allowlist IP cố định.

**Yêu cầu bàn giao:**

- Gap analysis so với RPO/RTO và dependency/failure-domain map.
- Target recovery architecture cùng runbook failover và failback.
- Backup/key/data consistency validation, traffic routing và external coordination.
- Kịch bản game day, abort criteria, metric và bằng chứng đạt cam kết.

### Rubric

- **Gap/failure map — 2 điểm:** Nêu standby cùng region không đáp ứng region loss, DNS/key/provider/backup là blocker và lượng hóa RPO/RTO theo từng dependency.
- **Target data/service — 2 điểm:** Có cross-region log/replica/backup, recovery compute/network/config và capacity; consistency/fencing được định nghĩa.
- **Runbook — 2 điểm:** Detect/declare, freeze/fence, restore/promote, validate, route, dependency/provider và communication theo thời gian; có failback.
- **Security/data validation — 2 điểm:** Key/secret/quyền ở DR, checksum/log position, immutable backup/restore và split-brain/reconciliation.
- **Game day/evidence — 2 điểm:** Hypothesis, blast radius/abort, đo RPO/RTO và critical journey, action gap có owner; diễn tập lặp.

### Hướng trả lời mạnh

Gap hiện tại: standby cùng region là HA chứ không DR; TTL 24h một mình đã đe dọa RTO, key thiếu khiến backup/object không đọc, provider IP ngăn outbound, backup không restore không phải evidence. Lập dependency map DNS/cert/IAM/KMS/config/registry/DB/object/queue/provider và budget thời gian, data loss cho từng phần.

Target có warm/cold lựa chọn theo cost nhưng phải chứng minh spin-up trong 30 phút. Archive transaction log/CDC và immutable backup cross-account/region để RPO≤5 phút; async replica có lag metric. Replicate/recreate object, artifact, IaC, secret và KMS multi-region/key escrow với least privilege. Giảm DNS TTL trước sự cố hoặc global traffic control; preregister provider failover IP. Capacity DR phục vụ critical journey và degrade feature phụ.

Runbook: declare, fence old writer bằng epoch/credential/network, chốt log position, promote/restore, validate schema/checksum/business totals, start service theo dependency, synthetic test rồi route tăng dần. Failback là migration có resync/reconcile và fencing ngược, không đổi DNS đơn giản. Game day mô phỏng region loss, key/provider/operator absence, có abort/blast radius; đo commit cuối khôi phục, user success và full timeline.

**Failure modes/red flags:** gọi multi-AZ là multi-region; replica thay backup; DNS TTL đổi lúc incident có hiệu lực tức thì; copy key thủ công trong runbook; active-active không conflict/fencing; test chỉ ping; không diễn tập failback. **Tham chiếu:** DB-062, DB-063, SD-043, SD-044, SD-045, INF-045, DO-024.

## QP-011 — [API evolution][Polyglot][Zero downtime][Contracts] — 10 điểm

**Đề bài:**

Một public API C# và ba consumer Java cần đổi `customerId` từ số sang chuỗi toàn cục, thay money từ `double` sang `{amount,currency}`, và tách endpoint đồng bộ thành workflow có thể mất vài phút. Có mobile version cũ không thể buộc update; một consumer dùng generated client, một consumer đọc event schema cũ. Không được dừng API hoặc mất khả năng rollback trong 60 ngày.

**Yêu cầu bàn giao:**

- Compatibility contract cho HTTP/event và state/status/error model.
- Pha triển khai producer/consumer/data migration trong 60 ngày với telemetry adoption.
- Test strategy xuyên C#/Java, generated client và unknown/duplicate/out-of-order outcome.
- Deprecation, rollback/roll-forward, security và communication plan.

### Rubric

- **Contract model — 2 điểm:** ID/money/async semantics portable và precise, version/compatibility rõ, status/error/idempotency không phụ thuộc ngôn ngữ.
- **Rollout/migration — 2 điểm:** Expand producer/consumer/data theo thứ tự, dual-read/write có giới hạn, telemetry adoption và không contract trước 60 ngày.
- **Workflow correctness — 2 điểm:** Operation resource/state, retry/duplicate/out-of-order/unknown và completion notification/polling được xử lý.
- **Cross-language testing — 2 điểm:** Schema/consumer contract, generated client, serialization numeric/unknown field và old mobile được test với artifact thật.
- **Security/operations — 2 điểm:** Auth/resource ownership, signed cursor/callback nếu có, deprecation communication, rollback/roll-forward và audit/SLI.

### Hướng trả lời mạnh

Không đổi type tại cùng field cho client cũ. Thêm field/version endpoint/event: ID canonical string nhưng service tạm nhận/emit legacy number khi biểu diễn được; mapping table giữ public ID. Money dùng decimal string hoặc minor-unit + currency với rounding contract, không JSON floating. Workflow trả `202` + operation ID/URL, state terminal/nonterminal, stable error/retry semantics và idempotency key; GET status resource-based authorization.

Deploy tolerant readers/consumer trước, schema additive; producer dual-publish/version event có event ID/aggregate sequence. C# ghi old+new data hoặc source canonical + adapter; backfill/checksum và monitor tỷ lệ client/consumer dùng field/version mới. Mobile cũ nhận facade sync trong bounded timeout hoặc trạng thái compatible theo contract, không giả completion. Sau ≥60 ngày và adoption/owner sign-off mới contract; rollback artifact vẫn đọc schema mở rộng, destructive migration để sau cùng.

Contract test dùng captured golden payload và generated Java/C# clients, kiểm large ID vượt JS safe integer, decimal/rounding, unknown enum/field, duplicate/out-of-order event, timeout và retry. Consumer-driven contract không thay provider integration/E2E. Version deprecation headers/docs/dashboard/contact; audit mapping/status transition và không leak operation của tenant khác.

**Failure modes/red flags:** đổi JSON number thành string in-place; dùng `double` rồi format; dual-write không reconcile; 202 nhưng không status resource; event cùng topic/schema breaking; buộc mobile update; rollback sau xóa cột. **Tham chiếu:** SE-020, SE-026, SE-032, SE-034, SD-022, SD-024, SD-042, DB-061.

## QP-012 — [Architecture review][Multi-tenant][Reliability][Governance] — 10 điểm

**Đề bài:**

Team đề xuất nền tảng notification đa kênh cho 5.000 tenant: email/SMS/push, lịch gửi, template tùy tenant, preference người dùng và provider failover. Dự kiến 300 triệu notification/ngày, tenant lớn có burst gấp 50 lần. Một notification không được gửi sai tenant; duplicate có chi phí, provider có quota khác nhau và nội dung có thể chứa dữ liệu nhạy cảm.

**Yêu cầu bàn giao:**

- Requirement/estimate, component và data flow với tenant/security boundary.
- Mô hình scheduling, ordering, idempotency, quota/fairness và provider failure.
- Template/preference/audit/data retention cùng consistency contract.
- SLO, capacity, observability, rollout và danh sách quyết định cần ADR.

## Phiếu chấm

| Case | Điểm | Tối đa |
|---|---:|---:|
| QP-001 |  | 10 |
| QP-002 |  | 10 |
| QP-003 |  | 10 |
| QP-004 |  | 10 |
| QP-005 |  | 10 |
| QP-006 |  | 10 |
| QP-007 |  | 10 |
| QP-008 |  | 10 |
| QP-009 |  | 10 |
| QP-010 |  | 10 |
| QP-011 |  | 10 |
| QP-012 |  | 10 |
| **Tổng** |  | **120** |

## Thang đánh giá

- **0–59:** Thiếu cấu trúc xử lý production; thường chọn giải pháp trước khi xác định invariant/failure mode.
- **60–79:** Middle mạnh; giải được happy path nhưng recovery, security hoặc rollout còn mỏng.
- **80–95:** Đạt kỳ vọng Senior; ưu tiên, trade-off và kiểm chứng tương đối đầy đủ.
- **96–108:** Senior vững; nhìn xuyên application, data, operations và tổ chức.
- **109–120:** Rất mạnh; trả lời rõ dưới áp lực thời gian, định lượng tốt và chủ động giới hạn blast radius.

Điều kiện khuyến nghị: không case nào dưới **5/10**; QP-002, QP-006 và QP-007 không dưới **7/10** cho vai trò có quyền production.

### Rubric

- **Estimate/requirements — 2 điểm:** Tính average≈3.472/s từ 300M/ngày rồi model peak/burst/channel, SLO/delivery semantics/cost và critical privacy requirement.
- **Architecture/data — 2 điểm:** Ingest/schedule/render/dispatch/provider/result boundary, durable state/partition và source of truth; tenant context xuyên luồng.
- **Correctness/fairness — 2 điểm:** Idempotency, ordering scope, preference/template version, quota/rate/fair queue, retry/failover và unknown provider outcome.
- **Security/privacy — 2 điểm:** Cross-tenant isolation, template/content control, secret/provider credential, encryption/minimization/retention/audit và unsubscribe compliance.
- **Operations/governance — 2 điểm:** SLO/telemetry/capacity/degrade/rollout, reconciliation/runbook và ADR cho các trade-off lớn.

### Hướng trả lời mạnh

300M/ngày trung bình khoảng 3.472/s, nhưng phải hỏi channel split, peak factor, scheduled-at-minute herd, payload, tenant burst và provider quota. API nhận request với tenant/user/template/version/idempotency, validate preference/consent rồi ghi durable intent. Scheduler partition theo time bucket+tenant/ID, claim bằng lease/fencing; render có sandbox/escaping và template immutable version; channel queue/worker/provider adapter tách quota/failure.

Notification ID và `(tenant,idempotency key,channel)` unique; trạng thái `accepted/scheduled/suppressed/sending/unknown/delivered/failed`. Provider timeout không mặc định retry nếu có thể nhận; dùng provider idempotency/reference, callback verify/dedup và reconciliation. Ordering chỉ bảo đảm theo key cần thiết, không global. Weighted fair queue/token bucket per tenant+provider ngăn whale starvation; global safety quota và backpressure, scheduled burst được smooth theo business tolerance.

Tenant lấy từ trusted context và có trong partition/cache/object/audit key; automated cross-tenant tests. Preference được check ở thời điểm policy yêu cầu (schedule và/hoặc send), unsubscribe ưu tiên hơn stale projection. Nội dung/PII mã hóa, retention/minimize, log chỉ metadata redacted; provider credential riêng/scoped. SLO tách accepted-to-dispatched/delivery observable, queue age, suppression, duplicate, provider error/quota và cost. Rollout một channel/cohort, shadow scheduler, reconcile sample.

ADR cần ghi ordering/delivery guarantee, storage/partition, scheduler ownership, provider strategy, preference consistency, tenant isolation và retention/build-buy. **Failure modes/red flags:** một FIFO global; tenant ID từ payload không verify; retry provider mù; template mutable làm audit không tái hiện; metric label user ID; queue vô hạn; provider failover gửi duplicate; “delivered” khi chỉ accepted. **Tham chiếu:** SD-019, SD-023, SD-024, SD-033, SD-054, ALG-048, DB-052, SEC-041, SEC-042.

## Thang tổng hợp

| Mức | Điểm | Dấu hiệu |
|---|---:|---|
| Cần củng cố | 0–59 | Thiếu invariant, recovery và cách kiểm chứng. |
| Middle mạnh | 60–79 | Có giải pháp chính nhưng cross-domain/failure mode chưa đều. |
| Senior đạt | 80–95 | Biết ưu tiên, đặt boundary và vận hành phương án. |
| Senior vững | 96–108 | Định lượng, rollout và security/reliability gắn chặt. |
| Rất mạnh | 109–120 | Tư duy hệ thống toàn diện và truyền đạt hiệu quả dưới áp lực. |

Khi dùng để mock interview, ngoài điểm hãy ghi ba nhận xét: **giả định tốt nhất**, **failure mode bị bỏ sót**, và **một quyết định cần thêm bằng chứng**. Đây thường hữu ích hơn chỉ nhìn tổng điểm.
