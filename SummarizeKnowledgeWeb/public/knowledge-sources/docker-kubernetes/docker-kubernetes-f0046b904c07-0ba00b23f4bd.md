# 13 — Checklist bao phủ Kubernetes chuyên sâu

## Cách dùng

Không đánh dấu vì “đã đọc”. Mỗi mục phải có ít nhất một bằng chứng: diagram tự vẽ, manifest, command output, test, incident timeline, ADR hoặc restore report. Ghi link bằng chứng cạnh checkbox trong bản copy cá nhân.

Kubernetes/ecosystem luôn tiến hóa; checklist này phủ nền cốt lõi và miền production, không thể liệt kê mọi provider/controller/CRD. Mỗi quý đối chiếu release notes, feature gates, deprecations và add-on support matrix.

## 1. Tiền đề container/Linux

- [ ] Giải thích image/layer/registry/tag/digest, OCI, CRI và container runtime.
- [ ] Debug PID 1, signal, exit code, cgroup CPU/memory/OOM, namespace/mount/permission.
- [ ] Phân biệt container restart, Pod replace, node reboot và reschedule.
- [ ] Giải thích TCP/UDP, DNS, routing/NAT, TLS/SNI, L4/L7.
- [ ] Phân biệt stateless/stateful, replication/quorum, snapshot/backup, RPO/RTO.

## 2. Kiến trúc và API

- [ ] Vẽ API server, etcd, scheduler, controller manager, kubelet, runtime, CNI, CSI.
- [ ] Giải thích desired/current state, reconcile, idempotency, eventual convergence.
- [ ] Theo dấu request qua authn/authz/admission/validation/persistence/watch.
- [ ] Đọc GVK/GVR, discovery, namespaced/cluster-scoped, spec/status/conditions.
- [ ] Dùng labels/annotations/selectors, generation/observedGeneration, UID/resourceVersion.
- [ ] Giải thích ownerReference, garbage collection, finalizer và deletion propagation.
- [ ] Dùng apply/diff/patch và Server-Side Apply/field ownership an toàn.
- [ ] Biết CRD/schema/conversion/webhook/operator/reconciliation và khi không nên tạo operator.
- [ ] Dùng Events/audit/managedFields đúng mục đích và hiểu retention.

## 3. Workloads và lifecycle

- [ ] Chọn Deployment/StatefulSet/DaemonSet/Job/CronJob đúng tình huống.
- [ ] Hiểu Pod network/volume sharing, init/sidecar/ephemeral container.
- [ ] Giải thích ReplicaSet, rolling update, surge/unavailable, progress, rollback.
- [ ] Thiết kế graceful termination, signal, preStop và grace period.
- [ ] Thiết kế Job idempotency, retry/deadline/parallelism; CronJob overlap/missed run.
- [ ] Giải thích StatefulSet identity, headless Service, PVC template, update/retention.
- [ ] Debug Pending, ImagePullBackOff, CrashLoopBackOff, OOMKilled và rollout stuck.

## 4. Scheduling/resources

- [ ] Tính CPU/memory/ephemeral storage requests/limits và units.
- [ ] Giải thích scheduler filter/score/bind, kubelet thực thi, overcommit.
- [ ] Phân biệt Guaranteed/Burstable/BestEffort, OOM và node-pressure eviction.
- [ ] Dùng nodeSelector/node affinity, pod affinity/anti-affinity đúng.
- [ ] Dùng topology spread theo hostname/zone và phân tích thiếu capacity.
- [ ] Phân biệt taint/toleration với attraction; priority/preemption trade-off.
- [ ] Thiết kế LimitRange/ResourceQuota và namespace capacity guardrails.
- [ ] Hiểu PDB voluntary/involuntary disruption và drain behavior.
- [ ] Biết extended resources/device plugin/GPU và kiểm tra DRA feature/version khi cần.

## 5. Networking

- [ ] Vẽ Pod network model, CNI và packet path cross-node.
- [ ] Trace Service → EndpointSlice → Pod; debug selector/port/readiness.
- [ ] Chọn ClusterIP/headless/NodePort/LoadBalancer/ExternalName.
- [ ] Debug CoreDNS, FQDN/search/ndots và cross-namespace discovery.
- [ ] Giải thích kube-proxy/iptables/IPVS/eBPF ở mức data-plane, không đồng nhất implementation.
- [ ] Phân biệt Ingress resource/controller/LB; biết Ingress frozen.
- [ ] Hiểu GatewayClass/Gateway/Route/ReferenceGrant và ownership roles.
- [ ] Thiết kế TLS termination/re-encryption/pass-through và certificate rotation.
- [ ] Viết/test default-deny + DNS + least-access NetworkPolicy; xác minh CNI enforce.
- [ ] Hiểu IPv4/IPv6 dual stack, MTU, source IP, session affinity/topology routing khi dự án cần.

