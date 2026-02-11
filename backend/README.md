# Backend (Flask: API proxy + static frontend)

This module follows the same pattern as `home-module`: a single Flask `app.py` serves both the static frontend and `/api/*` routes.

## Run

```bash
cd backend
python -m venv venv
venv\\Scripts\\activate
pip install -r requirements.txt
python app.py
```

- Frontend: `http://localhost:5051/login.html`
- Health: `http://localhost:5051/api/health`
- Login: `POST http://localhost:5051/api/login` (or `/api/token`)
