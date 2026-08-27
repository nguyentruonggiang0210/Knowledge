"""Run an idempotent ETL pipeline into an in-memory SQLite database."""

from __future__ import annotations

import sqlite3
from collections.abc import Iterable, Mapping
from dataclasses import dataclass
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP


@dataclass(frozen=True, slots=True)
class PaymentEvent:
    """Canonical payment event ready for loading."""

    event_id: str
    customer_id: str
    occurred_at: str
    amount_cents: int


def transform_event(raw: Mapping[str, str]) -> PaymentEvent:
    """Validate raw fields and normalize time plus monetary units."""
    try:
        event_id = raw["event_id"].strip()
        customer_id = raw["customer_id"].strip()
        timestamp = datetime.fromisoformat(raw["occurred_at"].replace("Z", "+00:00"))
        amount = Decimal(raw["amount"])
    except (KeyError, ValueError, InvalidOperation) as error:
        raise ValueError(f"Invalid payment event: {raw}") from error
    if not event_id or not customer_id or amount < 0:
        raise ValueError("Ids must be non-empty and amount must be non-negative")
    if timestamp.tzinfo is None:
        raise ValueError("Timestamp must include a timezone")
    cents = int((amount * 100).quantize(Decimal("1"), rounding=ROUND_HALF_UP))
    utc_text = timestamp.astimezone(timezone.utc).isoformat()
    return PaymentEvent(event_id, customer_id, utc_text, cents)


def create_schema(connection: sqlite3.Connection) -> None:
    """Create the analytical payment table."""
    connection.execute(
        """
        CREATE TABLE payments (
            event_id TEXT PRIMARY KEY,
            customer_id TEXT NOT NULL,
            occurred_at TEXT NOT NULL,
            amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0)
        )
        """
    )


def load_events(
    connection: sqlite3.Connection, events: Iterable[PaymentEvent]
) -> None:
    """Idempotently upsert canonical payment events in one transaction."""
    rows = [
        (event.event_id, event.customer_id, event.occurred_at, event.amount_cents)
        for event in events
    ]
    with connection:
        connection.executemany(
            """
            INSERT INTO payments(event_id, customer_id, occurred_at, amount_cents)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(event_id) DO UPDATE SET
                customer_id = excluded.customer_id,
                occurred_at = excluded.occurred_at,
                amount_cents = excluded.amount_cents
            """,
            rows,
        )


def revenue_by_utc_day(connection: sqlite3.Connection) -> list[tuple[str, int]]:
    """Aggregate revenue cents by canonical UTC day."""
    cursor = connection.execute(
        """
        SELECT substr(occurred_at, 1, 10) AS utc_day, SUM(amount_cents)
        FROM payments
        GROUP BY utc_day
        ORDER BY utc_day
        """
    )
    return [(str(day), int(total)) for day, total in cursor.fetchall()]


def main() -> None:
    """Transform, retry-load, query, and self-check a payment batch."""
    raw_events = [
        {
            "event_id": "evt-1",
            "customer_id": "c-1",
            "occurred_at": "2026-08-27T23:30:00+07:00",
            "amount": "12.50",
        },
        {
            "event_id": "evt-2",
            "customer_id": "c-2",
            "occurred_at": "2026-08-27T18:00:00Z",
            "amount": "7.25",
        },
    ]
    events = [transform_event(raw) for raw in raw_events]
    connection = sqlite3.connect(":memory:")
    try:
        create_schema(connection)
        load_events(connection, events)
        load_events(connection, events)
        row_count = connection.execute("SELECT COUNT(*) FROM payments").fetchone()[0]
        revenue = revenue_by_utc_day(connection)
        assert row_count == 2
        assert revenue == [("2026-08-27", 1_975)]
        print("Events after retry:", row_count)
        print("Revenue by UTC day (cents):", revenue)
        print("Self-check: OK")
    finally:
        connection.close()


if __name__ == "__main__":
    main()
