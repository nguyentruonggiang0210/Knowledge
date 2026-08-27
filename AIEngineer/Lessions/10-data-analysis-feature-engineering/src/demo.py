"""Build leakage-safe customer features at an explicit prediction cutoff."""

from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass
from datetime import datetime
from statistics import mean


@dataclass(frozen=True, slots=True)
class Transaction:
    """One timestamped customer transaction."""

    customer_id: str
    occurred_at: datetime
    amount: float


def usable_transactions(
    transactions: Iterable[Transaction],
    customer_id: str,
    cutoff: datetime,
) -> list[Transaction]:
    """Filter one customer's non-negative transactions available by cutoff."""
    selected: list[Transaction] = []
    for transaction in transactions:
        if transaction.amount < 0:
            raise ValueError("Transaction amount cannot be negative")
        if transaction.customer_id == customer_id and transaction.occurred_at <= cutoff:
            selected.append(transaction)
    return sorted(selected, key=lambda item: item.occurred_at)


def customer_features(
    transactions: Iterable[Transaction],
    customer_id: str,
    cutoff: datetime,
) -> dict[str, float]:
    """Create point-in-time-correct frequency, monetary, and recency features."""
    history = usable_transactions(transactions, customer_id, cutoff)
    if not history:
        return {
            "transaction_count": 0.0,
            "total_amount": 0.0,
            "average_amount": 0.0,
            "recency_days": 9_999.0,
        }
    amounts = [transaction.amount for transaction in history]
    recency = (cutoff - history[-1].occurred_at).total_seconds() / 86_400
    return {
        "transaction_count": float(len(history)),
        "total_amount": sum(amounts),
        "average_amount": mean(amounts),
        "recency_days": recency,
    }


def min_max_scale(value: float, minimum: float, maximum: float) -> float:
    """Scale a value to [0, 1] using training-set bounds."""
    if maximum <= minimum:
        raise ValueError("maximum must be greater than minimum")
    return (value - minimum) / (maximum - minimum)


def main() -> None:
    """Build churn features while proving a future event is excluded."""
    cutoff = datetime.fromisoformat("2026-08-01T00:00:00")
    transactions = [
        Transaction("c-1", datetime.fromisoformat("2026-07-01T00:00:00"), 20.0),
        Transaction("c-1", datetime.fromisoformat("2026-07-30T00:00:00"), 40.0),
        Transaction("c-1", datetime.fromisoformat("2026-08-03T00:00:00"), 10_000.0),
        Transaction("c-2", datetime.fromisoformat("2026-07-20T00:00:00"), 15.0),
    ]
    features = customer_features(transactions, "c-1", cutoff)
    scaled_total = min_max_scale(features["total_amount"], 0.0, 100.0)

    assert features["transaction_count"] == 2.0
    assert features["total_amount"] == 60.0
    assert features["recency_days"] == 2.0
    assert scaled_total == 0.6
    print("Features at cutoff:", features)
    print("Scaled total amount:", scaled_total)
    print("The future 10,000 transaction was excluded.")
    print("Self-check: OK")


if __name__ == "__main__":
    main()
