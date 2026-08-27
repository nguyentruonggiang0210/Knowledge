# Model answers — câu hỏi theo level

Đây là **đáp án tối thiểu**, không phải script phải học thuộc. Một câu trả lời mạnh còn nêu assumptions, trade-off, evidence và ví dụ từng làm. Follow-up tốt có thể dùng syntax khác miễn cơ chế đúng.

## Junior — Docker

### J-D01

Container là process được cô lập bằng kernel features và thường chia sẻ kernel host; VM ảo hóa máy và có guest kernel. VM hợp khi cần OS/kernel khác, security boundary mạnh hơn hoặc workload legacy. Chia sẻ kernel giảm overhead nhưng kernel compatibility và container escape nằm trong threat model.

### J-D02

Image là artifact immutable theo layers; container là instance runtime có writable layer/process; registry phân phối manifests/layers. Restart giữ cùng container/writable layer; recreate tạo instance mới từ image/config nên drift trong writable layer mất.

### J-D03

`FROM` base, `WORKDIR` cwd, `COPY` đưa file, `RUN` tạo build layer, `ENV` runtime env mặc định, `USER` identity, `CMD/ENTRYPOINT` command/args. `EXPOSE` chỉ metadata, không publish; `-p` mới map port. ENTRYPOINT thường executable, CMD default args.

### J-D04

Docker cache instruction/layer theo inputs. Copy lockfile trước giúp source change không chạy lại dependency install; khi một layer miss, các layer phụ thuộc phía sau rebuild. Dùng `.dockerignore` để context ổn định.

### J-D05

Build stage chứa compiler/dev dependencies, final stage chỉ copy runtime artifact, giảm size và attack surface. Với Node có thể build assets/deps rồi copy production output; debug bằng separate debug target/ephemeral tool container, không cài shell/debuggers vào production image.

### J-D06

Writable layer sống theo container; named volume do Docker quản lý và bền qua recreate; bind mount nối trực tiếp host path, host-coupled. Bind source hợp live-edit dev; production nên ship code trong immutable image để reproducible/auditable.

### J-D07

Compose services cùng network gọi bằng service name/DNS và container port; `localhost` là chính container hiện tại. `-p 8080:80` map host 8080 tới container 80; bind host IP cụ thể để giới hạn exposure.

### J-D08

Xem `docker ps -a`, `docker inspect` state/exit/OOM/health/restart, `docker logs` và events/config/mount/resources. 137 là SIGKILL (`128+9`), thường OOM hoặc manual/system kill; chỉ `OOMKilled`, kernel/daemon evidence mới xác nhận nguyên nhân.

### J-D09

Stop gửi SIGTERM để app ngừng nhận việc, drain/flush rồi thoát. Exec-form giúp app nhận signal trực tiếp làm PID 1; shell form có thể giữ signal. Hết timeout Docker gửi SIGKILL, không cleanup.

### J-D10

Healthcheck mô tả app healthy/readiness theo test; restart policy phản ứng process exit/daemon restart. Standalone Engine không mặc định restart chỉ vì status unhealthy; orchestrator có thể dùng health theo logic riêng.

### J-D11

Startup ordering không đồng nghĩa readiness. Dùng DB healthcheck + `condition: service_healthy`, nhưng app vẫn retry/backoff/jitter vì DB có thể fail/restart sau lúc startup và distributed systems không có dependency “ready mãi”.

### J-D12

Root trong container có capabilities/impact lớn hơn nếu app bị compromise. Tạo UID/GID riêng, chown artifact cần thiết và `USER 10001`; thêm read-only FS/drop caps. Non-root chỉ là một lớp, không thay patching, seccomp, secrets, network và limits.

### J-D13

Secret trong Dockerfile/Git/layer/history tồn tại lâu và bị nhiều người/cache đọc. Build dùng BuildKit secret/SSH mount; runtime dùng secret store/file injection/short-lived identity. Nếu đã lộ phải revoke/rotate, audit và rebuild/purge artifact/cache; chỉ xóa dòng không đủ.

