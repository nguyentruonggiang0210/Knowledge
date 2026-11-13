## Mental model: container là tiến trình được cô lập

Docker không tạo ra một “máy ảo nhỏ” cho mỗi ứng dụng. Một container Linux trước hết là một cây tiến trình chạy trên kernel dùng chung, được đặt vào các namespace để có góc nhìn riêng về PID, mount, network, hostname và IPC; cgroup đo hoặc giới hạn CPU, RAM, PID và I/O; capability, seccomp và AppArmor/SELinux thu hẹp quyền. Trên Windows hoặc macOS, Docker Desktop chạy Linux container bên trong một Linux VM, vì vậy hành vi mount, network và hiệu năng không hoàn toàn giống native Linux.

Image là gói bất biến gồm filesystem layers và metadata; container là một instance được tạo từ image cộng runtime configuration và writable layer. Registry phân phối các repository image. Tag là tên có thể trỏ lại, còn digest định danh nội dung bất biến. Luồng điều khiển đi từ Docker CLI/API tới `dockerd`, `containerd`, OCI runtime như `runc`, rồi tới kernel. Việc hiểu chuỗi này giúp phân biệt lỗi client/context, daemon, image, runtime và ứng dụng thay vì gọi mọi thứ là “Docker lỗi”.

Container sống theo PID 1. Khi tiến trình này kết thúc, container dừng. PID 1 phải nhận hoặc forward signal, reap child process và hoàn tất shutdown trước grace period. Exec form của `ENTRYPOINT`/`CMD` thường giữ ứng dụng làm PID 1; wrapper script nên kết thúc bằng `exec`. Isolation mặc định hữu ích nhưng không phải sandbox tuyệt đối: `--privileged`, Docker socket, host PID/network, device hoặc host filesystem mount có thể làm thay đổi hoàn toàn threat model.

## Vòng đời container và cách dùng CLI có bằng chứng

`docker run` là tổ hợp pull nếu cần, create, start và có thể attach. Tách các bước giúp quan sát trạng thái rõ hơn. Trước mọi thao tác, phải xác nhận `docker context show`, client/server version và daemon đích; một CLI có thể điều khiển host từ xa nên nhầm context là một failure mode thực tế. Sau đó dùng `docker compose ps -a`, `docker inspect`, `docker logs`, `docker events`, `docker stats` và `docker system df -v` để xây timeline.

Exit code chỉ là manh mối. `137` thường tương ứng SIGKILL nhưng có thể do OOM hoặc operator kill; cần đối chiếu `State.OOMKilled`, event và telemetry host. `143` thường là SIGTERM. `exec` tạo process mới trong namespace hiện tại và không sửa image; sửa file bằng `exec` chỉ tạo drift trong writable layer. `attach` nối vào stdio của PID 1 nên có thể truyền signal ngoài ý muốn. Image tối giản có thể không có shell; khi điều tra nên dùng ephemeral toolbox hoặc cơ chế debug được phê duyệt thay vì bake công cụ mạnh vào runtime image.

Cleanup phải theo phạm vi và ownership. Stopped container có thể là evidence, cache giúp CI nhanh, volume có thể chứa dữ liệu. Không biến `docker system prune -a --volumes` thành cron mù. Inventory trước, có retention policy và xác nhận owner trước mọi thao tác xóa.

## Image, layer, registry và artifact bất biến

OCI image gồm manifest, config và các layer content-addressed. Nhiều image chia sẻ layer; mỗi container có upper writable layer riêng theo cơ chế copy-on-write. Sửa một file từ lower layer có thể copy-up dữ liệu; xóa file ở instruction sau chỉ tạo whiteout che file cũ chứ không thu hồi byte đã tồn tại trong layer trước. Vì vậy muốn image nhỏ phải tránh đưa dữ liệu thừa vào layer ngay từ đầu, không phải copy rồi xóa ở bước sau.

Production nên build một lần, kiểm thử đúng digest, scan và áp policy, push registry, ký artifact rồi promote cùng digest qua các môi trường. `latest` chỉ là tag mặc định, không chứng minh ổn định. Tag Git SHA hoặc SemVer hỗ trợ con người, nhưng deploy digest mới ngăn tag drift. Pin base digest cải thiện reproducibility, đồng thời cần automation cập nhật digest để không giữ bản vá lỗi thời mãi mãi.

