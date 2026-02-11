from typing import Any, Dict

import requests
from flask import Blueprint, jsonify, request

from upstream import post_json, post_multipart

shein_bp = Blueprint("shein", __name__)


def _json_payload() -> Dict[str, Any]:
    return request.get_json(silent=True) or {}


@shein_bp.post("/api/shein/get_select_category_pro")
def shein_get_select_category_pro():
    payload = _json_payload()
    try:
        _, data = post_json("shein.php", "get_select_category_pro", payload)
        return jsonify(data), 200
    except requests.RequestException:
        return jsonify({"code": "1", "msg": "upstream request failed", "data": {}}), 200


@shein_bp.post("/api/shein/getAttributeTemplate")
def shein_get_attribute_template():
    payload = _json_payload()
    try:
        _, data = post_json("shein.php", "getAttributeTemplate", payload)
        return jsonify(data), 200
    except requests.RequestException:
        return jsonify({"code": "1", "msg": "upstream request failed", "data": {}}), 200


@shein_bp.post("/api/shein/info")
def shein_info():
    payload = _json_payload()
    try:
        _, data = post_json("shein.php", "info", payload)
        return jsonify(data), 200
    except requests.RequestException:
        return jsonify({"code": "1", "msg": "upstream request failed", "data": {}}), 200


@shein_bp.post("/api/shein/insert")
def shein_insert():
    payload = _json_payload()
    try:
        _, data = post_json("shein.php", "insert", payload)
        return jsonify(data), 200
    except requests.RequestException:
        return jsonify({"code": "1", "msg": "upstream request failed", "data": {}}), 200


@shein_bp.post("/api/shein/update")
def shein_update():
    payload = _json_payload()
    try:
        _, data = post_json("shein.php", "update", payload)
        return jsonify(data), 200
    except requests.RequestException:
        return jsonify({"code": "1", "msg": "upstream request failed", "data": {}}), 200


@shein_bp.post("/api/shein/remove_shein_img")
def shein_remove_image():
    payload = _json_payload()
    try:
        _, data = post_json("shein.php", "remove_shein_img", payload)
        return jsonify(data), 200
    except requests.RequestException:
        return jsonify({"code": "1", "msg": "upstream request failed", "data": {}}), 200


@shein_bp.post("/api/shein/upload_shein_img")
def shein_upload_image():
    user = (request.form.get("user") or "").strip()
    token = (request.form.get("token") or "").strip()
    image_type = (request.form.get("image_type") or "").strip()
    if not user or not token:
        return jsonify({"code": "2", "msg": "token invalid", "data": {}}), 200

    f = request.files.get("file")
    if not f:
        return jsonify({"code": "1", "msg": "missing file", "data": {}}), 200

    fields: Dict[str, Any] = {"user": user, "token": token}
    if image_type:
        fields["image_type"] = image_type

    try:
        _, data = post_multipart(
            "shein.php",
            "upload_shein_img",
            fields,
            "file",
            f.filename or "upload",
            f.read(),
            f.mimetype,
        )
        return jsonify(data), 200
    except requests.RequestException:
        return jsonify({"code": "1", "msg": "upstream request failed", "data": {}}), 200
