# Bài 18 — Security engineering, OAuth/OIDC/JWT và OWASP

## Bar senior

Threat-model một flow, phân biệt authentication/authorization, cấu hình resource server và test deny-by-default. Biết rằng security là property xuyên design/build/deploy/operate, không phải một filter. [Sample Spring Security](../SourceSamples/18-security/src/main/java/course/security/SecurityApplication.java).

OWASP Top 10 hiện hành là bản 2025, gồm cả Broken Access Control, Security Misconfiguration và Software Supply Chain Failures; xem [official list](https://owasp.org/Top10/). Spring Security phân vai OAuth2 resource server/client/authorization server rõ ràng trong [official reference](https://docs.spring.io/spring-security/reference/servlet/oauth2/index.html).

## 1. Threat model trước controls

Xác định asset, trust boundary, actor, entry point, data classification, abuse case và impact. Với order API:

- attacker đọc/sửa order người khác (BOLA/broken access control);
- replay/idempotency abuse tạo charge nhiều lần;
- mass assignment đổi owner/status/price;
- SSRF qua callback URL;
- injection/query/path traversal;
- token/log/backup làm rò PII;
- dependency/build artifact bị compromise.

Mỗi threat có preventive + detective control, owner, test và residual risk. “Dùng JWT/HTTPS” không phải threat model.

## 2. Authentication, authorization và token

- OAuth 2.x là delegation/authorization framework; OIDC thêm identity layer.
- Authorization Code + PKCE phù hợp user-facing public client; client credentials cho machine-to-machine có trust phù hợp.
- Resource server validate access token; ID token dành cho client biết identity, không mặc định dùng gọi API.
- JWT **signed không đồng nghĩa encrypted**. Payload đọc được; không chứa secret/PII không cần thiết.
- Validate signature/algorithm allow-list, `iss`, `aud`, `exp`, `nbf`, clock skew, token type và key rotation/JWK cache behavior. Không tin role/scope chỉ vì JSON parse được.
- Opaque token hỗ trợ central introspection/revocation nhưng thêm network/cache failure; JWT giảm lookup nhưng revocation/staleness khó hơn.

Authorization phải kiểm tra object/tenant ownership trong use case, không chỉ endpoint role. Deny by default; least privilege; admin path/audit rõ. Method security là defense-in-depth, không thay domain authorization.

## 3. Session, CSRF, CORS và browser security

- Cookie session: `Secure`, `HttpOnly`, `SameSite`, rotation on login; server-side revocation dễ hơn.
- CSRF lợi dụng browser tự gắn credential (thường cookie). Bearer token trong Authorization header không tự động miễn mọi threat; xét storage/XSS.
- CORS là browser policy cho cross-origin response, không phải authentication/firewall. Allowed origin/method/header/credential phải tối thiểu; wildcard + credentials sai.
- XSS phòng bằng output encoding/context, CSP và tránh unsafe HTML; token trong local storage tăng impact XSS.

## 4. Input/data/crypto controls

- Parameterized query; allow-list sort/path/redirect; canonicalize path; limit size/depth/rate.
- SSRF: parse/resolve/allow-list destination, chặn private/link-local/metadata ranges và DNS rebinding ở network layer; timeout/size limit.
- Password dùng adaptive password hash (Argon2/bcrypt/PBKDF2 theo policy), unique salt; không SHA-256 thuần. Secret/key trong KMS/secret manager, rotation/version/audit.
- TLS xác thực channel; mTLS thêm workload identity nhưng không tự authorize business action.
- Không log token/password/card/PII; mask không đáng tin nếu không có schema/policy.
- Deserialization: schema/type allow-list, size/depth limit; tránh native Java object deserialization từ untrusted input.

## 5. Spring Security mental model

`SecurityFilterChain` xử lý request trước controller. Xác thực tạo `Authentication`/security context; authorization manager quyết định access. Nhiều chain cần matcher/order rõ. Stateless resource server thường tắt session creation có chủ đích, nhưng CSRF decision dựa credential transport/use case chứ không copy snippet.

Test cả:

- unauthenticated → 401, authenticated nhưng thiếu quyền → 403;
- đúng scope nhưng sai owner/tenant → deny;
- invalid issuer/audience/expired/key rotation;
- error không leak detail; security event có correlation nhưng không token;
- actuator/admin/management port cũng được bảo vệ.

## 6. Supply-chain và operations

- Pin/centrally manage dependencies/plugin, verify repository/provenance/signature khi hỗ trợ; SBOM + SCA/CVE triage theo exploitability.
- Secret scan, SAST, dependency/container/IaC scan trong CI; DAST/pen test theo risk. Scanner pass không chứng minh secure design.
- Minimal/non-root image, patched base/JDK, read-only filesystem/capability/network policy khi phù hợp.
- Rate limit/account lock có anti-abuse nhưng tránh user-enumeration/DoS lockout; alert theo symptom/anomaly.
- Incident plan: revoke/rotate key, invalidate session, trace affected access, legal/data notification, postmortem.

## C#/.NET refresh và mapping

- ASP.NET Core authentication scheme/handler + authorization policy gần Spring `SecurityFilterChain` + authorization rules; `[Authorize]` gần method/endpoint authorization nhưng filter order/default khác.
- `ClaimsPrincipal` và Spring `Authentication` đều mang identity/authority; claim-to-role mapping phải explicit, không tin raw JWT chỉ vì decode được.
- ASP.NET Core antiforgery và Spring CSRF cùng bảo vệ browser credential tự gửi; quyết định dựa auth transport/session, không dựa framework preference.
- OAuth2/OIDC/JWT/TLS/OWASP là protocol/threat model chung. Data Protection, key ring, secret provider hay password hasher là implementation-specific và cần rotation/deployment design riêng.

## Lab

1. Chạy profile `local`: public endpoint, authenticated user endpoint và ADMIN-only endpoint; test 401/403/200. Password được inject bằng property/test, không hard-code trong main source.
2. Thêm object ownership check và test user A không đọc resource B dù cùng role.
3. Viết threat model cho idempotent payment; thêm replay/TOCTOU/concurrent abuse case.
4. Decode JWT mẫu và chỉ ra vì sao “đọc được payload” không phải signature validation.

`local` profile dùng HTTP Basic + in-memory users chỉ để nhìn 401/403 và deny-by-default. Profile mặc định cấu hình stateless OAuth2 Resource Server và scope `admin`; khi chạy phải cấp issuer/JWK config thật (ví dụ `spring.security.oauth2.resourceserver.jwt.issuer-uri`), không dùng local profile làm production template. CSRF được disable chỉ cho stateless bearer-token API; browser/cookie session phải threat-model lại.

## Interview drill

- OAuth2 và OIDC giải vấn đề khác nhau gì? Access token vs ID token?
- JWT validate claim/key rotation nào? Signed khác encrypted?
- 401 vs 403; endpoint role vs object-level authorization?
- CSRF khác CORS; khi nào tắt CSRF hợp lý?
- SSRF/mass assignment/supply-chain failure phòng nhiều lớp ra sao?
- Password hashing/secret rotation/PII logging policy?

## Quiz

1. JWT ký đúng nhưng audience sai có chấp nhận?
2. CORS chặn request từ curl/service khác?
3. Validate DTO có thay authorization?
4. SCA báo CVE có nghĩa production chắc exploitable?

<details><summary>Đáp án/rubric</summary>

1. Không; phải validate intended issuer/audience/time/type và policy khác.
2. Không; CORS chủ yếu do browser enforce, server vẫn cần authz/network controls.
3. Không; shape validation và permission/object ownership là boundary khác.
4. Không tự động; phải triage reachability/config/version/exposure nhưng không bỏ qua patch/compensating control. Câu trả lời mạnh nêu SLA, SBOM và exception ownership.
</details>
