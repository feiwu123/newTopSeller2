from typing import Any, Dict

import logging
import os
import ipaddress
from urllib.parse import urlparse

import requests
from flask import Blueprint, jsonify, request

from upstream import post_json, post_multipart

wholesales_bp = Blueprint("wholesales", __name__)
logger = logging.getLogger(__name__)


def _proxy_wholesales_action(action: str):
    payload: Dict[str, Any] = request.get_json(silent=True) or {}
    try:
        _, data = post_json("wholesales.php", action, payload)
        return jsonify(data), 200
    except requests.RequestException as exc:
        logger.exception("wholesales action=%s upstream request failed: %s", action, exc)
        return jsonify({"code": "1", "msg": "upstream request failed", "data": {}}), 200


def _proxy_wholesales_upload(action: str):
    fields: Dict[str, Any] = dict(request.form) if request.form else {}
    if not request.files:
        return jsonify({"code": "1", "msg": "missing file", "data": {}}), 200

    file_field = next(iter(request.files.keys()))
    f = request.files.get(file_field)
    if not f:
        return jsonify({"code": "1", "msg": "missing file", "data": {}}), 200

    try:
        content = f.read()
        _, data = post_multipart(
            "wholesales.php",
            action,
            fields=fields,
            file_field=file_field,
            filename=f.filename or "upload.bin",
            content=content,
            content_type=f.mimetype,
        )
        return jsonify(data), 200
    except requests.RequestException as exc:
        logger.exception("wholesales action=%s upload upstream request failed: %s", action, exc)
        return jsonify({"code": "1", "msg": "upstream request failed", "data": {}}), 200


def _float_env(name: str, default: float) -> float:
    raw = (os.getenv(name, "") or "").strip()
    if not raw:
        return default
    try:
        return float(raw)
    except ValueError:
        return default


def _validate_external_url(raw: str) -> str | None:
    url = str(raw or "").strip()
    if not url:
        return None
    try:
        parsed = urlparse(url)
    except ValueError:
        return None
    if parsed.scheme not in {"http", "https"}:
        return None
    host = (parsed.hostname or "").strip().lower()
    if not host:
        return None
    if host in {"localhost"} or host.endswith(".local"):
        return None
    try:
        ip = ipaddress.ip_address(host)
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved or ip.is_multicast:
            return None
    except ValueError:
        # hostname (not an IP)
        pass
    return url


def _download_image(url: str) -> tuple[str, bytes, str | None]:
    connect_timeout = _float_env("TOPM_CONNECT_TIMEOUT", 10.0)
    read_timeout = _float_env("TOPM_READ_TIMEOUT", 60.0)
    max_bytes = int(os.getenv("TOPM_IMAGE_MAX_BYTES", "10485760") or "10485760")

    resp = requests.get(url, stream=True, timeout=(connect_timeout, read_timeout))
    resp.raise_for_status()
    content_type = (resp.headers.get("Content-Type") or "").strip() or None

    filename = "image"
    try:
        path = urlparse(url).path or ""
        tail = path.rsplit("/", 1)[-1].strip()
        if tail and "." in tail and len(tail) <= 120:
            filename = tail
        else:
            if content_type and "png" in content_type.lower():
                filename = "image.png"
            elif content_type and "webp" in content_type.lower():
                filename = "image.webp"
            else:
                filename = "image.jpg"
    except Exception:
        filename = "image.jpg"

    buf = bytearray()
    for chunk in resp.iter_content(chunk_size=64 * 1024):
        if not chunk:
            continue
        buf.extend(chunk)
        if len(buf) > max_bytes:
            raise requests.RequestException("image too large")
    return filename, bytes(buf), content_type


@wholesales_bp.post("/api/wholesales/category_list")
def wholesales_category_list():
    """Proxy: wholesales.php?action=category_list."""
    return _proxy_wholesales_action("category_list")


