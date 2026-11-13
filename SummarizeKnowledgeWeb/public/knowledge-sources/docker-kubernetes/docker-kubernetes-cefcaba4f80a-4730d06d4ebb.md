# Coverage ledger: Docker & Kubernetes

Checklist này là “hợp đồng phạm vi” để tránh học sót. Không đánh dấu chỉ vì đã đọc: mỗi ô cần một bằng chứng theo mã dưới đây.

- `E` — Explain: tự giải thích/vẽ lại cơ chế và trade-off.
- `B` — Build: tạo cấu hình từ file trống và chạy được.
- `F` — Failure: tái tạo, quan sát, chẩn đoán và khôi phục lỗi.
- `O` — Operate: nêu SLO/security/capacity/backup/upgrade/runbook.

Ví dụ ghi chú: `✅ E/B/F — commit abc123, runbook docs/dns-failure.md`. Mức “production-ready” cần E+B+F+O ở các mục cốt lõi.

## 1. Nền tảng bắt buộc

- [ ] Process, thread, PID tree, exit code; foreground/background (`E/B`).
- [ ] Unix signal, `SIGTERM`/`SIGKILL`, graceful shutdown, PID 1 và zombie reaping (`E/B/F`).
- [ ] User/group/UID/GID, mode bit, ownership, umask và permission qua volume (`E/B/F`).
- [ ] Filesystem, inode, mount, bind mount, copy-on-write, page cache và disk-full behavior (`E/B/F`).
- [ ] Linux namespaces: mount, PID, network, IPC, UTS, user, cgroup (`E/B`).
- [ ] cgroup v2: CPU, memory, PID, I/O; OOM và khác biệt request/limit (`E/B/F`).
- [ ] Capabilities, seccomp, AppArmor/SELinux và lý do “root trong container” vẫn rủi ro (`E/F`).
- [ ] TCP/IP căn bản, socket/bind address, port, route, NAT, DNS, TLS và timeout (`E/B/F`).
- [ ] VM so với container: kernel sharing, isolation, density, startup, threat boundary (`E`).
- [ ] Declarative/imperative, desired/observed state, idempotency và eventual consistency (`E/B`).
- [ ] YAML/JSON, schema, Git diff, semantic versioning và compatibility matrix (`B/O`).

## 2. Chuẩn OCI và container runtime

- [ ] OCI Image/Runtime/Distribution spec giải quyết vấn đề gì (`E`).
- [ ] Image manifest/index, config, content-addressed layer, digest và multi-platform index (`E/B`).
- [ ] Runtime bundle, root filesystem, runtime spec và lifecycle cơ bản (`E`).
- [ ] Vai trò Docker CLI/daemon, containerd, shim, OCI runtime như `runc`; không đồng nhất chúng (`E`).
- [ ] CRI khác OCI thế nào; vì sao Kubernetes không cần Docker Engine trên node (`E`).
- [ ] Namespace/cgroup được runtime cấu hình nhưng isolation thực thi bởi kernel (`E`).
- [ ] Tag mutable so với digest immutable; provenance/trust không tự có chỉ vì dùng digest (`E/O`).

## 3. Docker Engine và lifecycle

- [ ] Client–API–daemon architecture, context/socket và quyền tương đương root của Docker socket (`E/F`).
- [ ] `create`, `start`, `run`, `stop`, `kill`, `rm`, `pause`, `wait`; state và signal của từng lệnh (`E/B`).
- [ ] `ps`, `inspect`, `top`, `stats`, `events`, `logs`, `exec`, `cp`, `diff`; chọn đúng evidence (`B/F`).
- [ ] `ENTRYPOINT` vs `CMD`, exec vs shell form, argument override và signal propagation (`E/B/F`).
- [ ] Restart policy, health status, exit code, OOMKilled; phân biệt restart với remediation (`E/F/O`).
- [ ] Logging driver, rotation/backpressure và nguy cơ đầy disk (`E/B/F/O`).
- [ ] Resource constraints CPU/memory/PID và quan sát cgroup/runtime (`B/F`).
- [ ] Docker contexts và remote daemon/TLS; không expose unauthenticated daemon API (`E/O`).
- [ ] Rootless mode, user namespace remap và các giới hạn/khác biệt vận hành (`E/B`).
- [ ] Prune/cleanup theo scope; hiểu object reference trước khi xóa (`E/B/O`).

