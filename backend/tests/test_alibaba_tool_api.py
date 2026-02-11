from pathlib import Path


def test_alibaba_tool_url_extract():
    from app import create_app

    app = create_app()
    client = app.test_client()
    r = client.post(
        "/api/alibaba_tool/url_extract",
        json={
            "user": "alibaba",
            "token": "t",
            "url": "https://www.alibaba.com/product-detail/USB-Sound-Card-Audio-5-1_1601258658943.html",
        },
    )
    assert r.status_code == 200
    payload = r.get_json()
    assert payload["code"] == "0"
    assert payload["data"]["product_id"] == "1601258658943"


def test_alibaba_tool_config_get_shape():
    from app import create_app

    app = create_app()
    client = app.test_client()
    r = client.post("/api/alibaba_tool/config_get", json={"user": "alibaba", "token": "t"})
    assert r.status_code == 200
    payload = r.get_json()
    assert payload["code"] == "0"
    assert "defaults" in payload["data"]
    assert "effective" in payload["data"]
    assert "ELEGATE_BASE_ORIGIN" in payload["data"]["effective"]


def test_alibaba_tool_elegate_products_list(monkeypatch):
    from app import create_app

    def fake_list_products_v3(*, per_page, page, base_origin, consumer_key, consumer_secret, timeout, user_agent=None):
        assert per_page == 10
        assert page == 1
        assert base_origin
        assert consumer_key
        assert consumer_secret
        assert timeout
        return [{"id": "1", "sku": "A", "title": "T"}]

    monkeypatch.setattr("alibaba_tool.alibaba_tool_api.elegate_utils.list_products_v3", fake_list_products_v3)

    app = create_app()
    client = app.test_client()
    r = client.post("/api/alibaba_tool/elegate/products_list", json={"user": "alibaba", "token": "t", "page": 1, "per_page": 10})
    assert r.status_code == 200
    payload = r.get_json()
    assert payload["code"] == "0"
    assert payload["data"]["list"][0]["sku"] == "A"


def test_alibaba_tool_alibaba_products_list(monkeypatch):
    from app import create_app

    def fake_fetch_product_list(*, index, product_type, size, access_token, app_key, app_secret, server_url):
        assert index == 0
        assert product_type == "mxlocal"
        assert size == 20
        assert access_token and app_key and app_secret and server_url
        return {"result": {"result_data": [123, 456]}}

    def fake_fetch_product_description(*, product_id, country, access_token, app_key, app_secret, server_url):
        assert country == "MX"
        assert access_token and app_key and app_secret and server_url
        return {"result": {"result_data": {"product_id": int(product_id), "title": f"T{product_id}", "status": "ok"}}}

    monkeypatch.setattr("alibaba_tool.alibaba_tool_api.product_utils.fetch_product_list", fake_fetch_product_list)
    monkeypatch.setattr("alibaba_tool.alibaba_tool_api.product_utils.fetch_product_description", fake_fetch_product_description)

    app = create_app()
    client = app.test_client()
    r = client.post("/api/alibaba_tool/alibaba/products_list", json={"user": "alibaba", "token": "t", "page": 1, "size": 20})
    assert r.status_code == 200
    payload = r.get_json()
    assert payload["code"] == "0"
    assert payload["data"]["list"][0]["product_id"] == 123
    assert payload["data"]["list"][0]["title"] == "T123"
    assert payload["data"]["list"][1]["product_id"] == 456


def test_alibaba_tool_product_push_uses_product_data(monkeypatch):
    from app import create_app

    # If product_data is provided, backend should not need to call OpenAPI fetch.
    def fake_fetch_product_description(
        *,
        product_id,
        country="MX",
        access_token="t",
        app_key="k",
        app_secret="s",
        server_url="https://openapi-api.alibaba.com/rest",
    ):
        raise AssertionError("should not fetch product_description when product_data is provided")

    def fake_tk_push_single_product(
        *,
        product_data,
        csv_translations="x",
        csv_failed_push="y",
        cat_tk_csv="z",
        push_url="https://topm.tech/api/alibaba/product.php?action=tiktok",
        request_timeout=300,
        headers=None,
        price_multiplier=21.0,
    ):
        assert isinstance(product_data, dict)
        assert int(product_data.get("product_id")) == 1601258658943
        return {"ok": True, "results": [{"goods_sn": "x", "status_code": 200, "resp_text": "ok"}], "error": None}

    monkeypatch.setattr("alibaba_tool.alibaba_tool_api.product_utils.fetch_product_description", fake_fetch_product_description)
    monkeypatch.setattr("alibaba_tool.alibaba_tool_api.product_upload.tk_push_single_product", fake_tk_push_single_product)

    app = create_app()
    client = app.test_client()
    r = client.post(
        "/api/alibaba_tool/product_push",
        json={
            "user": "alibaba",
            "token": "t",
            "platforms": ["tiktok"],
            "product_data": {"product_id": 1601258658943, "title": "Hello", "images": [], "skus": []},
        },
    )
    assert r.status_code == 200
    payload = r.get_json()
    assert payload["code"] == "0"
    assert payload["data"]["details"]["tiktok"]["ok"] is True

def test_upsert_dotenv():
    from alibaba_tool.alibaba_tool_api import _upsert_dotenv

    env_path = Path(__file__).resolve().parent / "_tmp_env_test.env"
    try:
        env_path.write_text("A=1\n# comment\nB=old\n", encoding="utf-8")
        _upsert_dotenv(env_path, {"B": "2", "C": "hello world"})
        text = env_path.read_text(encoding="utf-8")
        assert "A=1" in text
        assert "B=2" in text
        assert 'C="hello world"' in text
    finally:
        try:
            env_path.unlink(missing_ok=True)
        except Exception:
            pass
