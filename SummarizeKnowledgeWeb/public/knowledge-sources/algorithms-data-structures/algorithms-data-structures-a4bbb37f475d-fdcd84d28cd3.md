# 13. Backtracking

## Mục tiêu

- Sinh permutation, combination và giải constraint search.
- Viết đúng bộ khung choose → explore → unchoose.
- Prune sớm và xử lý duplicate có hệ thống.

## Dấu hiệu nhận diện

Đề yêu cầu “liệt kê tất cả”, “tìm mọi cách”, “xếp/đặt sao cho thỏa điều kiện”, hoặc input nhỏ nhưng không gian đáp án theo cấp số nhân/giai thừa.

## Cây quyết định

Mỗi node là một partial solution; mỗi cạnh là một lựa chọn. Backtracking là DFS trên cây ẩn:

1. Nếu partial solution hoàn chỉnh, ghi nhận bản sao.
2. Duyệt các lựa chọn hợp lệ.
3. Chọn, đi sâu, rồi hoàn tác chính xác.

## C# 12 sample: Combination Sum không lặp đáp án

```csharp
using System;
using System.Collections.Generic;

public static class BacktrackingAlgorithms
{
    public static IList<IList<int>> CombinationSum(int[] candidates, int target)
    {
        ArgumentNullException.ThrowIfNull(candidates);
        foreach (int value in candidates)
            if (value <= 0)
                throw new ArgumentException("Candidates must be positive.", nameof(candidates));
        int[] sorted = (int[])candidates.Clone(); // Không mutate input của caller.
        Array.Sort(sorted);
        var answer = new List<IList<int>>();
        Search(0, target, new List<int>());
        return answer;

        void Search(int start, int remaining, List<int> path)
        {
            if (remaining == 0)
            {
                answer.Add(path.ToArray()); // Phải snapshot, không giữ cùng List.
                return;
            }

            for (int i = start; i < sorted.Length; i++)
            {
                if (i > start && sorted[i] == sorted[i - 1]) continue;
                int value = sorted[i];
                if (value > remaining) break;

                path.Add(value);
                Search(i, remaining - value, path); // i: được tái sử dụng.
                path.RemoveAt(path.Count - 1);
            }
        }
    }
}
```

## Dry run

`candidates=[2,3,6,7], target=7`: nhánh `2→2→2` dừng vì còn `1`; nhánh `2→2→3` tạo `[2,2,3]`; nhánh `7` tạo `[7]`. Sort cho phép `break` khi candidate lớn hơn phần còn lại.

## Độ phức tạp

Thường là exponential; phải mô tả theo cây tìm kiếm và kích thước output. Với permutation: `O(n·n!)` để xuất toàn bộ, stack/path `O(n)` chưa tính output.

## Kỹ thuật prune

- Sort để dừng sớm và bỏ duplicate cùng tầng.
- Dùng bitmask/boolean array cho lựa chọn đã dùng.
- Kiểm tra constraint ngay khi thêm thay vì chờ leaf.
- Chọn biến bị ràng buộc nhất trước (N-Queens/Sudoku).

## Ứng dụng thực tế

- Constraint solver, lập lịch quy mô nhỏ.
- Puzzle/Sudoku, cấu hình sản phẩm hợp lệ.
- Tìm test combinations và routing khi search space nhỏ.

## Lỗi thường gặp

- Quên undo state hoặc undo sai thứ tự.
- Thêm `path` thay vì bản sao của nó.
- Nhầm `Search(i,...)` với `Search(i+1,...)`.
- Bỏ duplicate sai: duplicate cùng tầng khác duplicate giữa các tầng.

## Câu hỏi phỏng vấn

1. Subsets II, Permutations II.
2. N-Queens.
3. Word Search trên grid.
4. Restore IP Addresses.

## Checklist

- [ ] Vẽ được 2–3 tầng decision tree.
- [ ] Nói rõ state, choices, constraints, goal.
- [ ] Code choose/explore/unchoose không lỗi.
- [ ] Giải thích upper bound complexity trung thực.
