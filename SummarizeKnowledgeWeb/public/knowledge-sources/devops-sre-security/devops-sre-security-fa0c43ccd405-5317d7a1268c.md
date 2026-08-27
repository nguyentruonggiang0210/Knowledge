# Đáp án — Infrastructure, Networking, Containers và Cloud

Rubric cho [`../infra_cloud.md`](../infra_cloud.md). Tên sản phẩm cloud không quan trọng bằng hiểu traffic path, resource boundary và failure domain.

## INF-001 — Từ URL đến response

**Câu hỏi:** Khi người dùng nhập một HTTPS URL, các bước DNS, TCP/QUIC, TLS, HTTP và routing diễn ra theo thứ tự nào?

Browser parse URL/HSTS, kiểm cache; resolver tìm DNS qua cache/recursive đến authoritative. Client mở TCP (3-way handshake) hoặc QUIC/UDP, thực hiện TLS (certificate/SNI/ALPN, key agreement), rồi gửi HTTP. Traffic qua CDN/WAF/LB/reverse proxy đến app, app gọi dependency và trả response; connection có thể reuse.

Thực tế DNS/TLS có thể song song/cache và HTTP/3 gộp transport+TLS handshake. Câu Senior nhắc timeout/telemetry tại từng hop.

## INF-002 — TCP

**Câu hỏi:** TCP bảo đảm ordered reliable byte stream ra sao? Head-of-line blocking và congestion control ảnh hưởng latency thế nào?

Sequence number, ACK, checksum, retransmission và receive window tạo byte stream đúng thứ tự; congestion window điều chỉnh lượng in-flight theo mất gói/RTT. Một segment mất khiến byte sau bị giữ ở TCP receive stream (HOL), tăng tail latency dù application multiplex.

Slow start làm connection mới chậm; reuse connection giúp nhưng connection lâu có stale route. TCP không bảo đảm message boundary và timeout application.

## INF-003 — HTTP versions

**Câu hỏi:** HTTP/1.1, HTTP/2 và HTTP/3 khác nhau về multiplexing, transport, head-of-line blocking và vận hành proxy ra sao?

HTTP/1.1 thường nhiều connection/pipelining hạn chế; HTTP/2 multiplex stream trên một TCP, HPACK nhưng mất packet vẫn chặn mọi stream do TCP HOL. HTTP/3 chạy trên QUIC/UDP, stream độc lập, TLS 1.3 tích hợp và migration connection, giảm HOL nhưng CPU/UDP/firewall/proxy support phức tạp.

Senior nêu ALPN/fallback, observability và không mặc định H3 luôn nhanh với mọi workload.

## INF-004 — DNS

**Câu hỏi:** DNS recursive/authoritative resolution, record A/AAAA/CNAME/TXT và TTL hoạt động thế nào? Negative caching gây bất ngờ gì?

Stub hỏi recursive resolver; resolver cache và truy root→TLD→authoritative. A/AAAA ánh IP, CNAME alias (không thường ở zone apex), TXT metadata/verification. TTL kiểm cache nhưng client/resolver có thể clamp; thay record không tức thời.

NXDOMAIN cũng được negative-cache theo SOA, nên record vừa tạo vẫn “không tồn tại” tại một số client. Đổi DNS cần hạ TTL trước, dual-run và đo resolver path.

## INF-005 — Proxy roles

**Câu hỏi:** Forward proxy, reverse proxy, load balancer, API gateway và ingress controller khác vai trò thế nào?

Forward proxy đại diện client ra ngoài; reverse proxy đại diện server. Load balancer phân phối/health; API gateway thêm auth/rate/protocol/API policy; ingress controller hiện thực rule vào cluster. Một sản phẩm có thể làm nhiều vai trò.

Phân biệt theo trust/ownership và chức năng, không theo tên. Senior tránh nhồi business logic vào edge và xác định hop nào terminate TLS/retry.

## INF-006 — CIDR và routing

**Câu hỏi:** CIDR là gì? Subnet, route table, default gateway, NAT và firewall/security group phối hợp thế nào?

CIDR `/n` chia prefix network và host; subnet là range trong network. Route table chọn next hop theo longest-prefix; default route bắt phần còn lại. Gateway chuyển mạng; NAT đổi địa chỉ/port cho egress/ingress; firewall/SG cho phép/chặn stateful/stateless theo rule.

Thiết kế tránh CIDR overlap, để private subnet không có route trực tiếp Internet và giới hạn egress.

## INF-007 — NAT/conntrack

**Câu hỏi:** SNAT, DNAT và connection tracking có thể gây port exhaustion hoặc asymmetric routing như thế nào?

SNAT đổi source cho outbound, DNAT đổi destination cho inbound. NAT gateway phải giữ mapping 5-tuple trong conntrack; nhiều connection đến cùng destination có thể cạn ephemeral ports, tạo timeout. Conntrack table đầy cũng drop packet.

