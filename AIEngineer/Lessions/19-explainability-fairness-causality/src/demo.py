"""Các phép đo explainability, fairness và causal effect tối giản."""

from __future__ import annotations

from collections.abc import Callable, Mapping, Sequence

Record = dict[str, float]


def accuracy(model: Callable[[Mapping[str, float]], int], rows: Sequence[Record], labels: Sequence[int]) -> float:
    """Tính accuracy cho một model nhị phân."""

    if len(rows) != len(labels) or not rows:
        raise ValueError("rows và labels phải cùng độ dài, không rỗng")
    return sum(model(row) == label for row, label in zip(rows, labels)) / len(rows)


def permutation_importance(
    model: Callable[[Mapping[str, float]], int],
    rows: Sequence[Record],
    labels: Sequence[int],
    feature: str,
) -> float:
    """Đảo vòng một feature và trả mức accuracy bị giảm."""

    baseline = accuracy(model, rows, labels)
    values = [row[feature] for row in rows]
    shifted = values[1:] + values[:1]
    permuted = [{**row, feature: value} for row, value in zip(rows, shifted)]
    return baseline - accuracy(model, permuted, labels)


def group_positive_rates(
    decisions: Sequence[int], groups: Sequence[str]
) -> dict[str, float]:
    """Tính tỷ lệ quyết định dương theo group."""

    if len(decisions) != len(groups):
        raise ValueError("decisions và groups phải cùng độ dài")
    output: dict[str, float] = {}
    for group in sorted(set(groups)):
        group_decisions = [value for value, current in zip(decisions, groups) if current == group]
        output[group] = sum(group_decisions) / len(group_decisions)
    return output


def demographic_parity_gap(decisions: Sequence[int], groups: Sequence[str]) -> float:
    """Trả chênh lệch lớn nhất giữa positive rates của các group."""

    rates = list(group_positive_rates(decisions, groups).values())
    return max(rates) - min(rates) if rates else 0.0


def equal_opportunity_gap(
    predictions: Sequence[int], labels: Sequence[int], groups: Sequence[str]
) -> float:
    """Trả chênh lệch true-positive rate giữa các group."""

    rates: list[float] = []
    for group in sorted(set(groups)):
        positives = [
            prediction
            for prediction, label, current in zip(predictions, labels, groups)
            if current == group and label == 1
        ]
        if positives:
            rates.append(sum(positives) / len(positives))
    return max(rates) - min(rates) if rates else 0.0


def difference_in_differences(
    treatment_before: float,
    treatment_after: float,
    control_before: float,
    control_after: float,
) -> float:
    """Ước lượng effect bằng thay đổi treatment trừ thay đổi control."""

    return (treatment_after - treatment_before) - (control_after - control_before)


def run_demo() -> None:
    """Audit một policy vay giả lập và chương trình tư vấn."""

    rows = [
        {"income": 0.9, "debt": 0.1},
        {"income": 0.2, "debt": 0.8},
        {"income": 0.8, "debt": 0.2},
        {"income": 0.3, "debt": 0.7},
    ]
    labels = [1, 0, 1, 0]

    def loan_model(row: Mapping[str, float]) -> int:
        return int(row["income"] - row["debt"] > 0.2)

    income_importance = permutation_importance(loan_model, rows, labels, "income")
    assert income_importance > 0

    groups = ["A", "A", "A", "A", "B", "B", "B", "B"]
    decisions = [1, 1, 1, 0, 1, 0, 0, 0]
    fairness_gap = demographic_parity_gap(decisions, groups)
    assert fairness_gap == 0.5
    opportunity_gap = equal_opportunity_gap(
        predictions=[1, 1, 0, 0, 1, 0, 0, 0],
        labels=[1, 1, 1, 0, 1, 1, 0, 0],
        groups=groups,
    )
    assert 0.0 <= opportunity_gap <= 1.0

    estimated_effect = difference_in_differences(100, 120, 100, 105)
    assert estimated_effect == 15
    print(f"income_permutation_importance={income_importance:.2f}")
    print(f"demographic_parity_gap={fairness_gap:.2f} equal_opportunity_gap={opportunity_gap:.2f}")
    print(f"difference_in_differences={estimated_effect:.1f}")
    print("PASS: explanation, fairness, and causal estimate")


if __name__ == "__main__":
    run_demo()
