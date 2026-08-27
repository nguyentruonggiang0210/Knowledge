# Đáp án Quiz Kubernetes

Đề: `03-kubernetes-module-quiz.md`. Điểm thô tối đa **95**. Câu trả lời tốt nêu cơ chế, failure mode và evidence; YAML/lệnh tương đương đều được chấp nhận nếu đúng API của phiên bản cluster.

## Module 1 — Kiến trúc/API

**K01.** `kubectl` đọc kubeconfig/discovery rồi gửi request TLS tới API server. Request qua authentication → authorization → mutating admission → schema/default/validation + validating admission (thứ tự chi tiết plugin tùy config), được persist vào etcd; response không đồng nghĩa workload đã Ready. Watchers/controllers thấy desired state, tạo object con; scheduler chọn node; kubelet thực thi. Nên xem `status/conditions/events`, không chỉ kết quả apply.

**K02.** API server là frontend API; etcd là consistent key-value store chứa API data; scheduler chọn node cho unscheduled Pods; controller manager chạy reconciliation loops; cloud controller tích hợp node/route/load balancer cloud. etcd là nguồn persistence chuẩn, nhưng mọi access bình thường đi qua API server. [Components](https://kubernetes.io/docs/concepts/overview/components/).

**K03.** Kubelet quản Pod lifecycle trên node; runtime qua CRI pull image/tạo container; CNI plugin tạo Pod networking/IP/routes/policy tùy implementation; CSI cung cấp storage operations. kube-proxy hoặc dataplane khác hiện thực Service routing; không nhầm với CNI dù có implementation gộp.

**K04.** `spec` là mong muốn, `status` là quan sát do controller cập nhật. `generation` tăng khi desired fields đổi; condition/controller `observedGeneration` cho biết status đã xử lý generation nào, tránh đọc status cũ sau update.

**K05.** Sai. Deployment sở hữu ReplicaSet, ReplicaSet sở hữu Pods và controller sẽ reconcile/replace drift. Sửa Pod không đổi template và mất khi recreate; sửa Deployment/Git source rồi rollout.

**K06.** Client-side apply tính/giữ last-applied phía client annotation và gửi patch; server-side apply để API server merge, track `managedFields`/field manager. Hai manager sửa cùng field có thể conflict; resolve bằng phân quyền ownership/chuyển field hoặc force-conflicts có chủ ý, không force mù.

**K07.** Namespace scope names/resource names/RBAC bindings/quota/policy objects. Nó không tự tạo network isolation, node/kernel isolation, encrypted secret, cost boundary, hard tenant boundary hay chặn cluster-scoped resources. Cần NetworkPolicy, RBAC, quota, admission, Pod Security, node/runtime isolation và audit.

**K08.** CRD thêm API kind/schema; controller/operator watch custom resources và reconcile external/domain logic. CRD không có controller chỉ lưu object, không tạo side effect. Xóa CRD có thể xóa mọi custom resources; conversion/storage version, finalizers và controller compatibility sai có thể kẹt/xóa/corrupt logical state—backup, upgrade path và canary cần thiết.

## Module 2 — Workloads

**K09.** Scheduler bind Pod, không từng container; containers trong Pod cùng node/lifecycle fate, chia sẻ network namespace/IP/ports và volume khai báo, thường không chia process namespace trừ khi bật. Dùng Pod cho các process cần co-location/tightly coupled, không gom microservices tùy tiện.

**K10.** Init containers chạy tuần tự đến thành công trước app; sidecar là container hỗ trợ chạy cùng lifecycle (semantics sidecar native phụ thuộc API/version); ephemeral container được thêm để debug Pod đang chạy, không restart như app và không dành cho service bình thường.

**K11.** Phase là tóm tắt Pod (`Pending/Running/Succeeded/Failed/Unknown`); từng container có Waiting/Running/Terminated và restart history. Pod `Running` chỉ nói đã bind và ít nhất một container chưa terminated; Ready condition mới liên quan sẵn sàng nhận traffic.

**K12.** OwnerReference tạo graph ownership; foreground/background/orphan propagation quyết định xóa dependents. Deployment delete thường garbage-collect ReplicaSets/Pods theo propagation; không xóa tùy tiện object có owner/finalizer trước khi hiểu tác động.

**K13.** `maxSurge` giới hạn Pod vượt desired trong rollout; `maxUnavailable` giới hạn unavailable. Chỉ Pod Ready/available sau `minReadySeconds` được tính availability; readiness tốt ngăn traffic/rollout tiến quá sớm. `progressDeadlineSeconds` đánh dấu rollout không tiến triển (không tự rollback mặc định); observe/pause/undo theo policy.

**K14.** `Recreate` xóa Pods cũ trước tạo mới; dùng khi hai version không thể coexist hoặc singleton constraint, chấp nhận downtime. Nó không bảo đảm tuyệt đối “chỉ một Pod” trong mọi manual race; app/data migration vẫn phải an toàn.

**K15.** StatefulSet cho ordinal/name/DNS/PVC identity và ordered create/delete/update. Nó không cấu hình replication, leader election, quorum, schema migration, backup hay consistency của database; đó là trách nhiệm app/operator/storage process.

**K16.** Node agent → DaemonSet; batch hữu hạn → Job; lịch → CronJob. [DaemonSet](https://kubernetes.io/docs/concepts/workloads/controllers/daemonset/) và [Job](https://kubernetes.io/docs/concepts/workloads/controllers/job/).

**K17.** `completions`: số completion cần; `parallelism`: tối đa Pods song song; `backoffLimit`: retry trước Failed; `activeDeadlineSeconds`: deadline wall-clock (có thể ưu tiên hơn retry). Job có thể chạy lặp/duplicate do failure nên side effect phải idempotent; `ttlSecondsAfterFinished` cleanup object sau hoàn tất, log/result phải ship trước.

**K18.** `Allow/Forbid/Replace` kiểm soát run chồng; starting deadline xử lý missed schedule; history limits tránh phình object; timezone tránh lệch DST/zone của controller. Job vẫn cần idempotency vì scheduling gần đúng có thể có duplicate/missed trong edge case.

**K19.** Pod trần không được controller thay thế/scale/rollout declaratively. Ngoại lệ: debug/one-off thử nghiệm disposable, hoặc static Pod control-plane bootstrapping (không phải app production thông thường).

## Module 3 — Config/identity/security

**K20.** Env được chụp lúc process start, không tự đổi. Projected ConfigMap/Secret volume được kubelet cập nhật eventual (trừ `subPath`, có caveat); app phải watch/reload hoặc rollout. Versioned immutable config + checksum rollout thường dễ audit hơn hot reload không đồng bộ.

**K21.** `data` nhận base64-encoded bytes; `stringData` nhận clear string và API merge vào data. Base64 là encoding, không encryption. Không commit cả hai với giá trị thật.

**K22.** Bật encryption at rest và bảo vệ KMS/key; RBAC least privilege và tách namespace; giảm token automount; external store/Secrets Store CSI nếu threat model; rotate/revoke và rollout consumers; audit API/KMS; tránh env/log/debug dumps; backup/restore keys cùng data có kiểm soát. [Secret caution](https://kubernetes.io/docs/concepts/configuration/secret/).

**K23.** ServiceAccount gắn workload identity/token audience-bound/short-lived tùy setup để gọi API hoặc workload identity provider. Tắt automount khi app không gọi API, giảm token bị lấy sau compromise; dùng SA riêng thay default và chỉ bind permission cần.

**K24.** Role namespaced; ClusterRole cluster-scoped và có thể chứa cluster/namespaced rules. RoleBinding cấp quyền trong một namespace cho subjects và có thể tham chiếu ClusterRole để tái dùng bộ rule nhưng scope grant vẫn namespace. ClusterRoleBinding grant cluster-wide.

**K25.** Wildcard tự bao phủ resources/verbs tương lai; cluster-admin toàn quyền. Tạo Pod có thể mount Secret/SA hoặc host resources nếu admission cho phép; `bind/escalate/impersonate` cho phép tự tăng/đóng vai quyền; đọc Secret thường lấy credentials có quyền khác. Đánh giá permission theo đường escalation, không chỉ tên verb.

**K26.** Cốt lõi:

```yaml
spec:
  securityContext:
    runAsNonRoot: true
    seccompProfile:
      type: RuntimeDefault
  containers:
    - name: app
      securityContext:
        allowPrivilegeEscalation: false
        readOnlyRootFilesystem: true
        capabilities:
          drop: ["ALL"]
        runAsUser: 10001
        runAsGroup: 10001
```

Thêm writable `emptyDir`/tmpfs đúng path, `fsGroup` hoặc add capability cụ thể chỉ khi app cần. Không đặt UID 0 cùng `runAsNonRoot`.

**K27.** Privileged không hạn chế; Baseline chặn known privilege escalation phổ biến; Restricted theo hardening chặt. Pod Security Admission enforce/audit/warn qua **namespace labels** theo version; system namespaces/workloads cần policy/exception có chủ ý. [Pod Security Standards](https://kubernetes.io/docs/concepts/security/pod-security-standards/).

**K28.** Mutating thay request/default/sidecar; validating chấp nhận/từ chối sau mutation. Webhook latency/failure có thể chặn hoặc bỏ qua admission tùy `failurePolicy`; timeout/HA/match scope/version/reinvocation và break-glass phải thiết kế để không làm API outage hoặc bypass security.

**K29.** Pull secret để kubelet/runtime auth registry; app secret được process dùng runtime; build secret chỉ builder dùng tạm để lấy dependency. Tách identity, scope, storage, rotation/audit; không tái dùng một credential cho ba giai đoạn.

## Module 4 — Networking

**K30.** Mỗi Pod có IP cluster-wide; containers trong Pod dùng chung network namespace/localhost; Pods giao tiếp trực tiếp theo model không cần NAT giữa Pod (trừ intentional policy/implementation edge). Pod IP ephemeral; dùng Service cho stable discovery. [Networking model](https://kubernetes.io/docs/concepts/services-networking/).

**K31.** Controller tìm Pods khớp selector và tạo/update EndpointSlices; endpoint readiness thường theo Pod Ready nên not-ready không nhận traffic mặc định. Selector đúng nhưng `targetPort` sai vẫn có endpoint mà connect lỗi.

**K32.** ClusterIP stable virtual endpoint nội bộ; headless (`clusterIP: None`) trả trực tiếp endpoint records cho peer discovery; NodePort mở port node; LoadBalancer yêu cầu provider/controller cấp external LB; ExternalName trả DNS CNAME, không proxy/select Pod.

**K33.** FQDN gồm service `api`, namespace `team-a`, `svc`, cluster domain `cluster.local`. Pod resolver search list thường thử `<current-ns>.svc...`, `svc...`, cluster domain; gọi `api` từ namespace khác ưu tiên service cùng namespace và có thể fail/resolve nhầm. Dùng `api.team-a` hoặc FQDN khi cross-namespace; kiểm tra actual `/etc/resolv.conf`/cluster domain.

**K34.** `port` là port Service; `targetPort` port/name backend Pod; `nodePort` port trên mỗi node khi type phù hợp; named port giúp Service/NetworkPolicy tham chiếu tên nhưng phải nhất quán với container port semantics.

**K35.** Service LB chủ yếu L4 endpoint; Ingress/Gateway cung cấp L7 host/path/TLS và richer routing. API object chỉ desired config; cần controller + data plane + class/status/address. Gateway API tách role/route tốt hơn và có khả năng mở rộng, tùy implementation.

**K36.** Khi một policy type select Pod, traffic hướng đó chỉ được allow bởi hợp của tất cả rules policy; policy không có deny rule ưu tiên. Empty selector + no ingress/egress rules tạo default-deny cho type. Deny egress chặn cả DNS, nên allow UDP/TCP DNS tới correct namespace/pods/IP theo CNI/environment. [NetworkPolicy](https://kubernetes.io/docs/concepts/services-networking/network-policies/).

**K37.** Cùng một `from` item chứa cả `namespaceSelector` và `podSelector` là **AND**: Pod label trong namespace label. Hai list items riêng là **OR**; podSelector-only thường xét Pods cùng namespace với policy. Indentation YAML thay semantics nghiêm trọng.

**K38.** Xem `/etc/resolv.conf`, `dnsPolicy/dnsConfig`, thử FQDN và direct DNS query → check DNS Service/EndpointSlice → CoreDNS Pods Ready/log/config/metrics → connectivity Pod→DNS port 53 TCP/UDP, NetworkPolicy/CNI/kube-proxy/dataplane → CoreDNS upstream for external names. So sánh node/namespace để khoanh vùng; không restart CoreDNS trước evidence.

**K39.** Controller/class/address; rule host/path/pathType; TLS/SNI/cert; referenced Service namespace/name/port; EndpointSlice readiness; backend protocol HTTP/HTTPS/gRPC; rewrite annotations/filters; health check; NetworkPolicy controller→backend; controller logs/events/config reload; timeout/body limits. Vì direct Service works, ưu tiên L7/controller config/path/protocol.

## Module 5 — Storage

**K40.** `emptyDir` sống theo Pod và chia giữa containers, mất khi Pod xóa; config/secret volumes projected read-only-ish config lifecycle; `hostPath` gắn node và rủi ro host; PVC request persistent storage có lifecycle độc lập Pod và portable qua CSI/storage constraints.

**K41.** PVC yêu cầu capacity/access/class; StorageClass chỉ provisioner/parameters/topology/reclaim; external CSI provisioner tạo PV/backend volume; PV bind PVC; kubelet/CSI node plugin stage/publish/attach qua controller components nếu driver cần. [Persistent Volumes](https://kubernetes.io/docs/concepts/storage/persistent-volumes/).

**K42.** RWO một node read-write, ROX nhiều node read-only, RWX nhiều node read-write, RWOP một Pod read-write. Access mode chủ yếu matching/mount topology, không luôn enforce quyền write bên trong filesystem sau mount; driver capabilities quyết định.

**K43.** Delete thường xóa backend storage khi PV released; Retain giữ asset để manual recovery/cleanup. Default dynamic policy lấy từ StorageClass (thường Delete nếu không chỉ định); kiểm tra trước xóa PVC và test restore.

**K44.** Immediate provision trước khi biết Pod node có thể chọn zone không phù hợp. WaitForFirstConsumer trì hoãn binding/provision đến scheduling context, chọn topology thỏa affinity/resources; tránh deadlock zone.

**K45.** `get/describe pvc,pv,sc`, events; provisioner/controller + CSI logs/status; StorageClass tồn tại/default/provisioner/parameters; capacity/quota; access mode/volumeMode; selector/prebind; allowed topology/zone; credentials/provider quota; finalizer/backend errors. Không xóa PVC trước xác định reclaim/data.

**K46.** Snapshot thường point-in-time ở storage, có thể chỉ crash-consistent và cùng failure domain/account; cần app quiesce/native coordination, retention/encryption/copy off-cluster, catalog/checksum và restore drill. RPO là dữ liệu có thể mất, RTO thời gian phục hồi đo thực tế; snapshot không thay logical backup/replication. [Volume snapshots](https://kubernetes.io/docs/concepts/storage/volume-snapshots/).

## Module 6 — Resources/scheduling

**K47.** Scheduler bin-pack theo requests; CPU limit là throttling hard quota, memory limit được kernel enforce phản ứng qua OOM under pressure. Nếu set limit mà không request và không admission default khác, Kubernetes có thể copy limit thành request. Vì vậy chỉ limit cao có thể làm Pod khó schedule. [Resource management](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/).

**K48.** Guaranteed: mọi container có CPU+memory request=limit; BestEffort: không có CPU/memory request/limit; còn lại Burstable. Khi node pressure, eviction xét usage vượt request, priority và relative usage/QoS-related ordering; QoS không phải cam kết tuyệt đối chống eviction/app OOM.

**K49.** LimitRange đặt min/max/ratio/default per container/Pod/PVC ở admission; ResourceQuota giới hạn tổng consumption/object count theo namespace. Dùng cùng để tránh object không request và chặn một team dùng hết quota. [LimitRange](https://kubernetes.io/docs/concepts/policy/limit-range/).

**K50.** nodeSelector đơn giản hard labels; node affinity có required/preferred expressions; pod affinity co-locate theo topology, anti-affinity tách replicas; topology spread cân bằng domains với skew/unsatisfiable behavior. Hard rules có thể làm Pending; soft rules có thể không đạt khi thiếu capacity; label trust phải bảo vệ.

**K51.** NoSchedule chặn schedule mới; PreferNoSchedule là soft; NoExecute còn evict Pods không tolerate (và có `tolerationSeconds`). Toleration chỉ bỏ rào cản taint, không chọn node—phải thêm affinity/selector nếu muốn dedicated placement.

**K52.** Priority đưa Pod lên queue và có thể preempt lower-priority Pods, gây churn/starvation; bảo vệ quyền tạo PriorityClass/usage. Scheduler cố tránh vi phạm PDB khi chọn victim nhưng PDB với preemption là best effort, không tuyệt đối; priority và QoS là trục khác. [Priority/preemption](https://kubernetes.io/docs/concepts/scheduling-eviction/pod-priority-preemption/).

**K53.** Voluntary: drain/eviction/rollout/operator actions; node-pressure eviction do kubelet resource pressure; API Eviction subresource đi qua disruption checks/PDB; direct delete không tôn trọng PDB. PDB chỉ hạn chế voluntary evictions phù hợp, không ngăn node failure/OOM/delete/rollout availability config.

**K54.** cordon đánh unschedulable; drain evict workload Pods và xử lý DaemonSet/local data flags; uncordon cho schedule lại. Trước drain: PDB/disruptionsAllowed, replicas/quorum, spare capacity/topology, DaemonSet/static Pod, local/emptyDir data, maintenance window, owner/rollback và cluster/control-plane health.

## Module 7 — Reliability/operations

**K55.** Startup probe gọi endpoint “process initialization complete”, failure threshold × period > 90s; khi pass mới bật liveness/readiness. Readiness kiểm tra app có thể phục vụ (có thể phản ánh critical local state), liveness chỉ deadlock/internal irrecoverable state; không phụ thuộc DB ngoài để tránh restart cascade. Các con số hợp lý có load-test được đều chấp nhận. [Probes](https://kubernetes.io/docs/concepts/workloads/pods/probes/).

**K56.** Khi terminate, endpoint readiness/terminating state phải rời dataplane; app nhận TERM, ngừng accept, drain in-flight, flush và thoát trong grace. `preStop` có thể delay/drain hook nhưng thời gian tính trong grace; tránh sleep mù, đặt LB drain/keepalive và grace theo p99 request. SIGKILL nếu quá hạn.

**K57.** CPU utilization xấp xỉ usage/request trung bình theo eligible Pods; thiếu request khiến metric không xác định/bị bỏ, HPA condition báo lỗi. Cần metrics API (thường metrics-server) hoặc custom/external adapters; set requests từ đo tải. Stabilization windows, scale policies và readiness handling giảm flapping; noisy/lagging metric, cold start và target sát gây oscillation. [HPA](https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/).

**K58.** HPA đổi replicas; VPA đề xuất/thay requests/limits và có thể restart Pods; node autoscaler đổi nodes theo unschedulable/capacity. HPA CPU percentage và VPA cùng sửa requests có thể feedback/conflict; đặt ownership/mode và test. Node scale chậm nên cần headroom.

**K59.** Với 5 và quorum 3, `minAvailable: 3` diễn đạt quorum trực tiếp hoặc `maxUnavailable: 2`; tài liệu thường khuyến nghị maxUnavailable cho scale biến động, nhưng scaling xuống dưới quorum semantics cần guard. PDB chỉ voluntary, không cứu hai node crash; cũng có thể block drain.

**K60.** `get pod -o wide`/status/restarts → `describe` + events/lastState/exit/OOM/probe → `logs` và `logs --previous` đúng container → inspect Deployment/ReplicaSet/image digest/command/env refs/mounts → ConfigMap/Secret presence (không in secret) → requests/limits/node pressure → probe path/port/timing → `rollout history/diff` và recent changes. Mitigate rollback nếu blast radius; reproduce/debug image/ephemeral container rồi validate stable Ready/restarts.

**K61.** Pending condition/events trước. `FailedScheduling`: resources, affinity/taint/topology, quota; PVC Pending: storage branch; image pull thường Pod đã scheduled và container Waiting, xem kubelet events/secret/registry; admission thường create request bị reject chứ object Pending; quota có reject hoặc resource constraints; custom scheduler/profile/name and scheduler logs. Không gom mọi Pending thành “thiếu CPU”.

**K62.** Metrics định lượng trend/alert; logs chi tiết discrete event/context; traces nối spans/latency dependency; Events là best-effort cluster object changes/diagnostic ngắn hạn, TTL/aggregation có thể mất nên không dùng như audit/log retention. [Observability](https://kubernetes.io/docs/concepts/cluster-administration/observability/).

**K63.** Golden signals: traffic, error rate, latency distributions, saturation; SLI và SLO ví dụ 99.9% requests thành công dưới threshold trong 30 ngày. Page trên fast burn/multi-window error-budget burn có user impact; ticket cho slow capacity trend/cost/cert expiry xa. Alert phải actionable, có owner/runbook và tránh page chỉ vì CPU nếu SLO khỏe.

**K64.** Inventory/version skew/deprecated APIs (`kubectl`/scanner) → compatibility runtime/CNI/CSI/ingress/metrics/operators/CRDs/webhooks → etcd/config/data backups + **restore test** → canary non-prod/control-plane theo provider path → node pools surge, cordon/drain theo PDB/capacity → validate DNS/network/storage/RBAC/workloads/SLO → rollback giới hạn bởi etcd/schema/provider; upgrade từng minor theo policy và giữ change window/communication.

## Module 8 — Packaging/delivery/multi-tenancy

**K65.** Helm chart parameterizes/templates/package dependencies và tracks release; Kustomize patches declarative base bằng overlays không template language. Chọn Helm cho distributable app/options/release ecosystem; Kustomize cho variants patch rõ; có thể render Helm rồi policy/Kustomize nhưng phải giữ ownership/order/debuggability, không tạo hai nguồn truth.

**K66.** GitOps controller liên tục pull desired state, phát hiện/sửa drift, có Git audit/review và rollback bằng revert; manual apply là push một lần, dễ drift/out-of-band khó audit. GitOps vẫn cần secret strategy, health gate, emergency procedure và tránh controller tự hoàn tác mitigation không ghi Git.

**K67.** CI build/test/scan/sign một lần và publish digest. Mỗi env chỉ đổi config/desired digest reference qua PR/approval; verify policy/signature; staging tests cùng digest; prod canary/blue-green/rolling với SLO gates; promote reference, không rebuild; rollback về digest/config version đã biết tốt.

**K68.** Sáu lớp bất kỳ: RBAC least privilege; default-deny NetworkPolicy; ResourceQuota/LimitRange; Pod Security Admission/admission policies; separate ServiceAccounts/workload identity; secret/KMS isolation; trusted node pools/runtime sandbox; topology; API Priority/Fairness/quota; audit; image policy; ingress/egress; cluster-scoped resource governance; backup/key separation. Hard hostile tenants có thể cần separate clusters.

**K69.** Git bảo desired manifests nhưng không runtime data/secret; etcd chứa API state; Secrets cần encryption keys/KMS/certs; PV/database có consistency riêng. Restore thường dựng compatible control plane/addons/CRDs first, restore API or reapply Git theo chosen DR model, restore identities/keys safely, rồi storage/apps theo dependency/quorum; tránh double-controller/external side effects và validate end-to-end.

**K70.** Managed giảm gánh control-plane HA/patch/etcd nhưng vẫn user chịu nodes/workloads/addons/security config tùy shared responsibility; có provider integration/limits/version cadence/egress/cost/lock-in. Self-managed tăng control/portability/tuning nhưng cần 24/7 expertise, backup/upgrade/cert/HA. Quyết định dựa SLO/compliance/team/TCO/exit plan, không chỉ giá VM.

## Nguồn chính thức trọng yếu

- [Workloads](https://kubernetes.io/docs/concepts/workloads/)
- [Services and networking](https://kubernetes.io/docs/concepts/services-networking/)
- [Persistent Volumes](https://kubernetes.io/docs/concepts/storage/persistent-volumes/)
- [RBAC good practices](https://kubernetes.io/docs/concepts/security/rbac-good-practices/)
- [Pod Security Standards](https://kubernetes.io/docs/concepts/security/pod-security-standards/)
- [PDB](https://kubernetes.io/docs/tasks/run-application/configure-pdb/)
- [Logging architecture](https://kubernetes.io/docs/concepts/cluster-administration/logging/)
