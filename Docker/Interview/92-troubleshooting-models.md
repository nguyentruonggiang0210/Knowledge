# Troubleshooting drill — model reasoning

Ứng viên không cần đoán đúng trước khi mở thẻ. Điểm cao khi họ hỏi evidence khiến thẻ đó trở nên hữu ích và cập nhật giả thuyết sau mỗi thẻ.

## TD-01 — Restart/OOM

- Trước thẻ: scope version/hosts/restart count; inspect exit/OOM/health, current/previous logs, resource metrics và recent diff.
- Sau 137: ưu tiên SIGKILL nhưng phân biệt OOM/manual/node pressure. `OOMKilled=true` + host khỏe xác nhận container limit.
- Mitigation: rollback cache feature hoặc tăng tạm limit sau capacity check; tránh restart storm.
- Root fix: bound/evict cache, streaming, concurrency limit; profile high-resolution peak, load/soak, set request/limit/headroom và alert OOM/near-limit.

## TD-02 — Disk

- Inventory filesystem block/inode/data-root, `docker system df -v`, builder usage, logs/open-deleted files; không prune volume.
- Critical volume 300 GB không phải cleanup target. Log 120 GB là immediate containment: rotate/truncate bằng runbook an toàn after ship/preserve needed evidence; configure `max-size/max-file` or logging pipeline.
- Remove only verified stale build cache/images with filters/retention and rollback inventory. Alert disk/inode/log growth; database backup is separate.

## TD-03 — Architecture

- `exec format error` suggests architecture/binary/shebang; compare node arch and inspect registry manifest/index/digest, not tag name.
- Publish multi-arch OCI index through native/cross builds, run image tests per platform, promote immutable digest.
- CI gate verifies required platforms and node admission/policy rejects unsupported/mutable artifacts; tag can point to index but deployment pins approved digest.

## TD-04 — Empty EndpointSlice

- Ready Pods + empty endpoints narrows to Service selection/namespace, not CNI first. Compare exact selectors and template labels.
- Hotfix declarative selector/labels with ownership understanding; then EndpointSlice populated, verify targetPort/name, listener and in-cluster curl.
- CI render test asserts selectors match and Service has endpoints in smoke environment; label schema/admission can prevent drift.

## TD-05 — Rollout

- Current old replicas healthy and maxUnavailable 0 contain impact; pause rollout to prevent churn, inspect new previous logs/events/config refs/diff.
- Typo is deterministic. Rollback quickest known-good if release not urgent; fix-forward acceptable with reviewed config and canary while paused/controlled. Do not edit Pod.
- Validate ConfigMap key contract at startup/CI schema, immutable/versioned config or checksum rollout; observe rollout and SLO.

## TD-06 — Node-specific network

- Correlate failures to node then compare Pod IP/direct connectivity and CNI/kube-proxy/node conditions. CoreDNS global restart is unjustified.
- Cordon worker-7; ensure affected workloads/quorum/PDB/capacity before evicting. Preserve CNI/node/kernel/conntrack/memory evidence.
- Relieve/repair MemoryPressure root cause or replace node from golden image; validate CNI conformance/DNS/packet loss before uncordon. Alert per-node CNI restarts and pressure.

## TD-07 — Short memory peak

- Average at 60s aliases a 3s peak; get lastState/OOM, high-frequency/container profiler and job/file size/concurrency.
- Stream/chunk decompression, bound parallel jobs/backpressure and admission; set request closer to peak working set and limit with headroom.
- 20×1.8 GiB >32 GiB before system reserve, so concurrency/node capacity/topology must be budgeted. Increasing every limit without schedule/request plan risks node eviction.

## TD-08 — HPA feedback

- Request 10m makes startup 500m appear 5000%, causing scale; immediate readiness includes cold Pods, more replicas create more startup spikes; no scale-down stabilization oscillates.
- Right-size request from steady/profile, readiness only after warm, startup probe, behavior policies/stabilization. Prefer queue depth/concurrency target with max based downstream capacity.
- Load test step/ramp/decline, observe metric lag/replica/latency/queue and abort; pre-warm or keep minimum for SLO.

## TD-09 — Volume topology

- Bound PV has data and reclaim Delete: do not delete. Schedule workload in zone a temporarily if requirement allows, or snapshot/backup and restore to a new volume in b, validate data before cutover.
- Future StorageClass WaitForFirstConsumer aligns provision with Pod topology; verify CSI support/allowed topology.
- Test reclaim/snapshot/restore, enforce class choices and monitor PVC events.

## TD-10 — Drain/PDB

- PDB minAvailable 2 with only one Ready correctly blocks. First restore second replica: readiness should not depend on planned external maintenance if app can safely serve/degrade; otherwise coordinate downtime/temporarily adjust PDB with owner.
- DaemonSet ignored per drain semantics; Job emptyDir holds work—wait/checkpoint/restart idempotently, don't acknowledge deletion blindly.
- Ensure destination capacity; extending maintenance is safer than force causing outage/data loss. Record disruption/runbook fixes.

## TD-11 — Subresource RBAC

- `pods/log` is a distinct subresource. Add namespace Role rules: `pods` get/list and `pods/log` get, bind named SA; no wildcard/ClusterRoleBinding unless multi-namespace requirement deliberately designed.
- `kubectl auth can-i` positive tests plus negative delete/secrets/other namespace; audit UI actions and rollout least privilege with monitoring.

## TD-12 — Connection/retry storm

- Trace already locates connection acquisition. 100 Pods × pool 100 =10k potential > DB max4k, plus other clients; HPA worsens bottleneck. Double layer retries amplify traffic up to a multiplicative bound.
- Contain: cap replicas/pool, disable one retry layer, shed/queue noncritical, rollback HPA change and protect DB; monitor active/waiting connections.
- Allocate global connection budget with per-Pod pool derived from max replicas/reserve, use pooler if appropriate, scale on queue with DB capacity ceiling; end-to-end retry budget/idempotency and load test.

## Interviewer prompts không dẫn đáp án

- “Kết quả nào sẽ khiến bạn đổi giả thuyết?”
- “Thao tác đó có blast radius/rollback gì?”
- “Bạn cần biết version/CNI/CSI/runtime nào?”
- “Nếu mitigation không hiệu quả sau 5 phút, abort condition là gì?”
- “Bạn xác nhận người dùng đã phục hồi bằng signal nào?”