## 4. Docker image và BuildKit

- [ ] Build context, `.dockerignore`, Dockerfile frontend/syntax directive (`E/B`).
- [ ] Layer/cache key, invalidation, ordering `COPY`, cache hit/miss và đo build time (`E/B/F`).
- [ ] Multi-stage build, named target, debug/test/runtime stage (`B/O`).
- [ ] Base image lựa chọn theo compatibility, CVE surface, libc, certificates/debuggability (`E/O`).
- [ ] Pin version/digest, automated refresh và tái build khi base thay đổi (`B/O`).
- [ ] `RUN`, `COPY`, `ADD`, `WORKDIR`, `USER`, `ENV`, `ARG`, `EXPOSE`, `VOLUME`, `STOPSIGNAL`, `HEALTHCHECK` (`E/B`).
- [ ] `ARG`/`ENV` không phải secret; secret/SSH/cache bind mount của BuildKit (`E/B/F`).
- [ ] Package-manager hygiene, deterministic dependency lock, timestamps/metadata và reproducibility (`B/O`).
- [ ] Non-root UID ổn định, ownership bằng `COPY --chown`, read-only root filesystem (`B/F`).
- [ ] Multi-platform build, QEMU/emulation vs native builder và OCI index (`E/B`).
- [ ] Buildx builder/cache exporter/importer; registry cache trong ephemeral CI (`E/B/O`).
- [ ] SBOM, provenance/attestation, signing/verification và policy gate (`E/B/O`).
- [ ] Vulnerability scan: OS/app dependency, false positive, exploitability, SLA và rebuild (`E/O`).
- [ ] Image history/layer forensics; chứng minh secret không tồn tại trong layer/cache (`B/F`).
- [ ] Registry push/pull/auth, credential helper, retention, garbage collection, rate/size concern (`E/B/O`).

## 5. Docker networking

- [ ] Network namespace, veth, bridge, route, NAT/published port packet path (`E/B/F`).
- [ ] Bridge mặc định và user-defined bridge; embedded DNS/service-name discovery (`E/B/F`).
- [ ] `host`, `none`, overlay; macvlan/ipvlan use case và trade-off (`E/B`).
- [ ] Bind `127.0.0.1` vs `0.0.0.0` trong process/container và exposure của published port (`E/B/F`).
- [ ] `EXPOSE` chỉ là metadata; `-p`/`ports` mới publish (`E/B`).
- [ ] Container IP là ephemeral; dùng DNS/name thay hard-code IP (`E/F`).
- [ ] DNS configuration/search/options và debug resolution/connectivity/TLS riêng từng lớp (`B/F`).
- [ ] Internal network, network segmentation, egress/proxy và host firewall interaction (`B/O`).
- [ ] Overlay/multi-host và MTU/encapsulation failure mode (`E/F`).
- [ ] IPv6/dual-stack awareness (`E`).

## 6. Docker storage

- [ ] Writable layer và copy-on-write; tại sao không lưu durable data ở đó (`E/F`).
- [ ] Named/anonymous volume, bind mount, tmpfs: ownership, portability, performance, lifecycle (`E/B`).
- [ ] Volume population/copy-up semantics và file shadowing khi mount (`E/B/F`).
- [ ] UID/GID/SELinux labeling và host-path permission troubleshooting (`B/F`).
- [ ] Backup/restore test vào volume mới; consistency khi application đang ghi (`B/F/O`).
- [ ] Volume driver/remote storage, latency/locking/failure behavior (`E/O`).
- [ ] Disk usage qua image/container/volume/build cache/log; cleanup an toàn (`B/F/O`).

