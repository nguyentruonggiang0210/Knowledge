# 14. Binary Tree: DFS và BFS

## Mục tiêu

- Thành thạo preorder, inorder, postorder và level-order.
- Chọn recursive DFS, iterative DFS hay BFS theo yêu cầu.
- Trả lời các bài depth, path, ancestor và serialize tree.

## Chọn traversal

- **Preorder (node-left-right):** copy/serialize, truyền trạng thái từ cha xuống.
- **Inorder (left-node-right):** thứ tự tăng dần trên BST.
- **Postorder (left-right-node):** tính kết quả từ con lên cha.
- **BFS:** theo level, shortest edge count trên cây.

## C# 12 sample: level order và maximum path sum

```csharp
using System;
using System.Collections.Generic;

public sealed class TreeNode
{
    public int Value { get; }
    public TreeNode? Left { get; set; }
    public TreeNode? Right { get; set; }
    public TreeNode(int value) => Value = value;
}

public static class BinaryTreeAlgorithms
{
    public static IList<IList<int>> LevelOrder(TreeNode? root)
    {
        var answer = new List<IList<int>>();
        if (root is null) return answer;

        var queue = new Queue<TreeNode>();
        queue.Enqueue(root);
        while (queue.Count > 0)
        {
            int levelSize = queue.Count;
            var level = new List<int>(levelSize);
            for (int i = 0; i < levelSize; i++)
            {
                TreeNode node = queue.Dequeue();
                level.Add(node.Value);
                if (node.Left is not null) queue.Enqueue(node.Left);
                if (node.Right is not null) queue.Enqueue(node.Right);
            }
            answer.Add(level);
        }
        return answer;
    }

    public static long MaxPathSum(TreeNode root)
    {
        long best = long.MinValue;
        Gain(root);
        return best;

        long Gain(TreeNode? node)
        {
            if (node is null) return 0;
            long left = Math.Max(0L, Gain(node.Left));
            long right = Math.Max(0L, Gain(node.Right));
            best = Math.Max(best, node.Value + left + right);
            return node.Value + Math.Max(left, right);
        }
    }
}
```

## Điểm phỏng vấn quan trọng

Trong `MaxPathSum`, giá trị trả về cho cha chỉ được chọn **một** nhánh, còn ứng viên global answer tại node có thể dùng cả hai nhánh. Đây là mẫu “return one thing, update another”.

## Độ phức tạp

Cả hai sample thăm mỗi node một lần: `O(n)`. DFS stack `O(h)`; BFS queue tối đa `O(w)` với `h` là chiều cao và `w` là độ rộng lớn nhất.

## Dry run

Với cây `[-10,9,20,null,null,15,7]`, tại node `20`, hai gain là `15` và `7`, nên global candidate là `42`; gain trả lên là `35`.

## Ứng dụng thực tế

- DOM/AST traversal, file hierarchy.
- Expression evaluation bằng postorder.
- Permission inheritance và organization tree.

## Lỗi thường gặp

- Quên root `null`.
- Dùng biến global mà không reset giữa các test.
- Enqueue `null` không kiểm soát.
- Nhầm node count, edge count và số level khi tính depth.

## Câu hỏi phỏng vấn

1. Lowest Common Ancestor.
2. Diameter of Binary Tree.
3. Serialize/Deserialize Binary Tree.
4. Binary Tree Right Side View.

## Checklist

- [ ] Code đủ 4 traversal không nhìn tài liệu.
- [ ] Giải thích `O(h)` stack và worst case `O(n)`.
- [ ] Nhận ra postorder cho bài tổng hợp từ con.
- [ ] Test cây rỗng, một node, lệch trái/phải.
