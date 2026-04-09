# Frontend-Backend Integration Debugging Guide

## Recent Fixes Applied

1. ✅ Fixed axios baseURL to use direct backend URL: `http://127.0.0.1:8000`
2. ✅ Added comprehensive console logging to all API calls
3. ✅ Added profile creation endpoint: `POST /profiles`
4. ✅ Added token validation logging in AuthContext
5. ✅ Improved error handling and status code reporting
6. ✅ Made email field optional in user profiles

## How to Debug API Issues

### 1. Check Browser Console (F12)

Open DevTools in your browser and look for logs starting with:

- `[AUTH]` - Authentication events
- `[API]` - API requests/responses
- `[PROFILE]` - Profile operations
- `[SKILLS]` - Skills operations
- `[REQUESTS]` - Request operations
- `[SESSIONS]` - Session operations
- `[CHAT]` - Chat operations
- `[RATING]` - Rating operations

### 2. Check Network Tab

1. Open DevTools > Network tab
2. Look for failed requests (red status codes)
3. Check response headers:
   - `Authorization: Bearer <token>` should be present
   - `Content-Type: application/json`
4. Check response body for error details

### 3. Login and Check Token

```javascript
// In browser console:
console.log(localStorage.getItem('dev_token'));  // Check dev token
```

After Google sign-in, the token should be automatically set in request headers.

## Common Issues and Fixes

### Issue: "Failed to add skill" - 401 Unauthorized

**Problem**: Token is not being sent or is invalid.

**Fix**:
1. Make sure you're logged in (see user name in top navigation)
2. Check console for `[AUTH] Got Firebase token:` message
3. If using dev login, check `localStorage.getItem('dev_token')`

**Verify**:
```bash
# Test API with token (dev)
curl -X GET http://127.0.0.1:8000/skills \
  -H "Authorization: Bearer dev" \
  -H "Content-Type: application/json"
```

### Issue: "Unable to load profile" - Cannot find endpoint

**Problem**: Profile endpoint doesn't exist or user isn't logged in.

**Fix**:
1. Ensure you're logged in first
2. Wait for profile to be created automatically on first login
3. Check console for `[PROFILE] Creating new profile` message

**Verify**:
```bash
# Check if user profile exists in MongoDB
# Using MongoDB CLI
use skill_exchange
db.users.findOne({"_id": "dev"})
```

### Issue: Problematic Google sign-in flow

**Problem**: Google popup sign-in can fail if the domain/origin is not authorized in Firebase.
The app currently uses **popup-based** Google sign-in.

**What to watch for**:
- When you click "Sign in with Google" a popup opens for Google authentication.
- Check the console for:
  ```
  [AUTH] Starting Google sign-in via popup
  [AUTH] Popup login succeeded: user@example.com
  ```
- If something goes wrong you'll see an alert with the Firebase error code and message.

**Common issues**:
1. `auth/unauthorized-domain` – The current origin (`localhost:3000`, `localhost:3001`, `127.0.0.1:3001`, etc.) is not authorized in your Firebase project. Add **every origin** you may use to **Authentication → Settings → Authorized domains**. Note that if Vite picks a random port, you may need to restart it on 3000 or explicitly set the `PORT` env variable.
2. `auth/network-request-failed` – maybe no internet connection.

**Fix**:
- Add the printed origin to Firebase's authorized domains.
- Ensure you are using `http://` not `file://` or some other scheme.
- If you don't care about dynamic ports, kill whatever is using 3000 and restart Vite so it stays on 3000.

**Verify**:
- After a successful popup login you should see the `[AUTH] Popup login succeeded:` log and the UI will show you as logged in.
- If you still get an alert, it will contain the error code; follow the guidance above or consult the error documentation at https://firebase.google.com/docs/auth/admin/errors.

### Issue: CORS Error - Cross-origin request blocked

**Problem**: Frontend on port 3000 can't reach backend on port 8000.

**Fix**: 
- Backend already has CORS enabled for all origins
- Verify backend is running: `http://127.0.0.1:8000/docs` should return 200

### Issue: "WebSocket connection failed"

**Problem**: Chat WebSocket connection can't establish.

**Fix**:
1. Ensure you have a valid session (from accepting a request)
2. Session ID must be passed correctly in URL
3. Token must be valid

**Test**:
```javascript
// In browser console
const sock = new WebSocket('ws://127.0.0.1/chat/ws/YOUR_SESSION_ID?token=dev');
sock.onopen = () => console.log('Connected');
sock.onerror = (e) => console.error('Error:', e);
```

