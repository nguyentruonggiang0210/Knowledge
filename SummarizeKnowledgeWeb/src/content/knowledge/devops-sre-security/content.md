## DevOps là vòng phản hồi, không phải một đội deploy hộ

DevOps nối business need, design, code, build, artifact, deploy, runtime, telemetry và learning thành một vòng phản hồi chung. Mục tiêu là giảm lead time **đồng thời** giữ reliability, security, cost và khả năng phục hồi. Automation chỉ có giá trị khi làm flow an toàn và có thể quan sát hơn.

Bản đồ D00–D20 của nguồn:

| Chặng | Nội dung |
|---|---|
| D00–D05 | Baseline/evidence; culture và SDLC; Linux; networking; Git; scripting |
| D06–D10 | Cloud architecture; IaC/config/image; CI/CD; Docker; Kubernetes/Helm/GitOps |
| D11–D16 | DevSecOps; observability; SRE; data/messaging; platform engineering; FinOps/capacity |
| D17–D20 | Incident/change/problem; HA/backup/DR; distributed/hybrid/multi-cloud; senior leadership/capstone |

Evidence trưởng thành đi từ “đọc hiểu” đến “giải thích”, “thực hiện được” và “vận hành/khôi phục được”. Một dashboard đẹp hoặc pipeline xanh không chứng minh production readiness nếu chưa có workload đại diện, failure drill, owner, SLO và rollback.

Các chỉ số delivery như deployment frequency, lead time for changes, change fail rate, failed deployment recovery time và reliability giúp tìm bottleneck ở cấp hệ thống. Không dùng metric để ép team tối ưu cục bộ hoặc so hạng cá nhân.

## Culture, Git và automation engineering

Value-stream map theo dõi thời gian làm việc và thời gian chờ từ ý tưởng đến user outcome. Definition of Done production-ready bao gồm test, security, observability, rollout/rollback, ownership và tài liệu vận hành. Trunk-based hay GitFlow chỉ là lựa chọn; branch/protected checks phải khớp tần suất release, compliance và khả năng tích hợp của team.

Git cần hiểu working tree, index, commit graph và ref. Merge giữ topology; rebase viết lại lịch sử; squash gom thay đổi. Chọn undo theo trạng thái đã chia sẻ: sửa local có thể reset/rebase, commit public thường nên revert. Reflog cứu ref local bị mất; bisect thu hẹp regression. Nếu secret đã commit, xóa file khỏi commit mới là chưa đủ: phải revoke/rotate, đánh giá exposure, dọn history khi cần và ngăn tái diễn.

Automation production phải có contract:

- Input/output, exit code và error taxonomy rõ.
- Idempotent hoặc có idempotency key/checkpoint.
- Timeout, cancellation, retry có backoff + jitter và retry budget.
- Structured log không lộ secret; correlation ID và metric phù hợp.
- Dry-run khi khả thi, bounded concurrency và cleanup khi partial failure.
- Unit/integration/fault test; package/version pin và owner.

Shell phù hợp orchestration nhỏ; Python/Go/C# phù hợp logic, API hoặc state machine lớn hơn. Quote biến, tránh parse output dành cho người, kiểm tra command existence và không dùng pipeline làm mất exit code. API automation phải xử lý pagination, rate limit, `Retry-After`, token expiry và partial success.

## Linux, network và cloud runtime

Khi service lỗi, điều tra theo tầng thay vì đoán: process/service → CPU/memory/I/O/pressure → filesystem/inode/file descriptor → network/DNS/TLS → dependency → application. Process khác thread; signal và PID 1 quyết định shutdown/reaping. Virtual memory, page cache, swap và OOM killer giải thích vì sao “RAM còn trống” không luôn đồng nghĩa hệ khỏe. Namespace/cgroup là nền tảng isolation và resource accounting của container.

Đường đi HTTPS đi qua DNS, route/NAT/firewall, TCP hoặc QUIC, TLS, proxy/load balancer và application. Debug cần kiểm tra cả forward/return path:

```text
name resolution -> route -> connect -> TLS -> HTTP -> upstream -> data store
```

