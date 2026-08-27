# 07. Queue, Deque và Monotonic Queue

## Mục tiêu

- Dùng queue cho xử lý FIFO và BFS.
- Dùng deque khi cần thêm/xóa hiệu quả ở cả hai đầu.
- Xây dựng monotonic deque cho max/min của mọi cửa sổ trong `O(n)`.
- Phân biệt “phần tử hết hạn” với “phần tử bị dominate”.

## Trực giác

Queue là First-In, First-Out: dữ liệu đến trước được xử lý trước. Đây là cấu trúc tự nhiên cho BFS, scheduler và producer-consumer.

Deque (double-ended queue) cho phép thao tác ở cả đầu và cuối. Monotonic deque tận dụng đặc tính đó để giữ lại **chỉ các ứng viên có thể trở thành đáp án**.

Với sliding window maximum, deque lưu index có giá trị **giảm dần** từ đầu đến cuối:

- đầu deque luôn là max hiện tại;
- khi có giá trị mới lớn hơn/equal các giá trị ở cuối, các index cuối không bao giờ còn cơ hội làm max và bị loại;
- khi đầu deque nằm ngoài cửa sổ, loại nó vì đã hết hạn.

Tại sao phần tử nhỏ hơn ở cuối bị dominate? Giá trị mới vừa lớn hơn/equal, vừa ở bên phải nên sẽ hết hạn muộn hơn. Phần tử cũ không thể thắng trong bất kỳ cửa sổ tương lai nào chứa cả hai.

## Khi dùng / dấu hiệu nhận diện

### Queue

- BFS theo tầng, shortest path trên graph không trọng số.
- Xử lý task/event theo thứ tự đến.
- Mô phỏng hàng đợi, round-robin kết hợp kỹ thuật khác.

### Deque / monotonic queue

- Maximum/minimum của **mọi cửa sổ** độ dài `k`.
- DP cần min/max trong một phạm vi index gần nhất.
- Cần loại dữ liệu hết hạn ở đầu và loại ứng viên yếu ở cuối.
- Bài prefix sum cần tìm prefix nhỏ nhất trong một khoảng, ví dụ shortest subarray có tổng ít nhất `K` với số âm.

Nếu chỉ cần maximum của toàn bộ dữ liệu, một biến là đủ. Nếu cửa sổ cố định nhưng chỉ cần sum/average, sliding window thường không cần deque.

## Thuật toán từng bước: Sliding Window Maximum

1. Kiểm tra `1 <= k <= n`.
2. Duyệt `right` từ 0 đến `n - 1`; `left = right - k + 1`.
3. Loại index ở **đầu** nếu `< left`: chúng không còn thuộc cửa sổ.
4. Trong khi giá trị ở **cuối** `<= numbers[right]`, loại cuối vì bị phần tử mới dominate.
5. Thêm `right` vào cuối.
6. Khi cửa sổ đã đủ `k` phần tử (`right >= k - 1`), ghi `numbers[deque.First]` vào output.

**Invariant:** deque chứa các index trong cửa sổ hiện tại theo thứ tự tăng dần về index và giảm nghiêm ngặt về value.

Dùng `<=` khi pop cuối giúp loại duplicate cũ và giữ duplicate mới hơn. Dùng `<` cũng đúng về giá trị output nhưng deque có thể giữ thêm duplicate; phải nhất quán khi xét expiry.

## Độ phức tạp

- Thời gian `O(n)`: mỗi index thêm cuối một lần, bị xóa nhiều nhất một lần.
- Auxiliary space `O(k)`: deque không chứa quá số phần tử trong cửa sổ.
- Output `O(n - k + 1)`.
- So với max-heap: thường `O(n log k)` và cần lazy deletion hoặc tracking index hết hạn.

## C# 12 sample hoàn chỉnh

`LinkedList<int>` được dùng như deque vì .NET không có generic `Deque<T>` trong API nền tảng phổ biến. Mỗi node thêm/xóa ở hai đầu là `O(1)`.