## 7. Docker Compose và local platform

- [ ] Compose model: service, network, volume, config, secret; project naming/isolation (`E/B`).
- [ ] `up/down/start/stop/restart/exec/run/logs/ps/config`; recreate behavior (`B/F`).
- [ ] Service discovery bằng tên; host port khác container port (`E/B/F`).
- [ ] Healthcheck và `depends_on` startup ordering; readiness của app vẫn cần retry (`E/B/F`).
- [ ] Variable interpolation, `.env`, `env_file`, precedence và rò rỉ secret (`E/B/F`).
- [ ] Profiles, multiple Compose files, merge/override semantics và `docker compose config` (`B/F`).
- [ ] Dev bind mount/watch so với immutable production image (`E/B`).
- [ ] `init`, read-only filesystem, capability drop, resource và restart controls (`B/O`).
- [ ] One-off job/migration và dependency/idempotency (`E/B/F`).
- [ ] Khi Compose trên một host là đủ; giới hạn HA, scheduler, policy, multi-node (`E/O`).
- [ ] Docker Swarm/stack/overlay ở mức so sánh và migration; chỉ học sâu nếu dự án dùng (`E`).

## 8. Docker host, security và operations

- [ ] Threat model: source → build → registry → daemon → runtime → host/kernel → data (`E/O`).
- [ ] Daemon socket, privileged, host PID/network, device, broad capabilities, host bind mount (`E/F/O`).
- [ ] Default seccomp/capabilities và principle of least privilege (`E/B`).
- [ ] Docker Desktop/Engine licensing, host OS/update và organization policy awareness (`O`).
- [ ] Daemon config, storage/logging driver, live restore, metrics/events và upgrade plan (`E/O`).
- [ ] Content trust/signature ecosystem và policy enforcement point (`E/O`).
- [ ] Secret injection/rotation, credential helper và build isolation (`B/O`).
- [ ] Incident flow: contain without destroying evidence, inspect/export, recover, postmortem (`F/O`).

## 9. Kubernetes API và architecture

- [ ] Control plane: API server, etcd, scheduler, controller manager, cloud controller manager (`E`).
- [ ] Node: kubelet, CRI runtime, kube-proxy/network data plane, CNI/CSI plugins (`E/F`).
- [ ] API request path: authn → authz → admission → validation/defaulting → persistence (`E/F`).
- [ ] GVK/GVR, discovery, namespaced vs cluster-scoped resource, subresource/status/scale (`E/B`).
- [ ] `spec`, `status`, metadata, `generation`, `resourceVersion`, UID (`E/B/F`).
- [ ] Labels/selectors/annotations; immutable selector implications (`E/B/F`).
- [ ] OwnerReference, garbage collection, finalizer và object kẹt `Terminating` (`E/B/F`).
- [ ] List/watch, reconciliation loop, optimistic concurrency, eventual convergence (`E`).
- [ ] Client-side/server-side apply, field manager, managedFields và conflict (`E/B/F`).
- [ ] API defaulting/schema/OpenAPI, dry-run, diff và validation (`B/F`).
- [ ] etcd quorum/latency/backup/encryption và vì sao không chỉnh trực tiếp (`E/O`).
- [ ] Leases/leader election và HA control-plane behavior (`E`).

## 10. Kubernetes workload và Pod lifecycle