CIDR xác định phạm vi địa chỉ; route quyết định next hop; security rule quyết định cho phép; NAT/conntrack giữ state và có thể cạn. DNS có cache/TTL/negative response; TLS cần chain, hostname, validity, algorithm và time đúng. MTU/PMTUD lỗi thường biểu hiện “kết nối được nhưng payload lớn treo”. L4 load balancer không hiểu HTTP semantics như L7 proxy.

Cloud architecture bắt đầu từ failure domain, identity, landing zone, network/data baseline và shared responsibility. Chọn VM, container, serverless, object/block/file storage hay managed database theo workload và operations, không theo xu hướng. Multi-AZ không tự tạo DR; region, identity, DNS, backup, quota và dependency control plane đều cần xem xét.

## CI/CD, artifact, container và Kubernetes

CI tạo feedback nhanh và artifact tái lập. Build một lần, ký/scan, lưu artifact immutable rồi promote cùng digest qua môi trường; không rebuild production từ source khác. Runner là control plane nhạy cảm: isolate job không tin cậy, dùng credential ngắn hạn, hạn chế network/secret, pin action/image và bảo vệ cache/artifact.

Release khác deployment. Rolling, blue/green, canary và feature flag có blast radius/rollback khác nhau. Progressive delivery cần success metric, observation window và abort threshold; database thay đổi theo expand-contract để app cũ/mới cùng chạy. Approval dựa trên risk và evidence, không chỉ là nút bấm thủ công.

Container là process bị cô lập bằng namespace/cgroup, không phải VM nhẹ hoàn chỉnh. Image gồm layer; digest immutable hơn tag. Dockerfile production nên multi-stage, base image nhỏ/pin digest, chạy non-root, không bake secret, có `.dockerignore`, health và graceful stop. Resource limit ảnh hưởng scheduler/OOM/throttling; PID 1 phải forward signal và reap child. Writable state nằm ở volume/service ngoài, không phụ thuộc container layer.

Kubernetes là control loop reconcile desired/observed state. Chọn Deployment, StatefulSet, DaemonSet, Job/CronJob theo semantics. Readiness quyết định nhận traffic; liveness chỉ restart tiến trình mắc kẹt; startup bảo vệ khởi động chậm. Request ảnh hưởng scheduling, limit ảnh hưởng enforcement; thiếu request làm autoscaling/capacity sai.

Service discovery, Ingress/Gateway, NetworkPolicy, ConfigMap/Secret, volume và disruption budget phải được thiết kế cùng nhau. Security baseline gồm namespace boundary, RBAC least privilege, workload identity, non-root/read-only filesystem, seccomp/capability, image policy và secret rotation. Helm tạo package/template; Kustomize patch; GitOps controller reconcile Git nhưng vẫn cần policy, secret strategy, drift ownership và emergency procedure.

## Security-by-design và software supply chain

Security bắt đầu từ asset, actor, trust boundary, data flow và abuse case. Risk kết hợp likelihood và impact; defense in depth, least privilege và secure defaults giảm blast radius. STRIDE là checklist gợi ý, không thay tư duy theo business workflow. Zero Trust nghĩa là liên tục xác minh identity/context và giới hạn quyền, không có nghĩa “không tin bất kỳ thứ gì”.

Authentication xác định ai; authorization quyết định được làm gì trên resource cụ thể. Session và JWT có trade-off revocation/state. JWT phải validate signature, algorithm allow-list, issuer, audience, expiry/not-before và key rotation—decode token không phải validate. OAuth 2.0 là authorization framework; OIDC bổ sung identity. Authorization Code + PKCE phù hợp public client; refresh-token rotation cần phát hiện reuse. Multi-tenant phải kiểm tra tenant/resource ownership ở server, chống BOLA/BFLA; RBAC có thể kết hợp ABAC/ReBAC.

Password dùng Argon2id/bcrypt/scrypt/PBKDF2 với salt và cost phù hợp. Encrypt bảo mật, hash kiểm tra integrity/one-way, signature xác thực nguồn và integrity. AEAD cần nonce không lặp; key nằm trong KMS/HSM/secret manager, dùng envelope encryption và rotation có version. TLS certificate chain, hostname và private-key lifecycle đều là một phần contract.

