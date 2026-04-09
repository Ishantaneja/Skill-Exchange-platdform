# Firebase Setup for Skill Exchange Platform

This document explains how to set up and configure Firebase for the Skill Exchange Platform.

## Prerequisites

1. A Google/Firebase account
2. Access to the Firebase Console (https://console.firebase.google.com/)

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Create a project**
3. Enter project name (e.g., "Skill Exchange Platform")
4. Click **Continue**
5. Follow the setup wizard (disable Analytics for simplicity, or configure as needed)
6. Click **Create project**

## Step 2: Set Up Authentication

### Enable Google Sign-In in Firebase

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Click **Google** provider
3. Enable it and set the project name and support email
4. Click **Save**

## Step 3: Get Firebase Web Config

1. In Firebase Console, click the **Settings** icon (gear icon) > **Project settings**
2. Scroll to **Your apps** section
3. Click **Web** icon (or add app if no web app exists)
4. Register your app with a nickname (e.g., "Skill Exchange Frontend")
5. Copy the **Firebase Config** object:
   ```javascript
   {
     apiKey: "...",
     authDomain: "...",
     projectId: "...",
     storageBucket: "...",
     messagingSenderId: "...",
     appId: "...",
     measurementId: "..." (optional)
   }
   ```

## Step 4: Update Frontend Config

1. Open [src/firebase.js](./frontend/src/firebase.js)
2. Replace the `firebaseConfig` object with your copied config:
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_AUTH_DOMAIN",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_STORAGE_BUCKET",
     messagingSenderId: "YOUR_SENDER_ID",
     appId: "YOUR_APP_ID",
     measurementId: "YOUR_MEASUREMENT_ID" // optional
   };
   ```
3. Save the file

## Step 5: Add Authorized Domains (Optional, for deployment)

When deploying to a custom domain:

1. Go to **Authentication** > **Settings** tab
2. Scroll to **Authorized domains**
3. Click **Add domain** and enter your domain (e.g., `skillexchange.com`)

## Step 6: Backend Firebase (Optional - for real token verification)

If you want the backend to verify Firebase tokens in production:

1. In Firebase Console, go to **Project Settings** > **Service Accounts**
2. Click **Generate new private key**
3. Download the JSON file and place it in the backend directory:
   ```
   backend/app/services/serviceAccountKey.json  <-- make sure the file lives next to firebase.py; the module looks there at startup
   ```
4. Update `app/services/firebase.py` with the path to the file if different

For development, the backend will accept any token and derive the user ID from the JWT payload.

## Testing

1. Start the backend: `uvicorn app.main:app --reload --port 8000`
2. Start the frontend: `npm run dev`
3. Navigate to http://localhost:3000
4. Click **Sign in with Google** on the login page
5. Authenticate with your Google account
6. You should be redirected to the home page as an authenticated user

## Troubleshooting

### "Firebase SDK error" on login
- Check that the `firebaseConfig` in `src/firebase.js` is correct
- Ensure Google Sign-In is enabled in Firebase Console

### Token not being sent to backend
- Open browser DevTools (F12) > **Application** > **Local Storage**
- Verify that a `dev_token` or valid Firebase token is stored
- Check that the Authorization header is being sent in Network tab

### CORS errors
- Ensure backend is running on http://127.0.0.1:8000
- Check that vite.config.js has the `/api` proxy configured
- Verify CORS middleware is enabled in `app/main.py`

## Additional Resources

- [Firebase JavaScript SDK](https://firebase.google.com/docs/auth/web/google-signin)
- [Firebase Admin SDK (Python)](https://firebase.google.com/docs/admin/setup)
- [Vite Proxy Configuration](https://vitejs.dev/config/server-options.html#server-proxy)
