# Hooked

A music discovery app with swipe-based song recommendations, social features, and vector-based recommendations.

## Features
- Swipe to like/dislike songs with ML-powered recommendations
- Profile page with recent liked songs and previews
- Search songs with hover color effects
- Friends system (view/add friends, view their profiles)
- Protected routes (redirect to login if unauthenticated)

## Prerequisites
- Python 3 + pip
- Node.js + npm
- PostgreSQL
- Cloudinary account

## Backend Setup

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   pip install cloudinary
   ```

2. Configure `.env`:
   ```
   DATABASE_URL=...
   CLOUDINARY_URL=...       # required for profile picture uploads
   # other secrets (JWT, email, etc.)
   ```

3. Set up PostgreSQL:
   ```bash
   psql -U postgres
   # enter password when prompted
   ```
   ```sql
   CREATE DATABASE hooked;
   ```
   ```bash
   psql -U postgres -d hooked -f data/schema.sql
   ```

4. Run the backend:
   ```bash
   python backend/app.py
   ```

## Frontend Setup

```bash
cd frontend
npm install
npm start
```
