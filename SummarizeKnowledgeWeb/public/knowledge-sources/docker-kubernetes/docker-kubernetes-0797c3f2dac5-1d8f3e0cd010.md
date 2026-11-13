# Gợi ý chấm tình huống/troubleshooting

Không có một “lệnh thần chú”. Mỗi câu 5 điểm theo rubric trong đề. Các ý dưới đây là **minimum evidence**; phương án khác có bằng chứng và an toàn vẫn được điểm.

## Docker

### SC-D01

- Scope: dừng/giảm build mới, không prune khi chưa biết image/volume nào là rollback/data.
- Evidence: `df -h`, `df -i`, `docker info` (Docker Root Dir/storage driver), `docker system df -v`, `docker builder du`, log size, data-root filesystem/thin-pool metrics.
- Phân biệt block/inode/cache/log; kiểm tra deleted-but-open files bằng host tooling phù hợp.
- Cleanup target rõ: build cache có tuổi/filter, stopped artifacts đã xác nhận; log rotation; mở rộng filesystem/thin pool nếu cần. Backup/list volume trước thao tác.
- Prevention: disk/inode/thin-pool alert, log size rotation, CI cache retention, capacity/runbook và dry-run inventory.

### SC-D02

- `docker history --no-trunc`, layer/SBOM tooling cho thấy SDK đã ghi vào layer; `rm` ở layer sau chỉ whiteout/che file, không bỏ bytes layer cũ.
- Gộp download/use/delete trong cùng `RUN` nếu chỉ temporary, tốt hơn là multi-stage và chỉ `COPY --from` artifact.
- `.dockerignore`, no package cache, base phù hợp; không tối ưu bằng cách làm mất reproducibility/security update.
- CI đo compressed/uncompressed size/layer delta và fail budget có exception.

### SC-D03

- Shell-form có `/bin/sh -c` làm PID 1, signal có thể không tới Node; xem `docker top/inspect`, send TERM và timeline logs.
- Dùng `CMD ["node","server.js"]`; cài handler SIGTERM ngừng listener/drain/close DB, set exit code; init nếu child reaping cần.
- Điều chỉnh stop timeout theo p99 request, nhưng không dùng timeout dài để che handler lỗi.
- Test: chạy request dài, `docker stop -t ...`, xác nhận TERM log, request hoàn thành/được retry, không đến KILL và exit mong đợi.

### SC-D04

- `localhost` của API container, không phải DB. Dùng host `db`, port container `5432` trên user-defined Compose network.
- Xác minh `docker compose config/ps`, DNS `getent hosts db`, DB listener/health/log, connect từ API network namespace.
- Healthcheck + `service_healthy` giúp startup; app vẫn retry exponential backoff/jitter và reconnect runtime.
- IP container ephemeral/recreate thay đổi; DNS service name là contract.

### SC-D05

- Freeze writes/stop pipeline; `docker volume ls/inspect` và container history/Compose project labels để map mount cũ, không mount read-write vào app mới.
- Tạo read-only/clone/backup trước kiểm tra; inspect old volume path through disposable container, validate DB with native recovery/dump.
- Nếu `down -v` đã xóa backend local và không có snapshot, Docker không có built-in undelete; restore từ backup/provider snapshot, không hứa cứu được.
- Sửa explicit named volume + migration step + backup/restore test; pipeline không `down -v` ngoài disposable project và yêu cầu approval/data classification.

### SC-D06

- Correlate exact registry/endpoint/status/headers. `429` → quota/rate/authenticated pull/concurrency; `401/403` → token scope/expiry/repository; `manifest unknown` → tag/platform; x509/proxy/DNS là nhánh khác.
- Login bằng CI identity least privilege, kiểm tra credential helper/secret masking và clock; không in token.
- Pin digest, registry mirror/cache theo license/trust, reduce pulls/build concurrency; retry 429/5xx với bounded exponential backoff/jitter và respect `Retry-After`, fail fast auth.
- Monitor registry quotas/SLA; không chuyển sang public mutable image tùy tiện.

### SC-D07

- Xem đây là credential compromise: revoke/rotate trước; audit registry/resource access và scope/time window.
- Secret có thể nằm trong layer/history/cache/registry replicas/CI logs; xóa Dockerfile line không xóa history. Build sạch từ safe commit với BuildKit secret/SSH mount, invalidate/purge cache theo provider, push new immutable digest.
- Remove/quarantine old artifacts theo retention/forensic policy, rollout consumers, verify token cũ fail; nếu Git chứa token, làm clean history theo phối hợp tổ chức.
- Secret scanning/pre-commit/CI, short-lived scoped token, provenance và incident report.

### SC-D08

