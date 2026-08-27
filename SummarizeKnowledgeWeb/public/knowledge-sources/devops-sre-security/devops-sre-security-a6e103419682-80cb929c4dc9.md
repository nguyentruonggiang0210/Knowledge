# Đáp án — Application Security

Rubric cho [`../security.md`](../security.md). Security là bài toán quản lý rủi ro theo threat model; một câu trả lời chỉ nêu tên control chưa đủ mức Senior.

## SEC-001 — CIA

**Câu hỏi:** Confidentiality, Integrity và Availability là gì? Cho một control và một trade-off cho mỗi mục.

Confidentiality: chỉ chủ thể được phép đọc (access control/encryption; đổi lại key/latency). Integrity: phát hiện/ngăn sửa trái phép (signature/MAC/constraint/audit; đổi lại quản key/throughput). Availability: dịch vụ sẵn sàng (redundancy/rate limit/backup; đổi lại cost/complexity).

Control có thể xung đột: encryption/strict auth tăng bảo mật nhưng làm recovery khó; replication tăng availability nhưng mở rộng nơi chứa dữ liệu.

## SEC-002 — Thuật ngữ risk

**Câu hỏi:** Threat, vulnerability, exploit, risk và control khác nhau thế nào?

Threat là tác nhân/sự kiện có thể gây hại; vulnerability là điểm yếu; exploit là cách tận dụng điểm yếu; risk kết hợp likelihood/exposure và impact; control giảm likelihood/impact hoặc tăng detection/recovery.

Ví dụ input nối SQL là vulnerability, attacker gửi payload là threat/exploit, mất dữ liệu tenant là impact; parameterization là preventive control, DB audit là detective. Senior phân biệt residual risk sau control.

## SEC-003 — Threat modeling/STRIDE

**Câu hỏi:** Threat modeling bằng data-flow diagram và STRIDE được thực hiện ở thời điểm nào? Trust boundary giúp đặt câu hỏi gì?

Vẽ data flow gồm actor, process, store, flow và trust boundary; với mỗi phần hỏi Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, Elevation of privilege. Làm từ design và cập nhật khi thêm flow/dependency quan trọng, không chờ pentest.

Trust boundary nơi identity/trust/owner thay đổi buộc xem authn/authz, validation, encryption và logging. Kết quả là threat có owner/severity/mitigation/accepted risk, không chỉ sơ đồ.

## SEC-004 — Defense in depth/least privilege

**Câu hỏi:** Defense in depth và least privilege được áp dụng xuyên user, service, network, data và pipeline ra sao?

User có scope/resource authz; service dùng workload identity quyền nhỏ; network default-deny; DB account theo service/read-write; data encrypted/tokenized; pipeline runner/artifact ký và deploy role tách biệt. Mỗi lớp giả định lớp khác có thể lỗi.

Quyền ngắn hạn, just-in-time và audit; tránh shared admin secret. Defense in depth không có nghĩa chồng control ngẫu nhiên—mỗi control phải chặn/detect/recover một threat cụ thể.

## SEC-005 — Zero Trust

**Câu hỏi:** Zero Trust có ý nghĩa thực tế gì ngoài khẩu hiệu “không tin ai”? Identity, device/workload, policy và telemetry phối hợp thế nào?

Không cấp trust vĩnh viễn chỉ vì ở “mạng nội bộ”. Mọi access xác minh identity mạnh của user/workload, device/posture/context, policy least-privilege và session liên tục; segment resource và log decision. Token/certificate ngắn hạn, centralized policy nhưng enforcement gần resource.

Nó không có nghĩa không tin gì hay bắt MFA mỗi request. Availability của identity/policy plane, break-glass và legacy migration là trade-off Senior cần nêu.

## SEC-006 — Authentication/authorization

**Câu hỏi:** Authentication và authorization khác nhau thế nào? Vì sao kiểm tra role ở UI không phải authorization?

Authentication xác định “ai”; authorization quyết định identity đó được làm gì trên resource/context. UI ẩn nút chỉ là UX vì attacker gọi API trực tiếp. Server phải kiểm quyền tại mỗi operation, sau khi resolve tenant/resource, theo deny-by-default.

Controller có thể coarse check; domain/service sở hữu resource thực hiện object-level invariant. Audit decision nhạy cảm.

## SEC-007 — Session và JWT

**Câu hỏi:** Session cookie và JWT bearer token khác nhau về revocation, scale, size, CSRF/XSS và vận hành ra sao?

Opaque session cookie nhỏ, revoke/server control dễ nhưng cần store/lookup và CSRF nếu browser tự gửi. JWT tự chứa claim, verify phân tán nhưng lớn, stale claim/revoke/rotation khó; bearer token bị lấy dùng được đến hết hạn. XSS có thể gọi bằng cả hai; lưu JWT ở localStorage tăng nguy cơ exfiltration, cookie HttpOnly giảm đọc nhưng cần CSRF control.

Chọn theo topology/threat, không dùng JWT chỉ để “stateless”. Short access token + controlled refresh thường hợp.

## SEC-008 — Validate JWT

**Câu hỏi:** Một JWT consumer phải xác minh algorithm, signature, issuer, audience, expiry/not-before và key rotation thế nào?

Pin allowed algorithm, không tin `alg` tùy token; lấy key từ issuer tin cậy theo `kid` nhưng chống arbitrary URL/key confusion. Verify signature, exact issuer, intended audience, expiry, not-before với clock skew nhỏ và token type/scope; reject thiếu claim bắt buộc.