Asymmetric return qua path khác có thể không có state và bị drop. Giảm bằng pool connection, nhiều egress IP/gateway, private endpoint, tune/observe port+conntrack—not chỉ tăng retry.

## INF-008 — L4/L7 balancing

**Câu hỏi:** Layer 4 và layer 7 load balancing khác nhau về thông tin routing, TLS termination, performance và health check ra sao?

L4 route TCP/UDP theo tuple, pass-through TLS và throughput cao; health thường connect-level. L7 parse HTTP nên route host/path/header, terminate TLS, WAF/auth và metric request, đổi lại overhead, buffering/timeout semantic và trust certificate.

Chọn theo protocol/policy. Chú ý client IP headers, TLS re-encryption, WebSocket/gRPC support và retry non-idempotent.

## INF-009 — Keep-alive/pooling

**Câu hỏi:** Keep-alive và connection pooling giảm chi phí gì? DNS rotation, stale connection và idle timeout làm pool sai thế nào?

Reuse bỏ DNS/TCP/TLS handshake, giảm socket/CPU/latency. Pool phải có max connection, idle/lifetime, acquisition timeout và per-origin key. DNS thay endpoint nhưng connection sống tiếp; LB idle timeout đóng trước client tạo reset.

Đặt connection lifetime để refresh DNS, retry connect an toàn, keepalive phù hợp và không tạo pool/client mỗi request. Theo dõi pool wait/sockets.

## INF-010 — MTU/PMTUD

**Câu hỏi:** MTU, fragmentation và Path MTU Discovery có thể gây “request nhỏ chạy, request lớn timeout” như thế nào?

Packet lớn hơn MTU cần fragmentation hoặc ICMP “packet too big” để sender giảm MSS. Nếu firewall chặn ICMP và DF set, packet lớn bị black-hole trong khi ping/request nhỏ chạy.

Kiểm tra theo path/tunnel overhead, TCP MSS clamping, trace packet size và packet capture. Không chữa bằng timeout/retry; sửa MTU/tunnel/firewall.

## INF-011 — Process/thread

**Câu hỏi:** Process và thread khác nhau về address space, scheduling và isolation như thế nào?

Process có virtual address space/resource isolation riêng; IPC tốn hơn. Thread cùng process chia heap/file descriptor nhưng có stack/register và scheduler state riêng, nên giao tiếp nhanh nhưng race/crash có blast radius chung.

OS schedule runnable threads trên core; quá nhiều thread tạo context switch/memory. Runtime managed có thêm user-mode/virtual thread abstraction.

## INF-012 — Virtual memory

**Câu hỏi:** Virtual memory, page, page cache, swap và memory-mapped file ảnh hưởng application ra sao?

Virtual address được map theo page tới physical memory/file; page fault nạp trang. Page cache giữ file data dùng RAM, nên “used memory” không luôn là leak. Swap đẩy anonymous page ra disk và có thể gây latency thrash; mmap cho file/region như memory.

Senior phân biệt RSS, virtual size, cache, major/minor fault và container limit; không vội `drop_caches`.

## INF-013 — File descriptors

**Câu hỏi:** File descriptor là gì? Vì sao socket/file leak có thể biểu hiện là `too many open files`, và chẩn đoán thế nào?

FD là handle process dùng cho file, socket, pipe. Không close response/socket/watch làm chạm per-process/system limit; accept/open thất bại và downstream connection lỗi.

Chẩn đoán bằng count/limit, `/proc/<pid>/fd`, `lsof`, socket states và metric pool. Sửa lifecycle/dispose, bound concurrency/pool; tăng limit chỉ mua thời gian và có thể đẩy cạn kernel memory/port.

## INF-014 — Container vs VM

**Câu hỏi:** Container khác virtual machine ở đâu? Linux namespaces và cgroups cung cấp isolation/resource control nào?

VM ảo hóa hardware và chạy guest kernel, isolation mạnh hơn nhưng nặng. Container là process chia host kernel; namespaces cô lập PID/network/mount/user, cgroups giới hạn/đo CPU/memory/I/O.

Image không phải security boundary tuyệt đối. Dùng non-root, capability/seccomp, patch host và runtime; workload không tin cậy có thể cần sandbox/microVM.

## INF-015 — Image layers

**Câu hỏi:** Container image layer, copy-on-write và build cache hoạt động ra sao? Tại sao multi-stage build và image nhỏ hữu ích?

Mỗi instruction tạo immutable layer; container có writable copy-on-write layer. Build cache reuse layer khi input không đổi, nên copy lockfile trước source. Xóa secret ở layer sau không xóa khỏi layer cũ.

