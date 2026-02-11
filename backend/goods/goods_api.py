import time
from dataclasses import dataclass
from typing import Any, Dict, List, Tuple

import logging
import requests
from flask import Blueprint, jsonify, request

from upstream import post_json
from goods.thumb_enrichment import enrich_tiktok_goods_list

goods_bp = Blueprint("goods", __name__)
logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class _ListCacheEntry:
    ts: float
    items: List[dict]


_FULL_LIST_CACHE: Dict[Tuple[str, str, int], _ListCacheEntry] = {}


def _cache_ttl_s() -> float:
    # Short TTL: inventory updates frequently.
    return 30.0


def _normalize_query(value: Any) -> str:
    return str(value or "").strip()


def _get_cached_full_list(user: str, token: str, is_tiktok: int) -> List[dict] | None:
    key = (user, token, int(is_tiktok))
    entry = _FULL_LIST_CACHE.get(key)
    if not entry:
        return None
    if time.time() - entry.ts > _cache_ttl_s():
        _FULL_LIST_CACHE.pop(key, None)
        return None
    return entry.items


def _set_cached_full_list(user: str, token: str, is_tiktok: int, items: List[dict]) -> None:
    key = (user, token, int(is_tiktok))
    _FULL_LIST_CACHE[key] = _ListCacheEntry(ts=time.time(), items=items)


def _item_matches_query(item: dict, q_lower: str) -> bool:
    if not q_lower:
        return True
    sn = str(item.get("goods_sn") or "").lower()
    name = str(item.get("goods_name") or "").lower()
    return (q_lower in sn) or (q_lower in name)


def _fetch_all_goods_pages(base_payload: Dict[str, Any]) -> List[dict]:
    """
    Upstream goods.php?action=lists currently ignores search filters like keywords/goods_sn/goods_name,
    so we fetch all pages and filter locally for accurate search.
    """
    user = _normalize_query(base_payload.get("user"))
    token = _normalize_query(base_payload.get("token"))
    is_tiktok = int(base_payload.get("is_tiktok") or 0)

    cached = _get_cached_full_list(user, token, is_tiktok)
    if cached is not None:
        return cached

    page_size = 200
    page = 1
    collected: List[dict] = []
    total = None

    while True:
        payload = dict(base_payload)
        payload["page"] = page
        payload["size"] = page_size

        _, data = post_json("goods.php", "lists", payload)
        if str((data or {}).get("code")) != "0":
            break

        d = (data or {}).get("data", {}) or {}
        lst = d.get("list") or []
        if not isinstance(lst, list) or not lst:
            if total is None:
                try:
                    total = int(d.get("num") or 0)
                except Exception:
                    total = 0
            break

        collected.extend([x for x in lst if isinstance(x, dict)])
        if total is None:
            try:
                total = int(d.get("num") or 0)
            except Exception:
                total = 0

        if total and len(collected) >= total:
            break

        # Safety stop if pagination is unexpectedly huge/stuck.
        if page >= 300:
            break
        page += 1

    _set_cached_full_list(user, token, is_tiktok, collected)
    return collected


def _proxy_goods_action(action: str):
    payload: Dict[str, Any] = request.get_json(silent=True) or {}
    try:
        _, data = post_json("goods.php", action, payload)
        return jsonify(data), 200
    except requests.RequestException as exc:
        logger.exception("goods action=%s upstream request failed: %s", action, exc)
        return jsonify({"code": "1", "msg": "upstream request failed", "data": {}}), 200


@goods_bp.post("/api/goods/lists")
def goods_lists():
    """Proxy: goods.php?action=lists (platform filter via is_tiktok: 0/1/2)."""
    payload: Dict[str, Any] = request.get_json(silent=True) or {}
    try:
        query = _normalize_query(payload.get("keywords") or payload.get("goods_sn") or payload.get("goods_name"))

        if query:
            is_tiktok = int(payload.get("is_tiktok") or 0)
            page = max(1, int(payload.get("page") or 1))
            size = max(1, int(payload.get("size") or 15))

            base_payload = dict(payload)
            # Remove ignored search params; we'll filter locally.
            base_payload.pop("keywords", None)
            base_payload.pop("goods_sn", None)
            base_payload.pop("goods_name", None)

            all_items = _fetch_all_goods_pages(base_payload)
            q_lower = query.lower()
            matched = [it for it in all_items if isinstance(it, dict) and _item_matches_query(it, q_lower)]
            total = len(matched)
            start = (page - 1) * size
            end = start + size
            page_items = matched[start:end] if start < total else []

            data = {
                "code": "0",
                "msg": "ok",
                "data": {
                    "list": page_items,
                    "num": str(total),
                    "page": page,
                    "size": size,
                    "is_tiktok": is_tiktok,
                    "keywords": query,
                },
            }
        else:
            _, data = post_json("goods.php", "lists", payload)
    except requests.RequestException as exc:
        logger.exception("goods action=lists upstream request failed: %s", exc)
        return jsonify({"code": "1", "msg": "upstream request failed", "data": {}}), 200

    try:
        if int(payload.get("is_tiktok") or 0) == 1:
            goods_list = (data or {}).get("data", {}).get("list", [])
            if isinstance(goods_list, list):
                enrich_tiktok_goods_list(goods_list)
    except Exception as exc:
        # Best-effort enrichment; never block the main list response.
        logger.warning("tiktok thumb enrichment skipped due to error: %s", exc)

    return jsonify(data), 200


@goods_bp.post("/api/goods/toggle_on_sale")
def goods_toggle_on_sale():
    """Proxy: goods.php?action=toggle_on_sale (val: 0 off / 1 on)."""
    return _proxy_goods_action("toggle_on_sale")
