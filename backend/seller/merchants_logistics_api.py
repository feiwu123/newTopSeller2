from typing import Any, Dict

import logging
import requests
from flask import Blueprint, jsonify, request

from upstream import post_json

merchants_logistics_bp = Blueprint("merchants_logistics", __name__)
logger = logging.getLogger(__name__)


def _proxy_merchants_logistics_action(action: str):
    payload: Dict[str, Any] = request.get_json(silent=True) or {}
    try:
        _, data = post_json("merchants_logistics.php", action, payload)
        return jsonify(data), 200
    except requests.RequestException as exc:
        logger.exception("merchants_logistics action=%s upstream request failed: %s", action, exc)
        return jsonify({"code": "1", "msg": "upstream request failed", "data": {}}), 200


@merchants_logistics_bp.post("/api/merchants_logistics/lists")
def merchants_logistics_lists():
    """Proxy: merchants_logistics.php?action=lists."""
    return _proxy_merchants_logistics_action("lists")


@merchants_logistics_bp.post("/api/merchants_logistics/insert")
def merchants_logistics_insert():
    """Bind logistics by selecting from the bindable list (lists -> logisticsArr -> insert)."""
    payload: Dict[str, Any] = request.get_json(silent=True) or {}
    label_name = str(payload.get("label_name") or "").strip()
    if not label_name:
        return jsonify({"code": "1", "msg": "missing label_name", "data": {}}), 200

    lists_payload = {k: v for k, v in payload.items() if k != "label_name"}
    try:
        _, lists_res = post_json("merchants_logistics.php", "lists", lists_payload)
        if str(lists_res.get("code")) != "0":
            return jsonify(lists_res), 200

        data = lists_res.get("data") or {}
        bindable_raw = data.get("logisticsArr")
        bindable_names: set[str] = set()
        if isinstance(bindable_raw, list):
            bindable_names = {str(x).strip() for x in bindable_raw if x is not None and str(x).strip()}
        elif isinstance(bindable_raw, dict):
            bindable_names = {str(k).strip() for k in bindable_raw.keys() if str(k).strip()}

        if label_name not in bindable_names:
            return (
                jsonify(
                    {
                        "code": "1",
                        "msg": "label_name not bindable; please refresh and select from bindable list",
                        "data": {},
                    }
                ),
                200,
            )

        _, res = post_json("merchants_logistics.php", "insert", payload)
        return jsonify(res), 200
    except requests.RequestException as exc:
        logger.exception("merchants_logistics insert upstream request failed: %s", exc)
        return jsonify({"code": "1", "msg": "upstream request failed", "data": {}}), 200


@merchants_logistics_bp.post("/api/merchants_logistics/delete")
def merchants_logistics_delete():
    """Proxy: merchants_logistics.php?action=delete."""
    return _proxy_merchants_logistics_action("delete")