## Step-by-Step Testing

### 1. Test Backend API Directly

```bash
# Get health check
curl http://127.0.0.1:8000/docs

# Try to list skills (might return empty if unauthorized)
curl -X GET http://127.0.0.1:8000/skills \
  -H "Authorization: Bearer dev"

# Create a skill
curl -X POST http://127.0.0.1:8000/skills \
  -H "Authorization: Bearer dev" \
  -H "Content-Type: application/json" \
  -d '{"name": "Python"}'

# Check if profile exists
curl -X GET http://127.0.0.1:8000/profiles/me \
  -H "Authorization: Bearer dev"

# Create profile if doesn't exist
curl -X POST http://127.0.0.1:8000/profiles \
  -H "Authorization: Bearer dev" \
  -H "Content-Type: application/json" \
  -d '{"name": "Dev User", "email": "dev@test.local", "availability": "24/7"}'
```

### 2. Test Frontend Login

1. Go to http://localhost:3000
2. Click "Dev Login (testing)"
3. Open browser DevTools (F12)
4. Check Console tab - should see:
   - `[AUTH] Logging in with dev token`
   - `[AUTH] Dev token set successfully`
   - `[PROFILE] Checking profile for dev`
   - `[PROFILE] Creating new profile` (if first login)

### 3. Test Add Skill

1. After login, click "Add Skill"
2. Type a skill name and click button
3. Check console for:
   - `[SKILLS] Adding skill: <name> Auth: YES`
   - `[API] POST /skills` with `hasAuth: YES`
   - `[SKILLS] Skill added successfully`

## Checking MongoDB Connection

```bash
# If MongoDB is running locally:
# Open MongoDB Compass or use mongosh

# List databases
db.adminCommand({listDatabases: 1})

# Check skill_exchange
use skill_exchange

# Check collections
show collections

# Check users
db.users.find()

# Check skills
db.skills.find()
```

## API Endpoint Checklist

Verify these endpoints are working:

- ✅ `GET /skills` - List all skills
- ✅ `POST /skills` - Add skill (needs auth)
- ✅ `GET /profiles/me` - Get current user profile (needs auth)
- ✅ `POST /profiles` - Create profile (needs auth)
- ✅ `PUT /profiles/me` - Update profile (needs auth)
- ✅ `GET /requests/incoming` - Get incoming requests (needs auth)
- ✅ `GET /requests/outgoing` - Get outgoing requests (needs auth)
- ✅ `POST /requests/<id>/accept` - Accept request (needs auth)
- ✅ `POST /requests/<id>/reject` - Reject request (needs auth)
- ✅ `GET /sessions/me` - Get user sessions (needs auth)
- ✅ `POST /sessions/<id>/complete` - Complete session (needs auth)
- ✅ `ws://127.0.0.1:8000/chat/ws/<session_id>?token=<token>` - WebSocket chat
- ✅ `POST /ratings` - Submit rating (needs auth)

## Environment Configuration

### Frontend (.env or hardcoded)
- Backend URL: `http://127.0.0.1:8000`
- Should be used directly, NOT through `/api` proxy

### Backend
- CORS: Allows localhost and 127.0.0.1 frontend ports (3000-3005)
- MongoDB: Default localhost:27017
- Port: 8000

### Firefox/Chrome DevTools Tips

1. **Keep Network tab open** during testing to see all requests
2. **Set filter** to see only failed requests (red)
3. **Check Headers** tab to verify Authorization header
4. **Check Response** tab to see error messages from backend
5. **Console filter** - type `[AUTH]` to see only auth logs

## Still Having Issues?

1. **Restart both services**:
   ```bash
   # Kill port 3000 (frontend)
   npx kill-port 3000
   
   # Kill port 8000 (backend)
   npx kill-port 8000
   
   # Restart from scratch
   ```

2. **Check MongoDB is running**:
   ```bash
   # Windows: MongoDB should be running as service
   # Or start it manually if using local copy
   ```

3. **Clear browser cache**:
   - DevTools > Application > Clear site data
   - Or open in incognito window

4. **Check logs** in browser console and server terminal for specific error messages

## Production Checklist

When deploying:
- [ ] Update Firebase project ID and config
- [ ] Set proper CORS origins (not `["*"]`)
- [ ] Configure MongoDB connection string (not localhost)
- [ ] Set environment variables for sensitive data
- [ ] Enable Firebase service account verification
- [ ] Update API_URL in AuthContext for production domain