Cache JWKS có refresh khi rotate nhưng không fail-open vô hạn. Không dùng ID token làm API access token. Logging không ghi raw token.

## SEC-009 — OAuth2/OIDC

**Câu hỏi:** OAuth 2.0 và OpenID Connect giải quyết hai vấn đề gì? Access token và ID token được dùng bởi ai?

OAuth 2.0 là delegated authorization để client lấy access token gọi resource server; OIDC thêm authentication/identity layer qua ID token và UserInfo. Access token dành cho API/resource server và audience tương ứng; ID token dành cho client xác nhận login, không gửi tới API như quyền.

Authorization server, client và resource owner/resource server có role khác nhau; scope không tự thay object-level authorization.

## SEC-010 — Authorization Code + PKCE

**Câu hỏi:** Authorization Code Flow với PKCE ngăn interception ra sao? Vì sao không dùng client secret trong public client?

Client tạo high-entropy `code_verifier`, gửi hash `code_challenge`; token endpoint chỉ đổi intercepted authorization code nếu có verifier. `state` chống CSRF/correlation; OIDC `nonce` chống ID-token replay.

Mobile/SPA là public client nên secret đóng gói có thể bị lấy, không chứng minh identity. Dùng exact redirect URI, system browser, code ngắn hạn one-time; PKCE không thay TLS hay XSS protection.

## SEC-011 — Refresh rotation

**Câu hỏi:** Refresh token rotation và reuse detection hoạt động thế nào? Lưu token phía client/server ra sao?

Mỗi lần refresh, server vô hiệu token cũ và cấp token mới trong một family. Nếu token cũ xuất hiện lại, coi family bị đánh cắp, revoke toàn chain/session và yêu cầu login; cập nhật phải atomic để xử lý concurrent refresh.

Browser ưu tiên Secure HttpOnly SameSite cookie/BFF theo threat; native dùng secure OS store. Lưu hash token server-side, bind client/session, absolute+idle expiry và audit. Rotation không cứu được malware kiểm soát client.

## SEC-012 — RBAC/ABAC/ReBAC

**Câu hỏi:** RBAC, ABAC và ReBAC phù hợp mô hình quyền nào? Làm sao tránh role explosion?

RBAC gán role→permission, dễ audit cho job function nhưng tạo role explosion khi nhiều ngoại lệ. ABAC đánh policy trên subject/resource/action/environment attributes, linh hoạt nhưng khó hiểu/test. ReBAC dựa quan hệ graph như owner/member/viewer, phù hợp sharing.

Thường kết hợp coarse RBAC + resource relation/attribute. Centralize policy semantics, version/test, default deny và giải thích decision; không nhét tenant/project thành hàng nghìn role.

## SEC-013 — Multi-tenant authorization

**Câu hỏi:** Authorization trong multi-tenant application cần chống IDOR/BOLA và cross-tenant query ở các lớp nào?

Tenant đến từ trusted token/session, không chỉ request parameter. Resolve resource với composite predicate `tenant_id + resource_id`, kiểm membership/permission và không fetch global rồi check quên. DB RLS/partition/schema và service account per boundary thêm defense.

Cache/search/object key/log/job/message cũng namespace tenant. Test negative cross-tenant tự động, dùng unguessable ID chỉ giảm enumeration chứ không thay authorization.

## SEC-014 — Password hashing

**Câu hỏi:** Password nên được hash bằng thuật toán chậm, có salt như thế nào? Pepper có vai trò gì?

Dùng Argon2id, scrypt hoặc bcrypt/PBKDF2 theo chuẩn hệ thống với unique random salt và cost được benchmark đủ chậm nhưng chịu tải; lưu algorithm/parameters để rehash khi login. Salt không cần bí mật, chặn precomputed table.

Pepper là secret chung trong KMS/HSM, giúp khi chỉ DB lộ nhưng rotation/availability khó. Không dùng SHA nhanh. Rate limit, breached-password check và MFA bổ sung.

## SEC-015 — MFA/passkey

**Câu hỏi:** MFA chống được và không chống được tấn công nào? Passkey/WebAuthn cải thiện phishing resistance ra sao?

MFA giảm password stuffing/phishing đơn giản; SMS/TOTP vẫn có SIM swap, real-time phishing/MFA fatigue và recovery bypass. WebAuthn/passkey dùng public-key credential gắn origin/RP, private key không rời authenticator, nên phishing-resistant.

Thiết kế enrollment/recovery, multiple authenticators, device loss, step-up cho action nhạy cảm và revoke/audit. MFA không sửa broken authorization/session theft sau xác thực.

## SEC-016 — Service identity

**Câu hỏi:** Service-to-service authentication bằng workload identity, short-lived token hoặc mTLS có trade-off nào so với static API key?

Static API key sống lâu, copy khó kiểm inventory/rotation và thường quyền rộng. Workload identity cấp short-lived token theo runtime identity, mTLS xác thực kênh hai chiều; giảm secret phân phối và hỗ trợ policy/audit.

mTLS chứng minh workload/channel nhưng business authorization vẫn cần; token có audience/scope. Cần certificate/token auto-rotation, clock/trust bundle, bootstrap và identity control-plane HA.

## SEC-017 — Hash/encrypt/sign

**Câu hỏi:** Hashing, encryption và digital signature khác mục tiêu thế nào? Vì sao base64 không phải mã hóa?

