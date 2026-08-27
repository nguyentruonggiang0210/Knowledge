# Incident runbook — sample-api

## Trigger và mục tiêu

Trigger: availability/latency SLO burn, error spike, no endpoints, rollout stuck hoặc customer report. Mục tiêu đầu tiên là giảm tác động; root cause đầy đủ làm sau khi ổn định.

## 1. Xác nhận context và scope

```powershell
kubectl config current-context
kubectl get namespace deep-k8s
kubectl get deploy,rs,pod,svc,endpointslice -n deep-k8s -o wide
```

Ghi UTC start time, người điều phối, version/deployment gần nhất, route/tenant/zone bị ảnh hưởng. Không dán token/Secret vào incident channel.

## 2. Status, Events, logs

```powershell
kubectl get deployment sample-api -n deep-k8s -o yaml
kubectl get events -n deep-k8s --sort-by='.metadata.creationTimestamp'
kubectl describe pod <pod> -n deep-k8s
kubectl logs <pod> -c api -n deep-k8s --since=20m --timestamps
kubectl logs <pod> -c api -n deep-k8s --previous --timestamps
```

## 3. Network path

```powershell
kubectl get svc sample-api -n deep-k8s -o yaml
kubectl get endpointslices -n deep-k8s -l kubernetes.io/service-name=sample-api -o yaml
kubectl apply -f CodeSample/kubernetes/networking/client.yaml
kubectl exec network-client -n deep-k8s -- curl -fsS http://sample-api/
```

Sau test:

```powershell
kubectl delete -f CodeSample/kubernetes/networking/client.yaml --ignore-not-found
```

## 4. Resource/capacity

```powershell
kubectl top pod,node
kubectl describe nodes
kubectl get hpa,pdb -n deep-k8s
```

Nếu Metrics API không có, ghi telemetry gap; không suy ra usage bằng request/limit.

## 5. Mitigation decision

Chọn một thay đổi nhỏ, reversible và có owner:

- rollback bad rollout;
- revert config/policy thay đổi;
- scale trong giới hạn downstream/capacity;
- chuyển traffic/fail over theo runbook;
- pause rollout/reconciliation có expiry và audit.

Trước thay đổi: ghi hypothesis, expected signal và rollback. Sau thay đổi: verify user SLI, endpoint/ready replicas, error/latency và không có regression.

## 6. Close và follow-up

- Timeline dựa trên timestamp/evidence.
- Root cause + contributing factors, không chỉ “human error”.
- Detection gap và vì sao guardrail/test không bắt được.
- Action cụ thể có owner/deadline/verification.
- Backport mọi break-glass live change về Git, khôi phục reconciliation.
