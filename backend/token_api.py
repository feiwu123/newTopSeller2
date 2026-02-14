import os
import logging
from typing import Any, Dict, Tuple

import requests
from flask import Blueprint, jsonify, request

token_bp = Blueprint("token", __name__)
logger = logging.getLogger(__name__)


def _float_env(name: str, default: float) -> float:
    raw = (os.getenv(name, "") or "").strip()
    if not raw:
        return default
    try:
        return float(raw)
    except ValueError:
        return default


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
    connect_timeout = _float_env("TOPM_CONNECT_TIMEOUT", 5.0)
    read_timeout = _float_env("TOPM_READ_TIMEOUT", 60.0)
    attempts = [(connect_timeout, read_timeout)]
    # Some regions need a longer TCP/TLS handshake to topm.tech.
    if connect_timeout < 20.0:
        attempts.append((20.0, read_timeout))

    resp = None
    last_exc: requests.RequestException | None = None
    try:
        for idx, (ct, rt) in enumerate(attempts, start=1):
            try:
                resp = requests.post(
                    url,
                    data={"user": user, "pass": password},
                    timeout=(ct, rt),
                )
                break
            except requests.ConnectTimeout as exc:
                last_exc = exc
                logger.warning("login upstream connect timeout (attempt=%s ct=%.1fs): %s", idx, ct, exc)
                if idx >= len(attempts):
                    raise
            except requests.RequestException as exc:
                last_exc = exc
                logger.warning("login upstream request failed (attempt=%s): %s", idx, exc)
                if idx >= len(attempts):
                    raise
    except requests.RequestException:
        return (
            jsonify(
                {
                    "code": "1",
                    "msg": "upstream request failed",
                    "data": {"error": str(last_exc)[:300]} if last_exc else {},
                }
            ),
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
