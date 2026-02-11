"""
Seller module lightweight proxy API + static frontend server.

This app mirrors the home-module pattern: a single Flask app serves both:
- Static frontend from ../frontend
- Proxy API routes under /api/*
"""

import logging
import os

from dotenv import load_dotenv
from flask import Flask, request
from flask_cors import CORS

from goods.goods_api import goods_bp
from orders.orders_api import orders_bp
from platforms.shein_api import shein_bp
from platforms.temu_api import temu_bp
from platforms.tiktok_api import tiktok_bp
from seller.merchants_logistics_api import merchants_logistics_bp
from seller.seller_shop_info_api import seller_shop_info_bp
from token_api import token_bp
from wholesales.wholesales_api import wholesales_bp


def _parse_cors_origins(value: str):
    raw = (value or "").strip()
    if not raw or raw == "*":
        return "*"
    origins = [o.strip() for o in raw.split(",") if o.strip()]
    return origins or "*"


def create_app() -> Flask:
    load_dotenv()

    base_dir = os.path.dirname(os.path.abspath(__file__))
    frontend_dir = os.path.abspath(os.path.join(base_dir, "..", "frontend"))

    app = Flask(__name__, static_folder=frontend_dir, static_url_path="")
    # Dev-friendly: avoid stale frontend assets (JS/CSS/HTML) causing hard-to-debug behavior.
    app.config["SEND_FILE_MAX_AGE_DEFAULT"] = 0
    app.logger.setLevel(logging.INFO)

    CORS(
        app,
        resources={r"/api/*": {"origins": _parse_cors_origins(os.getenv("CORS_ORIGINS", "*"))}},
        supports_credentials=False,
    )

    app.register_blueprint(token_bp)
    app.register_blueprint(orders_bp)
    app.register_blueprint(goods_bp)
    app.register_blueprint(tiktok_bp)
    app.register_blueprint(shein_bp)
    app.register_blueprint(temu_bp)
    # Optional: Alibaba tool module may be absent in some deployments.
    disable_alibaba = os.getenv("DISABLE_ALIBABA_TOOL", "").strip().lower() in {"1", "true", "yes", "y"}
    if not disable_alibaba:
        try:
            from alibaba_tool.alibaba_tool_api import alibaba_tool_bp  # type: ignore
        except Exception as exc:
            app.logger.warning("Alibaba tool disabled (import failed): %s", exc)
        else:
            app.register_blueprint(alibaba_tool_bp)
    app.register_blueprint(merchants_logistics_bp)
    app.register_blueprint(seller_shop_info_bp)
    app.register_blueprint(wholesales_bp)

    @app.get("/api/health")
    def health():
        return {"ok": True}

    @app.get("/")
    def index():
        return app.send_static_file("login.html")

    @app.after_request
    def _no_cache_static_assets(resp):
        path = request.path if request else ""
        # Best-effort: disable caching for frontend assets served by this Flask app.
        if path and (path.endswith(".html") or path.endswith(".js") or path.endswith(".css")):
            resp.headers["Cache-Control"] = "no-store"
        return resp

    return app


app = create_app()


if __name__ == "__main__":
    port = int(os.getenv("PORT", "5051"))
    debug = os.getenv("DEBUG", "").strip().lower() in {"1", "true", "yes", "y"}
    app.run(host="0.0.0.0", port=port, debug=debug)