Registry cần TLS, authentication, RBAC theo repository, immutable release tags nếu hỗ trợ, retention không xóa artifact đang chạy hoặc cần rollback, capacity monitoring, replication và restore test. `docker image save/load` giữ image config, tag và layer, phù hợp air-gap hơn `container export/import`, vốn flatten filesystem và mất phần lớn history/metadata. Dù truyền bằng tar hay registry, digest và chữ ký vẫn phải được xác minh.

## Dockerfile thực chiến, BuildKit và supply chain

Dockerfile tốt tách build stage khỏi runtime stage, copy dependency manifest/lockfile trước source để giữ cache, dùng `.dockerignore` loại Git, secret, cache và output, rồi chỉ copy artifact cần thiết sang final image. Runtime nên tối giản nhưng vẫn có CA certificate, timezone hoặc thư viện thật sự cần. `scratch`, distroless và Alpine đều có trade-off về compatibility và khả năng debug; chọn bằng dependency và runbook, không chỉ bằng kích thước.

`RUN` xảy ra lúc build; `CMD` cho default command/argument; `ENTRYPOINT` xác định executable; `EXPOSE` chỉ là metadata chứ không publish port. `ARG` và `ENV` không phải nơi giữ secret vì metadata/layer/history có thể làm lộ. Dùng user non-root có UID/GID rõ, `COPY --chown` thay vì chown toàn cây ở layer sau, và tránh `chmod 777` để chữa lỗi mount.

BuildKit mô hình hóa build thành graph, chạy bước độc lập song song và hỗ trợ cache mount, secret mount, SSH mount cùng cache import/export. Cache mount tăng tốc nhưng không thay lockfile. Secret mount chỉ tồn tại trong bước build nếu lệnh không tự ghi nó vào artifact hoặc log. Buildx tạo builder và multi-platform image; QEMU tiện nhưng chậm và có khác biệt, còn native node hoặc cross-compile thường tốt hơn khi pipeline lớn.

Supply chain hoàn chỉnh phân biệt bốn bằng chứng: SBOM liệt kê thành phần, vulnerability scan đối chiếu advisory, provenance mô tả nguồn/cách build, signature xác nhận publisher. Không bằng chứng nào tự thay thế các bằng chứng còn lại. Pipeline phải build once, test, tạo attestation, triage scan, push tag bất biến, ký, deploy digest và verify digest ở runtime.

## Docker networking: đi theo từng hop

Trên user-defined bridge, container có network namespace, interface và IP riêng; veth nối vào bridge, Docker DNS phân giải service/container name, còn host NAT/firewall xử lý published port. Ba khái niệm dễ nhầm phải tách rõ: ứng dụng phải listen đúng interface và container port; `EXPOSE` chỉ mô tả; `-p HOST_IP:HOST_PORT:CONTAINER_PORT` mới publish. Nếu app chỉ bind `127.0.0.1` bên trong container, peer và port mapping thường không tới được.

Container cùng network gọi nhau bằng service name và container port, không cần publish ra host. Database nội bộ thường chỉ nằm trên backend network; proxy ở frontend; API nối cả hai. `localhost` luôn là chính network namespace hiện tại, không phải host hay container khác. `depends_on` không chữa DNS hoặc readiness, và hard-code container IP sẽ hỏng khi recreate.

Runbook mạng đi từ trong ra ngoài: process có listen không; container có network/route nào; hai service có network chung và DNS resolve không; peer gọi container port được không; port có bind đúng host IP không; host firewall/VPN/cloud rule ra sao; TLS/SNI có đúng không. Không chuyển sang host network chỉ để che lỗi DNS, vì đó là bỏ isolation thay vì tìm nguyên nhân.

## Docker storage: persistence không đồng nghĩa backup

Writable layer đi theo container và mất khi remove/recreate. Named volume phù hợp dữ liệu cần sống qua container lifecycle; bind mount phù hợp source/config do host quản lý nhưng tạo coupling với path và permission; tmpfs dành cho dữ liệu tạm không cần persist; remote driver phải được kiểm tra locking, fsync, latency và reconnect. Mount vào một path sẽ che nội dung image tại path đó, một nguyên nhân phổ biến của hiện tượng “file biến mất”.

