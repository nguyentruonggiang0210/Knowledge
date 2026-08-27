# Ánh xạ curriculum D01–D20

Question bank dùng mã lesson theo bảng này. Nếu tên file lesson thay đổi, đối chiếu theo năng lực thay vì phụ thuộc tên file vật lý.

| Mã | Chủ đề | Năng lực cần chứng minh |
|---|---|---|
| D01 | DevOps culture và SDLC | Systems thinking, flow/feedback/learning, product outcome, DORA, ownership, collaboration và shared responsibility |
| D02 | Linux operations | Filesystem, user/group/permission, process, signal, systemd, package, resource, log, SSH và hardening căn bản |
| D03 | Networking, DNS, HTTP và TLS | TCP/IP, CIDR, route/NAT/firewall, DNS resolution/cache, HTTP/proxy/LB, TLS chain/SNI/mTLS và packet-path debug |
| D04 | Git và collaboration | Commit/branch/merge/rebase/conflict, PR/CODEOWNERS, revert, tag/release, SemVer và protected workflow |
| D05 | Scripting và automation engineering | Bash/PowerShell/Python/Go căn bản, exit code, strict error handling, JSON/API, idempotency, test và retry an toàn |
| D06 | Cloud architecture | Shared responsibility, region/AZ/AD, landing zone, tenancy/account/subscription, identity, network, quota, SLA và Well-Architected trade-off |
| D07 | IaC, configuration và image | Terraform/state/module, declarative change; ranh giới Terraform/Packer/Ansible/cloud-init; immutable image và drift |
| D08 | CI/CD, artifact và release | Build/test/scan/sign/promote/deploy, immutable artifact identity, runner, cache, approval, concurrency, rollback/roll-forward và DB compatibility |
| D09 | Container và OCI runtime | Image/layer/registry/digest, namespace/cgroup, PID 1/signal, rootless, resource limit, storage/network và Dockerfile security |
| D10 | Kubernetes, Helm và GitOps | Pod/Deployment/Service/Ingress, probe, resource, Config/Secret, RBAC/NetworkPolicy/storage; Helm, reconciliation và OKE |
| D11 | DevSecOps và software supply chain | Threat model, least privilege, secret/PKI lifecycle, vulnerability/patch, SBOM, provenance/attestation/signing, policy-as-code, audit |
| D12 | Observability và OpenTelemetry | Metrics/logs/traces/profiles, RED/USE, structured log, context propagation, cardinality, sampling, collector và telemetry pipeline |
| D13 | SRE, reliability và performance | SLI/SLO/error budget, alert quality, capacity/load test, saturation, queue/backpressure, graceful degradation, toil và runbook |
| D14 | Data, database, cache và messaging | Transaction/consistency, index/query, cache semantics, queue/stream, idempotent consumer, schema migration, durability và recovery |
| D15 | Platform engineering và developer experience | Internal developer platform, platform-as-product, golden path/paved road, self-service, API/contract, scorecard và adoption/outcome |
| D16 | FinOps, capacity và sustainability | Cost allocation, estimate/budget/anomaly, right-size, commitment/egress, unit economics, demand/capacity và carbon-aware trade-off |
| D17 | Incident, change và problem management | On-call, severity, incident command/comms/timeline, safe change, rollback, postmortem, root/contributing factors và corrective action |
| D18 | HA, backup, BCP và DR | Failure domain, redundancy, replication, backup/restore, RPO/RTO, failover/failback, split-brain, game day và continuity |
| D19 | Distributed, hybrid và multi-cloud | Partial failure, timeout/retry, consistency, consensus awareness, hybrid connectivity/identity/data gravity và multi-cloud trade-off |
| D20 | Senior leadership và capstone | Technical strategy, risk/priority, stakeholder communication, mentoring, decision record, roadmap, governance và end-to-end ownership |

## Ma trận cấp độ

| Cấp | Lesson trọng tâm | Điều kiện đầu vào |
|---|---|---|
| Foundation | D01–D06, nhập môn D08 | Không |
| Core | D05–D09, D11 | Đạt Foundation và có lab Linux/cloud |
| Cloud-Native | D08–D13 | Đã build/push image và đọc được network path |
| Production | D12–D18 | Đã vận hành một workload có telemetry |
| Senior | D01, D06, D11–D20 | Có khả năng giải thích trade-off và dẫn dắt incident/change |

## Bốn tầng kiểm tra

1. **Nhớ/hiểu:** định nghĩa và phân biệt khái niệm gần nhau.
2. **Áp dụng:** viết lệnh/cấu hình hoặc thực hiện runbook đúng.
3. **Phân tích:** khoanh vùng bằng evidence thay vì đoán.
4. **Đánh giá/thiết kế:** cân bằng risk, security, reliability, cost, delivery speed và human factors.

Capstone kiểm tra đồng thời cả bốn tầng, đặc biệt yêu cầu restore test, incident drill và evidence có thể audit.

