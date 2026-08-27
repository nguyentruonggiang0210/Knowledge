# Junior question bank

Gợi ý vòng 45 phút: 4 câu Docker + 4 câu Kubernetes + drill `TD-01` hoặc `TD-03`. Mỗi câu chính 2–3 phút, follow-up 2 phút.

## Docker

### J-D01 — Container và VM

Container khác virtual machine thế nào? Khi nào bạn vẫn chọn VM?

**Follow-up:** Việc chia sẻ kernel ảnh hưởng compatibility và security boundary ra sao?

### J-D02 — Image/container/registry

Giải thích image, container, layer và registry cho một developer mới.

**Follow-up:** Vì sao restart container khác recreate container?

### J-D03 — Dockerfile lifecycle

`FROM`, `WORKDIR`, `COPY`, `RUN`, `ENV`, `EXPOSE`, `USER`, `CMD`, `ENTRYPOINT` dùng để làm gì?

**Follow-up:** `EXPOSE 8080` có mở port host không? `CMD` và `ENTRYPOINT` khác nhau?

### J-D04 — Build cache

Vì sao Dockerfile thường copy lockfile và cài dependencies trước khi copy source?

**Follow-up:** Một thay đổi file source invalidates những layer nào?

### J-D05 — Multi-stage build

Multi-stage build giải quyết vấn đề gì? Cho ví dụ Go/Java/Node.

**Follow-up:** Debug image tối giản bằng cách nào mà không nhét tool vào production image?

### J-D06 — Volume/bind mount

Phân biệt named volume, bind mount và writable container layer.

**Follow-up:** Vì sao bind mount source code hợp development nhưng thường không hợp production artifact?

### J-D07 — Networking

Hai service Compose gọi nhau thế nào? `localhost` bên trong container là ai?

**Follow-up:** `-p 8080:80` nghĩa là gì; `EXPOSE` khác gì?

### J-D08 — Logs và debug

Container vừa exit. Bạn dùng những lệnh/evidence nào trước?

**Follow-up:** Exit 137 gợi ý gì, và vì sao chưa đủ để kết luận OOM?

### J-D09 — Signal/PID 1

Vì sao app phải xử lý SIGTERM và nên dùng exec-form `CMD`?

**Follow-up:** Điều gì xảy ra khi timeout của `docker stop` hết?

### J-D10 — Healthcheck/restart

Healthcheck và restart policy giải quyết hai vấn đề khác nhau thế nào?

**Follow-up:** Standalone Docker có tự restart container chỉ vì unhealthy không?

### J-D11 — Compose readiness

`depends_on` có bảo đảm database sẵn sàng nhận query không?

**Follow-up:** Tại sao dù có `service_healthy`, app vẫn cần retry/backoff?

### J-D12 — Non-root

Vì sao không nên chạy app bằng root trong container? Bạn sửa Dockerfile thế nào?

**Follow-up:** Non-root có đồng nghĩa container an toàn không?

### J-D13 — Secrets

Vì sao không đưa password/token vào Dockerfile, image hoặc Git? Cách truyền phù hợp theo build-time/runtime?

**Follow-up:** Nếu secret đã xuất hiện trong history thì chỉ xóa commit/file có đủ không?

### J-D14 — Resource limits

Vì sao cần CPU/memory limits? CPU limit và memory limit biểu hiện khác nhau khi chạm ngưỡng?

**Follow-up:** Bạn quan sát throttling/OOM bằng gì?

## Kubernetes

### J-K01 — Kubernetes giải quyết gì

Kubernetes bổ sung gì so với chạy `docker compose` trên một máy?

**Follow-up:** Khi nào Compose vẫn là lựa chọn đơn giản hơn?

### J-K02 — Cluster components

Nêu vai trò API server, etcd, scheduler, controller manager và kubelet.

**Follow-up:** `kubectl apply` thành công có nghĩa app đã Ready chưa?

### J-K03 — Pod

Pod là gì? Vì sao không nên đặt mọi microservice vào cùng một Pod?

**Follow-up:** Containers cùng Pod chia sẻ gì và bị schedule thế nào?

### J-K04 — Deployment/ReplicaSet/Pod

Mối quan hệ giữa Deployment, ReplicaSet và Pod là gì?

**Follow-up:** Vì sao sửa trực tiếp Pod không bền vững?

### J-K05 — Chọn controller

Khi nào dùng Deployment, StatefulSet, DaemonSet, Job và CronJob?

**Follow-up:** “Có volume” có tự động nghĩa là phải dùng StatefulSet không?

### J-K06 — Service

Service cần thiết vì Pod IP thay đổi như thế nào? ClusterIP/NodePort/LoadBalancer khác nhau?

**Follow-up:** Service không có endpoint thì kiểm tra gì đầu tiên?

### J-K07 — ConfigMap/Secret

ConfigMap và Secret khác nhau? Base64 có bảo mật secret không?

**Follow-up:** Update giá trị có tự đổi environment của process đang chạy không?

### J-K08 — Requests/limits

Requests và limits dùng cho scheduling/runtime như thế nào?

**Follow-up:** CPU chạm limit và memory chạm limit khác nhau?

### J-K09 — Probes

Startup, readiness và liveness probe khác nhau thế nào?

**Follow-up:** Tại sao liveness không nên fail chỉ vì database ngoài đang down?

### J-K10 — Pod states

Phân biệt `Pending`, `ImagePullBackOff`, `CrashLoopBackOff`, `Running` nhưng not Ready.

**Follow-up:** Với CrashLoop, lấy log lần chạy trước bằng cách nào?

### J-K11 — Namespace/RBAC

Namespace dùng để làm gì? RoleBinding và ClusterRoleBinding khác phạm vi thế nào?

**Follow-up:** Namespace có tự chặn network giữa hai team không?

### J-K12 — Storage

PV, PVC và StorageClass liên hệ thế nào?

**Follow-up:** PVC Pending cần xem evidence nào trước khi xóa/recreate?

### J-K13 — Rollout

Bạn theo dõi và rollback Deployment thế nào?

**Follow-up:** Readiness ảnh hưởng rolling update như thế nào?

### J-K14 — Scheduling

Pod Pending với `Insufficient cpu` nghĩa là gì? Taint/toleration ở mức cơ bản là gì?

**Follow-up:** Toleration có kéo Pod tới node mang taint không?

### J-K15 — NetworkPolicy

NetworkPolicy giải quyết gì và cần điều kiện nào mới có hiệu lực?

**Follow-up:** Default-deny egress thường vô tình làm hỏng thành phần nào?

### J-K16 — Debug flow

Nêu chuỗi lệnh/evidence đầu tiên khi app Kubernetes không truy cập được.

**Follow-up:** Vì sao `kubectl describe`, Events, logs và EndpointSlice bổ sung cho nhau?
