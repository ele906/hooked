# Render Deployment Checklist

## Pre-Deployment

- [ ] All code committed to GitHub (`main` branch)
- [ ] `.env` file added to `.gitignore` and NOT committed
- [ ] Local testing complete (both frontend and backend working)
- [ ] Generated new `FLASK_SECRET_KEY` (don't reuse local one)

## Step 1: Create PostgreSQL Database on Render

- [ ] Go to [render.com](https://render.com)
- [ ] Click "New +" → "PostgreSQL"
- [ ] Name: `hooked-db`
- [ ] Copy the **External Database URL**
- [ ] Store it safely (you'll need it for both services)

## Step 2: Initialize Database Schema

```bash
# Replace <DATABASE_URL> with your PostgreSQL URL from Render
psql '<DATABASE_URL>' < data/schema.sql
```

- [ ] Schema created successfully
- [ ] Tables visible in Render dashboard

## Step 3: Deploy Backend Service

1. Go to [render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Fill in:
   - **Name:** `hooked_api`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `python backend/app.py`

5. Click "Advanced" and add Environment Variables:
   ```
   FLASK_SECRET_KEY=(generate new one, don't reuse local)
   DATABASE_URL=(paste PostgreSQL URL from Step 1)
   GOOGLE_CLIENT_ID=(from Google OAuth setup)
   GOOGLE_CLIENT_SECRET=(from Google OAuth setup)
   FRONTEND_URL=https://hooked.onrender.com
   ALLOWED_ORIGINS=https://hooked.onrender.com
   FLASK_ENV=production
   ```

6. Click "Deploy"
7. Wait for deployment (may take 5-10 minutes)
8. Note the backend URL (e.g., `https://hooked_api.onrender.com`)

- [ ] Backend deployed successfully
- [ ] Test endpoint: Visit `https://hooked_api.onrender.com/api/songs/search?params=taylor`

## Step 4: Update Google OAuth Redirect URI

1. Go to Google Cloud Console
2. Find your OAuth 2.0 Client ID
3. Add Redirect URI: `https://hooked_api.onrender.com/auth/callback`
4. Save changes

- [ ] OAuth redirect URI updated

## Step 5: Deploy Frontend Service

1. Go to [render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Fill in:
   - **Name:** `hooked`
   - **Runtime:** Node
   - **Build Command:** `cd frontend && npm install && npm run build`
   - **Start Command:** `cd frontend && npm start`

5. Click "Advanced" and add Environment Variables:
   ```
   REACT_APP_API_URL=https://hooked_api.onrender.com
   ```

6. Click "Deploy"
7. Wait for deployment
8. Note the frontend URL (e.g., `https://hooked.onrender.com`)

- [ ] Frontend deployed successfully
- [ ] Test at frontend URL in browser

## Step 6: Test Full Application

1. Visit your frontend URL
2. Test login/signup with Google
3. Test song swiping and liking
4. Check browser console for errors
5. Check Render logs if issues

- [ ] Login works
- [ ] Song fetching works
- [ ] Liked songs work
- [ ] Search works

## Troubleshooting

### Backend (hooked_api) won't start
- Check logs: "Logs" tab in Render dashboard
- Ensure PORT env variable behavior: `int(os.environ.get("PORT", 5000))`
- Check DATABASE_URL format and connectivity

### CORS errors
- Verify `FRONTEND_URL` and `ALLOWED_ORIGINS` in backend
- Check that frontend URL is exactly correct (including https)

### OAuth redirects fail
- Ensure redirect URI in Google Cloud Console matches backend URL
- Check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct

### Database errors
- Initialize schema: `psql '<DATABASE_URL>' < data/schema.sql`
- Check DATABASE_URL is correct (with quotes around URL)

### Frontend (hooked) API calls fail
- Check browser console for exact error
- Verify `REACT_APP_API_URL` in frontend environment
- Test backend directly: `https://hooked_api.onrender.com/api/songs/search?params=taylor`

## Local Development After Deployment

Everything still works the same locally:
```bash
# Terminal 1: Backend
cd backend
python app.py

# Terminal 2: Frontend
cd frontend
npm start
```

Uses `.env` defaults (localhost) automatically.

## Redeploying After Changes

1. Commit changes locally
2. Push to GitHub (`main` branch)
3. Render automatically redeploys (watch "Deployment" tab)
4. Or manually click "Redeploy latest commit" in Render dashboard