Multi-stage chỉ mang artifact/runtime dependency sang final, giảm size/attack surface. Pin digest, `.dockerignore`, không bake secret và scan cả OS/app dependency.

## INF-016 — Container limits

**Câu hỏi:** CPU request/limit, throttling, memory limit và OOM kill trong container có thể làm latency thay đổi thế nào?

CPU request dùng scheduling/guarantee tương đối; limit áp quota và có thể throttle ngay cả node còn CPU, tăng p99. Memory không compressible: vượt cgroup limit bị OOM kill; request thấp gây overcommit/node pressure.

Đo throttled seconds, working set/RSS, OOM events và GC. Chọn request từ usage percentile + headroom, load test limit; tránh dùng limit như cách duy nhất kiểm leak.

## INF-017 — PID 1

**Câu hỏi:** PID 1, signal forwarding và zombie process ảnh hưởng graceful shutdown trong container ra sao?

PID 1 có semantics signal và trách nhiệm reap child. Shell entrypoint có thể không forward SIGTERM; app không shutdown, bị SIGKILL sau grace period và mất work. Child zombie tích tụ nếu không wait.

Dùng exec-form entrypoint hoặc init nhỏ, handle SIGTERM, ngừng nhận traffic, drain với deadline và reap child. Test termination thực tế.

## INF-018 — Immutable/stateless container

**Câu hỏi:** Vì sao container nên bất biến và stateless? Log, config, secret và persistent data nên đi đâu?

Image bất biến cho rollback/reproducibility; instance stateless có thể replace/scale. Config inject qua environment/file/config service; secret từ secret manager/volume; log ra stdout/agent; durable data ở managed store/PV/object storage.

Local ephemeral disk vẫn hữu ích cho cache/temp nhưng phải có quota/cleanup và chịu mất. Không SSH sửa production container vì tạo drift.

## INF-019 — Kubernetes workloads

**Câu hỏi:** Pod, ReplicaSet, Deployment, StatefulSet, DaemonSet và Job/CronJob giải quyết workload nào?

Pod là scheduling unit; ReplicaSet giữ số replica, Deployment quản rolling stateless; StatefulSet cho identity/order/PVC ổn định; DaemonSet một Pod mỗi node; Job chạy đến completion, CronJob lập lịch.

Chọn theo lifecycle/state, không dùng StatefulSet chỉ vì app ghi file. Controller reconcile desired state; Pod bản thân là disposable.

## INF-020 — Service/Ingress

**Câu hỏi:** Kubernetes Service ClusterIP/NodePort/LoadBalancer và Ingress/Gateway đưa traffic đến Pod thế nào?

ClusterIP tạo virtual service nội cluster map qua EndpointSlice đến ready Pods; NodePort mở port node; LoadBalancer yêu cầu cloud LB. Ingress/Gateway là L7 rules thường đi qua controller/proxy rồi Service.

Debug theo DNS→LB→controller→Service selector/port→Endpoint→Pod readiness. Ingress object không tự chạy nếu thiếu controller.

## INF-021 — Probes

**Câu hỏi:** Liveness, readiness và startup probe nên kiểm tra gì? Cấu hình sai gây restart loop hoặc nhận traffic quá sớm ra sao?

Startup cho app boot dài và tạm hoãn liveness; readiness xác định nhận traffic; liveness chỉ restart khi không tự phục hồi. Cấu hình initial delay/period/timeout/failure threshold theo distribution thực.

Probe quá nặng hoặc phụ thuộc DB gây cascade; quá nhạy tạo flap/restart loop. Endpoint riêng, nhẹ, và readiness có thể phản ánh drain/capacity.

## INF-022 — Scheduling controls

**Câu hỏi:** Scheduler dùng resource request, affinity/anti-affinity, taint/toleration và topology spread thế nào?

Scheduler lọc node đủ request/constraint rồi score. Affinity đặt gần, anti-affinity/tology spread phân tán; taint chặn Pod trừ khi có toleration. Hard rules bảo constraint nhưng có thể làm Pending; soft preference linh hoạt.

Senior thiết kế theo zone/failure domain và hiểu limit không dùng để schedule—request mới là cơ sở.

## INF-023 — Autoscalers

**Câu hỏi:** Horizontal, Vertical và Cluster Autoscaler khác nhau ra sao? Vì sao scale theo CPU không đủ cho queue consumer?

HPA đổi replica theo CPU/memory/custom/external metric; VPA đổi request/limit và có thể restart; Cluster Autoscaler thêm/bớt node khi Pod unschedulable/underused. Queue consumer nên scale theo backlog age/arrival-service rate, không chỉ CPU thấp khi đang chờ I/O.

Tính startup delay, stabilization, max downstream capacity và KEDA/custom metric. Autoscaling phản ứng sau sự kiện nên campaign cần pre-scale.

