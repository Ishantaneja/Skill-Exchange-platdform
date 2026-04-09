# Quick Reference Card

## Keep This Open While Testing

### Console Log Tags
Look for these [TAGS] in browser console (F12):

```
[AUTH]      - Login/logout, authentication flow
[PROFILE]   - Profile load/save, auto-creation
[SKILLS]    - Skill list, add, delete operations
[API]       - All API requests, errors, status codes
[REQUESTS]  - Request list, accept, reject
[SESSIONS]  - Session list, complete, create
[CHAT]      - WebSocket connection, messages
[RATING]    - Rating submission
[ERROR]     - Any unexpected errors
```

### Commands to Run

> **Note:** Vite sometimes chooses a different port if 3000 is busy, e.g. `localhost:3001`.  If that happens either kill the other process or set `PORT=3000` before `npm run dev`.  The origin printed in console during auth must match one of the authorized domains in your Firebase project.

#### Start Backend
```bash
cd backend
uvicorn app.main:app --reload --port 8000
# Look for: "Application startup complete"
```

#### Start Frontend
```bash
cd frontend  
npm run dev
# Look for: "VITE v5..." and local URL
```

#### Test Backend is Running
```bash
curl http://127.0.0.1:8000/docs
# Should return: 200 OK with API docs
```

#### Check MongoDB
```bash
mongosh
use skill_exchange
db.userprofiles.find()
# Should return user documents
```

#### Check Dev Token
```javascript
// In browser console
localStorage.getItem('dev_token')
// Should return: "dev"
```

### DevTools Tabs

#### 1. Console (F12 → Console)
- **Look for**: [TAG] prefixed logs
- **Search for**: [API] to find API calls
- **Red errors**: Actual problems
- **Black text**: Information/debugging

#### 2. Network (F12 → Network)
- **Filter**: XHR/Fetch to see API calls
- **Green status**: 200-299 (success)
- **Red status**: 400-599 (errors)
- **Check**: Authorization header present?

#### 3. Application (F12 → Application)
- **Storage → Local Storage → localhost:3000**
- **Look for**: `dev_token` key
- **Value**: Should be `"dev"`

### Expected Behavior

| Action | Expected Result | Console Shows |
|--------|-----------------|---------------|
| Click "Dev Login" | Page stays on login, then redirects | [AUTH] Dev token set |
| Click "Sign in with Google" | Page will redirect to Google and return | [AUTH] Starting Google sign-in via redirect, [AUTH] Redirect result user |
| Go to Skills | Skills page loads | [SKILLS] Fetching, [SKILLS] Fetched |
| Add Skill | Skill appears in list | [SKILLS] Adding, [SKILLS] Success |
| Click Profile | Profile loads | [PROFILE] Fetching, [PROFILE] Loaded |
| Edit Profile | Changes save | [PROFILE] Saving, [PROFILE] Updated |
| Go to Requests | Requests list loads | [REQUESTS] Fetching, [REQUESTS] Fetched |
| Go to Chat | Chat connects | [CHAT] Connecting, [CHAT] Connected |

### What Should NEVER Happen

❌ "POST /api/skills" (should be just "/skills")
❌ "Failed to add skill" without error details
❌ "401" without redirect to login
❌ "Cannot read property of undefined"
❌ CORS errors
❌ "net::ERR_CONNECTION_REFUSED"
❌ Missing Authorization header

### Step-by-Step Test (5 min)

1. **Backend Running?** 
   ```bash
   curl http://127.0.0.1:8000/docs
   ```

2. **Frontend Running?**
   ```bash
   Open http://localhost:3000
   ```

3. **Logged In?**
   - Click "Dev Login"
   - Check console: [AUTH] logs
   - Check localStorage: dev_token exists

4. **API Working?**
   - Click Skills
   - Check console: [SKILLS] logs
   - Check Network: GET /skills → 200
   - Check Authorization header present