- Contain theo severity: rate-limit/isolate network/container, giữ image/disk/log/process/network evidence; không `rm` ngay nếu nghi compromise.
- `docker stats/top/inspect/events`, host `ps/perf` phù hợp, cgroup CPU throttling, app metrics/traces/request rate và egress/process binary.
- Legitimate demand → capacity/cache/optimize + tested quota; loop → profile/fix/rollback; compromise → isolate, rotate credentials, acquire evidence, rebuild clean host/image theo IR.
- Shares chỉ ưu tiên khi contention, quota là ceiling; alert saturation/throttling và set resource baseline.

## Kubernetes

### SC-K01

- `manifest unknown`: xác minh repository/tag/digest tồn tại, pull secret scope, imagePullPolicy và multi-arch manifest tương thích node (`kubernetes.io/arch`).
- x509 chỉ pool khác: runtime/node CA/trust/proxy/registry mirror/time khác; kiểm tra runtime service logs/config và TLS chain, không tắt verification.
- Mitigate schedule sang pool khỏe nếu capacity/policy cho phép; sửa golden node image/trust rồi roll pool canary.
- Pin digest + publish multi-arch + node conformance/preflight/registry monitoring.

### SC-K02

- `kubectl get/describe pod`, `.status.containerStatuses[*].lastState`, events, `kubectl logs POD -c C --previous --timestamps`.
- Kiểm image digest/command/args/workingDir, ConfigMap/Secret keys/mount permission, resources/OOM, probes; không dump secret.
- Nếu image distroless: `kubectl debug` ephemeral container/copy-to theo RBAC/policy hoặc reproduce same image/config ở lab; không sửa filesystem production.
- Rollback/stop rollout nếu impact; fix declarative, new image/config, validate restart count/Ready.

### SC-K03

- Scheduler đã nói hai nhóm node: memory request không fit và taint không tolerated. Xem allocatable/requested, fragmentation, actual usage/right-size; taint owner/purpose.
- Lựa chọn: reduce accurate requests sau profiling, scale node pool, reschedule lower priority, add appropriate capacity; add toleration **chỉ** nếu workload được phép vào dedicated nodes, thường kèm node affinity.
- Toleration đơn thuần có thể đặt app lên node GPU/system/dedicated và tranh tài nguyên; không “fix” bằng xóa request.
- Capacity alerts, quota/default requests, topology/headroom and scheduling tests.

### SC-K04

- `get svc -o yaml`, `get pods --show-labels`, compare Service selector với `Deployment.spec.template.metadata.labels`; `get endpointslice -l kubernetes.io/service-name=... -o yaml`.
- Kiểm cùng namespace, Pod Ready, named targetPort tồn tại và process listen. Selector mismatch tạo empty endpoints; port mismatch thường endpoints có nhưng traffic fail.
- Sửa nguồn Deployment/Service, rollout/apply; validate EndpointSlice + curl Service.
- CI schema/policy/unit test rendered selectors/ports; standard labels and smoke test.

### SC-K05

- So sánh Pod tốt/xấu, node, `/etc/resolv.conf`, FQDN/direct `dig @DNS-IP`, DNS Service/EndpointSlice/CoreDNS distribution/log/metrics.
- Vì IP Service cũng timeout trên một node, ưu tiên node dataplane: CNI route, kube-proxy/eBPF state, NetworkPolicy, firewall, conntrack, MTU, node-local DNS; test Pod-to-Pod và Pod-to-Service.
- Cordon node để giảm impact nếu chứng minh node-specific, không reboot trước evidence; repair/replace node theo runbook.
- Node conformance, DNS SLI, CNI/dataplane alerts and canary Pods per node.

### SC-K06

- Readiness phải fail đến khi cache warm; startup bảo vệ liveness trong warm-up; liveness chỉ internal deadlock.
- Với 4 replicas, `maxUnavailable` nhỏ (0/1) và surge đủ theo capacity; `minReadySeconds`, deadline; canary/metric gate.
- Termination: mark not ready/drain, endpoint propagation/LB delay, preStop khi cần, SIGTERM drain, grace theo request.
- Mitigate rollback/pause; load test rollout và alert unavailable/5xx. 50% cho phép 2 cũ unavailable cộng Pods mới ready giả tạo gây 503.

### SC-K07

- `describe` lastState `OOMKilled`, per-container limit/usage high-resolution/max, working set/RSS/cache, restart time; sidecar và node `MemoryPressure`/events/QoS.
- Dashboard average/window có thể che millisecond/short peak hoặc aggregate Pods; correlate application heap/GC/allocator/profile.
- Fix leak/concurrency/cache, size request/limit từ peak + headroom, tune heap below cgroup, protect node; load/soak test.
- Tăng limit có thể là mitigation có capacity check, không root fix; alerts OOM/restarts/near-limit and profiling playbook.

### SC-K08