Hash một chiều cho fingerprint/integrity khi có trusted expected value; encryption dùng key để giữ bí mật và giải mã; digital signature dùng private key ký, public key xác minh integrity/authenticity/non-repudiation tương đối. MAC dùng shared secret.

Base64 chỉ encode bytes, ai cũng decode. Hash không keyed không chống attacker sửa cả dữ liệu lẫn hash; dùng HMAC/signature.

## SEC-018 — AEAD/nonce

**Câu hỏi:** Authenticated encryption (AEAD) bảo vệ confidentiality và integrity ra sao? Nonce reuse nguy hiểm thế nào?

AEAD như AES-GCM/ChaCha20-Poly1305 mã hóa và tạo authentication tag cho ciphertext cùng associated data (header/context không mã hóa). Verify tag trước khi dùng plaintext.

Với cùng key, nonce phải unique; reuse trong stream/GCM có thể lộ quan hệ plaintext và phá integrity/key. Dùng library tạo nonce/counter, lưu cùng ciphertext, key version và không tự thiết kế crypto.

## SEC-019 — Envelope encryption

**Câu hỏi:** Envelope encryption và KMS/HSM giúp quản lý data key/master key thế nào?

Sinh data-encryption key (DEK) mã hóa data bằng AEAD; KMS/HSM key-encryption key (KEK) wrap DEK. Lưu ciphertext + wrapped DEK + version; plaintext DEK chỉ trong memory/cache ngắn. KMS kiểm quyền/audit và KEK không rời boundary.

Rotate KEK có thể rewrap DEK không đọc toàn data; rotate DEK cần re-encrypt. Limit KMS call, handle outage và context-bound encryption.

## SEC-020 — Rotation không downtime

**Câu hỏi:** Key/secret rotation không downtime cần versioning, dual-read/write và revocation thế nào?

Secret/key có version/key ID. Giai đoạn overlap: verifier đọc old+new, writer/signing dùng new; rollout consumers trước producer nếu cần. Quan sát usage version cũ, re-encrypt/re-sign/backfill, rồi revoke sau compatibility window.

Có emergency revoke khác planned rotation, cache TTL và rollback. Dual-write phải đối soát; không xóa old key trước khi backup/data cũ đã xử lý.

## SEC-021 — TLS chain

**Câu hỏi:** TLS certificate chain, hostname validation và trust store hoạt động ra sao? “Bỏ verify để sửa lỗi” nguy hiểm thế nào?

Server certificate gắn hostname/public key, intermediate dẫn tới trusted root. Client kiểm chain/signature, validity, EKU, hostname SAN và revocation theo platform; SNI chọn cert, ALPN protocol. TLS mã hóa transport và authenticate peer tùy one-/mutual TLS.

Tắt verify biến kết nối thành dễ MITM. Sửa trust store/chain/clock/SAN; private CA phải phân phối root có kiểm soát. Pinning có rotation/recovery trade-off.

## SEC-022 — Secure randomness

**Câu hỏi:** Random token, OTP và public ID cần entropy như thế nào? Vì sao timestamp hoặc non-cryptographic PRNG không đủ?

Token cần CSPRNG và đủ entropy, ví dụ 128 bit cho reset/session; encode URL-safe. OTP ngắn có entropy thấp nên expiry rất ngắn, attempt limit và bind user/purpose. Public ID đoán được tạo enumeration/business leak dù không nhất thiết auth bypass.

Timestamp/sequential/`Random` có thể dự đoán; uniqueness không đồng nghĩa unguessability. Không log token, lưu hash khi có thể.

## SEC-023 — SQL injection

**Câu hỏi:** SQL injection xảy ra thế nào? Parameterized query bảo vệ gì và không bảo vệ dynamic identifier/order-by ra sao?

Nối input vào SQL làm dữ liệu trở thành syntax. Prepared/parameterized query giữ cấu trúc và bind value, bảo vệ literal. Parameter thường không thay table/column/order direction, nên dynamic identifier dùng mapping allowlist sang constant query; không chỉ escape string.

Least-privilege DB account, query timeout và test/SAST là lớp bổ sung. ORM vẫn injection được qua raw SQL.

## SEC-024 — Các dạng injection

**Câu hỏi:** Command injection, NoSQL injection và LDAP injection có chung nguyên nhân gì? Thiết kế allowlist và API an toàn thế nào?

Nguyên nhân chung là trộn data không tin cậy vào ngôn ngữ lệnh/query/interpreter. Dùng API parameterized/structured, không shell khi có library, allowlist operation/field/operator và canonicalize đúng boundary.

NoSQL object input có thể chèn `$where/$ne`, command có metacharacter, LDAP filter có escape context riêng. Validate business schema nhưng không tự viết sanitizer chung cho mọi context.

## SEC-025 — XSS

**Câu hỏi:** Stored, reflected và DOM-based XSS khác nhau thế nào? Output encoding phải theo context ra sao?

Reflected payload từ request về response; stored được lưu rồi hiển thị; DOM-based sink ở client xử lý nguồn nguy hiểm. Bảo vệ chính là framework auto-escape và output encoding đúng context HTML attribute/JS/URL/CSS; sanitize nếu cho phép rich HTML.

HttpOnly giảm lấy cookie nhưng XSS vẫn hành động như user. CSP defense-in-depth. Không dùng một HTML escape cho JavaScript context.

