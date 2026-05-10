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
- **Name:** `hooked_api` | **Runtime:** Python 3
- **Build:** `pip install -r requirements.txt`
- **Start:** `python backend/app.py`
- Environment variables:
  ```
  FLASK_SECRET_KEY=...
  DATABASE_URL=...
  GOOGLE_CLIENT_ID=...
  GOOGLE_CLIENT_SECRET=...
  FRONTEND_URL=https://hooked.onrender.com
  ALLOWED_ORIGINS=https://hooked.onrender.com
  FLASK_ENV=production
  ```

### 4. Update Google OAuth Redirect URI
- Google Cloud Console → OAuth Client → add redirect URI:
  `https://hooked_api.onrender.com/auth/callback`

### 5. Deploy Frontend
- Render → "New +" → "Static Site" → connect GitHub repo
- **Name:** `hooked`
- **Build:** `cd frontend && npm install && npm run build`
- **Publish Directory:** `frontend/build`
- Environment variables:
  ```
  REACT_APP_API_URL=https://hooked_api.onrender.com
  ```

### 6. Verify
- [ ] `https://hooked_api.onrender.com/api/songs/search?params=taylor` returns data
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
| Frontend API calls fail | Verify `REACT_APP_API_URL` in frontend environment |

---

> ⚠️ Never commit `FLASK_SECRET_KEY`, `DATABASE_URL`, or OAuth credentials. Set all secrets in the Render dashboard.
