# Seller Login (Token)

In this seller module, “login” means getting a seller `token` via the upstream API:

- `https://topm.tech/api/seller/token.php?action=get_token`

## Local Run (single `app.py`)

1. Install backend deps:
   - `cd backend`
   - create venv + install: `pip install -r requirements.txt`
2. Start (serves both frontend + API on the same port):
   - `cd backend`
   - `python app.py`
3. Open:
   - `http://localhost:5051/login.html`

## Frontend Contract

- `POST http://localhost:5051/api/login`
  - JSON: `{ "user": "...", "pass": "..." }`
  - Success: upstream payload is returned (usually `code == "0"` and `data.token` exists)

## Login Page UX

- “记住密码”：勾选后会把账号和密码保存在浏览器本地 `localStorage`（key: `topm_login_remember`），用于下次自动填充。