@wholesales_bp.post("/api/wholesales/goods_list")
def wholesales_goods_list():
    """Proxy: wholesales.php?action=goods_list."""
    return _proxy_wholesales_action("goods_list")


@wholesales_bp.post("/api/wholesales/goods_insert")
def wholesales_goods_insert():
    """Proxy: wholesales.php?action=goods_insert.

    Upstream expects multipart/form-data with an image file (see API v4 docs).
    """
    if request.is_json:
        return _proxy_wholesales_action("goods_insert")
    return _proxy_wholesales_upload("goods_insert")


@wholesales_bp.post("/api/wholesales/goods_insert_url")
def wholesales_goods_insert_url():
    """Insert a wholesales good by fetching image_url server-side then proxying multipart.

    This is mainly used by the bulk-import UI; upstream still receives the same goods_insert call.
    """
    payload: Dict[str, Any] = request.get_json(silent=True) or {}
    image_url = _validate_external_url(payload.get("image_url"))
    if not image_url:
        return jsonify({"code": "1", "msg": "invalid image_url", "data": {}}), 200

    fields: Dict[str, Any] = {}
    for k in ["user", "token", "category", "sku", "name", "stock", "weight", "price", "status", "length", "width", "height"]:
        if k in payload and payload.get(k) is not None:
            fields[k] = payload.get(k)

    required = ["user", "token", "category", "sku", "name", "stock", "weight", "price", "status", "length", "width", "height"]
    missing = [k for k in required if not str(fields.get(k) or "").strip()]
    if missing:
        return jsonify({"code": "1", "msg": f"missing fields: {', '.join(missing)}", "data": {}}), 200

    try:
        filename, content, content_type = _download_image(image_url)
        _, data = post_multipart(
            "wholesales.php",
            "goods_insert",
            fields=fields,
            file_field="image",
            filename=filename,
            content=content,
            content_type=content_type,
        )
        return jsonify(data), 200
    except requests.RequestException as exc:
        logger.exception("wholesales goods_insert_url upstream request failed: %s", exc)
        return jsonify({"code": "1", "msg": "upstream request failed", "data": {}}), 200


@wholesales_bp.post("/api/wholesales/goods_update")
def wholesales_goods_update():
    """Proxy: wholesales.php?action=goods_update."""
    return _proxy_wholesales_action("goods_update")


@wholesales_bp.post("/api/wholesales/goods_drop")
def wholesales_goods_drop():
    """Proxy: wholesales.php?action=goods_drop."""
    return _proxy_wholesales_action("goods_drop")


@wholesales_bp.post("/api/wholesales/orders_list")
def wholesales_orders_list():
    """Proxy: wholesales.php?action=orders_list."""
    return _proxy_wholesales_action("orders_list")


@wholesales_bp.post("/api/wholesales/refund_list")
def wholesales_refund_list():
    """Proxy: wholesales.php?action=refund_list."""
    return _proxy_wholesales_action("refund_list")


@wholesales_bp.post("/api/wholesales/do_refund")
def wholesales_do_refund():
    """Proxy: wholesales.php?action=do_refund."""
    return _proxy_wholesales_action("do_refund")


@wholesales_bp.post("/api/wholesales/order_info")
def wholesales_order_info():
    """Proxy: wholesales.php?action=order_info."""
    return _proxy_wholesales_action("order_info")


@wholesales_bp.post("/api/wholesales/images_update")
def wholesales_images_update():
    """Proxy: wholesales.php?action=images_update (multipart upload)."""
    return _proxy_wholesales_upload("images_update")


@wholesales_bp.post("/api/wholesales/sender_address_update")
def wholesales_sender_address_update():
    """Proxy: wholesales.php?action=sender_address_update."""
    return _proxy_wholesales_action("sender_address_update")


@wholesales_bp.post("/api/wholesales/sender_address_info")
def wholesales_sender_address_info():
    """Proxy: wholesales.php?action=sender_address_info."""
    return _proxy_wholesales_action("sender_address_info")