- [ ] Pod scheduling unit, shared network/volumes, container restart và Pod replacement (`E/B/F`).
- [ ] Init container, sidecar semantics theo version, ephemeral debug container (`E/B/F`).
- [ ] Container command/args/env, workingDir, ports và lifecycle hooks (`B/F`).
- [ ] Pod phase, condition, container state/lastState/restartCount và event (`E/B/F`).
- [ ] Startup/readiness/liveness probe: HTTP/TCP/gRPC/exec, timing và failure misuse (`E/B/F/O`).
- [ ] Graceful termination: endpoint removal, preStop, SIGTERM, grace period, SIGKILL (`E/B/F`).
- [ ] ReplicaSet/Deployment rollout, revision, surge/unavailable, pause/rollback (`E/B/F/O`).
- [ ] StatefulSet identity/order/PVC/headless Service/update strategy (`E/B/F/O`).
- [ ] DaemonSet node-wide use case, update và toleration implications (`E/B`).
- [ ] Job completion/retry/parallelism/backoff/TTL; idempotency và duplicate execution (`E/B/F`).
- [ ] CronJob schedule/timezone/concurrency/deadline/history; missed/duplicate job (`E/B/F/O`).
- [ ] Static Pod/mirror Pod và control-plane bootstrap awareness (`E`).

## 11. Scheduling, resources và capacity

- [ ] Requests/limits → scheduling/cgroup/HPA; CPU throttling vs memory OOM (`E/B/F`).
- [ ] Pod QoS Guaranteed/Burstable/BestEffort và node-pressure eviction (`E/B/F`).
- [ ] Ephemeral-storage request/limit, image/log/disk pressure (`E/B/F`).
- [ ] Node selector/affinity/anti-affinity, required/preferred (`E/B/F`).
- [ ] Taint/toleration không phải authorization; dedicated node pattern (`E/B/F`).
- [ ] Topology spread, zone/hostname failure domain và unschedulable behavior (`E/B/F/O`).
- [ ] PriorityClass/preemption và starvation/capacity risk (`E/F/O`).
- [ ] ResourceQuota/LimitRange và namespace fairness/defaulting (`E/B/F`).
- [ ] Device plugin/GPU/hugepages/NUMA awareness; học sâu khi workload cần (`E`).
- [ ] Scheduler profile/extender/framework awareness; không custom nếu chưa có use case (`E`).
- [ ] Capacity math gồm DaemonSet, system reserve, surge, PDB, failure zone và headroom (`B/O`).

## 12. Kubernetes networking và traffic

- [ ] Pod network model, IP-per-Pod, CNI responsibilities và node-to-node path (`E/F`).
- [ ] Service ClusterIP/NodePort/LoadBalancer/ExternalName/headless use case (`E/B/F`).
- [ ] Service selector → EndpointSlice → ready endpoint và named targetPort (`E/B/F`).
- [ ] kube-proxy/data-plane implementation awareness; không phụ thuộc một mode khi debug (`E/F`).
- [ ] Cluster DNS service/search domain/`ndots`, caching và DNS failure (`E/B/F/O`).
- [ ] `externalTrafficPolicy`/`internalTrafficPolicy`, source IP và availability trade-off (`E/B`).
- [ ] Session affinity/topology-aware routing và giới hạn (`E`).
- [ ] NetworkPolicy additive semantics, ingress/egress isolation, namespace+pod selector (`E/B/F`).
- [ ] CNI phải hỗ trợ policy; L3/L4 policy không thay application auth/TLS (`E/F/O`).
- [ ] Default deny + DNS + minimum flows; test cả positive và negative (`B/F/O`).
- [ ] Ingress resource/controller/class, TLS termination và path/host routing (`E/B/F`).
- [ ] Gateway API roles/resources và khi phù hợp hơn Ingress (`E/B`).
- [ ] External DNS/load balancer/certificate lifecycle và cloud integration (`E/O`).
- [ ] IPv4/IPv6 dual-stack, MTU/encapsulation, SNAT/conntrack và intermittent failure awareness (`E/F`).
- [ ] Service mesh/eBPF data plane: giá trị, latency/complexity/failure surface; elective (`E/O`).

## 13. Kubernetes storage và stateful data

