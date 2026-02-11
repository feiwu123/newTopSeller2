import io


def test_wholesales_goods_insert_accepts_multipart(monkeypatch):
    from app import create_app

    calls = []

    def fake_post_multipart(script, action, fields, file_field, filename, content, content_type):
        calls.append(
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

    monkeypatch.setattr("wholesales.wholesales_api.post_multipart", fake_post_multipart)

    app = create_app()
    client = app.test_client()
    data = {
        "user": "u",
        "token": "t",
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
        "image": (io.BytesIO(b"img"), "a.png"),
    }
    r = client.post("/api/wholesales/goods_insert", data=data, content_type="multipart/form-data")
    assert r.status_code == 200
    assert r.get_json()["code"] == "0"

    assert calls
    call = calls[0]
    assert call["script"] == "wholesales.php"
    assert call["action"] == "goods_insert"
    assert call["file_field"] == "image"
    assert call["fields"]["user"] == "u"
    assert call["fields"]["token"] == "t"

