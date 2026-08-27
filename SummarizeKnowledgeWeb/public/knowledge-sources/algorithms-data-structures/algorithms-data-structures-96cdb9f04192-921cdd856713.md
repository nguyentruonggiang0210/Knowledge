# 15. Binary Search Tree (BST)

## Mục tiêu

- Dùng invariant BST để search/insert/delete.
- Khai thác inorder để có thứ tự tăng dần.
- Validate BST đúng bằng bound, không chỉ so với cha.

## Invariant

Trong phiên bản không chứa duplicate: mọi giá trị ở cây con trái `< node`, mọi giá trị ở cây con phải `> node`. Nếu đề cho phép duplicate, phải chốt duplicate thuộc bên nào.

## C# 12 sample: validate và kth smallest

```csharp
using System.Collections.Generic;

public sealed class BstNode
{
    public int Value { get; }
    public BstNode? Left { get; set; }
    public BstNode? Right { get; set; }
    public BstNode(int value) => Value = value;
}

public static class BstAlgorithms
{
    public static bool IsValid(BstNode? root) => Check(root, null, null);

    private static bool Check(BstNode? node, long? lower, long? upper)
    {
        if (node is null) return true;
        if (lower.HasValue && node.Value <= lower.Value) return false;
        if (upper.HasValue && node.Value >= upper.Value) return false;
        return Check(node.Left, lower, node.Value)
            && Check(node.Right, node.Value, upper);
    }

    public static int KthSmallest(BstNode root, int k)
    {
        var stack = new Stack<BstNode>();
        BstNode? current = root;

        while (current is not null || stack.Count > 0)
        {
            while (current is not null)
            {
                stack.Push(current);
                current = current.Left;
            }

            current = stack.Pop();
            if (--k == 0) return current.Value;
            current = current.Right;
        }

        throw new System.ArgumentOutOfRangeException(nameof(k));
    }
}
```

## Vì sao so với cha là sai?

Cây có root `10`, con trái `5`, và con phải của `5` là `12`. `12 > 5` nhưng vẫn sai vì toàn bộ cây con trái của `10` phải `< 10`. Bounds mang constraint từ mọi ancestor xuống.

## Dry run

Với cây `5 / 3,7 / 2,4,6,8`, inorder iterative lần lượt push `5,3,2`; pop `2` là phần tử thứ nhất, pop `3` là thứ hai, rồi pop `4` là thứ ba. Vì vậy `KthSmallest(root, 3)` trả `4`. Khi validate, node `4` nhận bounds `(3,5)`, còn node `6` nhận `(5,7)`; constraint từ mọi ancestor luôn được giữ.

## Độ phức tạp

- Search/insert/delete: trung bình `O(log n)` nếu cân bằng, worst case `O(n)`.
- Validate: `O(n)`, stack `O(h)`.
- Kth smallest: `O(h+k)` nhờ dừng sớm; stack `O(h)`.

## Ứng dụng thực tế

- Ordered set/map, range query và predecessor/successor.
- Index trong bộ nhớ khi cần duy trì thứ tự động.
- Các biến thể balanced tree như red-black tree đứng sau nhiều thư viện chuẩn.

## Lỗi thường gặp

- Dùng `int.MinValue/MaxValue` làm sentinel rồi lỗi tại biên; dùng nullable `long`.
- Cho rằng BST luôn cân bằng.
- Delete node hai con nhưng quên nối lại successor.
- Không xác định policy duplicate.

## Câu hỏi phỏng vấn

1. Lowest Common Ancestor of a BST.
2. Convert Sorted Array to Balanced BST.
3. Delete Node in a BST.
4. BST Iterator với `O(h)` memory.

## Checklist

- [ ] Validate bằng lower/upper bound.
- [ ] Biết inorder iterative.
- [ ] Trình bày ba trường hợp delete.
- [ ] Phân biệt BST thường và self-balancing BST.