- [ ] Pod volumes: emptyDir, projected/config/secret, CSI, hostPath risk (`E/B/F`).
- [ ] PV/PVC binding, StorageClass, dynamic provisioning và default class (`E/B/F`).
- [ ] Access mode không đồng nghĩa filesystem enforcement; RWO/RWX/ROX/RWOP (`E/F`).
- [ ] Reclaim policy Retain/Delete, finalizer và dữ liệu sau namespace/PVC delete (`E/B/F/O`).
- [ ] Volume binding mode/topology/zone và Pod Pending (`E/B/F`).
- [ ] Expansion, snapshot/clone và CSI capability/version dependency (`E/B/O`).
- [ ] Filesystem vs block mode và application semantics (`E`).
- [ ] StatefulSet PVC retention/scale/delete; orphan data và cost (`E/F/O`).
- [ ] Backup application-consistent, quiesce/log/WAL, encryption/retention và restore drill (`B/F/O`).
- [ ] Database HA/replication/quorum không được Kubernetes tự cung cấp (`E/O`).
- [ ] Local persistent volume/hostPath và node failure coupling (`E/O`).

## 14. Configuration và secrets

- [ ] ConfigMap/Secret qua env vs volume: update propagation/restart semantics (`E/B/F`).
- [ ] `envFrom`, key mapping, optional reference, invalid key/error behavior (`B/F`).
- [ ] Secret base64 không phải encryption; encryption at rest/KMS và etcd access (`E/O`).
- [ ] RBAC least privilege cho secrets; namespace boundary không đủ cho hostile multi-tenancy (`E/O`).
- [ ] External secret manager/CSI/operator trade-off, availability và audit (`E/B/O`).
- [ ] Rotation không downtime: dual credential/version, reload/restart và rollback (`E/B/F/O`).
- [ ] Immutable config, checksum rollout hoặc reloader pattern và GitOps diff (`E/B`).
- [ ] Không log/describe/paste secret vào ticket, CI output hoặc command history (`O`).

## 15. Kubernetes identity, policy và runtime security

- [ ] User/group/ServiceAccount; projected bound token, audience/expiry và token automount (`E/B/O`).
- [ ] RBAC Role/ClusterRole/Binding, verbs/resources/subresources/resourceNames (`E/B/F`).
- [ ] `kubectl auth can-i`, impersonation cho test và audit (`B/F`).
- [ ] Privilege escalation qua bind/escalate/impersonate/create Pod/secrets; RBAC graph review (`E/F/O`).
- [ ] Authentication/OIDC/certificate lifecycle và offboarding (`E/O`).
- [ ] Admission chain, built-in policy, validating/mutating webhook failurePolicy/timeout (`E/F/O`).
- [ ] Pod Security Standards Baseline/Restricted và namespace enforcement (`E/B/F`).
- [ ] securityContext: non-root, UID/GID/fsGroup, capability, seccomp, read-only root, privilege (`E/B/F`).
- [ ] hostNetwork/hostPID/hostIPC/hostPath/device/privileged risk (`E/F/O`).
- [ ] Image pull policy/credential, allowed registry/digest/signature/provenance policy (`E/B/O`).
- [ ] RuntimeClass/sandboxed runtime and workload trust-level use case (`E`).
- [ ] Node/kubelet API/metadata service/cloud credential attack surface (`E/O`).
- [ ] Multi-tenancy: soft vs hard, namespace, node, network, quota, policy và separate cluster (`E/O`).
- [ ] Audit policy/log retention/detection và incident evidence (`E/B/O`).
- [ ] Security patch/rebuild/redeploy loop và exception expiry (`O`).

## 16. Availability, autoscaling và disruption

- [ ] HorizontalPodAutoscaler algorithm, metrics delay, request dependency, behavior/stabilization (`E/B/F/O`).
- [ ] Metrics Server vs full monitoring; custom/external metric quality (`E`).
- [ ] Vertical autoscaling và restart/in-place semantics theo implementation/version (`E/O`).
- [ ] Node autoscaler/provisioner interaction với requests, taint, zone, PDB và storage (`E/F/O`).
- [ ] PDB chỉ giới hạn voluntary disruption, không tạo replica/capacity và không chặn mọi outage (`E/B/F`).
- [ ] Deployment rollout + readiness + PDB + capacity + topology như một hệ thống (`E/B/F/O`).
- [ ] Load test, saturation, queue/backpressure, timeout/retry/circuit breaker/idempotency (`B/F/O`).
- [ ] Multi-zone/region trade-off, quorum/data consistency và blast radius (`E/O`).