### J-D14

Không limit, một container có thể làm host cạn tài nguyên. CPU quota thường throttle; memory limit có thể dẫn OOM kill. Xem `docker stats`, inspect state/OOM, cgroup/host metrics/kernel logs; right-size bằng load/soak test.

## Junior — Kubernetes

### J-K01

Kubernetes quản multi-node scheduling, desired-state reconciliation, self-healing, rollout, service discovery, policy và autoscaling ecosystem. Compose vẫn hợp local dev/single host/small workload khi HA/orchestration complexity không đáng chi phí.

### J-K02

API server là cổng; etcd lưu state; scheduler chọn node; controllers reconcile; kubelet thực thi Pod trên node. Apply thành công chỉ nghĩa object được chấp nhận/persist, phải xem rollout/status/conditions/Ready.

### J-K03

Pod là đơn vị scheduling/lifecycle nhỏ nhất, chứa một hay nhiều container tightly coupled. Containers chia network/IP/localhost và volumes khai báo, cùng node/fate; gom mọi service làm giảm deploy/scale/failure isolation.

### J-K04

Deployment quản ReplicaSets cho revisions; ReplicaSet giữ số Pods. Sửa Pod không đổi template và controller sẽ replace/reconcile; sửa source Deployment/Git rồi rollout.

### J-K05

Deployment: stateless long-running; StatefulSet: stable identity/storage/order; DaemonSet: per node; Job: finite; CronJob: scheduled. Có PVC không đủ để bắt buộc StatefulSet—stateless replicas có shared/external storage vẫn dùng Deployment.

### J-K06

Pod IP ephemeral, Service cung cấp discovery/endpoint ổn định. ClusterIP nội bộ, NodePort trên nodes, LoadBalancer do provider/controller expose. Không endpoints: so selector ↔ labels, namespace và readiness/EndpointSlice trước.

### J-K07

ConfigMap cho config không nhạy cảm; Secret cho bytes nhạy cảm nhưng base64 chỉ encoding. Env không đổi trong process đang chạy; projected volume có thể cập nhật eventual, app phải reload hoặc rollout.

### J-K08

Scheduler bin-pack theo requests; runtime/kernel enforce limits. CPU vượt limit bị throttle; memory vượt/pressure có thể OOM kill. Requests còn ảnh hưởng HPA resource utilization/QoS/capacity.

### J-K09

Startup cho khởi động chậm và trì hoãn probes khác; readiness điều khiển nhận traffic; liveness phát hiện process bị kẹt để restart. Liveness phụ thuộc DB ngoài tạo restart storm khi DB outage.

### J-K10

Pending chưa schedule/start xong; ImagePullBackOff không pull image; CrashLoop chạy rồi chết lặp; Running not Ready process chạy nhưng chưa nhận traffic. Dùng `kubectl logs POD -c C --previous` cùng describe/events/lastState.

### J-K11

Namespace scope names/RBAC/quota/policies; RoleBinding grant trong namespace, ClusterRoleBinding cluster-wide. Namespace không tự cách ly network; cần NetworkPolicy/CNI và controls khác.

### J-K12

PVC yêu cầu storage; StorageClass mô tả provisioner/policy; PV là resource/backend volume bind claim. Pending: describe PVC/events, class/provisioner/CSI, capacity/access/topology/quota; không xóa trước biết reclaim/data.

### J-K13

`kubectl rollout status/history` theo dõi; inspect Pods/events/logs; `rollout undo` về revision biết tốt khi cần. Readiness ngăn Pod chưa phục vụ được tính available/đưa vào Service, giúp rollout không tiến quá sớm.

### J-K14

Insufficient CPU là không node nào còn allocatable theo **requests** thỏa constraints, không nhất thiết usage hiện tại 100%. Taint repel; toleration chỉ cho phép Pod vào, không thu hút—cần affinity/selector nếu muốn dedicated node.

### J-K15