Numeric UID/GID và SELinux/AppArmor label quyết định quyền thật. Init/migration task có thể chuẩn bị ownership theo quyền tối thiểu; không chạy runtime root chỉ để tránh xử lý permission. Compose `down` giữ named volume mặc định, còn `down -v` là destructive. Project name thay đổi có thể khiến app trỏ sang volume có tên khác và tưởng dữ liệu mất.

Volume chỉ giải quyết persistence cục bộ. Nó không bảo vệ khỏi xóa nhầm, corruption, ransomware, host failure hay lỗi logic. Backup cần consistency bằng database-native dump/snapshot phối hợp, bản sao ngoài failure domain, mã hóa, retention, monitoring và restore drill định kỳ. Kết quả cần đo bằng RPO, RTO, checksum/schema và business invariant; trạng thái “backup job xanh” chưa chứng minh khôi phục được.

## Compose từ development đến production một host

Compose mô tả services, networks, volumes, configs và secrets theo application model. Nó rất phù hợp development, integration test và hệ thống một host chấp nhận failure domain đó; nó không tự cung cấp scheduler đa node, cluster control plane, autoscaling hoặc self-healing khi host chết. `docker compose config` là bước bắt buộc để xem model sau interpolation, merge và override; không suy đoán từ từng file rời.

Short-form `depends_on` chỉ tạo thứ tự start. Điều kiện health hoặc one-shot migration giúp startup có trật tự, nhưng ứng dụng vẫn phải timeout, backoff, reconnect và chịu dependency chết sau khi đã chạy. Interpolation `${VAR}` xảy ra ở Compose CLI, khác với environment trong container. `.env` không phải secret store; Compose secret file tốt hơn env trong inspect/log nhưng host source file vẫn cần ACL và rotation.

Production một host cần image digest đã build sẵn, không bind mount source, network segmentation, chỉ proxy publish port, non-root/read-only rootfs, giới hạn tài nguyên, log rotation, TLS proxy, backup off-host, monitoring, system service, deploy/rollback và host patching. Khi yêu cầu chuyển thành nhiều node, host self-healing, scheduler, autoscaling, policy hoặc multi-team isolation, đó là tín hiệu cân nhắc orchestrator thay vì kéo dài Compose quá khả năng.

## Docker security, reliability và quản trị tài nguyên

Threat model bắt đầu từ source/dependency, builder, registry, daemon, container process, network, mount, data và secret. Docker socket hoặc quyền gọi daemon thông thường gần tương đương đặc quyền root host; không mount socket cho tiện và không expose API TCP thiếu TLS/auth. Baseline runtime gồm non-root numeric user, root filesystem read-only, tmpfs cho path cần ghi, drop capability, `no-new-privileges`, seccomp mặc định, PID/CPU/RAM limit và mount/network tối thiểu.

Rootless daemon, user namespace mapping và non-root app giải quyết các lớp khác nhau, có thể dùng cùng nhau. Secret cần lifecycle tạo, phân phối least privilege, dùng không log, rotate, revoke và audit. Không để secret trong Dockerfile `ARG`/`ENV`, source, build context hoặc layer rồi hy vọng lệnh `rm` ở bước sau xóa được lịch sử.

Restart policy không thay sửa lỗi. Crash loop có thể tạo retry storm lên dependency. Docker healthcheck chỉ có một trạng thái health, không đầy đủ startup/readiness/liveness như Kubernetes, và standalone Engine không tự restart container chỉ vì `unhealthy`. App phải graceful shutdown, startup idempotent, giới hạn concurrency/pool/body, có timeout, retry budget, exponential backoff và jitter. CPU limit gây throttle; memory limit có thể OOM; request/capacity logic và telemetry phải được đo trước khi chọn số.

## Logging, metrics, tracing và debugging Docker

Ứng dụng nên ghi structured log ra stdout/stderr với timestamp, level, service, event và trace/request correlation nhưng không chứa token hoặc PII. Logging driver phải có rotation; remote driver blocking có thể ảnh hưởng app, non-blocking có thể drop log. Metrics cần bao phủ runtime/host, RED của request, USE của tài nguyên và business signal có cardinality được kiểm soát. Request ID không phải metric label phù hợp.

