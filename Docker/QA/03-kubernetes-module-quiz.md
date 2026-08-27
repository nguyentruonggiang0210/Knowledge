# Quiz theo module — Kubernetes

**Thời gian:** 130 phút. **Tổng:** 95 điểm. Câu thường 1 điểm; câu `[2đ]` 2 điểm. Không mở `92-kubernetes-answer-key.md` trước khi hoàn thành.

## Module 1 — Kiến trúc, API và reconciliation

1. **K01.** Vẽ hoặc mô tả luồng `kubectl apply` qua authentication, authorization, admission, persistence và reconciliation.
2. **K02.** API server, etcd, scheduler, controller manager, cloud controller manager có trách nhiệm gì; thành phần nào là nguồn lưu trạng thái chuẩn?
3. **K03.** Kubelet, container runtime (qua CRI), CNI và CSI chia trách nhiệm trên node ra sao?
4. **K04.** Desired state khác observed state; `spec`, `status`, `metadata.generation` và `observedGeneration` giúp controller/client suy luận gì?
5. **K05.** Đúng hay sai: sửa trực tiếp object con ReplicaSet/Pod là cách bền vững để thay Deployment. Giải thích ownership/reconciliation.
6. **K06. [2đ]** Phân biệt client-side apply, server-side apply và field ownership/conflict ở mức vận hành.
7. **K07.** Namespace cô lập những gì và **không** tự cô lập những gì?
8. **K08. [2đ]** CRD và operator/controller pattern mở rộng Kubernetes thế nào? Nêu rủi ro khi CRD/controller bị xóa hoặc upgrade sai.

## Module 2 — Pod và workload controllers

9. **K09.** Vì sao Pod là đơn vị scheduling nhỏ nhất? Các container cùng Pod chia sẻ những namespace/tài nguyên quan trọng nào?
10. **K10.** Init container, sidecar container và ephemeral container khác mục đích/lifecycle như thế nào?
11. **K11.** Pod phase không đồng nghĩa container state ra sao? `Running` có bảo đảm app Ready không?
12. **K12.** OwnerReference và garbage collection ảnh hưởng xóa Deployment/ReplicaSet/Pod thế nào?
13. **K13. [2đ]** Deployment rolling update dùng `maxSurge`, `maxUnavailable`, readiness và `progressDeadlineSeconds` như thế nào?
14. **K14.** `Recreate` phù hợp khi nào; trade-off availability là gì?
15. **K15.** StatefulSet cung cấp stable identity, ordered behavior và volume claim templates; nó không tự giải quyết replication/backup database như thế nào?
16. **K16.** DaemonSet, Job và CronJob: chọn controller cho node agent, batch hữu hạn và lịch định kỳ.
17. **K17. [2đ]** Với Job, giải thích `completions`, `parallelism`, `backoffLimit`, `activeDeadlineSeconds`, tính idempotent và cleanup TTL.
18. **K18.** CronJob `concurrencyPolicy`, `startingDeadlineSeconds`, history limits và timezone ngăn các lỗi vận hành nào?
19. **K19.** Vì sao thường không tạo Pod trần cho application production? Nêu ngoại lệ hợp lý.

## Module 3 — Configuration, identity và security

20. **K20.** ConfigMap/Secret được inject qua env và volume khác nhau về cập nhật runtime; ứng dụng cần làm gì để reload?
21. **K21.** `data` và `stringData` của Secret khác nhau; base64 có phải encryption không?
22. **K22. [2đ]** Nêu baseline bảo vệ Secret: encryption at rest, RBAC, external store/CSI nếu cần, rotation, audit và tránh leak qua log/env.
23. **K23.** ServiceAccount là identity của workload như thế nào? Khi nào đặt `automountServiceAccountToken: false`?
24. **K24. [2đ]** Phân biệt Role/ClusterRole và RoleBinding/ClusterRoleBinding. Một RoleBinding có thể bind ClusterRole để làm gì?
25. **K25.** Vì sao wildcard, `cluster-admin`, quyền tạo Pod, `bind`, `escalate`, `impersonate` hoặc đọc Secret có thể dẫn đến privilege escalation?
26. **K26. [2đ]** Viết các trường `securityContext` cốt lõi cho container non-root, không privilege escalation, root filesystem read-only, drop capabilities và seccomp mặc định.
27. **K27.** Pod Security Standards `Privileged`, `Baseline`, `Restricted` khác mục tiêu; Pod Security Admission thường gắn policy theo phạm vi nào?
28. **K28.** Admission validating khác mutating; webhook lỗi/chậm có thể ảnh hưởng control plane thế nào?
29. **K29.** Image pull secret, runtime application secret và build secret là ba loại lifecycle khác nhau ra sao?

## Module 4 — Networking và traffic management

30. **K30.** Mô hình mạng Kubernetes đặt kỳ vọng gì cho Pod-to-Pod, container cùng Pod và Pod IP?
31. **K31.** Service selector tạo quan hệ với EndpointSlice; readiness ảnh hưởng endpoint phục vụ thế nào?
32. **K32.** ClusterIP, headless Service, NodePort, LoadBalancer và ExternalName khác use case.
33. **K33. [2đ]** Mô tả DNS search path của `api.team-a.svc.cluster.local`; vì sao short name có thể resolve khác namespace?
34. **K34.** `port`, `targetPort`, `nodePort`, named port khác nhau.
35. **K35.** Ingress/Gateway API khác Service `LoadBalancer`; vì sao tạo Ingress object nhưng không có controller sẽ không có traffic?
36. **K36. [2đ]** NetworkPolicy là allow-list cộng dồn thế nào? Policy rỗng default-deny ingress/egress có tác dụng gì và vì sao phải allow DNS?
37. **K37.** `podSelector` và `namespaceSelector` trong cùng một item so với hai item riêng biểu diễn AND/OR khác nhau thế nào?
38. **K38. [2đ]** Debug `curl: Could not resolve host` trong Pod theo chuỗi: Pod config → DNS service/endpoints → CoreDNS → network policy/CNI → upstream.
39. **K39. [2đ]** Debug 502 từ ingress nhưng curl thẳng Service được: nêu ít nhất sáu điểm kiểm tra.

