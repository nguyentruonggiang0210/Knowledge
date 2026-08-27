# Đáp án Level 1 – Foundation

Tổng: **38 điểm**. Chỉ mở sau khi hoàn thành đề.

## F01 (1 điểm)

**B.** DevOps là cách tổ chức flow/feedback/ownership để đưa giá trị an toàn, không phải tên của một silo hoặc bộ tool.

## F02 (1 điểm)

**Sai.** Nếu queue, handoff và responsibility boundary không đổi, đổi tên team có thể tạo thêm silo. Cần shared outcome, feedback và quyền tự chủ có guardrail.

## F03 (1 điểm)

**A.** `6 = rw-`, `4 = r--`, `0 = ---` cho owner/group/others.

## F04 (1 điểm)

**Sai.** SIGKILL không thể bị process bắt để cleanup. Thường gửi SIGTERM/graceful stop, quan sát, chỉ dùng SIGKILL khi timeout/runbook yêu cầu.

## F05 (1 điểm)

**B.** TTL định hướng thời gian cache record; resolver vẫn có chính sách riêng và propagation không đơn giản là “chờ đúng TTL hiện tại”.

## F06 (1 điểm)

**A.** Client kiểm tra trust chain, identity hostname/SAN, validity và các policy/revocation phù hợp.

## F07 (1 điểm)

**B.** `revert` tạo lịch sử đảo thay đổi có thể review. Force-push shared branch có thể làm mất/viết lại lịch sử của người khác.

## F08 (1 điểm)

**Đúng.** Exit code là contract quan trọng cho shell/CI; chỉ in chữ “error” nhưng exit 0 thường bị hiểu là thành công.

## F09 (2 điểm)

- 1 điểm: flow giảm batch/queue/handoff; feedback đưa kết quả build/runtime/customer về sớm; learning tạo experiment/postmortem/cải tiến hệ thống.
- 1 điểm: metric hợp lệ như deployment frequency, lead time, change failure rate, recovery time/reliability outcome. Chỉ tối ưu số deploy có thể chia deploy vô nghĩa hoặc che failure; metric phải được cân bằng bằng quality/outcome và không dùng để phạt cá nhân.

## F10 (2 điểm)

- 1 điểm: `systemctl status`, `journalctl -u`, exit/status/time; kiểm tra `systemctl cat`, syntax/unit reload, executable/path/environment, service user/group và quyền từng parent directory.
- 1 điểm: kiểm tra port conflict/listener, process/signal/resource, dependency/network/secret/package. Reboot phá/bớt evidence và có thể chỉ che race hoặc trạng thái tạm thời; cần root/contributing cause.

## F11 (2 điểm)

- 1 điểm cho path: resolver/cache/authoritative DNS → route/firewall/NAT → TCP handshake → TLS ClientHello/SNI/certificate → LB/proxy listener/rule → backend connection → HTTP request/response.
- 1 điểm cho failure theo lớp: NXDOMAIN/stale record; timeout/refused; TLS hostname/chain/expiry; LB unhealthy/wrong port; firewall/return path; app 4xx/5xx/dependency timeout. Evidence phải phân biệt layer.

## F12 (2 điểm)

- 1 điểm: commit là snapshot trong DAG; branch là movable ref; tag là named ref thường cố định cho version; release gắn metadata/artifact/changelog với source/tag.
- 1 điểm: breaking public contract → major; backward-compatible feature → minor; backward-compatible fix → patch. Immutable tag + artifact digest/provenance giúp reproducibility/audit; retag làm cùng version trỏ content khác.

## F13 (2 điểm)

- 1 điểm: chạy lặp với cùng input đưa hệ thống về cùng state, không nhân đôi user/order/rule; check-before-create hoặc operation/upsert có idempotency key.
- 1 điểm: timeout hữu hạn; retry chỉ lỗi transient/operation an toàn với exponential backoff + jitter + max attempts/deadline; propagate exit code và log context, không in secret.

## F14 (2 điểm)

- 1 điểm: region là vùng địa lý/failure lớn; AD/AZ/fault domain là failure scope nhỏ hơn trong region; account/tenancy/subscription/compartment là boundary governance/billing/IAM, không mặc định là failure domain vật lý.
- 1 điểm: IaaS khách hàng quản OS/runtime/app/data/IAM config; managed service chuyển nhiều vận hành hạ tầng/platform cho provider nhưng khách vẫn quản identity, data, access, cấu hình và resilience theo SLA/design.

## F15 (3 điểm)