NetworkPolicy allow L3/L4 traffic cho selected Pods; cần CNI enforce, object đơn thuần có thể vô hiệu. Default-deny egress thường chặn DNS TCP/UDP 53 nên phải allow đúng DNS path.

### J-K16

Xác định scope/change → get Pod/Deployment/Service/EndpointSlice → describe/events → current/previous logs → test DNS/port từng hop → config/resources/policy/node. Describe/events nói scheduling/kubelet/control state; logs nói app; EndpointSlice nối Service với Ready backends.

## Mid-level — Docker

### M-D01

Tách dependency graph theo service, gửi context nhỏ, copy manifests/lockfiles trước source, dùng multi-stage và BuildKit cache mounts/remote cache. Pin dependency/base theo policy và rebuild có kiểm soát. Remote cache là input không tin cậy nếu shared; tách scope/verify outputs, không đưa secret vào cache.

### M-D02

Dùng buildx builder build `--platform=linux/amd64,linux/arm64` và push OCI index/manifest list; test từng image trên native runners nếu critical. Cross-compile nhanh cho toolchain hỗ trợ; QEMU dễ dùng nhưng chậm/có edge semantics; native builder chính xác hơn nhưng vận hành phức tạp.

### M-D03

Lint/test → deterministic build → image integration test → SBOM/vuln/license/secret scan → sign/attest provenance → immutable registry digest → verify/promote same digest. SBOM inventory, scan đối chiếu findings, signature publisher/integrity, provenance source/build. CVE no-fix cần reachability/compensating control/owner/expiry.

### M-D04

BuildKit `--secret` + `RUN --mount=type=secret` hoặc SSH mount, chỉ scope đúng instruction; không `ARG/ENV/COPY`. Nếu từng lộ: revoke/rotate, audit, rebuild clean, purge/quarantine cache/old digest/log theo retention và verify old credential fails.

### M-D05

PID 1 nhận TERM, ngừng accept/fetch queue, mark unhealthy/not-ready ở orchestrator, drain request, finish/return idempotent messages, close resources, reap children và exit trước deadline. Init/exec form forward signals; timeout dựa p99 work. Retry/visibility timeout phải tránh duplicate side effects.

### M-D06

Source dev bind; DB named/managed storage; disposable cache volume/tmpfs tùy persistence; runtime secret file/tmpfs/provider. DB backup phải logical/native/quiesced hoặc coordinated snapshot, checksum/encrypt/off-host rồi restore test; tar live data files có thể inconsistent.

### M-D07

Published port tạo host listener/NAT/dataplane vào bridge/container IP; return traffic qua conntrack/NAT; egress thường masquerade. Debug listener → route/NAT/firewall `DOCKER-USER` → bridge/veth → container bind. MTU/conntrack/rootless user-space network có failure/performance riêng; không tắt firewall để thử.

### M-D08

Compose phù hợp single-host/simple internal services khi downtime/ops model chấp nhận và có host HA/backup ngoài; không tự cung cấp multi-node scheduling/self-healing/rolling primitives đầy đủ. Production cần immutable images, secrets, limits, health, logging, backup, host patching và documented migration trigger.

### M-D09

Kiểm p95/p99 per cgroup, throttled seconds, cpuset, run queue, GC/heap/page faults, disk/network I/O/locks/connection pools và downstream traces. Host average thấp có thể che quota/cpuset/one-core saturation/short peak. Shares chỉ phân chia khi contention, không reserve CPU.

### M-D10

App log stdout/stderr structured với request/trace IDs; runtime driver có bounded rotation/non-blocking trade-off; node agent ship central durable store có retention/access/redaction. Monitor dropped/backpressure/disk. Không để collector outage block app mù quáng hoặc PII đi vào log.

### M-D11

Bind port cao rồi reverse proxy/capability `NET_BIND_SERVICE` cụ thể; non-root, drop all/add minimal, read-only rootfs và tmpfs `/tmp`, no-new-privileges, default seccomp/LSM. Rootless giảm daemon privilege nhưng có cgroup/port/network constraints; validate workload rather than privileged fallback.

