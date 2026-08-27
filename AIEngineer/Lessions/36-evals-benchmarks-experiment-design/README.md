# Lesson 36 — Evals, benchmarks và thiết kế thí nghiệm

## Mục tiêu

Sau bài này, bạn có thể:

- xây eval suite từ failure modes và acceptance criteria;
- đo nhiều chiều: correctness, groundedness, safety, trajectory và efficiency;
- so sánh baseline/candidate trên frozen cases và báo bất định;
- đặt CI regression gate không bị một điểm trung bình che lỗi nghiêm trọng;
- nhận biết metric gaming, data leakage và benchmark overfitting.

## Bản chất và cách hoạt động

Eval biến câu “hệ thống có tốt không?” thành các giả thuyết có thể lặp lại:

1. Định nghĩa population/use case và chi phí lỗi.
2. Thu thập case đại diện, edge/adversarial case và chia dev/test kín.
3. Freeze input, expected behavior, rubric, tool/environment và version.
4. Chạy baseline/candidate nhiều lần nếu hệ thống stochastic.
5. Đo từng chiều, confidence interval và subgroup; đọc trace cho lỗi.
6. Chỉ promote khi qua CI gate, sau đó theo dõi online và rollback được.

Các lớp eval bổ sung nhau:

- **Golden:** output/field/test mong đợi.
- **Property/invariant:** điều luôn phải đúng với nhiều input.
- **Retrieval/groundedness:** nguồn được phép, recall/ranking/citation.
- **Trajectory:** agent chọn tool, quyền, số bước và recovery ra sao.
- **Safety:** critical case phải pass, không được bù bằng điểm fluency.
- **Human rubric:** chất lượng khó mã hóa; cần blind review và agreement.
- **LLM-as-judge:** mở rộng nhanh nhưng phải calibrate với người, chống position/style bias và giữ judge/version cố định.

Benchmark công khai giúp định hướng, không thay eval dữ liệu thật. Không được tinh chỉnh trên hidden test, loại failure khó, đổi rubric sau khi thấy kết quả hoặc tối ưu một metric proxy đến mức hại mục tiêu thật.

## Khi nào dùng / không dùng

**Dùng khi:** thay model/prompt/index/tool/harness; chuẩn bị release; điều tra incident; theo dõi drift; so sánh thiết kế.

**Không nên dùng:** một điểm aggregate không có failure breakdown; case đã lọt vào training/prompt; sample quá nhỏ nhưng kết luận tuyệt đối; judge chưa calibrate; latency/cost đo trong môi trường khác production.

## Ví dụ thực tế

Một agent trả đúng cả hai đáp án nhưng ở case thứ hai gọi tool trái quyền. Correctness đạt 100%, còn safety chỉ 50%. CI gate yêu cầu safety 100% nên release bị chặn. Đây là ví dụ vì sao “điểm trung bình đẹp” không được phép che critical failure.

## Lệnh chạy

```powershell
python Lessions/36-evals-benchmarks-experiment-design/src/demo.py
```

Demo chạy offline với dataset nhỏ cố định.

## Bài tập

1. Thêm một adversarial case prompt injection và đánh dấu critical.
2. Bootstrap confidence interval cho chênh lệch correctness baseline/candidate.
3. Thêm subgroup theo ngôn ngữ Việt/Anh và tìm regression bị aggregate che khuất.
4. Viết policy thay đổi frozen suite: review, version, lý do và không xóa case thất bại.

## Checklist hoàn thành

- [ ] Eval cases bắt nguồn từ use case/failure mode thật.
- [ ] Tôi đo nhiều chiều và giữ critical gate riêng.
- [ ] Baseline/candidate dùng cùng frozen task/environment.
- [ ] Tôi báo version, sample size, variance và failure breakdown.
- [ ] Tôi giải thích được ít nhất ba kiểu metric gaming.

## Bài trước / bài sau

- Bài trước: [Lesson 35 — MCP, skills, connectors và protocols](../35-mcp-skills-connectors-protocols/README.md)
- Bài sau: [Lesson 37 — Observability, latency và cost](../37-observability-latency-cost/README.md)
