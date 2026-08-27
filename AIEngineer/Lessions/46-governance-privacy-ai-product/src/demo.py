"""Privacy minimization, PII redaction và risk-based approval gate."""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any, Iterable, Mapping


EMAIL = re.compile(r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", re.IGNORECASE)
PHONE = re.compile(r"(?<!\d)(?:\+?84|0)(?:[ .-]?\d){9}(?!\d)")


def minimize_record(record: Mapping[str, Any], allowed_fields: Iterable[str]) -> dict[str, Any]:
    """Chỉ giữ field có purpose rõ; không log payload dư thừa."""
    allowed = set(allowed_fields)
    return {key: value for key, value in record.items() if key in allowed}


def redact_pii(text: str) -> tuple[str, list[str]]:
    """Redact email/điện thoại và trả loại PII đã phát hiện."""
    findings: list[str] = []
    if EMAIL.search(text):
        findings.append("email")
        text = EMAIL.sub("[EMAIL]", text)
    if PHONE.search(text):
        findings.append("phone")
        text = PHONE.sub("[PHONE]", text)
    return text, findings


@dataclass(frozen=True)
class Risk:
    likelihood: int
    impact: int
    reversible: bool

    @property
    def score(self) -> int:
        return self.likelihood * self.impact + (0 if self.reversible else 5)


def approval_policy(risk: Risk, contains_pii: bool, changes_external_state: bool) -> str:
    """Policy rõ ràng: block/escalate/allow, không giao quyền cho confidence model."""
    if risk.score >= 20:
        return "block"
    if contains_pii or changes_external_state or risk.score >= 10:
        return "human_approval"
    return "allow"


def main() -> None:
    raw = {"ticket": "T-7", "message": "Gọi 090 123 4567 hoặc a@example.com", "birth_date": "1990-01-01"}
    minimum = minimize_record(raw, {"ticket", "message"})
    clean, findings = redact_pii(minimum["message"])
    decision = approval_policy(Risk(3, 4, reversible=True), bool(findings), changes_external_state=False)
    assert "birth_date" not in minimum
    assert clean == "Gọi [PHONE] hoặc [EMAIL]"
    assert set(findings) == {"email", "phone"} and decision == "human_approval"
    print({"minimized_fields": list(minimum), "pii_types": findings, "decision": decision})


if __name__ == "__main__":
    main()
