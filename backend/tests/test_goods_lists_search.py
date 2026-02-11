def test_goods_lists_search_filters_by_sku_and_name(monkeypatch):
    from app import create_app
    import goods.goods_api as goods_api

    goods_api._FULL_LIST_CACHE.clear()

    pages = {
        1: [
            {"goods_id": 1, "goods_sn": "ABC123", "goods_name": "Hello Phone", "goods_thumb": ""},
            {"goods_id": 2, "goods_sn": "ZZZ999", "goods_name": "World Cable", "goods_thumb": ""},
        ],
        2: [
            {"goods_id": 3, "goods_sn": "DEF456", "goods_name": "Hello Charger", "goods_thumb": ""},
            {"goods_id": 4, "goods_sn": "XXX000", "goods_name": "Other", "goods_thumb": ""},
        ],
        3: [],
    }

    def fake_post_json(script, action, payload):
        assert script == "goods.php"
        assert action == "lists"
        page = int(payload.get("page") or 1)
        return 200, {"code": "0", "msg": "ok", "data": {"list": pages.get(page, []), "num": "4"}}

    monkeypatch.setattr("goods.goods_api.post_json", fake_post_json)
    monkeypatch.setattr("goods.goods_api.enrich_tiktok_goods_list", lambda *_args, **_kwargs: None)

    app = create_app()
    client = app.test_client()

    r = client.post(
        "/api/goods/lists",
        json={"user": "u", "token": "t", "page": 1, "size": 10, "is_tiktok": 1, "keywords": "DEF"},
    )
    body = r.get_json()
    assert body["code"] == "0"
    assert body["data"]["num"] == "1"
    assert [x["goods_id"] for x in body["data"]["list"]] == [3]

    r = client.post(
        "/api/goods/lists",
        json={"user": "u", "token": "t", "page": 1, "size": 10, "is_tiktok": 1, "keywords": "hello"},
    )
    body = r.get_json()
    assert body["code"] == "0"
    assert body["data"]["num"] == "2"
    assert [x["goods_id"] for x in body["data"]["list"]] == [1, 3]


def test_goods_lists_search_pagination(monkeypatch):
    from app import create_app
    import goods.goods_api as goods_api

    goods_api._FULL_LIST_CACHE.clear()

    pages = {
        1: [
            {"goods_id": 1, "goods_sn": "ABC123", "goods_name": "Hello Phone"},
            {"goods_id": 2, "goods_sn": "ZZZ999", "goods_name": "World Cable"},
        ],
        2: [
            {"goods_id": 3, "goods_sn": "DEF456", "goods_name": "Hello Charger"},
        ],
        3: [],
    }

    def fake_post_json(script, action, payload):
        assert script == "goods.php"
        assert action == "lists"
        page = int(payload.get("page") or 1)
        return 200, {"code": "0", "msg": "ok", "data": {"list": pages.get(page, []), "num": "3"}}

    monkeypatch.setattr("goods.goods_api.post_json", fake_post_json)
    monkeypatch.setattr("goods.goods_api.enrich_tiktok_goods_list", lambda *_args, **_kwargs: None)

    app = create_app()
    client = app.test_client()

    r1 = client.post(
        "/api/goods/lists",
        json={"user": "u", "token": "t", "page": 1, "size": 1, "is_tiktok": 1, "keywords": "hello"},
    ).get_json()
    r2 = client.post(
        "/api/goods/lists",
        json={"user": "u", "token": "t", "page": 2, "size": 1, "is_tiktok": 1, "keywords": "hello"},
    ).get_json()

    assert [x["goods_id"] for x in r1["data"]["list"]] == [1]
    assert [x["goods_id"] for x in r2["data"]["list"]] == [3]