Container không tự sinh distributed trace; app hoặc proxy phải propagate context và export span. Dashboard cần correlation với image digest/deploy event, restart/OOM, disk/inode, dependency và SLO. Alert phải link runbook với user impact, query đọc-only, mitigation, owner và escalation.

Khi sự cố xảy ra, không restart hoặc prune trước khi giữ evidence. Ghi context, digest, config resolved, state, recent deploy và timeline. Khoanh tầng build, start, exit, health, reachability, resource, dependency và data. Các symptom như `exec format error`, permission denied, exit 137, empty DNS, data “mất” hay disk đầy đều cần evidence riêng. Fix phải được đưa lại vào Dockerfile/Compose/Git, không để một thay đổi `exec` thành cấu hình bí mật của production.

## Kubernetes: API, desired state và reconciliation

Kubernetes là hệ thống điều khiển phân tán. Client gửi desired state tới API server; request đi qua authentication, authorization, admission và validation rồi được lưu trong etcd. Controller watch object và reconcile; scheduler bind Pod chưa có node; kubelet trên node dùng CRI, CNI và CSI để tạo container, network và volume rồi cập nhật status. `kubectl apply` thành công chỉ chứng minh API chấp nhận object, không chứng minh workload Ready.

`spec` là desired state, `status` là observed state. Label dùng selection; annotation dùng metadata không select. `generation` và `status.observedGeneration` cho biết controller đã xử lý spec mới chưa; `resourceVersion` phục vụ concurrency/watch, không phải version ứng dụng. Deployment sở hữu ReplicaSet, ReplicaSet sở hữu Pod qua owner reference; finalizer giữ object ở trạng thái terminating đến khi cleanup hoàn tất. Không gỡ finalizer mù quáng khi backend resource còn tồn tại.

Server-Side Apply theo dõi field ownership. Conflict thường là tín hiệu hai actor cùng quản một field; force conflict không giải quyết ownership mơ hồ. CRD mở rộng API và operator reconcile lifecycle domain, chỉ đáng dùng khi có state machine lặp lại, status/conditions, retry, upgrade và DR rõ ràng.

## Workload, rollout và graceful lifecycle trên Kubernetes

Pod là đơn vị schedule nhỏ nhất, disposable và có thể chứa app, init, sidecar hoặc ephemeral debug container chia sẻ network/volume theo thiết kế. Deployment dành cho replica thay thế được; StatefulSet cung cấp ordinal, network identity và PVC riêng nhưng không tự tạo replication/quorum/backup; DaemonSet đặt agent trên mỗi node phù hợp; Job/CronJob cho tác vụ hữu hạn và phải idempotent vì có thể chạy lại.

Rolling update phụ thuộc `maxSurge`, `maxUnavailable`, readiness, capacity, `minReadySeconds` và progress deadline. Kubernetes không tự rollback Deployment chỉ vì rollout kẹt. Production deploy digest bất biến; config thay ngoài Pod template không tự tạo rollout nếu không có hash/checksum strategy. Migration schema nên expand, chạy code tương thích hai phiên bản, backfill/verify rồi mới contract.

Khi Pod terminate, endpoint được cập nhật bất đồng bộ, kubelet chạy `preStop` nếu có, gửi SIGTERM, rồi SIGKILL khi hết grace period. App phải ngừng nhận request, drain và đóng dependency trong budget. Readiness fail rút endpoint nhưng không restart; liveness fail có thể restart; startup probe bảo vệ app khởi động chậm. Liveness không nên gọi mọi downstream vì một database outage có thể biến thành fleet-wide restart storm.

## Scheduling, resources, disruption và autoscaling

Scheduler filter node theo request, port, taint, affinity và volume topology rồi score và bind. CPU/memory request quyết định placement và là tín hiệu capacity; CPU limit throttle, memory limit có thể OOM. Pod Pending không luôn là thiếu CPU: Events có thể cho thấy taint, quota, affinity, volume zone hoặc port conflict. Taint repel Pod; toleration chỉ cho phép chứ không đảm bảo placement. Affinity, anti-affinity và topology spread cần cân với capacity để không biến HA rule quá chặt thành unschedulable.

