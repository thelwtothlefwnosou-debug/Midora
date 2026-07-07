#!/usr/bin/env python3
"""
Scraper για το spiti24.gr: αποθηκεύει κάθε αγγελία σε
  <έξοδος>/<Πόλη>/<Μεσιτικό γραφείο>/<id_αγγελίας>/listing.json + φωτογραφίες

Anti-bot / session (γιατί δεν ανοίγουμε κάθε φορά «καθαρό» bot):

1. Persistent profile
   Το --bootstrap χρησιμοποιεί launch_persistent_context. Ο φάκελος profile είναι κάτω από
   ~/.spiti24_scrape/<hash>/browser_profile (όχι μέσα στο project) ώστε να αποφεύγονται κενά στο path.
   Cookies, cache, local storage — ίδια «ταυτότητα» σαν επαναλαμβανόμενος χρήστης.
   Το scrape, όταν υπάρχει γεμάτο profile, ανοίγει τον ίδιο φάκελο (όχι μόνο storage JSON).

2. Stealth στο bootstrap και στο scrape
   add_init_script(STEALTH_INIT) (navigator.webdriver, window.chrome) και ignore του
   --enable-automation από Playwright. Δεν περνάμε --disable-blink-features=AutomationControlled
   στη γραμμή εντολών — το Chrome δείχνει κίτρινη μπάρα «unsupported flag».

3. Headed bootstrap, ελληνικό locale, σταθερό viewport
   Bootstrap: headless=False, locale el-GR, viewport 1280×900. Στο scrape: ίδια ρυθμίσεις·
   headless μόνο αν δεν δώσεις --headed (headless αυξάνει συχνά challenges).

Το site έχει bot protection (hCaptcha). Πρώτο βήμα (μία φορά):
  python scrape_spiti24.py --bootstrap
  (ή --save-session · ίδια λειτουργία)

(Τα browsers του Playwright μπορούν να μένουν στο φάκελο .playwright-browsers του project.)

Μετά (παράδειγμα από URL αποτελεσμάτων όπως Θεσσαλονίκη):
  python scrape_spiti24.py --mode search --search-url "https://www.spiti24.gr/pwliseis/katoikies/thessaloniki-kentro" --out ./data

Επιλογές ανακάλυψης: sitemap (προεπιλογή), crawl, σελίδες αποτελεσμάτων αναζήτησης (--mode search),
λίστα URL από αρχείο.

Μεταξύ φορτώσεων (προεπιλογή): τυχαίες παύσεις γύρω από --delay-ms, scroll με wheel, ελαφρύ mouse.
Απενεργοποίηση: --no-human-like

python scrape_spiti24.py --headed --mode search \
  --search-url "https://www.spiti24.gr/pwliseis/katoikies/skiathos" \
  --out ./spiti24_export

"""

from __future__ import annotations

import argparse
import asyncio
import hashlib
import json
import logging
import math
import random
import re
import sys
from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, urlencode, urljoin, urlparse, urlunparse

from bs4 import BeautifulSoup
from playwright.async_api import Browser, BrowserContext, Page, async_playwright
from playwright.sync_api import (
    Error as PlaywrightError,
    Page as SyncPage,
    TimeoutError as PlaywrightTimeoutError,
    sync_playwright,
)

log = logging.getLogger(__name__)

ROOT = Path(__file__).resolve().parent
DEFAULT_STORAGE = ROOT / "spiti24_storage.json"
DEFAULT_OUT = ROOT / "spiti24_export"
DEFAULT_SEEDS = [
    "https://www.spiti24.gr/",
    "https://www.spiti24.gr/pwliseis",
    "https://www.spiti24.gr/enoikiasi",
    "https://www.spiti24.gr/gi-pwliseis",
    "https://www.spiti24.gr/gi-enoikiasi",
    "https://www.spiti24.gr/epaggelmatika-pwliseis",
    "https://www.spiti24.gr/epaggelmatika-enoikiaseis",
    "https://www.spiti24.gr/neodomi",
]

HOST_ALLOW = ("www.spiti24.gr", "spiti24.gr")
HOST = "spiti24.gr"

LISTING_USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)

BROWSER_LOCALE = "el-GR"
BROWSER_VIEWPORT = {"width": 1280, "height": 900}

# Επιπλέον Chromium args για scrape/bootstrap (χωρίς AutomationControlled στο CLI — infobar).
CHROMIUM_STEALTH_ARGS: list[str] = []
CHROMIUM_IGNORE_DEFAULT_ARGS = [
    "--enable-automation",
]
# Στο macOS το Playwright στέλνει --no-sandbox → κίτρινη μπάρα «unsupported flag».
# Σε τοπικό desktop δεν χρειάζεται· σε Linux/Docker το κρατάμε (χωρίς ignore).
if sys.platform == "darwin":
    CHROMIUM_IGNORE_DEFAULT_ARGS.append("--no-sandbox")

# Μόνο bootstrap: GPU crash / SIGTRAP σε macOS + διαδρομές με κενά στο user-data-dir
BOOTSTRAP_CHROMIUM_EXTRA_ARGS = [
    "--disable-gpu",
]

STEALTH_INIT = r"""
(() => {
  try {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
  } catch (e) {}
  try {
    if (!window.chrome) window.chrome = { runtime: {} };
  } catch (e) {}
})();
"""

# Μόνο για --bootstrap (το async scrape κρατά το STEALTH_INIT παραπάνω)
BOOTSTRAP_STEALTH_INIT = """
Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
window.chrome = { runtime: {} };
"""


def configure_logging(*, verbose: bool, quiet: bool) -> None:
    if quiet:
        level = logging.WARNING
    elif verbose:
        level = logging.DEBUG
    else:
        level = logging.INFO
    logging.basicConfig(
        level=level,
        format="%(levelname)s %(name)s: %(message)s",
        force=True,
    )


def dismiss_cmp_consent_bootstrap(page: SyncPage) -> None:
    """Quantcast CMP (qc-cmp2): κλικ «ΣΥΜΦΩΝΩ» / accept-btn — μόνο για --bootstrap."""
    frames = [page.main_frame] + [f for f in page.frames if f != page.main_frame][:5]
    for frame in frames:
        for sel in ("#accept-btn", 'button[id="accept-btn"]'):
            try:
                loc = frame.locator(sel)
                if loc.count() == 0:
                    continue
                first = loc.first
                first.wait_for(state="visible", timeout=500)
                first.click(timeout=3000)
                page.wait_for_timeout(200)
                return
            except Exception:
                continue
    try:
        g = page.get_by_role("button", name="ΣΥΜΦΩΝΩ").first
        if g.count():
            g.click(timeout=800)
            page.wait_for_timeout(200)
    except Exception:
        pass


