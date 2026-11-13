# Senior/Staff question bank

Ở cấp này, “đáp án đúng” phải nối technical mechanism với SLO, blast radius, cost, org ownership và migration. Gợi ý vòng 75 phút: 2 câu container platform + 4 câu Kubernetes/platform + một design/troubleshooting drill.

## Container platform và supply chain

### S-D01 — Chọn mức abstraction

Khi nào tổ chức nên dùng process/systemd, Docker Compose, managed container service hay Kubernetes?

**Deep follow-up:** Team size, failure domains, workload diversity, compliance, portability, TCO và exit strategy ảnh hưởng quyết định ra sao?

### S-D02 — Standardized image platform

Thiết kế golden-path image build cho hàng trăm repository nhưng không tạo “golden image” trì trệ.

**Deep follow-up:** Base image ownership, automated rebuild, digest pin/update, SBOM/provenance/signing, exceptions và developer feedback time.

### S-D03 — Build infrastructure threat model

Threat-model shared remote builders và CI runners xử lý untrusted pull requests.

**Deep follow-up:** Cache poisoning, secret exfiltration, privileged DinD/socket, network egress, provenance identity, isolation/ephemeral workers.

### S-D04 — Registry resilience

Registry outage hoặc compromise ảnh hưởng deploy/rollback thế nào? Thiết kế resilience và containment.

**Deep follow-up:** Node cache, mirrors, multi-region replication, immutable retention, signing policy, revocation và break-glass.

### S-D05 — Runtime hardening strategy

Làm sao áp least privilege toàn fleet mà không phá developer velocity?

**Deep follow-up:** Rootless, capabilities/seccomp/LSM, read-only FS, user namespaces, sandbox runtime, policy tiers và exception expiry.

### S-D06 — Image CVE program

Bạn ưu tiên và đo hiệu quả vulnerability remediation thế nào thay vì chỉ đếm CVE?

**Deep follow-up:** Reachability, exploitability, EPSS/vendor status, fix availability, patch SLA, base rebuild latency, accepted-risk debt.

### S-D07 — Container escape response

Khi nghi container escape trên một node, incident command và recovery sequence là gì?

**Deep follow-up:** Evidence preservation, credential blast radius, node isolation, workload evacuation, clean rebuild, trust re-establishment và disclosure.

### S-D08 — Linux fundamentals under abstraction

Những kiến thức kernel/network/storage nào platform team bắt buộc phải giữ dù dùng managed Kubernetes?

**Deep follow-up:** Namespace/cgroup, capabilities/seccomp, OOM, filesystem/overlay, conntrack/MTU/DNS, signals và time/clock.

## Kubernetes/platform engineering

### S-K01 — Control-plane HA và failure semantics

Thiết kế/đánh giá HA của API server, etcd và controllers. Điều gì xảy ra khi control plane unavailable nhưng nodes còn chạy?

**Deep follow-up:** Quorum, leader election, stale data, admission dependencies, backup restore và degraded-mode runbook.

### S-K02 — Multi-tenancy

Thiết kế soft và hard multi-tenancy cho nhiều team có mức tin cậy khác nhau.

**Deep follow-up:** RBAC, network, quota, admission, secret/KMS, node/runtime isolation, noisy neighbor, cluster-scoped APIs, audit và khi nào tách cluster.

### S-K03 — Cluster topology/fleet

Một cluster lớn hay nhiều cluster? Thiết kế fleet theo region/environment/tenant.

**Deep follow-up:** Blast radius, quota, upgrade, policy drift, service discovery, data gravity, cost, control-plane limits và fleet management.

### S-K04 — Platform API/golden path

Bạn cung cấp abstraction nào cho product teams mà không che mất Kubernetes đến mức không debug được?

**Deep follow-up:** CRD/operator vs templates, paved road, escape hatch, ownership, API versioning/deprecation và feedback loops.

### S-K05 — Network architecture

