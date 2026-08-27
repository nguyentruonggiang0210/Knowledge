# Đáp án Level 3 – Cloud-Native

Tổng: **38 điểm**.

## N01 (1 điểm)

**A — Deployment.** Deployment quản ReplicaSet/Pod và rollout cho workload stateless phổ biến.

## N02 (1 điểm)

**Đúng.** Service object/ClusterIP tồn tại không có nghĩa có backend ready; kiểm tra selector, labels và EndpointSlice.

## N03 (1 điểm)

**A — Readiness.** Liveness quyết định restart; startup trì hoãn các probe khác cho app khởi động chậm.

## N04 (1 điểm)

**A.** Scheduler dùng requests; usage thực tế và limits ảnh hưởng runtime khác với scheduling.

## N05 (1 điểm)

**Sai.** Base64 là encoding. Cần encryption at rest, RBAC tối thiểu, secret store/KMS phù hợp, rotation và tránh log/mount thừa.

## N06 (1 điểm)

**A.** RoleBinding có namespace scope (dù có thể tham chiếu ClusterRole); ClusterRoleBinding cấp subject quyền trên cluster scope.

## N07 (1 điểm)

**Đúng.** Ingress và egress isolation là riêng. Policy chọn Pod theo một direction mới làm Pod isolated ở direction đó; nhiều policy được cộng hợp.

## N08 (1 điểm)

**A.** Trace/span context cần propagate qua service/message; không nên biến baggage thành nơi chở secret hoặc dữ liệu cardinality vô hạn.

## N09 (2 điểm)

- 1 điểm: manifest/Git biểu diễn desired state; controller quan sát actual, tính delta và lặp reconcile tới hội tụ, chấp nhận eventual consistency/failure/retry.
- 1 điểm: sửa trực tiếp là drift so với source; controller có thể khôi phục desired value. Thay đổi cần đi qua source/PR hoặc có break-glass được ghi nhận rồi reconcile ngược về Git.

## N10 (2 điểm)

- 1 điểm: DNS trỏ external LB; LB chuyển tới Ingress/Gateway controller/rule theo host/path/TLS; route tới Service virtual IP; kube proxy/dataplane chọn EndpointSlice/Pod.
- 1 điểm: selector ghép labels; `port` là Service port, `targetPort` là app port; only-ready endpoint nhận traffic; NetworkPolicy/NSG/firewall/DNS và return path phải cho phép. Debug mỗi hop bằng event/config/log/packet evidence.

## N11 (2 điểm)

- 1 điểm: request phục vụ scheduling/QoS; CPU limit có thể throttle; vượt memory limit dẫn OOMKill; thiếu request gây overcommit/noisy neighbor, request quá cao gây Pending/lãng phí.
- 1 điểm: dùng time-series percentile/peak, throttling, working set/OOM/event, latency/SLO và load test theo workload/failure scenario; right-size có headroom, không lấy average ngắn.

## N12 (2 điểm)

- 1 điểm: Helm template/package/chart và có release state; GitOps controller liên tục reconcile declared source. GitOps có thể render/apply Helm nhưng Git vẫn là intent source.
- 1 điểm: version chart/image/values; secret dùng encrypted reference/external secret, không plaintext Git; drift được alert/reconcile. Rollback bằng Git revert/version change được review và phải kiểm tra data compatibility, không chỉ `helm rollback` ngoài source.

## N13 (2 điểm)

- 1 điểm: SDK/agent tạo telemetry và inject/extract context; Collector nhận/process/batch/filter/export; backend lưu/query. Context nối spans qua sync/async boundary.
- 1 điểm: head sampling quyết định sớm, rẻ nhưng dễ bỏ trace lỗi hiếm; tail sampling quyết định sau khi thấy trace, giữ lỗi/latency tốt hơn nhưng cần buffer/cost/HA. Sampling metric/log/trace phải bảo toàn SLO/incident use case.

## N14 (2 điểm)

- 1 điểm: ví dụ eligible request loại health/user 4xx; good event là non-5xx và dưới latency threshold; target 99.9% trong rolling 28 ngày, đo tại user-facing edge.
- 1 điểm: multi-window burn-rate alert nhanh/chậm dựa mức tiêu error budget. CPU là cause/resource signal, không trực tiếp đo trải nghiệm request thành công.

## N15 (3 điểm)

- 0,5: xác định rollout/time/Pod owner và `kubectl describe`/events.
- 0,5: `logs` current và `--previous`, exit code/reason/restart count.
- 0,5: image/command/args/env/ConfigMap/Secret mount và service account.
- 0,5: startup/liveness/readiness threshold/path/port; probe không được giết app khởi động chậm.
- 0,5: OOMKilled/limit/node pressure và dependency DNS/network/database.
- 0,5: rollback khi recent release gây impact và phiên bản cũ/data compatible; giữ evidence, sau đó sửa/test guardrail.

## N16 (3 điểm)

- 1 điểm: scheduler event là nguồn đầu; so requests của Pod với allocatable từng node, quota/LimitRange, max pods và resource fragmentation—not cluster average.
- 1 điểm: nodeSelector/affinity/anti-affinity/topology, taint/toleration, architecture/zone; autoscaler/quota/cloud capacity.
- 1 điểm: PVC binding/storage class/zone, image/policy nếu scheduling gate; sửa request/topology/capacity theo evidence. Trung bình che node-specific constraint và headroom failure.

## N17 (3 điểm)

- 1 điểm: startup phù hợp; readiness chỉ healthy node nhận traffic; rolling `maxSurge`/`maxUnavailable`, capacity và PDB; canary nếu rủi ro cao.
- 1 điểm: graceful SIGTERM, `preStop` nếu cần, termination grace và LB endpoint drain; app idempotent/connection cleanup.
- 1 điểm: expand/contract schema tương thích v1/v2, backfill/flag; theo SLO/error/saturation, pause/rollback binary trước destructive contract, roll-forward plan sau đó.

## N18 (3 điểm)

- 1 điểm: xác định policy chọn app Pod và egress isolation; cho UDP/TCP 53 tới kube-dns/CoreDNS đúng namespace/labels/IP theo implementation.
- 1 điểm: cho app tới DB selector/CIDR/service trên exact port/protocol và return traffic semantics; tránh hard-code endpoint biến động nếu có identity/selector tốt hơn.
- 1 điểm: `describe` policy/EndpointSlice/DNS config, debug pod có cùng labels/service account, DNS query/flow log/CNI metrics. Mở rule từng giả thuyết nhỏ, không `0.0.0.0/0`.

## N19 (3 điểm)

- 1 điểm: mỗi unique label set tạo series; `user_id/request_id` unbounded làm memory/index/ingest/query tăng. Chuyển request ID sang structured log/trace, user thành bounded cohort nếu cần.
- 1 điểm: metric labels allow-list/cardinality budget; aggregate/drop attributes ở SDK/Collector; head/tail/adaptive sampling giữ error/slow trace và không sample-away core SLI.
- 1 điểm: retention theo tier/use case, recording rule/downsample, cost/unit alert và schema lint/load test. Giữ privacy/redaction.

## N20 (3 điểm)

- 1 điểm: CI tạo SBOM/provenance, scan và ký digest bằng protected short-lived identity; registry immutable.
- 1 điểm: admission verify digest/signature/attestation, source/builder, severity/exception; enforce non-root, dropped capabilities, seccomp/read-only FS/resource/network policy phù hợp.
- 1 điểm: policy/controller HA và cached/verified policy; fail mode theo risk, break-glass time-bound/dual approval/audit, preapproved recovery image và game day. Không để bypass lâu dài.

