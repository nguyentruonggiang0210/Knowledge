"""Show typed boundaries, dependency injection, and executable unit tests."""

from __future__ import annotations

import hashlib
import re
import unittest
from dataclasses import dataclass
from typing import Protocol

EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


@dataclass(frozen=True, slots=True)
class User:
    """Stored user data; the plaintext password is never retained."""

    email: str
    password_hash: str


class UserRepository(Protocol):
    """Persistence contract required by the registration service."""

    def get(self, email: str) -> User | None:
        """Return a user by normalized email."""

    def save(self, user: User) -> None:
        """Persist a new user."""


class MemoryUserRepository:
    """Small in-memory adapter suitable for deterministic tests."""

    def __init__(self) -> None:
        self._users: dict[str, User] = {}

    def get(self, email: str) -> User | None:
        """Return an existing user, if any."""
        return self._users.get(email)

    def save(self, user: User) -> None:
        """Store a user by email."""
        self._users[user.email] = user


def normalize_email(raw_email: str) -> str:
    """Normalize and validate a user email address."""
    email = raw_email.strip().casefold()
    if not EMAIL_PATTERN.fullmatch(email):
        raise ValueError("Invalid email address")
    return email


def hash_password(password: str, salt: bytes) -> str:
    """Derive a password hash using standard-library PBKDF2."""
    if len(password) < 10:
        raise ValueError("Password must contain at least 10 characters")
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 120_000)
    return digest.hex()


def register_user(
    raw_email: str, password: str, repository: UserRepository, salt: bytes
) -> User:
    """Validate, hash, and persist a unique user."""
    email = normalize_email(raw_email)
    if repository.get(email) is not None:
        raise ValueError("Email already registered")
    user = User(email=email, password_hash=hash_password(password, salt))
    repository.save(user)
    return user


class RegistrationTests(unittest.TestCase):
    """Behavior-focused tests for registration."""

    def test_registers_normalized_email_without_plaintext(self) -> None:
        repository = MemoryUserRepository()
        user = register_user(" Dev@Example.COM ", "correct-horse", repository, b"test")
        self.assertEqual(user.email, "dev@example.com")
        self.assertNotIn("correct-horse", user.password_hash)
        self.assertIs(repository.get(user.email), user)

    def test_rejects_duplicate(self) -> None:
        repository = MemoryUserRepository()
        register_user("dev@example.com", "correct-horse", repository, b"test")
        with self.assertRaisesRegex(ValueError, "already"):
            register_user("DEV@example.com", "another-pass", repository, b"test")


def main() -> None:
    """Run a quick assertion and the embedded test suite."""
    assert normalize_email(" A@Example.com ") == "a@example.com"
    assert hash_password("correct-horse", b"salt") == hash_password(
        "correct-horse", b"salt"
    )
    suite = unittest.defaultTestLoader.loadTestsFromTestCase(RegistrationTests)
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    if not result.wasSuccessful():
        raise SystemExit(1)
    print("Self-check: OK")


if __name__ == "__main__":
    main()
