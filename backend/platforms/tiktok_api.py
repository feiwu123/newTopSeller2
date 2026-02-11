from typing import Any, Dict

import requests
from flask import Blueprint, jsonify, request

from upstream import post_json, post_multipart

tiktok_bp = Blueprint("tiktok", __name__)


def _json_payload() -> Dict[str, Any]:
    return request.get_json(silent=True) or {}


@tiktok_bp.post("/api/tiktok/get_select_category_pro")
def tiktok_get_select_category_pro():
    payload = _json_payload()
    try:
        _, data = post_json("tiktok.php", "get_select_category_pro", payload)
        return jsonify(data), 200
    except requests.RequestException:
        return jsonify({"code": "1", "msg": "upstream request failed", "data": {}}), 200


@tiktok_bp.post("/api/tiktok/getAttributeTemplate")
def tiktok_get_attribute_template():
    payload = _json_payload()
    try:
        _, data = post_json("tiktok.php", "getAttributeTemplate", payload)
        return jsonify(data), 200
    except requests.RequestException:
        return jsonify({"code": "1", "msg": "upstream request failed", "data": {}}), 200


@tiktok_bp.post("/api/tiktok/getWarehouseList")
def tiktok_get_warehouse_list():
    payload = _json_payload()
    try:
        _, data = post_json("tiktok.php", "getWarehouseList", payload)
        return jsonify(data), 200
    except requests.RequestException:
        return jsonify({"code": "1", "msg": "upstream request failed", "data": {}}), 200


@tiktok_bp.post("/api/tiktok/searchBrand")
def tiktok_search_brand():
    payload = _json_payload()
    try:
        _, data = post_json("tiktok.php", "searchBrand", payload)
        return jsonify(data), 200
    except requests.RequestException:
        return jsonify({"code": "1", "msg": "upstream request failed", "data": {}}), 200


@tiktok_bp.post("/api/tiktok/createBrand")
def tiktok_create_brand():
    payload = _json_payload()
    try:
        _, data = post_json("tiktok.php", "createBrand", payload)
        return jsonify(data), 200
    except requests.RequestException:
        return jsonify({"code": "1", "msg": "upstream request failed", "data": {}}), 200


@tiktok_bp.post("/api/tiktok/insert_attr_input")
def tiktok_insert_attr_input():
    payload = _json_payload()
    try:
        _, data = post_json("tiktok.php", "insert_attr_input", payload)
        return jsonify(data), 200
    except requests.RequestException:
        return jsonify({"code": "1", "msg": "upstream request failed", "data": {}}), 200


@tiktok_bp.post("/api/tiktok/insert")
def tiktok_insert():
    payload = _json_payload()
    try:
        _, data = post_json("tiktok.php", "insert", payload)
        return jsonify(data), 200
    except requests.RequestException:
        return jsonify({"code": "1", "msg": "upstream request failed", "data": {}}), 200


@tiktok_bp.post("/api/tiktok/update")
def tiktok_update():
    payload = _json_payload()
    try:
        _, data = post_json("tiktok.php", "update", payload)
        return jsonify(data), 200
    except requests.RequestException:
        return jsonify({"code": "1", "msg": "upstream request failed", "data": {}}), 200


@tiktok_bp.post("/api/tiktok/info")
def tiktok_info():
    payload = _json_payload()
    try:
        _, data = post_json("tiktok.php", "info", payload)
        return jsonify(data), 200
    except requests.RequestException:
        return jsonify({"code": "1", "msg": "upstream request failed", "data": {}}), 200


def _upload_file(action: str):
    user = (request.form.get("user") or "").strip()
    token = (request.form.get("token") or "").strip()
    if not user or not token:
        return jsonify({"code": "2", "msg": "token invalid", "data": {}}), 200

    f = request.files.get("file")
    if not f:
        return jsonify({"code": "1", "msg": "missing file", "data": {}}), 200

    fields: Dict[str, Any] = {"user": user, "token": token}
    use_case = request.form.get("use_case")
    if use_case:
        fields["use_case"] = use_case

    try:
        _, data = post_multipart(
            "tiktok.php",
            action,
            fields,
            "file",
            f.filename or "upload",
            f.read(),
            f.mimetype,
        )
        return jsonify(data), 200
    except requests.RequestException:
        return jsonify({"code": "1", "msg": "upstream request failed", "data": {}}), 200


@tiktok_bp.post("/api/tiktok/upload_goods_img")
def tiktok_upload_goods_img():
    return _upload_file("upload_goods_img")


@tiktok_bp.post("/api/tiktok/upload_attrs_img")
def tiktok_upload_attrs_img():
    return _upload_file("upload_attrs_img")


@tiktok_bp.post("/api/tiktok/upload_tiktok_img")
def tiktok_upload_tiktok_img():
    return _upload_file("upload_tiktok_img")
