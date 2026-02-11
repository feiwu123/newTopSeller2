import os
from typing import Any, Dict, Tuple

import requests
from flask import Blueprint, jsonify, request

token_bp = Blueprint("token", __name__)


def _extract_credentials() -> Tuple[str, str]:
    payload: Dict[str, Any]
    if request.is_json:
        payload = request.get_json(silent=True) or {}
    else:
        payload = request.form.to_dict() or {}

    user = (payload.get("user") or payload.get("username") or "").strip()
    password = (payload.get("pass") or payload.get("password") or "").strip()
    return user, password


def _upstream_token_url() -> str:
    api_root = (os.getenv("TOPM_API_ROOT", "") or "").strip().rstrip("/")
    if not api_root:
        base = (os.getenv("TOPM_BASE_URL", "https://topm.tech") or "").strip().rstrip("/")
        api_root = f"{base}/api"
    return f"{api_root}/seller/token.php?action=get_token"


@token_bp.post("/api/login")
def login():
    user, password = _extract_credentials()
    if not user or not password:
        return (
            jsonify({"code": "1", "msg": "missing user/pass", "data": {}}),
            200,
        )

    url = _upstream_token_url()
    try:
        resp = requests.post(
            url,
            data={"user": user, "pass": password},
            timeout=(5, 20),
            proxies={"http": None, "https": None},
        )
    except requests.RequestException:
        return (
            jsonify({"code": "1", "msg": "upstream request failed", "data": {}}),
            200,
        )

    try:
        upstream_json = resp.json()
    except ValueError:
        return (
            jsonify(
                {
                    "code": "1",
                    "msg": "upstream returned non-json",
                    "data": {"status_code": resp.status_code},
                }
            ),
            200,
        )

    return jsonify(upstream_json), 200


@token_bp.post("/api/token")
def token():
    return login()
