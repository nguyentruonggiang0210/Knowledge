#!/usr/bin/env python3
"""Extract quiz question text and answer choices into one Markdown file."""

from __future__ import annotations

import argparse
from pathlib import Path

from capture_quiz import (
    OPTION_SELECTOR,
    answer_and_check,
    click_all,
    dismiss_cookie_banner,
    open_context,
    pagination_container,
    question_button,
    wait_until_settled,
)


DEFAULT_URL = "https://guided.maithienan.com/certifications/ccar-f/quiz/practice"
QUESTION_SELECTOR = "main p.whitespace-pre-line"
ANSWER_SELECTOR = f"main {OPTION_SELECTOR}"
CORRECT_ANSWER_SELECTOR = f"{ANSWER_SELECTOR}[class*='border-emerald-']"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("url", nargs="?", default=DEFAULT_URL)
    parser.add_argument("--images", type=Path, default=Path("images"))
    parser.add_argument(
        "--output", type=Path, default=Path("quiz_questions_answers.md")
    )
    parser.add_argument("--headed", action="store_true")
    parser.add_argument("--profile", type=Path)
    parser.add_argument("--timeout", type=int, default=15_000)
    parser.add_argument("--delay", type=int, default=250)
    return parser.parse_args()


def validate_images(images_dir: Path) -> list[int]:
    image_numbers = sorted(
        int(path.stem)
        for path in images_dir.glob("*.png")
        if path.stem.isdigit() and path.stat().st_size > 0
    )
    expected = list(range(1, 163))
    if image_numbers != expected:
        missing = sorted(set(expected) - set(image_numbers))
        extra = sorted(set(image_numbers) - set(expected))
        raise SystemExit(f"Bộ ảnh không hợp lệ. Thiếu={missing}; ngoài phạm vi={extra}")
    return image_numbers


def normalize(text: str) -> str:
    lines = [line.rstrip() for line in text.replace("\r\n", "\n").split("\n")]
    result: list[str] = []
    previous_blank = False
    for line in lines:
        blank = not line.strip()
        if blank and previous_blank:
            continue
        result.append(line.strip() if line else "")
        previous_blank = blank
    return "\n".join(result).strip()


def markdown_document(records: list[tuple[int, str, list[str], int]]) -> str:
    sections = [
        "# CCAR-F Practice — Questions and answer choices",
        "",
        f"Tổng số câu: **{len(records)}**.",
        "",
        "> Nội dung được đối chiếu theo bộ ảnh `images/001.png`–`images/162.png`. "
        "Option có trạng thái màu xanh là đáp án đúng.",
    ]
    for number, question, answers, correct_index in records:
        sections.extend(
            [
                "",
                f"## Câu {number:03d}",
                "",
                "### Câu hỏi",
                "",
                question,
                "",
                "### Các lựa chọn trả lời",
                "",
            ]
        )
        sections.extend(f"{index}. {answer}" for index, answer in enumerate(answers, 1))
        sections.extend(
            [
                "",
                "### Đáp án đúng",
                "",
                f"**{correct_index}. {answers[correct_index - 1]}**",
            ]
        )
    sections.append("")
    return "\n".join(sections)


def extract(args: argparse.Namespace) -> None:
    try:
        from playwright.sync_api import sync_playwright
    except ModuleNotFoundError as exc:
        raise SystemExit("Chưa cài Playwright.") from exc

    image_numbers = validate_images(args.images.resolve())
    records: list[tuple[int, str, list[str], int]] = []

    with sync_playwright() as playwright:
        context, _ = open_context(playwright, args)
        context.set_default_timeout(args.timeout)
        page = context.pages[0] if context.pages else context.new_page()
        try:
            page.goto(args.url, wait_until="domcontentloaded")
            wait_until_settled(page, args.delay)
            dismiss_cookie_banner(page)
            click_all(page)
            wait_until_settled(page, args.delay)
            container = pagination_container(page)

            for number in image_numbers:
                last_error: Exception | None = None
                for attempt in range(1, 4):
                    try:
                        question_button(container, number).click()
                        page.wait_for_function(
                            """
                            expected => {
                              const text = document.querySelector('main')?.innerText || '';
                              return text.includes(`Question ${expected}/162`)
                                || text.includes(`Câu hỏi ${expected}/162`);
                            }
                            """,
                            arg=number,
                        )
                        page.wait_for_timeout(args.delay)

                        question_locator = page.locator(QUESTION_SELECTOR)
                        answers_locator = page.locator(ANSWER_SELECTOR)
                        question = normalize(question_locator.first.inner_text())
                        answers = [normalize(item.inner_text()) for item in answers_locator.all()]
                        answers = [answer for answer in answers if answer]
                        if not question or len(answers) != 4:
                            raise RuntimeError(
                                f"question={bool(question)}, số lựa chọn={len(answers)}"
                            )

                        answer_and_check(page)
                        correct_answer = normalize(
                            page.locator(CORRECT_ANSWER_SELECTOR).first.inner_text()
                        ).removeprefix("✓").strip()
                        if correct_answer not in answers:
                            raise RuntimeError(
                                "Không khớp option màu xanh với danh sách lựa chọn: "
                                f"{correct_answer!r}"
                            )
                        correct_index = answers.index(correct_answer) + 1

                        records.append((number, question, answers, correct_index))
                        print(f"[{number:03d}/162] OK", flush=True)
                        last_error = None
                        break
                    except Exception as exc:
                        last_error = exc
                        print(
                            f"[{number:03d}/162] thử lại {attempt}/3: {exc}",
                            flush=True,
                        )
                        page.wait_for_timeout(500)
                if last_error is not None:
                    raise RuntimeError(f"Không trích xuất được câu {number}") from last_error
        finally:
            context.close()

    if [number for number, _, _, _ in records] != image_numbers:
        raise RuntimeError("Kết quả không đủ hoặc sai thứ tự 162 câu.")

    output = args.output.resolve()
    output.write_text(markdown_document(records), encoding="utf-8")
    print(f"Đã lưu {len(records)} câu vào: {output}", flush=True)


if __name__ == "__main__":
    extract(parse_args())