def cmd_bootstrap(state_path: Path) -> None:
    _ensure_playwright_browser_path()
    state_path = state_path.resolve()
    state_path.parent.mkdir(parents=True, exist_ok=True)
    profile_dir = browser_profile_dir(state_path)

    log.info(
        "Bootstrap · persistent profile: %s · state: %s",
        profile_dir,
        state_path,
    )
    _boot_args = list(CHROMIUM_STEALTH_ARGS) + list(BOOTSTRAP_CHROMIUM_EXTRA_ARGS)
    with sync_playwright() as p:
        try:
            context = p.chromium.launch_persistent_context(
                user_data_dir=str(profile_dir),
                channel=None,
                headless=False,
                locale=BROWSER_LOCALE,
                viewport=BROWSER_VIEWPORT,
                args=_boot_args,
                ignore_default_args=CHROMIUM_IGNORE_DEFAULT_ARGS,
            )
        except Exception as e:
            log.warning(
                "Bundled Chromium απέτυχε (%s) — δοκιμή με channel=chrome…",
                e,
            )
            context = p.chromium.launch_persistent_context(
                user_data_dir=str(profile_dir),
                channel="chrome",
                headless=False,
                locale=BROWSER_LOCALE,
                viewport=BROWSER_VIEWPORT,
                args=_boot_args,
                ignore_default_args=CHROMIUM_IGNORE_DEFAULT_ARGS,
            )
        context.add_init_script(BOOTSTRAP_STEALTH_INIT)
        page = context.pages[0] if context.pages else context.new_page()
        try:
            page.goto(f"https://www.{HOST}/", wait_until="domcontentloaded", timeout=120_000)
        except PlaywrightTimeoutError as e:
            log.error("Timeout ανοίγματος αρχικής (120s): %s", e, exc_info=True)
            context.close()
            raise SystemExit(1) from e
        except PlaywrightError as e:
            log.error("Σφάλμα φόρτωσης αρχικής: %s", e, exc_info=True)
            context.close()
            raise SystemExit(1) from e
        page.wait_for_timeout(800)
        dismiss_cmp_consent_bootstrap(page)
        log.info(
            "Άνοιξε το Chrome. Λύσε το captcha αν εμφανιστεί, "
            "μετά πήγαινε στη σελίδα αναζήτησης (φίλτρα, περιοχή κ.λπ.)."
        )
        log.info(
            "Όταν βλέπεις κανονικά αποτελέσματα, γύρνα εδώ και πάτα Enter για αποθήκευση session."
        )
        try:
            input()
        except EOFError:
            log.warning("Χωρίς TTY· αποθήκευση τωρινής κατάστασης…")
        try:
            context.storage_state(path=str(state_path))
        except OSError as e:
            log.error(
                "Αποτυχία αποθήκευσης session σε %s: %s",
                state_path,
                e,
                exc_info=True,
            )
            context.close()
            raise
        context.close()
    log.info("Αποθηκεύτηκε session: %s", state_path)


async def _nudge_mouse_in_viewport(page: Page) -> None:
    vp = page.viewport_size
    if not vp:
        return
    w, h = int(vp["width"]), int(vp["height"])
    if w < 120 or h < 120:
        return
    x = random.randint(40, max(41, w - 40))
    y = random.randint(40, max(41, h - 40))
    await page.mouse.move(x, y, steps=random.randint(5, 22))
    if random.random() < 0.35:
        x2 = max(20, min(w - 20, x + random.randint(-120, 120)))
        y2 = max(20, min(h - 20, y + random.randint(-80, 80)))
        await page.mouse.move(x2, y2, steps=random.randint(8, 28))


async def human_delay_before_navigation(page: Page, *, human_like: bool) -> None:
    """Μικρή τυχαία παύση πριν από goto (δεν φαίνεται σαν burst αιτημάτων)."""
    if not human_like:
        return
    await page.wait_for_timeout(random.randint(90, 620))
    if random.random() < 0.22:
        await page.wait_for_timeout(random.randint(150, 950))


async def humanize_after_navigation(
    page: Page,
    base_ms: int,
    *,
    human_like: bool,
    scroll: bool = True,
) -> None:
    """Μετά από goto: jitter + scroll + mouse · σπάνια μεγαλύτερη «ανάγνωση»."""
    if not human_like:
        if base_ms > 0:
            await page.wait_for_timeout(base_ms)
        return

    await page.wait_for_timeout(random.randint(100, 480))

    if scroll:
        try:
            await _nudge_mouse_in_viewport(page)
        except Exception:
            pass
        for _ in range(random.randint(4, 10)):
            try:
                await page.mouse.wheel(0, random.randint(45, 340))
            except Exception:
                break
            await page.wait_for_timeout(random.randint(35, 220))
        if random.random() < 0.34:
            try:
                await page.mouse.wheel(0, -random.randint(70, 420))
            except Exception:
                pass
            await page.wait_for_timeout(random.randint(70, 260))

    if random.random() < 0.14:
        await page.wait_for_timeout(random.randint(650, 2800))

    ref = base_ms if base_ms > 0 else random.randint(380, 1100)
    spread = random.uniform(0.42, 1.58)
    lo = max(80, int(ref * spread * 0.55))
    hi = max(lo + 50, int(ref * spread))
    await page.wait_for_timeout(random.randint(lo, hi))


async def human_pause_between_actions(page: Page, base_ms: int, *, human_like: bool) -> None:
    """Τυχαία παύση μεταξύ αγγελιών · που και που πιο μακριά."""
    if not human_like:
        if base_ms > 0:
            await page.wait_for_timeout(base_ms)
        return
    ref = base_ms if base_ms > 0 else random.randint(260, 780)
    lo = max(70, int(ref * random.uniform(0.32, 0.72)))
    hi = max(lo + 45, int(ref * random.uniform(1.1, 1.72)))
    await page.wait_for_timeout(random.randint(lo, hi))
    if random.random() < 0.12:
        await page.wait_for_timeout(random.randint(480, 2400))
    if random.random() < 0.025:
        await page.wait_for_timeout(random.randint(1800, 4200))


def _ensure_playwright_browser_path() -> None:
    p = ROOT / ".playwright-browsers"
    if p.is_dir():
        import os

        os.environ.setdefault("PLAYWRIGHT_BROWSERS_PATH", str(p))


def browser_profile_dir(storage_path: Path) -> Path:
    """
    Persistent profile εκτός φακέλου project: το Chromium συχνά κρασάρει αν το
    user-data-dir έχει κενά στο path (π.χ. «full scrape spitia»).
    Ένα hash ανά ROOT ώστε διαφορετικά clones να μην μοιράζονται profile.
    """
    key = hashlib.sha256(str(ROOT.resolve()).encode("utf-8")).hexdigest()[:16]
    d = Path.home() / ".spiti24_scrape" / key / "browser_profile"
    d.mkdir(parents=True, exist_ok=True)
    return d


def profile_dir_populated(profile_dir: Path) -> bool:
    if not profile_dir.is_dir():
        return False
    try:
        return any(profile_dir.iterdir())
    except OSError:
        return False


