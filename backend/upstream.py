import os
import json
from typing import Any, Dict, Optional, Tuple

import requests


def _float_env(name: str, default: float) -> float:
    raw = (os.getenv(name, "") or "").strip()
    if not raw:
        return default
    try:
        return float(raw)
    except ValueError:
        return default


def _topm_api_root() -> str:
    explicit = (os.getenv("TOPM_API_ROOT", "") or "").strip().rstrip("/")
    if explicit:
        return explicit
    base = (os.getenv("TOPM_BASE_URL", "https://topm.tech") or "").strip().rstrip("/")
    return f"{base}/api"


def seller_api_url(script: str, action: str) -> str:
    api_root = _topm_api_root()
    script = script.lstrip("/")
    return f"{api_root}/seller/{script}?action={action}"


def _encode_form_payload(payload: Dict[str, Any]) -> Dict[str, str]:
    encoded: Dict[str, str] = {}
    for k, v in (payload or {}).items():
        if v is None:
            continue
        if isinstance(v, (dict, list)):
            encoded[k] = json.dumps(v, ensure_ascii=False)
        elif isinstance(v, bool):
            encoded[k] = "true" if v else "false"
        else:
            encoded[k] = str(v)
    return encoded


def _bool_env(name: str, default: bool) -> bool:
    raw = (os.getenv(name, "") or "").strip().lower()
    if not raw:
        return default
    return raw in {"1", "true", "yes", "y", "on"}


_SESSION = requests.Session()
# Default to trusting system proxy settings; can be disabled via TOPM_TRUST_ENV=0.
_SESSION.trust_env = _bool_env("TOPM_TRUST_ENV", True)


def _response_json(resp: requests.Response) -> Optional[Dict[str, Any]]:
    if resp is None:
        return None
    content = resp.content or b""
    if not content:
        return None
    candidates = []
    if resp.encoding:
        candidates.append(resp.encoding)
    if resp.apparent_encoding:
        candidates.append(resp.apparent_encoding)
    candidates.extend(["utf-8", "utf-8-sig", "gb18030", "gbk"])
    seen = set()
    for enc in candidates:
        enc = (enc or "").strip()
        if not enc or enc in seen:
            continue
        seen.add(enc)
        try:
            return json.loads(content.decode(enc))
        except (UnicodeDecodeError, json.JSONDecodeError):
            continue
    try:
        return resp.json()
    except ValueError:
        return None


def post_json(script: str, action: str, payload: Dict[str, Any]) -> Tuple[int, Dict[str, Any]]:
    url = seller_api_url(script, action)
    connect_timeout = _float_env("TOPM_CONNECT_TIMEOUT", 5.0)
    read_timeout = _float_env("TOPM_READ_TIMEOUT", 60.0)
    # NOTE: although docs say JSON, upstream PHP endpoints often expect form-data.
    resp = _SESSION.post(url, data=_encode_form_payload(payload), timeout=(connect_timeout, read_timeout))
    data = _response_json(resp)
    if data is not None:
        return resp.status_code, data
    raw = resp.text if resp is not None else ""
    if raw and len(raw) > 2000:
        raw = f"{raw[:2000]}..."
    return resp.status_code, {
        "code": "1",
        "msg": "upstream returned non-json",
        "data": {"status_code": resp.status_code, "raw": raw},
    }


def post_multipart(
    script: str,
    action: str,
    fields: Dict[str, Any],
    file_field: str,
    filename: str,
    content: bytes,
    content_type: str | None,
) -> Tuple[int, Dict[str, Any]]:
    url = seller_api_url(script, action)
    connect_timeout = _float_env("TOPM_CONNECT_TIMEOUT", 10.0)
    read_timeout = _float_env("TOPM_READ_TIMEOUT", 120.0)
    files = {
        file_field: (
            filename,
            content,
            content_type or "application/octet-stream",
        )
    }
    resp = _SESSION.post(url, data=_encode_form_payload(fields), files=files, timeout=(connect_timeout, read_timeout))
    data = _response_json(resp)
    if data is not None:
        return resp.status_code, data
    return resp.status_code, {
        "code": "1",
        "msg": "upstream returned non-json",
        "data": {"status_code": resp.status_code},
    }
