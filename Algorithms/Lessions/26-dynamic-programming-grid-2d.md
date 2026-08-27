# 26. Dynamic Programming trên Grid 2D

## Mục tiêu

Sau bài này, bạn có thể:

- Thiết kế state DP theo ô `(row, column)`.
- Chọn đúng hướng duyệt dựa trên dependency.
- Phân biệt grid DP với BFS, Dijkstra và backtracking.
- Nén bảng `O(rows × columns)` xuống một hàng `O(columns)` khi phù hợp.

## Nhận diện bài toán

Grid DP thường xuất hiện khi:

- Trạng thái là một ô hoặc một cặp chỉ số.
- Chuyển động có hướng đơn điệu, ví dụ chỉ đi sang phải và xuống dưới.
- Cần đếm số cách, tìm tổng nhỏ nhất/lớn nhất hoặc kiểm tra khả năng đến ô.
- Dependency tạo thành DAG: mỗi state chỉ phụ thuộc vào state “trước” nó.

Nếu được đi tùy ý bốn hướng, có chu trình hoặc trọng số cạnh tổng quát, đừng mặc định dùng DP. Bài có thể cần BFS, 0-1 BFS hoặc Dijkstra.

## Bài mẫu: Minimum Path Sum

Cho ma trận chữ nhật, đi từ góc trên trái đến góc dưới phải, mỗi bước chỉ sang phải hoặc xuống dưới. Chi phí đường đi là tổng giá trị các ô đã đi qua.

### State đầy đủ

`dp[r, c]` là tổng nhỏ nhất để đến ô `(r, c)`.

### Transition

`dp[r, c] = grid[r, c] + min(dp[r - 1, c], dp[r, c - 1])`.

Các vị trí ngoài grid được coi là vô cực. Riêng trước ô `(0,0)`, ta đặt một “đường vào” có chi phí `0`.

## Invariant khi nén còn một hàng

Khi đang xử lý ô `(r, c)`:

- `dp[c]` trước khi cập nhật là chi phí từ phía trên: `(r - 1, c)`.
- `dp[c - 1]` sau khi cập nhật là chi phí từ bên trái: `(r, c - 1)`.
- Sau cập nhật, `dp[c]` là chi phí tối ưu đến `(r, c)`.

Điều này giải thích vì sao phải duyệt cột từ trái sang phải. Duyệt ngược sẽ đọc dependency sai hàng.

## Các bước

1. Xác nhận grid không rỗng và có dạng chữ nhật.
2. Viết state và các hướng có thể đi vào một ô.
3. Chọn base case tại ô bắt đầu.
4. Duyệt theo topological order của dependency: trên xuống, trái sang phải.
5. Với mỗi ô, lấy min từ trên và trái rồi cộng chi phí hiện tại.
6. Nếu cần dựng đường đi, lưu parent hoặc bảng đầy đủ.

## Dry run

Grid:

```text
1 3 1
1 5 1
4 2 1
```

Trạng thái mảng `dp` sau mỗi hàng:

| Hàng vừa xử lý | `dp` | Ý nghĩa |
|---:|---|---|
| 0 | `[1,4,5]` | Chỉ có thể đi từ trái sang |
| 1 | `[2,7,6]` | Ô cuối lấy min giữa `7` và `5` rồi cộng `1` |
| 2 | `[6,8,7]` | Đáp án cuối là `7` |

Một đường tối ưu có giá trị `1 → 3 → 1 → 1 → 1`.

## C# 12 sample độc lập

Mẫu hỗ trợ cả giá trị âm vì graph chuyển động chỉ sang phải/xuống là DAG, nhưng tổng phải vừa trong `long`.

```csharp
using System;

public static class GridDynamicProgramming
{
    private const long Infinity = long.MaxValue / 4;

    public static long MinPathSum(int[][] grid)
    {
        ArgumentNullException.ThrowIfNull(grid);
        if (grid.Length == 0 ||
            grid[0] is null ||
            grid[0].Length == 0)
        {
            throw new ArgumentException("Grid phải không rỗng.");
        }

        int columns = grid[0].Length;
        foreach (int[] row in grid)
        {
            if (row is null || row.Length != columns)
            {
                throw new ArgumentException(
                    "Grid phải là ma trận chữ nhật.");
            }
        }

        var dp = new long[columns];
        Array.Fill(dp, Infinity);
        dp[0] = 0;

        for (int row = 0; row < grid.Length; row++)
        {
            for (int column = 0; column < columns; column++)
            {
                long fromTop = dp[column];
                long fromLeft =
                    column == 0 ? Infinity : dp[column - 1];

                long bestPrevious = Math.Min(fromTop, fromLeft);
                dp[column] = checked(
                    bestPrevious + grid[row][column]);
            }
        }

        return dp[columns - 1];
    }
}

public static class Program
{
    public static void Main()
    {
        int[][] grid =
        [
            [1, 3, 1],
            [1, 5, 1],
            [4, 2, 1]
        ];

        Console.WriteLine(
            GridDynamicProgramming.MinPathSum(grid)); // 7
    }
}
```

