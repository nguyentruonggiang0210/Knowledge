# Mock interview Senior Backend — 12 tình huống thực chiến

## Cách thực hiện

- Thời gian: **150 phút**; tổng điểm: **120**.
- Dành khoảng **12 phút/case**, giữ 6 phút cuối để kiểm tra giả định và điểm rollback.
- Có thể trả lời bằng bullet, sequence diagram, bảng quyết định, pseudocode hoặc SQL ngắn. Không cần chọn đúng một vendor.
- Mỗi case phải bắt đầu bằng các câu hỏi làm rõ và giả định định lượng. Nếu thiếu dữ kiện, nêu cách thu thập thay vì tự coi là đúng.
- Không xem `Anwsers/practical_scenarios_answers.md` trước khi kết thúc.

## Deliverable chung cho mọi case

Trừ khi case ghi khác, câu trả lời cần có:

1. Phạm vi, giả định, invariant/SLO hoặc mục tiêu có thể đo.
2. Sơ đồ luồng/component hoặc timeline đủ để thấy boundary và ownership.
3. Kế hoạch theo thứ tự ưu tiên, gồm thay đổi ngắn hạn và thiết kế bền vững.
4. Failure mode, security/data risk, rollback hoặc recovery.
5. Cách kiểm chứng bằng test, telemetry và tiêu chí hoàn tất.

## QP-001 — [Incident][Polyglot runtime][Database][Observability] — 10 điểm

Checkout gồm gateway ASP.NET Core, pricing Java/Spring và PostgreSQL trên Kubernetes. Mười phút sau một release, p99 tăng từ 350 ms lên 8 s; CPU trung bình toàn cụm dưới 45%, error rate chỉ tăng ở một AZ. Trace của nhiều request thiếu span pricing, pool connection ở cả hai service đôi lúc chạm trần, rollback ứng dụng chưa chắc rollback migration vừa chạy.

**Yêu cầu bàn giao:**

- Kế hoạch chỉ huy và khoanh vùng trong 30 phút đầu, gồm dữ liệu cần xem và thứ tự hành động.
- Hai cây giả thuyết: runtime/application và infrastructure/database.
- Quyết định giảm thiểu có điều kiện, cách xác minh recovery và bằng chứng cần giữ.
- Danh sách thay đổi sau sự cố để ngăn lặp lại mà không chỉ “tăng tài nguyên”.

## QP-002 — [Payment][Distributed consistency][Security][Data] — 10 điểm

API tạo đơn hàng gọi payment provider rồi giữ tồn kho. Provider có thể timeout sau khi charge; webhook đến trùng và không bảo đảm thứ tự; mobile client retry khi mất mạng. Hiện tại bảng `orders` chỉ có `paid: boolean`, event được publish trực tiếp sau `COMMIT`, và support đôi lúc hoàn tiền thủ công. Yêu cầu mới: không charge hai lần, có audit giải trình được và tiếp tục phục vụ khi provider chập chờn.

**Yêu cầu bàn giao:**

- State model và sequence cho create/confirm/fail/unknown/refund.
- Transaction, idempotency, message/webhook và reconciliation boundary.
- Data model tối thiểu cùng các invariant phải được database bảo vệ.
- Threat model cho API/webhook/audit và quy trình xử lý case không thể tự động kết luận.

## QP-003 — [Migration][Architecture][Delivery][Organization] — 10 điểm

Một monolith 8 năm gồm C# và stored procedure, deploy mất 90 phút, 35% test flaky, database 6 TB được 7 team ghi chung. Product yêu cầu “chuyển sang microservices trong 6 tháng” đồng thời phải phát hành tính năng hàng tuần, không downtime và không tăng gấp đôi headcount. Ownership domain chưa rõ; một số batch cuối ngày phụ thuộc trực tiếp nhiều bảng.

**Yêu cầu bàn giao:**

- Tiêu chí quyết định phần nào giữ, modularize hoặc tách và cách xác định ownership.
- Roadmap 6 tháng theo lát cắt có outcome đo được, compatibility và đường lui.
- Chiến lược dữ liệu/batch/integration trong giai đoạn cùng tồn tại.
- Thay đổi test, build, observability và cách giao tiếp lại kỳ vọng với product.

## QP-004 — [Scale][Flash sale][Algorithms][Database][Resilience] — 10 điểm

Một đợt mở bán có 30.000 sản phẩm giới hạn, peak dự kiến 120.000 request/s trong 90 giây. Người dùng có thể retry qua nhiều thiết bị; hệ thống hiện đọc rồi ghi `stock_remaining`, cache TTL 5 phút và queue không giới hạn. Business chấp nhận trang xếp hàng nhưng không chấp nhận oversell, cần kết quả công bằng ở mức hợp lý và chi phí ngày thường không tăng quá 20%.

**Yêu cầu bàn giao:**

- Capacity estimate, admission flow và consistency boundary cho tồn kho.
- Data/queue/cache/key design, kể cả duplicate, hot key và kết quả đang chờ.
- Degradation, overload/failure policy và trải nghiệm client.
- Kế hoạch load/resilience test, metric gate và cách chứng minh không oversell.

## QP-005 — [Database][Sharding][Online migration][Multi-tenant] — 10 điểm

SaaS đang có một PostgreSQL primary 12 TB. 2% tenant tạo 70% tải; truy vấn luôn có `tenant_id` trừ một số báo cáo quản trị. Cần di chuyển dần sang nhiều shard, không đổi public ID, RPO tối đa 1 phút và mỗi tenant chỉ được gián đoạn ghi dưới 10 giây. Dữ liệu có foreign key xuyên tenant do lỗi lịch sử.

**Yêu cầu bàn giao:**

