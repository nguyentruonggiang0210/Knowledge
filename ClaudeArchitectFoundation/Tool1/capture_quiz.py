#!/usr/bin/env python3
"""Capture every question page from a numbered practice quiz."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from playwright.sync_api import BrowserContext, Locator, Page

for stream in (sys.stdout, sys.stderr):
    if hasattr(stream, "reconfigure"):
        stream.reconfigure(encoding="utf-8")


PAGINATION_SELECTOR = "div.border-t.border-border-default.p-4.sm\\:p-5"
QUESTION_MAP_SELECTOR = "details.group.border.border-border-default.bg-panel"
OPTION_SELECTOR = "button.flex.min-h-14.w-full"
CHECK_ANSWER_LABEL = re.compile(
    r"^\s*(?:Kiểm tra(?: đáp án)?|Check answer)\s*$", re.IGNORECASE
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Mở trang quiz, bấm 'Tất cả', lần lượt chọn từng câu từ câu 1 và "
            "lưu ảnh chụp vào thư mục images."
        )
    )
    parser.add_argument("url", help="URL trang practice quiz")
    parser.add_argument("--start", type=int, default=1, help="Câu đầu tiên (mặc định: 1)")
    parser.add_argument("--end", type=int, default=162, help="Câu cuối cùng (mặc định: 162)")
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("images"),
        help="Thư mục lưu ảnh (mặc định: images)",
    )
    parser.add_argument(
        "--headed",
        action="store_true",
        help="Hiện cửa sổ trình duyệt để quan sát hoặc đăng nhập thủ công",
    )
    parser.add_argument(
        "--full-page",
        action="store_true",
        help="Chụp toàn bộ chiều dài trang thay vì chỉ khung nhìn",
    )
    parser.add_argument(
        "--resume",
        action="store_true",
        help="Bỏ qua các ảnh đã tồn tại để tiếp tục lần chạy trước",
    )
    parser.add_argument(
        "--delay",
        type=int,
        default=700,
        help="Số mili-giây chờ sau khi chuyển câu (mặc định: 700)",
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=15_000,
        help="Timeout thao tác tính bằng mili-giây (mặc định: 15000)",
    )
    parser.add_argument(
        "--profile",
        type=Path,
        help="Thư mục Chrome profile để giữ phiên đăng nhập giữa các lần chạy",
    )
    args = parser.parse_args()

    if args.start < 1 or args.end < args.start:
        parser.error("Cần thỏa mãn: 1 <= --start <= --end")
    if args.delay < 0 or args.timeout <= 0:
        parser.error("--delay phải >= 0 và --timeout phải > 0")
    return args


def first_visible(locator: Locator) -> Locator | None:
    """Return the first visible element from a locator, if one exists."""
    for index in range(locator.count()):
        candidate = locator.nth(index)
        if candidate.is_visible():
            return candidate
    return None


def click_all(page: Page) -> None:
    """Open the complete numbered-question list."""
    question_map = page.locator(QUESTION_MAP_SELECTOR).first
    question_map.wait_for(state="attached")

    if question_map.get_attribute("open") is None:
        summary = question_map.locator("summary").first
        summary.scroll_into_view_if_needed()
        summary.click()
        question_map.locator(PAGINATION_SELECTOR).wait_for(state="visible")

    # The visible label includes a count, for example "All · 162".
    all_filter = re.compile(
        r"^\s*(?:Tất cả|All)(?:\s*[·•-]\s*\d+)?\s*$", re.IGNORECASE
    )
    candidates = (
        question_map.get_by_role("button", name=all_filter),
        question_map.get_by_role("link", name=all_filter),
        question_map.get_by_text(all_filter),
    )
    for locator in candidates:
        target = first_visible(locator)
        if target is not None:
            target.scroll_into_view_if_needed()
            target.click()
            return
    visible_buttons = [
        " ".join(button.inner_text().split())
        for button in question_map.locator("button").all()
        if button.is_visible()
    ]
    raise RuntimeError(
        "Không tìm thấy nút 'Tất cả/All' trong bản đồ câu hỏi. "
        f"Các nút đang hiển thị: {visible_buttons}"
    )


def pagination_container(page: Page) -> Locator:
    container = page.locator(PAGINATION_SELECTOR)
    container.first.wait_for(state="visible")
    return container.first


def question_button(container: Locator, number: int) -> Locator:
    exact_number = re.compile(rf"^\s*{number}\s*$")
    candidates = (
        container.get_by_role("button", name=exact_number),
        container.get_by_role("link", name=exact_number),
        container.get_by_text(exact_number),
    )
    for locator in candidates:
        target = first_visible(locator)
        if target is not None:
            return target
    raise RuntimeError(f"Không tìm thấy nút câu {number} trong vùng phân trang.")


def wait_until_settled(page: Page, delay_ms: int) -> None:
    from playwright.sync_api import TimeoutError as PlaywrightTimeoutError

    try:
        page.wait_for_load_state("networkidle", timeout=3_000)
    except PlaywrightTimeoutError:
        # Some applications keep background connections open indefinitely.
        pass
    page.wait_for_timeout(delay_ms)


def dismiss_cookie_banner(page: Page) -> None:
    """Dismiss the cookie banner when it is covering the quiz controls."""
    dismiss_label = re.compile(
        r"^\s*(?:Essential only|Chỉ (?:cookie )?(?:thiết yếu|cần thiết))\s*$",
        re.IGNORECASE,
    )
    target = first_visible(page.get_by_role("button", name=dismiss_label))
    if target is not None:
        target.click()


def answer_and_check(page: Page) -> None:
    """Select one answer and wait for the checked green/red result styling."""
    correct_option = page.locator(
        f"{OPTION_SELECTOR}[class*='border-emerald-']"
    )

    # A persistent browser profile can reopen a question that was checked before.
    if first_visible(correct_option) is not None:
        return

    check_button = first_visible(page.get_by_role("button", name=CHECK_ANSWER_LABEL))
    if check_button is None:
        raise RuntimeError("Không tìm thấy nút 'Kiểm tra/Check answer'.")

    option = first_visible(page.locator(OPTION_SELECTOR))
    if option is None:
        raise RuntimeError("Không tìm thấy option nào của câu hỏi hiện tại.")

    option.scroll_into_view_if_needed()
    option.click()
    page.wait_for_function(
        "element => !element.disabled", arg=check_button.element_handle()
    )
    check_button.scroll_into_view_if_needed()
    check_button.click()

    # The correct option always turns green. If the arbitrary choice is wrong,
    # the selected option also turns red. Waiting for green ensures React has
    # finished rendering the checked state before the screenshot is taken.
    correct_option.first.wait_for(state="visible")


def scroll_everything_to_top(page: Page) -> None:
    page.evaluate(
        """
        () => {
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
          for (const element of document.querySelectorAll('*')) {
            if (element.scrollTop > 0) element.scrollTop = 0;
          }
        }
        """
    )
    page.wait_for_timeout(150)


def open_context(
    playwright: Any, args: argparse.Namespace
) -> tuple[BrowserContext, bool]:
    viewport = {"width": 1440, "height": 1000}
    browsers = (("Playwright Chromium", None), ("Microsoft Edge", "msedge"))
    last_missing_browser_error: Exception | None = None

    if args.profile:
        args.profile.mkdir(parents=True, exist_ok=True)

    for browser_name, channel in browsers:
        channel_option = {"channel": channel} if channel else {}
        try:
            if args.profile:
                context = playwright.chromium.launch_persistent_context(
                    str(args.profile.resolve()),
                    headless=not args.headed,
                    viewport=viewport,
                    **channel_option,
                )
                if channel:
                    print(f"Không có Chromium, đang dùng {browser_name} có sẵn.")
                return context, True

            browser = playwright.chromium.launch(
                headless=not args.headed, **channel_option
            )
            context = browser.new_context(viewport=viewport)
            if channel:
                print(f"Không có Chromium, đang dùng {browser_name} có sẵn.")
            return context, False
        except Exception as exc:
            error_text = str(exc)
            if (
                "Executable doesn't exist" not in error_text
                and "executable doesn't exist" not in error_text.lower()
            ):
                raise
            last_missing_browser_error = exc

    raise SystemExit(
        "Không tìm thấy Chromium hoặc Microsoft Edge. Cài browser bằng lệnh:\n"
        "    python -m playwright install chromium"
    ) from last_missing_browser_error


def capture(args: argparse.Namespace) -> int:
    try:
        from playwright.sync_api import sync_playwright
    except ModuleNotFoundError as exc:
        raise SystemExit(
            "Chưa cài Playwright. Chạy: python -m pip install -r requirements.txt"
        ) from exc

    output_dir = args.output.resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    width = max(3, len(str(args.end)))
    failures: list[int] = []

    with sync_playwright() as playwright:
        context, _persistent = open_context(playwright, args)
        context.set_default_timeout(args.timeout)
        page = context.pages[0] if context.pages else context.new_page()

        try:
            print(f"Đang mở: {args.url}")
            page.goto(args.url, wait_until="domcontentloaded")
            wait_until_settled(page, args.delay)
            dismiss_cookie_banner(page)
            click_all(page)
            wait_until_settled(page, args.delay)
            container = pagination_container(page)

            for number in range(args.start, args.end + 1):
                image_path = output_dir / f"{number:0{width}d}.png"
                if args.resume and image_path.exists() and image_path.stat().st_size > 0:
                    print(f"[{number}/{args.end}] Đã có, bỏ qua: {image_path.name}")
                    continue

                try:
                    button = question_button(container, number)
                    button.scroll_into_view_if_needed()
                    button.click()
                    wait_until_settled(page, args.delay)
                    answer_and_check(page)
                    wait_until_settled(page, args.delay)
                    scroll_everything_to_top(page)
                    page.screenshot(path=str(image_path), full_page=args.full_page)
                    print(f"[{number}/{args.end}] Đã lưu: {image_path.name}")
                except Exception as exc:  # Continue so one failure does not lose the run.
                    failures.append(number)
                    print(f"[{number}/{args.end}] LỖI: {exc}", file=sys.stderr)

            expected_paths = [
                output_dir / f"{number:0{width}d}.png"
                for number in range(args.start, args.end + 1)
            ]
            missing_or_empty = [
                int(path.stem)
                for path in expected_paths
                if not path.exists() or path.stat().st_size == 0
            ]
            failures = sorted(set(failures + missing_or_empty))
            if failures:
                print(
                    "Thiếu hoặc không chụp được các câu: "
                    + ", ".join(map(str, failures)),
                    file=sys.stderr,
                )
                return 1
            print(f"Hoàn tất {args.end - args.start + 1} ảnh trong: {output_dir}")
            return 0
        finally:
            context.close()


if __name__ == "__main__":
    raise SystemExit(capture(parse_args()))
