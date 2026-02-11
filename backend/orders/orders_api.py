from typing import Any, Dict

import logging
import requests
from flask import Blueprint, jsonify, request

from upstream import post_json

orders_bp = Blueprint("orders", __name__)
logger = logging.getLogger(__name__)


@orders_bp.post("/api/orders/lists")
def orders_lists():
    payload: Dict[str, Any] = request.get_json(silent=True) or {}
    try:
        _, data = post_json("orders.php", "lists", payload)
        return jsonify(data), 200
    except requests.RequestException as exc:
        logger.exception("orders lists upstream request failed: %s", exc)
        return jsonify({"code": "1", "msg": "upstream request failed", "data": {}}), 200


@orders_bp.post("/api/orders/info")
def orders_info():
    payload: Dict[str, Any] = request.get_json(silent=True) or {}
    try:
        _, data = post_json("orders.php", "info", payload)
        return jsonify(data), 200
    except requests.RequestException as exc:
        logger.exception("orders info upstream request failed: %s", exc)
        return jsonify({"code": "1", "msg": "upstream request failed", "data": {}}), 200


def _proxy_orders_action(action: str):
    payload: Dict[str, Any] = request.get_json(silent=True) or {}
    try:
        _, data = post_json("orders.php", action, payload)
        return jsonify(data), 200
    except requests.RequestException as exc:
        logger.exception("orders action=%s upstream request failed: %s", action, exc)
        return jsonify({"code": "1", "msg": "upstream request failed", "data": {}}), 200


@orders_bp.post("/api/orders/alibabaInfo")
def orders_alibaba_info():
    return _proxy_orders_action("alibabaInfo")


@orders_bp.post("/api/orders/regenerate")
def orders_regenerate():
    return _proxy_orders_action("regenerate")


@orders_bp.post("/api/orders/invoiceView")
def orders_invoice_view():
    return _proxy_orders_action("invoiceView")


@orders_bp.post("/api/orders/print_all_pdf")
def orders_print_all_pdf():
    return _proxy_orders_action("print_all_pdf")


@orders_bp.post("/api/orders/export_picking")
def orders_export_picking():
    return _proxy_orders_action("export_picking")


@orders_bp.post("/api/orders/export_settlement")
def orders_export_settlement():
    return _proxy_orders_action("export_settlement")


@orders_bp.post("/api/orders/alibaba_all_pay")
def orders_alibaba_all_pay():
    return _proxy_orders_action("alibaba_all_pay")