## 6. Storage/data

- [ ] Chọn emptyDir/projected/generic ephemeral/PVC; tránh hostPath production.
- [ ] Giải thích PV/PVC/StorageClass/CSI provision/attach/mount lifecycle.
- [ ] Phân biệt RWO/ROX/RWX/RWOP và filesystem permission.
- [ ] Hiểu Immediate/WaitForFirstConsumer, zone topology và attach limits.
- [ ] Chọn reclaim/expansion/volumeMode/mount options có kiểm chứng driver.
- [ ] Debug PVC Pending, FailedAttach/Mount, permission, multi-attach và full disk.
- [ ] Thiết kế StatefulSet/operator/managed database theo operational maturity.
- [ ] Hiểu VolumeSnapshot CRDs/CSI và crash vs application consistency.
- [ ] Có backup/restore test, retention/immutability/encryption, RPO/RTO.

## 7. Config, Secret và lifecycle health

- [ ] Chọn ConfigMap/Secret/Downward API/projected token.
- [ ] Hiểu env snapshot, volume eventual update và `subPath` semantics.
- [ ] Tạo rollout/hot reload config backward-compatible.
- [ ] Bảo vệ Secret: encryption at rest, RBAC, external store, rotation/redaction.
- [ ] Thiết kế startup/readiness/liveness đúng và đo thresholds.
- [ ] Không đưa external dependency vào liveness một cách mù quáng.
- [ ] Hiểu lifecycle hooks, signal và distroless debug trade-off.

## 8. Autoscaling/resilience

- [ ] Tính HPA formula, hiểu tolerance/missing metrics/stabilization/behavior.
- [ ] Phân biệt Metrics Server, custom/external metrics và monitoring TSDB.
- [ ] Chọn CPU/concurrency/RPS/queue metric phù hợp; requests đúng.
- [ ] Tránh HPA/VPA/GitOps field conflict và feedback loop.
- [ ] Hiểu node autoscaling/provision delay/scale-down disruption/provider limits.
- [ ] Tính cold-start → ready latency và headroom cho burst.
- [ ] Load test scale-up/down, downstream capacity và maxReplica guardrail.
- [ ] Kết hợp replicas, topology, PDB, rolling strategy, graceful shutdown.

## 9. Security

- [ ] Threat model source/image/API/workload/node/network/data/operations.
- [ ] Phân biệt authentication, authorization, admission và audit.
- [ ] Thiết kế Role/ClusterRole/RoleBinding/ClusterRoleBinding least privilege.
- [ ] Audit escalation paths: pod create/exec, secret, bind/escalate/impersonate, node proxy.
- [ ] Dùng ServiceAccount riêng/projected token; tắt automount nếu không cần.
- [ ] Enforce non-root, no privilege escalation, drop capabilities, seccomp, read-only root FS.
- [ ] Hiểu PSA privileged/baseline/restricted, warn/audit/enforce và version pin.
- [ ] NetworkPolicy default deny và multi-tenant isolation strategy.
- [ ] Image minimal/digest/sign/SBOM/scan/provenance/registry controls.
- [ ] Admission policy/webhook HA, timeout, scope, failure policy và break-glass.
- [ ] Node/control-plane hardening, encryption/KMS, certificate/key rotation.
- [ ] Audit/detect/respond cho Secret read, exec, RBAC change và anomalous API use.

## 10. Packaging/delivery

- [ ] Render/diff/apply Kustomize base/overlay, generator hash và patches.
- [ ] Author/lint/template/test/upgrade/rollback Helm chart.
- [ ] Dùng values schema/quote/toYaml an toàn; quản lý dependencies/CRDs/hooks.
- [ ] Chọn raw/Kustomize/Helm/operator theo trade-off.
- [ ] Pipeline render, schema, API compatibility, policy, security và smoke test.
- [ ] Promote immutable digest; không rebuild artifact khác nhau mỗi environment.
- [ ] Thực hành bốn nguyên tắc GitOps, drift reconciliation và audited break-glass.
- [ ] Quản lý Secret trong GitOps mà không commit plaintext.
- [ ] Thiết kế schema migration expand/contract và forward recovery.

