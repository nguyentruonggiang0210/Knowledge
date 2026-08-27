# 17. Heap, Priority Queue và Top-K

## Mục tiêu

- Dùng min-heap/max-heap cho phần tử ưu tiên nhất.
- Giải top-k, k-way merge và running median.
- Hiểu `PriorityQueue<TElement,TPriority>` của .NET là min-heap.

## Dấu hiệu nhận diện

Đề liên tục hỏi min/max hiện tại, top/bottom `k`, phần tử tiếp theo theo priority, merge nhiều danh sách đã sort, hoặc dữ liệu đến theo stream. Nếu chỉ sort một lần rồi đọc toàn bộ, sort có thể đơn giản hơn.

## Invariant Top-K

Để tìm `k` phần tử lớn nhất, giữ **min-heap kích thước tối đa k**. Heap chứa k phần tử tốt nhất đã thấy; root là phần tử yếu nhất trong nhóm và bị thay đầu tiên.

## C# 12 sample: k phần tử xuất hiện nhiều nhất

```csharp
using System;
using System.Collections.Generic;

public static class HeapAlgorithms
{
    public static int[] TopKFrequent(int[] values, int k)
    {
        if (k <= 0) return Array.Empty<int>();

        var frequency = new Dictionary<int, int>();
        foreach (int value in values)
            frequency[value] = frequency.GetValueOrDefault(value) + 1;

        var heap = new PriorityQueue<int, int>(); // element=value, priority=count
        foreach (var (value, count) in frequency)
        {
            heap.Enqueue(value, count);
            if (heap.Count > k) heap.Dequeue();
        }

        var answer = new int[heap.Count];
        for (int i = answer.Length - 1; i >= 0; i--)
            answer[i] = heap.Dequeue();
        return answer;
    }
}
```

## Dry run

Với `[1,1,1,2,2,3]`, `k=2`, frequency là `1→3, 2→2, 3→1`. Heap luôn tối đa hai item; item frequency `1` bị loại, kết quả gồm `1` và `2`.

## Độ phức tạp

Đếm `O(n)` expected. Với `m` giá trị distinct, heap tốn `O(m log k)`, memory `O(m+k)`. Nếu cần đúng thứ tự khi priority bằng nhau, phải định nghĩa tie-breaker.

## Pattern quan trọng

- Kth largest: min-heap size `k`.
- Merge k sorted lists: heap chứa head hiện tại của mỗi list, `O(N log k)`.
- Median stream: max-heap nửa trái + min-heap nửa phải, cân bằng size lệch tối đa 1.
- Scheduler: priority thường là `(time, sequence)` để ổn định.

## Ứng dụng thực tế

- Job scheduler, event simulation, retry queue.
- Top queries/products từ stream.
- Multiway merge trong external sort và storage engine.

## Lỗi thường gặp

- Quên .NET PriorityQueue là min-heap.
- Dùng priority `-value` và overflow tại `int.MinValue`; ưu tiên comparer hoặc kiểu `long`.
- Nghĩ dequeue với priority bằng nhau là stable.
- Dùng heap size `n` cho top-k khiến mất lợi thế `log k`.

## Câu hỏi phỏng vấn

1. Kth Largest Element in a Stream.
2. Merge K Sorted Lists.
3. Find Median from Data Stream.
4. Task Scheduler / Reorganize String.

## Checklist

- [ ] Chọn đúng min-heap hay max-heap.
- [ ] Nói được invariant size-k.
- [ ] Biết complexity `O(n log k)`.
- [ ] Xử lý `k=0`, `k>distinct`, tie và stream.

