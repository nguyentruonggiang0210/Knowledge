# Checklist ôn interview Docker & Kubernetes

Không đánh dấu chỉ vì đã đọc. Chỉ đánh dấu khi bạn có thể: **giải thích không nhìn tài liệu, chạy demo nhỏ, tạo một failure, chẩn đoán bằng evidence và nói trade-off**.

## 1. Docker fundamentals

- [ ] Giải thích process/container/VM, namespaces, cgroups, capabilities, PID 1 và signals.
- [ ] Phân biệt image/container/layer/registry/tag/digest/OCI manifest.
- [ ] Viết Dockerfile cache-friendly, multi-stage, deterministic dependencies, `.dockerignore`.
- [ ] Giải thích exec vs shell form, CMD vs ENTRYPOINT, COPY vs ADD, ARG vs ENV.
- [ ] Build multi-platform và kiểm tra manifest/architecture.
- [ ] Dùng BuildKit cache/secret/SSH mount mà không leak.
- [ ] Chọn volume/bind/tmpfs; backup/restore DB nhất quán.
- [ ] Debug DNS/refused/timeout/published port/listen address.
- [ ] Đọc inspect/log/events/stats/top/history và exit/OOM state.
- [ ] Thiết kế graceful shutdown, healthcheck và restart policy.
- [ ] Giới hạn CPU/memory/PID/log disk và giải thích throttle/OOM.
- [ ] Harden non-root, read-only, cap drop, seccomp/LSM, rootless trade-off.
- [ ] Giải thích Docker socket/privileged/host mount risk.
- [ ] SBOM/scan/sign/provenance/promotion/rotation incident flow.
- [ ] Compose health dependency, network, volume, config merge/profile và production limits.

## 2. Kubernetes architecture/API

- [ ] Vẽ API server/etcd/scheduler/controllers/kubelet/runtime/CNI/CSI/service dataplane.
- [ ] Giải thích declarative reconciliation, spec/status/conditions/generation/ownership/finalizer.
- [ ] Authentication → authorization → admission → persistence → controllers.
- [ ] Dùng API discovery, `kubectl explain`, server-side apply/managedFields.
- [ ] Biết namespace scope và cluster-scoped resources; CRD/operator lifecycle.

## 3. Workloads và delivery

- [ ] Chọn Pod/Deployment/StatefulSet/DaemonSet/Job/CronJob đúng use case.
- [ ] Giải thích init/sidecar/ephemeral containers và lifecycle.
- [ ] Thiết kế rolling update/Recreate, surge/unavailable, minReady/deadline, rollback.
- [ ] Startup/readiness/liveness không gây restart cascade.
- [ ] SIGTERM/preStop/grace/endpoints/LB draining cho request dài.
- [ ] Job idempotency, parallelism/retry/deadline/cleanup; CronJob concurrency/missed schedule.
- [ ] Helm vs Kustomize vs plain manifests; GitOps drift/ownership.
- [ ] CI build once, promote same digest, signature/policy/canary/rollback config.

## 4. Networking

- [ ] Pod network model, localhost/shared namespace, Pod IP lifecycle.
- [ ] Service/EndpointSlice/readiness và ClusterIP/headless/NodePort/LoadBalancer/ExternalName.
- [ ] port/targetPort/nodePort/named port và service DNS search/FQDN.
- [ ] Ingress vs Gateway vs LoadBalancer; controller/class/TLS/routing.
- [ ] NetworkPolicy additive allow, ingress/egress isolation, selector AND/OR, DNS allow.
- [ ] CNI vs service dataplane vs ingress responsibility.
- [ ] Debug outside→LB→gateway→Service→EndpointSlice→Pod và Pod→DNS/upstream.
- [ ] Hiểu conntrack/MTU/source IP/retry/timeout ở mức đủ incident.

## 5. Storage/data

- [ ] emptyDir/hostPath/projected/PVC use case và rủi ro.
- [ ] PV/PVC/StorageClass/CSI dynamic provisioning/attach/mount flow.
- [ ] RWO/ROX/RWX/RWOP, reclaim policy, expansion, finalizer.
- [ ] WaitForFirstConsumer/topology và volume node affinity conflict.
- [ ] StatefulSet không tự tạo replication/quorum/backup.
- [ ] Snapshot vs application-consistent backup/offsite copy.
- [ ] Thực hiện restore vào target mới, checksum/data validation, đo RPO/RTO.

## 6. Scheduling/resources/reliability

- [ ] Requests/limits, CPU throttle/memory OOM, QoS/eviction.
- [ ] ResourceQuota/LimitRange và noisy-neighbor controls.
- [ ] node selector/affinity, pod affinity/anti-affinity, topology spread.
- [ ] taint/toleration, priority/preemption và scheduling events.
- [ ] Cordon/drain/uncordon; PDB voluntary-only semantics/quorum/capacity.
- [ ] HPA formula/metrics APIs/custom-external/stabilization; VPA/node autoscaler interaction.
- [ ] Capacity model includes cold start, downstream max, headroom and correlated zone failure.
- [ ] SLO/error budget/golden signals, actionable burn-rate alerts.

## 7. Security/multi-tenancy

- [ ] ServiceAccount/workload identity, token automount, RBAC subresources and escalation paths.
- [ ] Secret base64 vs encryption at rest/KMS/external provider/rotation/audit.
- [ ] Pod securityContext và Pod Security Standards/admission exceptions.
- [ ] Default-deny network/egress, metadata/cloud identity controls.
- [ ] Namespace is soft boundary; quota/node/runtime/cluster separation for stronger tenants.
- [ ] Image policy/signature/provenance and registry/build threat model.
- [ ] Admission webhook failurePolicy/latency/HA/audit→enforce rollout.
- [ ] Incident response for leaked secret/container escape/compromised cluster-admin.

