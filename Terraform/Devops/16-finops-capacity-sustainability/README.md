# D16 - FinOps, capacity và sustainability

## Mục tiêu

- Nối chi phí công nghệ với business value và service ownership.
- Allocation, budget, forecast, anomaly và unit economics bằng dữ liệu.
- Tối ưu usage/rate/architecture mà không phá SLO/security/recovery.
- Lập capacity plan và xem sustainability như một constraint đo được.

## FinOps là operating practice

FinOps là sự phối hợp engineering, finance, product, procurement và leadership để tối đa
business value của công nghệ bằng quyết định kịp thời và accountability. Nó không chỉ là
“đi săn resource rác” hay ép giảm bill.

Framework hiện tổ chức outcome quanh:

- hiểu usage và cost;
- định lượng business value;
- tối ưu usage và cost;
- quản lý FinOps practice.

Chu kỳ Inform → Optimize → Operate lặp liên tục; một workload có thể ở maturity khác workload
khác.

## Cost model

~~~text
Total cost =
  compute + memory/accelerator
  + storage capacity/IOPS/operations/backup
  + database/messaging/request units
  + network egress/NAT/LB/DNS
  + observability/security/tool licenses
  + support/commitment waste
  + engineering and operational labor
  + risk/opportunity cost
~~~

Cloud bill không bằng TCO. Managed service giá cao hơn resource thô có thể rẻ hơn khi giảm
toil/risk; tự host chỉ hợp lý khi có scale/skill/constraint chứng minh.

## Allocation

Metadata tối thiểu: owner, product, environment, cost center, service, data class, lifecycle/
expiry. Kết hợp account/subscription/compartment hierarchy với tag; không dựa tag tự khai duy
nhất cho security.

- Showback: hiển thị cost cho owner.
- Chargeback: hạch toán cost vào budget/cost center.
- Shared cost cần rule phân bổ minh bạch và ổn định.
- Unallocated cost là quality metric; không tùy tiện gán để bảng đẹp.

## Budget, forecast và anomaly

- Budget là guardrail/plan, không tự là forecast.
- Forecast dùng lịch sử + growth + roadmap + seasonality + price/commitment.
- Scenario base/peak/failure/launch và confidence range.
- Anomaly so với expected pattern; alert có owner và materiality threshold.
- Bill delay/tax/credit/refund/amortization làm dữ liệu khác realtime usage.

Khi alert: xác định usage, unit price, owner/change, user/business value, security incident
possibility; stop resource chỉ khi biết impact.

## Unit economics

Absolute cost tăng có thể tốt nếu business tăng nhanh hơn. Chọn unit liên quan value:

~~~text
cost_per_successful_order =
  allocated_order_platform_cost / successful_orders
~~~

Ghi inclusion, shared allocation, time window và data quality. Theo dõi thêm cost per tenant,
request, GB processed hoặc active user tùy business. Guardrail: SLO, security và error rate.

## Ba lớp tối ưu

1. Usage: xóa idle/orphan, schedule non-prod, right-size, autoscale, storage lifecycle,
   query/cache/data retention và telemetry volume.
2. Rate: commitment/reservation/savings/spot/tier/license và negotiated price.
3. Architecture/business: managed service, batch, placement, data path, product feature,
   SLO/tier và retire capability không tạo value.

Tối ưu usage trước khi mua commitment; commitment cho baseline forecast tin cậy, có owner và
coverage/utilization review. Spot/preemptible cần interruption behavior, không chỉ rẻ.

## Cost của reliability

Multi-zone/region, headroom, backup, observability và security có cost nhưng giảm loss/risk.
Đưa business impact, SLO/RTO/RPO và probability vào decision. Không right-size đến mức không
còn N-1 capacity hay autoscaler không kịp burst.

## Capacity plan

1. Demand driver và forecast: user/order/data/event.
2. Workload conversion: RPS, concurrency, storage growth, egress.
3. Measured service capacity và bottleneck.
4. Redundancy/failure headroom, deploy surge và maintenance.
5. Quota/stock/provision lead time.
6. Autoscale min/max/lag và load-shedding threshold.
7. Cost scenarios, review cadence và trigger.

Capacity không phải CPU average. Xem queue, tail latency, DB pool/IO, partition, quota và
dependency limit.

## Sustainability

Đo workload/value trước; tránh greenwashing bằng một metric không rõ scope. Giảm waste,
right-size, batch/schedule theo carbon-aware window khi business/region/data/SLO cho phép,
kéo dài hardware/resource efficiency và quản data retention. Đừng chuyển region chỉ vì một
score nếu tăng latency, egress, resiliency hoặc compliance risk.

## Lab: cost review không phá SLO

1. Lấy sandbox bill/usage hoặc dataset giả; allocation theo owner/product/env.
2. Tính total và cost/successful order; ghi data gap.
3. Forecast 6 tháng với base/growth/launch/N-1.
4. Tìm top cost driver bằng usage × rate, không theo cảm giác.
5. Đề xuất ba option: usage, rate, architecture; có expected saving và effort/risk.
6. Load/restore/failover test trước/sau; SLO/RTO/RPO là guardrail.
7. Triển khai canary, đo saving thực và unexpected cost.
8. Tạo budget/anomaly/runbook và owner.

Dùng [capacity/cost template](../Templates/CAPACITY-COST-REVIEW.md).

## Hoàn thành D16 khi

- Ít nhất 95% cost in-scope có owner/allocation hoặc exception rõ.
- Forecast có driver/scenario/confidence, không chỉ kéo đường thẳng.
- Unit cost nối business outcome và data definition.
- Optimization có baseline, guardrail, realized saving và không phá N-1/recovery.
- Commitment/egress/license/telemetry/people cost được tính.
- Sustainability decision có scope và trade-off.

Nguồn: [FinOps Framework](https://www.finops.org/framework/),
[FinOps phases](https://www.finops.org/framework/phases/) và
[Green Software Foundation](https://greensoftware.foundation/).

Tiếp theo: [D17 - Incident, change và problem management](../17-incident-change-problem/README.md).
