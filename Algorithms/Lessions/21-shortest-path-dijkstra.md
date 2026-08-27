# 21. Shortest Path: BFS, 0-1 BFS và Dijkstra

## Mục tiêu

- Chọn thuật toán shortest path theo loại trọng số.
- Cài Dijkstra bằng priority queue và bỏ stale entries.
- Hiểu vì sao Dijkstra không dùng được với cạnh âm.

## Bảng chọn nhanh

| Cạnh | Thuật toán |
|---|---|
| Không trọng số / cùng trọng số | BFS |
| Chỉ 0 hoặc 1 | 0-1 BFS với deque |
| Không âm | Dijkstra |
| Có cạnh âm | Bellman-Ford |
| Mọi cặp, graph nhỏ | Floyd-Warshall |

## Invariant Dijkstra

Khi `(distance,node)` nhỏ nhất hợp lệ được lấy khỏi min-heap, distance đó là tối ưu nếu mọi edge weight không âm. Relax edge `u→v` khi `dist[u]+w < dist[v]`.

## C# 12 sample: Dijkstra và 0–1 BFS

```csharp
using System;
using System.Collections.Generic;

public static class ShortestPath
{
    public readonly record struct Edge(int To, long Weight);

    public static long[] Dijkstra(IReadOnlyList<Edge>[] graph, int source)
    {
        ValidateGraph(graph, source, requireZeroOneWeights: false);
        var distance = new long[graph.Length];
        Array.Fill(distance, long.MaxValue);
        distance[source] = 0;

        var queue = new PriorityQueue<int, long>();
        queue.Enqueue(source, 0);

        while (queue.TryDequeue(out int node, out long queuedDistance))
        {
            if (queuedDistance != distance[node]) continue; // stale entry

            foreach (Edge edge in graph[node])
            {
                if (distance[node] > long.MaxValue - edge.Weight) continue;

                long candidate = distance[node] + edge.Weight;
                if (candidate >= distance[edge.To]) continue;
                distance[edge.To] = candidate;
                queue.Enqueue(edge.To, candidate);
            }
        }
        return distance;
    }

    public static long[] ZeroOneBfs(IReadOnlyList<Edge>[] graph, int source)
    {
        ValidateGraph(graph, source, requireZeroOneWeights: true);

        var distance = new long[graph.Length];
        Array.Fill(distance, long.MaxValue);
        distance[source] = 0;

        var deque = new LinkedList<(int Node, long Distance)>();
        deque.AddFirst((source, 0));

        while (deque.First is not null)
        {
            var (node, queuedDistance) = deque.First.Value;
            deque.RemoveFirst();
            if (queuedDistance != distance[node]) continue;

            foreach (Edge edge in graph[node])
            {
                long candidate = distance[node] + edge.Weight;
                if (candidate >= distance[edge.To]) continue;
                distance[edge.To] = candidate;
                var entry = (edge.To, candidate);
                if (edge.Weight == 0) deque.AddFirst(entry);
                else deque.AddLast(entry);
            }
        }
        return distance;
    }

    private static void ValidateGraph(
        IReadOnlyList<Edge>[] graph,
        int source,
        bool requireZeroOneWeights)
    {
        ArgumentNullException.ThrowIfNull(graph);
        if ((uint)source >= (uint)graph.Length)
            throw new ArgumentOutOfRangeException(nameof(source));

        for (int from = 0; from < graph.Length; from++)
        {
            if (graph[from] is null)
                throw new ArgumentException("Every adjacency list must be non-null.", nameof(graph));

            foreach (Edge edge in graph[from])
            {
                if ((uint)edge.To >= (uint)graph.Length)
                    throw new ArgumentException("Edge endpoint is outside the graph.", nameof(graph));
                if (requireZeroOneWeights && edge.Weight is not (0 or 1))
                    throw new ArgumentException("0-1 BFS requires weights 0 or 1.", nameof(graph));
                if (!requireZeroOneWeights && edge.Weight < 0)
                    throw new ArgumentException("Dijkstra requires non-negative edges.", nameof(graph));
            }
        }
    }
}
```

## Dry run

Edges `A→B=4, A→C=1, C→B=2`. Heap ban đầu `(A,0)`. Relax được `B=4,C=1`; lấy `C`, cập nhật `B=3`. Entry `(B,4)` trở thành stale và bị bỏ.

Với 0–1 BFS, edge `0` đưa candidate vào đầu deque còn edge `1` đưa vào cuối; deque vì vậy thay heap mà vẫn giữ candidate theo distance không giảm.

## Độ phức tạp

Với lazy duplicate entries như sample, Dijkstra là `O((V+E) log E)` time và `O(V+E)` memory; trên simple graph, `log E = O(log V)` nên thường được viết `O((V+E) log V)`. Indexed heap/decrease-key giữ heap theo `V`. 0–1 BFS là `O(V+E)` time với deque. Node unreachable giữ `long.MaxValue`, vì vậy contract giả định mọi distance hữu hạn nhỏ hơn `long.MaxValue`.

## Vì sao cạnh âm phá Dijkstra?

Một node tưởng đã tối ưu có thể về sau nhận đường ngắn hơn qua cạnh âm từ node chưa xử lý. Greedy choice “finalize nhỏ nhất hiện tại” không còn đúng.

## Ứng dụng thực tế

- Routing khi chi phí không âm: latency, distance, price.
- Đường đi trên game map weighted.
- Network delay và dependency cost propagation.

## Lỗi thường gặp

- Dùng `visited` cứng khiến không xử lý bản ghi stale đúng cách.
- Không dùng `long` cho tổng weight.
- Quên directed/undirected cần thêm một hay hai edge.
- Trả `long.MaxValue` mà không giải thích đó là unreachable.

## Câu hỏi phỏng vấn

1. Network Delay Time.
2. Path With Minimum Effort (minimax variant).
3. Cheapest Flights Within K Stops: vì sao Dijkstra thường cần thêm state?
4. Viết 0-1 BFS.

## Checklist

- [ ] Chọn thuật toán theo trọng số.
- [ ] Giải thích relax và stale entry.
- [ ] Nêu điều kiện non-negative.
- [ ] Xử lý overflow và unreachable.
