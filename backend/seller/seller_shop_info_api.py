from typing import Any, Dict

import logging
import requests
from flask import Blueprint, jsonify, request

from upstream import post_json, post_multipart

seller_shop_info_bp = Blueprint("seller_shop_info", __name__)
logger = logging.getLogger(__name__)


def _proxy_shop_info_action(action: str):
    payload: Dict[str, Any] = request.get_json(silent=True) or {}
    try:
        _, data = post_json("seller_shop_info.php", action, payload)
        return jsonify(data), 200
    except requests.RequestException as exc:
        logger.exception("seller_shop_info action=%s upstream request failed: %s", action, exc)
        return jsonify({"code": "1", "msg": "upstream request failed", "data": {}}), 200


@seller_shop_info_bp.post("/api/seller_shop_info/info")
def seller_shop_info_info():
    """Proxy: seller_shop_info.php?action=info."""
    return _proxy_shop_info_action("info")


@seller_shop_info_bp.post("/api/seller_shop_info/update")
def seller_shop_info_update():
    """Proxy: seller_shop_info.php?action=update."""
    return _proxy_shop_info_action("update")


@seller_shop_info_bp.post("/api/seller_shop_info/shop_logo")
def seller_shop_info_shop_logo():
    """Proxy: seller_shop_info.php?action=shop_logo (multipart upload)."""
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
            "seller_shop_info.php",
            "shop_logo",
            fields=fields,
            file_field=file_field,
            filename=f.filename or "upload.bin",
            content=content,
            content_type=f.mimetype,
        )
        return jsonify(data), 200
    except requests.RequestException as exc:
        logger.exception("seller_shop_info shop_logo upstream request failed: %s", exc)
        return jsonify({"code": "1", "msg": "upstream request failed", "data": {}}), 200

