# Checklist câu hỏi phỏng vấn kinh điển — Basic đến Senior

Tài liệu này là điểm bắt đầu để ôn nhanh các câu hỏi có tần suất cao nhất trong 12 miền. Hãy trả lời thành tiếng trước, ghi lại chỗ chưa chắc, rồi mới mở đáp án để đối chiếu cơ chế, trade-off và tín hiệu ở cấp Senior.

**Bài kiểm tra tổng hợp:** [72 câu kinh điển](./Quiz/classic_interview.md) · [Đáp án và rubric](./Anwsers/classic_interview_answers.md) · 120 phút · 144 điểm.

## Bản đồ 12 miền

| Miền | Dải câu kinh điển | Ngân hàng câu hỏi | Đáp án |
|---|---:|---|---|
| C# | `CS-061`–`CS-080` | [c_sharp.md](./c_sharp.md) | [Anwsers/c_sharp.md](./Anwsers/c_sharp.md) |
| .NET / ASP.NET Core / EF Core | `NET-056`–`NET-075` | [dotnet_aspnet.md](./dotnet_aspnet.md) | [Anwsers/dotnet_aspnet.md](./Anwsers/dotnet_aspnet.md) |
| Java | `JAVA-059`–`JAVA-078` | [java.md](./java.md) | [Anwsers/java.md](./Anwsers/java.md) |
| JVM / Spring | `JVM-056`–`JVM-075` | [jvm_spring.md](./jvm_spring.md) | [Anwsers/jvm_spring.md](./Anwsers/jvm_spring.md) |
| Algorithms & Data Structures | `ALG-061`–`ALG-080` | [algorithms_data_structures.md](./algorithms_data_structures.md) | [Anwsers/algorithms_data_structures.md](./Anwsers/algorithms_data_structures.md) |
| Database | `DB-066`–`DB-085` | [database.md](./database.md) | [Anwsers/database.md](./Anwsers/database.md) |
| Software Engineering | `SE-046`–`SE-060` | [software_engineering.md](./software_engineering.md) | [Anwsers/software_engineering.md](./Anwsers/software_engineering.md) |
| System Design | `SD-061`–`SD-075` | [system_design.md](./system_design.md) | [Anwsers/system_design.md](./Anwsers/system_design.md) |
| Infrastructure & Cloud | `INF-046`–`INF-060` | [infra_cloud.md](./infra_cloud.md) | [Anwsers/infra_cloud.md](./Anwsers/infra_cloud.md) |
| DevOps & Observability | `DO-051`–`DO-065` | [devops_observability.md](./devops_observability.md) | [Anwsers/devops_observability.md](./Anwsers/devops_observability.md) |
| Security | `SEC-051`–`SEC-065` | [security.md](./security.md) | [Anwsers/security.md](./Anwsers/security.md) |
| Behavioral & Leadership | `BEH-001`–`BEH-036` | [behavioral_leadership.md](./behavioral_leadership.md) | [Anwsers/behavioral_leadership.md](./Anwsers/behavioral_leadership.md) |

## Lộ trình ôn tập

### Chặng Basic — nói đúng khái niệm và contract

Mục tiêu: trả lời trong 60–90 giây, phân biệt được các khái niệm dễ nhầm và đưa ra một ví dụ nhỏ.

- [ ] **C#:** `CS-061`, `CS-063`, `CS-065`, `CS-067`
- [ ] **.NET:** `NET-056`, `NET-058`, `NET-059`, `NET-062`
- [ ] **Java:** `JAVA-059`, `JAVA-060`, `JAVA-062`, `JAVA-063`
- [ ] **JVM/Spring:** `JVM-056`, `JVM-057`, `JVM-060`, `JVM-062`
- [ ] **Algorithms:** `ALG-061`, `ALG-062`, `ALG-063`, `ALG-064`
- [ ] **Database:** `DB-066`, `DB-068`, `DB-070`, `DB-071`
- [ ] **Software Engineering:** `SE-047`, `SE-048`, `SE-049`, `SE-052`
- [ ] **System Design:** `SD-061`, `SD-062`, `SD-064`, `SD-067`
- [ ] **Infra/Cloud:** `INF-046`, `INF-048`, `INF-050`, `INF-051`
- [ ] **DevOps/Observability:** `DO-051`, `DO-053`, `DO-055`, `DO-056`
- [ ] **Security:** `SEC-052`, `SEC-053`, `SEC-056`, `SEC-057`
- [ ] **Behavioral:** `BEH-001`, `BEH-002`, `BEH-004`, `BEH-009`