Chọn/evaluate CNI, service dataplane, ingress/gateway và egress architecture.

**Deep follow-up:** Scale, NetworkPolicy semantics, eBPF/iptables, observability, encryption, MTU, source IP, multi-cluster, upgrade và support.

### S-K06 — Service mesh decision

Khi nào service mesh mang lại giá trị và khi nào là overkill?

**Deep follow-up:** mTLS identity, retries/timeouts, traffic policy, telemetry, sidecar/ambient cost, failure amplification và ownership.

### S-K07 — Storage strategy

Thiết kế storage classes và data protection cho stateful workloads đa zone.

**Deep follow-up:** CSI maturity, topology, RWO/RWX, reclaim, expansion, snapshot vs backup, encryption/key, performance/SLO và restore drills.

### S-K08 — Autoscaling feedback loops

Thiết kế HPA/VPA/node autoscaler để không oscillate hoặc scale sai bottleneck.

**Deep follow-up:** Metric lag, cold start, request denominator, queue metrics, stabilization, capacity headroom, quota và downstream limits.

### S-K09 — Availability model

Từ SLO của service, suy ra replicas, topology, rollout, PDB, capacity và dependency budget thế nào?

**Deep follow-up:** Correlated failure, zone loss, quorum, maintenance, retry storm, load shedding và error-budget policy.

### S-K10 — Disaster recovery

Thiết kế DR cho cluster và application data với RPO/RTO khác nhau.

**Deep follow-up:** etcd/Git/Secrets/KMS/PV/database, restore ordering, DNS/traffic, external side effects, immutable backup và regular game day.

### S-K11 — Security architecture

Threat-model đường từ internet tới workload tới control plane/cloud credentials.

**Deep follow-up:** Identity federation, RBAC escalation, Pod Security, NetworkPolicy, admission, metadata service, supply chain, audit/SIEM và break-glass.

### S-K12 — Admission/policy platform

Thiết kế policy-as-code rollout không làm API outage hoặc block toàn bộ developer.

**Deep follow-up:** Validate/mutate, failurePolicy, HA/latency, audit→warn→enforce, exemptions, versioning, dry-run/test và emergency bypass.

### S-K13 — Upgrade/deprecation program

Quản hàng trăm CRD/addon/team qua Kubernetes upgrade cadence thế nào?

**Deep follow-up:** API inventory, compatibility contracts, canary cluster/node, conversion webhook, rollback boundary, owner/SLA và automated conformance.

### S-K14 — Observability platform

Thiết kế metrics/logs/traces/audit cho fleet lớn với cost/cardinality constraints.

**Deep follow-up:** Tenant isolation, sampling, retention tiers, SLO queries, metadata churn, backpressure, disaster mode và platform SLO.

### S-K15 — Cost/capacity governance

Giảm chi phí cluster mà không hy sinh reliability thế nào?

**Deep follow-up:** Requests utilization, bin packing, spot/preemptible, quotas, topology/headroom, scale-to-zero, chargeback/showback và unit economics.

### S-K16 — Incident leadership

Trong outage toàn region, bạn phân vai, ra quyết định và giao tiếp thế nào?

**Deep follow-up:** Incident commander/ops/comms/scribe, hypothesis log, change freeze, abort criteria, stakeholder cadence, handoff và blameless follow-up.

### S-K17 — Managed vs self-managed

Đánh giá managed Kubernetes và self-managed bằng shared-responsibility/TCO thay vì feature checklist.

**Deep follow-up:** Control-plane access, upgrade windows, compliance, data residency, integrations, support, skills/on-call và portability.

### S-K18 — Migration at scale

Lập kế hoạch migrate workload từ VMs/Compose sang Kubernetes mà không “lift-and-shift mọi thứ”.

**Deep follow-up:** Workload segmentation, twelve-factor gaps, state/data, strangler pattern, dual run, observability, rollback, team enablement và success metrics.
