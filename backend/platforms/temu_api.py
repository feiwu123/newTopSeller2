import json
from typing import Any, Dict

import requests
from flask import Blueprint, jsonify, request

from upstream import post_json, post_multipart

temu_bp = Blueprint("temu", __name__)


def _json_payload() -> Dict[str, Any]:
    payload = request.get_json(silent=True)
    if payload:
        return payload
    if not request.form:
        return {}
    data: Dict[str, Any] = {}
    for key in request.form:
        raw = request.form.get(key)
        if raw is None:
            continue
        text = raw.strip()
        if text and text[0] in "[{":
            try:
                data[key] = json.loads(text)
                continue
            except json.JSONDecodeError:
                pass
        data[key] = text
    return data


@temu_bp.post("/api/temu/get_select_category_pro")
def temu_get_select_category_pro():
    payload = _json_payload()
    try:
        _, data = post_json("temu.php", "get_select_category_pro", payload)
        return jsonify(data), 200
    except requests.RequestException:
        return jsonify({"code": "1", "msg": "upstream request failed", "data": {}}), 200


@temu_bp.post("/api/temu/getAttributeTemplate")
def temu_get_attribute_template():
    payload = _json_payload()
    try:
        _, data = post_json("temu.php", "getAttributeTemplate", payload)
        return jsonify(data), 200
    except requests.RequestException:
        return jsonify({"code": "1", "msg": "upstream request failed", "data": {}}), 200


@temu_bp.post("/api/temu/insert_attr_input")
def temu_insert_attr_input():
    payload = _json_payload()
    try:
        _, data = post_json("temu.php", "insert_attr_input", payload)
        return jsonify(data), 200
    except requests.RequestException:
        return jsonify({"code": "1", "msg": "upstream request failed", "data": {}}), 200


@temu_bp.post("/api/temu/info")
def temu_info():
    payload = _json_payload()
    try:
        _, data = post_json("temu.php", "info", payload)
        return jsonify(data), 200
    except requests.RequestException:
        return jsonify({"code": "1", "msg": "upstream request failed", "data": {}}), 200


@temu_bp.post("/api/temu/update")
def temu_update():
    payload = _json_payload()
    try:
        _, data = post_json("temu.php", "update", payload)
        return jsonify(data), 200
    except requests.RequestException:
        return jsonify({"code": "1", "msg": "upstream request failed", "data": {}}), 200


@temu_bp.post("/api/temu/remove_duplicates")
def temu_remove_duplicates():
    payload = _json_payload()
    try:
        _, data = post_json("temu.php", "remove_duplicates", payload)
        return jsonify(data), 200
    except requests.RequestException:
        return jsonify({"code": "1", "msg": "upstream request failed", "data": {}}), 200


@temu_bp.post("/api/temu/insert")
def temu_insert():
    payload = _json_payload()
    try:
        _, data = post_json("temu.php", "insert", payload)
        return jsonify(data), 200
    except requests.RequestException:
        return jsonify({"code": "1", "msg": "upstream request failed", "data": {}}), 200


@temu_bp.post("/api/temu/upload_goods_img")
def temu_upload_goods_img():
    user = (request.form.get("user") or "").strip()
    token = (request.form.get("token") or "").strip()
    goods_id = (request.form.get("goods_id") or "").strip() or "0"
    if not user or not token:
        return jsonify({"code": "2", "msg": "token invalid", "data": {}}), 200

    f = request.files.get("file")
    if not f:
        return jsonify({"code": "1", "msg": "missing file", "data": {}}), 200

    try:
        _, data = post_multipart(
            "temu.php",
            "upload_goods_img",
            {"user": user, "token": token, "goods_id": goods_id},
            "file",
            f.filename or "upload",
            f.stream,
            f.mimetype,
        )
        return jsonify(data), 200
    except requests.RequestException:
        return jsonify({"code": "1", "msg": "upstream request failed", "data": {}}), 200