## INF-024 — Disruption/deploy

**Câu hỏi:** PodDisruptionBudget, rolling update, surge/unavailable và graceful termination phối hợp để deploy không gián đoạn thế nào?

Rolling update dùng `maxSurge/maxUnavailable`; readiness chỉ đưa Pod mới vào traffic khi sẵn sàng. `preStop`/SIGTERM, endpoint propagation và termination grace giúp drain. PDB giới hạn voluntary disruption như node drain, không ngăn crash.

Replica phải trải zone/node, capacity đủ surge. Connection dài/job cần checkpoint/drain riêng; test rollback và tránh migration incompatible.

## INF-025 — ConfigMap/Secret

**Câu hỏi:** ConfigMap và Secret khác nhau thế nào? Vì sao Kubernetes Secret mặc định không đồng nghĩa với bí mật đã an toàn?

ConfigMap cho config không nhạy cảm; Secret chỉ là object được đánh dấu và base64, không tự mã hóa an toàn. Bật encryption at rest, RBAC tối thiểu, external secret manager/CSI, rotation và audit; tránh env/log vì khó rotate/lộ process dump.

Volume update eventual còn env cần restart. Config/secret version phải tương thích rollout.

## INF-026 — Kubernetes storage

**Câu hỏi:** PersistentVolume, PersistentVolumeClaim, StorageClass và access mode ảnh hưởng stateful workload ra sao?

PV là resource storage; PVC là request/binding; StorageClass provision động và định reclaim/parameters. AccessModes RWO/RWX không tự bảo application concurrent-write safe; zone-bound volume ảnh hưởng scheduling/failover.

StatefulSet cho PVC per replica nhưng backup/replication vẫn là trách nhiệm data system. Test snapshot restore, expansion và reclaim policy.

## INF-027 — NetworkPolicy

**Câu hỏi:** Kubernetes NetworkPolicy kiểm soát traffic nào? Default-deny và DNS egress cần được thiết kế ra sao?

Policy chọn Pod và allow ingress/egress ở L3/L4 tùy CNI; không phải mọi CNI enforce. Bắt đầu default-deny theo namespace rồi allow explicit service/port. Egress cần DNS tới resolver và dependency/NAT theo IP limitation.

Policy không thay application auth/mTLS và hostname filtering thường cần L7 proxy. Test flow và observability dropped packet.

## INF-028 — Operator/controller

**Câu hỏi:** Operator/controller reconciliation loop là gì? Desired state và eventual convergence giúp tự động hóa vận hành thế nào?

Controller watch actual state, so với desired spec rồi thực hiện reconcile idempotent đến khi hội tụ. Event có thể duplicate/miss nên level-based reconciliation tốt hơn chuỗi imperative.

Operator mã hóa domain operation như backup/failover/upgrade qua CRD, status/condition/finalizer. Phải có retry/backoff, leader election và tránh loop phá hoại.

## INF-029 — Service mesh

**Câu hỏi:** Service mesh đem lại mTLS, traffic policy, telemetry nhưng có chi phí và failure mode nào?

Mesh cung cấp workload mTLS/identity, traffic split, retry policy và uniform telemetry qua sidecar/ambient proxy. Chi phí: latency/CPU, certificate/control-plane dependency, config khó, double retry, debugging nhiều hop và version rollout.

Chỉ dùng khi nhu cầu/platform maturity biện minh; app vẫn cần authz/business telemetry và end-to-end deadline.

## INF-030 — Pod Running nhưng 503

**Câu hỏi:** Một Pod ở trạng thái `Running` nhưng request thỉnh thoảng 503. Hãy nêu cây chẩn đoán từ client/LB/Ingress/Service/Endpoint đến application.

Xác định 503 do hop nào qua header/log/trace. Kiểm client/DNS/LB target health, Ingress config/upstream timeout, Service selector/port và EndpointSlice có ready Pod; kiểm readiness flap, rollout/termination và zone path. Trong Pod kiểm app listen đúng interface/port, pool/downstream, saturation và log.

So sánh theo Pod/node/AZ/version/time; chạy request tại từng hop. `Running` chỉ nói process/container tồn tại, không nói app ready.

## INF-031 — Service models

**Câu hỏi:** IaaS, PaaS, managed service và serverless chuyển giao trách nhiệm vận hành như thế nào?

IaaS giao VM/network, team quản OS/runtime/app; PaaS quản OS/runtime hơn; managed service quản engine/HA một phần; serverless quản instance scaling và tính theo usage. Càng managed càng giảm toil/time-to-market nhưng tăng constraint, price premium/lock-in và shared limits.

Data/schema/query/security cấu hình vẫn thuộc team.

## INF-032 — Shared responsibility