PDB giới hạn voluntary disruption qua Eviction API như drain, không cứu node crash và không phải giới hạn chung cho rollout hoặc HPA scale-down. Drain phải đọc lý do bị chặn, tính availability và capacity trước khi force. Requests/limits, QoS, eviction threshold và ephemeral storage cùng quyết định hành vi khi node pressure.

HPA là control loop có độ trễ: metric, recommendation, Deployment, scheduler, có thể thêm node provision, image pull, startup và readiness. CPU utilization cần CPU request đúng; memory cache/leak có thể không giảm khi thêm replica; queue lag phải xét partition và poison message. `minReplicas`, max capacity, stabilization và downstream guardrail phải theo SLO. GitOps và HPA không được tranh ownership `spec.replicas`. Autoscaling không sửa slow query, lock contention hoặc kiến trúc không scale ngang.

## Kubernetes networking và đường đi của traffic

Mỗi Pod thường có IP routable trong cluster do CNI; các container trong Pod dùng chung network namespace. Service chọn Pod bằng label selector và cung cấp virtual IP/DNS ổn định; EndpointSlice mới là bằng chứng endpoint thực. Sai selector có thể tạo Service hợp lệ nhưng không có endpoint. `port`, `targetPort`, protocol, named port và readiness đều phải khớp.

Ingress resource không tự route nếu thiếu Ingress controller. Gateway API tách hạ tầng GatewayClass/Gateway khỏi Route của app rõ hơn nhưng vẫn cần CRD và controller tương thích. TLS termination, re-encryption, pass-through hoặc mTLS phải được chọn theo trust boundary, certificate owner và nơi plaintext xuất hiện.

NetworkPolicy là allow-list L3/L4 additive và chỉ có hiệu lực nếu CNI enforce. Bắt đầu default deny ingress/egress, allow DNS, rồi allow đúng caller, destination và port; test cả positive lẫn negative. Trong một `from` item, namespaceSelector và podSelector là AND; tách thành hai item có thể thành OR rộng hơn dự định. Debug theo app listen, Pod IP/readiness, EndpointSlice, Service, DNS, policy, edge và TLS thay vì nhảy thẳng tới việc restart CoreDNS.

## Kubernetes storage, config, Secret và health

PV là representation cluster-scoped của storage; PVC là yêu cầu namespaced; StorageClass mô tả provisioner, parameter, reclaim, binding và expansion; CSI thực hiện provision/attach/mount/snapshot tùy driver. `WaitForFirstConsumer` giúp chọn volume theo topology của Pod. RWO không luôn có nghĩa “chỉ một Pod”; phải hiểu capability/driver. `hostPath` chỉ hợp lab hoặc node agent đặc biệt, không phải data production portable.

StatefulSet `volumeClaimTemplates` giữ PVC theo ordinal nhưng database HA vẫn cần replication, quorum, fencing, backup và operator/application semantics. Snapshot có thể chỉ crash-consistent; replica, reclaim `Retain` và snapshot cùng failure domain đều không thay backup. DR phải restore vào môi trường cô lập và kiểm chứng data cùng business transaction.

ConfigMap dành cho config không bí mật; Secret `data` chỉ base64, không phải encryption. Quyền tạo Pod có thể dẫn tới mount Secret trong namespace, nên RBAC phải xét escalation path. Env var không đổi trong process; projected file cập nhật eventual nhưng `subPath` không hot-update. Dùng checksum/hash để rollout, short-lived workload identity, encryption at rest/KMS, external store khi cần, và không log environment. Ba probe phải trả lời ba câu hỏi khác nhau; hook không thay workflow durable và mọi thời gian `preStop` đều nằm trong termination grace.

## Kubernetes security, packaging và GitOps delivery

RBAC là additive. Role/RoleBinding nên giới hạn namespace; ClusterRoleBinding chỉ dùng cho nhiệm vụ thật sự cluster-wide. `pods/exec`, `pods/log`, `deployments/scale`, create workload, bind/escalate/impersonate và wildcard đều cần review riêng. Mỗi workload dùng ServiceAccount riêng khi cần API; tắt automount token nếu không dùng.

