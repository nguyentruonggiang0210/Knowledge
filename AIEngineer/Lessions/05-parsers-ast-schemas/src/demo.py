"""A safe lexer, recursive-descent arithmetic parser, AST, and validator."""

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from enum import Enum, auto


class TokenKind(Enum):
    """Token categories understood by the grammar."""

    NUMBER = auto()
    PLUS = auto()
    MINUS = auto()
    STAR = auto()
    SLASH = auto()
    LEFT_PAREN = auto()
    RIGHT_PAREN = auto()
    EOF = auto()


@dataclass(frozen=True, slots=True)
class Token:
    """A lexical token with its original character offset."""

    kind: TokenKind
    text: str
    position: int


@dataclass(frozen=True, slots=True)
class Number:
    """Numeric AST leaf."""

    value: float


@dataclass(frozen=True, slots=True)
class Unary:
    """Unary arithmetic AST node."""

    operator: TokenKind
    operand: "Expression"


@dataclass(frozen=True, slots=True)
class Binary:
    """Binary arithmetic AST node."""

    left: "Expression"
    operator: TokenKind
    right: "Expression"


Expression = Number | Unary | Binary

SYMBOLS = {
    "+": TokenKind.PLUS,
    "-": TokenKind.MINUS,
    "*": TokenKind.STAR,
    "/": TokenKind.SLASH,
    "(": TokenKind.LEFT_PAREN,
    ")": TokenKind.RIGHT_PAREN,
}


def lex(source: str) -> list[Token]:
    """Convert source characters to arithmetic tokens."""
    tokens: list[Token] = []
    index = 0
    while index < len(source):
        character = source[index]
        if character.isspace():
            index += 1
            continue
        if character in SYMBOLS:
            tokens.append(Token(SYMBOLS[character], character, index))
            index += 1
            continue
        if character.isdigit() or character == ".":
            start = index
            dots = 0
            while index < len(source) and (
                source[index].isdigit() or source[index] == "."
            ):
                dots += source[index] == "."
                index += 1
            text = source[start:index]
            if dots > 1 or text == ".":
                raise ValueError(f"Invalid number {text!r} at position {start}")
            tokens.append(Token(TokenKind.NUMBER, text, start))
            continue
        raise ValueError(f"Unexpected character {character!r} at position {index}")
    tokens.append(Token(TokenKind.EOF, "", len(source)))
    return tokens


class Parser:
    """Recursive-descent parser implementing arithmetic precedence."""

    def __init__(self, tokens: list[Token]) -> None:
        self._tokens = tokens
        self._index = 0

    @property
    def current(self) -> Token:
        """Return the token under the cursor."""
        return self._tokens[self._index]

    def accept(self, *kinds: TokenKind) -> Token | None:
        """Consume current token when its kind matches."""
        if self.current.kind not in kinds:
            return None
        token = self.current
        self._index += 1
        return token

    def parse(self) -> Expression:
        """Parse one complete expression and reject trailing input."""
        expression = self.parse_expression()
        if self.current.kind is not TokenKind.EOF:
            raise ValueError(
                f"Unexpected token {self.current.text!r} at {self.current.position}"
            )
        return expression

    def parse_expression(self) -> Expression:
        """Parse addition and subtraction."""
        node = self.parse_term()
        while (operator := self.accept(TokenKind.PLUS, TokenKind.MINUS)) is not None:
            node = Binary(node, operator.kind, self.parse_term())
        return node

    def parse_term(self) -> Expression:
        """Parse multiplication and division."""
        node = self.parse_unary()
        while (operator := self.accept(TokenKind.STAR, TokenKind.SLASH)) is not None:
            node = Binary(node, operator.kind, self.parse_unary())
        return node

    def parse_unary(self) -> Expression:
        """Parse leading minus or a primary expression."""
        if self.accept(TokenKind.MINUS) is not None:
            return Unary(TokenKind.MINUS, self.parse_unary())
        return self.parse_primary()

    def parse_primary(self) -> Expression:
        """Parse a number or parenthesized expression."""
        if (number := self.accept(TokenKind.NUMBER)) is not None:
            return Number(float(number.text))
        if self.accept(TokenKind.LEFT_PAREN) is not None:
            expression = self.parse_expression()
            if self.accept(TokenKind.RIGHT_PAREN) is None:
                raise ValueError(f"Expected ')' at position {self.current.position}")
            return expression
        raise ValueError(
            f"Expected number or '(' at position {self.current.position}"
        )


def parse_arithmetic(source: str) -> Expression:
    """Lex and parse source into an arithmetic AST."""
    return Parser(lex(source)).parse()


def evaluate(expression: Expression) -> float:
    """Evaluate supported AST nodes without executing source code."""
    if isinstance(expression, Number):
        return expression.value
    if isinstance(expression, Unary):
        return -evaluate(expression.operand)
    left = evaluate(expression.left)
    right = evaluate(expression.right)
    if expression.operator is TokenKind.PLUS:
        return left + right
    if expression.operator is TokenKind.MINUS:
        return left - right
    if expression.operator is TokenKind.STAR:
        return left * right
    if expression.operator is TokenKind.SLASH:
        if right == 0:
            raise ValueError("Division by zero")
        return left / right
    raise ValueError(f"Unsupported operator: {expression.operator}")


def validate_request_schema(payload: Mapping[str, object]) -> list[str]:
    """Validate decoded shape and business bounds of a calculator request."""
    errors: list[str] = []
    extra = set(payload) - {"expression", "precision"}
    if extra:
        errors.append(f"unknown fields: {sorted(extra)}")
    if not isinstance(payload.get("expression"), str) or not payload.get("expression"):
        errors.append("expression must be a non-empty string")
    precision = payload.get("precision")
    if (
        not isinstance(precision, int)
        or isinstance(precision, bool)
        or not 0 <= precision <= 8
    ):
        errors.append("precision must be an integer from 0 to 8")
    return errors


def main() -> None:
    """Parse, evaluate, and validate deterministic examples."""
    first_ast = parse_arithmetic("12 + 3 * (7 - 2) / 5")
    second_ast = parse_arithmetic("-(2 + 3) * 4")
    request = {"expression": "1 + 2", "precision": 2}
    assert evaluate(first_ast) == 15.0
    assert evaluate(second_ast) == -20.0
    assert validate_request_schema(request) == []
    assert validate_request_schema({"expression": "", "precision": True})
    print("AST:", first_ast)
    print("Result:", evaluate(first_ast))
    print("Valid request schema:", not validate_request_schema(request))
    print("Self-check: OK")


if __name__ == "__main__":
    main()