**Câu hỏi:** Shared responsibility model trên cloud có ý nghĩa gì với patching, IAM, encryption, backup và application security?

Provider bảo mật “of cloud” (facility/hardware/control plane theo dịch vụ); khách hàng bảo mật “in cloud”: identity, config, data, code và thường OS tùy model. Managed DB vẫn cần access control, encryption choice, backup retention/restore test, patch window và query/schema.

Responsibility matrix phải cụ thể từng service; “cloud tự backup/bảo mật” là sai.

## INF-033 — AZ/Region

**Câu hỏi:** Availability Zone và Region là failure domain nào? Trải workload/data qua zone hoặc region tạo chi phí gì?

AZ là failure domain nguồn điện/network tương đối độc lập trong region; region tách địa lý/control/data plane nhiều hơn. Multi-AZ giảm lỗi site với latency/egress vừa phải; multi-region đạt DR/latency/residency nhưng replication conflict, cost, routing và vận hành cao.

Phải trải compute lẫn data/quorum; đặt ba replica nhưng cùng zone không tạo HA.

## INF-034 — Storage types

**Câu hỏi:** Object, block và file storage phù hợp workload nào? Khác biệt về access pattern, consistency và durability là gì?

Object dùng key/HTTP, scale/durability cao cho blob nhưng không block/POSIX; block là volume low-latency cho filesystem/DB thường gắn zone; file cung cấp shared hierarchy/POSIX/NFS nhưng metadata/contention.

Consistency và performance tùy provider/tier. Chọn theo random IOPS, throughput, shared access, size và lifecycle—not chỉ giá/GB.

## INF-035 — Pre-signed URL

**Câu hỏi:** Pre-signed URL cho object storage giảm tải application ra sao? Cần giới hạn quyền, thời hạn, content và validation thế nào?

App xác thực/ủy quyền rồi ký URL cho operation, bucket/key, method và expiry; client transfer trực tiếp nên giảm bandwidth/connection app. Scope key tenant-specific, TTL ngắn, content length/type/checksum nếu provider hỗ trợ, one-time workflow state và quota.

Upload vào quarantine; URL bị lộ dùng được đến hết hạn nên không log, và revoke thường khó. Sau upload server phải verify object trước publish.

## INF-036 — CDN

**Câu hỏi:** CDN cache theo key/TTL và purge thế nào? Signed URL/cookie và origin shielding giải quyết vấn đề gì?

Cache key thường gồm scheme/host/path/query/header chọn lọc; TTL từ cache-control, purge/versioned URL khi thay nội dung. Signed URL/cookie giới hạn private asset; origin shield gom miss, giảm stampede/origin load.

Không cache response cá nhân nếu key thiếu auth/tenant; normalize query cẩn thận. Đo hit ratio, origin egress, stale policy và purge propagation.

## INF-037 — Serverless

**Câu hỏi:** Serverless function có trade-off nào về cold start, concurrency, state, timeout, observability và cost crossover?

Ưu: scale-to-zero, event integration, ít server toil. Trade-off: cold start, concurrency burst làm sập DB, execution/time/payload limit, ephemeral state, debugging/observability/IAM per function và cost cao khi tải ổn định.

Giảm bằng provisioned concurrency, pool/proxy DB, idempotent handler và queue. Tính cost theo request×duration×memory cộng network/log; so với container ở utilization thực.

## INF-038 — Managed database

**Câu hỏi:** Managed database giảm toil nhưng không loại bỏ những trách nhiệm nào về schema, query, capacity, HA và backup restore?

Provider thường vận hành hardware, patch, replica/failover và backup mechanism; team vẫn sở hữu data model, migration, query/index, connection pool, capacity/quota, parameter, security/IAM, retention và chứng minh restore.

HA không bảo vệ logical delete; automated backup chưa chắc đạt RPO/RTO. Theo dõi slow query, storage/IOPS, replica lag và maintenance event.

## INF-039 — VPC nhiều tầng

**Câu hỏi:** Thiết kế VPC/VNet nhiều tầng với public/private subnet, egress, private endpoint và bastion/zero-trust access ra sao?

Public subnet chỉ cho internet-facing LB/NAT cần public route; app/data ở private subnet, inbound chỉ từ lớp trước qua SG identity/rule. Egress qua NAT/proxy có allowlist; object/managed service dùng private endpoint để tránh Internet. Database không public.

Admin qua identity-aware proxy/SSM/zero-trust, không bastion mở rộng; nếu bastion cần MFA/audit/patch. Flow logs, DNS private zone và multi-AZ routes.

## INF-040 — Hybrid connectivity

**Câu hỏi:** Thiết kế hybrid connectivity qua VPN/private link cần xem xét routing, DNS, MTU, bandwidth và redundant path thế nào?