Workload baseline gồm `runAsNonRoot`, `allowPrivilegeEscalation: false`, `readOnlyRootFilesystem`, drop `ALL`, seccomp `RuntimeDefault`, mount writable tối thiểu và resource limits. Pod Security Admission nên được đưa từ warn/audit tới enforce Restricted có pin version. Namespace là boundary tổ chức tốt nhưng không mặc định là hard multi-tenancy cho tenant thù địch. Supply chain vẫn cần trusted registry, digest, SBOM, provenance, signature, scan và admission policy; webhook trên API critical path phải có HA, timeout, scope, failure policy và break-glass.

Raw YAML phù hợp hệ nhỏ; Kustomize dùng base/overlay; Helm đóng gói sản phẩm nhiều cấu hình; operator dành cho lifecycle liên tục. Luôn render output trong CI, validate schema/deprecation/policy, diff trước apply và không commit Secret plaintext. GitOps controller pull desired state và reconcile drift, nhưng cần rõ ownership, pruning guardrail cho stateful resource, promotion, rollback/forward-fix và break-glass được audit. Cùng một image digest phải được promote; không rebuild riêng từng môi trường.

## Kubernetes observability, vận hành cluster và DR

Quan sát Kubernetes phải nối bốn lớp: user SLI, application telemetry, workload/Pod và node/control plane. Metrics Server phục vụ resource API ngắn hạn, không thay Prometheus hoặc TSDB dài hạn. Log cần metadata cluster/namespace/workload/Pod/container và trace correlation; metric label phải bounded. Events hữu ích nhưng ngắn hạn. Debug bắt đầu bằng context/namespace, status/conditions, Events, logs hiện tại và `--previous`, owner/rollout, EndpointSlice, resource và node; ephemeral container cần RBAC/audit vì có thể thấy namespace nhạy cảm.

Cluster production cần RACI giữa provider và đội vận hành cho control plane, node, CNI/CSI/DNS/edge, identity, data và upgrade. HA control plane cần API endpoint ổn định, nhiều API server và etcd quorum phân tán failure domain; ba node cùng rack chưa phải HA. Upgrade là dự án compatibility: inventory version skew, deprecated API, CNI, CSI, webhook, operator, runtime, kernel, capacity và PDB; staging/canary trước, control plane và node theo thứ tự được hỗ trợ, có decision point vì rollback binary không luôn đảo được API/data change.

Ba lớp phục hồi không thay nhau: Git/IaC dựng desired resource, etcd snapshot phục hồi cluster state, còn database/PV/object backup phục hồi dữ liệu ứng dụng; tất cả còn phụ thuộc identity, KMS key, registry, DNS và external service. Game day phải restore vào môi trường cô lập, đo RPO/RTO, checksum/schema/business invariant và cập nhật runbook. Một nền tảng chỉ được coi là production-ready khi có evidence cho rollout lỗi, node loss, policy/DNS, resource pressure, secret expiry, volume topology, telemetry outage, upgrade và restore—not chỉ vì manifest apply thành công.

## Lộ trình thực hành và tiêu chuẩn hoàn thành

Bộ nguồn Docker gồm 77 tài liệu Markdown, đi từ roadmap, lesson, code-sample guide, bộ câu hỏi, model answer, troubleshooting drill tới capstone. Các file code, Dockerfile, Compose và manifest đi kèm là lab evidence nhưng catalog học tập chỉ lập chỉ mục Markdown; vì vậy cần mở README/runbook tương ứng rồi chạy sample trong môi trường an toàn. Học theo vòng lặp: dự đoán, chạy lệnh, thu evidence, inject một lỗi, giải thích root cause, sửa declarative source và viết lại runbook.

Một capstone tốt đưa cùng ứng dụng từ Compose lên Kubernetes và chứng minh: image multi-stage non-root; digest/provenance; network segmentation; persistence cùng restore; graceful shutdown; requests/limits/probes; rollout/rollback; HPA/PDB/topology; default-deny policy và least-privilege RBAC; log/metric/trace; upgrade và DR. Không chạy chaos hoặc cleanup destructive trên production nếu chưa có phê duyệt. Mức “biết sâu” không đo bằng số lệnh thuộc lòng mà bằng khả năng dự đoán failure mode, đưa evidence falsifiable, nêu trade-off và để người khác tái hiện build, deploy, debug, rollback và restore từ tài liệu.
