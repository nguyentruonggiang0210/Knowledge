"""Crawl CCAR-F docs from nvnhan.wiki and export one Markdown file per domain.

The site is a hash-routed SPA, so this tool renders it with Playwright, clicks
every domain and section exposed by `.docs-sidebar`, and converts the rendered
article HTML to Markdown.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable
from urllib.parse import urljoin

from bs4 import BeautifulSoup, NavigableString, Tag
from playwright.async_api import Browser, BrowserContext, Locator, Page, async_playwright

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")


DEFAULT_URL = "https://www.nvnhan.wiki/#/ccarf/docs"
SIDEBAR_SELECTOR = ".docs-sidebar"
DOMAIN_PATTERN = re.compile(r"\bD\s*([1-9]\d*)\b", re.IGNORECASE)
NOISE_SELECTORS = (
    "script, style, noscript, svg, button, nav, footer, .docs-sidebar, "
    ".copy-button, .copy-code, [aria-hidden='true']"
)
ARTICLE_SELECTORS = (
    ".docs-content",
    ".doc-content",
    ".documentation-content",
    ".markdown-body",
    "main article",
    "article",
    "main",
)


@dataclass
class Section:
    title: str
    markdown: str
    url: str


@dataclass
class Domain:
    code: str
    title: str
    expected_sections: int | None = None
    sections: list[Section] = field(default_factory=list)


def normalize_space(value: str) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


def slugify(value: str) -> str:
    value = normalize_space(value).lower()
    value = re.sub(r"[^a-z0-9]+", "-", value).strip("-")
    return value or "domain"


def markdown_text(node: Tag | NavigableString, base_url: str, depth: int = 0) -> str:
    """Convert the useful subset of rendered HTML into readable Markdown."""
    if isinstance(node, NavigableString):
        return str(node)
    if not isinstance(node, Tag):
        return ""

    name = node.name.lower()
    if name in {"script", "style", "noscript", "svg", "button"}:
        return ""

    children = lambda: "".join(markdown_text(child, base_url, depth) for child in node.children)

    if name in {"h1", "h2", "h3", "h4", "h5", "h6"}:
        level = int(name[1])
        return f"\n\n{'#' * level} {normalize_space(children())}\n\n"
    if name == "p":
        return f"\n\n{normalize_space(children())}\n\n"
    if name == "br":
        return "  \n"
    if name in {"strong", "b"}:
        text = normalize_space(children())
        return f"**{text}**" if text else ""
    if name in {"em", "i"}:
        text = normalize_space(children())
        return f"*{text}*" if text else ""
    if name == "code" and node.parent and node.parent.name == "pre":
        return node.get_text("", strip=False)
    if name == "code":
        text = node.get_text("", strip=False).strip().replace("`", "\\`")
        return f"`{text}`"
    if name == "pre":
        code = node.get_text("", strip=False).strip("\n")
        language = ""
        code_tag = node.find("code")
        if code_tag:
            classes = " ".join(code_tag.get("class", []))
            match = re.search(r"(?:language-|lang-)([\w+-]+)", classes)
            language = match.group(1) if match else ""
        return f"\n\n```{language}\n{code}\n```\n\n"
    if name == "a":
        label = normalize_space(children()) or normalize_space(node.get_text(" ", strip=True))
        href = node.get("href", "")
        if not href or href.startswith("javascript:"):
            return label
        return f"[{label}]({urljoin(base_url, href)})"
    if name == "img":
        src = node.get("src", "")
        alt = normalize_space(node.get("alt", "illustration"))
        return f"![{alt}]({urljoin(base_url, src)})" if src else ""
    if name == "blockquote":
        text = normalize_space(children())
        return "\n\n" + "\n".join(f"> {line}" for line in text.splitlines()) + "\n\n"
    if name in {"ul", "ol"}:
        ordered = name == "ol"
        lines: list[str] = []
        items = node.find_all("li", recursive=False)
        for index, item in enumerate(items, 1):
            item_text = normalize_space("".join(markdown_text(c, base_url, depth + 1) for c in item.children))
            prefix = f"{index}." if ordered else "-"
            lines.append(f"{'  ' * depth}{prefix} {item_text}")
        return "\n\n" + "\n".join(lines) + "\n\n"
    if name == "table":
        rows = []
        for row in node.find_all("tr"):
            cells = [normalize_space(cell.get_text(" ", strip=True)).replace("|", "\\|") for cell in row.find_all(["th", "td"], recursive=False)]
            if cells:
                rows.append(cells)
        if not rows:
            return ""
        width = max(len(row) for row in rows)
        rows = [row + [""] * (width - len(row)) for row in rows]
        output = ["| " + " | ".join(rows[0]) + " |", "| " + " | ".join(["---"] * width) + " |"]
        output.extend("| " + " | ".join(row) + " |" for row in rows[1:])
        return "\n\n" + "\n".join(output) + "\n\n"
    if name == "hr":
        return "\n\n---\n\n"
    if name in {"div", "section", "article", "main", "header", "figure", "figcaption", "span"}:
        return children()
    return children()


def html_to_markdown(html: str, base_url: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    for element in soup.select(NOISE_SELECTORS):
        element.decompose()
    markdown = markdown_text(soup, base_url)
    markdown = re.sub(r"[ \t]+\n", "\n", markdown)
    markdown = re.sub(r"\n{3,}", "\n\n", markdown)
    return markdown.strip()


async def launch_browser(playwright, headed: bool) -> Browser:
    try:
        return await playwright.chromium.launch(channel="msedge", headless=not headed)
    except Exception:
        return await playwright.chromium.launch(headless=not headed)


async def wait_for_stable_page(page: Page, previous_signature: str = "") -> None:
    await page.wait_for_timeout(350)
    try:
        await page.wait_for_load_state("networkidle", timeout=8_000)
    except Exception:
        pass
    for _ in range(20):
        signature = await page.locator("body").inner_text()
        signature = signature[-2_000:]
        if signature and signature != previous_signature:
            await page.wait_for_timeout(250)
            return
        await page.wait_for_timeout(150)


async def element_descriptors(root: Locator) -> list[dict]:
    return await root.locator("a, button, [role='button'], [tabindex]").evaluate_all(
        """els => els.map((el, index) => ({
          index,
          tag: el.tagName,
          text: (el.innerText || el.textContent || '').replace(/\\s+/g, ' ').trim(),
          href: el.getAttribute('href'),
          cls: el.className,
          role: el.getAttribute('role'),
          visible: !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length)
        })).filter(x => x.visible && x.text)"""
    )


async def inspect_site(page: Page) -> None:
    sidebar = page.locator(SIDEBAR_SELECTOR).first
    print("\n=== SIDEBAR TEXT ===")
    print((await sidebar.inner_text())[:8_000])
    print("\n=== CLICKABLE ELEMENTS ===")
    print(json.dumps(await element_descriptors(sidebar), ensure_ascii=False, indent=2)[:20_000])
    print("\n=== SIDEBAR HTML ===")
    print((await sidebar.evaluate("el => el.outerHTML"))[:30_000])
    print("\n=== PAGE CLASS CANDIDATES ===")
    classes = await page.locator("main, article, [class*='doc'], [class*='content']").evaluate_all(
        "els => els.map(el => ({tag: el.tagName, cls: el.className, text: (el.innerText || '').slice(0, 160)})).filter(x => x.text)"
    )
    print(json.dumps(classes, ensure_ascii=False, indent=2)[:20_000])


def parse_domain_label(text: str) -> tuple[str, str, int | None] | None:
    match = DOMAIN_PATTERN.search(text)
    if not match:
        return None
    code = f"D{int(match.group(1))}"
    expected_match = re.search(r"(\d+)\s+sections?", text, re.IGNORECASE)
    expected = int(expected_match.group(1)) if expected_match else None
    cleaned = DOMAIN_PATTERN.sub("", text, count=1)
    cleaned = re.sub(r"\b\d+\s+sections?\b", "", cleaned, flags=re.IGNORECASE)
    return code, normalize_space(cleaned), expected


async def discover_domains(page: Page) -> list[dict]:
    sidebar = page.locator(SIDEBAR_SELECTOR).first
    descriptors = await element_descriptors(sidebar)
    domains: list[dict] = []
    seen: set[str] = set()
    for item in descriptors:
        parsed = parse_domain_label(item["text"])
        if not parsed or parsed[0] in seen:
            continue
        code, title, expected = parsed
        seen.add(code)
        domains.append({**item, "code": code, "title": title or code, "expected": expected})
    if not domains:
        raise RuntimeError("Không tìm thấy domain D1... trong .docs-sidebar. Chạy với --inspect để xem DOM.")
    return sorted(domains, key=lambda item: int(item["code"][1:]))


async def find_clickable_by_text(sidebar: Locator, text: str) -> Locator:
    exact = sidebar.get_by_text(text, exact=True)
    if await exact.count():
        candidate = exact.first
    else:
        candidate = sidebar.get_by_text(re.compile(re.escape(text), re.IGNORECASE)).first
    return candidate.locator("xpath=ancestor-or-self::*[self::a or self::button or @role='button' or @tabindex][1]")


async def click_domain(page: Page, domain: dict) -> None:
    sidebar = page.locator(SIDEBAR_SELECTOR).first
    candidate = await find_clickable_by_text(sidebar, domain["text"])
    if not await candidate.count():
        candidate = sidebar.locator("a, button, [role='button'], [tabindex]").nth(domain["index"])
    previous = (await page.locator("body").inner_text())[-2_000:]
    await candidate.scroll_into_view_if_needed()
    await candidate.click()
    await wait_for_stable_page(page, previous)


async def discover_sections(page: Page, domain_code: str) -> list[dict]:
    sidebar = page.locator(SIDEBAR_SELECTOR).first
    descriptors = await element_descriptors(sidebar)
    sections: list[dict] = []
    seen: set[str] = set()
    for item in descriptors:
        text = normalize_space(item["text"])
        if not text or parse_domain_label(text):
            continue
        if text.lower() in {"previous", "next", "back", "home", "docs"}:
            continue
        key = item.get("href") or text.lower()
        if key in seen:
            continue
        seen.add(key)
        sections.append(item)
    return sections


async def choose_article(page: Page) -> Locator:
    for selector in ARTICLE_SELECTORS:
        candidates = page.locator(selector)
        for index in range(await candidates.count()):
            item = candidates.nth(index)
            if await item.is_visible() and len(normalize_space(await item.inner_text())) >= 80:
                return item
    raise RuntimeError("Không tìm thấy vùng nội dung bài viết sau khi render.")


async def extract_current_section(page: Page, fallback_title: str) -> Section:
    article = await choose_article(page)
    clone_html = await article.inner_html()
    markdown = html_to_markdown(clone_html, page.url)
    title = fallback_title
    heading = article.locator("h1, h2, h3").first
    if await heading.count():
        heading_text = normalize_space(await heading.inner_text())
        if heading_text:
            title = heading_text
    return Section(title=title, markdown=markdown, url=page.url)


async def extract_rendered_domain_sections(page: Page, fallback_title: str) -> list[Section]:
    """Split the rendered `.doc-body` into sections beginning at each H2."""
    body = page.locator(".doc-body").first
    if not await body.count() or not await body.is_visible():
        return [await extract_current_section(page, fallback_title)]

    fragments = await body.evaluate(
        r"""root => {
          const groups = [];
          let current = null;
          for (const child of root.children) {
            if (child.matches('h2, h2.doc-h2')) {
              if (current) groups.push(current);
              current = {
                title: (child.innerText || child.textContent || '').replace(/\s+/g, ' ').trim(),
                html: child.outerHTML
              };
            } else if (current) {
              current.html += child.outerHTML;
            }
          }
          if (current) groups.push(current);
          return groups;
        }"""
    )
    if not fragments:
        return [await extract_current_section(page, fallback_title)]

    sections: list[Section] = []
    for fragment in fragments:
        markdown = html_to_markdown(fragment["html"], page.url)
        if markdown:
            sections.append(Section(
                title=normalize_space(fragment["title"]) or fallback_title,
                markdown=markdown,
                url=page.url,
            ))
    return sections


async def crawl_domain(page: Page, domain_info: dict, verbose: bool) -> Domain:
    await click_domain(page, domain_info)
    domain = Domain(domain_info["code"], domain_info["title"], domain_info["expected"])
    domain.sections = await extract_rendered_domain_sections(page, domain.title)
    if verbose:
        for position, section in enumerate(domain.sections, 1):
            print(f"  [{position}/{len(domain.sections)}] {section.title}")
    return domain


def render_domain(domain: Domain, source_url: str) -> str:
    lines = [
        f"# {domain.code} — {domain.title}",
        "",
        f"> Source: [{source_url}]({source_url})",
        "> Exported from the rendered documentation by `Tool2/scrape_docs.py`.",
        "",
        "## Table of contents",
        "",
    ]
    for index, section in enumerate(domain.sections, 1):
        lines.append(f"{index}. [{section.title}](#{slugify(section.title)})")
    lines.extend(["", "---", ""])
    for index, section in enumerate(domain.sections, 1):
        body = section.markdown
        # Ensure each clicked section has a stable top-level heading.
        if not re.match(r"^#{1,3}\s", body):
            body = f"## {section.title}\n\n{body}"
        lines.extend([f'<a id="{slugify(section.title)}"></a>', "", body, "", f"_Section URL: {section.url}_", ""])
        if index != len(domain.sections):
            lines.extend(["---", ""])
    return "\n".join(lines).strip() + "\n"


def render_all_domains(domains: list[Domain], source_url: str) -> str:
    lines = [
        "# CCAR-F Documentation — Complete Export",
        "",
        f"> Source: [{source_url}]({source_url})",
        "> This file combines every domain clicked and exported by `Tool2/scrape_docs.py`.",
        "",
        "## Domains",
        "",
    ]
    for domain in domains:
        lines.append(f"- [{domain.code} — {domain.title}](#{slugify(domain.code + '-' + domain.title)})")
    for domain in domains:
        lines.extend([
            "",
            "---",
            "",
            f'<a id="{slugify(domain.code + "-" + domain.title)}"></a>',
            "",
            render_domain(domain, source_url).strip(),
        ])
    return "\n".join(lines).strip() + "\n"


async def run(args: argparse.Namespace) -> int:
    output_dir = Path(args.output).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    async with async_playwright() as playwright:
        browser = await launch_browser(playwright, args.headed)
        context: BrowserContext = await browser.new_context(
            viewport={"width": 1440, "height": 1000},
            locale="en-US",
        )
        page = await context.new_page()
        page.set_default_timeout(args.timeout * 1000)
        print(f"Opening {args.url}")
        await page.goto(args.url, wait_until="domcontentloaded", timeout=args.timeout * 1000)
        await page.locator(SIDEBAR_SELECTOR).first.wait_for(state="visible")
        await wait_for_stable_page(page)

        if args.inspect:
            await inspect_site(page)
            await browser.close()
            return 0

        domains = await discover_domains(page)
        print(f"Found {len(domains)} domains: {', '.join(item['code'] for item in domains)}")
        manifest = {"source": args.url, "domains": []}
        failures: list[str] = []
        crawled_domains: list[Domain] = []

        for index, info in enumerate(domains, 1):
            print(f"[{index}/{len(domains)}] Crawling {info['code']} — {info['title']}")
            try:
                domain = await crawl_domain(page, info, args.verbose)
                filename = f"{domain.code}-{slugify(domain.title)}.md"
                path = output_dir / filename
                path.write_text(render_domain(domain, args.url), encoding="utf-8")
                crawled_domains.append(domain)
                expected = domain.expected_sections
                actual = len(domain.sections)
                status = "ok" if expected is None or expected == actual else "count-mismatch"
                manifest["domains"].append({
                    "code": domain.code,
                    "title": domain.title,
                    "file": filename,
                    "expected_sections": expected,
                    "exported_sections": actual,
                    "status": status,
                })
                print(f"  Saved {actual} section(s) -> {path.name}")
                if status != "ok":
                    failures.append(f"{domain.code}: expected {expected}, exported {actual}")
            except Exception as exc:
                failures.append(f"{info['code']}: {exc}")
                print(f"  ERROR: {exc}", file=sys.stderr)
                if args.fail_fast:
                    raise

        combined_path = output_dir / "ALL_DOMAINS.md"
        combined_path.write_text(render_all_domains(crawled_domains, args.url), encoding="utf-8")
        manifest["combined_file"] = combined_path.name
        manifest["total_exported_sections"] = sum(len(domain.sections) for domain in crawled_domains)
        manifest_path = output_dir / "manifest.json"
        manifest["failures"] = failures
        manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
        await browser.close()

    print(f"Combined: {combined_path}")
    print(f"Manifest: {manifest_path}")
    if failures:
        print("Completed with warnings:", file=sys.stderr)
        for failure in failures:
            print(f"- {failure}", file=sys.stderr)
        return 2
    print("Completed successfully.")
    return 0


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Export nvnhan.wiki CCAR-F docs to Markdown by domain.")
    parser.add_argument("--url", default=DEFAULT_URL, help="Documentation URL to crawl")
    parser.add_argument("--output", default=str(Path(__file__).parent / "Output"), help="Output directory")
    parser.add_argument("--timeout", type=int, default=60, help="Navigation/selector timeout in seconds")
    parser.add_argument("--headed", action="store_true", help="Show the browser window while crawling")
    parser.add_argument("--inspect", action="store_true", help="Print rendered sidebar/content DOM and exit")
    parser.add_argument("--verbose", action="store_true", help="Print every section while crawling")
    parser.add_argument("--fail-fast", action="store_true", help="Stop on the first domain error")
    return parser.parse_args()


if __name__ == "__main__":
    try:
        raise SystemExit(asyncio.run(run(parse_args())))
    except KeyboardInterrupt:
        raise SystemExit(130)