- Phân tích workload và lựa chọn routing/placement cho tenant thường và tenant lớn.
- Protocol copy, bắt kịp thay đổi, validate, cutover và rollback cho một tenant.
- Xử lý ID, uniqueness, transaction/report xuyên shard và dữ liệu vi phạm hiện có.
- Operational model: rebalance, backup/restore, observability và tenant isolation.

## QP-006 — [CI/CD][Supply chain][Secrets][Release] — 10 điểm

Một dependency bị cài mã độc qua package registry và xuất hiện trong artifact production. Pipeline dùng runner lâu dài, cache chia sẻ, tag image mutable và credential cloud tồn tại 90 ngày. PR từ fork chạy test bằng cùng pipeline; hiện không thể xác định chính xác commit, dependency và builder tạo ra từng image. Hệ thống vẫn đang phục vụ nhưng chưa biết token nào bị truy cập.

**Yêu cầu bàn giao:**

- Incident containment và phạm vi điều tra theo thứ tự, không phá hủy bằng chứng.
- Thiết kế lại trust boundary từ source, dependency, build, artifact tới deploy.
- Cơ chế quản lý identity/secret, provenance và promotion giữa môi trường.
- Kế hoạch rollout pipeline mới, policy exception và tiêu chí chứng minh artifact đáng tin hơn.

## QP-007 — [Security incident][Identity][Cloud][Forensics] — 10 điểm

SOC phát hiện một access token production trong paste site. Audit cloud cho thấy token đọc object storage từ hai quốc gia trong ba ngày; bucket có file export chứa PII của nhiều tenant. Token cũng có quyền đọc secret của service khác. Log ứng dụng có thể chứa URL ký sẵn nhưng retention chỉ 7 ngày. Chưa có bằng chứng dữ liệu bị sửa.

**Yêu cầu bàn giao:**

- Kế hoạch containment, preservation, scoping và communication trong 24 giờ đầu.
- Cách xác định dữ liệu/tenant bị ảnh hưởng và mức tin cậy của kết luận.
- Thiết kế quyền, credential, export, audit và data protection sau remediation.
- Điều kiện khôi phục dịch vụ, theo dõi attacker persistence và follow-up dài hạn.

## QP-008 — [Data platform][CDC][Privacy][Schema evolution] — 10 điểm

Order database phải cấp dữ liệu gần real-time cho search và warehouse. Job hiện poll `updated_at`, bỏ sót delete và đôi lúc ghi đè bản mới bằng event cũ. Warehouse chứa PII không còn cần thiết; yêu cầu xóa theo người dùng phải phản ánh cả cache, search, analytics và backup theo policy. Các team phát hành schema độc lập.

**Yêu cầu bàn giao:**

- Data flow, ownership và consistency/freshness contract cho từng sink.
- Protocol snapshot, incremental change, ordering, duplicate và replay/rebuild.
- Schema/version compatibility, quality controls và xử lý sink chậm/hỏng.
- Data classification, deletion/retention và bằng chứng tuân thủ end-to-end.

## QP-009 — [Kubernetes][Runtime][Capacity][Cost] — 10 điểm

Hai service xử lý ảnh: một .NET, một Java. Pod thường dùng 500 MiB nhưng tăng tới 2,5 GiB khi file lớn; một số pod `OOMKilled`, số khác CPU throttled. HPA theo CPU tạo từ 10 lên 200 pod, làm database metadata và object storage throttling. 70% chi phí tháng đến từ ba ngày cao điểm; yêu cầu p95 dưới 20 giây và không mất job.

**Yêu cầu bàn giao:**

- Mô hình memory/CPU/concurrency cho từng stage và bằng chứng phân biệt leak với working set hợp lệ.
- Thiết kế admission, scheduling, resource request/limit và autoscaling theo bottleneck thật.
- Job lifecycle, retry/dedup/checkpoint/shutdown và degradation khi downstream giới hạn.
- Kế hoạch giảm chi phí có load/soak test và SLO guardrail.

## QP-010 — [Disaster recovery][Multi-region][Database][Operations] — 10 điểm

Nền tảng B2B chạy một region với database managed có standby cùng region, object storage và ba external provider. Cam kết mới yêu cầu RPO 5 phút, RTO 30 phút nếu mất region. DNS TTL hiện 24 giờ, encryption key chỉ tồn tại ở region chính, backup chưa restore thử 14 tháng và một provider allowlist IP cố định.

**Yêu cầu bàn giao:**

- Gap analysis so với RPO/RTO và dependency/failure-domain map.
- Target recovery architecture cùng runbook failover và failback.
- Backup/key/data consistency validation, traffic routing và external coordination.
- Kịch bản game day, abort criteria, metric và bằng chứng đạt cam kết.

## QP-011 — [API evolution][Polyglot][Zero downtime][Contracts] — 10 điểm

Một public API C# và ba consumer Java cần đổi `customerId` từ số sang chuỗi toàn cục, thay money từ `double` sang `{amount,currency}`, và tách endpoint đồng bộ thành workflow có thể mất vài phút. Có mobile version cũ không thể buộc update; một consumer dùng generated client, một consumer đọc event schema cũ. Không được dừng API hoặc mất khả năng rollback trong 60 ngày.

**Yêu cầu bàn giao:**

- Compatibility contract cho HTTP/event và state/status/error model.
- Pha triển khai producer/consumer/data migration trong 60 ngày với telemetry adoption.
- Test strategy xuyên C#/Java, generated client và unknown/duplicate/out-of-order outcome.
- Deprecation, rollback/roll-forward, security và communication plan.

## QP-012 — [Architecture review][Multi-tenant][Reliability][Governance] — 10 điểm

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