Hai đường VPN/private circuit độc lập, dynamic routing/BGP và failover test; tránh CIDR overlap. Split-horizon DNS/forwarder phải resolve nhất quán; MTU/tunnel overhead, bandwidth/latency và asymmetric route được đo.

Encrypt, segment và limit route advertisement; capacity during failover. Dependency on-prem trên cloud request path ảnh hưởng SLO, nên cache/queue/degrade.

## INF-041 — IaC

**Câu hỏi:** Infrastructure as Code đem lại repeatability và review ra sao? Idempotency và declarative state có ý nghĩa gì?

Code review/version tạo môi trường lặp lại, audit và disaster rebuild. Declarative config nêu desired state; engine lập diff/reconcile, operation lý tưởng idempotent—chạy lại không tạo duplicate hoặc phá state.

Plan không bảo đảm không drift/concurrent change; CI policy, state lock và post-apply verify cần thiết. Không để click-ops không được import lại.

## INF-042 — Terraform state

**Câu hỏi:** Terraform state chứa gì, vì sao cần remote backend/locking/bảo mật, và xử lý drift/import thế nào?

State ánh resource address với remote IDs/attributes/dependency và có thể chứa secret. Remote backend cung cấp sharing, encryption, versioning và locking để tránh concurrent apply. Quyền state phải chặt hơn nhiều repo.

Refresh/plan phát hiện drift; import resource hợp lệ vào config+state, `moved` block khi refactor. Không sửa state thủ công trừ quy trình kiểm soát/backup; tách state theo blast radius/ownership.

## INF-043 — IaC modules

**Câu hỏi:** Module IaC nên có boundary và interface thế nào để tái sử dụng mà không tạo “mega-module” khó nâng cấp?

Module đóng gói capability ổn định với input nhỏ, typed/default hợp lý, output cần thiết; version và migration guide. Boundary theo ownership/lifecycle/blast radius, không theo từng resource cũng không một module toàn platform.

Tránh hàng trăm boolean và leak mọi provider field; cung cấp safe defaults/policy, test example và cho escape hatch có chủ đích. Consumer pin version và nâng theo cohort.

## INF-044 — FinOps

**Câu hỏi:** FinOps cho một nền tảng backend nên theo dõi unit cost, tagging, rightsizing, commitment và egress như thế nào?

Phân bổ cost bằng tag/account/project/tenant; đo unit cost như cost/1k request/order/GB. Rightsize theo percentile và SLO, scale schedule, storage lifecycle, commitment cho baseline, spot cho fault-tolerant job; đặc biệt quan sát data egress, logs và idle non-prod.

Budget/anomaly alert có owner. Tối ưu không chỉ giảm hóa đơn mà giữ reliability và tốc độ engineering; showback/chargeback không khuyến khích gaming.

## INF-045 — Case study RTO/RPO và campaign

**Câu hỏi:** Hệ thống một region cần đạt RTO 30 phút, RPO 5 phút và tải tăng 8 lần vào hai chiến dịch mỗi năm. Hãy đề xuất topology, capacity strategy, replication/backup, DNS failover và cách diễn tập.

Baseline multi-AZ stateless compute sau LB, DB HA và async cross-region replication/backup immutable đạt ≤5 phút; standby warm với IaC, secrets/artifacts mirrored. DNS/global routing health fail sang region DR; fencing write và runbook failback. Nếu replica async không cam kết 5 phút, tăng sync/log shipping hoặc điều chỉnh kiến trúc.

Campaign dùng load test, forecast, scheduled pre-scale + autoscale, CDN/cache/queue và pre-provision DB capacity; không giữ 8× quanh năm. Restore/failover drill đo end-to-end dưới 30 phút, gồm identity/DNS/dependency và reconcile data; cảnh báo replication lag vượt RPO.

## Câu hỏi kinh điển bổ sung — Basic đến Senior

## INF-046 — TCP và UDP

**Câu hỏi:** TCP và UDP khác nhau về connection, reliability, ordering, flow/congestion control và use case thế nào?

TCP là connection-oriented byte stream, có sequence/ACK/retransmit, ordered delivery, flow và congestion control; đổi lại handshake, state và head-of-line blocking. UDP là datagram không connection/reliability/order mặc định, giữ message boundary, overhead thấp; application/protocol tự thêm bảo đảm cần thiết.

HTTP/1/2 thường trên TCP; DNS, media realtime dùng UDP phù hợp; QUIC xây reliable multiplexed streams trên UDP. “UDP nhanh hơn” chỉ đúng theo workload/protocol, không phải tuyệt đối.

## INF-047 — IP, port, socket

**Câu hỏi:** IP address, port và socket là gì? Server thực hiện bind, listen và accept connection ra sao?