### M-D12

Socket cho phép tạo privileged container/mount host nên gần host-root. Thay bằng isolated ephemeral CI worker, remote/rootless BuildKit builder với scoped auth/network, managed builder hoặc narrowly constrained service. Socket proxy giảm API surface nhưng daemon methods thường composable; threat-model tenant boundaries.

### M-D13

Layer sau `rm` chỉ whiteout; secret bytes còn layer cũ. Revoke first, rewrite Dockerfile using secret mount và rebuild with no tainted cache/new digest; quarantine/delete old artifacts/caches under retention. Squash/rebase chỉ có giá trị nếu resulting history verified clean, không xử lý clones/logs/credential compromise.

### M-D14

Inventory API clients/plugins/storage/network/cgroup/kernel; read release notes; backup daemon config and **data-specific** backups; canary representative host, drain workload, upgrade, validate pull/run/network/volume/limits/logging; roll waves with SLO abort. Binary rollback có thể không rollback metadata/storage format, nên test documented boundary.

## Mid-level — Kubernetes

### M-K01

Server-side apply tracks each manager's owned fields in managedFields and merges declarative intent server-side. Conflict signals two managers want same field; resolve ownership/architecture. Force conflicts steals ownership and may cause controller fight/drift, chỉ dùng khi migration đã biết effect.

### M-K02

Startup covers 45s warm-up; readiness only pass when serve-ready; maxUnavailable 0/low, surge within capacity, minReadySeconds/deadline. On terminate remove readiness/endpoint, preStop if needed, TERM drain long requests within grace. PDB protects maintenance, not rollout by itself; canary/SLO gate and rollback.

### M-K03

StatefulSet supplies ordinal/network/storage identity and ordered lifecycle, not DB consensus, backup, upgrades or fencing. Use mature operator/managed service based team/SLO; distribute quorum/storage zones, application-consistent backups and restore drills. “It runs” is not production operability.

### M-K04

Check Service selector/labels/namespace → EndpointSlice/Ready → port/targetPort/named port → app listen `0.0.0.0`/container port → connect from debug Pod → NetworkPolicy/CNI → service dataplane/kube-proxy/eBPF/node-specific evidence. Separate empty endpoint from endpoint unreachable.

### M-K05

Internal success means CoreDNS/service path partly works; inspect FQDN vs search/ndots, CoreDNS forward config/log/metrics/cache, egress NetworkPolicy to upstream, UDP/TCP 53, node-local DNS and upstream health. Test direct DNS server queries and compare nodes; don't restart first.

### M-K06

Policy rules are additive allows; once selected for ingress/egress, non-allowed traffic for that direction is isolated. Same list item namespace+pod selector is AND, separate items OR. CNI must implement; L3/L4 policy cannot provide HTTP auth/mTLS identity—use gateway/mesh/app where justified.

### M-K07

Create Pod may mount readable Secrets/service-account tokens or host resources if admission permits; read Secret yields other identities. Guard bind/escalate/impersonate, wildcard and cluster roles. Combine RBAC with Pod Security/admission, workload identity, node isolation and audit; `can-i` positive/negative tests.

### M-K08

Non-root UID/GID, no privilege escalation, drop ALL/add minimal capabilities, read-only rootfs, RuntimeDefault seccomp and limited writable volumes. Enforce Pod Security Restricted/policy-as-code gradually audit→warn→enforce, with scoped/owned/expiring exceptions and sandbox runtime for untrusted code.

### M-K09

Use per-service short-lived identity and external secret/KMS where needed; encrypt etcd, least-privilege RBAC/audit, version/rotate and trigger safe reload/rollout. CSI/file can rotate without env exposure but app must reload; env is simple but static/leak-prone. Segment blast radius and test revocation.

### M-K10

Scheduler needs one node satisfying all requests and constraints; aggregate free CPU doesn't solve per-node fragmentation. Examine FailedScheduling events, allocatable/requested, affinity/taints/topology spread, PVC topology, device resources and priority. Right-size or add correct pool/capacity; do not erase requests blindly.