Các lớp lỗ hổng chính:

| Nhóm | Phòng vệ cốt lõi |
|---|---|
| SQL/command/template injection | Parameterization, allow-list, tách code khỏi data, least privilege |
| XSS/CSRF/CORS | Output encoding, CSP, CSRF token/SameSite; CORS không phải auth |
| SSRF | Allow-list destination, canonicalize, chặn private/metadata IP sau DNS resolve, egress policy |
| Path traversal/upload/deserialization | Canonical path, content/size scan, lưu ngoài web root, type allow-list |
| Mass assignment/workflow abuse | DTO allow-list, state-machine invariant, authorization từng transition |
| Replay/rate abuse | Nonce/timestamp/idempotency, quota/rate limit theo identity/tenant và audit |

Supply-chain controls gồm dependency pin/lock, SCA, secret scan, SAST/DAST, SBOM, provenance/signature, hardened builder, review publisher/typosquatting và vulnerability triage theo exploitability. CVE/CVSS là input chứ không phải quyết định cuối. Container/Kubernetes/cloud IAM cần patch cadence, admission policy, runtime detection và audit. Log không chứa token/password/PII vượt mục đích; data lifecycle gồm classification, retention, deletion và residency.

## Observability và OpenTelemetry

Monitoring trả lời câu hỏi đã dự đoán; observability giúp điều tra trạng thái chưa dự đoán từ output hệ thống. Bốn signal thường dùng là metric, log, trace và profile. OpenTelemetry chuẩn hóa instrumentation/context/export; Collector nhận, xử lý và chuyển telemetry, nhưng pipeline telemetry cũng cần health/SLO.

- **Metrics** rẻ cho trend/alert; kiểm soát label cardinality.
- **Logs** ghi event có cấu trúc, severity, correlation và context vừa đủ; tránh bí mật/PII.
- **Traces** nối latency/lỗi qua service; sampling phải giữ tail/error quan trọng.
- **Profiles** cho biết CPU/allocation/lock hot path theo thời gian.

RED đo rate, errors, duration cho request-driven service; USE đo utilization, saturation, errors cho resource. Histogram cần bucket phù hợp; percentile không cộng/trung bình tùy tiện giữa instance. Correlation context phải truyền qua HTTP/message/async boundary nhưng không biến baggage thành nơi chứa dữ liệu nhạy cảm.

Alert tốt gắn với user impact/SLO, có owner, runbook và ngưỡng hành động. Alert symptom ưu tiên hơn nguyên nhân phỏng đoán. Dashboard đi từ user journey/SLO xuống dependency và resource. Telemetry cost được kiểm soát bằng cardinality budget, filtering, retention tier và sampling; không tắt signal cần thiết chỉ để giảm hóa đơn.

## SRE, SLO, capacity và resilience

SLI là phép đo, SLO là mục tiêu, SLA là cam kết có hậu quả. Chọn SLI theo critical user journey: availability, latency, correctness, freshness hoặc durability. Error budget biến reliability thành cơ chế quyết định: burn nhanh thì dừng rollout/giảm rủi ro; budget khỏe cho phép thay đổi có kiểm soát.

Multi-window burn-rate alert phát hiện cả cháy nhanh và rò rỉ chậm. SLO phải định nghĩa good/valid events, cửa sổ, exclusion và data-quality. Không đặt 100% nếu hệ thống/dependency không thể đạt hoặc chi phí vượt giá trị business.

Resilience patterns:

- Timeout theo deadline, không để default vô hạn.
- Retry chỉ lỗi transient/idempotent, có exponential backoff, jitter, cap và budget.
- Circuit breaker giới hạn dependency lỗi; bulkhead cô lập pool/queue.
- Bounded queue và backpressure bảo vệ hệ thống khỏi overload.
- Rate limit/load shedding ưu tiên traffic quan trọng và quyết định fail-open/fail-closed.
- Graceful degradation trả chức năng tối thiểu thay vì cascade failure.

