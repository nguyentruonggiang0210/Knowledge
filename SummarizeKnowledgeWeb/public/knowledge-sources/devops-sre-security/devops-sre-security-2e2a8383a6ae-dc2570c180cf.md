# D10 - Kubernetes, Helm và GitOps từ cơ bản đến production

## Mục tiêu

- Hiểu API, desired state, control loop, scheduler và data plane.
- Deploy/debug workload, service, config, storage, identity và network policy.
- Thiết kế probes/resources/autoscaling/disruption/upgrade an toàn.
- Dùng Helm/Kustomize và GitOps mà không biến template thành mê cung.

## Kubernetes mental model

~~~mermaid
flowchart TB
  User[kubectl GitOps client] --> API[API server]
  API <--> ETCD[etcd desired and cluster state]
  API --> Controllers[Controllers reconcile]
  API --> Scheduler[Scheduler binds Pods]
  Kubelet[Kubelet on node] --> API
  Scheduler --> Kubelet
  Kubelet --> Runtime[Container runtime]
  CNI[CNI network] --> Runtime
  CSI[CSI storage] --> Runtime
  Cloud[Cloud controller] --> API
~~~

Control plane nhận state/đưa quyết định; worker/data plane chạy workload. Controller liên tục
so actual với desired. kubectl apply thành công chỉ nói API chấp nhận object, không chứng
minh workload ready hay user outcome đạt.

## Object chọn theo semantics

| Object | Dùng khi |
|---|---|
| Pod | Đơn vị chạy nhỏ nhất; hiếm khi tạo trực tiếp production |
| Deployment/ReplicaSet | Stateless replica và rolling update |
| StatefulSet | Stable identity/order/storage semantics |
| DaemonSet | Một Pod trên các node phù hợp |
| Job/CronJob | Task hữu hạn hoặc lịch; cần idempotency/concurrency policy |
| Service | Stable virtual endpoint tới Pod selector |
| Ingress/Gateway | HTTP/TCP entry tùy controller/implementation |
| ConfigMap/Secret | Config data; Secret không tự được mã hóa an toàn ở mọi nơi |
| PV/PVC/StorageClass | Yêu cầu và cấp persistent storage |

CRD mở rộng API; Operator là controller cho domain logic. Mỗi extension tăng upgrade,
security và operational burden.

## Pod lifecycle và probes

- startupProbe: cho app khởi động chậm trước khi liveness có hiệu lực.
- readinessProbe: Pod có nên nhận traffic lúc này?
- livenessProbe: process có kẹt đến mức restart là mitigation đúng?

Probe có timeout/failureThreshold/period và phải rẻ. Readiness không nên xanh trước khi app
phục vụ; liveness không nên phụ thuộc remote database khiến dependency outage restart toàn
fleet. SIGTERM, preStop và terminationGracePeriod phải đủ để endpoint rời load balancing,
drain và shutdown.

## Scheduling và resource

- request dùng cho scheduling và làm basis CPU share; limit áp boundary theo resource/runtime.
- Memory vượt limit có thể OOMKilled; CPU limit thường throttle.
- QoS, eviction, node pressure, taint/toleration, affinity và topology spread ảnh hưởng placement.
- PDB giới hạn voluntary disruption, không bảo vệ node crash hay đảm bảo replica thực sự ở
  nhiều failure domain.
- HPA cần metric/resource request đúng; VPA/cluster autoscaler giải bài toán khác.
- Namespace/resource quota/limit range là guardrail multi-team, không là security boundary đủ.

## Network và service discovery

Mỗi Pod có IP theo model cluster, Service chọn endpoint qua label. Debug:

1. Pod Ready? IP?
2. Service selector có khớp label?
3. EndpointSlice có endpoint?
4. DNS name/namespace đúng?
5. targetPort/containerPort đúng?
6. NetworkPolicy/CNI/route/MTU/kube-proxy hoặc implementation?
7. Ingress/Gateway controller, LB health, TLS/SNI?

NetworkPolicy chỉ có hiệu lực khi CNI hỗ trợ. Default-deny cần explicit DNS/egress/monitoring
paths. Ingress object không tự tạo traffic path nếu thiếu controller.

## Security baseline

- Dedicated ServiceAccount; automount token false nếu không gọi API.
- RBAC least privilege, workload identity thay static cloud key.
- Pod Security restricted baseline; non-root, seccomp, drop capabilities, no privilege escalation.
- Read-only rootfs, approved signed image digest, resource/PID limits.
- Secret encrypt at rest, access audit, external manager/rotation; không commit plaintext.
- Admission policy kiểm image/source/security; exception có owner/expiry.
- API audit, runtime detection và node/control-plane hardening/patch.

## Configuration và storage

