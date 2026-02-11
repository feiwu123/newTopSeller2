class _Resp:
    def __init__(self, payload, status_code=200):
        self._payload = payload
        self.status_code = status_code

    def json(self):
        return self._payload


def test_login_success(monkeypatch):
    from app import create_app

    def fake_post(url, data=None, timeout=None, **_kwargs):
        assert "token.php" in url
        assert data["user"] == "u"
        assert data["pass"] == "p"
        return _Resp({"code": "0", "msg": "success", "data": {"token": "t"}})

    monkeypatch.setattr("token_api.requests.post", fake_post)

    app = create_app()
    client = app.test_client()
    r = client.post("/api/login", json={"user": "u", "pass": "p"})
    assert r.status_code == 200
    assert r.get_json()["data"]["token"] == "t"


def test_login_missing_params():
    from app import create_app

    app = create_app()
    client = app.test_client()
    r = client.post("/api/login", json={"user": "", "pass": ""})
    assert r.status_code == 200
    payload = r.get_json()
    assert payload["code"] == "1"


def test_login_upstream_failure(monkeypatch):
    from app import create_app
    import requests

    def fake_post(url, data=None, timeout=None, **_kwargs):
        raise requests.RequestException("boom")

    monkeypatch.setattr("token_api.requests.post", fake_post)

    app = create_app()
    client = app.test_client()
    r = client.post("/api/login", json={"user": "u", "pass": "p"})
    assert r.status_code == 200
    payload = r.get_json()
    assert payload["code"] == "1"
