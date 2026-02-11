class _Resp:
    def __init__(self, status_code=200, headers=None, chunks=None):
        self.status_code = status_code
        self.headers = headers or {}
        self._chunks = list(chunks or [])

    def raise_for_status(self):
        if int(self.status_code) >= 400:
            raise Exception("bad status")

    def iter_content(self, chunk_size=8192):
        for c in self._chunks:
            yield c


def test_wholesales_goods_insert_url_downloads_and_proxies(monkeypatch):
    from app import create_app

    got = {}

    def fake_get(url, stream=None, timeout=None):
        assert url == "https://example.com/a.png"
        return _Resp(headers={"Content-Type": "image/png"}, chunks=[b"abc"])

    def fake_post_multipart(script, action, fields, file_field, filename, content, content_type):
        got.update(
            {
                "script": script,
                "action": action,
                "fields": fields,
                "file_field": file_field,
                "filename": filename,
                "content": content,
                "content_type": content_type,
            }
        )
        return 200, {"code": "0", "msg": "success", "data": {}}

    monkeypatch.setattr("wholesales.wholesales_api.requests.get", fake_get)
    monkeypatch.setattr("wholesales.wholesales_api.post_multipart", fake_post_multipart)

    app = create_app()
    client = app.test_client()
    r = client.post(
        "/api/wholesales/goods_insert_url",
        json={
            "user": "u",
            "token": "t",
            "image_url": "https://example.com/a.png",
            "category": "1",
            "sku": "sku1",
            "name": "n",
            "stock": "10",
            "weight": "1",
            "price": "9.9",
            "status": "1",
            "length": "1",
            "width": "1",
            "height": "1",
        },
    )
    assert r.status_code == 200
    assert r.get_json()["code"] == "0"
    assert got["script"] == "wholesales.php"
    assert got["action"] == "goods_insert"
    assert got["file_field"] == "image"
    assert got["filename"] == "a.png"
    assert got["content"] == b"abc"
    assert got["content_type"] == "image/png"