## Độ phức tạp

Với `R` hàng và `C` cột:

- Thời gian: `O(RC)` vì mỗi ô được xử lý một lần.
- Bộ nhớ phụ: `O(C)`.
- Nếu cần lưu toàn bộ bảng hoặc parent để dựng đường: `O(RC)`.

Nếu `C > R` và bài toán cho phép hoán đổi cách duyệt tương đương, có thể nén theo chiều nhỏ hơn. Với semantics hướng cụ thể, không được tự ý transpose mà không kiểm tra.

## Grid DP, BFS hay Dijkstra?

| Đặc điểm | Công cụ thường phù hợp |
|---|---|
| Chỉ đi phải/xuống, dependency không chu trình | DP |
| Mọi bước cùng chi phí, đi nhiều hướng | BFS |
| Trọng số không âm, đi nhiều hướng | Dijkstra |
| Cạnh chỉ có trọng số 0 hoặc 1 | 0-1 BFS |
| Liệt kê mọi đường hoặc constraint rất nhỏ | Backtracking |

## Giới hạn và biến thể

- Sample không xử lý ô bị chặn. Với obstacle, phải biểu diễn state unreachable và không cộng vào vô cực.
- Chuyển động chỉ sang phải/xuống. Nếu cho quay lại, recurrence hiện tại không còn đúng.
- Nén một hàng làm mất thông tin để dựng đường; cần parent hoặc tái tính có chủ đích.
- Ma trận jagged không hợp lệ với bài mẫu và được từ chối.
- Khi có số âm nhưng graph là DAG, DP vẫn đúng. Khi được đi vòng, chu trình âm làm bài shortest path thay đổi bản chất.
- Số đường đi có thể vượt `long`; bài đếm thường yêu cầu modulo hoặc số nguyên lớn.

## Ứng dụng thực tế

- Lập kế hoạch trên pipeline hai chiều đơn điệu, ví dụ qua các giai đoạn và mốc thời gian.
- Căn chỉnh dữ liệu, xử lý ảnh và phân đoạn thường dùng DP 2D với transition phức tạp hơn.
- Tìm seam chi phí thấp trong ảnh là một biến thể DAG-grid.
- Ước lượng đường chi phí thấp trong dây chuyền mà chỉ cho phép tiến sang giai đoạn tiếp theo.

Không nên dùng mô hình phải/xuống để mô tả navigation tổng quát nếu hệ thống thực tế cho phép quay lại.

## Lỗi thường gặp

- Không định nghĩa rõ `dp[r,c]` là chi phí “đến” hay “từ” ô đó.
- Duyệt sai hướng so với dependency.
- Khởi tạo cả hàng/cột bằng `0`, tạo đường giả miễn phí.
- Cộng vào giá trị vô cực và gây tràn số.
- Dùng `int` khi path sum có thể lớn.
- Nén state nhưng cập nhật sai thứ tự.
- Áp dụng DP cho graph bốn hướng có chu trình.
- Không kiểm tra grid rỗng hoặc các hàng khác độ dài.

## Câu hỏi luyện tập

1. Sửa sample để có obstacle và trả về `null` nếu không đến được đích.
2. Giải Unique Paths và giải thích khi nào kết quả tràn số.
3. Mở rộng sample để dựng lại một đường tối ưu.
4. Thiết kế state cho Maximal Square.
5. Vì sao Dungeon Game thường phải duyệt từ dưới phải lên trên trái?
6. Với chuyển động bốn hướng và chi phí ô không âm, hãy chuyển mô hình sang Dijkstra.

## Checklist phỏng vấn

- [ ] Tôi định nghĩa state, transition và base case rõ ràng.
- [ ] Tôi vẽ hướng dependency trước khi chọn thứ tự duyệt.
- [ ] Tôi giải thích được invariant của mảng một chiều.
- [ ] Tôi phân biệt grid DP với BFS/Dijkstra.
- [ ] Tôi không cộng vào vô cực và kiểm soát overflow.
- [ ] Tôi biết nén state làm mất khả năng reconstruct trực tiếp.
- [ ] Tôi test `1×1`, một hàng, một cột, giá trị âm và grid không hợp lệ.

Hoàn thành bài này tăng khả năng xử lý một nhóm câu hỏi DP, nhưng không phải cam kết chắc chắn về điểm số hay kết quả phỏng vấn.