### M-K11

Start from load/soak telemetry and SLO; request covers expected/critical capacity plus bin-packing strategy; memory limit above measured peaks/heap with headroom, CPU limits tested for throttling. QoS/eviction, namespace quota/defaults and node reserve matter. VPA recommendations inform changes but coordinate with HPA.

### M-K12

Check HPA conditions/events, metrics APIs, target ownership, CPU requests and eligible Pods/readiness. CPU may lag/not reflect queue; use concurrency/queue/custom or external metric with bounded scale policies/stabilization. Test cold start and downstream capacity; tiny requests distort utilization.

### M-K13

PDB limits voluntary API evictions, not node crash/OOM/direct delete or guaranteed uptime. Drain blocks if desiredHealthy not met, selector wrong or zero disruption; spare nodes/topology and healthy replicas still required. For unhealthy Pods, policy choice trades availability chance against drain operability.

### M-K14

Describe PVC/PV/SC and CSI events/logs; inspect access mode/capacity/provisioner/topology/PV node affinity. WaitForFirstConsumer avoids zonal early binding. Protect existing data/reclaim policy, snapshot/backup and restore to new volume/zone; never delete-first under `Delete`.

### M-K15

Collect request rate/error/latency/saturation plus dependency and K8s/controller/node signals; structured logs and traces share correlation. Define user-facing SLIs/SLO and multi-window burn page, capacity ticket alerts. Control labels/cardinality, sample traces and retention tiers to cap cost.

### M-K16

Get termination state/exit reason, previous logs, events, per-container high-resolution memory, limits/node pressure and rollout diff/config/probes. Distinguish leak/short peak/heap limit/sidecar/liveness. Roll back or temporarily right-size with capacity check, profile/fix and soak-test; monitor restarts/OOM.

### M-K17

Build/test/scan/sign once; publish immutable digest. Promote same digest via reviewed config/Git, verify provenance/admission, stage tests and canary SLO gates. Helm/Kustomize render deterministic desired state; GitOps detects drift. Roll back image digest **and compatible config/schema**.

### M-K18

Inventory deprecated APIs and version skew; validate managed/provider path plus CRDs/operators/webhooks/CNI/CSI/ingress/metrics compatibility. Backup and restore-test etcd/data/config; non-prod/canary control plane/node pool, drain waves, conformance/SLO checks. Rollback limits depend provider/schema, so define abort early.

## Senior/Staff — Container platform

### S-D01

Chọn mức đơn giản nhất đáp ứng failure/SLO/team constraints: systemd cho few host-bound processes, Compose cho single-host stacks, managed container service cho orchestration ít control, Kubernetes cho diverse multi-team workloads/policies/extensibility. Quyết định bằng TCO/on-call/skills/blast radius/compliance/exit plan, không theo xu hướng.

### S-D02

Platform cung cấp versioned base families/templates và reusable CI, có owner/SLA, automated rebuild/update PR, digest/SBOM/provenance/signing và compatibility tests. Đo freshness/build time/adoption/exceptions. Paved road phải cho escape hatch có expiry, không khóa team vào base bất biến không được patch.

### S-D03

Untrusted PR không nhận production secrets/network/cache write tin cậy; dùng ephemeral isolated workers, least egress, rootless/sandbox where viable, per-tenant cache namespaces and verified dependencies. Signing identity chỉ sau trusted build gates; provenance binds source/builder/inputs. Privileged DinD/socket là high-risk trust boundary.

### S-D04

Pin local-known digests and retain rollback artifacts; multi-region/mirror design có consistency and trust policy. Outage: existing Pods may run but new nodes/rollouts fail, nên freeze nonessential deploy và capacity headroom. Compromise: revoke credentials/keys, block bad digests, verify signatures/provenance, rebuild trust cleanly; break-glass audited/time-bound.

### S-D05