Capacity plan bắt đầu từ demand model, service time, concurrency, saturation point và headroom. Average che peak/tail; load test phải có arrival pattern, data và dependency đại diện. Availability chuỗi phụ thuộc thường nhân với nhau; redundancy chỉ hiệu quả nếu failure độc lập. Chaos/game day là experiment có hypothesis, blast-radius guardrail, abort và recovery—not phá production ngẫu nhiên. Toil lặp lại/manual/không tạo giá trị dài hạn nên được đo và ưu tiên automation.

## Data delivery, platform engineering và FinOps

DevOps cần hiểu data path đủ để vận hành: transaction/isolation, index/query, connection pool, replication, consistency, partition, backup/PITR, schema migration, cache và messaging. Chi tiết engine nằm ở tab Database; ở đây trọng tâm là change/recovery contract.

Queue, pub/sub và log có delivery/ordering khác nhau. Consumer phải idempotent; transactional outbox nối commit database với publish; saga điều phối compensation khi không có transaction phân tán. Retry không giới hạn tạo retry storm; DLQ cần owner, replay tool và dữ liệu đủ chẩn đoán. Backpressure phải truyền ngược thay vì để queue/memory tăng vô hạn.

Platform engineering xây **internal product** với golden path, service catalog, self-service contract và guardrail. Platform không phải ticket team hay tập YAML. Đo adoption, time-to-first-deploy, cognitive load, reliability và satisfaction. Multi-tenancy phải tách identity, quota, data và blast radius. Build-vs-buy dựa trên strategic differentiation, total cost, lock-in, skill và exit plan.

FinOps là vòng inform → optimize → operate. Gắn cost vào owner/product/environment, theo dõi budget/forecast/anomaly và unit economics như cost/request hoặc cost/customer. Tối ưu theo ba lớp: loại bỏ waste, right-size/schedule, rồi kiến trúc/purchase model. Không hy sinh SLO/security cho savings chưa đo. Capacity, reliability và sustainability liên quan nhau: headroom có giá trị, nhưng overprovision vô hạn không phải resilience.

## Incident, change, HA và disaster recovery

Incident response ưu tiên giảm impact trước root cause. Severity dựa trên user/business impact. Vai trò thường gồm incident commander, operations/technical lead, communications và scribe; một người không nên vừa thao tác vừa điều phối mọi thứ trong sự cố lớn.

Vòng đời:

```text
detect -> declare -> scope -> mitigate -> recover -> verify
       -> communicate -> learn -> track corrective actions
```

Timeline ghi fact, action, result và decision; hypothesis board phân biệt bằng chứng với phỏng đoán. Status update nêu impact, thời điểm, mitigation, uncertainty và lần cập nhật tiếp. Blameless không nghĩa không accountability: postmortem xem contributing factor ở hệ thống và action có owner/deadline/verification. Problem management theo dõi nguyên nhân lặp lại; change management điều chỉnh review/rollout theo risk.

HA giảm downtime trong failure thường gặp; backup tạo bản sao phục hồi; DR khôi phục sau thảm họa lớn; BCP giữ business hoạt động. RPO là lượng dữ liệu chấp nhận mất, RTO là thời gian phục hồi. Backup phải độc lập failure domain, immutable/offline khi cần, mã hóa và restore-tested. Failover cần health/quorum, fencing chống split brain, DNS/traffic switch và dependency readiness; failback thường khó không kém failover.

DR runbook gồm declaration gate, freeze/fence, restore/promote, scale, traffic switch, validate data/user journey, operate-on-DR và failback. Đo actual RTO/RPO qua drill. IaC giúp tái tạo hạ tầng nhưng không tự khôi phục data, identity, secret, DNS, quota hoặc external dependency.

### Companion: deploy React/Vite tĩnh lên Oracle Linux

`ClaudeArchitectFoundation/guide_deploy.md` là lab triển khai cụ thể bổ sung cho roadmap. Luồng chính là build Vite thành artifact tĩnh, upload theo release directory, trỏ symlink `current`, cấu hình Nginx SPA fallback/cache, mở OCI NSG/Security List và host firewall, gắn DuckDNS rồi cấp TLS bằng Certbot. SSH key trên Windows phải có ACL đủ chặt; private key, `.env` và secret không nằm trong web root/artifact.

