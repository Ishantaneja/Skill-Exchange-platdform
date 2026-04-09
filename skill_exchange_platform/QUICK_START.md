# Quick Start - Testing the Full Integration

## Prerequisites

1. **Backend Running**: `uvicorn app.main:app --reload --port 8000`
2. **Frontend Running**: `npm run dev` (port 3000)
3. **MongoDB Running**: Local MongoDB or Atlas connection configured
4. **Browser**: Chrome, Firefox, Safari, or Edge with DevTools

## Step 1: Verify Backend is Running

Open in browser or terminal:
```bash
curl http://127.0.0.1:8000/docs
# Should return 200 OK
```

Visit: http://127.0.0.1:8000/docs
- Should show Swagger UI with all API endpoints

## Step 2: Open Frontend with DevTools

1. Go to: http://localhost:3000
2. Open DevTools: Press `F12`
3. Go to **Console** tab
4. Keep this window on right side, website on left side

## Step 3: Test Dev Login

1. Click **"Dev Login (testing)"** button
2. Watch console for messages:
   ```
   [AUTH] Logging in with dev token
   [AUTH] Dev token set successfully
   [PROFILE] Checking profile for dev
   [PROFILE] Creating new profile: ...
   [PROFILE] Profile created: ...
   ```
3. Should see user name "Developer" in top navigation

## Step 4: Test Skills Management

1. Click **"Skills"** in navigation (or you're already there)
2. Watch list load - console should show:
   ```
   [SKILLS] Fetching skills...
   [API] GET /skills { hasAuth: YES }
   [API] Success 200: /skills
   [SKILLS] Fetched: 0 skills
   ```

3. Type "Python" in the text field
4. Click **"Add Skill"** button
5. Watch console:
   ```
   [SKILLS] Adding skill: Python Auth: YES
   [API] POST /skills { hasAuth: YES }
   [SKILLS] Skill added successfully
   [SKILLS] Fetching skills...
   [SKILLS] Fetched: 1 skills
   ```
6. Should see "Python" appear in the list below

## Step 5: Test Profile Management

1. Click **"Profile"** in navigation
2. Watch console:
   ```
   [PROFILE] Fetching profile for user: dev@localhost
   [API] GET /profiles/me { hasAuth: YES }
   [PROFILE] Profile fetched: { name: "Developer", ... }
   ```
3. Should show your profile details
4. Click **"Edit Profile"**
5. Change name to something else
6. Click **"Save"**
7. Watch console for update confirmation

## Step 6: Test Error Handling

1. Open DevTools **Network** tab alongside Console
2. Refresh page (Ctrl+R)
3. Try add skill **without logging in**:
   - Clear localStorage: `localStorage.removeItem('dev_token')`
   - Refresh page
   - Try to add skill
   - Should see: `[API] Error 401: /skills`

4. Should redirect to login page

## Step 7: Check Database

Open MongoDB Compass or terminal:

```bash
# Using mongosh if installed
mongosh
use skill_exchange
db.users.findOne({"_id": "dev"})
db.skills.find()
```

Should see:
- User document with `_id: "dev"`
- Skill docs with the skill you created

## Expected Behavior

### ✅ Working Correctly If:

1. **Login**
   - Dev token login succeeds instantly
   - User name appears in navigation
   - Console shows token set and profile created

2. **Add Skill**
   - No error message
   - Skill appears in list below
   - Console shows success messages

3. **Profile**
   - Shows user information
   - Can edit and save changes
   - Console shows all operations succeed

4. **Logout**
   - User name disappears from navigation
   - Token is cleared from headers
   - Cannot access protected pages

### ❌ Something Wrong If:

1. **Can't add skill**
   - Check: Is user logged in? (Name in top nav)
   - Check console for `[API] Error` with status code
   - Check Network tab for failed request

2. **Can't load profile**
   - Check console for `[PROFILE] Creating new profile`
   - If shows error, MongoDB might not be connected

3. **WebSocket chat fails**
   - Ensure you have a valid session first
   - Check token is being sent: `?token=dev`

4. **CORS errors**
   - Backend should allow all origins
   - Check browser console for: `Access-Control-Allow-Origin`

## Console Log Levels

### 🟢 GREEN - Everything OK
```
[SKILLS] Skill added successfully
[API] Success 200: /skills
[PROFILE] Profile exists: { ... }
```

### 🔵 BLUE - Information
```
[AUTH] Logging in with dev token
[SKILLS] Fetching skills...
[API] POST /skills { hasAuth: YES }
```

### 🟡 YELLOW - Warnings
```
[AUTH] Token expired or invalid, logging out
WARNING: Firebase service account file not found
```

### 🔴 RED - Errors
```
[API] Error 401: /profiles/me
[SKILLS] Fetch error: { status: 404, message: "Not found" }
[CHAT] WebSocket error: ...
```

## Quick Debugging Commands

Run these in browser console (F12):

```javascript
// Check dev token
localStorage.getItem('dev_token')

// Check axios config
axios.defaults.baseURL
axios.defaults.headers.common

// Test direct API call
fetch('http://127.0.0.1:8000/skills', {
  headers: { 'Authorization': 'Bearer dev' }
}).then(r => r.json()).then(d => console.log(d))

// Check MongoDB connection
// (Backend logs should show "MongoDB connected" on startup)
```

## Common Issues Quick Fixes

| Issue | Check | Fix |
|-------|-------|-----|
| Can't add skill | Console for `[API] Error 401` | Click "Dev Login (testing)" |
| 404 Not Found | API endpoint name matches | Check backend router paths |
| Profile won't load | Is MongoDB running? | Start MongoDB service |
| CORS blocked | Backend CORS config | Allow localhost/127.0.0.1 frontend ports in `allow_origins` |
| Token not sent | Look for `hasAuth: YES` in logs | Check localStorage |
| Chat won't connect | Valid session ID? | Create session first |

## Monitoring the Backend

Open another terminal and watch backend logs:

```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
cd backend
uvicorn app.main:app --reload --port 8000 --log-level debug
```

Backend logs will show:
```
INFO:     Application startup complete
DEBUG:    [GET] /skills - 200 OK
DEBUG:    [POST] /profiles - 201 Created
INFO:     127.0.0.1:52345 - "GET /skills HTTP/1.1" 200
```

## Full Workflow Test

1. ✅ Login with dev
2. ✅ View skills (should be empty)
3. ✅ Add 3 skills: Python, JavaScript, React
4. ✅ View skills (should show 3)
5. ✅ Go to Profile
6. ✅ Edit profile - change name
7. ✅ Save profile
8. ✅ Go back to Skills
9. ✅ Logout (click button in top right)
10. ✅ Should redirect to login
11. ✅ Click "Dev Login (testing)" again
12. ✅ Profile should still exist with your edited name

## Performance Notes

- First load might be slow due to token verification
- Subsequent requests should be fast (<100ms)
- If slower, check:
  - MongoDB connection
  - Network tab for slow requests
  - Backend console for errors

## Next Steps After Testing

1. Test Google Sign-In (requires Firebase config)
2. Test WebSocket chat (requires valid session)
3. Test full workflow: Request → Accept → Chat → Rate
4. Load test with multiple requests
5. Test error scenarios (wrong token, deleted user, etc)

## Support Resources

- **Console Logs**: `DEBUG_GUIDE.md` - Detailed debugging
- **Code Changes**: `FIXES_SUMMARY.md` - All fixes applied
- **API Docs**: http://127.0.0.1:8000/docs - Swagger
- **Code**: Check page components for error handling examples

---

**Remember**: Keep DevTools open and watch the console logs - they tell you exactly what's happening at each step!