## 8. Operations/platform

- [ ] Metrics/logs/traces/events/audit khác mục đích và retention.
- [ ] Debug CrashLoop/ImagePull/Pending/OOM/DNS/Service/PVC/HPA/drain theo decision tree.
- [ ] Upgrade: deprecation/version skew/addons/CRD/webhook/CNI/CSI, canary/backup/rollback.
- [ ] Control-plane and application DR, restore order, clean-room/credentials/DNS.
- [ ] One vs many clusters, managed vs self-managed, build vs buy bằng SLO/TCO/team.
- [ ] Platform golden path/API/escape hatch/versioning/ownership.
- [ ] Cost: requests utilization/bin packing/spot/headroom/showback; không phá reliability.
- [ ] Incident roles/comms/hypothesis log/abort/handoff/postmortem.

## 9. Command drills

Bạn không cần nhớ mọi flag, nhưng phải thực hiện được các nhóm sau:

- [ ] Docker: build/history/inspect/run/exec/logs/stats/events/network/volume/compose config/up/down.
- [ ] Kubernetes inventory: get wide/yaml, describe, events sort/filter, api-resources/explain.
- [ ] Logs: current/previous/multi-container/timestamps; exec/debug ephemeral khi policy cho phép.
- [ ] Rollout: status/history/pause/resume/undo; diff/dry-run/server-side apply.
- [ ] Network: Service/EndpointSlice/DNS query/TCP test từ debug Pod; policy positive/negative.
- [ ] Auth: `kubectl auth can-i` với exact user/SA/resource/subresource/namespace.
- [ ] Resources: top/metrics, node allocatable/requested, HPA conditions, Pod lastState.
- [ ] Storage: PVC/PV/SC/CSI events, snapshot/backup/restore validation.
- [ ] Maintenance: PDB disruptionsAllowed, cordon/drain/uncordon trên lab.

## 10. Câu chuyện kinh nghiệm theo STAR+L

Chuẩn bị 6 câu chuyện thật; không tiết lộ dữ liệu công ty cũ:

- [ ] Incident khó nhất: scope, hypothesis, action, communication, measurable recovery, lesson.
- [ ] Một lần gây lỗi: ownership, rollback, systemic prevention.
- [ ] Security/reliability trade-off với stakeholder.
- [ ] Migration/upgrade có phased plan và abort.
- [ ] Giảm cost/build time/MTTR có số liệu trước-sau.
- [ ] Mentoring/standardization/decision mà bạn thay đổi sau feedback.

`STAR+L = Situation, Task, Action, Result, Learning`. Nhấn mạnh chính bạn làm gì và đội phối hợp ra sao; tránh nhận công của cả đội.

## 11. Lịch ôn 4 tuần

| Tuần | Trọng tâm | Output bắt buộc |
|---|---|---|
| 1 | Docker + Kubernetes architecture/workloads | Trả lời Junior; PA-01/PA-04 hoặc demo tương đương |
| 2 | Network/storage/security/resources | 6 failure drills, một backup+restore, RBAC/network negative tests |
| 3 | Delivery/observability/upgrade/DR | Same-digest pipeline sketch, SLO dashboard, timed restore plan |
| 4 | Mid/Senior mock | 2 mock interviews, 2 system designs, sửa ba lỗ hổng lớn nhất |

Mỗi ngày: 20 phút recall không tài liệu, 40 phút lab, 20 phút giải thích thành tiếng. Sau câu sai, retest sau 2–3 ngày thay vì đọc lại ngay nhiều lần.

## 12. Trước và trong interview

- [ ] Biết level/format/stack nhưng chuẩn bị mental model portable.
- [ ] Kiểm tra terminal/whiteboard/network; không dùng cluster production.
- [ ] Khi nghe đề: làm rõ scale/SLO/state/security/version trước.
- [ ] Nói assumptions và “tôi sẽ tra field này” thay vì bịa syntax.
- [ ] Với incident: scope → evidence → mitigation → root fix → prevention.
- [ ] Với design: requirements → simple baseline → failure/security/data → evolution.
- [ ] Kết thúc bằng trade-offs, unknowns, rollout/rollback và cách validate.

## Tài liệu chính thức để refresh

- Docker: [Dockerfile reference](https://docs.docker.com/reference/dockerfile/), [build cache](https://docs.docker.com/build/cache/), [storage](https://docs.docker.com/engine/storage), [network drivers](https://docs.docker.com/engine/network/drivers/), [resource constraints](https://docs.docker.com/engine/containers/resource_constraints/).
- Kubernetes: [components](https://kubernetes.io/docs/concepts/overview/components/), [probes](https://kubernetes.io/docs/concepts/workloads/pods/probes/), [Services](https://kubernetes.io/docs/concepts/services-networking/service/), [NetworkPolicy](https://kubernetes.io/docs/concepts/services-networking/network-policies/), [PV/PVC](https://kubernetes.io/docs/concepts/storage/persistent-volumes/), [resources](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/), [RBAC](https://kubernetes.io/docs/concepts/security/rbac-good-practices/), [HPA](https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/), [PDB](https://kubernetes.io/docs/tasks/run-application/configure-pdb/).
