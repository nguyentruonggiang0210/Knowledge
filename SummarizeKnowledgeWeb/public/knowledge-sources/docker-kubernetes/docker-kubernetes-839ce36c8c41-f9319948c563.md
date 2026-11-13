# Diagnostic — Docker & Kubernetes

**Thời gian:** 75 phút. **Không tài liệu.** Tổng 48 điểm, mỗi câu 1 điểm. Đáp án nằm trong `90-answer-key.md`.

## A. Docker (DG-D01 → DG-D20)

1. **DG-D01 — Chọn một.** Container khác VM chủ yếu ở điểm nào?  
   A. Container không có filesystem  
   B. Container chia sẻ kernel host, VM thường có guest kernel  
   C. Container luôn an toàn hơn VM  
   D. Container không chạy process
2. **DG-D02 — Câu ngắn.** Namespace và cgroup giải quyết hai nhóm vấn đề nào?
3. **DG-D03 — Chọn một.** Khi process PID 1 trong container kết thúc, điều gì xảy ra?  
   A. Docker tự chọn process khác làm PID 1  
   B. Container dừng  
   C. Image bị xóa  
   D. Volume bị xóa
4. **DG-D04 — Câu ngắn.** Phân biệt image, container và registry bằng một câu cho mỗi khái niệm.
5. **DG-D05 — Chọn một.** Thứ tự Dockerfile nào thường tận dụng cache tốt hơn cho Node.js?  
   A. `COPY . .` → `RUN npm ci`  
   B. `COPY package*.json .` → `RUN npm ci` → `COPY . .`  
   C. `RUN npm ci` → `COPY package*.json .`  
   D. Không khác nhau
6. **DG-D06 — Câu ngắn.** Multi-stage build giảm rủi ro và dung lượng bằng cách nào?
7. **DG-D07 — Chọn tất cả.** Cách phù hợp để truyền token cần dùng lúc build:  
   A. `ARG TOKEN`  
   B. `ENV TOKEN=...`  
   C. BuildKit secret mount  
   D. SSH mount nếu cần agent/key
8. **DG-D08 — Câu ngắn.** Vì sao tag `latest` không phải cơ chế đảm bảo cùng một artifact?
9. **DG-D09 — Chọn một.** Dữ liệu nào phù hợp nhất với named volume?  
   A. Source code cần sửa trực tiếp trên host  
   B. Dữ liệu PostgreSQL cần tồn tại qua vòng đời container  
   C. Secret tạm thời chỉ sống trong RAM  
   D. Một file cấu hình host cố định
10. **DG-D10 — Câu ngắn.** Bind mount khác named volume về quyền quản lý và tính di động ra sao?
11. **DG-D11 — Chọn một.** Hai container trên cùng user-defined bridge nên gọi nhau bằng gì?  
    A. `localhost`  
    B. IP hard-code  
    C. Tên container/service qua DNS của Docker  
    D. Public IP host
12. **DG-D12 — Câu ngắn.** `EXPOSE 8080` khác `-p 8080:8080` thế nào?
13. **DG-D13 — Chọn một.** `depends_on` chỉ đảm bảo container database đã chạy nhưng chưa ready. Cách đúng là:  
    A. Thêm `sleep 60` cố định  
    B. `healthcheck` + `condition: service_healthy`, ứng dụng vẫn retry  
    C. Dùng `network_mode: host`  
    D. Bỏ database
14. **DG-D14 — Câu ngắn.** Vì sao ứng dụng trong container cần xử lý `SIGTERM` và PID 1 cần reap child process?
15. **DG-D15 — Chọn tất cả.** Hardening hợp lý:  
    A. Chạy non-root  
    B. `--privileged` mặc định  
    C. drop capabilities không cần  
    D. filesystem read-only khi có thể
16. **DG-D16 — Câu ngắn.** Rủi ro của mount `/var/run/docker.sock` vào container là gì?
17. **DG-D17 — Chọn một.** Container bị exit code 137 thường gợi ý:  
    A. DNS lỗi  
    B. Nhận `SIGKILL`, thường do OOM hoặc bị kill  
    C. Build cache hỏng  
    D. Port trùng
18. **DG-D18 — Câu ngắn.** Nêu chuỗi kiểm tra tối thiểu khi container restart liên tục.
19. **DG-D19 — Chọn một.** Lệnh nào cho biết cấu hình đã merge và interpolation của Compose?  
    A. `docker compose config`  
    B. `docker compose ps -a`  
    C. `docker inspect image`  
    D. `docker stats`
20. **DG-D20 — Câu ngắn.** Nêu hai kiểm soát supply-chain trước khi deploy image.

## B. Kubernetes (DG-K01 → DG-K24)

21. **DG-K01 — Câu ngắn.** Nêu vai trò của API server, etcd, scheduler và controller manager.
22. **DG-K02 — Chọn một.** Kubelet chủ yếu làm gì?  
    A. Lưu toàn bộ desired state  
    B. Bảo đảm Pod được giao cho node chạy theo PodSpec và báo trạng thái  
    C. Cấp public load balancer  
    D. Thay thế CNI