Update an toàn tạo release mới rồi đổi symlink; rollback trỏ lại release trước và reload Nginx sau khi validate config. Troubleshooting đi từ DNS → OCI rule/firewall → listener/process → Nginx log → file permission/root path → certificate. Đây là static deployment companion, không thay container/orchestrator, backend database migration hay DR plan.

### Distributed systems, hybrid và multi-cloud

Hệ phân tán gặp partial failure, network partition, clock/order không tuyệt đối và retry duplicate. CAP chỉ áp dụng khi partition xảy ra; PACELC nhắc trade-off latency/consistency cả lúc bình thường. Chọn consistency theo invariant nghiệp vụ, không theo khẩu hiệu “eventual là scalable”.

Timeout, idempotency, dedup, lease, fencing token, quorum và backpressure là building blocks. Distributed lock có expiry không đủ chống old owner tiếp tục ghi; downstream cần fencing token tăng dần. “Exactly once” thường được xây bằng at-least-once + idempotency + transactional boundary/reconciliation.

Monolith, modular monolith và microservice có trade-off ownership/deploy/consistency/operations. Service mesh giải quyết một số traffic policy/telemetry, không sửa service boundary xấu. Hybrid cần identity federation, private connectivity, DNS, latency và operations thống nhất. Multi-cloud tăng portability/resilience trong một số driver nhưng cũng tăng skill, egress, data consistency và failure mode; DR đa cloud phải diễn tập data restore và traffic shift chứ không chỉ có Terraform ở hai provider.

## Senior ownership, portfolio và cách tự kiểm tra

Senior DevOps/SRE tạo direction, guardrail và khả năng cho người khác, không chỉ biết nhiều tool. Technical strategy nối business outcome với risk, architecture option, sequencing và measurable signal. Architecture review hỏi failure mode, security, data, operability, cost và reversibility. Technical debt được quản như portfolio có impact/interest, không phải backlog vô hạn.

Portfolio nguồn đi qua bốn dự án: API local-first; OCI staging bằng Terraform; production platform có SLO/game day; capstone OCI primary với AWS/Azure DR. Mỗi dự án cần README assumption, architecture/ADR, code/pipeline, threat model, SLO/dashboard, runbook, cost/capacity, test output, cleanup và retrospective. Template có sẵn cho ADR, SLO, runbook, incident timeline, postmortem, change/rollback, DR test, threat model và production readiness.

Checklist năng lực:

- [ ] Từ symptom đi tới root cause bằng hypothesis và evidence.
- [ ] Ship artifact immutable qua progressive delivery, có rollback/roll-forward.
- [ ] Thiết kế least privilege, secret rotation và supply-chain evidence.
- [ ] Định nghĩa SLO, alert, capacity và overload behavior.
- [ ] Điều phối incident, giao tiếp rõ và theo action đến khi verify.
- [ ] Restore backup, chạy DR drill và đo RTO/RPO.
- [ ] Cân bằng speed, reliability, security, cost và developer experience.
- [ ] Giải thích trade-off với stakeholder và mentoring người khác tự vận hành.

## Nguồn đã gom và ranh giới nội dung

`sourceFolders` giữ course `Terraform/Devops`, guide deploy React/Vite và đúng các file hỏi/đáp về Infrastructure, DevOps/Observability, Security. Nguồn canonical là roadmap D00–D20, lab/project/template/quiz/capstone; question/answer là lớp tự kiểm tra chứ không bị đếm như một course thứ hai.

Để tránh trùng, tab này chịu trách nhiệm **software delivery lifecycle, runtime operations, reliability và security controls**. Terraform/HCL/state/module nằm ở tab Terraform & Cloud; execution plan, MVCC, MergeTree và database internals nằm ở tab Database; thuật toán cấu trúc dữ liệu nằm ở tab Algorithms. Các phần giao nhau—migration, outbox, IaC, cloud hoặc distributed systems—chỉ được nhắc ở đây theo góc nhìn vận hành, failure policy và evidence.
