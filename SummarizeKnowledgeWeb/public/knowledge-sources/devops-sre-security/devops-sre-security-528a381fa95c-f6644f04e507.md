# DevOps Mastery Checklist

Checklist này đo năng lực qua output quan sát được. Với mỗi dòng, đánh:

- 0: chưa biết;
- 1: giải thích được;
- 2: làm được trong lab;
- 3: làm độc lập trong production;
- 4: thiết kế chuẩn, review và coaching người khác.

Mục tiêu sẵn sàng Senior không phải tất cả đều 4. Nên đạt tối thiểu 3 ở các năng lực cốt
lõi của vai trò, không có vùng production-critical ở 0, và có nhiều evidence dẫn dắt mức 4.

## Product, culture và delivery

- [ ] Vẽ value stream, tìm queue/handoff/rework và đo lead time.
- [ ] Viết Definition of Done gồm test, security, observability, rollback và ownership.
- [ ] Thiết kế trunk-based hoặc release workflow có lý do và branch protection.
- [ ] Build một lần, promote cùng artifact digest qua các môi trường.
- [ ] Chọn rolling, blue-green, canary hoặc feature flag theo risk.
- [ ] Đo delivery outcome mà không biến metric thành KPI phạt cá nhân.

## Systems và networking

- [ ] Quản lý Linux user/group/permission, filesystem, process, service, package và log.
- [ ] Điều tra CPU, memory, disk, inode, I/O, file descriptor và OOM.
- [ ] Viết systemd unit an toàn, health check và graceful shutdown.
- [ ] Tính subnet/CIDR và giải thích route, NAT, firewall stateful/stateless.
- [ ] Theo dấu DNS recursion/cache/TTL và HTTPS handshake/certificate/SNI.
- [ ] Debug packet path và return path bằng evidence ở từng hop.

## Code, automation và source control

- [ ] Dùng Git commit/branch/rebase/merge/revert/reset/reflog đúng tình huống.
- [ ] Resolve conflict, bisect regression, tag/release và review pull request.
- [ ] Viết Bash/PowerShell/Python có input validation, timeout, retry/backoff và exit code.
- [ ] Script idempotent, có structured log, dry-run/test và không lộ secret.
- [ ] Thiết kế API/CLI automation chịu pagination, rate limit và partial failure.

## Cloud, IaC và configuration

- [ ] Giải thích shared responsibility, identity hierarchy, landing zone và quota.
- [ ] Thiết kế network private-by-default, least privilege và centralized audit.
- [ ] Chọn đúng Terraform, Ansible, Packer, cloud-init hoặc orchestrator.
- [ ] Quản lý module/version/state/locking/import/drift và policy-as-code.
- [ ] Tách account/subscription/tenancy, environment và state để giới hạn blast radius.
- [ ] So sánh OCI/AWS/Azure theo capability và operating model, không map tên máy móc.

## Containers và Kubernetes

- [ ] Giải thích namespace/cgroup/image/layer/runtime và VM versus container.
- [ ] Build image multi-stage, pinned digest, non-root, read-only khi phù hợp.
- [ ] Vận hành registry, vulnerability scan, SBOM, signing và provenance.
- [ ] Debug Pod từ scheduling, image pull, config, network, probe đến resource pressure.
- [ ] Dùng Deployment/StatefulSet/Job/Service/Ingress/Gateway/PV đúng semantics.
- [ ] Thiết kế requests/limits, probes, PDB, autoscaling, RBAC và NetworkPolicy.
- [ ] Quản lý Helm/Kustomize và GitOps reconciliation, drift, promotion, rollback.
- [ ] Hiểu upgrade, etcd/control plane, multi-tenancy và khi không nên tự host cluster.

## Security và compliance