23. **DG-K03 — Câu ngắn.** “Declarative reconciliation” nghĩa là gì?
24. **DG-K04 — Chọn một.** Web API stateless cần 4 replicas và rolling update nên dùng:  
    A. Pod trần  
    B. Deployment  
    C. StatefulSet  
    D. DaemonSet
25. **DG-K05 — Chọn một.** Log collector cần đúng một bản trên mỗi node nên dùng:  
    A. Job  
    B. Deployment  
    C. DaemonSet  
    D. CronJob
26. **DG-K06 — Câu ngắn.** Khi nào StatefulSet phù hợp hơn Deployment?
27. **DG-K07 — Chọn một.** Service không có endpoints khả dụng. Kiểm tra đầu tiên:  
    A. Selector Service có khớp label Pod và Pod có Ready không  
    B. Tăng CPU node  
    C. Xóa CoreDNS  
    D. Đổi imagePullPolicy
28. **DG-K08 — Câu ngắn.** ClusterIP, NodePort và LoadBalancer khác nhau thế nào?
29. **DG-K09 — Chọn tất cả.** Về probe:  
    A. Readiness thất bại loại Pod khỏi endpoints  
    B. Liveness thất bại có thể làm container restart  
    C. Startup probe trì hoãn liveness/readiness cho app khởi động chậm  
    D. Probe luôn phải gọi dependency ngoài
30. **DG-K10 — Câu ngắn.** Request và limit ảnh hưởng scheduling/runtime ra sao?
31. **DG-K11 — Chọn một.** Pod ở `Pending` với event `Insufficient cpu` nên:  
    A. Xem requests, allocatable, workload khác và khả năng scale node  
    B. Tăng liveness timeout  
    C. Xóa Service  
    D. Đổi Secret
32. **DG-K12 — Câu ngắn.** Phân biệt `CrashLoopBackOff`, `ImagePullBackOff`, `Pending`.
33. **DG-K13 — Chọn một.** ConfigMap phù hợp nhất cho:  
    A. Password production  
    B. Cấu hình không nhạy cảm  
    C. Private key  
    D. Token registry
34. **DG-K14 — Câu ngắn.** Vì sao Kubernetes Secret mặc định chưa thể coi là kho bí mật an toàn tuyệt đối?
35. **DG-K15 — Chọn một.** Cấp quyền đọc Pod chỉ trong namespace `team-a` nên ưu tiên:  
    A. `cluster-admin`  
    B. ClusterRoleBinding wildcard  
    C. Role + RoleBinding trong `team-a`  
    D. Mount admin kubeconfig
36. **DG-K16 — Câu ngắn.** NetworkPolicy có hiệu lực trong điều kiện nào, và default behavior trước khi Pod bị select là gì?
37. **DG-K17 — Chọn một.** PVC ở `Pending` thường kiểm tra:  
    A. StorageClass/provisioner, access mode, capacity, topology và events  
    B. Ingress hostname  
    C. Liveness path  
    D. ServiceAccount
38. **DG-K18 — Câu ngắn.** Taint/toleration khác node affinity ở ý nghĩa “thu hút/đẩy ra” như thế nào?
39. **DG-K19 — Chọn một.** HPA theo CPU cần điều kiện quan trọng nào?  
    A. Có resource metrics pipeline và CPU requests hợp lệ  
    B. Chỉ cần `replicas: 1`  
    C. Bắt buộc có Ingress  
    D. Bắt buộc dùng StatefulSet
40. **DG-K20 — Câu ngắn.** PDB bảo vệ loại disruption nào và không bảo vệ loại nào?
41. **DG-K21 — Chọn một.** Khi rollout mới lỗi, lệnh/động tác hợp lý nhất:  
    A. Quan sát rollout, events/logs; dừng/rollback có kiểm soát  
    B. Xóa toàn cluster  
    C. Scale mọi thứ về 0  
    D. Xóa PVC
42. **DG-K22 — Câu ngắn.** Thứ tự debug một request từ client ngoài cluster tới Pod qua ingress/gateway và Service.
43. **DG-K23 — Chọn tất cả.** Ba trụ cột observability là:  
    A. Metrics  
    B. Logs  
    C. Traces  
    D. YAML
44. **DG-K24 — Câu ngắn.** Backup etcd và snapshot PVC khác nhau về thứ được bảo vệ; vì sao cần cả hai?

## C. Vận hành thực tế (DG-O01 → DG-O04)

45. **DG-O01.** Image chạy local nhưng cluster báo `exec format error`. Nêu nguyên nhân có xác suất cao và cách xác minh.
46. **DG-O02.** Deployment có 10 replicas, tất cả Ready nhưng p99 tăng mạnh. Nêu ít nhất bốn lớp cần kiểm tra trước khi scale mù quáng.
47. **DG-O03.** Một kỹ sư đề xuất sửa lỗi bằng `kubectl exec` rồi chỉnh file trong container production. Nêu vì sao đây không phải sửa bền vững và quy trình đúng.
48. **DG-O04.** Nêu năm thành phần tối thiểu của một runbook xử lý sự cố container/orchestrator.

## Phiếu tự nhận xét trước khi xem đáp án

- Ba chủ đề chắc nhất:
- Ba chủ đề yếu nhất:
- Câu nào mình đoán thay vì biết:
- Lab nào cần làm ngay:
