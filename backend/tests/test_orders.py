def test_orders_lists_success(monkeypatch):
    from app import create_app

    def fake_post_json(script, action, payload):
        assert script == "orders.php"
        assert action == "lists"
        assert payload["user"] == "u"
        assert payload["token"] == "t"
        return 200, {"code": "0", "msg": "success", "data": {"list": [], "num": "0"}}

    monkeypatch.setattr("orders.orders_api.post_json", fake_post_json)

    app = create_app()
    client = app.test_client()
    r = client.post("/api/orders/lists", json={"user": "u", "token": "t", "page": 1, "size": 10})
    assert r.status_code == 200
    assert r.get_json()["code"] == "0"


def test_orders_export_settlement(monkeypatch):
    from app import create_app

    def fake_post_json(script, action, payload):
        assert script == "orders.php"
        assert action == "export_settlement"
        return 200, {"code": "0", "msg": "success", "data": {"filePath": "https://example.com/a.zip"}}

    monkeypatch.setattr("orders.orders_api.post_json", fake_post_json)

    app = create_app()
    client = app.test_client()
    r = client.post("/api/orders/export_settlement", json={"user": "u", "token": "t", "order_sn": "1,2"})
    assert r.status_code == 200
    assert r.get_json()["data"]["filePath"].endswith(".zip")
