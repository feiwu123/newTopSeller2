import logging
import os
import re
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from html.parser import HTMLParser
from typing import Dict, List
from urllib.parse import urljoin

import requests


logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class ThumbCacheEntry:
    ts: float
    url: str


_THUMB_CACHE: Dict[str, ThumbCacheEntry] = {}


def _float_env(name: str, default: float) -> float:
    raw = (os.getenv(name, "") or "").strip()
    if not raw:
        return default
    try:
        return float(raw)
    except ValueError:
        return default


def _int_env(name: str, default: int) -> int:
    raw = (os.getenv(name, "") or "").strip()
    if not raw:
        return default
    try:
        return int(raw)
    except ValueError:
        return default


def _bool_env(name: str, default: bool) -> bool:
    raw = (os.getenv(name, "") or "").strip().lower()
    if not raw:
        return default
    return raw in {"1", "true", "yes", "y", "on"}


def _timeout_attempts(connect_timeout: float, read_timeout: float) -> list[tuple[float, float]]:
    attempts = [(connect_timeout, read_timeout)]
    # Some networks need a longer handshake time for upstream.
    if connect_timeout < 20.0:
        attempts.append((20.0, read_timeout))
    return attempts


class _MetaImgParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.og_image: str | None = None
        self.twitter_image: str | None = None
        self.fallback_imgs: List[str] = []

    def handle_starttag(self, tag: str, attrs: List[tuple[str, str | None]]) -> None:
        if tag == "meta":
            d = {k.lower(): (v or "") for k, v in attrs}
            prop = (d.get("property") or d.get("name") or "").strip().lower()
            content = (d.get("content") or "").strip()
            if not content:
                return
            if prop == "og:image" and not self.og_image:
                self.og_image = content
            elif prop == "twitter:image" and not self.twitter_image:
                self.twitter_image = content
            return

        if tag == "img":
            d = {k.lower(): (v or "") for k, v in attrs}
            for key in ("src", "data-src", "data-original", "data-lazy", "data-lazy-src"):
                src = (d.get(key) or "").strip()
                if src:
                    self.fallback_imgs.append(src)
                    return


_IMG_URL_RE = re.compile(r"https?://[^\s\"'>]+?\.(?:png|jpe?g|webp)(?:\?[^\s\"'>]*)?", re.IGNORECASE)


def extract_primary_image_url(html: str, base_url: str) -> str | None:
    """
    Best-effort thumbnail extraction from a product detail HTML.

    Preference order:
      1) <meta property="og:image" ...>
      2) <meta name="twitter:image" ...>
      3) first <img> src (filtered)
      4) first absolute image-like URL found in HTML
    """
    if not html:
        return None

    parser = _MetaImgParser()
    try:
        parser.feed(html)
    except Exception:
        logger.debug("thumb html parse failed; falling back to regex")

    for candidate in (parser.og_image, parser.twitter_image):
        if candidate:
            return urljoin(base_url, candidate)

    for raw in parser.fallback_imgs:
        if raw.startswith("data:"):
            continue
        if raw.lower().endswith(".svg"):
            continue
        return urljoin(base_url, raw)

    m = _IMG_URL_RE.search(html)
    if m:
        return m.group(0)

    return None


def _get_cached(detail_url: str) -> str | None:
    ttl_s = _float_env("TIKTOK_THUMB_CACHE_TTL_S", 24 * 60 * 60.0)
    entry = _THUMB_CACHE.get(detail_url)
    if not entry:
        return None
    if time.time() - entry.ts > ttl_s:
        _THUMB_CACHE.pop(detail_url, None)
        return None
    return entry.url