```csharp
using System;
using System.Collections.Generic;

public static class Program
{
    public static int[] MaxSlidingWindow(int[] numbers, int windowSize)
    {
        if (windowSize <= 0 || windowSize > numbers.Length)
        {
            throw new ArgumentOutOfRangeException(nameof(windowSize));
        }

        var candidates = new LinkedList<int>(); // Lưu index.
        var result = new int[numbers.Length - windowSize + 1];
        int outputIndex = 0;

        for (int right = 0; right < numbers.Length; right++)
        {
            int left = right - windowSize + 1;

            // Loại index đã nằm bên trái cửa sổ.
            if (candidates.First is not null && candidates.First.Value < left)
            {
                candidates.RemoveFirst();
            }

            // Loại các ứng viên yếu hơn hoặc bằng ở cuối.
            while (candidates.Last is not null &&
                   numbers[candidates.Last.Value] <= numbers[right])
            {
                candidates.RemoveLast();
            }

            candidates.AddLast(right);

            if (right >= windowSize - 1)
            {
                result[outputIndex++] = numbers[candidates.First!.Value];
            }
        }

        return result;
    }

    public static int[] BreadthFirstDistances(List<int>[] graph, int start)
    {
        if ((uint)start >= (uint)graph.Length)
        {
            throw new ArgumentOutOfRangeException(nameof(start));
        }

        var distances = new int[graph.Length];
        Array.Fill(distances, -1);

        var queue = new Queue<int>();
        distances[start] = 0; // Đánh dấu visited trước khi enqueue.
        queue.Enqueue(start);

        while (queue.Count > 0)
        {
            int node = queue.Dequeue();
            foreach (int neighbor in graph[node])
            {
                if (distances[neighbor] != -1)
                {
                    continue;
                }

                distances[neighbor] = distances[node] + 1;
                queue.Enqueue(neighbor);
            }
        }

        return distances;
    }

    public static void Main()
    {
        int[] numbers = [1, 3, -1, -3, 5, 3, 6, 7];
        Console.WriteLine(string.Join(", ", MaxSlidingWindow(numbers, 3)));
        // 3, 3, 5, 5, 6, 7

        List<int>[] graph =
        [
            [1, 2],
            [0, 3],
            [0, 3],
            [1, 2]
        ];
        Console.WriteLine(string.Join(", ", BreadthFirstDistances(graph, 0)));
        // 0, 1, 1, 2
    }
}
```

## Dry run: Sliding Window Maximum

Đầu vào `[1,3,-1,-3,5,3,6,7]`, `k = 3`. Deque hiển thị `index:value`.

| `right` | Thao tác chính | Deque sau bước | Output |
|---:|---|---|---|
| 0 (1) | Thêm 0 | `[0:1]` | — |
| 1 (3) | Pop cuối 0 vì `1 <= 3` | `[1:3]` | — |
| 2 (-1) | Thêm 2 | `[1:3, 2:-1]` | 3 |
| 3 (-3) | Thêm 3 | `[1:3, 2:-1, 3:-3]` | 3 |
| 4 (5) | Index 1 hết hạn; pop 3,2 vì yếu hơn | `[4:5]` | 5 |
| 5 (3) | Thêm 5 | `[4:5, 5:3]` | 5 |
| 6 (6) | Pop 5,4 | `[6:6]` | 6 |
| 7 (7) | Pop 6 | `[7:7]` | 7 |

## Lỗi thường gặp

- Lưu value thay vì index nên không biết phần tử nào hết hạn.
- Loại hết hạn bằng `<= left` thay vì `< left` khi cửa sổ là inclusive `[left..right]`.
- Lấy max trước khi loại hết hạn.
- Dùng sai chiều đơn điệu: maximum cần giá trị giảm dần, minimum cần tăng dần.
- Pop đầu và pop cuối vì cùng một lý do; thực tế đầu xử lý expiry, cuối xử lý domination.
- Trả output trước khi cửa sổ có đủ `k` phần tử.
- Không định nghĩa hành vi với `k = 0`, `k > n`, input rỗng.
- Trong BFS, đánh dấu visited sau dequeue làm một node có thể bị enqueue nhiều lần.
- Dùng `List<T>.RemoveAt(0)` như dequeue: thao tác đó là `O(n)` do phải dịch phần tử.

## Ứng dụng thực tế

- Moving peak/minimum của CPU, latency, giá và sensor.
- Cảnh báo nếu metric vượt ngưỡng trong cửa sổ gần nhất.
- BFS trong routing, dependency graph và shortest hop.
- Buffer tác vụ FIFO, pipeline sự kiện.
- Tối ưu DP có transition lấy min/max trên một dải index.
- Stream processing với dữ liệu hết hạn theo vị trí/thời gian.

Ở production throughput cao, `LinkedList<T>` có overhead allocation. Một deque vòng trên array có thể giảm GC; nhưng trong phỏng vấn, ưu tiên code đúng và nói được trade-off.

## Câu hỏi phỏng vấn tự luyện

1. Implement Queue Using Stacks và Stack Using Queues.
2. Binary Tree Level Order Traversal bằng BFS.
3. Sliding Window Maximum.
4. First Negative Number in Every Window.
5. Shortest Subarray with Sum at Least K khi có số âm.
6. Jump Game VI bằng monotonic deque + DP.
7. Rotting Oranges bằng multi-source BFS.
8. So sánh monotonic deque với heap cho sliding maximum.

## Checklist

- [ ] Tôi phân biệt FIFO, LIFO và deque hai đầu.
- [ ] Tôi lưu index để kiểm tra expiry và tính khoảng cách.
- [ ] Tôi mô tả hai quy tắc: hết hạn ở đầu, dominate ở cuối.
- [ ] Tôi phát biểu invariant index tăng/value giảm cho maximum.
- [ ] Tôi chứng minh amortized `O(n)` bằng số lần add/remove.
- [ ] Tôi xử lý đúng `k = 1`, `k = n`, duplicate và số âm.
- [ ] Tôi không dùng thao tác đầu mảng `O(n)` làm queue.
- [ ] Tôi biết khi nào chọn heap, deque hoặc queue thường.

