# Nguồn chính thức và chính sách cập nhật

Tài liệu trong repository giải thích theo learning path; các nguồn dưới đây là authority khi hành vi thay đổi theo phiên bản.

## Docker và chuẩn container

- [Docker Engine manuals](https://docs.docker.com/engine/)
- [Docker Build manuals và BuildKit](https://docs.docker.com/build/)
- [Dockerfile reference](https://docs.docker.com/reference/dockerfile/)
- [Docker Compose manuals](https://docs.docker.com/compose/)
- [Compose Specification](https://compose-spec.io/)
- [Docker security](https://docs.docker.com/engine/security/)
- [OCI Image, Runtime và Distribution specifications](https://specs.opencontainers.org/)
- [containerd documentation](https://containerd.io/docs/)

## Kubernetes

- [Kubernetes concepts](https://kubernetes.io/docs/concepts/)
- [Kubernetes tasks](https://kubernetes.io/docs/tasks/)
- [API reference](https://kubernetes.io/docs/reference/kubernetes-api/)
- [Supported releases](https://kubernetes.io/releases/)
- [Version skew policy](https://kubernetes.io/releases/version-skew-policy/)
- [Deprecated API migration guide](https://kubernetes.io/docs/reference/using-api/deprecation-guide/)
- [Production environment](https://kubernetes.io/docs/setup/production-environment/)
- [Security checklist](https://kubernetes.io/docs/concepts/security/security-checklist/)
- [Pod Security Standards](https://kubernetes.io/docs/concepts/security/pod-security-standards/)
- [Gateway API documentation](https://gateway-api.sigs.k8s.io/)
- [Kubernetes Enhancement Proposals](https://github.com/kubernetes/enhancements/tree/master/keps)

## Tooling bổ trợ

- [Helm documentation](https://helm.sh/docs/)
- [Kustomize documentation](https://kubectl.docs.kubernetes.io/)
- [Prometheus documentation](https://prometheus.io/docs/)
- [OpenTelemetry documentation](https://opentelemetry.io/docs/)
- [etcd operations guide](https://etcd.io/docs/)

## Checklist kiểm tra độ mới trước dự án

1. Ghi phiên bản Engine/Compose, Kubernetes server/client, CNI, CSI, ingress/gateway controller và cloud provider.
2. Xác nhận Kubernetes minor còn được hỗ trợ; không suy diễn từ version trong tutorial.
3. Đọc version-skew và release notes cho từng minor trong đường nâng cấp.
4. Quét manifest bằng API deprecation checker phù hợp; render Helm/Kustomize trước khi scan.
5. Kiểm tra feature gate và maturity (`alpha`, `beta`, `stable`) trên **đúng phiên bản server**.
6. Kiểm tra compatibility matrix của CNI/CSI/controller/observability stack.
7. Pin artifact bằng version/digest theo policy và lưu provenance/SBOM nơi phù hợp.
8. Cập nhật runbook, rollback và restore test trước rollout production.

Tại thời điểm rà soát 2026-08-28, trang release chính thức liệt kê Kubernetes **1.37, 1.36 và 1.35** là ba nhánh minor được duy trì. Đây là snapshot theo thời gian, không phải yêu cầu phải dùng 1.37 cho mọi cluster.