def _set_cached(detail_url: str, thumb_url: str) -> None:
    max_items = _int_env("TIKTOK_THUMB_CACHE_MAX", 2000)
    if len(_THUMB_CACHE) >= max_items:
        # Best-effort prune: remove oldest 10%
        items = sorted(_THUMB_CACHE.items(), key=lambda kv: kv[1].ts)
        for k, _ in items[: max(1, max_items // 10)]:
            _THUMB_CACHE.pop(k, None)
    _THUMB_CACHE[detail_url] = ThumbCacheEntry(ts=time.time(), url=thumb_url)


def fetch_thumb_for_detail_url(detail_url: str, session: requests.Session | None = None) -> str | None:
    cached = _get_cached(detail_url)
    if cached:
        return cached

    if not detail_url:
        return None

    connect_timeout = _float_env("TOPM_CONNECT_TIMEOUT", 5.0)
    read_timeout = _float_env("TOPM_READ_TIMEOUT", 60.0)

    sess = session or requests.Session()
    sess.trust_env = _bool_env("TOPM_TRUST_ENV", True)
    resp: requests.Response | None = None
    attempts = _timeout_attempts(connect_timeout, read_timeout)
    total_attempts = len(attempts)
    for idx, (ct, rt) in enumerate(attempts, start=1):
        try:
            resp = sess.get(
                detail_url,
                headers={
                    "User-Agent": "seller-module/1.0 (+thumb-enrichment)",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                },
                timeout=(ct, rt),
            )
            resp.raise_for_status()
            break
        except requests.ConnectTimeout as exc:
            logger.warning(
                "tiktok thumb fetch connect timeout url=%s attempt=%s ct=%.1fs err=%s",
                detail_url,
                idx,
                ct,
                exc,
            )
            if idx >= total_attempts:
                return None
        except requests.RequestException as exc:
            logger.warning("tiktok thumb fetch failed url=%s attempt=%s err=%s", detail_url, idx, exc)
            if idx >= total_attempts:
                return None

    if resp is None:
        return None

    thumb = extract_primary_image_url(resp.text, base_url=detail_url)
    if thumb:
        _set_cached(detail_url, thumb)
    return thumb


def _new_api_base() -> str:
    """
    Home-module runtime uses /new/api for detail pages; we reuse it for TikTok thumbs.
    """
    base = (os.getenv("TOPM_BASE_URL", "https://topm.tech") or "").strip().rstrip("/")
    return f"{base}/new/api"


def _is_placeholder_thumb(value: str) -> bool:
    v = (value or "").strip().lower()
    if not v:
        return True
    return "no_picture" in v or v.endswith("/images/no_picture.gif") or v.endswith("images/no_picture.gif")


def fetch_thumb_from_goods_info(
    goods_id: str | int,
    session: requests.Session | None = None,
    detail_url: str | None = None,
) -> str | None:
    """
    Fetch thumb via home-module endpoint: POST {TOPM_BASE_URL}/new/api/goods/info
    This endpoint returns a `pictures` array with `img_url` for TikTok goods.
    """
    gid = str(goods_id or "").strip()
    if not gid:
        return None

    cache_key = f"goods_info:{gid}"
    cached = _get_cached(cache_key)
    if cached:
        return cached

    connect_timeout = _float_env("TOPM_CONNECT_TIMEOUT", 5.0)
    read_timeout = _float_env("TOPM_READ_TIMEOUT", 60.0)
    api_url = f"{_new_api_base()}/goods/info"

    sess = session or requests.Session()
    sess.trust_env = _bool_env("TOPM_TRUST_ENV", True)

    resp: requests.Response | None = None
    attempts = _timeout_attempts(connect_timeout, read_timeout)
    total_attempts = len(attempts)
    for idx, (ct, rt) in enumerate(attempts, start=1):
        try:
            resp = sess.post(
                api_url,
                data={"goods_id": gid},
                headers={
                    "User-Agent": "seller-module/1.0 (+thumb-enrichment)",
                    "Accept": "application/json, text/plain, */*",
                },
                timeout=(ct, rt),
            )
            resp.raise_for_status()
            break
        except requests.ConnectTimeout as exc:
            logger.warning(
                "tiktok goods/info connect timeout goods_id=%s attempt=%s ct=%.1fs err=%s",
                gid,
                idx,
                ct,
                exc,
            )
            if idx >= total_attempts:
                return None
        except requests.RequestException as exc:
            logger.warning("tiktok goods/info fetch failed goods_id=%s attempt=%s err=%s", gid, idx, exc)
            if idx >= total_attempts:
                return None

    if resp is None:
        return None

    try:
        data = resp.json()
    except ValueError:
        logger.warning("tiktok goods/info returned non-json goods_id=%s", gid)
        return None

    info = (data or {}).get("data") or {}
    pics = info.get("pictures") or []
    if isinstance(pics, list) and pics:
        first = pics[0] or {}
        if isinstance(first, dict):
            url = (first.get("img_url") or "").strip()
            if url:
                _set_cached(cache_key, url)
                return url

    thumb = (info.get("goods_thumb") or info.get("goods_img") or "").strip()
    if thumb and not _is_placeholder_thumb(thumb):
        url = urljoin(_new_api_base(), thumb)
        _set_cached(cache_key, url)
        return url

    if detail_url:
        # Fallback: if goods/info has no usable image, try detail page extraction.
        return fetch_thumb_for_detail_url(str(detail_url), session=sess)

    return None


def enrich_tiktok_goods_list(goods_list: List[dict]) -> None:
    """
    Mutates items in-place: if an item has empty goods_thumb but has a detail link,
    attempt to fetch the detail HTML and extract a usable thumbnail URL.
    """
    if not goods_list:
        return

    targets: List[tuple[int, str, str]] = []
    for idx, item in enumerate(goods_list):
        if not isinstance(item, dict):
            continue
        thumb = (item.get("goods_thumb") or "").strip()
        if thumb and not _is_placeholder_thumb(thumb):
            continue
        gid = (item.get("goods_id") or "").strip() if isinstance(item.get("goods_id"), str) else item.get("goods_id")
        if gid:
            cached = _get_cached(f"goods_info:{str(gid).strip()}")
            if cached:
                item["goods_thumb"] = cached
                continue
        detail_url = (item.get("url") or item.get("permalink") or "").strip()
        targets.append((idx, str(gid or "").strip(), detail_url))

    if not targets:
        return

    max_workers = _int_env("TIKTOK_THUMB_MAX_WORKERS", 6)
    max_workers = max(1, min(max_workers, 16))
    max_workers = min(max_workers, len(targets))

    with requests.Session() as sess, ThreadPoolExecutor(max_workers=max_workers) as ex:
        sess.trust_env = _bool_env("TOPM_TRUST_ENV", True)
        futs = {}
        for idx, gid, url in targets:
            if gid:
                futs[ex.submit(fetch_thumb_from_goods_info, gid, sess, url)] = (idx, "gid", gid)
            elif url:
                futs[ex.submit(fetch_thumb_for_detail_url, url, sess)] = (idx, "url", url)
        for fut in as_completed(futs):
            idx, kind, ident = futs[fut]
            try:
                thumb = fut.result()
            except Exception as exc:
                logger.warning("tiktok thumb extract failed %s=%s err=%s", kind, ident, exc)
                continue
            if thumb:
                goods_list[idx]["goods_thumb"] = thumb
