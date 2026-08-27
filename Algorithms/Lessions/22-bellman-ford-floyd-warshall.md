# 22. Bellman–Ford và Floyd–Warshall

## Mục tiêu

Sau bài này, bạn có thể:

- Chọn đúng giữa Bellman–Ford, Floyd–Warshall, BFS và Dijkstra.
- Tìm đường đi ngắn nhất khi đồ thị có cạnh âm.
- Phát hiện chu trình âm và giải thích vì sao khi đó một số khoảng cách ngắn nhất không còn hữu hạn.
- Trình bày invariant, độ phức tạp và giới hạn của từng thuật toán.

## Nhận diện bài toán

| Nhu cầu | Lựa chọn phù hợp |
|---|---|
| Một nguồn, trọng số không âm | Dijkstra |
| Một nguồn, có thể có cạnh âm | Bellman–Ford |
| Mọi cặp đỉnh, số đỉnh nhỏ hoặc đồ thị khá dày | Floyd–Warshall |
| Đồ thị không trọng số | BFS |
| Chỉ cần biết có chu trình âm reachable từ một nguồn | Bellman–Ford |
| Cần biết đồ thị có chu trình âm ở bất kỳ thành phần nào | Floyd–Warshall, hoặc thêm siêu nguồn cho Bellman–Ford |

Bellman–Ford xử lý một nguồn trong `O(VE)`. Floyd–Warshall tính mọi cặp trong `O(V³)` và dùng `O(V²)` bộ nhớ. Vì vậy, constraint là tín hiệu quan trọng: Floyd–Warshall thường chỉ phù hợp khi `V` tương đối nhỏ.

## Trực giác và invariant

### Bellman–Ford

Một đường đi đơn không có chu trình chứa nhiều nhất `V - 1` cạnh. Ta lặp thao tác **relax** mọi cạnh:

`dist[v] = min(dist[v], dist[u] + weight(u, v))`.

Sau vòng thứ `k`, mọi đường đi ngắn nhất dùng không quá `k` cạnh đã được xét đủ; cách cập nhật tại chỗ có thể tìm ra một số đường dài hơn sớm hơn, nhưng không làm mất tính đúng. Nếu sau `V - 1` vòng vẫn relax được một cạnh reachable từ nguồn, tồn tại chu trình âm reachable từ nguồn.

### Floyd–Warshall

Gọi `dist[i, j]` là chi phí tốt nhất đã biết từ `i` đến `j`. Ở vòng ngoài `k`, ta cho phép đỉnh `k` xuất hiện như một đỉnh trung gian:

`dist[i, j] = min(dist[i, j], dist[i, k] + dist[k, j])`.

Invariant: sau khi xử lý `k`, `dist[i, j]` là đường đi tốt nhất có các đỉnh trung gian thuộc tập `{0, ..., k}`. Nếu cuối cùng có `dist[i, i] < 0` thì tồn tại một closed walk âm từ `i` trở về `i`, suy ra graph có chu trình âm.

## Các bước thực hiện

### Bellman–Ford

1. Gán khoảng cách nguồn bằng `0`, các đỉnh khác bằng vô cực.
2. Lặp tối đa `V - 1` lần.
3. Trong mỗi lần, relax toàn bộ cạnh có đầu `u` đang reachable.
4. Nếu không có cập nhật, dừng sớm.
5. Quét cạnh thêm một lần để phát hiện chu trình âm reachable.

### Floyd–Warshall

1. Khởi tạo đường chéo bằng `0`, cạnh trực tiếp bằng trọng số nhỏ nhất và ô còn lại bằng vô cực.
2. Đặt vòng lặp `k` ở ngoài cùng.
3. Với mọi `i, j`, thử đường `i → k → j`.
4. Kiểm tra các ô đường chéo âm.

## Dry run Bellman–Ford

Với các cạnh theo đúng thứ tự:

`0→1(4), 0→2(5), 1→2(-2), 2→3(3), 1→3(4)`.

| Thời điểm | Khoảng cách `[0,1,2,3]` | Giải thích |
|---|---|---|
| Khởi tạo | `[0,∞,∞,∞]` | Chỉ nguồn reachable |
| Sau vòng 1 | `[0,4,2,5]` | Cạnh âm `1→2` cải thiện `5` thành `2` |
| Vòng 2 | Không đổi | Có thể dừng sớm |

Kết quả là `0, 4, 2, 5`. Cạnh âm không đồng nghĩa với chu trình âm.

## C# 12 sample độc lập

Mẫu dưới đây coi đồ thị là **có hướng**. `ValidateInput` giới hạn độ lớn mỗi edge theo `Infinity / V` để mọi simple-path distance hữu hạn không đụng sentinel; `checked` giúp lỗi tràn số lộ rõ thay vì âm thầm cho kết quả sai.

