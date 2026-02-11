def test_tiktok_goods_lists_runs_thumb_enrichment(monkeypatch):
    from app import create_app

    def fake_post_json(script, action, payload):
        assert script == "goods.php"
        assert action == "lists"
        assert payload["is_tiktok"] == 1
        return 200, {
            "code": "0",
            "msg": "ok",
            "data": {
                "list": [
                    {
                        "goods_id": 123,
                        "goods_thumb": "",
                        "url": "https://topm.tech/new/detail.html?goods_id=123",
                    }
                ],
                "num": "1",
            },
        }

    called = {"count": 0}

    def fake_enrich(goods_list):
        called["count"] += 1
        goods_list[0]["goods_thumb"] = "https://img.example.com/thumb.jpg"

    monkeypatch.setattr("goods.goods_api.post_json", fake_post_json)
    monkeypatch.setattr("goods.goods_api.enrich_tiktok_goods_list", fake_enrich)

    app = create_app()
    client = app.test_client()
    r = client.post("/api/goods/lists", json={"user": "u", "token": "t", "page": 1, "size": 10, "is_tiktok": 1})
    assert r.status_code == 200
    body = r.get_json()
    assert body["code"] == "0"
    assert called["count"] == 1
    assert body["data"]["list"][0]["goods_thumb"] == "https://img.example.com/thumb.jpg"


def test_non_tiktok_goods_lists_skips_thumb_enrichment(monkeypatch):
    from app import create_app

    def fake_post_json(script, action, payload):
        assert script == "goods.php"
        assert action == "lists"
        assert payload["is_tiktok"] == 0
        return 200, {"code": "0", "msg": "ok", "data": {"list": [], "num": "0"}}

    called = {"count": 0}

    def fake_enrich(_goods_list):
        called["count"] += 1

    monkeypatch.setattr("goods.goods_api.post_json", fake_post_json)
    monkeypatch.setattr("goods.goods_api.enrich_tiktok_goods_list", fake_enrich)

    app = create_app()
    client = app.test_client()
    r = client.post("/api/goods/lists", json={"user": "u", "token": "t", "page": 1, "size": 10, "is_tiktok": 0})
    assert r.status_code == 200
    assert r.get_json()["code"] == "0"
    assert called["count"] == 0


def test_extract_primary_image_url_prefers_og_image():
    from goods.thumb_enrichment import extract_primary_image_url

    html = """
    <html><head>
      <meta property="og:image" content="/assets/p.jpg">
      <meta name="twitter:image" content="https://img.example.com/t.jpg">
    </head></html>
    """
    base_url = "https://topm.tech/new/detail.html?goods_id=1"
    assert extract_primary_image_url(html, base_url=base_url) == "https://topm.tech/assets/p.jpg"


def test_fetch_thumb_from_goods_info_prefers_pictures(monkeypatch):
    from goods.thumb_enrichment import fetch_thumb_from_goods_info

    class FakeResp:
        status_code = 200

        def raise_for_status(self):
            return None

        def json(self):
            return {
                "code": 0,
                "msg": "ok",
                "data": {"pictures": [{"img_url": "https://img.example.com/a.jpg"}]},
            }

    class FakeSession:
        def post(self, *_args, **_kwargs):
            return FakeResp()

    assert fetch_thumb_from_goods_info(123, session=FakeSession()) == "https://img.example.com/a.jpg"
