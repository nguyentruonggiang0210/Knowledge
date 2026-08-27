# Reference solution

Đây là core solution phục vụ học tập:

- network module: VCN, public/private/data subnet, route, IGW, optional NAT, NSGs;
- compute module: private flexible instances, cloud-init health endpoint;
- load_balancer module: optional public flexible LB và backend health;
- environment module: composition + safety preconditions;
- dev/prod root modules: provider/auth/state configuration tách biệt.

Mặc định instances rỗng, enable_compute=false, enable_load_balancer=false,
enable_nat_gateway=false. Apply vẫn tạo VCN/network resources nếu bạn xác nhận.

Trước chạy:

1. Copy terraform.tfvars.example thành terraform.tfvars và thay OCID/region.
2. Điền image/AD/public key chỉ khi bật compute.
3. Tạo backend bucket riêng, copy backend.tf.example và dùng tfbackend file.
4. terraform init, validate, test, plan; review chi phí/quota.
5. Apply dev trước. Prod mặc định chỉ dùng để plan/review.

Reference chưa triển khai TLS, Service Gateway, database, Vault, monitoring, budget,
autoscaling, DR và CI; đây là các extension bắt buộc của capstone theo scenario.

