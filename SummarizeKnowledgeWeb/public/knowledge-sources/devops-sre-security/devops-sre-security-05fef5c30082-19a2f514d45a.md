# Infrastructure, Networking, Containers và Cloud

Ngân hàng câu hỏi infrastructure dành cho backend engineer Middle/Senior. Không yêu cầu thuộc lệnh của một cloud provider; cần hiểu primitives, boundary bảo mật, failure domain và trade-off chi phí/vận hành.

## 1. Networking và giao thức

### INF-001 [Middle]
Khi người dùng nhập một HTTPS URL, các bước DNS, TCP/QUIC, TLS, HTTP và routing diễn ra theo thứ tự nào?

### INF-002 [Middle → Senior]
TCP bảo đảm ordered reliable byte stream ra sao? Head-of-line blocking và congestion control ảnh hưởng latency thế nào?

### INF-003 [Senior]
HTTP/1.1, HTTP/2 và HTTP/3 khác nhau về multiplexing, transport, head-of-line blocking và vận hành proxy ra sao?

### INF-004 [Middle]
DNS recursive/authoritative resolution, record A/AAAA/CNAME/TXT và TTL hoạt động thế nào? Negative caching gây bất ngờ gì?

### INF-005 [Middle → Senior]
Forward proxy, reverse proxy, load balancer, API gateway và ingress controller khác vai trò thế nào?

### INF-006 [Middle]
CIDR là gì? Subnet, route table, default gateway, NAT và firewall/security group phối hợp thế nào?

### INF-007 [Senior]
SNAT, DNAT và connection tracking có thể gây port exhaustion hoặc asymmetric routing như thế nào?

### INF-008 [Middle → Senior]
Layer 4 và layer 7 load balancing khác nhau về thông tin routing, TLS termination, performance và health check ra sao?

### INF-009 [Senior]
Keep-alive và connection pooling giảm chi phí gì? DNS rotation, stale connection và idle timeout làm pool sai thế nào?

### INF-010 [Senior]
MTU, fragmentation và Path MTU Discovery có thể gây “request nhỏ chạy, request lớn timeout” như thế nào?

## 2. Linux, process và container

### INF-011 [Middle]
Process và thread khác nhau về address space, scheduling và isolation như thế nào?

### INF-012 [Middle → Senior]
Virtual memory, page, page cache, swap và memory-mapped file ảnh hưởng application ra sao?

### INF-013 [Senior]
File descriptor là gì? Vì sao socket/file leak có thể biểu hiện là `too many open files`, và chẩn đoán thế nào?

### INF-014 [Middle]
Container khác virtual machine ở đâu? Linux namespaces và cgroups cung cấp isolation/resource control nào?

### INF-015 [Middle → Senior]
Container image layer, copy-on-write và build cache hoạt động ra sao? Tại sao multi-stage build và image nhỏ hữu ích?

### INF-016 [Senior]
CPU request/limit, throttling, memory limit và OOM kill trong container có thể làm latency thay đổi thế nào?

### INF-017 [Senior]
PID 1, signal forwarding và zombie process ảnh hưởng graceful shutdown trong container ra sao?

### INF-018 [Middle → Senior]
Vì sao container nên bất biến và stateless? Log, config, secret và persistent data nên đi đâu?

## 3. Kubernetes

### INF-019 [Middle]
Pod, ReplicaSet, Deployment, StatefulSet, DaemonSet và Job/CronJob giải quyết workload nào?

### INF-020 [Middle]
Kubernetes Service ClusterIP/NodePort/LoadBalancer và Ingress/Gateway đưa traffic đến Pod thế nào?

### INF-021 [Middle → Senior]
Liveness, readiness và startup probe nên kiểm tra gì? Cấu hình sai gây restart loop hoặc nhận traffic quá sớm ra sao?

### INF-022 [Senior]
Scheduler dùng resource request, affinity/anti-affinity, taint/toleration và topology spread thế nào?

### INF-023 [Senior]
Horizontal, Vertical và Cluster Autoscaler khác nhau ra sao? Vì sao scale theo CPU không đủ cho queue consumer?

### INF-024 [Senior]
PodDisruptionBudget, rolling update, surge/unavailable và graceful termination phối hợp để deploy không gián đoạn thế nào?

### INF-025 [Middle → Senior]
ConfigMap và Secret khác nhau thế nào? Vì sao Kubernetes Secret mặc định không đồng nghĩa với bí mật đã an toàn?

### INF-026 [Senior]
PersistentVolume, PersistentVolumeClaim, StorageClass và access mode ảnh hưởng stateful workload ra sao?

### INF-027 [Senior]
Kubernetes NetworkPolicy kiểm soát traffic nào? Default-deny và DNS egress cần được thiết kế ra sao?

### INF-028 [Senior]
Operator/controller reconciliation loop là gì? Desired state và eventual convergence giúp tự động hóa vận hành thế nào?

### INF-029 [Senior]
Service mesh đem lại mTLS, traffic policy, telemetry nhưng có chi phí và failure mode nào?

### INF-030 [Senior · Troubleshooting]
Một Pod ở trạng thái `Running` nhưng request thỉnh thoảng 503. Hãy nêu cây chẩn đoán từ client/LB/Ingress/Service/Endpoint đến application.

## 4. Cloud architecture và storage