IP định danh interface/route host; port chọn endpoint process/protocol trên host; socket là kernel object giao tiếp, connection TCP được nhận diện bởi protocol + source/destination IP/port. Server tạo socket, `bind` local address/port, `listen` backlog rồi `accept` tạo connected socket riêng cho mỗi connection.

Một listening port phục vụ nhiều connection vì 4/5-tuple khác nhau. `0.0.0.0` bind mọi interface; port mở không đồng nghĩa firewall/LB route được.

## INF-048 — Các loại IP/NAT

**Câu hỏi:** Public, private, loopback và link-local IP khác nhau thế nào? NAT ảnh hưởng khả năng kết nối hai chiều ra sao?

Public IP được route toàn Internet; private RFC1918 chỉ route nội bộ; loopback (`127.0.0.1`, `::1`) quay về host; link-local chỉ segment cục bộ và còn dùng metadata trong một số cloud. NAT ánh private source/port ra public cho outbound.

Kết nối inbound qua NAT cần mapping/port forwarding/LB; NAT state và ephemeral port có thể cạn. Private không đồng nghĩa an toàn—vẫn cần auth/firewall/segmentation.

## INF-049 — OSI/TCP-IP khi debug

**Câu hỏi:** Mô hình OSI và TCP/IP giúp debug network như thế nào? Hãy ánh xạ DNS, IP, TCP, TLS và HTTP vào các lớp phù hợp.

Mô hình giúp khoanh lớp: link Ethernet/Wi-Fi; network IP/routing; transport TCP/UDP; application DNS/HTTP, còn TLS thường nằm giữa transport và application. TCP/IP gộp nhiều lớp OSI; ánh xạ chỉ là mô hình, không phải ranh giới tuyệt đối.

Debug bottom-up hoặc theo symptom: link/address/route → TCP connect → TLS certificate/handshake → HTTP status/app. DNS là application protocol nhưng quyết định địa chỉ trước connection.

## INF-050 — Công cụ network

**Câu hỏi:** Bạn dùng `ping`, `traceroute`, `nslookup/dig`, `curl` và `netstat/ss` để khoanh vùng các loại lỗi nào?

`ping` thử ICMP reachability/RTT nhưng bị chặn không chứng minh service down. `traceroute` gợi ý hop/path nhưng path hồi có thể khác; PMTU cần `tracepath`, packet-size/DF test hoặc option phù hợp của hệ điều hành. `dig/nslookup` xem resolver/record/TTL. `curl -v` kiểm DNS, connect, TLS, HTTP/header; `ss/netstat` xem listening socket, connection state/queue.

Kết hợp packet capture khi cần; luôn thử từ đúng network namespace/vantage point. Một công cụ thành công không chứng minh toàn request path.

## INF-051 — User/kernel mode

**Câu hỏi:** User mode, kernel mode và system call khác nhau ra sao? Vì sao context switch và syscall có chi phí?

Application chạy privilege thấp ở user mode; kernel quản memory, scheduler, device, filesystem/network. System call chuyển có kiểm soát vào kernel để `read/write/open/socket`; cần đổi privilege/context, validate/copy data và có thể block/schedule thread.

Không phải mọi syscall gây process context switch, nhưng nhiều call nhỏ làm overhead/cache disruption. Buffering, batching, async I/O và zero-copy có thể giảm; đo trước khi tối ưu.

## INF-052 — Inode, permission, links

**Câu hỏi:** Inode, file permission, owner/group và hard link/symbolic link trên Linux là gì?

Inode chứa metadata và block pointers; directory ánh tên→inode. Permission `rwx` áp cho owner/group/others (directory: list/create-traverse semantics khác file). Hard link là tên khác cùng inode, không thể đi qua filesystem và hard link tới directory thường bị cấm để tránh vòng; symlink là file chứa path và có thể dangling.

Xóa tên chỉ giảm link count; file vẫn tồn tại khi process còn FD mở. Container “disk đầy dù đã xóa log” thường do FD giữ file hoặc hết inode chứ không chỉ byte.

## INF-053 — Load average

**Câu hỏi:** Linux load average biểu diễn gì và vì sao load cao không nhất thiết đồng nghĩa CPU 100%?

Load average 1/5/15 phút xấp xỉ số task runnable hoặc uninterruptible I/O wait. So với số CPU: load 8 trên 8 core khác load 8 trên 2 core. Disk/NFS I/O treo có thể tăng load trong khi CPU idle.

Xem CPU user/system/iowait, run queue, disk latency, memory pressure và per-process state; load thấp cũng không loại latency do một thread/lock/hot core.

## INF-054 — Config theo Twelve-Factor

**Câu hỏi:** Theo Twelve-Factor App, config qua environment có lợi gì và giới hạn nào đối với secret, kiểu dữ liệu và thay đổi runtime?

