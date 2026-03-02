import json
from typing import Any, Dict, List

import requests
from flask import Blueprint, jsonify, request

from upstream import post_json, post_multipart

shein_bp = Blueprint("shein", __name__)


def _json_payload() -> Dict[str, Any]:
    return request.get_json(silent=True) or {}


def _split_csv_values(value: Any) -> List[str]:
    if value is None:
        return []
    if isinstance(value, list):
        items: List[str] = []
        for item in value:
            items.extend(_split_csv_values(item))
        return items
    text = str(value).strip()
    if not text:
        return []
    return [part.strip() for part in text.split(",") if part and part.strip()]


def _normalize_shein_others_value(raw: Any) -> Any:
    is_text = isinstance(raw, str)
    parsed = raw
    if is_text:
        text = raw.strip()
        if not text:
            return raw
        try:
            parsed = json.loads(text)
        except json.JSONDecodeError:
            return raw
    if not isinstance(parsed, list):
        return raw

    normalized: List[Any] = []
    for item in parsed:
        if not isinstance(item, dict):
            normalized.append(item)
            continue

        ids = _split_csv_values(item.get("attribute_value_id"))
        extras = _split_csv_values(item.get("attribute_extra_value"))
        if ids:
            if extras and len(extras) == len(ids):
                for idx, value_id in enumerate(ids):
                    row = dict(item)
                    row["attribute_value_id"] = value_id
                    extra_value = extras[idx]
                    if extra_value:
                        row["attribute_extra_value"] = extra_value
                    else:
                        row.pop("attribute_extra_value", None)
                    normalized.append(row)
            else:
                extra_text = str(item.get("attribute_extra_value") or "").strip()
                for value_id in ids:
                    row = dict(item)
                    row["attribute_value_id"] = value_id
                    if extra_text:
                        row["attribute_extra_value"] = extra_text
                    else:
                        row.pop("attribute_extra_value", None)
                    normalized.append(row)
            continue

        if len(extras) > 1:
            for extra_value in extras:
                row = dict(item)
                row.pop("attribute_value_id", None)
                row["attribute_extra_value"] = extra_value
                normalized.append(row)
            continue

        normalized.append(item)

    if is_text:
        return json.dumps(normalized, ensure_ascii=False)
    return normalized


def _normalize_shein_others_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
    for key in ("sheinOthers", "shein_others", "others"):
        if key not in payload:
            continue
        payload[key] = _normalize_shein_others_value(payload.get(key))
    return payload


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
    payload = _normalize_shein_others_payload(_json_payload())
    try:
        _, data = post_json("shein.php", "insert", payload)
        return jsonify(data), 200
    except requests.RequestException:
        return jsonify({"code": "1", "msg": "upstream request failed", "data": {}}), 200


@shein_bp.post("/api/shein/update")
def shein_update():
    payload = _normalize_shein_others_payload(_json_payload())
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
