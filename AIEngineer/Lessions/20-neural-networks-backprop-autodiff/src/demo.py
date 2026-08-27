"""Scalar autodiff engine và một vòng train nhỏ bằng Python chuẩn."""

from __future__ import annotations

from collections.abc import Callable, Sequence


class Value:
    """Một scalar trong computational graph có hỗ trợ reverse-mode autodiff."""

    def __init__(
        self,
        data: float,
        parents: tuple["Value", ...] = (),
        backward: Callable[[], None] | None = None,
    ) -> None:
        self.data = float(data)
        self.grad = 0.0
        self.parents = parents
        self._backward = backward or (lambda: None)

    @staticmethod
    def coerce(other: "Value | float") -> "Value":
        """Chuyển số Python thành Value constant."""

        return other if isinstance(other, Value) else Value(other)

    def __add__(self, other: "Value | float") -> "Value":
        right = self.coerce(other)
        output = Value(self.data + right.data, (self, right))

        def backward() -> None:
            self.grad += output.grad
            right.grad += output.grad

        output._backward = backward
        return output

    def __radd__(self, other: "Value | float") -> "Value":
        return self + other

    def __mul__(self, other: "Value | float") -> "Value":
        right = self.coerce(other)
        output = Value(self.data * right.data, (self, right))

        def backward() -> None:
            self.grad += right.data * output.grad
            right.grad += self.data * output.grad

        output._backward = backward
        return output

    def __rmul__(self, other: "Value | float") -> "Value":
        return self * other

    def __neg__(self) -> "Value":
        return self * -1.0

    def __sub__(self, other: "Value | float") -> "Value":
        return self + (-self.coerce(other))

    def __pow__(self, exponent: int) -> "Value":
        output = Value(self.data**exponent, (self,))

        def backward() -> None:
            self.grad += exponent * (self.data ** (exponent - 1)) * output.grad

        output._backward = backward
        return output

    def backward(self) -> None:
        """Duyệt topo ngược và lan gradient từ scalar hiện tại."""

        order: list[Value] = []
        visited: set[int] = set()

        def visit(node: Value) -> None:
            if id(node) in visited:
                return
            visited.add(id(node))
            for parent in node.parents:
                visit(parent)
            order.append(node)

        visit(self)
        self.grad = 1.0
        for node in reversed(order):
            node._backward()


def mean_squared_error(predictions: Sequence[Value], targets: Sequence[float]) -> Value:
    """Tạo MSE loss trên computational graph."""

    if len(predictions) != len(targets) or not predictions:
        raise ValueError("predictions và targets phải cùng độ dài, không rỗng")
    total = sum(((prediction - target) ** 2 for prediction, target in zip(predictions, targets)), Value(0.0))
    return total * (1.0 / len(predictions))


def train_linear_model(
    samples: Sequence[tuple[float, float]], epochs: int = 120, learning_rate: float = 0.05
) -> tuple[Value, Value, list[float]]:
    """Học y = w*x + b bằng autodiff và SGD."""

    weight, bias = Value(0.0), Value(0.0)
    history: list[float] = []
    for _ in range(epochs):
        predictions = [weight * x + bias for x, _ in samples]
        loss = mean_squared_error(predictions, [y for _, y in samples])
        weight.grad = 0.0
        bias.grad = 0.0
        loss.backward()
        weight.data -= learning_rate * weight.grad
        bias.data -= learning_rate * bias.grad
        history.append(loss.data)
    return weight, bias, history


def run_demo() -> None:
    """Gradient-check đơn giản rồi train mô hình thời gian giao hàng."""

    x = Value(3.0)
    expression = x * x + 2.0 * x
    expression.backward()
    assert abs(x.grad - 8.0) < 1e-9

    samples = [(0.0, 1.0), (1.0, 3.0), (2.0, 5.0), (3.0, 7.0)]
    weight, bias, history = train_linear_model(samples)
    assert history[-1] < history[0] * 0.01
    assert abs(weight.data - 2.0) < 0.1
    assert abs(bias.data - 1.0) < 0.15
    print(f"weight={weight.data:.3f} bias={bias.data:.3f} loss={history[-1]:.6f}")
    print("PASS: autodiff backward and gradient descent")


if __name__ == "__main__":
    run_demo()
