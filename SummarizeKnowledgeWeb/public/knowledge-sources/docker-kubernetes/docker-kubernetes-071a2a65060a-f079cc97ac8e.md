# Mid-level question bank

Gợi ý vòng 60 phút: 3 Docker + 5 Kubernetes + 1 troubleshooting drill. Kỳ vọng ứng viên mô tả evidence/rollback, không chỉ định nghĩa.

## Docker

### M-D01 — Cache và reproducibility

Bạn tối ưu Docker build cache cho monorepo mà vẫn deterministic thế nào?

**Deep follow-up:** Cache mount, remote cache, lockfile, base digest và cache poisoning/trust liên hệ ra sao?

### M-D02 — Multi-platform

Thiết kế build/publish `linux/amd64` và `linux/arm64`.

**Deep follow-up:** Native builder, cross-compile và QEMU trade-off; bạn test manifest/binary architecture thế nào?

### M-D03 — Image supply chain

Pipeline từ source tới image production cần những gate nào?

**Deep follow-up:** SBOM, scan, signature, provenance trả lời các câu hỏi khác nhau gì? Xử lý CVE chưa có fix?

### M-D04 — Build secrets

Private dependency cần token/SSH key lúc build. Thiết kế không leak vào layer/cache/history.

**Deep follow-up:** Nếu token từng truyền qua `ARG`, incident response gồm gì?

### M-D05 — PID 1 và graceful shutdown

Ứng dụng có worker child, long-lived request và queue consumer. Thiết kế shutdown thế nào?

**Deep follow-up:** Signal forwarding, zombie reaping, stop timeout, idempotent message và load balancer draining.

### M-D06 — Storage/backup

Chọn bind/volume/tmpfs cho source, DB, cache và runtime secret; backup database volume ra sao?

**Deep follow-up:** Filesystem copy khi DB đang ghi khác logical backup/quiesced snapshot thế nào?

### M-D07 — Network data path

Giải thích request từ internet → host published port → bridge → container, và egress ngược lại.

**Deep follow-up:** DOCKER-USER/iptables/nftables, conntrack, MTU và rootless networking có thể ảnh hưởng debug ra sao?

### M-D08 — Compose production

Bạn sẽ và sẽ không dùng Compose cho production nào?

**Deep follow-up:** Single-host failure, rollout, secret, observability, backup, resource isolation và migration path lên orchestrator.

### M-D09 — Resource diagnosis

Container latency cao trong khi host CPU trung bình thấp. Bạn kiểm tra throttling, cpuset, memory/GC, I/O và downstream thế nào?

**Deep follow-up:** Vì sao CPU shares không phải reservation và average che peak?

### M-D10 — Logging

Thiết kế logging để host không đầy disk và vẫn điều tra được container đã mất.

**Deep follow-up:** stdout/stderr, logging driver backpressure, rotation, central store, correlation và PII redaction.

### M-D11 — Least privilege

Harden một service đang yêu cầu `privileged` chỉ vì bind low port và ghi `/tmp`.

**Deep follow-up:** Non-root, capability, read-only rootfs, tmpfs, seccomp, AppArmor/SELinux và rootless trade-off.

### M-D12 — Docker socket

Vì sao mount Docker socket là rủi ro cấp host? Nếu CI cần build image, có những pattern thay thế nào?

**Deep follow-up:** Remote builder, rootless BuildKit, isolated runner, socket proxy có giới hạn và threat model gì?

### M-D13 — Layer forensics

Secret đã `rm` ở layer sau nhưng scanner vẫn thấy. Giải thích và khắc phục.

**Deep follow-up:** Rebase/squash có đủ không, registry/cache/old digest xử lý thế nào?

### M-D14 — Upgrade Engine/runtime

Bạn lập kế hoạch nâng Docker Engine trên fleet production ra sao?

**Deep follow-up:** API compatibility, storage driver, cgroup v2, firewall changes, canary, drain và rollback.

## Kubernetes

### M-K01 — Apply/ownership

Server-side apply và managed fields giúp nhiều controller/tool cùng quản object thế nào?

**Deep follow-up:** Khi conflict, lúc nào force ownership nguy hiểm?

### M-K02 — Rolling update zero-downtime