Define policy tiers by workload risk: non-root/rootless, cap/seccomp/LSM/read-only, network/secret/limit defaults; admission/CI feedback trước enforcement. Telemetry identifies incompatibility, docs/autofix templates help teams, exceptions scoped/owned/expiring. Sandbox untrusted workloads and measure policy coverage/incident reduction.

### S-D06

Prioritize exploitable/reachable internet-facing paths, known exploitation, asset criticality and fix availability; set SLA and compensating controls with expiry. Track mean base rebuild/promotion time, % critical fixed within SLA, exposure age and accepted-risk debt—not raw CVE count that rewards hiding inventory.

### S-D07

Declare incident, isolate node/network/cloud identity without destroying evidence, freeze scheduling/deploy, preserve volatile/disk/audit data and assess adjacent nodes/registry/credentials. Rotate/revoke reachable credentials, evacuate only with contamination awareness, rebuild node/workloads from trusted signed artifacts, validate control plane and monitor. Coordinate legal/comms/forensics; do not “clean in place” as trust restoration.

### S-D08

Team still needs process/signal/PID1, namespace/cgroup/OOM, capabilities/seccomp/LSM, overlay/filesystem/fsync, DNS/TCP/conntrack/NAT/MTU, time/clock and I/O scheduling. Managed control plane does not debug node/app dataplane or consistency; encode knowledge into dashboards/runbooks/game days and training.

## Senior/Staff — Kubernetes/platform

### S-K01

API servers are stateless replicas behind LB; etcd needs odd quorum, low-latency durable storage/backups; controllers/scheduler use leader election. During API outage existing containers often keep running, but scheduling/reconciliation/config changes/autoscale may stop; node behavior depends cached state. Test quorum loss/restore, admission dependency outage and degraded-mode operations.

### S-K02

Soft tenants share cluster with namespace RBAC, default-deny network, quota, Pod Security/admission, separate identities/secrets/audit and node pools as needed. Hostile or strict regulatory tenants may need sandbox runtime or separate clusters/accounts/keys. Govern cluster-scoped APIs/operators and noisy neighbors; boundary follows threat model, not namespace label.

### S-K03

One cluster improves utilization/simplicity but grows blast radius/control-plane/tenant coupling; many clusters improve isolation/region/compliance but multiply drift/upgrade/observability cost. Partition by hard failure/data/regulatory boundary, standardize fleet lifecycle/policy and quantify maximum tolerable blast radius and per-cluster overhead.

### S-K04

Expose a small versioned platform contract (service class, resource/SLO/data needs) that renders transparent standard K8s resources with links/evidence. Use CRD/operator only when continuous domain reconciliation is valuable; templates for static composition. Provide escape hatch, ownership, status/conditions, debug path, migration/deprecation policy and product-team feedback.

### S-K05

Evaluate conformance, scale/churn, policy fidelity, dataplane mode, encryption/source-IP/MTU, observability/debuggability, Windows/cloud support, upgrade and vendor skill. Separate CNI Pod network, Service dataplane and ingress/gateway responsibilities even if product combines them. Benchmark representative traffic/failure, not marketing throughput.

### S-K06

Mesh is valuable for uniform workload identity/mTLS, traffic policy and telemetry across many services/languages when team can operate it. It adds proxies/control plane, latency/resources, certificate/policy failures and retry amplification. Start from concrete unmet requirement; app-level correctness/idempotency and egress/gateway controls remain necessary.

### S-K07

Offer few opinionated StorageClasses by durability/performance/topology/reclaim/encryption, backed by mature CSI and quotas. Model zone failure, attach limits and workload quorum; snapshots are not sufficient backup—make application-consistent, encrypted off-account copies and restore SLO tests. Track latency/capacity/expansion/key rotation.

### S-K08

Choose scaling metric closest to demand/bottleneck, correct requests, startup/readiness, stabilization/rate limits and min headroom. HPA, VPA and node autoscaler have lag/feedback interactions; simulate cold starts, quota and downstream max capacity. Pre-scale predictable peaks and use backpressure/load shedding so autoscaling is not the only control.

