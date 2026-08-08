# Hooked — Deployment Guide

## Local Development

```bash
# Backend (runs on http://localhost:5000)
pip install -r requirements.txt
python backend/app.py

# Frontend (runs on http://localhost:3000)
cd frontend && npm install && npm start
```

Copy `.env.example` → `.env`. Defaults work for local dev. Never commit `.env`.

---

## Deploy to Render

### Pre-deployment checklist
- [ ] Code committed and pushed to `main`
- [ ] `.env` in `.gitignore` and NOT committed
- [ ] Generate a new `FLASK_SECRET_KEY` (don't reuse local):
  ```bash
  python -c "import secrets; print(secrets.token_hex(32))"
  ```

### 1. Create PostgreSQL Database
- Render → "New +" → "PostgreSQL" → Name: `hooked-db`
- Copy the **External Database URL**

### 2. Initialize Schema
```bash
psql '<DATABASE_URL>' < data/schema.sql
```

### 3. Deploy Backend
- Render → "New +" → "Web Service" → connect GitHub repo
- **Name:** `hooked-backend-o2gy` (Render's `.onrender.com` subdomain is assigned at
  creation and does not follow later renames — whatever name you pick here
  is effectively permanent) | **Runtime:** Python 3
- **Build:** `pip install -r requirements.txt`
- **Start:** `python backend/app.py`
- Environment variables:
  ```
  FLASK_SECRET_KEY=...
  DATABASE_URL=...
  GOOGLE_CLIENT_ID=...
  GOOGLE_CLIENT_SECRET=...
  REPLICATE_API_TOKEN=...
  FRONTEND_URL=https://hooked-e36.onrender.com
  ALLOWED_ORIGINS=https://hooked-e36.onrender.com
  FLASK_ENV=production
  ```
  Get `REPLICATE_API_TOKEN` from https://replicate.com/account/api-tokens (requires prepaid credit on the account).

### 4. Update Google OAuth Redirect URI
- Google Cloud Console → OAuth Client → add redirect URI:
  `https://hooked-backend-o2gy.onrender.com/auth/callback`

### 5. Deploy Frontend
- Render → "New +" → "Web Service" → connect GitHub repo
  (Not a Static Site — client-side routing needs a fallback to `index.html`
  on unknown paths, which `serve -s` below handles; Render's Static Site
  rewrite rules work too, but this app's services are both Web Services.)
- **Name:** `hooked-e36` | **Runtime:** Node
- **Build:** `cd frontend && npm install && npm run build`
- **Start:** `cd frontend && npx serve -s build -l $PORT`
- Environment variables:
  ```
  REACT_APP_API_URL=https://hooked-backend-o2gy.onrender.com
  ```

### 6. Verify
- [ ] `https://hooked-backend-o2gy.onrender.com/api/songs/search?params=taylor` returns data
- [ ] Login, swiping, liked songs, and search work on frontend

---

## Redeploying
Push to `main` — Render auto-redeploys. Or click "Redeploy latest commit" in the dashboard.

---

## Troubleshooting

| Issue | Fix |
|---|---|
| Backend won't start | Check Render logs; verify `PORT` usage: `int(os.environ.get("PORT", 5000))` |
| CORS errors | Verify `FRONTEND_URL` / `ALLOWED_ORIGINS` match exact frontend URL |
| OAuth redirects fail | Check redirect URI in Google Console matches backend URL |
| Database errors | Re-run schema: `psql '<DATABASE_URL>' < data/schema.sql` |
| Frontend API calls fail | Verify `REACT_APP_API_URL` in frontend environment (requires a rebuild — it's baked in at build time, not read at runtime) |
| "Invalid Host header" on frontend | Start command must be `npx serve -s build -l $PORT`, not `npm start` (that's the CRA dev server) |

---

> ⚠️ Never commit `FLASK_SECRET_KEY`, `DATABASE_URL`, or OAuth credentials. Set all secrets in the Render dashboard.
