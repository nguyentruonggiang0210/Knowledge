# Code samples và lab

| Nhóm | Mục đích | Cách dùng |
|---|---|---|
| [Docker](docker/README.md) | Image, lifecycle, build cache, network, storage, Compose, security/debug | Chạy với Docker Engine/Compose |
| [Kubernetes](kubernetes/README.md) | Workload, networking, storage, security, scaling, troubleshooting | Chạy trên cluster lab riêng |
| [Capstone](capstone/README.md) | Một ứng dụng xuyên suốt từ local Compose đến K8s production design | Là project tốt nghiệp và portfolio |

## Nguyên tắc chạy sample

- Đọc file trước khi apply; kiểm tra Docker/Kubernetes context.
- Dùng tag/version rõ ràng trong production; tag trong lab chỉ nhằm giữ hướng dẫn dễ chạy.
- Secret mẫu chỉ dành cho máy local. Không đưa credential thật vào repository.
- Chạy smoke test, sau đó làm failure drill và lưu lại command/output làm evidence.
- Cleanup đúng namespace/project của lab; không dùng prune toàn host dùng chung.

