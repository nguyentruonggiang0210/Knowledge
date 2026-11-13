# Troubleshooting drills

Interviewer chỉ mở từng “thẻ dữ kiện” khi ứng viên hỏi đúng loại evidence. Không thưởng cho việc đoán trúng sớm; thưởng cho phương pháp giảm không gian giả thuyết, mitigation an toàn và verification.

Ứng viên cần nói thành tiếng:

- impact/scope/severity và recent changes;
- giả thuyết xếp hạng;
- lệnh/query + output nào sẽ xác nhận/bác bỏ;
- mitigation/rollback trước, root fix sau nếu sự cố đang ảnh hưởng;
- prevention/alert/runbook/test.

## TD-01 — Container restart mỗi 30 giây

**Ban đầu:** API Compose restart liên tục sau deploy.

**Thẻ A:** `docker compose ps -a` cho exit code 137, health từng báo healthy.  
**Thẻ B:** `docker inspect` cho `OOMKilled=true`, memory limit 256 MiB; release cũ peak 180 MiB.  
**Thẻ C:** release mới bật in-memory cache không giới hạn; host còn memory.

**Yêu cầu:** mitigation, evidence leak/peak, fix và right-sizing plan.

## TD-02 — Docker host hết disk

**Ban đầu:** Pull image báo no space, nhưng `docker images` chỉ 8 GB.

**Thẻ A:** `docker system df` cho build cache 70 GB và local volumes 300 GB; DB volume là critical.  
**Thẻ B:** `/var/lib/docker/containers/...-json.log` 120 GB; inode còn đủ.  
**Thẻ C:** logging driver mặc định không có rotation.

**Yêu cầu:** cleanup không mất data/rollback image, containment và prevention.

## TD-03 — `exec format error`

**Ban đầu:** Image chạy laptop nhưng fail ngay trên production nodes.

**Thẻ A:** laptop ARM64; nodes AMD64.  
**Thẻ B:** registry tag chỉ có một manifest ARM64.  
**Thẻ C:** pipeline không set platform và dùng mutable tag.

**Yêu cầu:** xác minh, rebuild/promotion và policy ngăn tái diễn.

## TD-04 — Service không có traffic

**Ban đầu:** Deployment có 3/3 Ready; curl Service timeout.

**Thẻ A:** EndpointSlice rỗng.  
**Thẻ B:** Service selector `app: payments`; Pod template label `app.kubernetes.io/name: payments`.  
**Thẻ C:** lỗi xuất hiện sau chuẩn hóa labels.

**Yêu cầu:** mitigation, validate cả port/listener, và test/policy phòng ngừa.

## TD-05 — Rollout kẹt

**Ban đầu:** `kubectl rollout status` timeout, 6 Pods cũ vẫn phục vụ, 2 Pods mới CrashLoop.

**Thẻ A:** previous logs: `missing key PAYMENT_URL`.  
**Thẻ B:** Deployment mới tham chiếu ConfigMap key `PAYMENTS_URL`; ConfigMap có `PAYMENT_URL`.  
**Thẻ C:** `maxUnavailable: 0`, `maxSurge: 2`; error rate hiện tại không tăng.

**Yêu cầu:** quyết định pause/rollback/fix-forward, evidence và config contract prevention.

## TD-06 — DNS chỉ lỗi trên một node

**Ban đầu:** khoảng 15% request lỗi name resolution.

**Thẻ A:** mọi Pod lỗi nằm node `worker-7`; direct Pod IP cũng packet loss.  
**Thẻ B:** CNI agent trên node restart 40 lần; node có `MemoryPressure`.  
**Thẻ C:** CoreDNS khỏe và Pods node khác không lỗi.

**Yêu cầu:** containment không phá quorum, node/CNI evidence và recovery.

## TD-07 — OOM nhưng memory dashboard thấp

**Ban đầu:** worker OOMKilled 5 lần/ngày, dashboard average 45% limit.

**Thẻ A:** metric scrape 60 giây; job decompress file trong 3 giây.  
**Thẻ B:** peak RSS theo profiler 1.8 GiB, limit 1 GiB; request 256 MiB.  
**Thẻ C:** 20 Pods có thể chạy cùng lúc trên node 32 GiB.

**Yêu cầu:** đo peak, concurrency/backpressure, requests/limits/capacity và code fix.

## TD-08 — HPA flapping

**Ban đầu:** replicas dao động 3↔30 mỗi 5–10 phút, latency xấu lúc scale.

**Thẻ A:** CPU target 50%; request 10m nhưng baseline usage 8m, startup spike 500m.  
**Thẻ B:** Pods Ready ngay trước khi cache warm 90 giây.  
**Thẻ C:** không có scaleDown stabilization; queue depth mới là leading load signal.

**Yêu cầu:** redesign metric/request/readiness/behavior và load test.

## TD-09 — PVC Pending multi-zone

**Ban đầu:** Stateful Pod Pending; PVC Bound nhưng scheduler nói volume node affinity conflict.

**Thẻ A:** PV zone `a`; Pod required node affinity zone `b`.  
**Thẻ B:** StorageClass binding mode `Immediate`, reclaim `Delete`; PVC có dữ liệu sau một lần chạy.  
**Thẻ C:** CSI hỗ trợ snapshot và class khác có `WaitForFirstConsumer`.

**Yêu cầu:** cứu dữ liệu hiện tại, fix tương lai, validate restore.

## TD-10 — Drain không hoàn tất

**Ban đầu:** maintenance window sắp hết; `kubectl drain` bị PDB chặn.

**Thẻ A:** Deployment 2 replicas nhưng một Pod not Ready; PDB `minAvailable: 2`.  
**Thẻ B:** Pod lỗi do readiness phụ thuộc downstream đang maintenance.  
**Thẻ C:** node còn có DaemonSet và một Job ghi `emptyDir`.

**Yêu cầu:** quyết định an toàn cho từng workload; không dùng force như đáp án mặc định.

## TD-11 — RBAC sau hardening

**Ban đầu:** log viewer UI trả 403 sau khi bỏ cluster-admin khỏi ServiceAccount.

**Thẻ A:** `can-i get pods` yes, `can-i get pods/log` no.  
**Thẻ B:** UI chỉ cần list Pods và get log trong namespace của team.  
**Thẻ C:** Role hiện chỉ có resource `pods`, verbs `get,list`.

**Yêu cầu:** rule tối thiểu, validation dương/âm và rollout/audit.

## TD-12 — p99 tăng toàn region

**Ban đầu:** p50 bình thường, p99 6s và 2% 504 ở region EU; CPU/memory khỏe.

**Thẻ A:** traces cho 504 đi qua DB connection acquisition 5s.  
**Thẻ B:** connection pool mỗi Pod 100, rollout HPA tăng từ 20 lên 100 Pods; DB max connections 4.000.  
**Thẻ C:** retry policy ingress và app đều retry 2 lần.

**Yêu cầu:** containment, tính connection budget, retry amplification và redesign.

## Scorecard mỗi drill (20 điểm)

| Tiêu chí | Điểm |
|---|---:|
| Scope/recent change/safety | 3 |
| Giả thuyết xếp hạng, không tunnel vision | 4 |
| Evidence có tính phân nhánh | 5 |
| Mitigation + root fix + validation | 5 |
| Prevention/alert/runbook | 3 |

**Strong hire signal:** ứng viên thay đổi giả thuyết khi có thẻ mới, nói rõ điều chưa biết, không thực hiện thao tác phá hoại để “thử”.