ConfigMap/Secret update không chắc app reload; rollout checksum hoặc reload contract. Environment
variable không đổi trong process đang chạy. PVC durability phụ thuộc StorageClass/provider;
snapshot/etcd backup không tự backup application-consistent database. Luôn restore test.

## Helm, Kustomize và environment

- Helm package/template/release lifecycle; values là API cần schema/default/docs.
- Kustomize patch base mà không template language; phù hợp biến thể cấu trúc.
- Tránh copy manifest per environment và tránh values file chứa secret.
- Render rồi schema/policy/diff/test trước apply.
- Pin chart/image/CRD; lập kế hoạch upgrade/rollback và ownership.

Template abstraction chỉ nên che complexity lặp; đừng làm generic chart hỗ trợ mọi tổ hợp
không ai test.

## GitOps

~~~mermaid
flowchart LR
  Change[PR desired state] --> Review[Test policy approval]
  Review --> Git[Protected Git]
  Git --> Controller[Argo CD or Flux]
  Controller --> Cluster[Reconcile cluster]
  Cluster --> Status[Health drift events]
  Status --> Team[Alert and feedback]
~~~

Controller pull state bằng quyền tối thiểu, auto-heal drift theo policy. Promotion thay
immutable digest qua PR; không rebuild. Emergency kubectl change cần audit, sau đó reconcile
về Git hoặc controller sẽ hoàn tác. GitOps không tự giải secret, database migration hay
progressive analysis.

## Production cluster concerns

- Managed control plane giảm toil nhưng team vẫn sở hữu workload/RBAC/network/data/upgrade.
- Đọc version-skew policy; upgrade control plane, add-on, node, API/CRD theo rehearsal.
- CNI/CSI/DNS/ingress/metrics/logging/certificate là critical dependencies.
- etcd/control-plane backup khác PV/application data backup.
- Node image rotation, disruption budget, surge capacity và quota phải được capacity-plan.
- Multi-tenancy mạnh có thể cần cluster/account boundary, không chỉ namespace.

## Chạy sample local

Yêu cầu Docker, kubectl và kind. Từ repository root:

~~~powershell
docker build -t devops-demo:local .\Devops\09-containers-docker\lab
kind create cluster --name devops-lab
kind load docker-image devops-demo:local --name devops-lab
kubectl apply -k .\Devops\10-kubernetes-helm-gitops\lab
kubectl -n devops-lab rollout status deployment/devops-demo --timeout=120s
kubectl -n devops-lab port-forward service/devops-demo 8080:80
~~~

Ở terminal khác gọi http://localhost:8080/healthz. Cleanup đúng scope:

~~~powershell
kind delete cluster --name devops-lab
~~~

Linux/macOS dùng path với dấu /. NetworkPolicy nằm file riêng và được Kustomize áp dụng; nếu
CNI local không enforce, hãy dùng cluster/CNI hỗ trợ cho bài policy.

## Break/fix drill

1. ImagePullBackOff: sai tag/digest/registry credential.
2. Pending: request vượt node, taint/affinity hoặc PVC chưa bind.
3. CrashLoopBackOff: command/config/permission/liveness.
4. Service không endpoint: selector/readiness/port.
5. OOMKilled/CPU throttling: limit và workload.
6. Rollout treo vì PDB/capacity/probe; quan sát events và rollout history.
7. NetworkPolicy chặn DNS/upstream; chứng minh packet path.
8. Upgrade deprecated API trong sandbox; render/dry-run trước.

Debug theo:

~~~bash
kubectl get deploy,rs,pod,service,endpointslice -n devops-lab -o wide
kubectl describe pod -n devops-lab <pod>
kubectl logs -n devops-lab <pod> --previous
kubectl get events -n devops-lab --sort-by=.lastTimestamp
kubectl auth can-i --as=system:serviceaccount:devops-lab:devops-demo get pods
kubectl diff -k Devops/10-kubernetes-helm-gitops/lab
~~~

## Hoàn thành D10 khi

- Giải thích control loop và debug từ scheduling đến user request.
- Sample đạt restricted security context, probes/resources/PDB/policy.
- Rollout, abort/rollback hoặc roll-forward có evidence.
- GitOps tự heal drift và emergency change được reconcile.
- Có cluster/add-on/node/data upgrade và backup/restore plan.
- Biết khi managed service/VM đơn giản hơn Kubernetes.

Nguồn: [Kubernetes concepts](https://kubernetes.io/docs/concepts/),
[Kubernetes production environment](https://kubernetes.io/docs/setup/production-environment/),
[Helm docs](https://helm.sh/docs/) và [OpenGitOps principles](https://opengitops.dev/).

Tiếp theo: [D11 - DevSecOps và supply chain](../11-devsecops-supply-chain/README.md).
