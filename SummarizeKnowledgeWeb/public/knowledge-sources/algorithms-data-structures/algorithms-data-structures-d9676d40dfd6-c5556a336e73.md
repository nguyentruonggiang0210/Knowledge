# 18. Graph DFS/BFS và Grid

## Mục tiêu

- Biểu diễn graph bằng adjacency list và duyệt đủ graph disconnected.
- Chọn BFS cho shortest path không trọng số, DFS cho cấu trúc/component.
- Ánh xạ grid thành graph ẩn.

## Nhận diện

Objects + relationships, đường đi, kết nối, nhóm, mạng, dependency, maze/grid. Tree là graph liên thông không chu trình; graph tổng quát cần `visited`.

## BFS invariant

Khi một node được **enqueue lần đầu**, BFS đã tìm thấy nó bằng số cạnh nhỏ nhất trong graph không trọng số. Vì vậy đánh dấu visited khi enqueue, không chờ dequeue.

## C# 12 sample: multi-source BFS trên grid

```csharp
using System;
using System.Collections.Generic;

public static class GraphTraversal
{
    // 0 = ô trống, 1 = nguồn, -1 = tường. Trả khoảng cách tới nguồn gần nhất.
    public static int[,] DistancesToNearestSource(int[,] grid)
    {
        int rows = grid.GetLength(0), cols = grid.GetLength(1);
        var distance = new int[rows, cols];
        var queue = new Queue<(int Row, int Col)>();

        for (int r = 0; r < rows; r++)
        for (int c = 0; c < cols; c++)
        {
            distance[r, c] = -1;
            if (grid[r, c] == 1)
            {
                distance[r, c] = 0;
                queue.Enqueue((r, c));
            }
        }

        int[] dr = [-1, 1, 0, 0];
        int[] dc = [0, 0, -1, 1];
        while (queue.Count > 0)
        {
            var (r, c) = queue.Dequeue();
            for (int d = 0; d < 4; d++)
            {
                int nr = r + dr[d], nc = c + dc[d];
                if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
                if (grid[nr, nc] == -1 || distance[nr, nc] != -1) continue;
                distance[nr, nc] = distance[r, c] + 1;
                queue.Enqueue((nr, nc));
            }
        }
        return distance;
    }

    // Graph vô hướng: mỗi edge phải xuất hiện ở adjacency của cả hai đầu.
    public static int CountUndirectedComponents(IReadOnlyList<int>[] graph)
    {
        bool[] visited = new bool[graph.Length];
        int count = 0;
        for (int start = 0; start < graph.Length; start++)
        {
            if (visited[start]) continue;
            count++;
            var stack = new Stack<int>();
            stack.Push(start);
            visited[start] = true;
            while (stack.Count > 0)
            {
                int node = stack.Pop();
                foreach (int next in graph[node])
                    if (!visited[next]) { visited[next] = true; stack.Push(next); }
            }
        }
        return count;
    }
}
```

## Dry run

Với grid một hàng `[1,0,0,1]`, queue ban đầu chứa hai nguồn ở cột `0` và `3`, cùng distance `0`. Sau level đầu, cột `1` nhận distance `1` từ nguồn trái và cột `2` nhận distance `1` từ nguồn phải. Mỗi ô được đánh dấu ngay lúc enqueue nên không bị thêm trùng từ nguồn còn lại.

## Độ phức tạp

Adjacency list traversal: `O(V+E)` time, `O(V)` auxiliary space. Grid `R×C`: `O(RC)`. Adjacency matrix traversal thường `O(V²)`.

## BFS hay DFS?

- BFS: minimum number of edges, nearest target, level/multi-source expansion.
- DFS: connected components, cycle/structure, backtracking.
- Graph rất sâu: iterative DFS tránh stack overflow trên .NET.
- `CountUndirectedComponents` giả định adjacency đối xứng. Với directed graph phải làm rõ cần weakly connected components hay strongly connected components; hai khái niệm dùng cách xử lý khác.

## Ứng dụng thực tế

- Reachability trong network/social graph.
- Flood fill, khoảng cách tới facility gần nhất.
- Web crawl và dependency discovery.

## Lỗi thường gặp

- Chỉ duyệt từ node `0`, bỏ graph disconnected.
- Đánh dấu visited khi dequeue làm queue phình to.
- Dùng BFS thường cho cạnh có trọng số.
- Sửa grid input nhưng không nói rõ.

## Câu hỏi phỏng vấn

1. Number of Islands.
2. Rotting Oranges (multi-source BFS).
3. Clone Graph.
4. Word Ladder.

## Checklist

- [ ] Viết adjacency list cho directed/undirected graph.
- [ ] Duyệt toàn bộ component.
- [ ] Giải thích visited timing.
- [ ] Nói đúng `O(V+E)`.