### Chặng Middle — giải thích cơ chế, lựa chọn và failure mode

Mục tiêu: trả lời trong 2–3 phút theo cấu trúc **kết luận → cơ chế → trade-off → ví dụ**, đồng thời chỉ ra ít nhất một pitfall thực tế.

- [ ] **C#:** `CS-068`, `CS-069`, `CS-073`, `CS-075`
- [ ] **.NET:** `NET-063`, `NET-064`, `NET-068`, `NET-070`
- [ ] **Java:** `JAVA-066`, `JAVA-069`, `JAVA-071`, `JAVA-072`
- [ ] **JVM/Spring:** `JVM-064`, `JVM-065`, `JVM-067`, `JVM-070`
- [ ] **Algorithms:** `ALG-069`, `ALG-070`, `ALG-073`, `ALG-075`
- [ ] **Database:** `DB-073`, `DB-075`, `DB-077`, `DB-080`
- [ ] **Software Engineering:** `SE-053`, `SE-055`, `SE-056`, `SE-057`
- [ ] **System Design:** `SD-069`, `SD-071`, `SD-072`
- [ ] **Infra/Cloud:** `INF-053`, `INF-055`, `INF-057`
- [ ] **DevOps/Observability:** `DO-058`, `DO-060`, `DO-062`
- [ ] **Security:** `SEC-058`, `SEC-060`, `SEC-062`
- [ ] **Behavioral:** `BEH-013`, `BEH-015`, `BEH-017`, `BEH-020`

### Chặng Senior — thiết kế dưới ràng buộc và vận hành khi có sự cố

Mục tiêu: làm rõ assumption trước khi trả lời; nêu invariant, failure policy, observability, rollout/rollback và cách đo kết quả. Với câu behavioral, chỉ dùng trải nghiệm thật và trình bày theo STAR kèm impact cùng reflection.

- [ ] **C#:** `CS-077`, `CS-079`, `CS-080`
- [ ] **.NET:** `NET-072`, `NET-074`, `NET-075`
- [ ] **Java:** `JAVA-076`, `JAVA-077`, `JAVA-078`
- [ ] **JVM/Spring:** `JVM-073`, `JVM-074`, `JVM-075`
- [ ] **Algorithms:** `ALG-078`, `ALG-079`, `ALG-080`
- [ ] **Database:** `DB-081`, `DB-082`, `DB-084`
- [ ] **Software Engineering:** `SE-058`, `SE-059`, `SE-060`
- [ ] **System Design:** `SD-073`, `SD-074`, `SD-075`
- [ ] **Infra/Cloud:** `INF-058`, `INF-059`, `INF-060`
- [ ] **DevOps/Observability:** `DO-063`, `DO-064`, `DO-065`
- [ ] **Security:** `SEC-063`, `SEC-064`, `SEC-065`
- [ ] **Behavioral/Leadership:** `BEH-026`, `BEH-029`, `BEH-035`, `BEH-036`

## Cách dùng checklist hiệu quả

1. Chọn một chặng và tự trả lời các ID ưu tiên mà không mở đáp án.
2. Đánh dấu câu trả lời còn thiếu cơ chế, ví dụ, trade-off hoặc tín hiệu vận hành.
3. Đọc đáp án canonical, viết lại bằng từ ngữ của chính mình và trả lời lại sau 24–48 giờ.
4. Khi hoàn thành cả ba chặng, làm bài 72 câu trong điều kiện giới hạn 120 phút rồi tự chấm theo rubric.