## Module 5 — Storage

40. **K40.** `emptyDir`, `configMap/secret volume`, `hostPath`, PVC khác persistence và portability ra sao?
41. **K41.** PV, PVC, StorageClass, CSI driver/provisioner/attacher liên hệ thế nào trong dynamic provisioning.
42. **K42.** Access modes RWO, ROX, RWX, RWOP diễn tả khả năng mount, không nhất thiết là filesystem-level write protection như thế nào?
43. **K43.** `reclaimPolicy: Retain/Delete` tác động gì khi PVC/PV bị xóa? Vì sao cần kiểm tra trước production.
44. **K44.** `volumeBindingMode: WaitForFirstConsumer` giải quyết topology scheduling ra sao?
45. **K45. [2đ]** PVC `Pending`: nêu chuỗi evidence cần lấy và các nhóm nguyên nhân.
46. **K46. [2đ]** Snapshot volume có phải backup hoàn chỉnh không? Nêu yêu cầu consistency, off-cluster copy, restore test, RPO/RTO.

## Module 6 — Resources, scheduling và disruption

47. **K47. [2đ]** Requests tác động scheduler; CPU limit và memory limit được kernel enforce khác nhau; nếu chỉ đặt limit thì request có thể được default thế nào?
48. **K48.** QoS `Guaranteed`, `Burstable`, `BestEffort` được phân loại thế nào và liên quan eviction ra sao?
49. **K49.** LimitRange và ResourceQuota khác phạm vi/đối tượng kiểm soát.
50. **K50. [2đ]** `nodeSelector`, node affinity required/preferred, pod affinity/anti-affinity và topology spread phù hợp với use case gì?
51. **K51.** Taint effect `NoSchedule`, `PreferNoSchedule`, `NoExecute`; toleration có bảo đảm Pod được schedule lên node đó không?
52. **K52.** PriorityClass/preemption có thể gây hậu quả gì; PDB được scheduler tôn trọng tuyệt đối khi preemption không?
53. **K53. [2đ]** Phân biệt voluntary disruption, node-pressure eviction, API eviction và trực tiếp delete Pod. PDB bao phủ phần nào?
54. **K54.** `kubectl cordon`, `drain`, `uncordon` dùng khi bảo trì; trước drain phải kiểm tra gì?

## Module 7 — Health, autoscaling, observability và operations

55. **K55. [2đ]** Thiết kế startup/readiness/liveness cho app khởi động 90 giây, có endpoint riêng; giải thích vì sao liveness không nên phụ thuộc database ngoài.
56. **K56.** `preStop`, `terminationGracePeriodSeconds`, SIGTERM, readiness và endpoint removal cần phối hợp để zero/minimal-downtime thế nào?
57. **K57. [2đ]** HPA tính CPU utilization dựa trên usage/request; thiếu request gây gì? Nêu metrics API, stabilization và nguyên nhân flapping.
58. **K58.** HPA, VPA và node autoscaler giải quyết ba vòng scale khác nhau; xung đột tiềm năng?
59. **K59.** PDB `minAvailable` và `maxUnavailable` không được đặt đồng thời; với 5 replicas cần giữ quorum 3 nên chọn gì và trade-off?
60. **K60. [2đ]** Một deployment `CrashLoopBackOff`: đưa thứ tự lệnh/evidence gồm status, events, current/previous logs, describe, config, resources, probe, image/change history.
61. **K61. [2đ]** Pod `Pending`: phân nhánh Unschedulable, PVC Pending, image pull (sau schedule), admission, quota và scheduler profile thế nào?
62. **K62.** Metrics, logs, traces và Kubernetes Events trả lời bốn loại câu hỏi khác nhau nào? Vì sao Events không phải log lưu dài hạn?
63. **K63. [2đ]** Nêu golden signals/SLO cho HTTP service và alert nào nên page, alert nào chỉ ticket.
64. **K64. [2đ]** Kế hoạch upgrade cluster an toàn phải bao gồm API deprecation scan, compatibility, addon/CRD, backup/restore, canary, node drain, rollback và validation ra sao?

## Module 8 — Đóng gói, delivery và multi-tenancy

65. **K65.** Helm template/package/release khác Kustomize base/overlay; khi nào chọn mỗi cách hoặc kết hợp?
66. **K66.** GitOps reconciliation khác chạy `kubectl apply` thủ công ở audit, drift và rollback thế nào?
67. **K67. [2đ]** Thiết kế promotion dev → staging → prod mà không rebuild image; nêu immutable artifact, config, policy gate và progressive delivery.
68. **K68. [2đ]** Namespace **không đủ** cho hard multi-tenancy. Nêu ít nhất sáu lớp kiểm soát bổ sung.
69. **K69.** Backup control-plane state, manifests/Git, Secrets/keys và application data khác nhau; restore order cần suy nghĩ gì?
70. **K70. [2đ]** Khi chọn managed Kubernetes hay tự quản, hãy nêu các trade-off về control plane, upgrade, integration, portability, cost và on-call.

## Tự kiểm

- Những câu chỉ nhớ tên nhưng chưa giải thích được cơ chế:
- Những YAML/lệnh cần tự chạy xác minh:
- Ba failure mode chưa từng diễn tập:
