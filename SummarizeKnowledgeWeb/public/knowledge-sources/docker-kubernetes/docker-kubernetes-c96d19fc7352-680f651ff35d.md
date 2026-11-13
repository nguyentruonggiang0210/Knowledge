# Tình huống và troubleshooting

**Thời gian:** 120 phút. **Tổng:** 120 điểm (24 tình huống × 5). Đây là bài mở: có thể dùng tài liệu chính thức, nhưng phải ghi nguồn.

Mỗi câu trả lời theo khung:

1. **Khoanh vùng ảnh hưởng** và hành động giảm thiểu an toàn (1đ).
2. **Hai–ba giả thuyết được xếp hạng**, không kết luận trước bằng chứng (1đ).
3. **Lệnh/tín hiệu cần lấy** và kết quả nào xác nhận/bác bỏ (1đ).
4. **Sửa nguyên nhân gốc + validate** (1đ).
5. **Phòng ngừa, rollback, runbook/alert/test** (1đ).

## A. Docker (SC-D01 → SC-D08)

### SC-D01 — “No space left on device”

Host còn 40 GB theo `df -h`, nhưng build thất bại với `no space left on device`. Hãy phân biệt hết block, hết inode, Docker data-root, BuildKit cache, log container và thin-pool. Chỉ dùng `prune` sau khi chứng minh đối tượng có thể xóa; nêu cách tránh xóa nhầm volume/image đang cần rollback.

### SC-D02 — Image tăng từ 180 MB lên 1.4 GB

Commit chỉ thêm bước download SDK rồi `rm -rf /sdk` ở một `RUN` sau. Giải thích theo layer, dùng lệnh nào xem history, và tái cấu trúc Dockerfile/multi-stage thế nào. Nêu cách đặt budget image trong CI.

### SC-D03 — App không nhận SIGTERM

Dockerfile có `CMD node server.js`, deployment mất đủ 10 giây timeout rồi bị kill. Hãy phân tích shell form/PID 1, signal handler, open connections và child process; đề xuất test tự động cho graceful shutdown.

### SC-D04 — Container gọi database bằng `localhost`

Compose có `api` và `db`; API báo connection refused tới `127.0.0.1:5432`. Sửa endpoint, readiness/retry và network. Giải thích vì sao hard-code container IP là anti-pattern.

### SC-D05 — Dữ liệu PostgreSQL “biến mất” sau deploy

Version cũ dùng anonymous volume; Compose mới đổi đường mount và chạy `down -v` trong pipeline. Hãy tìm volume cũ an toàn, xác định dữ liệu còn hay mất, kế hoạch restore và sửa pipeline. Không được giả định “volume luôn được backup”.

### SC-D06 — Chạy được local, CI không pull được base image

CI báo `429 Too Many Requests` xen kẽ `unauthorized`. Phân biệt rate limit, credential scope, registry mirror, proxy/DNS/TLS và tag bị xóa. Đề xuất retry có backoff nhưng không che lỗi auth.

### SC-D07 — Secret xuất hiện trong `docker history`

Token private registry từng được truyền bằng `ARG` rồi dùng trong `RUN`. Cần xử lý sự cố ngay cả khi Dockerfile đã sửa thế nào? Bao gồm rotation, purge/rebuild, cache/registry, BuildKit secret mount, scan và audit.

### SC-D08 — CPU host 100%, một container chiếm hết

Không có limit. Hãy điều tra bằng Docker và host tools, phân biệt legitimate load, loop, crypto-mining/compromise, CPU throttling, shares, quota; đưa ra containment không làm mất bằng chứng forensic.

## B. Kubernetes (SC-K01 → SC-K12)

### SC-K01 — `ImagePullBackOff`

Event gồm `manifest unknown` trên một node pool và `x509: certificate signed by unknown authority` trên pool khác. Tách hai nguyên nhân, kiểm tra image/digest/architecture, registry credential và trust store/runtime trên node.

### SC-K02 — `CrashLoopBackOff`, không thấy log hiện tại

Container chết sau 200 ms với exit 1; `kubectl logs` trả rỗng. Chỉ ra cách dùng `--previous`, events, termination state, entrypoint/config/secret, ephemeral debug hoặc debug image; tránh sửa tay container.

### SC-K03 — Pod Pending sau khi thêm resource requests

Event: `0/6 nodes are available: 3 Insufficient memory, 3 node(s) had untolerated taint`. Hãy giải thích scheduler và đề xuất nhiều phương án, không chỉ “thêm toleration”. Phương án nào có thể làm workload chạy nhầm dedicated nodes?