## SEC-026 — CSP

**Câu hỏi:** Content Security Policy giảm tác động XSS thế nào? Nonce/hash và `strict-dynamic` có trade-off gì?

CSP giới hạn nguồn script/style/frame/connect; nonce ngẫu nhiên per response hoặc hash cho phép script cụ thể, tránh `unsafe-inline`. `strict-dynamic` cho script tin cậy tải descendants trên browser hỗ trợ, giảm allowlist host dễ bypass.

Triển khai Report-Only, thu violation rồi enforce; third-party/legacy inline làm khó. CSP giảm impact nhưng không thay encoding/sanitization, và nonce không được reuse/predictable.

## SEC-027 — CSRF

**Câu hỏi:** CSRF dựa vào cơ chế nào? SameSite cookie, anti-forgery token và kiểm tra Origin phối hợp ra sao?

Browser tự đính credential (cookie/client cert) cho request tới site, attacker dụ browser gửi state-changing request. SameSite Lax/Strict giảm cross-site, anti-forgery token phải không tự gửi và bind session, Origin/Referer check thêm lớp; state change không dùng GET.

SameSite=None cần Secure cho cross-site hợp lệ. Bearer header không tự gắn thường ít CSRF nhưng XSS/token theft còn. CORS không phải CSRF defense duy nhất.

## SEC-028 — CORS

**Câu hỏi:** CORS là chính sách của browser cho đọc response, không phải cơ chế authentication, nghĩa là gì?

CORS cho browser quyết định JavaScript origin khác có được đọc/gửi credential sau preflight; server/non-browser attacker vẫn gọi API. Vì vậy endpoint vẫn cần authn/authz/CSRF/rate limit.

Không dùng `Access-Control-Allow-Origin: *` với credentials; reflect Origin chỉ sau exact allowlist, thêm `Vary: Origin`, giới hạn method/header. CORS sai có thể mở đọc dữ liệu cho website độc hại.

## SEC-029 — SSRF

**Câu hỏi:** SSRF có thể truy cập metadata/internal service ra sao? URL parser, redirect và DNS rebinding làm allowlist khó thế nào?

Backend fetch URL có quyền network khác attacker, nên có thể gọi metadata, loopback/internal admin hoặc scan port. Parser ambiguity, userinfo, IPv6/decimal IP, redirects và DNS rebinding làm string allowlist yếu.

Tốt nhất dùng allowlisted destination ID/proxy egress; resolve rồi chặn private/link-local/reserved, pin IP và kiểm lại mỗi redirect, giới hạn scheme/port/size/time, không forward credential. Network egress deny và metadata workload identity giảm blast radius.

## SEC-030 — Unsafe deserialization

**Câu hỏi:** Unsafe deserialization dẫn đến data tampering hoặc code execution thế nào? Polymorphic type handling cần giới hạn gì?

Deserializer cho phép attacker chọn polymorphic type/gadget hoặc set field nhạy cảm có thể chạy code, SSRF, file access hay phá invariant. Không deserialize untrusted native object graph/binary format; dùng DTO schema đơn giản, allowlist type, tắt type metadata và validate sau parse.

Signature chỉ giúp nếu producer/key thật sự tin cậy và không chữa vulnerable gadget từ trusted-but-compromised source. Patch library và sandbox parser.

## SEC-031 — Path traversal/archive

**Câu hỏi:** Path traversal trong download/extract archive được ngăn bằng canonicalization, allowlist và root containment ra sao?

Decode/canonicalize một lần theo platform, join với fixed root rồi kiểm resolved absolute path vẫn nằm trong root với boundary-aware comparison; tốt hơn map opaque file ID thay vì nhận path. Chặn absolute path, `..`, alternate separator/symlink theo threat.

Giải nén phải chống Zip Slip: kiểm từng entry target, symlink/hardlink, file count/expanded size và quota. Filename hiển thị tách storage key.

## SEC-032 — File upload

**Câu hỏi:** File upload an toàn cần kiểm tra size, content, filename, storage, malware và serving domain thế nào?

Giới hạn request/chunk/total/tenant, tên do server sinh, lưu ngoài web root/quarantine. Kiểm magic/content bằng parser an toàn, không tin extension/MIME; malware scan và image/document re-encode khi phù hợp. Chống archive/decompression bomb.

Serve từ domain/object store riêng với `Content-Disposition`, `nosniff`, auth/signed URL. Scan async phải giữ trạng thái chưa publish; lifecycle dọn upload dở.

## SEC-033 — Mass assignment

**Câu hỏi:** Mass assignment/over-posting xảy ra khi bind DTO/domain thế nào? Allowlist field và command model giải quyết ra sao?

Bind request trực tiếp entity cho phép attacker set `IsAdmin`, `TenantId`, price/status dù UI không gửi. Dùng command/input DTO chỉ chứa field cho phép, map explicit và server lấy protected value từ identity/domain; domain vẫn enforce invariant.

Blacklist dễ quên field mới. Patch semantics cần phân biệt missing/null và field-level authorization; test malicious extra property.

## SEC-034 — Rate limiting/abuse

**Câu hỏi:** Rate limit theo IP có thể vừa bị bypass vừa chặn nhầm ra sao? Kết hợp identity, tenant, endpoint, cost và abuse signal thế nào?

