# 40 — Reinforcement Learning và alignment

## Mục tiêu

Hiểu agent, environment, state, action, reward, policy, value, exploration/exploitation; phân biệt bandit, MDP, SFT, preference optimization (DPO) và online RL/RLHF.

## Bản chất

Supervised learning học đáp án có sẵn. Reinforcement Learning (RL) học chính sách để tối đa hóa tổng reward qua tương tác. Multi-armed bandit là trường hợp không có state transition dài hạn; MDP thêm state, transition và discounted return. RL khó vì reward thưa/nhiễu, data phụ thuộc policy và hành động hiện tại ảnh hưởng dữ liệu tương lai.

Alignment dùng feedback hoặc verifier để ưu tiên hành vi mong muốn. RLHF thường gồm thu thập preference, reward model và policy optimization. DPO tối ưu trực tiếp chênh lệch log-probability giữa response được chọn và bị từ chối so với reference. Tên thuật toán không thay thế thiết kế eval/safety: reward sai sẽ tạo reward hacking.

## Khi nào dùng

- Bandit: chọn notification, ranking hoặc route model và nhận feedback nhanh.
- DPO/preference: có cặp chosen/rejected đáng tin nhưng không cần online environment.
- Online RL/RFT: có verifier/reward tốt, task có thể thử nhiều lần và lợi ích đủ lớn.
- Không dùng RL khi có nhãn trực tiếp và SFT giải được; không biến proxy metric thành mục tiêu duy nhất.

Ví dụ: router chọn model nhanh/rẻ hoặc model mạnh theo loại request. Reward phải phản ánh cả task success, latency, cost và safety.

## Demo

```powershell
python Lessions/40-reinforcement-learning-alignment/src/demo.py
```

Demo chạy epsilon-greedy bandit có seed và tính toy DPO loss ổn định số học.

## Bài tập và checklist

1. Đổi epsilon, horizon và reward distributions; vẽ regret bằng công cụ tùy chọn.
2. Thêm cost vào reward và quan sát policy thay đổi.
3. Liệt kê ba cách game reward trong một coding agent.

- [ ] Phân biệt immediate reward và long-term return.
- [ ] Giữ holdout eval độc lập với reward được tối ưu.
- [ ] Có exploration budget, safety constraint và rollback.
- [ ] Không dùng “human preference” như một nhãn khách quan tuyệt đối.

Bài trước: 39. Bài sau: 41.