- `kubectl describe hpa` conditions/events and raw metrics API; HPA resource CPU uses utilization relative to requests, missing relevant request makes values unavailable/Pods omitted.
- Add measured CPU request to **every relevant app container**, avoid sidecar distortion (container metric if supported), validate target and scale behavior.
- Custom metric for queue depth/concurrency/business load; external metric for external queue/provider, with adapter/SLO/failure behavior.
- Stabilization and load test scale-out/in; don't set arbitrary tiny request just to inflate utilization.

### SC-K09

- Evidence PVC/PV nodeAffinity/zone, StorageClass binding mode/allowedTopologies, Pod affinity/events, CSI provisioner logs.
- Future: StorageClass `WaitForFirstConsumer` lets scheduler topology guide provisioning; verify CSI support and capacity.
- Existing volume: protect data/snapshot/backup; move Pod affinity to zone A if acceptable, or storage-supported snapshot/replication/restore into B. Do not delete PVC under Delete policy casually.
- Admission review for Immediate in zonal storage, restore drill and capacity per zone.

### SC-K10

- Check `kubectl get pdb` disruptionsAllowed/selectors, workload replicas/Ready/quorum and owner. Coordinate scale/fix PDB; do not `--disable-eviction`/force delete to bypass silently.
- DaemonSet Pods normally ignored by drain with explicit understanding; controller handles them. Static/unmanaged Pods need separate handling.
- `emptyDir` data will be lost on eviction; `--delete-emptydir-data` is acknowledgement, only after app owner confirms ephemeral/recoverable.
- Ensure destination capacity/topology, monitor reschedule, uncordon/rollback; PDB 0 may intentionally block.

### SC-K11

- Test exact identity/resource/subresource: `kubectl auth can-i get pods --as=system:serviceaccount:NS:reporter -n NS` and `... get pods --subresource=log` (syntax may vary by client); inspect RoleBindings.
- Rule: `apiGroups: [""]`, `resources: ["pods"]`, verbs `get/list`; separate `resources: ["pods/log"]`, verbs `get` (possibly list/watch only if requirement).
- Bind Role in namespace to named SA; no wildcard/cluster binding. Validate allowed and negative verbs/delete/secrets.
- Audit and RBAC tests in CI.

### SC-K12

- Declare incident; revoke/rotate all affected credentials/derived sessions first, identify scope/time/access via Git/CI/API/provider audit.
- Roll new Secret/version/workload, verify old fails; redact/remove CI artifact/debug endpoint, restrict logs and access. Git history cleaning requires team coordination because clones/forks persist.
- Kubernetes Secret hardening: encryption at rest/KMS, RBAC, external store/short-lived identity, no env dump, audit/rotation.
- Secret scanners, protected variables, review/policy, incident retro. Never paste leaked value into ticket/evidence.

## Platform

### SC-P01

- Confirm SLI by route/region/version; compare p50/p95/p99 and concurrency/queue, deploy/config timeline.
- Traces identify span/downstream; logs via correlation ID; metrics for DB/cache pool, DNS latency/errors, GC pauses, CPU **throttling**, memory, disk/network I/O, retries/connection creation/hot shard.
- CPU low can mean I/O wait/lock/queue/downstream, so replicas may amplify downstream overload.
- Mitigate target: rollback change, shed load, cache, tune pool with downstream capacity, route around dependency; verify SLO and prevent with tracing/capacity test.

### SC-P02

- In-place projected update and app reload create mixed config/version; map failing Pods/config resourceVersion/hash.
- Create immutable/versioned ConfigMap, reference name or checksum annotation to force controlled Deployment rollout; validate schema/semantic before merge.
- Canary few Pods/traffic, SLO gate, promote atomically; rollback Deployment + config reference together. Do not mutate known-good version.
- Git audit, policy preventing mutable prod config, compatibility window when mixed versions unavoidable.

### SC-P03

- Stateless: topology spread across zone/host, anti-affinity, enough replicas and spare capacity in remaining zones; PDB for voluntary work, not zone failure; LB health/failover.
- DB: replica/quorum placement across failure domains, odd quorum, storage replication/topology and tested failover; 3 replicas all one zone is not HA.
- Cluster/node autoscaler must have cross-zone quota/capacity and scale speed; dependencies/DNS/egress considered.
- Game day zone isolation with abort/SLO/RTO; backup off-zone and recovery runbook.

### SC-P04

- First decide restore model: new compatible control plane/addons/CRDs, identity/KMS/cert/DNS/network/storage prerequisites. etcd restore may restore stale external references; Git reapply may be safer depending cluster.
- Restore Secret encryption keys/credentials securely, then data stores in dependency order, then stateless apps/traffic. Database backup at -30m means best possible data RPO around 30m; etcd -12h means API state gap unless Git/audit fills it.
- Validate schema/data checksums, quorum, smoke/business transactions, auth, observability and security; reconcile DNS/traffic last/canary.
- Because restore never tested, claimed RTO is unknown until measured. Record actual RPO/RTO, gaps and schedule recurring full restore drills.