## 17. Observability và troubleshooting

- [ ] Phân biệt metric/log/trace/event/profile/audit; correlation ID và time sync (`E/B`).
- [ ] Golden signals/RED/USE và telemetry gắn với SLI/SLO (`E/B/O`).
- [ ] Metrics pipeline, scrape/service discovery, cardinality, retention và alert evaluation (`E/O`).
- [ ] Structured logs stdout/stderr, rotation, collection, PII/secret redaction (`E/B/O`).
- [ ] Distributed tracing context propagation/sampling và latency breakdown (`E/B`).
- [ ] API server/scheduler/controller/kubelet/runtime/CNI/CoreDNS/storage observability (`E/F/O`).
- [ ] Debug order: context → object status/condition → event → log current/previous → endpoint/DNS/network → node/runtime (`B/F`).
- [ ] `kubectl get/describe/logs/exec/debug/top/events`, JSONPath/custom columns và audit evidence (`B/F`).
- [ ] `Pending`, `CrashLoopBackOff`, `ImagePullBackOff`, `OOMKilled`, `Evicted`, `Terminating` playbook (`F/O`).
- [ ] Service có IP nhưng không traffic: selector, EndpointSlice, readiness, port, policy, DNS path (`F/O`).
- [ ] Node NotReady/disk-pressure/memory-pressure/network-unavailable diagnosis (`F/O`).
- [ ] Alert actionable, symptom-first, dedup/routing/silence và runbook link (`E/O`).
- [ ] Incident command, timeline, mitigation/rollback, evidence, blameless postmortem/action owner (`F/O`).

## 18. Packaging, delivery và API extension

- [ ] Raw YAML boundaries; naming/labels/ownership convention (`B/O`).
- [ ] Kustomize base/overlay, patch/image/replacement, render/diff (`E/B/F`).
- [ ] Helm chart/value/template/dependency/hook/release/rollback và secret caveat (`E/B/F/O`).
- [ ] CI build/test/scan/sign/push; CD promotion bằng immutable digest (`B/O`).
- [ ] GitOps reconciliation, drift, health, sync wave/dependency và emergency procedure (`E/B/F/O`).
- [ ] Rolling, recreate, blue-green, canary/progressive delivery và metric gate (`E/B/O`).
- [ ] CRD schema/version/conversion/status/finalizer và API compatibility (`E/B/F/O`).
- [ ] Operator/controller idempotency, level-based reconciliation, retry/backoff/leader election (`E/B/F`).
- [ ] Admission webhook availability/certificate/timeout/bootstrapping risk (`E/F/O`).
- [ ] Policy-as-code test/audit/enforce rollout và exception governance (`E/B/O`).
- [ ] Manifest render → schema/policy/security test → server dry-run/diff → deploy → verify → rollback (`B/O`).

## 19. Cluster lifecycle và production operations