async def open_scrape_browser_context(
    p: Any,
    args: argparse.Namespace,
    storage: Path,
    profile_dir: Path,
    *,
    use_profile: bool,
) -> tuple[BrowserContext, Browser | None]:
    """
    Ίδιο persistent Chrome profile με το --bootstrap → πιο σταθερό trust από hCaptcha.
    Αλλιώς νέο browser + storage JSON (λιγότερο «ιδίωμα» με το bootstrap).
    """
    _pc_base = dict(
        user_data_dir=str(profile_dir),
        headless=args.headless,
        locale=BROWSER_LOCALE,
        viewport=BROWSER_VIEWPORT,
        user_agent=LISTING_USER_AGENT,
        args=CHROMIUM_STEALTH_ARGS,
        ignore_default_args=CHROMIUM_IGNORE_DEFAULT_ARGS,
    )
    if use_profile:
        try:
            context = await p.chromium.launch_persistent_context(
                **_pc_base,
                channel="chrome" if args.chrome_channel else None,
            )
        except Exception:
            context = await p.chromium.launch_persistent_context(**_pc_base)
        await context.add_init_script(STEALTH_INIT)
        return context, None

    _launch_kw = dict(
        headless=args.headless,
        args=CHROMIUM_STEALTH_ARGS,
        ignore_default_args=CHROMIUM_IGNORE_DEFAULT_ARGS,
    )
    try:
        browser = await p.chromium.launch(
            **_launch_kw,
            channel="chrome" if args.chrome_channel else None,
        )
    except Exception:
        browser = await p.chromium.launch(**_launch_kw)
    context = await browser.new_context(
        storage_state=str(storage),
        user_agent=LISTING_USER_AGENT,
        locale=BROWSER_LOCALE,
        viewport=BROWSER_VIEWPORT,
    )
    await context.add_init_script(STEALTH_INIT)
    return context, browser


def sanitize_fs_name(name: str | None, max_len: int = 100) -> str:
    if not name or not str(name).strip():
        return "unknown"
    s = str(name).strip()
    s = re.sub(r'[\\/:*?"<>|]+', "_", s)
    s = re.sub(r"\s+", " ", s)
    s = s[:max_len].strip()
    return s or "unknown"


def same_allowed_host(url: str) -> bool:
    try:
        h = urlparse(url).netloc.lower().removeprefix("www.")
        return h == "spiti24.gr"
    except Exception:
        return False


def listing_id_from_url(url: str) -> str | None:
    p = urlparse(url)
    parts = [x for x in p.path.split("/") if x]
    if not parts:
        return None
    last = parts[-1]
    if not last.isdigit() or len(last) < 7:
        return None
    if "mesitiko-grafeio" in parts:
        return None
    return last


def normalize_internal_url(base: str, href: str) -> str | None:
    if not href or href.startswith(("#", "javascript:", "mailto:", "tel:")):
        return None
    full = urljoin(base, href)
    p = urlparse(full)
    if p.scheme not in ("http", "https"):
        return None
    if not same_allowed_host(full):
        return None
    # strip fragments
    return p._replace(fragment="").geturl()


def extract_hrefs_from_html(html: str, base_url: str) -> set[str]:
    out: set[str] = set()
    soup = BeautifulSoup(html, "html.parser")
    for a in soup.find_all("a", href=True):
        u = normalize_internal_url(base_url, a["href"])
        if u:
            out.add(u)
    return out


def canonical_listing_url(url: str) -> str | None:
    lid = listing_id_from_url(url)
    if not lid:
        return None
    return f"https://www.spiti24.gr/{lid}"


def extract_listing_urls_from_search_results_html(html: str) -> set[str]:
    """Χρησιμοποιεί τη δομή search-results (property + data-targeturl + links)."""
    soup = BeautifulSoup(html, "html.parser")
    found: set[str] = set()
    for el in soup.select(".property[data-targeturl]"):
        raw = (el.get("data-targeturl") or "").strip()
        c = canonical_listing_url(raw)
        if c:
            found.add(c)
    scope = soup.select_one("#results-container") or soup.select_one(".property-listing--results")
    if scope:
        for a in scope.select("a[href]"):
            href = re.sub(r"\s+", "", (a.get("href") or "").strip())
            if not href or href.startswith("#"):
                continue
            c = canonical_listing_url(urljoin("https://www.spiti24.gr/", href))
            if c:
                found.add(c)
    for a in soup.select(".expertAgentBox a[href]"):
        href = re.sub(r"\s+", "", (a.get("href") or "").strip())
        c = canonical_listing_url(urljoin("https://www.spiti24.gr/", href))
        if c:
            found.add(c)
    return found


def parse_search_region_label(html: str) -> str | None:
    soup = BeautifulSoup(html, "html.parser")
    h1 = soup.select_one("h1.search-results__title")
    if h1:
        text = h1.get_text(" ", strip=True)
        for pat in (
            r"στην\s+περιοχή\s+(.+)$",
            r"in\s+the\s+area\s+(.+)$",
        ):
            m = re.search(pat, text, flags=re.IGNORECASE | re.UNICODE)
            if m:
                return m.group(1).strip()
    sel = soup.select_one("#property__breadcrumbs li.breadcrumbs-selected a")
    if sel:
        t = sel.get_text(strip=True)
        if t and t != "Επίλεξε περιοχή":
            return t
    area_sel = soup.select_one("#area") or soup.find("select", attrs={"name": "areaIDs[]"})
    if area_sel:
        area_opt = area_sel.find("option", selected=True)
        if area_opt:
            t = (area_opt.get("title") or area_opt.get_text(strip=True) or "").strip()
            if t:
                t = re.sub(r"\s*\([^)]*\)\s*$", "", t).strip() or t
                return t
    return None


def parse_search_results_total_listings(html: str) -> int | None:
    """Αριθμός αγγελιών από #numResultsTop (π.χ. 21.084 → 21084)."""
    soup = BeautifulSoup(html, "html.parser")
    el = soup.select_one("#numResultsTop")
    if not el:
        return None
    text = el.get_text(strip=True)
    digits = re.sub(r"[^\d]", "", text)
    if not digits:
        return None
    return int(digits)


def parse_max_page_from_href_scan(html: str) -> int | None:
    """Μέγιστο page= σε links (desktop pagination). Στο mobile συχνά ≤2 — μην το εμπιστεύεσαι μόνο του."""
    soup = BeautifulSoup(html, "html.parser")
    nums: list[int] = []
    for a in soup.find_all("a", href=True):
        h = (a.get("href") or "").strip()
        if "page=" not in h:
            continue
        if "spiti24.gr" not in h and not h.startswith("/"):
            continue
        m = re.search(r"[?&]page=(\d+)", h)
        if m:
            nums.append(int(m.group(1)))
    return max(nums) if nums else None


def parse_search_results_last_page(
    html: str,
    *,
    listings_per_page_guess: int = 24,
) -> int:
    """
    Τελευταία σελίδα: (1) li.last desktop, (2) εκτίμηση από #numResultsTop,
    (3) μέγιστο page= στα links. Το (2) πριν το (3) γιατί στο mobile το (3) δίνει μόνο 2.
    """
    soup = BeautifulSoup(html, "html.parser")
    ul = soup.select_one("ul#pagination-list") or soup.select_one("ul.pagination#pagination-list")
    if not ul:
        ul = soup.select_one("ul.pagination")
    if ul:
        last_a = ul.select_one("li.last a[href]")
        if last_a and last_a.get("href"):
            m = re.search(r"page=(\d+)", last_a["href"])
            if m:
                return max(1, int(m.group(1)))

    total = parse_search_results_total_listings(html)
    if total is not None and total > 0 and listings_per_page_guess > 0:
        return max(1, math.ceil(total / listings_per_page_guess))

    mx = parse_max_page_from_href_scan(html)
    if mx is not None and mx >= 1:
        return mx
    return 1


def search_url_with_page(base_url: str, page: int) -> str:
    p = urlparse(base_url.strip())
    q = parse_qs(p.query, keep_blank_values=True)
    for k in list(q.keys()):
        if k.lower() == "page":
            del q[k]
    if page > 1:
        q["page"] = [str(page)]
    new_q = urlencode(q, doseq=True)
    return urlunparse((p.scheme or "https", p.netloc, p.path, p.params, new_q, ""))


