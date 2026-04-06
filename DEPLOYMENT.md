# Deployment Guide for Hooked

## Local Development

1. **Backend:**
   ```bash
   # Install dependencies
   pip install -r requirements.txt

   # Run backend (from root directory)
   cd backend
   python app.py
   ```
   Backend runs on `http://localhost:5000`

2. **Frontend:**
   ```bash
   # Install dependencies
   cd frontend
   npm install

   # Run frontend
   npm start
   ```
   Frontend runs on `http://localhost:3000`

3. **Environment Variables:**
   - Copy `.env.example` to `.env`
   - Default values use localhost (no changes needed for local development)
   - Keep `.env` in `.gitignore` (already configured)

---

## Deployment on Render.com

### Setup Instructions

1. **Push code to GitHub:**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Create Render Account and Link GitHub:**
   - Go to [render.com](https://render.com)
   - Connect your GitHub account
   - Select the `hooked` repository

3. **Deploy Using render.yaml:**
   ```bash
   # Option A: Use render.yaml (automatic setup)
   # Render will automatically read render.yaml and create services
   
   # Option B: Manual setup (see below)
   ```

### Database Setup (PostgreSQL)

1. **Create a PostgreSQL database on Render:**
   - Click "New +" → "PostgreSQL"
   - Name: `hooked-db`
   - Free tier available
   - Copy the External Database URL

2. **Run migrations:**
   ```bash
   psql <YOUR_DATABASE_URL> < data/schema.sql
   psql <YOUR_DATABASE_URL> < data/seed_songs.py  # Optional: seed with songs
   ```

### Environment Variables on Render

#### Backend Service
Set these in Render dashboard (Backend → Environment):

```
FLASK_SECRET_KEY=<generate-new-secret-key>
DATABASE_URL=<postgres-url-from-step-above>
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
FRONTEND_URL=https://hooked-frontend.onrender.com
ALLOWED_ORIGINS=https://hooked-frontend.onrender.com
```

#### Frontend Service
Set these in Render dashboard (Frontend → Environment):

```
REACT_APP_API_URL=https://hooked-backend.onrender.com
```

### Manual Service Creation (if not using render.yaml)

#### Backend Service:
1. Click "New +" → "Web Service"
2. Select GitHub repository
3. **Name:** `hooked-backend`
4. **Runtime:** Python 3
5. **Build Command:** `pip install -r requirements.txt`
6. **Start Command:** `python backend/app.py`
7. Add Environment Variables (see above)
8. Click Deploy

#### Frontend Service:
1. Click "New +" → "Web Service"
2. Select GitHub repository
3. **Name:** `hooked-frontend`
4. **Runtime:** Node
5. **Build Command:** `cd frontend && npm install && npm run build`
6. **Start Command:** `cd frontend && npm start`
7. Add Environment Variables (see above)
8. Click Deploy

---

## Architecture

```
User Browser
    ↓
Hooked Frontend (React @ https://hooked-frontend.onrender.com)
    ↓ API Calls
Hooked Backend (Flask @ https://hooked-backend.onrender.com)
    ↓ DB Query
PostgreSQL Database (Render)
```

---

## Environment Configuration

### Local Development
- Uses `.env` file defaults (`localhost:3000` and `localhost:5000`)
- No changes needed to `.env` for local dev
- Keep `.env` in `.gitignore`

### Production (Render)
- Backend receives `FRONTEND_URL` and `ALLOWED_ORIGINS` from Render environment
- Frontend receives `REACT_APP_API_URL` from Render environment
- All sensitive values stored in Render dashboard (NEVER commit to .env)

---

## Troubleshooting

### CORS Errors
- Check that both services are deployed
- Verify `FRONTEND_URL` and `ALLOWED_ORIGINS` match frontend URL
- Check browser console for exact URL

### Database Connection
- Verify `DATABASE_URL` is correct
- Ensure migrations have been run
- Check Render database dashboard for uptime

### OAuth Redirects Broken
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` set correctly
- Check Google OAuth app settings allow `https://hooked-backend.onrender.com/auth/callback`
- Ensure `FRONTEND_URL` in backend matches deployed frontend URL

---

## Useful Commands

```bash
# Generate a secure secret key
python -c "import secrets; print(secrets.token_hex(32))"

# Test database connection
psql <DATABASE_URL>

# View Render logs
# (In Render dashboard: Service → Logs)

# Restart services
# (In Render dashboard: click "Restart" button)
```

---

## Security Notes

⚠️ **NEVER commit sensitive values to git:**
- FLASK_SECRET_KEY
- DATABASE_URL
- GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
- API Keys

All production secrets must be set in Render dashboard environment variables.
