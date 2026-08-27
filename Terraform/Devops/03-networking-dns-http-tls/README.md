# D03 - Networking, DNS, HTTP và TLS

## Mục tiêu

- Theo dấu packet/request qua host, network, proxy, load balancer và application.
- Hiểu IPv4/IPv6, subnet, route, NAT, firewall, TCP/UDP/QUIC và MTU.
- Điều tra DNS recursion/cache/TTL và TLS certificate/SNI/mTLS.
- Đọc HTTP semantics và phân biệt lỗi từng layer.

## Đường đi của một HTTPS request

~~~mermaid
sequenceDiagram
  participant C as Client
  participant D as DNS resolver
  participant L as L4/L7 Load balancer
  participant A as Application
  participant B as Database
  C->>D: Query api.example
  D-->>C: A/AAAA plus TTL
  C->>L: TCP or QUIC plus TLS
  L->>A: HTTP request and trace context
  A->>B: Authenticated query
  B-->>A: Result
  A-->>L: HTTP status/body
  L-->>C: Response
~~~

Mỗi mũi tên cần address, route, policy, timeout, identity và telemetry riêng.

## Layer và đơn vị dữ liệu

Mô hình OSI hữu ích để giao tiếp, nhưng debug thực tế thường dùng TCP/IP:

- Link: NIC, MAC, VLAN, ARP cho IPv4, NDP cho IPv6.
- Internet: IP address, subnet, route, ICMP, fragmentation.
- Transport: TCP/UDP/QUIC, port, connection, congestion.
- Application: DNS, HTTP, TLS, SSH, database protocol.

“Ping được” chỉ chứng minh một số ICMP path tại thời điểm đó, không chứng minh DNS, TCP
port, TLS hay application khỏe.

## CIDR, route và return path

IPv4 /24 có 256 address về mặt toán học; cloud có thể reserve một số address. /32 là một
host. IPv6 thường dùng prefix lớn hơn và không dựa vào NAT như chiến lược bảo mật.

Router chọn longest-prefix match, sau đó administrative/metric theo implementation. Mọi
request cần return path; route hoặc stateful inspection bất đối xứng có thể làm chiều đi
thành công nhưng response bị bỏ.

~~~text
10.20.0.0/16       mạng tổng
10.20.10.0/24      public/load balancer
10.20.20.0/24      private application
10.20.30.0/24      private data
0.0.0.0/0          default IPv4 route, không có nghĩa "mọi địa chỉ local"
::/0               default IPv6 route
~~~

NAT đổi address/port, không tự là firewall. Stateful firewall nhớ connection; stateless
rule phải cho cả hai chiều/ephemeral port theo thiết kế.

## TCP, UDP, QUIC và timeout

- TCP cung cấp ordered byte stream, handshake, retransmission và congestion control.
- UDP là datagram, không tự đảm bảo delivery/order; application chịu semantics.
- QUIC chạy trên UDP, tích hợp security/stream và giảm một số handshake cost.
- Listen port khác established connection; client thường dùng ephemeral source port.
- Timeout phải giảm hợp lý theo call chain để caller không chờ lâu hơn deadline ngoài.
- Retry không giới hạn tạo retry storm; chỉ retry operation an toàn/idempotent với backoff
  và jitter.

## DNS

Flow thường là stub resolver → recursive resolver → root/TLD/authoritative server. Cache
theo TTL; NXDOMAIN cũng có thể bị negative cache. Record thường gặp:

- A/AAAA: IPv4/IPv6;
- CNAME: alias; apex có constraint tùy DNS;
- NS/SOA: authority và zone metadata;
- MX/TXT/SRV/CAA/PTR: mail, verification/service, CA policy, reverse lookup.

Split-horizon trả kết quả khác giữa mạng private/public. Khi đổi record, hạ TTL đủ sớm,
đo resolver thực tế và nhớ client/application có cache riêng.

~~~bash
dig api.example.com A
dig api.example.com AAAA
dig +trace api.example.com
dig @1.1.1.1 api.example.com
resolvectl query api.example.com
~~~

PowerShell:

~~~powershell
Resolve-DnsName api.example.com -Type A
Resolve-DnsName api.example.com -Type AAAA
Get-DnsClientCache
~~~

## TLS/PKI

TLS xác thực peer và bảo vệ dữ liệu trên đường truyền. Client cần:

1. connect đúng endpoint;
2. nhận certificate chain hợp lệ đến trust anchor;
3. hostname nằm trong Subject Alternative Name;
4. certificate trong thời gian hiệu lực, clock đúng và algorithm/policy được chấp nhận;
5. SNI giúp server/LB chọn certificate đúng;
6. mTLS thêm certificate client, nhưng authorization vẫn là bước riêng.

~~~bash
openssl s_client -connect api.example.com:443 -servername api.example.com -showcerts
curl -v --connect-timeout 3 --max-time 10 https://api.example.com/health
~~~

Không dùng tùy chọn bỏ verify TLS như cách sửa production.

## HTTP, proxy và load balancing

- Method semantics: GET/HEAD thường safe; PUT/DELETE được kỳ vọng idempotent theo contract;
  POST không mặc định idempotent.
- Status: 2xx success, 3xx redirect, 4xx request/client/policy, 5xx server/upstream.
- 401 là thiếu/không hợp lệ authentication; 403 là đã hiểu identity nhưng không được phép
  trong cách dùng phổ biến.
- Header Host/:authority và SNI có thể khác; proxy phải truyền identity/request ID an toàn.
- L4 cân bằng connection; L7 hiểu HTTP và route theo host/path/header.
- Health/readiness không nên chỉ kiểm tra process; cũng không nên làm dependency nặng khiến
  probe tự gây outage.

## Enterprise/cloud traffic path

- Forward proxy đại diện client ra ngoài; reverse proxy đại diện server nhận traffic.
- CDN/cache giảm latency/origin load nhưng thêm stale/invalidation/purge và cache-key risk.
- WAF lọc/rate-limit một số HTTP threat; không thay secure application/authentication.
- BGP trao đổi prefix/path giữa network; route advertisement sai có blast radius lớn.
- VPN/private circuit cần hai tunnel/path, BGP/session/MTU và failover test.
- API gateway thêm auth, quota, transformation/versioning; nó có SLO/capacity/failure riêng.

Khi debug, hỏi component nào terminate TLS, đổi source IP/header, cache response hoặc retry.
Đừng xem một sơ đồ logic là packet path thực tế.

## MTU và packet capture

MTU mismatch/blocked ICMP có thể làm request nhỏ chạy nhưng response lớn treo. Kiểm tra
interface MTU, path MTU và fragmentation. Packet capture có thể chứa token/PII; giới hạn
interface/filter/thời gian, bảo vệ và xóa theo policy.

~~~bash
ip addr
ip route
ip neigh
ss -lntup
tracepath api.example.com
tcpdump -ni any 'host 10.20.20.10 and port 443'
~~~

~~~powershell
Get-NetIPConfiguration
Get-NetRoute
Get-NetTCPConnection -State Listen
Test-NetConnection api.example.com -Port 443 -InformationLevel Detailed
tracert api.example.com
~~~

## Debug theo layer

1. Xác nhận URL, client, timestamp, request ID và scope.
2. DNS: result/TTL/resolver có đúng?
3. Route/address: source, next hop, NAT, IPv4/IPv6 và return path?
4. Policy: security list/NSG/firewall/proxy cho đúng direction/port?
5. Transport: connect, reset, retransmission, timeout, MTU?
6. TLS: chain, SAN, time, SNI, client cert?
7. HTTP: status, redirect, header, proxy/upstream timeout?
8. App/dependency: log/trace/query/resource pressure?

Đọc [playbook lab](lab/troubleshooting-playbook.md) để thực hiện ba incident mô phỏng.

## Hoàn thành D03 khi

- Tính và vẽ được CIDR/route/return path gồm IPv4 và IPv6.
- Phân biệt DNS, connect, TLS, HTTP và application failure bằng evidence.
- Giải thích negative cache, SNI, mTLS, L4/L7 và stateful/stateless.
- Chứng minh một lỗi MTU hoặc return path trong lab.
- Packet capture không làm lộ dữ liệu và có cleanup.

Nguồn: [RFC 8200 IPv6](https://www.rfc-editor.org/rfc/rfc8200),
[RFC 1034 DNS](https://www.rfc-editor.org/rfc/rfc1034),
[RFC 9110 HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110) và
[RFC 8446 TLS 1.3](https://www.rfc-editor.org/rfc/rfc8446).

Tiếp theo: [D04 - Git và collaboration](../04-git-collaboration/README.md).