async def collect_listings_from_search_pages(
    page: Page,
    search_url: str,
    delay_ms: int,
    max_search_pages: int | None,
    listings_per_page_guess: int = 24,
    *,
    human_like: bool = True,
    search_page_start: int = 1,
    search_page_end: int = 0,
) -> tuple[set[str], str | None]:
    """Φορτώνει σελίδες pagination για ένα URL αποτελεσμάτων.

    search_page_start / search_page_end: 1-based inclusive. search_page_end==0 → έως τέλος
    (με όριο max_search_pages). Αρχικά φορτώνεται πάντα η σελίδα 1 για region + εκτίμηση pagination.
    """
    url = search_url.strip()
    p = urlparse(url)
    if not p.scheme:
        url = "https://" + url.lstrip("/")
        p = urlparse(url)
    q = parse_qs(p.query, keep_blank_values=True)
    q.pop("page", None)
    normalized = urlunparse(
        (p.scheme or "https", p.netloc, p.path, p.params, urlencode(q, doseq=True), "")
    )
    listing_urls: set[str] = set()

    first_url = search_url_with_page(normalized, 1)
    await human_delay_before_navigation(page, human_like=human_like)
    await page.goto(first_url, wait_until="domcontentloaded", timeout=90000)
    await humanize_after_navigation(page, delay_ms, human_like=human_like, scroll=True)
    html = await page.content()
    region_hint = parse_search_region_label(html)
    last_discovered = parse_search_results_last_page(
        html, listings_per_page_guess=listings_per_page_guess
    )
    first_batch = extract_listing_urls_from_search_results_html(html)

    hard_cap = max_search_pages if max_search_pages is not None else 10_000
    user_end = search_page_end if search_page_end > 0 else None
    page_start = max(1, search_page_start)

    is_mobile_pagination = last_discovered <= 1 and len(first_batch) >= 18

    if is_mobile_pagination:
        eff_end = hard_cap
        if user_end is not None:
            eff_end = min(eff_end, user_end)
        if page_start > eff_end:
            log.info(
                "Κενό εύρος σελίδων αναζήτησης: από %s έως %s (mobile pagination).",
                page_start,
                eff_end,
            )
            return set(), region_hint
        if page_start == 1:
            listing_urls |= first_batch
        pn = max(2, page_start)
        while pn <= eff_end:
            u = search_url_with_page(normalized, pn)
            await human_delay_before_navigation(page, human_like=human_like)
            await page.goto(u, wait_until="domcontentloaded", timeout=90000)
            await humanize_after_navigation(page, delay_ms, human_like=human_like, scroll=True)
            batch = extract_listing_urls_from_search_results_html(await page.content())
            if not batch:
                break
            before = len(listing_urls)
            listing_urls |= batch
            if len(listing_urls) == before:
                break
            pn += 1
        return listing_urls, region_hint

    eff_end = min(last_discovered, hard_cap)
    if user_end is not None:
        eff_end = min(eff_end, user_end)
    if page_start > eff_end:
        log.info(
            "Κενό εύρος σελίδων αναζήτησης: από %s έως %s (τελευταία γνωστή %s).",
            page_start,
            eff_end,
            last_discovered,
        )
        return set(), region_hint

    if page_start == 1:
        listing_urls |= first_batch

    for pn in range(max(2, page_start), eff_end + 1):
        u = search_url_with_page(normalized, pn)
        await human_delay_before_navigation(page, human_like=human_like)
        await page.goto(u, wait_until="domcontentloaded", timeout=90000)
        await humanize_after_navigation(page, delay_ms, human_like=human_like, scroll=True)
        listing_urls |= extract_listing_urls_from_search_results_html(await page.content())

    return listing_urls, region_hint


async def collect_urls_from_sitemap(context: BrowserContext) -> set[str]:
    found: set[str] = set()
    for path in ("/sitemap.xml", "/sitemap_index.xml", "/sitemap-index.xml"):
        url = f"https://www.spiti24.gr{path}"
        try:
            r = await context.request.get(url, timeout=60000)
            if r.status != 200:
                continue
            text = await r.text()
        except Exception:
            continue
        for loc in re.findall(r"<loc>\s*([^<]+)\s*</loc>", text, re.I):
            loc = loc.strip()
            if same_allowed_host(loc):
                found.add(loc)
        # sitemap index: recurse one level
        if "sitemapindex" in text.lower() or "sitemap-index" in path:
            for sub in re.findall(r"<loc>\s*([^<]+)\s*</loc>", text, re.I):
                sub = sub.strip()
                if not sub.endswith(".xml"):
                    continue
                try:
                    r2 = await context.request.get(sub, timeout=60000)
                    if r2.status == 200:
                        t2 = await r2.text()
                        for loc2 in re.findall(r"<loc>\s*([^<]+)\s*</loc>", t2, re.I):
                            loc2 = loc2.strip()
                            if same_allowed_host(loc2):
                                found.add(loc2)
                except Exception:
                    pass
    return found


async def crawl_discover_listing_urls(
    page: Page,
    seeds: list[str],
    max_pages: int,
    delay_ms: int,
    *,
    human_like: bool = True,
) -> set[str]:
    visited: set[str] = set()
    queue: list[str] = []
    listing_urls: set[str] = set()

    for s in seeds:
        if s not in visited:
            queue.append(s)

    while queue and len(visited) < max_pages:
        url = queue.pop(0)
        if url in visited:
            continue
        visited.add(url)
        lid = listing_id_from_url(url)
        if lid:
            listing_urls.add(url)
            continue
        try:
            await human_delay_before_navigation(page, human_like=human_like)
            await page.goto(url, wait_until="domcontentloaded", timeout=90000)
            await humanize_after_navigation(page, delay_ms, human_like=human_like, scroll=True)
            html = await page.content()
        except Exception:
            continue
        for nxt in extract_hrefs_from_html(html, page.url):
            if nxt not in visited:
                if listing_id_from_url(nxt):
                    listing_urls.add(nxt)
                elif nxt not in queue:
                    queue.append(nxt)
    return listing_urls


async def extract_json_ld(page: Page) -> list[Any]:
    return await page.evaluate(
        """() => {
          const out = [];
          document.querySelectorAll('script[type="application/ld+json"]').forEach(s => {
            try { out.push(JSON.parse(s.textContent)); } catch (e) {}
          });
          return out;
        }"""
    )


def pick_from_jsonld(blocks: list[Any]) -> dict[str, Any]:
    info: dict[str, Any] = {}
    for b in blocks:
        items = b if isinstance(b, list) else [b]
        for item in items:
            if not isinstance(item, dict):
                continue
            t = item.get("@type")
            types = t if isinstance(t, list) else ([t] if t else [])
            if any(
                str(x).lower() in ("realestatelisting", "product", "apartment", "house", "offer")
                for x in types
            ) or "offers" in item or "floorSize" in item:
                for k in (
                    "name",
                    "description",
                    "url",
                    "image",
                    "offers",
                    "address",
                    "floorSize",
                    "numberOfRooms",
                ):
                    if k in item and k not in info:
                        info[k] = item[k]
    return info


# Σελίδα λεπτομερειών: .property__main (τίτλος, πίνακας, amenities, χάρτης, μεσιτικό)
LISTING_DOM_DETAIL_JS = r"""() => {
  const tnorm = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const out = {};

  const h1 = document.querySelector('.property__top__heading h1');
  if (h1) out.listing_headline = tnorm(h1.innerText);

  const feats = [];
  document.querySelectorAll('.property__top__features li').forEach((li) => {
    feats.push(tnorm(li.innerText));
  });
  if (feats.length) out.listing_features = feats;

  const priceEl = document.querySelector('.property__top__price span.price');
  if (priceEl) out.price_display = tnorm(priceEl.innerText);

  const extraRoot = document.querySelector('.property__main ul.property__extrainfo');
  const extra2 = {};
  if (extraRoot) {
    extraRoot.querySelectorAll(':scope > li').forEach((li) => {
      const sp = li.querySelector(':scope > span');
      if (!sp) return;
      const clone = li.cloneNode(true);
      clone.querySelectorAll('span').forEach((s) => s.remove());
      let k = tnorm(clone.innerText).replace(/:\s*$/, '');
      if (k) extra2[k] = tnorm(sp.innerText);
    });
  }
  if (Object.keys(extra2).length) out.extrainfo = extra2;

  const descEl = document.querySelector('.property__section--desc .property__section__content');
  if (descEl) {
    const raw = descEl.innerText.trim();
    if (raw.length > 80) out.description_text = raw;
  }

  const details = {};
  document.querySelectorAll('.property__section--features table.table tbody tr').forEach((tr) => {
    const th = tr.querySelector('th');
    const td = tr.querySelector('td');
    if (th && td) {
      const cloneTd = td.cloneNode(true);
      cloneTd.querySelectorAll('script, style').forEach((x) => x.remove());
      details[tnorm(th.innerText)] = tnorm(cloneTd.innerText);
    }
  });
  if (Object.keys(details).length) out.property_details = details;

  const amenities = [];
  document.querySelectorAll('ul.property__amenities li').forEach((li) => {
    const on = !li.classList.contains('off');
    const sub = li.querySelector(':scope > span');
    let name;
    if (sub) {
      const clone = li.cloneNode(true);
      clone.querySelectorAll('span').forEach((s) => s.remove());
      name = tnorm(clone.innerText);
      name = name ? name + ' ' + tnorm(sub.innerText) : tnorm(sub.innerText);
    } else {
      name = tnorm(li.innerText);
    }
    if (name) amenities.push({ name, on });
  });
  if (amenities.length) out.amenities = amenities;

  const marker = document.querySelector('.property__map .marker[data-lat][data-lng]');
  if (marker) {
    const lat = parseFloat(marker.getAttribute('data-lat'));
    const lng = parseFloat(marker.getAttribute('data-lng'));
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      out.coordinates = {
        lat,
        lng,
        type: marker.getAttribute('data-type'),
      };
    }
  }

  const agentA = document.querySelector('.agent-box h3.nobg a, .agent-box__top h3 a');
  if (agentA) {
    out.agency_name_dom = tnorm(agentA.innerText);
    out.agency_profile_url = agentA.href || null;
  } else {
    const img = document.querySelector('.agent-box__top img[alt], .agent-box img[alt*="μεσιτικό"]');
    if (img && img.alt) {
      out.agency_name_dom = tnorm(img.alt.replace(/\s*μεσιτικό\s+γραφείο\s*/gi, ''));
    }
  }

  const listingInput = document.querySelector('input[name="listingId"][value]');
  if (listingInput && listingInput.value) out.form_listing_id = listingInput.value.trim();

  const mapBlurb = document.querySelector('.property__section--map p.property__extrainfo');
  if (mapBlurb) out.location_map_blurb = tnorm(mapBlurb.innerText);

  return out;
}"""


# Canonical, og/meta, video, body text, marker title, agent block
LISTING_PAGE_EXTRA_JS = r"""() => {
  const tnorm = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const out = {};

  const c = document.querySelector('link[rel="canonical"]');
  if (c && c.href) out.canonical_url = c.href.trim();

  const og = {};
  document.querySelectorAll('meta[property]').forEach((m) => {
    const p = m.getAttribute('property');
    const v = m.getAttribute('content');
    if (p && v != null && (p.startsWith('og:') || p.startsWith('fb:'))) og[p] = v;
  });
  if (Object.keys(og).length) out.og = og;

  const meta_tags = {};
  document.querySelectorAll('meta[name]').forEach((m) => {
    const n = m.getAttribute('name');
    const v = m.getAttribute('content');
    if (n && v != null) meta_tags[n] = v;
  });
  if (Object.keys(meta_tags).length) out.meta_tags = meta_tags;

  const ifr = document.querySelector('iframe[src*="youtube"], iframe[src*="youtu.be"]');
  if (ifr && ifr.src) out.video_url = ifr.src.trim();

  const main =
    document.querySelector('.property__main') ||
    document.querySelector('main') ||
    document.body;
  if (main) {
    const bt = main.innerText || '';
    if (bt.length > 50) out.body_text = tnorm(bt);
  }

  const marker = document.querySelector('.property__map .marker[data-lat]');
  if (marker) {
    const t = marker.getAttribute('title') || marker.getAttribute('data-title');
    if (t) out.map_marker_title = tnorm(t);
  }

  const agent = {};
  const box = document.querySelector('.agent-box');
  const logo = document.querySelector(
    '.agent-box__top img[src], .agent-box img[src*="spitogatos"], .agent-box__top img[alt]'
  );
  if (logo) {
    if (logo.src) agent.logo_url = logo.src.trim();
    if (logo.alt) agent.logo_alt = tnorm(logo.alt);
  }
  const h3a = document.querySelector('.agent-box h3.nobg a, .agent-box__top h3 a, .agent-box h3 a');
  if (h3a) {
    agent.office_name = tnorm(h3a.innerText);
    if (h3a.href) agent.office_url = h3a.href.trim();
  }
  if (box) {
    const strong = box.querySelector('strong, .agent-name, [itemprop="name"]');
    if (strong) {
      const cp = tnorm(strong.innerText);
      if (cp && cp.length < 120) agent.contact_person = cp;
    }
    const phoneA = box.querySelector('a[href*="emfanisi-tilefonou"], a[href*="tilefon"]');
    if (phoneA) {
      agent.phone_button_text = tnorm(phoneA.innerText);
      if (phoneA.href) agent.phone_action_url = phoneA.href.trim();
    }
    const ps = [];
    box.querySelectorAll('p').forEach((p) => {
      const t = tnorm(p.innerText);
      if (!t || t.length > 400) return;
      if (/Υποβάλλοντας|όρους χρήσης|πολιτική απορρήτου|Spiti24\.gr/i.test(t)) return;
      ps.push(t);
    });
    if (ps.length) {
      const addrCandidate = ps.find((t) => /,/.test(t) || /\b\d{5}\b/.test(t));
      agent.address = addrCandidate || ps[0];
    }
  }
  if (Object.keys(agent).length) out.agent_dom = agent;

  return out;
}"""


def is_property_photo_url(url: str) -> bool:
    if not url or not url.startswith("http"):
        return False
    low = url.lower()
    if "a-cdn.net/tiles" in low or "/tiles/spitogatos" in low:
        return False
    if re.search(r"_100x50\b|_50x100\b|100x50\.", low):
        return False
    if any(x in low for x in ("favicon", "pixel", "1x1")):
        return False
    if not re.search(r"\.(jpe?g|png|webp|gif)(\?|$)", low):
        return False
    return True