Environment tách config khỏi build artifact, dễ inject theo deploy và phù hợp process/container. Nhưng tất cả là string, validation/schema yếu; có thể lộ qua process dump/log, size/hierarchy hạn chế và thay đổi thường cần restart.

Config không nhạy cảm có typed config file/service; secret dùng secret manager/volume/workload identity. Validate fail-fast, version config, audit và xác định snapshot hay dynamic reload.

## INF-055 — CMD/ENTRYPOINT

**Câu hỏi:** Trong Dockerfile, `CMD` và `ENTRYPOINT` khác nhau thế nào? Exec form và shell form ảnh hưởng signal/argument ra sao?

`ENTRYPOINT` định executable chính; `CMD` cung cấp default command/arguments và dễ override. Exec form JSON chạy process trực tiếp làm PID 1 và nhận signal; shell form chạy qua `/bin/sh -c`, có expansion nhưng shell có thể giữ PID 1/không forward signal.

Thường dùng exec-form ENTRYPOINT + CMD arguments. Tránh script không `exec`, và test SIGTERM/graceful shutdown.

## INF-056 — Container networking

**Câu hỏi:** Container network bridge, host và overlay khác nhau về isolation, routing, performance và multi-host connectivity thế nào?

Bridge tạo network namespace/veth và NAT/routing trên một host, isolation tốt nhưng thêm hop. Host mode dùng network stack host, ít overhead nhưng port/isolation kém. Overlay encapsulate packet qua nhiều node và cung cấp address network logic, đổi lại MTU, CPU và troubleshooting phức tạp.

Kubernetes CNI có thể route native hoặc overlay. Chọn theo multi-host, policy, performance; phải tính MTU và không nhầm service discovery với connectivity.

## INF-057 — Namespace/label/annotation

**Câu hỏi:** Kubernetes Namespace, label, selector và annotation có vai trò gì? Vì sao Namespace không phải security boundary đầy đủ?

Namespace nhóm/name-scope resource, quota/RBAC/policy; label là metadata có cấu trúc để selector chọn workload; annotation chứa metadata không dùng chọn như owner/checksum/tool state. Selector sai có thể route traffic hoặc quản nhầm Pod.

Namespace tự nó không cô lập network/node/kernel hay tự áp RBAC. Cần RBAC, NetworkPolicy, quota, admission và có thể cluster/account riêng cho trust mạnh.

## INF-058 — Kubernetes control/data path

**Câu hỏi:** API Server, etcd, scheduler, controller manager, kubelet và kube-proxy/CNI phối hợp ra sao từ lúc tạo Deployment đến khi Pod nhận traffic?

Client gửi desired Deployment tới API Server, được auth/admission và lưu etcd. Deployment/ReplicaSet controller tạo Pod; scheduler bind Pod→node; kubelet thấy PodSpec, nhờ runtime kéo image/chạy container và CNI cấp network. Readiness cập nhật EndpointSlice; Service routing qua kube-proxy/eBPF/IPVS và CNI chuyển packet.

Controllers reconcile bất đồng bộ nên eventual. Debug theo object status/event tại từng bước; API Server unavailable thường Pod đang chạy tiếp nhưng reconciliation/change dừng.

## INF-059 — QoS và eviction

**Câu hỏi:** Kubernetes QoS class và node-pressure eviction được quyết định thế nào? Request/limit sai làm Pod quan trọng bị evict ra sao?

Guaranteed khi mọi container có CPU/memory request=limit; Burstable khi có request/limit nhưng không đạt Guaranteed; BestEffort khi không có. Khi memory pressure, kubelet xét usage vượt request, priority/QoS và policy; BestEffort/Burstable thường dễ evict hơn, nhưng Guaranteed không bất tử.

Request quá thấp làm scheduler overcommit và Pod dùng vượt request thành ứng viên; limit quá thấp gây OOM/throttle. Dùng PriorityClass, capacity reserve và đo working set; PDB chỉ giới hạn voluntary disruption, không bảo vệ Pod khỏi involuntary node-pressure eviction.

## INF-060 — Nâng cấp node không downtime

**Câu hỏi:** Lập kế hoạch nâng cấp node Kubernetes không downtime: compatibility, surge capacity, drain, PDB, stateful workload và rollback.

Kiểm version skew/API deprecation/CNI/CSI, thử staging/canary node pool. Tạo surge capacity, cordon rồi drain từng node; readiness, replicas trải failure domain, PDB và termination grace bảo traffic. DaemonSet/local PV/long job/stateful quorum cần procedure riêng và backup/checkpoint.

Quan sát SLI, pending/eviction/error; pause/rollback bằng giữ node pool cũ và workload compatibility hai chiều. PDB chặn voluntary eviction nên không force bừa; nâng control plane/node theo provider order và diễn tập capacity loss.
