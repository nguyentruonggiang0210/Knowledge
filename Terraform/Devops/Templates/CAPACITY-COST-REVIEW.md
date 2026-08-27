# Capacity và cost review - <Service / period>

## Metadata

| Trường | Giá trị |
|---|---|
| Service / owners | `<engineering + finance>` |
| Environment/scope | `<cloud/account/region>` |
| Review period / date | `<...>` |
| Forecast horizon | `<3/6/12 months + peak event>` |
| SLO/tier | `<link>` |
| Billing/dashboard sources | `<links>` |
| Budget / anomaly alert | `<links>` |

## Executive summary

- Demand trend: `<...>`
- Current bottleneck/headroom: `<...>`
- Monthly cost và unit cost trend: `<...>`
- Top risk trước peak/forecast: `<...>`
- Quyết định/actions: `<...>`

## Workload và demand model

| Driver | Current avg | Current peak | Forecast peak | Growth/seasonality | Source/confidence |
|---|---:|---:|---:|---|---|
| Requests/sec | `<...>` | `<...>` | `<...>` | `<...>` | `<...>` |
| Concurrent users/connections | `<...>` | `<...>` | `<...>` | `<...>` | `<...>` |
| Writes/events/sec | `<...>` | `<...>` | `<...>` | `<...>` | `<...>` |
| Data stored/growth per day | `<...>` | `<...>` | `<...>` | `<...>` | `<...>` |
| Log/metric/trace GB/day | `<...>` | `<...>` | `<...>` | `<...>` | `<...>` |
| Egress/inter-zone GB | `<...>` | `<...>` | `<...>` | `<...>` | `<...>` |

Nêu assumptions: payload size, cache hit, retry amplification, compression, retention và dependency fan-out.

## Capacity model

```text
required capacity = forecast peak × safety factor × failure-mode factor
headroom = (tested sustainable capacity - observed peak) / tested sustainable capacity
```

| Layer/resource | Provisioned/limit/quota | Observed peak | Tested sustainable | Headroom | Scale trigger/time | Bottleneck/risk |
|---|---:|---:|---:|---:|---|---|
| Edge/LB | `<...>` | `<...>` | `<...>` | `<...>` | `<...>` | `<...>` |
| App CPU/RAM/replicas | `<...>` | `<...>` | `<...>` | `<...>` | `<...>` | `<...>` |
| DB connections/IOPS/storage | `<...>` | `<...>` | `<...>` | `<...>` | `<...>` | `<...>` |
| Queue/stream backlog | `<...>` | `<...>` | `<...>` | `<...>` | `<...>` | `<...>` |
| Network/NAT/egress | `<...>` | `<...>` | `<...>` | `<...>` | `<...>` | `<...>` |
| Observability quota | `<...>` | `<...>` | `<...>` | `<...>` | `<...>` | `<...>` |

### Failure/peak scenarios

| Scenario | Available capacity | Expected demand | SLO outcome | Gap/action |
|---|---:|---:|---|---|
| Normal peak | `<...>` | `<...>` | `<...>` | `<...>` |
| One replica/zone lost | `<...>` | `<...>` | `<...>` | `<...>` |
| Dependency slow/retry | `<...>` | `<...>` | `<...>` | `<...>` |
| DR/double-run | `<...>` | `<...>` | `<...>` | `<...>` |

Autoscaling không giải quyết quota, cold-start, database bottleneck hoặc không có capacity. Ghi scale-out time thực đo.

## Cost breakdown

| Category | Current monthly | Forecast | % total | Cost driver | Owner |
|---|---:|---:|---:|---|---|
| Compute/container | `<...>` | `<...>` | `<...>` | `<...>` | `<...>` |
| Database/cache | `<...>` | `<...>` | `<...>` | `<...>` | `<...>` |
| Storage/snapshot/backup | `<...>` | `<...>` | `<...>` | `<...>` | `<...>` |
| Network: IPv4/NAT/LB/egress | `<...>` | `<...>` | `<...>` | `<...>` | `<...>` |
| Logs/metrics/traces | `<...>` | `<...>` | `<...>` | `<...>` | `<...>` |
| Security/KMS/secrets/WAF | `<...>` | `<...>` | `<...>` | `<...>` | `<...>` |
| Support/license/DR | `<...>` | `<...>` | `<...>` | `<...>` | `<...>` |

Nguồn giá phải có date/region/currency/discount/tax assumption. Đối chiếu estimate với bill thật.

## Unit economics

| Unit | Current | Previous | Target | Giải thích thay đổi |
|---|---:|---:|---:|---|
| Cost / 1.000 valid requests | `<...>` | `<...>` | `<...>` | `<...>` |
| Cost / active customer | `<...>` | `<...>` | `<...>` | `<...>` |
| Observability cost / app cost | `<...>` | `<...>` | `<...>` | `<...>` |
| DR premium / primary cost | `<...>` | `<...>` | `<...>` | `<...>` |

## Waste/anomaly inventory

- Idle/oversized compute: `<...>`
- Unattached disk/public IP/snapshot/backup: `<...>`
- NAT/egress/log cardinality/retention bất thường: `<...>`
- Duplicate environment/old version/orphan resource: `<...>`
- Missing/invalid cost tags: `<...>`

## Options và trade-offs

| Option | Monthly saving/cost | Engineering effort | SLO/security risk | Reversible | Decision |
|---|---:|---:|---|---|---|
| `<rightsizing>` | `<...>` | `<...>` | `<...>` | `<...>` | `<...>` |
| `<commit/reservation>` | `<...>` | `<...>` | capacity/lock-in | `<...>` | `<...>` |
| `<retention/sampling>` | `<...>` | `<...>` | observability gap | `<...>` | `<...>` |

Không giảm redundancy/backup/log/security control chỉ để đạt saving nếu risk chưa được owner accept.

## Guardrails và actions

| Action/guardrail | Expected outcome | Validation | Owner | Due/status |
|---|---|---|---|---|
| `<budget/anomaly alert>` | `<...>` | `<test alert>` | `<...>` | `<...>` |
| `<sandbox TTL/cleanup>` | `<...>` | `<inventory/bill>` | `<...>` | `<...>` |
| `<load/scale test>` | `<...>` | `<report>` | `<...>` | `<...>` |

## Sign-off

| Role | Decision/risk | Name/team | Date/review trigger |
|---|---|---|---|
| Service owner | `<...>` | `<...>` | `<...>` |
| SRE/platform | `<...>` | `<...>` | `<...>` |
| Finance/product | `<...>` | `<...>` | `<...>` |