def amenities_list_to_dict(amenities: Any) -> dict[str, Any]:
    out: dict[str, Any] = {}
    if not isinstance(amenities, list):
        return out
    for item in amenities:
        if not isinstance(item, dict):
            continue
        name = str(item.get("name") or "").strip()
        if not name:
            continue
        on = bool(item.get("on"))
        if ":" in name:
            key, _, rest = name.partition(":")
            key, val = key.strip(), rest.strip()
            if key and val:
                out[key] = val if on else False
                continue
        out[name] = on
    return out


def build_listing_export(
    info: dict[str, Any],
    image_files: list[str],
    *,
    image_urls: list[str] | None = None,
) -> dict[str, Any]:
    """Μορφή εξόδου παρόμοια με ενιαίο JSON αγγελίας (title, agent, og, characteristics, …)."""
    pd = info.get("property_details")
    characteristics: dict[str, Any] = dict(pd) if isinstance(pd, dict) else {}
    features: dict[str, Any] = deepcopy(characteristics)

    coords = info.get("coordinates")
    if not isinstance(coords, dict):
        coords = {}
    lat, lng = coords.get("lat"), coords.get("lng")
    lat_s = str(lat) if lat is not None else ""
    lng_s = str(lng) if lng is not None else ""
    map_type = str(coords.get("type") or "").strip()

    og = dict(info.get("og") or {})
    meta = dict(info.get("meta_tags") or {})
    meta_description = (
        str(meta.get("description") or "").strip()
        or str(og.get("og:description") or "").strip()
    )

    ad = info.get("agent_dom")
    if not isinstance(ad, dict):
        ad = {}
    agent: dict[str, Any] = {}
    if ad.get("logo_url"):
        agent["logo_url"] = ad["logo_url"]
    if ad.get("logo_alt"):
        agent["logo_alt"] = ad["logo_alt"]
    oname = ad.get("office_name") or info.get("agency_name")
    if oname:
        agent["office_name"] = str(oname).strip()
    ourl = ad.get("office_url") or info.get("agency_profile_url")
    if ourl:
        agent["office_url"] = str(ourl).strip()
    if ad.get("address"):
        agent["address"] = ad["address"]
    if ad.get("contact_person"):
        agent["contact_person"] = ad["contact_person"]
    if ad.get("phone_button_text"):
        agent["phone_button_text"] = ad["phone_button_text"]
    if ad.get("phone_action_url"):
        agent["phone_action_url"] = ad["phone_action_url"]

    imgs = (
        list(image_urls)
        if image_urls is not None
        else [u for u in (info.get("images") or []) if is_property_photo_url(u)]
    )

    title = (
        str(info.get("listing_headline") or "").strip()
        or str(info.get("page_title") or "").strip()
    )
    desc = str(info.get("description") or "").strip()

    lid = str(info.get("listing_id") or "").strip()
    page_url = str(info.get("url") or "").strip()
    canon = str(info.get("canonical_url") or "").strip() or page_url

    return {
        "url": page_url,
        "listing_id": lid,
        "agency_page": info.get("agency_profile_url"),
        "title": title,
        "meta_description": meta_description,
        "description": desc,
        "body_text": str(info.get("body_text") or "").strip(),
        "scraped_at": datetime.now(timezone.utc).isoformat(),
        "canonical_url": canon,
        "price_text": info.get("price_display"),
        "video_url": info.get("video_url"),
        "location_summary": str(
            info.get("location_map_blurb")
            or info.get("address_detail")
            or ""
        ).strip(),
        "latitude": lat_s,
        "longitude": lng_s,
        "map_marker_type": map_type,
        "map_marker_title": str(info.get("map_marker_title") or "").strip(),
        "agent": agent,
        "og": og,
        "meta": meta,
        "characteristics": characteristics,
        "features": features,
        "extrainfo": dict(info.get("extrainfo") or {}),
        "amenities": amenities_list_to_dict(info.get("amenities")),
        "json_ld": info.get("json_ld") if isinstance(info.get("json_ld"), list) else [],
        "image_urls": imgs,
        "image_files": image_files,
    }


def merge_listing_dom_into_data(data: dict[str, Any], dom: Any) -> None:
    if not isinstance(dom, dict):
        return
    copy_keys = (
        "listing_headline",
        "listing_features",
        "price_display",
        "extrainfo",
        "property_details",
        "amenities",
        "coordinates",
        "agency_profile_url",
        "form_listing_id",
        "location_map_blurb",
    )
    for k in copy_keys:
        if k in dom and dom[k] is not None:
            data[k] = dom[k]
    desc = dom.get("description_text")
    if isinstance(desc, str) and len(desc) > 80:
        data["description"] = desc
    if dom.get("agency_name_dom"):
        data["agency_name"] = str(dom["agency_name_dom"]).strip()
    pd = dom.get("property_details")
    if isinstance(pd, dict):
        area = pd.get("Περιοχή")
        if area and not data.get("city"):
            data["city"] = area
        addr = pd.get("Διεύθυνση")
        if addr:
            data.setdefault("address_detail", addr)


