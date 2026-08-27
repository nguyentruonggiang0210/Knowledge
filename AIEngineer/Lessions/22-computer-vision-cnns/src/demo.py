"""Convolution, ReLU và max-pooling 2D bằng Python standard library."""

from __future__ import annotations

from collections.abc import Sequence

Matrix = list[list[float]]


def valid_convolution(image: Sequence[Sequence[float]], kernel: Sequence[Sequence[float]]) -> Matrix:
    """Tính cross-correlation 2D kiểu valid (cách framework thường gọi convolution)."""

    if not image or not kernel or not image[0] or not kernel[0]:
        raise ValueError("image và kernel không được rỗng")
    image_width = len(image[0])
    kernel_width = len(kernel[0])
    if any(len(row) != image_width for row in image) or any(
        len(row) != kernel_width for row in kernel
    ):
        raise ValueError("Mỗi matrix phải hình chữ nhật")
    output_height = len(image) - len(kernel) + 1
    output_width = image_width - kernel_width + 1
    if output_height < 1 or output_width < 1:
        raise ValueError("kernel không được lớn hơn image")
    return [
        [
            sum(
                image[top + row][left + column] * kernel[row][column]
                for row in range(len(kernel))
                for column in range(kernel_width)
            )
            for left in range(output_width)
        ]
        for top in range(output_height)
    ]


def relu(feature_map: Sequence[Sequence[float]]) -> Matrix:
    """Áp dụng ReLU theo từng pixel activation."""

    return [[max(0.0, value) for value in row] for row in feature_map]


def max_pool2d(feature_map: Sequence[Sequence[float]], size: int = 2) -> Matrix:
    """Max-pool các ô không overlap; phần dư ở biên bị bỏ."""

    if size < 1 or len(feature_map) < size or len(feature_map[0]) < size:
        raise ValueError("pool size không hợp lệ")
    height = len(feature_map) // size
    width = len(feature_map[0]) // size
    return [
        [
            max(
                feature_map[top + row][left + column]
                for row in range(size)
                for column in range(size)
            )
            for left in range(0, width * size, size)
        ]
        for top in range(0, height * size, size)
    ]


def run_demo() -> None:
    """Phát hiện biên đứng giống vết nứt trên ảnh xám nhỏ."""

    image: Matrix = [
        [0, 0, 0, 1, 1, 1],
        [0, 0, 0, 1, 1, 1],
        [0, 0, 0, 1, 1, 1],
        [0, 0, 0, 1, 1, 1],
        [0, 0, 0, 1, 1, 1],
        [0, 0, 0, 1, 1, 1],
    ]
    vertical_edge_kernel: Matrix = [
        [-1, 0, 1],
        [-1, 0, 1],
        [-1, 0, 1],
    ]
    feature_map = valid_convolution(image, vertical_edge_kernel)
    activated = relu(feature_map)
    pooled = max_pool2d(activated, size=2)
    flat_image: Matrix = [[1, 1, 1], [1, 1, 1], [1, 1, 1]]
    flat_response = valid_convolution(flat_image, vertical_edge_kernel)

    assert len(feature_map) == 4 and len(feature_map[0]) == 4
    assert max(max(row) for row in activated) == 3
    assert max(max(row) for row in flat_response) == 0
    assert len(pooled) == 2 and len(pooled[0]) == 2
    print(f"feature_map={feature_map}")
    print(f"pooled={pooled}")
    print("PASS: convolution edge detection and max pooling")


if __name__ == "__main__":
    run_demo()
