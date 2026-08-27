# Đáp án Level 5 – Expert

Tổng: **27 điểm**. Các phương án tương đương được chấp nhận nếu chứng minh cùng mức an toàn và khả năng vận hành.

## E01 (1 điểm)

**A — `moved` block.** Nó ánh xạ old address sang new address để plan hiểu đây là refactor binding, không phải xóa/tạo mặc định.

## E02 (1 điểm)

**Sai.** `-target` là công cụ ngoại lệ cho recovery/troubleshooting; targeted plan có thể không đại diện toàn bộ thay đổi cần thiết. Sau thao tác phải chạy full plan để reconcile.

## E03 (1 điểm)

**B.** Constraint định nghĩa dải acceptable; lock ghi lựa chọn/checksum đã resolve. Cả hai hỗ trợ dependency reproducibility/supply-chain control nhưng vẫn cần quy trình upgrade/review.

## E04 (2 điểm)

- 1 điểm: mega-module có boolean chồng chéo, output nullable mơ hồ, plan khó đoán, quyền/lifecycle/blast radius bị trộn, lowest-common-denominator che capability native. Đây là dấu hiệu abstraction gây hại.
- 1 điểm: tách theo capability và ownership/lifecycle (network, identity, compute service, data); contract chung chỉ cho intent thật sự chung như naming/tags/SLO và output semantic. Mỗi cloud có implementation/version riêng và escape hatch có kiểm soát; document khác biệt IAM/network/LB/data thay vì giả vờ tương đương.

## E05 (2 điểm)

- 1 điểm: chia state theo team/ownership, trust boundary, lifecycle/change frequency và failure domain; tránh cắt qua dependency hai chiều. Stack nền tảng xuất stable IDs/endpoints, consumer nhận qua pipeline config, registry/service catalog hoặc remote output có interface.
- 1 điểm: state nhỏ giảm lock/plan/blast radius nhưng tăng orchestration và eventual consistency. Remote-state coupling có thể lộ toàn state/quyền rộng; ưu tiên publish output tối thiểu qua kênh contract khi cần. Version contract, kiểm soát destroy/order và tránh cycle.

## E06 (2 điểm)

- 1 điểm: provider configuration thuộc composition root vì chứa region/tenancy/auth và policy context; child hard-code làm module khó test/tái dùng và có thể tạo sai region.
- 1 điểm: child khai `required_providers`; root cấu hình default/aliases rồi truyền `providers = { oci = oci.dr }` hoặc aliases tương ứng. Mỗi module instance có mapping riêng; child cần `configuration_aliases` nếu tham chiếu nhiều local alias. Provider block không dùng `for_each`, nên thường tạo module instances/provider configs tường minh.

## E07 (3 điểm)

- 0,75: inventory theo region/compartment/type/owner, dependency và criticality; xác nhận source of truth, freeze hoặc kiểm soát thay đổi ngoài luồng.
- 0,75: chia đợt blast radius nhỏ; viết/generate configuration rồi review intent, version provider; map exact address/ID và import. Không apply cấu hình placeholder thiếu tài nguyên.
- 0,75: plan-only/refresh kiểm tra sau từng đợt; bổ sung computed/default, normalize drift theo quyết định owner. Destruction/replacement bất ngờ là stop condition, không phải thứ cần “cho qua”.
- 0,75: backup/version state, locking/change window/peer review; rollback bằng restore state binding hoặc remove/import có kiểm soát (không xóa remote object), có acceptance test và audit.

## E08 (3 điểm)

Ví dụ:

```hcl
moved {
  from = module.app.oci_core_instance.node[0]
  to   = module.app.oci_core_instance.node["api-a"]
}

moved {
  from = module.app.oci_core_instance.node[1]
  to   = module.app.oci_core_instance.node["api-b"]
}
```

- 1 điểm: mapping một-một đúng identity; map input key ổn định, không dùng display property dễ đổi làm identity.
- 1 điểm: serialize/lock, backup state, thử trên copy/non-prod, review `moved` hoặc exact `state mv`; plan kỳ vọng không create/destroy/replace do address.
- 1 điểm: xử lý instance thừa/thiếu bằng quyết định riêng (import/decommission), không ép mapping. Nếu sai, dừng apply; sửa mapping/restore verified state version theo runbook và chạy full plan.

## E09 (3 điểm)

- 0,75: maintenance window, freeze CI/local writers, xác nhận lock/owner và backup version state hiện tại + checksum/metadata.
- 0,75: chuẩn bị backend mới với encryption, access, versioning/locking phù hợp; đổi config và chạy `terraform init -migrate-state` trong môi trường kiểm soát, đọc prompt/output.
- 0,75: xác minh workspace/key, lineage/serial, resource count/output và chạy refresh/full plan kỳ vọng no-op; thử lock/quyền/CI rồi mới mở writer.
- 0,75: không cho hai backend thành active source; revoke/readonly backend cũ sau thời gian rollback. Nếu lỗi, freeze, dùng verified backup/backend cũ và không merge hai state độc lập thủ công.

## E10 (3 điểm)

- 1 điểm: đây là cycle của giá trị: network output cần LB trong khi LB input cần network. `depends_on` chỉ thêm cạnh, không cung cấp giá trị hoặc xóa cạnh; thậm chí làm cycle rõ hơn.
- 1 điểm cho mỗi cách hợp lệ, tối đa 2: (a) network module chỉ tạo subnet/base NSG rồi security-rule module riêng nhận cả subnet/LB identity; (b) tách NSG shell và rules thành phase/module sau LB; (c) thay rule cần IP biến động bằng NSG-to-NSG/source identity nếu OCI model cho phép; (d) chuyển stable contract/output sang root composition và bỏ tham chiếu ngược. Thiết kế cuối phải là DAG, không dùng `-target` thường trực.

## E11 (3 điểm)

- 1 điểm: contract chung theo intent: service name/environment, capacity/SLO, public/private, tags/labels, allowed flows; output endpoint/service identity/observability handle. Policy chung về encryption, public exposure, ownership/cost.
- 1 điểm: module implementation tách `oci/`, `aws/`, `azure/`; composition/root theo cloud/environment. Không ép IAM principal/policy, subnet/route, LB health/TLS, database HA/backup semantics thành một boolean giả tương đương; expose capability/extension có tài liệu.
- 1 điểm: contract test/schema, example + plan fixture/test sandbox mỗi cloud, security/policy test; semantic version từng implementation/provider/module, upgrade matrix/changelog và consumer pin. Có ADR ghi khác biệt/failure modes.

## E12 (3 điểm)

- 0,5: dừng mọi writer/CI và không chạy apply/refresh mù quáng; chỉ định incident owner.
- 0,5: chụp/backup state hiện tại, version trước, lock/audit/CLI log; inventory remote read-only và xác định exact missing binding.
- 0,5: kiểm tra lineage/serial/checksum; chọn restore toàn version nếu nhất quán hoặc import lại từng object nếu thay đổi khác cần giữ. Không merge JSON bằng tay nếu chưa có quy trình chuyên biệt/test.
- 0,5: cấu hình/resource address phải đúng trước import; chạy plan với refresh và yêu cầu không có destroy/replace bất ngờ.
- 0,5: peer review, post-recovery state backup, mở pipeline tuần tự và giám sát; postmortem + quyền/guardrail.
- 0,5: tránh `state rm` thêm, xóa remote để “khớp”, `-lock=false`, force-unlock khi writer còn sống, đẩy state/secret vào chat/Git hoặc apply plan stale.