async def scrape_listing_fields(
    page: Page,
    listing_url: str,
    *,
    city_folder_hint: str | None = None,
    post_load_delay_ms: int = 800,
    human_like: bool = True,
) -> dict[str, Any]:
    await human_delay_before_navigation(page, human_like=human_like)
    await page.goto(listing_url, wait_until="domcontentloaded", timeout=90000)
    await humanize_after_navigation(
        page, post_load_delay_ms, human_like=human_like, scroll=True
    )

    data: dict[str, Any] = {
        "url": page.url,
        "listing_id": listing_id_from_url(page.url),
    }

    blocks = await extract_json_ld(page)
    data["json_ld"] = blocks
    data.update(pick_from_jsonld(blocks))

    # City / area: address from JSON-LD
    addr = data.get("address")
    if isinstance(addr, dict):
        data["city"] = addr.get("addressLocality") or addr.get("addressRegion")
        data["street"] = addr.get("streetAddress")
        data["postal_code"] = addr.get("postalCode")
    elif isinstance(addr, str):
        data["city"] = addr

    # Agency / broker
    for key in ("seller", "provider", "brand"):
        for block in blocks:
            if isinstance(block, dict) and key in block:
                v = block[key]
                if isinstance(v, dict):
                    data.setdefault("agency_name", v.get("name"))
                break

    # Title / description from meta / h1
    title = await page.title()
    if title and "Pardon" not in title:
        data.setdefault("page_title", title)

    try:
        og_loc = page.locator('meta[property="og:description"]')
        if await og_loc.count() > 0:
            og_desc = await og_loc.first.get_attribute("content")
            if og_desc:
                data.setdefault("description", og_desc)
    except Exception:
        pass

    try:
        dom_detail = await page.evaluate(LISTING_DOM_DETAIL_JS)
        merge_listing_dom_into_data(data, dom_detail)
    except Exception:
        pass

    try:
        extra = await page.evaluate(LISTING_PAGE_EXTRA_JS)
        if isinstance(extra, dict):
            for k in (
                "canonical_url",
                "video_url",
                "body_text",
                "map_marker_title",
                "og",
                "meta_tags",
                "agent_dom",
            ):
                if extra.get(k) is not None:
                    data[k] = extra[k]
    except Exception:
        pass

    # Heuristic: visible lines that look like office name (often in header)
    try:
        agency_el = await page.query_selector(
            'a[href*="mesitiko-grafeio"], [class*="office"], [class*="agency"], [class*="mesit"]'
        )
        if agency_el and not data.get("agency_name"):
            txt = (await agency_el.inner_text() or "").strip()
            if txt and len(txt) < 200:
                data["agency_name"] = txt
    except Exception:
        pass

    # Images: πρώτα γκαλερί λεπτομερούς (href → συνήθως 1600x1200), όχι fake slides
    imgs: list[str] = []
    seen: set[str] = set()
    try:
        gallery_urls: list[str] = await page.evaluate(
            r"""() => {
              const out = [];
              const seen = new Set();
              document.querySelectorAll('.property__gallery').forEach((container) => {
                container.querySelectorAll('.property__gallery__thumb a[href]').forEach((a) => {
                  const slide = a.closest('.swiper-slide');
                  if (slide && (slide.classList.contains('fake') || slide.id === 'fake')) return;
                  let h = (a.getAttribute('href') || '').trim();
                  if (!h.startsWith('http')) return;
                  if (!/\.(jpe?g|png|webp|gif)(\?|$)/i.test(h)) return;
                  if (seen.has(h)) return;
                  seen.add(h);
                  out.push(h);
                });
              });
              return out;
            }"""
        )
        for u in gallery_urls:
            if u not in seen:
                seen.add(u)
                imgs.append(u)
    except Exception:
        pass

    # JSON-LD / structured (συμπλήρωση αν λείπουν)
    for im in (data.get("image"),):
        if isinstance(im, str) and im not in seen:
            imgs.insert(0, im)
            seen.add(im)
        elif isinstance(im, list):
            for x in im:
                if isinstance(x, str) and x not in seen:
                    imgs.append(x)
                    seen.add(x)
                elif isinstance(x, dict) and x.get("url"):
                    u = x["url"]
                    if u not in seen:
                        imgs.append(u)
                        seen.add(u)

    # Fallback αν δεν υπάρχει γκαλερί στο DOM
    if not imgs:
        for sel in ('meta[property="og:image"]', "img[src]", 'link[rel="image_src"]'):
            try:
                if "meta" in sel or "link" in sel:
                    els = await page.query_selector_all(sel)
                    for el in els:
                        u = await el.get_attribute("content" if "meta" in sel else "href")
                        if u and u.startswith("http") and u not in seen:
                            seen.add(u)
                            imgs.append(u)
                else:
                    els = await page.query_selector_all("img[src]")
                    for el in els:
                        u = await el.get_attribute("src")
                        if not u:
                            continue
                        full = urljoin(page.url, u)
                        if full in seen or "data:" in full:
                            continue
                        if any(
                            x in full.lower()
                            for x in ("favicon", "logo", "sprite", "pixel", "1x1")
                        ):
                            continue
                        seen.add(full)
                        imgs.append(full)
            except Exception:
                pass

    data["images"] = imgs

    agency = data.get("agency_name") or "unknown_agency"
    data["_folder_agency"] = sanitize_fs_name(str(agency))
    if city_folder_hint and str(city_folder_hint).strip():
        hint = city_folder_hint.strip()
        data["search_region"] = hint
        data["_folder_city"] = sanitize_fs_name(hint)
    else:
        city_val = data.get("city")
        pd = data.get("property_details")
        if isinstance(pd, dict) and not city_val:
            city_val = pd.get("Περιοχή")
        data["_folder_city"] = sanitize_fs_name(str(city_val or "unknown_city"))
    return data


async def download_listing(
    context: BrowserContext,
    page: Page,
    listing_url: str,
    out_root: Path,
    resume: bool,
    city_folder_hint: str | None = None,
    *,
    listing_delay_ms: int = 800,
    human_like: bool = True,
) -> None:
    info = await scrape_listing_fields(
        page,
        listing_url,
        city_folder_hint=city_folder_hint,
        post_load_delay_ms=listing_delay_ms,
        human_like=human_like,
    )
    lid = info.get("listing_id") or "unknown_id"
    city_d = out_root / info["_folder_city"] / info["_folder_agency"] / str(lid)
    city_d.mkdir(parents=True, exist_ok=True)

    listing_json_path = city_d / "listing.json"
    if resume and listing_json_path.is_file():
        return

    photo_urls = [u for u in (info.get("images") or []) if is_property_photo_url(u)]
    image_files: list[str] = []
    image_urls_ok: list[str] = []
    for i, img_url in enumerate(photo_urls, start=1):
        ext = ".jpg"
        low = img_url.split("?")[0].lower()
        if low.endswith(".png"):
            ext = ".png"
        elif low.endswith(".webp"):
            ext = ".webp"
        elif low.endswith(".gif"):
            ext = ".gif"
        dest = city_d / f"photo_{i:03d}{ext}"
        try:
            r = await context.request.get(img_url, timeout=120000)
            if r.status == 200:
                body = await r.body()
                dest.write_bytes(body)
                image_files.append(dest.name)
                image_urls_ok.append(img_url)
        except Exception:
            continue

    export = build_listing_export(info, image_files, image_urls=image_urls_ok)
    with open(listing_json_path, "w", encoding="utf-8") as f:
        json.dump(export, f, ensure_ascii=False, indent=2)
        f.write("\n")