IP chia sẻ qua NAT làm chặn nhầm, attacker dùng botnet/proxy để bypass. Kết hợp account/token/tenant/device/IP prefix, endpoint và cost unit; nhiều bucket cho burst+sustained, global cap và concurrency. Trả 429/Retry-After, quota minh bạch cho client tốt.

Login/reset/search cần risk signal/CAPTCHA/step-up; protect downstream. Distributed limiter có consistency/latency trade-off, và privacy/cardinality khi lưu key.

## SEC-035 — Replay

**Câu hỏi:** Replay attack với payment/webhook được ngăn bằng timestamp, nonce/idempotency key và signature coverage ra sao?

Ký method/path/timestamp/body hash/delivery ID để attacker không đổi context; receiver chỉ chấp nhận timestamp window với clock skew hợp lý, dedup nonce/event ID trong retention và xử lý idempotent. Payment dùng provider idempotency key + state machine.

HTTPS không ngăn replay bởi bên đã thấy request. Rotation/key ID và canonicalization phải thống nhất; mark dedup atomically với effect.

## SEC-036 — Timing side channel

**Câu hỏi:** Timing side channel xuất hiện khi so sánh secret/token thế nào? Constant-time comparison giải quyết và không giải quyết gì?

So sánh byte-by-byte dừng ở ký tự sai làm thời gian tương quan prefix đúng, có thể khai thác qua nhiều mẫu. Dùng constant-time compare của library trên fixed-length MAC/token sau decode hợp lệ.

Nó không che độ dài, user existence, DB lookup, branch khác hay response message. Normalize response/rate limit và tránh tự viết crypto; remote noise giảm nhưng không loại risk.

## SEC-037 — Security testing types

**Câu hỏi:** SAST, DAST, SCA, secret scanning và penetration test tìm các lớp lỗi khác nhau nào?

SAST phân tích source/flow sớm nhưng false positive; DAST thử app chạy từ ngoài, bỏ lỡ path/logic; SCA inventory dependency/CVE/license; secret scan tìm credential pattern/history; pentest kết hợp sáng tạo/business logic theo thời điểm.

Chúng bổ sung threat model, review và runtime monitoring. Pipeline cần triage theo reachability/exposure và owner/SLA, không chặn mọi CVE mù quáng.

## SEC-038 — Supply chain

**Câu hỏi:** Dependency/supply-chain security cần lockfile, provenance, signing, SBOM và update policy thế nào?

Pin/lock dependency và registry, review update nhỏ/automated; build hermetic trên runner sạch, tạo SBOM/provenance, ký artifact và verify policy khi deploy. Protect branch/tag/release account, least-privilege short-lived CI identity và scan secret/dependency.

SBOM chỉ inventory, signing chứng minh nguồn/integrity chứ không code an toàn. Cần vulnerability monitoring, rebuild/rotation và emergency revoke.

## SEC-039 — Container hardening

**Câu hỏi:** Container chạy non-root, read-only filesystem, dropped capabilities và seccomp giảm blast radius ra sao?

Non-root/user namespace giảm quyền; read-only rootfs và writable volume hẹp cản persistence; drop capabilities/no-new-privileges/seccomp chặn syscall/quyền kernel. Image tối thiểu/pinned/scanned và secret không bake.

Đây là blast-radius control vì container chia kernel; patch runtime/node, network policy và workload identity vẫn cần. Test app với policy thay vì cấp privileged khi lỗi.

## SEC-040 — Cloud/Kubernetes IAM

**Câu hỏi:** Kubernetes/cloud IAM thường bị cấp quyền quá rộng ở đâu? Workload identity và policy boundary cải thiện thế nào?

Lỗi phổ biến: wildcard admin, shared node role, service account mặc định, trust policy rộng, long-lived key và secret list toàn namespace. Mỗi workload có identity riêng, audience/scope ngắn hạn, role theo resource/action; permission boundary/SCP/admission policy ngăn escalation.

Audit actual use, access analyzer và revoke unused. Workload identity tránh key file nhưng trust mapping/OIDC condition phải chặt.

## SEC-041 — Secure logging

**Câu hỏi:** Log và audit trail cần đủ dữ liệu điều tra nhưng tránh password, token, PII thế nào? Redaction nên làm ở đâu?

Ghi event/action, actor ID pseudonymous, resource ID, outcome/reason code, time và trace ID; không ghi password, raw token/cookie, key, full card/PII/body. Redact/allowlist tại logging API/collector và cấu hình framework; access/retention/encryption/audit cho log store.

Hash không luôn anonymize ID ít miền. Security audit tách khỏi debug log, test canary secret và có process xóa/incident khi leak.

## SEC-042 — Data lifecycle

**Câu hỏi:** Data classification, minimization, retention và deletion ảnh hưởng thiết kế database, backup, cache và analytics ra sao?

Classify sensitivity/owner/purpose; chỉ thu field cần, dùng purpose limitation và least access. Retention theo legal/business với scheduled deletion/tombstone, propagation qua replica/cache/index/analytics và strategy cho backup (expire/crypto-erasure + restore re-delete log).

Encryption/key per tenant/class hỗ trợ isolation; inventory/data lineage chứng minh. “Xóa DB row” chưa hoàn tất nếu event/log/export còn PII.

## SEC-043 — Vulnerability triage

**Câu hỏi:** Vulnerability triage không chỉ dựa CVSS: exploitability, exposure, asset criticality và compensating control được dùng thế nào?