5. **Error Handling?**
   - Stop backend
   - Try Skills
   - Check error message shows
   - Restart backend (should recover)

### Common Issues

| Error | Solution |
|-------|----------|
| "Cannot POST /skills" | Backend not running or wrong backend URL |
| No [API] logs | Console not open, logs filtered, or wrong URL |
| 401 errors | Token not sent (check localStorage) |
| 404 on /profiles | Profile not created, use "Dev Login (testing)" |
| WebSocket connection fails | Backend not running or wrong URL |
| CORS error | Backend CORS not configured for localhost/127.0.0.1 frontend ports |
| No Authorization header | Interceptor not working, check AuthContext |

### If Something Breaks

**Step 1**: Check console (F12)
- Look for [TAG] logs
- Look for red error messages
- Note the status code (401, 404, 500, etc)

**Step 2**: Check Network tab (F12)
- Find the failing request
- Check response body for error detail
- Check if Authorization header present

**Step 3**: Check backend console
- Look for error messages
- Check if request reached backend
- Verify database connected

**Step 4**: Restart everything
```bash
# Terminal 1: Backend
Ctrl+C (stop)
uvicorn app.main:app --reload --port 8000 (restart)

# Terminal 2: Frontend
Ctrl+C (stop)
npm run dev (restart)

# Browser
F5 (refresh)
```

**Step 5**: Check docs
- `DEBUG_GUIDE.md` - Detailed troubleshooting
- `FIXES_SUMMARY.md` - What was changed
- `TESTING_CHECKLIST.md` - Step-by-step testing

### Useful URLs

- Frontend: http://localhost:3000
- Backend API: http://127.0.0.1:8000
- API Docs: http://127.0.0.1:8000/docs
- OpenAPI: http://127.0.0.1:8000/openapi.json

### Quick Debugging Commands

```javascript
// In browser console
// Check if logged in
localStorage.getItem('dev_token')

// Check network request format
axios.get('/skills')  // Should work

// Check axios config
axios.defaults.baseURL

// Check interceptors active
axios.interceptors.request.handlers

// Clear all data (fresh start)
localStorage.clear()
```

### Files to Remember

```
frontend/src/
├── AuthContext.jsx          ← Token, baseURL, interceptors
├── pages/
│   ├── Skills.jsx           ← [SKILLS] logging
│   ├── Profile.jsx          ← [PROFILE] logging
│   ├── Chat.jsx             ← [CHAT] logging
│   ├── Rating.jsx           ← [RATING] logging
│   ├── Requests.jsx         ← [REQUESTS] logging
│   └── Sessions.jsx         ← [SESSIONS] logging

backend/app/
├── main.py                  ← CORS config
├── routers/
│   ├── profiles.py          ← POST endpoint added
│   ├── skills.py
│   ├── requests.py
│   ├── sessions.py
│   ├── chat.py
│   └── ratings.py
└── schemas/
    └── user.py              ← Optional fields
```

### When to Check What

| Situation | Check |
|-----------|-------|
| Feature doesn't appear | [TAG] logs + Network tab + Backend console |
| API returns error | Error message + Status code + Response body |
| Token not working | localStorage dev_token + Authorization header |
| Database empty | MongoDB with `db.userprofiles.find()` |
| WebSocket fails | [CHAT] logs + Backend WebSocket handler |
| Can't login | [AUTH] logs + Backend auth module |
| Page won't load | Browser console for JS errors + Network errors |

### Success Indicators

✅ You'll know it's working when:

1. See [AUTH] logs → Authentication working
2. See [API] logs → Requests being sent
3. Network shows 200 status → Backend responding
4. Authorization header present → Token attached
5. Feature data appears → API returning data
6. No red console errors → No unhandled exceptions
7. Can add skills → Full API flow working
8. Can chat → WebSocket working
9. Can create request → Complex operations working
10. All pages load → Complete system working

---

**Print This Out** or keep open while testing.
Keep it handy for quick reference during debugging!
