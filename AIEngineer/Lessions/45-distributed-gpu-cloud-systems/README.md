# 45 — GPU, distributed và cloud AI systems

## Mục tiêu

Ước lượng memory/throughput, phân biệt compute-bound và bandwidth-bound, chọn scale-up/scale-out cùng data/model/tensor/pipeline parallelism, và thiết kế fault tolerance.

## Bản chất

GPU hiệu quả nhờ song song dữ liệu lớn và memory bandwidth, nhưng VRAM hữu hạn. Tổng memory inference không chỉ là weights: còn KV cache, activations/workspace, batching và fragmentation. Training thêm gradients, optimizer states và activations. Hãy ước lượng trước khi thuê phần cứng.

- Data parallel: mỗi worker giữ model, chia batch; sync gradient.
- Tensor parallel: chia phép toán/layer giữa devices; giao tiếp dày.
- Pipeline parallel: chia các stage; có pipeline bubble.
- Expert parallel: route token qua subsets (MoE).

Scale-out thêm network, scheduler, checkpoint, object storage, queue và failure modes. Distributed system không “nhanh gấp N” tự động: serialization, all-reduce và straggler có thể thống trị.

## Khi nào dùng

- Scale-up khi model vừa một máy lớn và simplicity quan trọng.
- Data parallel khi training batch lớn/model vừa mỗi worker.
- Model/tensor parallel khi model không vừa một device.
- Không phân tán workload nhỏ; trước hết profile CPU/GPU utilization, memory và I/O.

Ví dụ: serving nhiều model adapters dùng shared base weights và request batching có thể rẻ hơn nhân cả model trên mỗi tenant.

## Demo

```powershell
python Lessions/45-distributed-gpu-cloud-systems/src/demo.py
```

Demo ước lượng memory, greedy-shard tasks và phục hồi task khi worker giả lập chết.

## Bài tập và checklist

1. Ước lượng weights của model 7B ở FP16/INT8/INT4; cộng headroom 20%.
2. Thêm network transfer cost vào scheduler.
3. Thiết kế idempotent checkpoint để worker retry không tạo output trùng.

- [ ] Đo compute, memory, bandwidth và network riêng.
- [ ] Có checkpoint, retry budget, idempotency và health check.
- [ ] Capacity plan dùng p95 traffic và headroom, không chỉ average.
- [ ] So sánh tổng chi phí sở hữu, không chỉ giá GPU/giờ.

Bài trước: 44. Bài sau: 46.