CVSS là severity kỹ thuật chung; ưu tiên còn phụ thuộc code có reachable không, Internet/exploit available, privilege/precondition, asset/data criticality, tenant blast radius và detective/compensating control. Xác nhận version/config và threat intel.

Quyết định patch/mitigate/accept có owner, deadline/evidence và re-evaluation; emergency change vẫn canary/rollback. Không hạ risk chỉ vì “chưa thấy exploit”.

## SEC-044 — Webhook signatures

**Câu hỏi:** Webhook signature scheme nên canonicalize payload, chọn timestamp window, key ID và rotation ra sao?

Ký version + timestamp + delivery ID + raw body bytes bằng HMAC/asymmetric key; receiver dùng raw payload và constant-time compare, không reserialize JSON. Header có key ID/algorithm pin; timestamp window và dedup ID chống replay.

Rotation publish old/new overlap, nhiều signature hoặc key lookup; secret per tenant/subscription. Document canonical format và test vectors; TLS vẫn bắt buộc.

## SEC-045 — Enumeration/scraping

**Câu hỏi:** Một public API cần chống enumeration và scraping nhưng vẫn phục vụ client hợp lệ. Bạn kết hợp identifier, pagination, quota và detection thế nào?

Opaque high-entropy IDs giảm đoán tuần tự nhưng mọi object vẫn cần authz. Cursor pagination ký/opaque, giới hạn page/field/filter và query cost; quota nhiều chiều account/tenant/IP, anomaly/velocity detection, progressive challenge/block và caching.

Response auth-sensitive tránh khác biệt status/timing quá rõ khi cần. Không làm client hợp lệ khổ bằng CAPTCHA mọi nơi; cung cấp bulk API/quota contract. Legal/robots chỉ là lớp policy, không control kỹ thuật.

## SEC-046 — Public production key

**Câu hỏi:** Một production API key xuất hiện trong public repository. Hãy nêu thứ tự containment, rotation, scoping, investigation và prevention.

Giả định đã compromise: revoke/rotate ngay tại provider, tạm chặn scope/action nguy hiểm và thay deployment qua secret manager; không chỉ xóa commit (history/fork/cache còn). Xác định quyền, thời gian lộ, audit usage/IP/action và downstream token; bảo toàn evidence, thông báo incident owner.

Reconcile impact và rotate dependent secret nếu cần. Sau đó purge history khi phù hợp, secret scanning pre-commit/CI, short-lived workload identity, least privilege và alert use bất thường. Validate service phục hồi sau rotation.

## SEC-047 — Cross-tenant exposure

**Câu hỏi:** Phát hiện truy vấn cross-tenant đã trả dữ liệu sai tenant trong 20 phút. Bạn xử lý kỹ thuật, bằng chứng và communication thế nào?

Contain: disable/rollback endpoint hoặc enforce central filter, preserve logs/traces/DB evidence và chặn further access; không sửa/xóa evidence tùy tiện. Xác định tenant/record/actor/time chính xác, revoke session nếu cần, kiểm cache/export/search và notify security/legal/privacy theo playbook.

Fix bằng composite tenant query + object authz/RLS, negative tests và backfill/correction; review tương tự toàn codebase. Communication trung thực dựa verified scope. Postmortem có detection metric/audit alert.

## SEC-048 — Forgot password

**Câu hỏi:** Thiết kế chức năng “quên mật khẩu” chống account enumeration, token theft, replay và session persistence.

Endpoint luôn trả response/timing gần giống dù account tồn tại; rate limit theo account+IP nhưng không cho attacker khóa nạn nhân. Gửi random one-time token ≥128 bit, lưu hash với user/purpose/expiry ngắn; link HTTPS đúng host, không để token vào third-party referrer/log.

Consume atomically rồi đổi password, rotate/revoke sessions/refresh token theo policy và notify user. Không dùng security question; recovery/MFA reset là luồng high-risk có audit.

## SEC-049 — Admin audit log

**Câu hỏi:** Thiết kế audit log cho thao tác quản trị nhạy cảm: integrity, access, retention, search, privacy và break-glass.

Append event có actor/effective actor, reason/ticket, action, target, redacted diff, auth/step-up, time, source và outcome/trace. Ship immutable/WORM hoặc hash-chain sang account tách biệt; writer không có delete, reader role hạn chế và mọi query audit.

Index search theo tenant/time/action, retention/compliance và privacy controls. Break-glass credential ngắn hạn, approval/alert và retrospective review; test completeness/tamper detection/restore.

## SEC-050 — Backend fetch URL sandbox

**Câu hỏi:** Team muốn cho phép người dùng nhập URL để backend tải và phân tích file. Hãy threat-model toàn bộ luồng và đề xuất kiến trúc sandbox an toàn.

Threats: SSRF metadata/internal, redirect/DNS rebinding, huge/slow response, malicious parser/file, archive bomb, malware, data exfiltration và shared-tenant escape. Front API nhận job, allowlist scheme/port/size; queue sang isolated fetch worker ở network segment/account không có internal route/credential, egress proxy kiểm resolved public IP mỗi hop và chặn redirect nguy hiểm.

Stream với byte/time/decompression limits vào quarantine object store; parser chạy non-root sandbox/microVM, read-only, no network, CPU/memory/time quota. Scan/type-detect, publish sanitized result; per-tenant quota, audit/trace và destroy worker. Senior nêu metadata denial ở network layer, not string validation alone.

## Câu hỏi kinh điển bổ sung — Basic đến Senior

