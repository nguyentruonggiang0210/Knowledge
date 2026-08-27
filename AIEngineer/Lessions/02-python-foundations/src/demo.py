"""Prioritize support tickets with core Python data structures."""

from __future__ import annotations

import csv
from dataclasses import dataclass
from io import StringIO
from typing import Final

SEVERITY_WEIGHT: Final[dict[str, int]] = {
    "low": 1,
    "medium": 3,
    "high": 6,
    "critical": 10,
}


@dataclass(frozen=True, slots=True)
class Ticket:
    """A validated customer-support ticket."""

    ticket_id: str
    severity: str
    waiting_hours: int
    vip_customer: bool


def parse_ticket(line: str) -> Ticket:
    """Parse one CSV ticket: id,severity,waiting_hours,vip."""
    rows = list(csv.reader(StringIO(line)))
    if len(rows) != 1 or len(rows[0]) != 4:
        raise ValueError("Expected four CSV fields")
    ticket_id, severity, waiting_text, vip_text = (part.strip() for part in rows[0])
    if not ticket_id or severity not in SEVERITY_WEIGHT:
        raise ValueError("Invalid ticket id or severity")
    try:
        waiting_hours = int(waiting_text)
    except ValueError as error:
        raise ValueError("waiting_hours must be an integer") from error
    if waiting_hours < 0 or vip_text.lower() not in {"true", "false"}:
        raise ValueError("Invalid waiting time or VIP flag")
    return Ticket(ticket_id, severity, waiting_hours, vip_text.lower() == "true")


def priority_score(ticket: Ticket) -> int:
    """Compute a transparent priority score for a ticket."""
    age_points = min(ticket.waiting_hours // 4, 6)
    vip_points = 4 if ticket.vip_customer else 0
    return SEVERITY_WEIGHT[ticket.severity] + age_points + vip_points


def select_next(tickets: list[Ticket]) -> Ticket:
    """Return the highest-priority ticket, using id as a tie-breaker."""
    if not tickets:
        raise ValueError("At least one ticket is required")
    return max(tickets, key=lambda item: (priority_score(item), item.ticket_id))


def main() -> None:
    """Parse realistic input and verify prioritization."""
    tickets = [
        parse_ticket("T-100,high,2,false"),
        parse_ticket("T-101,medium,12,true"),
        parse_ticket("T-102,critical,1,false"),
    ]
    selected = select_next(tickets)

    assert priority_score(tickets[1]) == 10
    assert priority_score(tickets[2]) == 10
    assert selected.ticket_id == "T-102"

    for ticket in tickets:
        print(ticket.ticket_id, "score=", priority_score(ticket))
    print("Next ticket:", selected.ticket_id)
    print("Self-check: OK")


if __name__ == "__main__":
    main()