## 11. Observability/debugging

- [ ] Thiết kế SLI/SLO/error budget và multi-window burn-rate alerts.
- [ ] Thu app/component/object/resource metrics; kiểm soát cardinality/retention.
- [ ] Structured logs, PII/Secret redaction, rotation, aggregation và drop monitoring.
- [ ] Distributed trace propagation/sampling và metrics-log-trace correlation.
- [ ] Phân biệt Events, audit logs và application logs.
- [ ] Debug theo context → status → Events → logs → metrics → network/storage/node.
- [ ] Dùng `logs --previous`, JSONPath, EndpointSlice, ephemeral containers an toàn.
- [ ] Có dashboard app/workload/node/control plane và deployment markers.
- [ ] Có incident roles/runbook/timeline/postmortem/action verification.

## 12. Cluster operations

- [ ] Lập RACI provider/platform/app/data/security khi managed/self-managed.
- [ ] Hiểu stacked/external etcd, quorum, leader election, API LB và multi-zone.
- [ ] Cordon/drain/uncordon với PDB/DaemonSet/local data/capacity đúng.
- [ ] Quản lý OS/kernel/cgroup/runtime/kubelet/CNI/CSI/DNS/add-on lifecycle.
- [ ] Theo dõi certificate, signing/encryption keys và rotation overlap.
- [ ] Inventory version skew/deprecated APIs/feature gates trước upgrade.
- [ ] Rehearse upgrade staging/canary/node pool và rollback/point-of-no-return.
- [ ] Backup etcd + PKI/config; hiểu nó không chứa app volume data.
- [ ] Recreate cluster từ Git/IaC và restore app data trong RPO/RTO.
- [ ] Monitor etcd/API/webhook latency, disk/inode/PID/subnet IP/cloud quota.

## 13. Miền nâng cao tùy dự án

Không phải ai cũng cần triển khai, nhưng phải biết nhận diện khi nào cần specialist:

- [ ] Operator/controller: work queue, cache/watch, leader election, idempotency, status/conditions/finalizers.
- [ ] CRD structural schema, default/validation/conversion, storage version, backup/upgrade.
- [ ] Multi-cluster/fleet: identity, config placement, traffic/data failover, version policy.
- [ ] Service mesh: mTLS, traffic policy, sidecar/ambient overhead, debug ownership.
- [ ] Policy engines/supply-chain signing và exception lifecycle.
- [ ] Windows nodes/container constraints và mixed-OS scheduling/network/storage.
- [ ] GPU/device/DRA, NUMA/hugepages/CPU manager và latency-sensitive workloads.
- [ ] Batch/HPC: JobSet/queueing ecosystem, gang scheduling/checkpointing khi cần.
- [ ] Edge/air-gapped: image/chart mirror, time/cert, disconnected upgrade, limited resources.
- [ ] Cluster API/IaC: machine lifecycle, bootstrap, provider upgrades và drift.
- [ ] Cost/FinOps: requests utilization, idle headroom, LB/storage/log/egress, chargeback/showback.
- [ ] API scalability: watch/list/cardinality/churn, API Priority and Fairness, large-cluster limits.

## Final proof

- [ ] Hoàn thành capstone ≥ 80/100 và không có critical fail.
- [ ] Debug 6 failure drills không nhìn đáp án, median ≤ 15 phút.
- [ ] Thực hiện node drain và rollout bad-image không vi phạm local acceptance test.
- [ ] Restore dữ liệu test và đo RPO/RTO.
- [ ] Tự thuyết trình 45 phút từ request flow tới DR, trả lời “vì sao” ở mỗi design choice.
- [ ] Đọc release notes của target version và lập một upgrade compatibility report.

Nguồn kiểm tra định kỳ: [Kubernetes Concepts](https://kubernetes.io/docs/concepts/), [Reference](https://kubernetes.io/docs/reference/), [Release notes](https://kubernetes.io/releases/), [Feature gates](https://kubernetes.io/docs/reference/command-line-tools-reference/feature-gates/), [Version skew](https://kubernetes.io/releases/version-skew-policy/) và support matrix của distribution/CNI/CSI/controllers thực tế.