## SEC-051 — OWASP Top 10

**Câu hỏi:** OWASP Top 10 là gì và nên được dùng như checklist, threat taxonomy hay tiêu chuẩn bảo đảm an toàn tuyệt đối?

OWASP Top 10 là tài liệu awareness về nhóm rủi ro web phổ biến/quan trọng, hữu ích để training, review baseline và đặt câu hỏi. Nó không phải danh sách đầy đủ, không chứng nhận app an toàn và có thể không phản ánh domain-specific threat như payment fraud.

Dùng cùng threat model, ASVS/requirement, secure design/test và telemetry. Senior ưu tiên theo exposure/asset/business risk thay vì chỉ “đã tick 10 mục”.

## SEC-052 — Validation, canonicalization, sanitization, encoding

**Câu hỏi:** Input validation, canonicalization, sanitization và output encoding khác nhau thế nào? Mỗi kỹ thuật nên đặt ở đâu?

Canonicalization đưa nhiều biểu diễn về dạng nhất quán trước quyết định security; validation reject input ngoài schema/allowlist tại trust boundary và domain; sanitization biến nội dung nguy hiểm thành tập cho phép khi phải giữ rich content; output encoding biến data thành literal an toàn theo đúng sink context.

Không “sanitize một lần dùng mọi nơi”: HTML, SQL, shell, URL có context khác. Parameterized API tốt hơn escape; canonicalize cẩn thận để tránh double decode.

## SEC-053 — Cookie attributes

**Câu hỏi:** Các thuộc tính cookie `Secure`, `HttpOnly`, `SameSite`, `Domain`, `Path` và `Max-Age` bảo vệ hoặc giới hạn điều gì?

`Secure` chỉ gửi qua HTTPS; `HttpOnly` chặn JavaScript đọc; `SameSite` giới hạn cross-site send; `Domain/Path` xác định request scope; `Max-Age/Expires` định persistence. Ưu tiên host-only cookie (không Domain), Path hẹp, Secure+HttpOnly và SameSite phù hợp flow.

Path/Domain không phải authorization boundary; subdomain compromise vẫn nguy hiểm với Domain rộng. Prefix `__Host-` yêu cầu Secure, Path=/, không Domain; cookie vẫn cần CSRF/session controls.

## SEC-054 — Open redirect

**Câu hỏi:** Open redirect nguy hiểm thế nào dù “chỉ chuyển hướng”? Kiểm tra redirect URL an toàn ra sao?

Attacker dùng domain tin cậy làm link phishing, đánh cắp authorization code/token qua redirect flow hoặc bypass allowlist. Tốt nhất redirect bằng server-side destination ID/relative path; nếu cần URL, parse theo thư viện, exact allowlist scheme+host+port và cấm userinfo/backslash/encoded ambiguity.

Không dùng `startsWith(trusted.com)`; kiểm mỗi redirect OAuth chính xác và không phản chiếu URL tùy ý trong login/logout.

## SEC-055 — Clickjacking

**Câu hỏi:** Clickjacking hoạt động thế nào? `frame-ancestors` và `X-Frame-Options` giảm rủi ro ra sao?

Site độc hại đặt trang thật trong iframe trong suốt/đánh lừa để user click action họ không thấy rõ. CSP `frame-ancestors 'none'` hoặc allowlist kiểm ai được frame; `X-Frame-Options: DENY/SAMEORIGIN` là fallback cũ.

Không bảo vệ client không hỗ trợ hoặc action qua API trực tiếp; thao tác nhạy cảm cần re-auth/confirmation/CSRF protection. Nếu sản phẩm cần embedding, allowlist origin rõ và thiết kế postMessage an toàn.

## SEC-056 — HTTP security headers

**Câu hỏi:** Các HTTP security header quan trọng bảo vệ lớp rủi ro nào, và vì sao không nên copy một bộ header giống nhau cho mọi response?

HSTS ép HTTPS; CSP giới hạn content/frame; `X-Content-Type-Options: nosniff`; `Referrer-Policy` giảm URL leak; `Permissions-Policy` giới hạn browser feature; cache headers bảo dữ liệu nhạy cảm; framing như trên. Header phải theo loại asset/page/API và deployment domain.

CSP sai có thể phá app hoặc vẫn mở `unsafe-inline`; HSTS `includeSubDomains/preload` khó rollback. Header là defense-in-depth, không thay output encoding/authz/TLS đúng.

## SEC-057 — Password attacks

**Câu hỏi:** Brute force, credential stuffing và password spraying khác nhau thế nào? Detection và mitigation khác nhau ra sao?

Brute force thử nhiều password cho một account; stuffing dùng credential rò trên nhiều site/account; spraying thử ít password phổ biến trên nhiều account để né lockout. Signal cần kết hợp account, IP/network/device, velocity, success anomaly và credential breach data.

Rate limit đa chiều, MFA/passkey, breached-password check, step-up và bot/risk detection. Lock cứng theo account có thể thành DoS; response không lộ account existence.

## SEC-058 — Session fixation

**Câu hỏi:** Session fixation là gì? Rotate session ID sau login hoặc privilege change ngăn tấn công thế nào?

Attacker khiến victim dùng session ID attacker biết trước; nếu server giữ cùng ID sau login, attacker tái dùng session đã authenticated. Khi trust level đổi, tạo ID entropy cao mới, chuyển state cần thiết và invalidate ID cũ atomically.