### SC-K04 — Service trả timeout sau đổi label

Deployment rollout xong, Pods Ready nhưng `kubectl get endpointslice` cho Service không có endpoint. Dựa trên selector/template labels, named `targetPort`, readiness và namespace để xác định lỗi; thêm policy/test nào ngăn tái diễn?

### SC-K05 — DNS lúc được lúc không

Chỉ Pod trên một node không resolve service name; IP Service vẫn timeout. Hãy phân nhánh `/etc/resolv.conf`, CoreDNS, kube-proxy/service dataplane, CNI/node network, NetworkPolicy, conntrack và node-local DNS.

### SC-K06 — Ingress 503 trong rollout

Readiness endpoint luôn trả 200 ngay khi process mở port, nhưng cache warm-up mất 40 giây. Deployment dùng `maxUnavailable: 50%`, 4 replicas. Thiết kế lại readiness/startup, rollout parameters, preStop/termination và canary/rollback.

### SC-K07 — OOMKilled nhưng dashboard cho thấy memory trung bình thấp

Phân biệt working set trung bình với peak, per-container/sidecar, limit, node pressure, QoS và memory leak. Nêu query/tín hiệu và cách right-size mà không chỉ tăng limit vô hạn.

### SC-K08 — HPA không scale

`kubectl top pods` có số liệu, nhưng HPA hiển thị `cpu: <unknown>/70%`; một container không khai báo CPU request. Giải thích công thức utilization, events/conditions của HPA và sửa manifest. Nêu khi nào dùng custom/external metric.

### SC-K09 — PVC Pending ở multi-zone cluster

StorageClass dùng `Immediate`; PV được tạo zone A nhưng Pod bị node affinity ép zone B. Đề xuất `WaitForFirstConsumer`, kiểm tra CSI/topology, và kế hoạch xử lý volume đã provision mà không mất dữ liệu.

### SC-K10 — Node drain bị treo

Drain báo PDB violation, DaemonSet pods và một Pod dùng `emptyDir`. Hãy quyết định cho từng loại; giải thích cờ nguy hiểm, PDB semantics, local ephemeral data và cách phối hợp app owner.

### SC-K11 — Quyền RBAC “forbidden”

ServiceAccount `reporter` đọc Pod được nhưng không đọc `pods/log`. Hãy dùng `kubectl auth can-i --as=system:serviceaccount:...`, nhận diện subresource và viết rule least-privilege. Không cấp wildcard.

### SC-K12 — Secret bị lộ qua Git và env dump

Secret đã nằm trong Git history và log CI; một Pod cũng expose environment trong debug endpoint. Lập incident response: revoke/rotate, audit access, clean history theo quy trình tổ chức, rollout, prevent/scan, external secret và log redaction.

## C. Platform/production (SC-P01 → SC-P04)

### SC-P01 — Latency p99 tăng nhưng CPU thấp

Traffic không tăng, error rate thấp, p99 từ 200 ms lên 4 s. Nêu kế hoạch correlation metrics/logs/traces và kiểm tra downstream, DNS, connection pool, throttling, GC, I/O, queue, network. Chọn mitigation dựa trên bằng chứng.

### SC-P02 — Rollout config gây lỗi 30% request

Một ConfigMap được cập nhật in-place; Pods reload ở thời điểm khác nhau. Thiết kế immutable/versioned config, checksum-triggered rollout, validation, progressive delivery và rollback atomically.

### SC-P03 — Cluster mất một zone

Ứng dụng có 6 replicas nhưng cả 6 nằm cùng zone; database 3 Pod cũng mất quorum. Đưa kế hoạch trước sự cố cho topology spread/anti-affinity, storage topology, quorum, PDB, capacity headroom, traffic failover và game day.

### SC-P04 — Khôi phục sau mất cluster

Bạn có Git manifests, etcd snapshot 12 giờ trước và database backup 30 phút trước nhưng chưa từng restore. Xác định thứ tự khôi phục, quản lý key/Secrets/certificates, RPO/RTO thực tế, kiểm tra consistency và tiêu chí tuyên bố dịch vụ phục hồi.

## Điều kiện fail toàn bài dù đủ điểm

- Dùng thao tác xóa/prune/drain/force mà không khoanh vùng và backup/rollback.
- Đề xuất đưa secret thật vào source/YAML/command history.
- Chẩn đoán bằng phỏng đoán nhưng không nêu evidence xác nhận.
- Chỉ “restart/scale/tăng limit” mà không tìm nguyên nhân gốc ở quá nửa số câu.