- [ ] Managed vs self-managed cluster total cost/control/shared-responsibility decision (`E/O`).
- [ ] HA control plane/etcd quorum, failure domain, API endpoint/load balancer (`E/O`).
- [ ] Cluster bootstrap PKI/certificate/service-account key awareness (`E/O`).
- [ ] Supported minor, version skew, deprecation/API removal và add-on compatibility (`E/B/O`).
- [ ] Upgrade order/control plane/node, drain, surge, PDB, rollback limitation và test environment (`E/B/F/O`).
- [ ] `cordon`, `drain`, node replacement/repair và local data/DaemonSet considerations (`B/F/O`).
- [ ] etcd snapshot **và restore rehearsal**, encryption keys/certs, RPO/RTO (`B/F/O`).
- [ ] CNI/CSI/CoreDNS/ingress/gateway/controller lifecycle độc lập với core Kubernetes (`E/O`).
- [ ] Cluster autoscaling/node pools, architecture/OS/accelerator, image/runtime configuration (`E/O`).
- [ ] Namespace/tenant onboarding/offboarding, quota, RBAC, network, policy, cost attribution (`B/O`).
- [ ] Fleet/multi-cluster config, identity, traffic/failover và blast radius (`E/O`).
- [ ] Windows nodes/container images, mixed OS scheduling; elective nếu dự án cần (`E/B`).
- [ ] Edge/disconnected/air-gapped registry, upgrade và observability; elective (`E/O`).

## 20. Thiết kế dự án thực tế

- [ ] Viết SLO/SLI và error budget trước khi chọn replica/autoscaling (`B/O`).
- [ ] Xác định dependency, timeout budget, retry/idempotency, graceful degradation (`B/F/O`).
- [ ] Capacity model và load test: normal/peak/failure/rollout headroom (`B/O`).
- [ ] Threat model, data classification, trust boundary, least privilege và audit (`B/O`).
- [ ] RTO/RPO, backup/restore, region/zone failure và game day (`B/F/O`).
- [ ] Artifact lifecycle: source/lock → CI → SBOM/provenance/sign → registry → admission → runtime (`B/O`).
- [ ] Environment promotion/config/secret/schema compatibility và rollback (`B/F/O`).
- [ ] Observability/dashboard/alert/runbook/on-call ownership trước go-live (`B/O`).
- [ ] Cost model CPU/RAM/storage/egress/control plane/operations; rightsizing/retention (`B/O`).
- [ ] Build-vs-buy: Compose/Kubernetes/managed service/serverless dựa trên requirement, không theo trào lưu (`E/O`).
- [ ] Architecture Decision Record cho ít nhất 5 quyết định lớn (`B/O`).
- [ ] Go-live/readiness review và rollback authority rõ ràng (`O`).

## Elective chuyên sâu

Chọn theo dự án; không cần học tất cả trước capstone nhưng phải biết chúng tồn tại và rủi ro tích hợp:

- [ ] Kernel/eBPF networking/observability/runtime security.
- [ ] Service mesh, mTLS identity, traffic policy và multi-cluster mesh.
- [ ] GPU/ML scheduling, device plugin, model/data lifecycle.
- [ ] Advanced CSI/database operator và distributed storage.
- [ ] Custom scheduler, batch/gang scheduling, high-performance/NUMA workload.
- [ ] Confidential containers/sandbox runtime/Wasm workload.
- [ ] Multi-cluster/fleet API, global traffic và disaster failover.
- [ ] Kubernetes source code, controller-runtime/operator development.
- [ ] Docker plugin/Swarm internals hoặc Windows containers khi tổ chức dùng.

## Ma trận tự chấm năng lực

| Mức | Evidence tối thiểu | Có thể đảm nhiệm |
|---|---|---|
| 0 — Nhận biết | Biết thuật ngữ nhưng cần làm theo tutorial | Quan sát/shadow, chưa tự vận hành |
| 1 — Thực hành | Gate A, ≥70% quiz cơ bản, sample chạy được | Containerize service dưới review |
| 2 — Độc lập | Gate B+C, ≥80% quiz, 10 failure drill | Deploy/debug workload dev/staging |
| 3 — Production | Gate D, capstone rubric ≥80%, restore + incident drill | On-call và thiết kế workload production |
| 4 — Platform | Review được cluster/add-on lifecycle, multi-tenancy, policy, DR/capacity | Thiết kế/vận hành platform, mentor team |

Không dùng số năm kinh nghiệm thay evidence. Để xin việc, lưu diagram, benchmark, failure notes, runbook và ADR đã khử thông tin nhạy cảm làm portfolio.