### S-K09

Translate SLO and dependency budgets into N+failure capacity, replicas across independent zones/hosts, safe surge/unavailable, PDB maintenance constraints and tested failover. Model correlated zone/provider/dependency failure, retries and quorum—not Bernoulli Pod failures. Reserve headroom and use error budget to govern risky changes.

### S-K10

Classify state: Git desired config, etcd API state, Secrets/KMS/certs, application data and external resources each need backup/restore. Use immutable/off-account copies, RPO-aligned frequency and clean-room restore order with identity/keys then dependencies/data/apps/traffic. Measure full RTO/game days and prevent dual writers/external side effects.

### S-K11

Map trust from edge/TLS/gateway → service identity/network → Pod/node/runtime → service account/API → cloud metadata/KMS/registry/build. Controls: federated short-lived identity, least RBAC, Pod Security/admission, NetworkPolicy/egress, workload/node isolation, signed supply chain, audit export and guarded break-glass. Test escalation paths, not controls individually.

### S-K12

Policies need HA/low latency/bounded match scope/version compatibility; validate before mutate when possible and avoid external calls. Roll audit→warn→enforce, publish violations/autofix, scoped expiring exemptions, canary policy and failure-mode decision per risk. Break-glass is authenticated/audited and rehearsed; webhook outage must not surprise API availability/security.

### S-K13

Maintain API/addon/CRD inventory with owners and compatibility contracts; continuously scan deprecations and test next version. Canary fleet, conversion/storage-version plans, backup/restore and SLO abort gates precede waves. Provider rollback may not undo schema/storage migrations, so migration rehearsal and forward-fix capability matter.

### S-K14

Define telemetry contract and tenant budgets; aggregate/drop high-cardinality labels at ingestion, tier retention, sample traces tail/head based on errors and protect audit separately. Correlate workload/platform/control-plane/CNI/CSI. Platform itself has ingestion/query availability SLO and degraded mode; measure cost per service/request and MTTR outcomes.

### S-K15

Start with unit economics and requests vs observed percentile, eliminate idle/over-request, improve bin packing and workload schedules; use spot only for disruption-tolerant capacity and retain zone/headroom for SLO. Quota/showback creates incentives. Never optimize away redundancy/restore tests; track cost alongside error-budget burn.

### S-K16

Appoint incident commander, operations leads, comms and scribe; set severity/objective, freeze unrelated changes, keep timestamped hypothesis/action/owner/expected result and abort criteria. Communicate known/unknown/next update, hand off sustainably. After recovery preserve evidence, write blameless causal analysis with owned measurable actions.

### S-K17

Managed shifts control-plane HA/patch/etcd work but shared responsibility still leaves workloads, identity, policy, data and often nodes/addons. Compare SLO/support/upgrade windows/access/compliance/residency/integration and full staffing/TCO. Self-managed is justified only by requirements and operational capability; design portability/exit proportional to risk.

### S-K18

Inventory and classify: retire, keep VM, replatform, refactor; baseline SLO/cost/dependencies/data. Build landing zone/golden path and pilot stateless low-risk workloads, externalize config/logs/state, migrate data via tested replication/cutover with rollback, then waves. Train/on-call/game days and measure deploy time/reliability/cost, not percent “on K8s”.

## Nguồn đối chiếu

- [Docker security](https://docs.docker.com/engine/security/), [rootless](https://docs.docker.com/engine/security/rootless/), [build secrets](https://docs.docker.com/build/building/secrets/)
- [Kubernetes components](https://kubernetes.io/docs/concepts/overview/components/), [networking](https://kubernetes.io/docs/concepts/services-networking/), [storage](https://kubernetes.io/docs/concepts/storage/)
- [Kubernetes RBAC good practices](https://kubernetes.io/docs/concepts/security/rbac-good-practices/), [Pod Security Standards](https://kubernetes.io/docs/concepts/security/pod-security-standards/), [observability](https://kubernetes.io/docs/concepts/cluster-administration/observability/)
