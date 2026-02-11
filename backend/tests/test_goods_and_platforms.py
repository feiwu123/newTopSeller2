def test_goods_lists_success(monkeypatch):
    from app import create_app

    def fake_post_json(script, action, payload):
        assert script == "goods.php"
        assert action == "lists"
        assert payload["user"] == "u"
        assert payload["token"] == "t"
        return 200, {"code": "0", "msg": "success", "data": {"list": [], "num": "0"}}

    monkeypatch.setattr("goods.goods_api.post_json", fake_post_json)

    app = create_app()
    client = app.test_client()
    r = client.post("/api/goods/lists", json={"user": "u", "token": "t", "page": 1, "size": 10, "is_tiktok": 0})
    assert r.status_code == 200
    assert r.get_json()["code"] == "0"


def test_tiktok_category_proxy(monkeypatch):
    from app import create_app

    def fake_post_json(script, action, payload):
        assert script == "tiktok.php"
        assert action == "get_select_category_pro"
        return 200, {"code": "0", "msg": "success", "data": {"list": [{"cat_id": 1, "cat_name": "A", "is_leaf": 1}]}}

    monkeypatch.setattr("platforms.tiktok_api.post_json", fake_post_json)

    app = create_app()
    client = app.test_client()
    r = client.post("/api/tiktok/get_select_category_pro", json={"user": "u", "token": "t", "cat_id": 0})
    assert r.status_code == 200
    assert r.get_json()["data"]["list"][0]["cat_id"] == 1


def test_tiktok_upload_missing_file():
    from app import create_app

    app = create_app()
    client = app.test_client()
    r = client.post("/api/tiktok/upload_goods_img", data={"user": "u", "token": "t"})
    assert r.status_code == 200
    assert r.get_json()["code"] == "1"

