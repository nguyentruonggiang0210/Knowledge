# 19. Topological Sort

## Mục tiêu

- Sắp thứ tự dependency trong Directed Acyclic Graph (DAG).
- Phát hiện cycle bằng Kahn hoặc DFS 3 màu.
- Biết topological order có thể không duy nhất.

## Dấu hiệu nhận diện

Các câu “A phải trước B”, course prerequisites, build/package dependency, alien dictionary hoặc scheduling có precedence. Topological sort chỉ tồn tại khi directed graph không có cycle.

## Kahn's algorithm

1. Tính indegree của mọi node.
2. Enqueue mọi node indegree `0`.
3. Lấy node khỏi queue, thêm vào order, giảm indegree các neighbor.
4. Nếu số node đã lấy `< V`, graph có cycle.

Invariant: queue chỉ chứa node mà mọi prerequisite đã được xử lý.

## C# 12 sample

```csharp
using System;
using System.Collections.Generic;

public static class TopologicalSort
{
    // Edge (before, after): before phải xuất hiện trước after.
    public static int[] Order(int nodeCount, IEnumerable<(int Before, int After)> edges)
    {
        var graph = new List<int>[nodeCount];
        var indegree = new int[nodeCount];
        for (int i = 0; i < nodeCount; i++) graph[i] = new List<int>();

        foreach (var (before, after) in edges)
        {
            graph[before].Add(after);
            indegree[after]++;
        }

        var queue = new Queue<int>();
        for (int i = 0; i < nodeCount; i++)
            if (indegree[i] == 0) queue.Enqueue(i);

        var answer = new int[nodeCount];
        int write = 0;
        while (queue.Count > 0)
        {
            int node = queue.Dequeue();
            answer[write++] = node;
            foreach (int next in graph[node])
                if (--indegree[next] == 0) queue.Enqueue(next);
        }

        return write == nodeCount ? answer : Array.Empty<int>();
    }
}
```

## Dry run

Edges `0→2, 1→2, 2→3`: indegree `[0,0,2,1]`; queue ban đầu `[0,1]`. Sau khi xử lý cả `0,1`, indegree của `2` thành 0; order hợp lệ là `[0,1,2,3]` hoặc `[1,0,2,3]`.

## Độ phức tạp

`O(V+E)` time và `O(V+E)` memory cho adjacency list, indegree, queue và output.

## Follow-up quan trọng

- Muốn order nhỏ nhất theo từ điển: thay queue bằng min-heap.
- Muốn biết order có duy nhất: ở mỗi bước Kahn, queue phải có đúng một node.
- Duplicate edge có thể tăng indegree hai lần; normalize nếu semantics coi chúng là một.

## Ứng dụng thực tế

- Build system, migration ordering, package manager.
- Lập lịch pipeline và course prerequisites.
- Evaluate spreadsheet/formula dependencies.

## Lỗi thường gặp

- Dùng cho undirected graph.
- Trả partial order dù có cycle.
- Đảo hướng edge do hiểu sai prerequisite.
- Cho rằng chỉ có một kết quả.

## Câu hỏi phỏng vấn

1. Course Schedule I/II.
2. Alien Dictionary.
3. Parallel Courses.
4. Minimum Height Trees không phải topo DAG; giải thích khác biệt.

## Checklist

- [ ] Diễn giải đúng hướng edge.
- [ ] Code Kahn và detect cycle.
- [ ] Biết DFS 3 màu là phương án khác.
- [ ] Xử lý node cô lập.

