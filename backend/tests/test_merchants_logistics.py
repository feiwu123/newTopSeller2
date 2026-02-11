def test_merchants_logistics_insert_requires_bindable(monkeypatch):
    from app import create_app

    calls = []

    def fake_post_json(script, action, payload):
        calls.append((script, action, payload))
        if action == "lists":
            assert script == "merchants_logistics.php"
            assert "label_name" not in payload
            return 200, {"code": "0", "msg": "success", "data": {"logisticsArr": {"A": 1}}}
        if action == "insert":
            raise AssertionError("insert should not be called when label_name is not bindable")
        raise AssertionError(f"unexpected action: {action}")

    monkeypatch.setattr("seller.merchants_logistics_api.post_json", fake_post_json)

    app = create_app()
    client = app.test_client()
    r = client.post("/api/merchants_logistics/insert", json={"user": "u", "token": "t", "label_name": "B"})
    assert r.status_code == 200
    payload = r.get_json()
    assert payload["code"] == "1"
    assert calls and calls[0][1] == "lists"


def test_merchants_logistics_insert_success(monkeypatch):
    from app import create_app

    calls = []

    def fake_post_json(script, action, payload):
        calls.append((script, action, payload))
        if action == "lists":
            return 200, {"code": "0", "msg": "success", "data": {"logisticsArr": ["A", "B"]}}
        if action == "insert":
            assert payload["label_name"] == "A"
            return 200, {"code": "0", "msg": "success", "data": {}}
        raise AssertionError(f"unexpected action: {action}")

    monkeypatch.setattr("seller.merchants_logistics_api.post_json", fake_post_json)

    app = create_app()
    client = app.test_client()
    r = client.post("/api/merchants_logistics/insert", json={"user": "u", "token": "t", "label_name": "A"})
    assert r.status_code == 200
    assert r.get_json()["code"] == "0"
    assert [c[1] for c in calls] == ["lists", "insert"]

