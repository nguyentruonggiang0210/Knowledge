# Đáp án Level 4 – Production Engineering

Tổng: **28 điểm**.

## P01 (1 điểm)

**B.** Remote backend tạo nguồn state dùng chung và cho phép áp dụng access control/bảo vệ tập trung. Locking/versioning/encryption phải xác nhận theo backend, không được mặc định rằng mọi backend đều cung cấp giống nhau.

## P02 (1 điểm)

**Sai.** Plan artifact có thể chứa dữ liệu nhạy cảm ở dạng máy đọc dù CLI che giá trị. Phải coi plan như secret-bearing artifact: access tối thiểu, retention ngắn, encryption và không public.

## P03 (2 điểm)

- 0,75: xác định lock ID/owner/timestamp/pipeline, kiểm tra runner/process và backend/audit để chắc chắn không còn writer; liên hệ owner nếu cần.
- 0,75: chỉ `force-unlock LOCK_ID` sau peer approval theo runbook; nếu apply còn chạy, phá lock cho phép ghi song song, gây state stale/corruption.
- 0,5: lưu incident/change ticket, lock metadata, bằng chứng job đã chết, người phê duyệt/lệnh/thời điểm; sau đó plan/đối chiếu state và hạ tầng.

## P04 (3 điểm)

- 1 điểm PR: pin tool/provider, `fmt -check`, `init` an toàn, `validate`, lint/security/policy/test; tạo plan bằng identity read/plan giới hạn và lưu plan/log có bảo vệ.
- 1 điểm review: plan gắn commit SHA, module/provider lock, environment và input fingerprint; human/policy approval cho replacement/destroy/cost/security. Thay đổi commit/input/state đáng kể phải re-plan/review.
- 1 điểm apply: protected branch/environment, apply saved reviewed plan hoặc cơ chế đảm bảo cùng artifact; short-lived identity quyền tối thiểu, separation of duties, concurrency group + backend lock, audit và post-deploy health check.

## P05 (3 điểm)

- 0,75: dừng job/chặn artifact/log access và xác định phạm vi; không sao chép secret vào ticket/chat.
- 0,75: rotate/revoke password trước, cập nhật consumer qua secret store và xác nhận old credential không dùng được.
- 0,75: xóa/giới hạn log, artifact và Git history theo incident policy; thông báo người đã clone nếu cần. `.gitignore` không xóa object đã commit hay bản sao/cache.
- 0,75: kiểm tra/sanitize state qua quy trình hỗ trợ (backup, state version, controlled replacement), backend access/audit; chuyển sang secret manager/runtime retrieval hoặc ephemeral credential, mask log và scan secret. Không sửa state JSON trực tiếp tùy tiện.

## P06 (1 điểm)

**B.** Lock file ghi provider selection và checksum; nó nên được review/commit. Module version pin nằm ở module source/config, không được lock file giải quyết toàn bộ.

## P07 (2 điểm)

- 1 điểm: drift là remote object khác configuration/state do thay đổi ngoài workflow, automation/provider/external system; code change là desired change được review.
- 1 điểm: scheduled/PR refresh-only hoặc plan với read-only identity, phân loại expected/unexpected/security impact, tìm owner/audit event; chọn import/update code, revert out-of-band hoặc apply có kiểm soát. Không auto-remediate destructive plan; ghi exception nếu field do controller khác sở hữu.

## P08 (1 điểm)

**B.** Workspaces phân tách state instance cho cùng configuration, nhưng không tự tạo ranh giới quyền/credential/backend/account.

## P09 (2 điểm)

- 1 điểm: ba guardrail hợp lệ, ví dụ cấm public ingress rộng ở prod, bắt buộc encryption/tag/backup, allow-list region/shape, cảnh báo chi phí và destroy dữ liệu.
- 1 điểm: policy có giới hạn context và có thể sai/bypass; IAM vẫn giảm khả năng thực thi, review người xử lý intent/exception và ownership. Cần version/test/audit policy.

## P10 (3 điểm)

- 1 điểm: B được lập từ state cũ; sau A, assumptions/action/unknown value có thể stale. Backend lock lúc apply chỉ serialize, không đảm bảo plan B còn đúng về intent.
- 1 điểm: concurrency key theo stack/environment và một hàng đợi writer; B phải kiểm tra base commit/state serial hoặc bị hủy/re-plan sau A.
- 1 điểm: plan mới phải qua lại policy/human approval nếu diff thay đổi; apply đúng artifact/commit. Giữ locking, không `-lock=false`.

## P11 (3 điểm)

- 0,75: khai báo RTO/RPO, authority incident commander, freeze writer và xác minh primary thực sự unavailable để tránh split-brain.
- 0,75: lấy state version/backup gần nhất, kiểm tra checksum/lineage/serial và quyền; phục hồi vào backend DR được bảo vệ, không tùy tiện copy state không kiểm chứng.
- 0,75: provider alias/region, dependency ngoại vùng, DNS/traffic/data restore theo runbook; plan được review để tránh recreate object đang tồn tại.
- 0,75: trước sự cố phải diễn tập restore state/data, credential break-glass, failover/failback, DNS/traffic, đo RTO/RPO và kiểm thử backup. Runbook chỉ nằm trên giấy không đủ.

## P12 (1 điểm)

**B.** Scale/shape và retention có ảnh hưởng chi phí vận hành đáng kể; cần estimate/budget/approval theo ngưỡng.

## P13 (2 điểm)

- 1 điểm: service health/SLO như error rate, latency, saturation, LB/backend health; infra metric/log, OCI audit event, Terraform run log, synthetic check và business KPI phù hợp.
- 1 điểm: gắn commit/change/run ID vào deployment annotation/tag/log; so sánh baseline/canary và đặt threshold/observation window để stop/rollback/roll-forward.

## P14 (3 điểm)

- 0,75: dừng rollout, bảo vệ user/data, kích hoạt incident; dùng health/SLO và blast radius để chọn rollback nhanh hoặc roll-forward fix đã kiểm thử.
- 0,75: đối chiếu plan/apply log, commit, audit event, dependency và telemetry theo change ID; Terraform success chỉ nói API actions hoàn tất, không chứng minh app healthy.
- 0,75: revert Git tạo **một plan mới**, không phải undo transaction; replacement/destructive side effect/data migration có thể không đảo ngược. Review plan mới và phối hợp data/app rollback.
- 0,75: không xóa/chỉnh state để “làm sạch”; serialize writer, backup state/artifact/log, giữ audit và sau phục hồi reconcile drift + postmortem/test guardrail.