async def run_scrape(args: argparse.Namespace) -> None:
    _ensure_playwright_browser_path()
    storage = Path(args.storage).resolve()
    out_root = Path(args.out)
    out_root.mkdir(parents=True, exist_ok=True)

    profile_dir = browser_profile_dir(storage)
    if args.persistent_profile is None:
        use_profile = profile_dir_populated(profile_dir)
    else:
        use_profile = bool(args.persistent_profile)

    if use_profile and not profile_dir_populated(profile_dir):
        log.warning(
            "Άδειο profile %s — τρέξε --bootstrap. Fallback σε storage JSON.",
            profile_dir,
        )
        use_profile = False

    if not use_profile and not storage.is_file():
        print(
            f"Δεν υπάρχει session αρχείο: {storage}\n"
            "Τρέξε πρώτα: python scrape_spiti24.py --bootstrap",
            file=sys.stderr,
        )
        sys.exit(1)

    if use_profile:
        log.info("Browser: persistent profile %s (ίδιο με bootstrap)", profile_dir)
    else:
        log.info("Browser: νέο Chromium + %s", storage)

    listing_urls: set[str] = set()

    async with async_playwright() as p:
        context, browser = await open_scrape_browser_context(
            p, args, storage, profile_dir, use_profile=use_profile
        )
        page = context.pages[0] if context.pages else await context.new_page()

        try:
            listing_hints: dict[str, str] = {}

            if args.mode == "urls":
                for line in Path(args.urls_file).read_text(encoding="utf-8").splitlines():
                    line = line.strip()
                    if line and not line.startswith("#"):
                        listing_urls.add(line)
            elif args.mode == "search":
                search_urls: list[str] = []
                if args.search_url:
                    search_urls.append(args.search_url.strip())
                suf = args.search_urls_file
                if suf and Path(suf).is_file():
                    for line in Path(suf).read_text(encoding="utf-8").splitlines():
                        line = line.strip()
                        if line and not line.startswith("#"):
                            search_urls.append(line)
                if not search_urls:
                    print(
                        "Με --mode search δώσε --search-url ή γέμισε το --search-urls-file.",
                        file=sys.stderr,
                    )
                    sys.exit(1)
                max_sp = None if args.max_search_pages <= 0 else args.max_search_pages
                for su in search_urls:
                    urls, region = await collect_listings_from_search_pages(
                        page,
                        su,
                        args.delay_ms,
                        max_sp,
                        listings_per_page_guess=args.search_listings_per_page,
                        human_like=args.human_like,
                        search_page_start=args.search_page_from,
                        search_page_end=args.search_page_to,
                    )
                    reg = (region or "").strip()
                    for u in urls:
                        listing_urls.add(u)
                        if u not in listing_hints:
                            listing_hints[u] = reg
            elif args.mode == "sitemap":
                listing_urls = {
                    u for u in await collect_urls_from_sitemap(context) if listing_id_from_url(u)
                }
                if not listing_urls and args.fallback_crawl:
                    listing_urls = await crawl_discover_listing_urls(
                        page,
                        args.seeds or DEFAULT_SEEDS,
                        args.max_pages,
                        args.delay_ms,
                        human_like=args.human_like,
                    )
            else:
                listing_urls = await crawl_discover_listing_urls(
                    page,
                    args.seeds or DEFAULT_SEEDS,
                    args.max_pages,
                    args.delay_ms,
                    human_like=args.human_like,
                )

            listing_urls = sorted(listing_urls)
            print(f"Βρέθηκαν {len(listing_urls)} URL αγγελιών.")

            for i, u in enumerate(listing_urls, 1):
                print(f"[{i}/{len(listing_urls)}] {u}")
                try:
                    hint = listing_hints.get(u) if listing_hints else None
                    if hint == "":
                        hint = None
                    await download_listing(
                        context,
                        page,
                        u,
                        out_root,
                        resume=args.resume,
                        city_folder_hint=hint,
                        listing_delay_ms=(
                            args.delay_ms
                            if args.delay_ms > 0
                            else (800 if not args.human_like else 0)
                        ),
                        human_like=args.human_like,
                    )
                except Exception as e:
                    print(f"  Σφάλμα: {e}", file=sys.stderr)
                await human_pause_between_actions(
                    page, args.delay_ms, human_like=args.human_like
                )
        finally:
            await context.close()
            if browser is not None:
                await browser.close()


def build_arg_parser() -> argparse.ArgumentParser:
    ap = argparse.ArgumentParser(description="Scrape spiti24.gr listings")
    ap.add_argument(
        "--bootstrap",
        action="store_true",
        help="Persistent Chrome + stealth + CMP · αποθήκευση storage state",
    )
    ap.add_argument(
        "--save-session",
        action="store_true",
        help="Συνώνυμο του --bootstrap (συμβατότητα)",
    )
    ap.add_argument("-v", "--verbose", action="store_true", help="Debug logging")
    ap.add_argument("--quiet", action="store_true", help="Λίγα μηνύματα (WARNING+)")
    ap.add_argument("--storage", type=str, default=str(DEFAULT_STORAGE))
    ap.add_argument("--out", type=str, default=str(DEFAULT_OUT))
    ap.add_argument(
        "--mode",
        choices=("sitemap", "crawl", "urls", "search"),
        default="sitemap",
        help="Πώς βρίσκουμε URLs (sitemap, crawl, search αποτελέσματα, αρχείο)",
    )
    ap.add_argument(
        "--search-url",
        type=str,
        default=None,
        help="URL σελίδας αποτελεσμάτων (μαζί με --mode search)",
    )
    ap.add_argument(
        "--search-urls-file",
        type=str,
        default=None,
        help="Ένα URL αναζήτησης ανά γραμμή (optional, με --mode search)",
    )
    ap.add_argument(
        "--max-search-pages",
        type=int,
        default=0,
        help="Όριο τελευταίας σελίδας min(…, N). 0 = εσωτερικό max 10000. Συνδυάζεται με --search-page-to",
    )
    ap.add_argument(
        "--search-page-from",
        type=int,
        default=1,
        metavar="N",
        help="Πρώτη σελίδα αποτελεσμάτων (1-based, default 1). Η σελ.1 φορτώνεται πάντα για metadata.",
    )
    ap.add_argument(
        "--search-page-to",
        type=int,
        default=0,
        metavar="N",
        help="Τελευταία σελίδα inclusive (0 = έως τέλος). Παράδειγμα: 1–100 → --search-page-from 1 --search-page-to 100",
    )
    ap.add_argument(
        "--search-listings-per-page",
        type=int,
        default=24,
        help="Για εκτίμηση τελευταίας σελίδας από #numResultsTop όταν λείπει desktop pagination",
    )
    ap.add_argument("--urls-file", type=str, default="listing_urls.txt")
    ap.add_argument("--seeds", nargs="*", default=None, help="Seed URLs για crawl")
    ap.add_argument("--max-pages", type=int, default=4000)
    ap.add_argument("--delay-ms", type=int, default=400, help="Βάση ms (± jitter αν human-like)")
    ap.add_argument(
        "--no-human-like",
        dest="human_like",
        action="store_false",
        help="Σταθερές αναμονές, χωρίς scroll/mouse jitter",
    )
    ap.set_defaults(human_like=True)
    ap.add_argument("--resume", action="store_true", help="Παράλειψη υπαρχόντων listing.json")
    ap.add_argument("--no-fallback-crawl", action="store_true", help="Όχι crawl αν το sitemap είναι άδειο")
    ap.add_argument("--headed", action="store_true", help="Browser με παράθυρο (αν χρειάζεται captcha ξανά)")
    ap.add_argument(
        "--chrome-channel",
        action="store_true",
        help="Χρήση εγκατεστημένου Google Chrome (αν υπάρχει)",
    )
    pp = ap.add_mutually_exclusive_group()
    pp.add_argument(
        "--persistent-profile",
        dest="persistent_profile",
        action="store_true",
        help="Ανάγκασε ίδιο Chrome profile με το bootstrap (λιγότερο captcha)",
    )
    pp.add_argument(
        "--no-persistent-profile",
        dest="persistent_profile",
        action="store_false",
        help="Πάντα νέο browser + μόνο storage JSON",
    )
    ap.set_defaults(persistent_profile=None)
    return ap


def main() -> None:
    ap = build_arg_parser()
    args = ap.parse_args()
    if args.quiet and args.verbose:
        ap.error("Μη συμβατά: --quiet μαζί με -v/--verbose.")
    configure_logging(verbose=args.verbose, quiet=args.quiet)

    if args.bootstrap or args.save_session:
        cmd_bootstrap(Path(args.storage))
        return
    if args.mode == "search":
        if args.search_page_from < 1:
            ap.error("--search-page-from πρέπει να είναι ≥ 1.")
        if args.search_page_to > 0 and args.search_page_from > args.search_page_to:
            ap.error("--search-page-from δεν μπορεί να είναι μεγαλύτερο από --search-page-to.")
    args.headless = not args.headed
    args.fallback_crawl = not args.no_fallback_crawl
    asyncio.run(run_scrape(args))


if __name__ == "__main__":
    main()