Thiết kế Deployment rollout cho API có request dài và warm-up 45 giây.

**Deep follow-up:** maxSurge/maxUnavailable, startup/readiness, minReadySeconds, preStop, grace, PDB và LB propagation.

### M-K03 — StatefulSet

Bạn có chạy PostgreSQL/Kafka bằng StatefulSet không? StatefulSet cung cấp gì và thiếu gì?

**Deep follow-up:** Operator, quorum, fencing, topology, backup/restore và managed service trade-off.

### M-K04 — Service debugging

Pod Ready nhưng Service timeout. Hãy đưa decision tree.

**Deep follow-up:** Selector/EndpointSlice/targetPort/listen address/NetworkPolicy/kube-proxy or eBPF dataplane.

### M-K05 — DNS incident

Một namespace resolve internal service được nhưng external domain không được.

**Deep follow-up:** ndots/search, CoreDNS forwarding/cache, egress policy port 53 TCP+UDP, upstream và node-local DNS.

### M-K06 — NetworkPolicy semantics

Giải thích additive allow, ingress/egress isolation và AND/OR selector.

**Deep follow-up:** Vì sao policy object tồn tại nhưng không enforce; L7/mTLS cần lớp nào khác?

### M-K07 — RBAC escalation

Vì sao quyền create Pod hoặc read Secret có thể gần tương đương quyền cao hơn?

**Deep follow-up:** `bind`, `escalate`, `impersonate`, service account token, admission và node isolation.

### M-K08 — Pod security

Đưa securityContext production baseline và cách enforce ở nhiều team.

**Deep follow-up:** Restricted Pod Security Standard, exceptions, policy-as-code, runtimeClass/sandbox và false positives.

### M-K09 — Secret lifecycle

Thiết kế secret delivery/rotation cho 100 services.

**Deep follow-up:** etcd encryption/KMS, external provider, CSI vs env, reload/rollout, audit và blast radius.

### M-K10 — Scheduling/capacity

Pods Pending dù tổng cluster còn đủ CPU. Vì sao?

**Deep follow-up:** requests/bin packing, fragmentation, affinity/taint/topology, PVC zone, extended resources và preemption.

### M-K11 — Resources/QoS

Right-size requests/limits cho service latency-sensitive thế nào?

**Deep follow-up:** CPU throttling, memory OOM, QoS/eviction, LimitRange/Quota, VPA recommendations và headroom.

### M-K12 — HPA

HPA theo CPU không phản ứng đúng traffic. Bạn điều tra và chọn metric khác thế nào?

**Deep follow-up:** request denominator, missing metrics, readiness/cold start, custom/external metrics, stabilization/flapping.

### M-K13 — Disruption

PDB bảo vệ gì? Vì sao drain có thể bị kẹt hoặc vẫn downtime dù có PDB?

**Deep follow-up:** voluntary/involuntary, unhealthyPodEvictionPolicy, direct delete, quorum và spare capacity.

### M-K14 — PVC lifecycle

PVC Pending và volume zone mismatch: decision tree và recovery an toàn.

**Deep follow-up:** StorageClass, WaitForFirstConsumer, reclaim policy, snapshot consistency, expansion và CSI logs.

### M-K15 — Observability/SLO

Thiết kế telemetry và alert cho một API Kubernetes.

**Deep follow-up:** golden signals, app vs platform metrics, logs/traces correlation, error-budget burn và cardinality/cost.

### M-K16 — CrashLoop/OOM

Ứng dụng `CrashLoopBackOff` xen kẽ `OOMKilled`. Bạn khoanh vùng leak, peak, probe và config thế nào?

**Deep follow-up:** previous logs, termination state, per-container metric, heap vs cgroup, rollout diff và mitigation.

### M-K17 — Delivery

Thiết kế CI/CD dev → staging → production mà không rebuild image.

**Deep follow-up:** digest, signature/provenance, GitOps drift, Helm/Kustomize, canary gates và config rollback.

### M-K18 — Cluster upgrade

Nâng một minor Kubernetes an toàn gồm những bước nào?

**Deep follow-up:** deprecated APIs, version skew, CRD/webhook/CNI/CSI/ingress compatibility, backup restore, node pools và rollback limits.