### INF-031 [Middle]
IaaS, PaaS, managed service và serverless chuyển giao trách nhiệm vận hành như thế nào?

### INF-032 [Middle → Senior]
Shared responsibility model trên cloud có ý nghĩa gì với patching, IAM, encryption, backup và application security?

### INF-033 [Senior]
Availability Zone và Region là failure domain nào? Trải workload/data qua zone hoặc region tạo chi phí gì?

### INF-034 [Middle]
Object, block và file storage phù hợp workload nào? Khác biệt về access pattern, consistency và durability là gì?

### INF-035 [Senior]
Pre-signed URL cho object storage giảm tải application ra sao? Cần giới hạn quyền, thời hạn, content và validation thế nào?

### INF-036 [Middle → Senior]
CDN cache theo key/TTL và purge thế nào? Signed URL/cookie và origin shielding giải quyết vấn đề gì?

### INF-037 [Senior]
Serverless function có trade-off nào về cold start, concurrency, state, timeout, observability và cost crossover?

### INF-038 [Senior]
Managed database giảm toil nhưng không loại bỏ những trách nhiệm nào về schema, query, capacity, HA và backup restore?

### INF-039 [Senior]
Thiết kế VPC/VNet nhiều tầng với public/private subnet, egress, private endpoint và bastion/zero-trust access ra sao?

### INF-040 [Senior]
Thiết kế hybrid connectivity qua VPN/private link cần xem xét routing, DNS, MTU, bandwidth và redundant path thế nào?

## 5. Infrastructure as Code, cost và tình huống

### INF-041 [Middle → Senior]
Infrastructure as Code đem lại repeatability và review ra sao? Idempotency và declarative state có ý nghĩa gì?

### INF-042 [Senior]
Terraform state chứa gì, vì sao cần remote backend/locking/bảo mật, và xử lý drift/import thế nào?

### INF-043 [Senior]
Module IaC nên có boundary và interface thế nào để tái sử dụng mà không tạo “mega-module” khó nâng cấp?

### INF-044 [Senior]
FinOps cho một nền tảng backend nên theo dõi unit cost, tagging, rightsizing, commitment và egress như thế nào?

### INF-045 [Senior · Case study]
Hệ thống một region cần đạt RTO 30 phút, RPO 5 phút và tải tăng 8 lần vào hai chiến dịch mỗi năm. Hãy đề xuất topology, capacity strategy, replication/backup, DNS failover và cách diễn tập.

## 6. Câu hỏi kinh điển bổ sung — Basic đến Senior

### INF-046 [Basic · ⭐ Rất thường gặp]
TCP và UDP khác nhau về connection, reliability, ordering, flow/congestion control và use case thế nào?

### INF-047 [Basic · ⭐ Rất thường gặp]
IP address, port và socket là gì? Server thực hiện bind, listen và accept connection ra sao?

### INF-048 [Basic · ⭐ Rất thường gặp]
Public, private, loopback và link-local IP khác nhau thế nào? NAT ảnh hưởng khả năng kết nối hai chiều ra sao?

### INF-049 [Basic · Thường gặp]
Mô hình OSI và TCP/IP giúp debug network như thế nào? Hãy ánh xạ DNS, IP, TCP, TLS và HTTP vào các lớp phù hợp.

### INF-050 [Basic · ⭐ Rất thường gặp]
Bạn dùng `ping`, `traceroute`, `nslookup/dig`, `curl` và `netstat/ss` để khoanh vùng các loại lỗi nào?

### INF-051 [Basic · ⭐ Rất thường gặp]
User mode, kernel mode và system call khác nhau ra sao? Vì sao context switch và syscall có chi phí?

### INF-052 [Basic · Thường gặp]
Inode, file permission, owner/group và hard link/symbolic link trên Linux là gì?

### INF-053 [Middle · ⭐ Rất thường gặp]
Linux load average biểu diễn gì và vì sao load cao không nhất thiết đồng nghĩa CPU 100%?

### INF-054 [Middle · ⭐ Rất thường gặp]
Theo Twelve-Factor App, config qua environment có lợi gì và giới hạn nào đối với secret, kiểu dữ liệu và thay đổi runtime?

### INF-055 [Middle · ⭐ Rất thường gặp]
Trong Dockerfile, `CMD` và `ENTRYPOINT` khác nhau thế nào? Exec form và shell form ảnh hưởng signal/argument ra sao?

### INF-056 [Middle · Thường gặp]
Container network bridge, host và overlay khác nhau về isolation, routing, performance và multi-host connectivity thế nào?

### INF-057 [Middle · ⭐ Rất thường gặp]
Kubernetes Namespace, label, selector và annotation có vai trò gì? Vì sao Namespace không phải security boundary đầy đủ?

### INF-058 [Senior · ⭐ Rất thường gặp]
API Server, etcd, scheduler, controller manager, kubelet và kube-proxy/CNI phối hợp ra sao từ lúc tạo Deployment đến khi Pod nhận traffic?

### INF-059 [Senior · Thường gặp]
Kubernetes QoS class và node-pressure eviction được quyết định thế nào? Request/limit sai làm Pod quan trọng bị evict ra sao?

### INF-060 [Senior · Thường gặp · Scenario]
Lập kế hoạch nâng cấp node Kubernetes không downtime: compatibility, surge capacity, drain, PDB, stateful workload và rollback.
