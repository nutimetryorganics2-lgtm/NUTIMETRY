# 🚀 Nutimetry Organics: Production Deployment Guide

This guide outlines the exact steps to transition the Nutimetry Organics platform from development to a clean, professional production environment.

## 1. 🧹 Data Sanitation (Completed)
I have already executed the surgical purge of test data. Your database is now in a "Pristine State":
*   **Orders**: 0 (Clean slate)
*   **Enquiries**: 0 (Clean slate)
*   **Users**: Only the Admin account is preserved.
*   **Products**: Preserved (Ready for sale).

> [!IMPORTANT]
> To re-run the cleanup at any time, use:
> `python backend/production_ready.py`

---

## 2. 🏗️ Infrastructure Recommendations (Free Tier)

To deploy without cost while maintaining high performance, use the following stack:

| Component | Platform | Plan | Setup Role |
| :--- | :--- | :--- | :--- |
| **Frontend** | [Vercel](https://vercel.com) | Hobby (Free) | Hosts the React UI |
| **Backend** | [Render](https://render.com) | Web Service (Free) | Hosts the FastAPI logic |
| **Database** | [MongoDB Atlas](https://mongodb.com) | Shared M0 (Free) | Persistent Data Storage |
| **Monitoring** | [Sentry](https://sentry.io) | Developer (Free) | Error Tracking |

---

## 3. 📤 Deployment Steps

### Step A: Prepare the Repository
1.  Ensure you have a `.gitignore` file in the root.
2.  Initialize a Git repo and push to a **Private** GitHub/GitLab repository.

### Step B: Deploy the Backend (Render)
1.  Create a new **Web Service** on Render and link your repo.
2.  **Root Directory**: `backend`
3.  **Build Command**: `pip install -r requirements.txt`
4.  **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5.  **Environment Variables**:
    *   `MONGODB_URL`: Your Atlas connection string.
    *   `JWT_SECRET`: A long random string for security.
    *   `ENVIRONMENT`: `production`
    *   `SENTRY_DSN`: (Optional) Your Sentry key.

### Step C: Deploy the Frontend (Vercel)
1.  Create a new Project on Vercel and link your repo.
2.  **Framework Preset**: Vite
3.  **Root Directory**: `frontend`
4.  **Environment Variables**:
    *   `VITE_API_URL`: The URL provided by Render (e.g., `https://nutimetry-api.onrender.com`)

---

## 4. 🔒 Post-Deployment Checklist

1.  **Admin Verification**: Log in to the dashboard at your production URL. Verify the order count is zero.
2.  **CORS Security**: In `backend/app/main.py`, ensure your Vercel URL is added to `allow_origins`.
3.  **Password Strength**: Change your admin password immediately after deployment using the "Profile" section.
4.  **Local Backup**: Download the final codebase as a ZIP and store it on a secure local drive or cloud storage.

---

## 5. 💾 Saving to Local System
To save all changes locally before deployment:
1.  Open your terminal in the project root.
2.  Run: `git add .`
3.  Run: `git commit -m "Production ready: UI finalized, data purged, localization complete"`
4.  (Optional) Create a ZIP of the folder for offline backup.

✨ **Nutimetry Organics is now ready for the real broiler farming market.**