```csharp
using System;
using System.Collections.Generic;

public readonly record struct Edge(int From, int To, long Weight);

public sealed record BellmanFordResult(
    long[] Distances,
    bool HasReachableNegativeCycle);

public sealed record FloydWarshallResult(
    long[,] Distances,
    bool HasNegativeCycle);

public static class ShortestPaths
{
    public const long Infinity = long.MaxValue / 4;

    public static BellmanFordResult BellmanFord(
        int vertexCount,
        IReadOnlyList<Edge> edges,
        int source)
    {
        ValidateInput(vertexCount, edges);
        if (source < 0 || source >= vertexCount)
        {
            throw new ArgumentOutOfRangeException(nameof(source));
        }

        var distance = new long[vertexCount];
        Array.Fill(distance, Infinity);
        distance[source] = 0;

        for (int pass = 1; pass < vertexCount; pass++)
        {
            bool changed = false;
            foreach (Edge edge in edges)
            {
                if (distance[edge.From] == Infinity)
                {
                    continue;
                }

                long candidate = checked(distance[edge.From] + edge.Weight);
                if (candidate < distance[edge.To])
                {
                    distance[edge.To] = candidate;
                    changed = true;
                }
            }

            if (!changed)
            {
                break;
            }
        }

        bool hasReachableNegativeCycle = false;
        foreach (Edge edge in edges)
        {
            if (distance[edge.From] == Infinity)
            {
                continue;
            }

            long candidate = checked(distance[edge.From] + edge.Weight);
            if (candidate < distance[edge.To])
            {
                hasReachableNegativeCycle = true;
                break;
            }
        }

        return new BellmanFordResult(distance, hasReachableNegativeCycle);
    }

    public static FloydWarshallResult FloydWarshall(
        int vertexCount,
        IReadOnlyList<Edge> edges)
    {
        ValidateInput(vertexCount, edges);

        var distance = new long[vertexCount, vertexCount];
        for (int i = 0; i < vertexCount; i++)
        {
            for (int j = 0; j < vertexCount; j++)
            {
                distance[i, j] = i == j ? 0 : Infinity;
            }
        }

        foreach (Edge edge in edges)
        {
            distance[edge.From, edge.To] =
                Math.Min(distance[edge.From, edge.To], edge.Weight);
        }

        for (int k = 0; k < vertexCount; k++)
        {
            for (int i = 0; i < vertexCount; i++)
            {
                if (distance[i, k] == Infinity)
                {
                    continue;
                }

                for (int j = 0; j < vertexCount; j++)
                {
                    if (distance[k, j] == Infinity)
                    {
                        continue;
                    }

                    long throughK = checked(distance[i, k] + distance[k, j]);
                    if (throughK < distance[i, j])
                    {
                        distance[i, j] = throughK;
                    }
                }
            }
        }

        bool hasNegativeCycle = false;
        for (int i = 0; i < vertexCount; i++)
        {
            if (distance[i, i] < 0)
            {
                hasNegativeCycle = true;
                break;
            }
        }

        return new FloydWarshallResult(distance, hasNegativeCycle);
    }

    private static void ValidateInput(
        int vertexCount,
        IReadOnlyList<Edge> edges)
    {
        if (vertexCount <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(vertexCount));
        }

        ArgumentNullException.ThrowIfNull(edges);
        long magnitudeLimit = Infinity / vertexCount;
        foreach (Edge edge in edges)
        {
            if (edge.From < 0 || edge.From >= vertexCount ||
                edge.To < 0 || edge.To >= vertexCount)
            {
                throw new ArgumentException("Cạnh chứa đỉnh không hợp lệ.");
            }

            if (edge.Weight <= -magnitudeLimit || edge.Weight >= magnitudeLimit)
            {
                throw new ArgumentOutOfRangeException(
                    nameof(edges),
                    "Edge magnitude must be strictly less than Infinity / vertexCount.");
            }
        }
    }
}

public static class Program
{
    public static void Main()
    {
        Edge[] edges =
        [
            new(0, 1, 4),
            new(0, 2, 5),
            new(1, 2, -2),
            new(2, 3, 3),
            new(1, 3, 4)
        ];

        BellmanFordResult oneSource =
            ShortestPaths.BellmanFord(4, edges, 0);

        Console.WriteLine(string.Join(", ", oneSource.Distances));
        Console.WriteLine(
            $"Chu trình âm reachable: {oneSource.HasReachableNegativeCycle}");

        FloydWarshallResult allPairs =
            ShortestPaths.FloydWarshall(4, edges);

        Console.WriteLine($"Khoảng cách 0 -> 3: {allPairs.Distances[0, 3]}");
        Console.WriteLine($"Có chu trình âm: {allPairs.HasNegativeCycle}");
    }
}
```

Kết quả chính:

```text
0, 4, 2, 5
Chu trình âm reachable: False
Khoảng cách 0 -> 3: 5
Có chu trình âm: False
```

## Độ phức tạp

| Thuật toán | Thời gian | Bộ nhớ phụ | Phạm vi |
|---|---:|---:|---|
| Bellman–Ford | `O(VE)` | `O(V)` | Một nguồn |
| Floyd–Warshall | `O(V³)` | `O(V²)` | Mọi cặp |

Nếu Bellman–Ford dừng sớm thì thực tế có thể nhanh hơn, nhưng worst case vẫn là `O(VE)`.

## Giới hạn thuật toán

- Nếu có chu trình âm reachable rồi vẫn hỏi một khoảng cách chịu ảnh hưởng của chu trình đó, đáp án không phải một số hữu hạn; có thể đi quanh chu trình để giảm chi phí mãi.
- Code trên chỉ **phát hiện** chu trình âm, chưa truy vết chu trình và chưa đánh dấu từng cặp có khoảng cách `-∞`.
- Bellman–Ford quá chậm với graph rất lớn; nếu trọng số không âm, Dijkstra thường tốt hơn.
- Floyd–Warshall không phù hợp khi `V` lớn vì cả thời gian `V³` lẫn ma trận `V²`.
- Muốn dựng đường đi, cần lưu `parent` ở Bellman–Ford hoặc ma trận `next` ở Floyd–Warshall.
- Sample reject edge có `|weight| >= Infinity / V`, bảo đảm simple-path hữu hạn không trùng `Infinity = long.MaxValue / 4`. Với negative cycle cực đoan, `checked` vẫn có thể ném thay vì cho phép wrap; hệ thống thật nên dùng contract số học/reachability riêng phù hợp miền dữ liệu.

## Ứng dụng thực tế

- Phát hiện cơ hội arbitrage bằng cách biến tỷ giá thành trọng số logarithm âm; chu trình âm là tín hiệu ứng viên, nhưng hệ thống thật còn phí, spread và độ trễ.
- Tính bảng chi phí giữa mọi cặp trong một mạng nhỏ, tĩnh.
- Bellman–Ford là nền tảng của một số giao thức distance-vector; triển khai thật cần xử lý thêm convergence và route poisoning.
- Phân tích dependency có điểm thưởng/phạt âm trong mô hình offline.

## Lỗi thường gặp

- Chạy Bellman–Ford chỉ `V - 2` vòng hoặc quên lượt kiểm tra chu trình âm.
- Relax từ một đỉnh chưa reachable, khiến phép cộng với “vô cực” tạo kết quả sai.
- Kết luận Bellman–Ford phát hiện mọi chu trình âm dù chu trình không reachable từ nguồn.
- Đặt `i` hoặc `j` ngoài cùng trong Floyd–Warshall; invariant yêu cầu `k` ở ngoài cùng.
- Ghi đè cạnh song song mà không lấy trọng số nhỏ nhất.
- Dùng Dijkstra khi có cạnh âm.
- Thấy cạnh âm rồi kết luận chắc chắn có chu trình âm.
- Không phân biệt đồ thị có hướng và vô hướng. Một cạnh âm vô hướng tạo việc đi qua lại với tổng âm nếu mỗi hướng được xem như một cạnh.

## Câu hỏi luyện tập

1. Vì sao một đường đi ngắn nhất hữu hạn luôn có thể chọn không quá `V - 1` cạnh?
2. Sửa code để trả về một chu trình âm reachable.
3. Bài “Cheapest Flights Within K Stops” khác Bellman–Ford tại chỗ ở điểm nào?
4. Mở rộng Floyd–Warshall để dựng lại đường đi `u → v`.
5. Đánh dấu mọi cặp `(i, j)` có khoảng cách không bị chặn dưới vì chu trình âm.
6. Khi nào chạy Dijkstra từ mọi nguồn tốt hơn Floyd–Warshall?

## Checklist phỏng vấn

- [ ] Tôi hỏi rõ graph có hướng hay vô hướng, có cạnh âm không và cần một nguồn hay mọi cặp.
- [ ] Tôi phát biểu được invariant của cả hai thuật toán.
- [ ] Tôi bảo vệ phép cộng với vô cực và tràn số.
- [ ] Tôi phân biệt cạnh âm với chu trình âm.
- [ ] Tôi nêu đúng `O(VE)` và `O(V³)`.
- [ ] Tôi test graph disconnected, cạnh song song, self-loop âm và chu trình âm không reachable.
- [ ] Tôi giải thích giới hạn trước khi chọn thuật toán.

Hoàn thành checklist giúp tăng độ sẵn sàng, nhưng không thể đảm bảo tuyệt đối kết quả một cuộc phỏng vấn; đề bài, giao tiếp và tiêu chí từng công ty còn khác nhau.
