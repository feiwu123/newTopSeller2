# Frontend (static files)

The frontend is served by the backend Flask app (same origin).

Tailwind CSS is localized to `./styles/tailwind.generated.css` (no runtime Tailwind CDN dependency).
Font Awesome and Inter are localized to:

- `./vendor/fontawesome/css/all.min.css`
- `./vendor/fontawesome/webfonts/*`
- `./vendor/inter/inter.css` (imports 300/400/500/600/700)
- `./vendor/inter/files/*`

## Run

Start the backend:

```bash
cd backend
python app.py
```

Then open:

- `http://localhost:5051/login.html`
- `http://localhost:5051/dashboard.html`

## Rebuild Tailwind CSS

If you changed `dashboard.html`, `order-item.html`, or files under `pages/`, rebuild:

```bash
npx tailwindcss@3.4.17 -c frontend/tailwind.config.js -i frontend/styles/tailwind.input.css -o frontend/styles/tailwind.generated.css --minify
```
