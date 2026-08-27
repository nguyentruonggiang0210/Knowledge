# Level 3 – Cloud-Native

Tổng: **20 câu / 38 điểm**. Giả định cluster production có nhiều tenant và GitOps reconciliation.

## N01 — Trắc nghiệm (1 điểm) · D10

Đối tượng Kubernetes nào thường quản lý replica stateless và rolling update của Pod?

A. Deployment  
B. ConfigMap  
C. Namespace  
D. Secret duy nhất

## N02 — Đúng/Sai (1 điểm) · D10

Một Service có selector đúng nhưng không có Endpoint/EndpointSlice sẵn sàng có thể khiến request không đến Pod, dù Service object tồn tại.

## N03 — Trắc nghiệm (1 điểm) · D10

Probe nào quyết định Pod có nên nhận traffic từ Service?

A. Readiness probe  
B. Liveness probe duy nhất  
C. Startup probe duy nhất  
D. Image pull policy

## N04 — Trắc nghiệm (1 điểm) · D10

CPU/memory requests chủ yếu được scheduler dùng để làm gì?

A. Chọn node dựa trên tài nguyên yêu cầu và tính allocatable  
B. Mã hóa Secret  
C. Cấp DNS public  
D. Tạo image digest

## N05 — Đúng/Sai (1 điểm) · D10, D11

Kubernetes Secret mặc định nên được xem như cơ chế mã hóa end-to-end hoàn chỉnh; base64 tự nó là encryption.

## N06 — Trắc nghiệm (1 điểm) · D10, D11

RoleBinding khác ClusterRoleBinding chủ yếu ở đâu?

A. RoleBinding cấp quyền trong namespace scope; ClusterRoleBinding gắn quyền cluster-wide  
B. RoleBinding chỉ dùng cho TLS  
C. ClusterRoleBinding tạo Pod  
D. Không có khác biệt scope

## N07 — Đúng/Sai (1 điểm) · D10

Nếu cluster có NetworkPolicy controller, chỉ tạo một policy ingress cho Pod không mặc định chặn egress của Pod đó; isolation được xác định riêng theo direction.

## N08 — Trắc nghiệm (1 điểm) · D12

Để nối trace qua nhiều service, thông tin quan trọng nhất cần propagate qua request là:

A. Trace context/span context theo chuẩn tương thích  
B. Password database  
C. Node private key  
D. Toàn bộ log file

## N09 — Giải thích reconciliation (2 điểm) · D10

Giải thích desired state, controller/reconciliation loop và eventual convergence trong Kubernetes/GitOps. Vì sao sửa trực tiếp resource trong cluster có thể bị controller ghi đè?

## N10 — Giải thích request path (2 điểm) · D03, D10

Mô tả đường đi DNS → external LB → Ingress/Gateway → Service → Endpoint/Pod. Nêu vai trò selector, port/targetPort, readiness và network policy.

## N11 — Giải thích resource (2 điểm) · D10, D13

Phân biệt requests/limits và hậu quả CPU throttling, memory OOMKill, overcommit. Đề xuất evidence để right-size thay vì đoán.

## N12 — Giải thích Helm/GitOps (2 điểm) · D10

Phân biệt Helm package/render/release với GitOps reconciliation. Nêu cách quản lý values/secret, drift và rollback khi Helm được dùng bên trong GitOps.

## N13 — Giải thích OTel (2 điểm) · D12

Nêu vai trò SDK/auto-instrumentation, Collector, exporter/backend và context propagation. Khi nào tail/head sampling hữu ích và trade-off mất trace/chi phí là gì?

## N14 — Giải thích SLO cho service (2 điểm) · D12, D13

Thiết kế một availability SLI từ request “tốt”/“hợp lệ”, SLO theo cửa sổ và burn-rate alert. Vì sao CPU cao không tự nó là availability SLI?

## N15 — Debug CrashLoopBackOff (3 điểm) · D10, D12

Pod vào `CrashLoopBackOff` sau release. Lập thứ tự kiểm tra events, current/previous logs, exit code, command/args, config/secret, probe, OOM/resource và dependency. Khi nào rollback hợp lý?

## N16 — Debug Pending Pod (3 điểm) · D10, D13

Pod ở `Pending` dù cluster “còn CPU trung bình”. Nêu cách kiểm tra scheduler events, requests vs allocatable, taint/toleration, affinity, quota, PVC/zone và fragmentation. Vì sao metric trung bình toàn cluster dễ gây hiểu sai?

## N17 — Tình huống zero-downtime (3 điểm) · D08, D10, D14

Thiết kế rolling deploy API trên Kubernetes có migration database: readiness/startup, surge/unavailable, graceful termination, connection draining, PodDisruptionBudget, expand/contract schema và rollback condition.

## N18 — Debug NetworkPolicy (3 điểm) · D03, D10

Sau khi bật default-deny egress, app không resolve DNS và không gọi database. Hãy đề xuất policy tối thiểu cho DNS và DB, cách xác định namespace/pod selector/port/protocol và evidence từ DNS/network flow; không mở toàn bộ egress.

## N19 — Tình huống telemetry cost (3 điểm) · D12, D16

Prometheus/OTel backend tăng chi phí mạnh vì label `user_id` và `request_id`; trace ingest cũng quá lớn. Giải thích cardinality, thay đổi attribute/metric design, sampling, retention/tiering và guardrail trong CI/runtime.

## N20 — Tình huống cluster supply chain (3 điểm) · D08, D10, D11

Thiết kế admission/deploy chain chỉ cho image theo digest đã scan/sign/attest, chạy non-root, giới hạn privilege và có exception break-glass có hạn. Nêu cách tránh việc policy outage chặn toàn bộ recovery.

