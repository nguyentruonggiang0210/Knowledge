# Kubernetes upgrade checklist

## Trước khi phê duyệt

- [ ] Current/target exact versions và latest patch; không skip minor ngoài support của platform.
- [ ] Version-skew matrix: API server, kubelet, kube-proxy, kubectl, kubeadm/tooling.
- [ ] Release notes, deprecation guide, feature gates, known issues đã review.
- [ ] Audit/metric/static scan không còn API sẽ bị remove; owner cho mọi deprecated call.
- [ ] CNI, CSI, CoreDNS, ingress/gateway, metrics, admission, operators/CRDs có support matrix.
- [ ] OS/kernel/cgroup/runtime và node image tương thích.
- [ ] PDB/topology/capacity cho drain; cloud quota/subnet IP/volume attach đủ.
- [ ] etcd/control-plane và application-data backup đã restore-test.
- [ ] Staging rehearsal với critical workload, policy/webhook và smoke/SLO tests.
- [ ] Maintenance, communications, freeze window, on-call và vendor escalation sẵn sàng.
- [ ] Rollback/forward-fix decision point và point-of-no-return được ghi rõ.

## Trong upgrade

- [ ] Snapshot metrics/dashboard trước thay đổi; ghi UTC timeline.
- [ ] Control plane theo documented order, từng instance; health/quorum sau mỗi bước.
- [ ] Canary node pool/node trước; cordon/drain đúng PDB rồi upgrade.
- [ ] Kiểm tra Node Ready, system Pods, DNS, CNI/CSI, admission và API latency.
- [ ] Chạy smoke/contract test và theo dõi SLO trước batch tiếp theo.
- [ ] Không gộp thay đổi không liên quan nếu không được rehearsal cùng nhau.

## Sau upgrade

- [ ] Tất cả component/node đúng supported skew; không còn node cordoned ngoài kế hoạch.
- [ ] Deployment/DaemonSet ready, PVC/volume, Service/DNS/network policy hoạt động.
- [ ] Error/latency/saturation/control-plane metrics và audit bình thường qua observation window.
- [ ] Deprecated API metric/audit không xuất hiện mới.
- [ ] Backup job/certificate/add-on reconciliation hoạt động.
- [ ] Update CMDB/runbook/version matrix và ghi lesson learned/action.

Nguồn phải mở đúng target version: [Version Skew](https://kubernetes.io/releases/version-skew-policy/), [kubeadm upgrade](https://kubernetes.io/docs/tasks/administer-cluster/kubeadm/kubeadm-upgrade/), [Deprecation Guide](https://kubernetes.io/docs/reference/using-api/deprecation-guide/).