Mỗi ý đúng 0,5, tối đa 3:

- Không kiểm tra argument; biến không quote làm glob/space và có thể khiến `rm -rf` nhắm sai phạm vi.
- Xóa backup cũ trước khi backup/upload mới thành công; không retention/version/rollback.
- Không strict mode/trap; `curl -s` có thể fail HTTP/network nhưng script vẫn in success.
- Token/environment có thể thiếu/lộ qua debug/process/log; không kiểm soát quyền file/thư mục.
- Archive không atomic/checksum/verify; concurrent run có thể ghi cùng file.
- Không timeout/retry hữu hạn/cleanup temporary file.

Khung tốt:

```bash
#!/usr/bin/env bash
set -Eeuo pipefail
umask 077
readonly backup_dir="${1:?usage: backup DIR}"
install -d -m 700 -- "$backup_dir"
tmp="$(mktemp "$backup_dir/app.XXXXXX.tgz")"
trap 'rm -f -- "$tmp"' EXIT
tar -czf "$tmp" -C /srv app
sha256sum "$tmp"
curl --fail-with-body --show-error --connect-timeout 5 --max-time 120 \
  --retry 3 --retry-all-errors \
  -H "Authorization: Bearer ${TOKEN:?TOKEN missing}" \
  --data-binary "@$tmp" "${URL:?URL missing}"
mv -- "$tmp" "$backup_dir/app.tgz"
trap - EXIT
```

Production nên lấy short-lived credential từ secret/workload identity và dùng object versioning/retention thay vì tự xóa mù quáng.

## F16 (3 điểm)

- 1 điểm: xác định scope/time/change; client→DNS/TLS/LB access log cho thấy request đã tới LB và 502 do upstream hay chưa.
- 1 điểm: listener/routing rule/backend registration/health checker; route, NSG/firewall và return path; test từ cùng network, không chỉ laptop.
- 1 điểm: process bind đúng IP/port, readiness/endpoint, app/current+previous log, dependency/connection pool/timeout. Correlate request/change ID; rollback nếu customer impact và recent deploy có causal evidence, đồng thời giữ evidence.

## F17 (3 điểm)

- 1 điểm: coi secret đã compromise; revoke/rotate trước, kiểm tra audit use và cập nhật consumer bằng credential mới an toàn.
- 1 điểm: tìm branch/tag/fork/clone/cache/artifact/CI log/chat và phạm vi user; rewrite history theo chính sách/phối hợp, nhưng hiểu bản clone không tự biến mất.
- 1 điểm: secret scanning pre-commit/server/CI, protected repo, short-lived identity, least privilege và incident playbook. Commit xóa vẫn để secret trong object/history trước đó.

## F18 (3 điểm)

- 1 điểm: xác nhận `User=`/`Group=` và environment/path qua `systemctl cat/show`; `namei -l /opt/app/config.yaml`, `stat`, `ls -ld` cho file và parent.
- 1 điểm: service user cần `x` trên directory cha và read trên file; kiểm tra ACL, SELinux context/audit (`ausearch`), AppArmor profile/journal nếu hệ dùng.
- 1 điểm: sửa owner/group/mode/ACL hoặc policy đúng scope, reload/restart và test dưới chính service user. Không dùng `chmod -R 777` hoặc chạy root làm workaround.

## F19 (3 điểm)

- 1 điểm: đo tần suất/seed/timing/runner/dependency, lưu test artifact; phân biệt race, shared state, network/external dependency, time/randomness và resource contention.
- 1 điểm: quarantine có owner/deadline/visibility, test deterministic/isolation/fake phù hợp; retry giới hạn chỉ để thu evidence, không đổi fail thành pass im lặng.
- 1 điểm: theo dõi flaky rate và repair SLO; build đỏ đáng tin cậy. Retry vô hạn tăng lead time, tải, che regression và làm team bỏ qua CI.

## F20 (3 điểm)

- 0,5: organization/account hierarchy, federation/MFA, least privilege roles, break-glass được vault/audit/test.
- 0,5: dev/prod boundary về account/project/compartment/subscription, credential, state và approval.
- 0,5: network/IP plan, ingress/egress/private connectivity/DNS/log flow.
- 0,5: centralized audit/security log, retention/alert và ownership.
- 0,5: budget/tag/naming/quota/region/resource policy và cost owner.
- 0,5: baseline encryption/key/backup/patch/guardrail, IaC pipeline và documented exception. Landing zone phải test, không chỉ vẽ.

