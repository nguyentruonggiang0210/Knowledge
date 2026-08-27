# D05 - Scripting và automation engineering

## Mục tiêu

- Viết automation như một sản phẩm nhỏ có contract, test và observability.
- Chọn Bash, PowerShell, Python hoặc Go theo phạm vi thay vì theo trào lưu.
- Xử lý input, quoting, exit code, timeout, retry, rate limit và partial failure.
- Đảm bảo idempotency, concurrency safety và không lộ secret.

## Chọn ngôn ngữ

| Công cụ | Phù hợp | Cẩn trọng |
|---|---|---|
| Bash | Glue trên Linux, pipeline command ngắn | Quoting, portability, error/pipe semantics |
| PowerShell | Windows và object pipeline, cloud/admin API | Version/module, serialization, native exit code |
| Python | API, parsing, test/tooling vừa | Dependency/env/package và timeout |
| Go | CLI phân phối một binary, concurrency/service | Nhiều code hơn cho task rất nhỏ |

Khi script vượt quá một màn hình logic phức tạp, có nhiều state/concurrency hoặc trở thành
critical service, hãy thiết kế/package/test như phần mềm thực sự.

## Contract trước code

Ghi rõ:

- input, type, validation, default và precedence;
- output machine-readable trên stdout, diagnostic trên stderr;
- exit code: 0 success, non-zero theo class lỗi có tài liệu;
- timeout/deadline, retry policy và rate limit;
- side effect, idempotency key, dry-run và rollback/compensation;
- permission/secret cần thiết;
- supported OS/runtime/version.

“Chạy được trên máy tôi” không phải contract.

## Defensive shell

Bash:

~~~bash
#!/usr/bin/env bash
set -Eeuo pipefail
trap 'printf "failed line=%s status=%s\n" "$LINENO" "$?" >&2' ERR

input="$1"
printf '%s\n' "$input"
~~~

Luôn quote expansion trừ khi cố ý word splitting/globbing. Dùng array cho danh sách
argument; không tạo command string rồi eval. Temp file dùng mktemp và trap cleanup; validate
resolved target trước thao tác destructive.

PowerShell:

~~~powershell
[CmdletBinding(SupportsShouldProcess)]
param(
  [Parameter(Mandatory)]
  [ValidateNotNullOrEmpty()]
  [string]$Name
)

$ErrorActionPreference = "Stop"
Write-Output ([pscustomobject]@{ name = $Name; status = "ok" })
~~~

Dùng -LiteralPath cho path nhận từ input. Kiểm tra $LASTEXITCODE sau native command; exception
PowerShell và exit code native là hai cơ chế khác nhau.

## Idempotency

Một run thứ hai với cùng input phải đưa tới cùng desired outcome, không nhân bản side effect.

~~~text
Đọc current state
  ├─ đã đúng -> no-op
  └─ chưa đúng -> thay đổi tối thiểu -> verify
~~~

Ví dụ “create user” nên lookup trước hoặc dùng API idempotency key. Append dòng vào file mỗi
lần chạy không idempotent; render managed block/desired file rồi atomic replace phù hợp hơn.
Idempotent operation vẫn có thể không concurrency-safe; dùng conditional update, lock hoặc
server-side transaction.

## Timeout, retry và backoff

Chỉ retry lỗi transient và operation retry-safe. Mỗi call có timeout; toàn workflow có
deadline/retry budget. Exponential backoff với jitter giảm việc client đồng loạt retry.

~~~text
delay = min(cap, base * 2^attempt) + random_jitter
~~~

Không retry authentication/validation error. Tôn trọng Retry-After/rate-limit header. Ghi
attempt, duration, class lỗi nhưng redact token/body nhạy cảm.

## API production

- Xác thực TLS; credential lấy từ workload identity/secret store.
- Handle pagination đến khi không còn continuation token.
- Phân biệt 401/403/404/409/429/5xx và contract riêng của API.
- Dùng request/correlation ID để support.
- Validate response schema; API trả 200 chưa chắc business operation thành công.
- Với batch, lưu checkpoint và report item succeeded/failed/unknown.
- Khi timeout sau request ghi, outcome có thể unknown; query state trước khi retry.

## Structured log và secret hygiene

Log cần timestamp UTC, level, event, operation, correlation ID, duration, outcome. Không log
Authorization header, cookie, private key, full connection string, PII hay toàn environment.
Redaction là defense bổ sung, không phải lý do đưa secret vào command line/process list.

## Software engineering cho automation lớn

- Tách pure domain logic khỏi I/O/API để unit test nhanh.
- Module/package có public contract, semantic version và changelog.
- Type/schema validation ở boundary; config precedence và backward compatibility rõ.
- Dependency injection/interface cho clock, network và storage trong test.
- Concurrency cần cancellation, bounded worker/queue, lock/transaction và race test.
- Release artifact được pin/sign/scan; tool tự update cần trust/rollback.
- CLI có help/example/completion khi phù hợp và deprecation path.

Automation critical cần owner, SLO/support, vulnerability/upgrade và incident process như
service; “chỉ là script” không miễn production engineering.

## Test pyramid cho automation

- Static: formatter, linter, type/security scan.
- Unit: parsing, validation, retry decision và pure function.
- Contract: mock API theo schema và error cases.
- Integration: sandbox tạm, least privilege, TTL/cleanup.
- Failure: timeout, 429, 500, partial response, concurrent run, interrupted process.
- Idempotency: run hai lần; lần hai không tạo change ngoài dự kiến.

## Lab

~~~powershell
.\lab\health-check.ps1 -Url "https://example.com" -MaxAttempts 3
~~~

~~~bash
chmod +x lab/health-check.sh
./lab/health-check.sh https://example.com 3
~~~

Mở rộng script:

1. output JSON ổn định và exit code 0/2/3 cho healthy/config/transient failure;
2. timeout 3 giây, exponential backoff có jitter, tối đa ba lần;
3. không retry 4xx trừ 408/429 theo contract;
4. hỗ trợ correlation ID nhưng không log credential;
5. test local server trả chuỗi 500, 429 rồi 200;
6. chạy hai instance đồng thời với shared checkpoint và loại race;
7. thêm dry-run cho một operation có side effect.

## Lỗi thường gặp

- curl | shell từ nguồn không pin/verify.
- Dùng sleep cố định thay điều kiện readiness với deadline.
- Nuốt lỗi rồi luôn exit 0, làm CI báo xanh giả.
- Retry mọi lỗi hoặc retry không giới hạn.
- Parse text human-readable khi tool có JSON.
- Đưa secret vào argument, debug log hoặc environment dump.
- Script cần chạy tay đúng thứ tự nhưng không có state/checkpoint.

## Hoàn thành D05 khi

- Có CLI contract và README chạy được trên fresh environment.
- Script qua happy path, failure, timeout, retry, idempotency và concurrency test.
- Output machine-readable, diagnostic/exit code đúng.
- Không lộ secret và dùng credential scope tối thiểu.
- Biết lúc chuyển từ shell sang ngôn ngữ/package phù hợp hơn.

Nguồn: [GNU Bash manual](https://www.gnu.org/software/bash/manual/),
[PowerShell documentation](https://learn.microsoft.com/powershell/) và
[Python documentation](https://docs.python.org/3/).

Tiếp theo: [D06 - Cloud architecture](../06-cloud-architecture/README.md).