- [ ] Threat model trust boundary, asset, actor, abuse case và mitigation.
- [ ] Thiết kế identity federation/MFA/workload identity/least privilege/JIT.
- [ ] Quản lý secret/key/certificate rotation và break-glass có audit.
- [ ] Tích hợp SAST, SCA, secret, IaC, image và dynamic scan theo risk.
- [ ] Tạo SBOM/provenance/signature và verify trước deploy.
- [ ] Phân loại data, encryption, retention, deletion và evidence compliance.
- [ ] Triage vulnerability theo exploitability/exposure/business impact, không chỉ CVSS.
- [ ] Dẫn tabletop leak/compromise và rotation không downtime.

## Observability và SRE

- [ ] Thiết kế telemetry theo câu hỏi vận hành; kiểm soát cardinality và retention.
- [ ] Correlate metrics/logs/traces bằng resource metadata, trace/context propagation.
- [ ] Dùng RED/USE, dashboard theo user journey và alert có owner/runbook.
- [ ] Chọn SLI từ trải nghiệm người dùng, viết SLO cửa sổ thời gian rõ ràng.
- [ ] Tính error budget/burn rate và dùng nó cho release decision.
- [ ] Thiết kế load/stress/soak test, capacity model và graceful degradation.
- [ ] Loại toil bằng engineering, đo hiệu quả trước/sau.
- [ ] Chạy chaos/game day có hypothesis, guardrail, abort và learning.

## Data và distributed systems

- [ ] Chọn relational, key-value, document, cache, queue hoặc stream theo semantics.
- [ ] Giải thích transaction, isolation, consistency, replication và partition trade-off.
- [ ] Thiết kế backward/forward-compatible schema migration và rollback/roll-forward.
- [ ] Xử lý idempotency, retry storm, duplicate/out-of-order message và dead-letter queue.
- [ ] Test backup/restore, PITR và data reconciliation.
- [ ] Thiết kế timeout, bounded retry, exponential backoff, jitter và circuit breaker.
- [ ] Nhận diện thundering herd, hot key, cascading failure và split brain.

## Platform, cost và operations

- [ ] Xem internal platform như product: user research, roadmap, support và adoption.
- [ ] Tạo golden path self-service có escape hatch, guardrail và ownership.
- [ ] Đo developer experience qua flow/outcome, không chỉ portal usage.
- [ ] Phân bổ cost bằng metadata; lập budget, forecast, anomaly và unit economics.
- [ ] Right-size dựa trên usage/SLO; hiểu commitment, license, storage và egress trade-off.
- [ ] Viết runbook, ADR, change plan, rollback và production-readiness review.
- [ ] Dẫn incident: role, severity, timeline, communication, mitigation, handoff.
- [ ] Viết blameless postmortem và theo corrective action đến khi đóng.
- [ ] Phân biệt HA với DR; đặt RTO/RPO, restore và failover/failback thật.

## Leadership

- [ ] Chuyển business outcome thành technical roadmap và đo impact.
- [ ] Facilitate architecture review, ghi trade-off, assumption và decision.
- [ ] Ưu tiên reliability/security debt dựa trên risk và evidence.
- [ ] Giao tiếp với engineer, security, product, finance và executive ở đúng mức chi tiết.
- [ ] Mentoring bằng câu hỏi, feedback cụ thể và tăng autonomy.
- [ ] Quản lý vendor/lock-in/exit plan, build-versus-buy và total cost of ownership.
- [ ] Bình tĩnh trong ambiguity, biết khi escalate và khi dừng thay đổi.

## Evidence bắt buộc trước capstone

- [ ] Ba project portfolio có README chạy lại được.
- [ ] Một pipeline promote artifact, một Kubernetes rollout và một IaC change.
- [ ] Một threat model, một SLO/dashboard/alert và một cost review.
- [ ] Một restore report, một game-day report và một blameless postmortem.
- [ ] Ít nhất hai ADR có lựa chọn bị loại cùng lý do.
- [ ] Một pull request hoặc design review chứng minh khả năng review/coaching.
- [ ] Quiz lý thuyết đạt tối thiểu 80% và practical đạt safety gate.

Đối chiếu từng nhóm với [lesson map](README.md#bản-đồ-năng-lực-d00-d20) và lưu link evidence
ngay cạnh checkbox trong bản copy cá nhân.