Không nhận session ID từ URL, cookie scope/flags đúng, rotate cả khi privilege/MFA elevation và giới hạn concurrent/replay. Rotation không cứu XSS hoặc token đã bị lấy sau login.

## SEC-059 — Account lockout

**Câu hỏi:** Account lockout có thể bị lợi dụng để denial-of-service ra sao? Thiết kế throttling và step-up thay thế thế nào?

Attacker cố ý sai password cho nhiều username để khóa người thật, đồng thời response lock có thể xác nhận account. Thay lock cứng dài bằng progressive delay/rate limit theo account+IP+device, risk-based challenge/MFA, notification và self-service recovery an toàn.

Giới hạn vẫn phải chống distributed attack và không lưu plaintext attempt. Admin/support unlock là action nhạy cảm có audit; theo dõi success-after-fail và spraying pattern.

## SEC-060 — BOLA và BFLA

**Câu hỏi:** BOLA/IDOR và Broken Function Level Authorization khác nhau thế nào? Viết test authorization matrix cho chúng ra sao?

BOLA/IDOR là user gọi operation hợp lệ nhưng trên object không thuộc quyền (`/orders/{id}`); BFLA là role không được phép gọi chức năng/admin endpoint dù object nào. Cần object-level predicate tenant/owner/relation và function/action permission server-side.

Matrix gồm role × action × resource relationship/tenant × state, test allow lẫn deny, đổi ID/header/method và endpoint ẩn. ID khó đoán không thay authz; centralized policy không loại test từng route.

## SEC-061 — CVE, CWE, CVSS

**Câu hỏi:** CVE, CWE và CVSS khác nhau thế nào? Một CVE record, một CWE category và một CVSS score liên hệ với nhau ra sao?

CVE là định danh/record cho vulnerability cụ thể trong sản phẩm/version; CWE là taxonomy của loại weakness gốc như SQL injection; CVSS là hệ thống tính severity score/vector kỹ thuật. Một CVE có thể được map tới một hay nhiều CWE và có CVSS vector do nhiều nguồn đánh giá; CVE identifier bản thân không chứa “điểm”.

CVSS không phải risk score của tổ chức: prioritization vẫn cần reachability, exposure, exploitability và asset impact. Luôn nói “CVE có CVSS cao/thấp”, không nói “CVE cao/thấp”.

## SEC-062 — Dependency confusion/typosquatting

**Câu hỏi:** Dependency confusion và typosquatting tấn công package resolution ra sao? Registry policy và lockfile giảm rủi ro thế nào?

Dependency confusion publish package public trùng tên nội bộ với version được resolver ưu tiên; typosquatting dùng tên gần giống để developer cài nhầm. Dùng namespace/private registry mapping rõ, chặn public fallback cho internal scope, allowlist source, lock exact version+integrity và review dependency mới.

Proxy registry, provenance/signature và egress restriction bổ sung. Lockfile không cứu nếu bản lock đầu đã độc hoặc registry cho thay bytes cùng version; cache/build runner cần isolation.

## SEC-063 — TOCTOU

**Câu hỏi:** TOCTOU security race là gì? Nêu ví dụ kiểm tra quyền/path rồi sử dụng và cách làm operation atomic.

Time-of-check to time-of-use xảy ra khi state thay đổi giữa kiểm tra và hành động: check path trong root rồi attacker đổi symlink trước open; check balance/permission rồi concurrent update. Tránh bằng API atomic/conditional update, open handle rồi validate handle, transaction/lock/version và không resolve lại tên. Với filesystem, `O_NOFOLLOW` thường chỉ chặn symlink ở component cuối; traversal an toàn cần dirfd từng bước hoặc `openat2` với `RESOLVE_BENEATH`/`RESOLVE_NO_SYMLINKS` khi platform hỗ trợ.

Recheck sau action không undo side effect; distributed TOCTOU cần ownership/version/fencing chứ không chỉ mutex local.

## SEC-064 — Confused Deputy

**Câu hỏi:** Confused Deputy Problem xảy ra khi service có quyền cao hành động thay caller thế nào? Audience, capability và authorization context giúp gì?

Deputy có quyền riêng bị caller lừa dùng cho resource/action caller không được phép—ví dụ fetch service với cloud credential đọc internal object theo URL user. Service phải phân biệt authority của chính nó và quyền được ủy quyền, kiểm resource/action/tenant theo caller.

Token audience/scope ngăn dùng token sai service; capability URL/token giới hạn resource/action/time; propagate verified identity/delegation và egress/least privilege. Không tin user-supplied tenant/header hoặc dùng service account admin cho mọi request.

## SEC-065 — Business-logic workflow abuse

**Câu hỏi:** Một workflow nhiều bước hợp lệ riêng lẻ nhưng có thể bị gọi sai thứ tự, lặp hoặc bỏ bước để gian lận. Bạn threat-model và bảo vệ business logic như thế nào?

Mô hình state machine với transition hợp lệ, actor/permission, amount/invariant và irreversible step; server quyết định state từ source of truth, không tin client “đã hoàn tất”. Dùng conditional update/version, idempotency, nonce/expiry, transaction/outbox và audit mỗi transition.

Test sequence adversarial: skip/reorder/replay/concurrent, đổi tenant/amount/coupon, timeout rồi retry và race nhiều thiết bị. Rate/abuse detection và reconciliation/manual review cho trạng thái unknown; UI validation không phải control.
