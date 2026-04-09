# Integration Testing Checklist

Use this checklist to systematically verify all fixes are working correctly.

## Pre-Test Setup

- [ ] Backend running: `uvicorn app.main:app --reload --port 8000`
  - Verify: `curl http://127.0.0.1:8000/docs` returns 200
  
- [ ] Frontend running: `npm run dev`
  - Verify: Can open `http://localhost:3000` without errors
  
- [ ] Browser DevTools open: Press `F12`
  - Go to Console tab
  - Go to Network tab
  
- [ ] MongoDB running
  - Check backend console for connection message

---

## Authentication Testing

### Dev Login
- [ ] Click "Dev Login (testing)" button
- [ ] Should see instant login success
- [ ] Check console for: `[AUTH] Dev token set successfully`
- [ ] Check localStorage: `localStorage.contains('dev_token')`
- [ ] Should redirect to dashboard
- [ ] Should show user as logged in
- [ ] Note: No profile visible yet (auto-created during first feature use)

**Expected Behavior**: Login completes instantly with [AUTH] logs visible

### Google Sign-In
- [ ] Click "Sign in with Google" button
- [ ] Complete Google auth flow
- [ ] Should see `[AUTH] User logged in:` in console
- [ ] Should show user email in profile
- [ ] Should see profile auto-created message
- [ ] Should redirect to dashboard

**Expected Behavior**: Google login works, profile auto-created, see [AUTH] logs

### Logout
- [ ] Click user profile menu
- [ ] Click "Logout" button
- [ ] Should see `[AUTH] Logging out` in console
- [ ] Should redirect to login page
- [ ] localStorage should clear dev_token
- [ ] Should no longer show logged-in state

**Expected Behavior**: Clean logout with [AUTH] logs, token cleared

---

## API Communication Testing

### Authorization Header
- [ ] After login, open Network tab
- [ ] Make any API call (e.g., go to Skills page)
- [ ] Find the request to `/skills` or `/profiles`
- [ ] Click on the request
- [ ] Go to "Request Headers"
- [ ] Look for: `Authorization: Bearer dev`
- [ ] Should be present on EVERY request

**Expected Behavior**: Token automatically attached to all requests

### Console Logging
- [ ] Open Console tab
- [ ] Make API call (e.g., add a skill)
- [ ] Should see [API] log with request details
- [ ] Should see response status code
- [ ] Should see `hasAuth: YES` in logs
- [ ] Format should be: `[TAG] Description { details }`

**Expected Behavior**: Comprehensive logs with [API] tags on every request

---

## Skills Feature Testing

### List Skills
- [ ] Click "Skills" in navigation
- [ ] Check console: Should see `[SKILLS] Fetching skills...`
- [ ] Page should load
- [ ] If skills exist, should display list
- [ ] Check Network tab: Request to `/skills` should be 200
- [ ] Check console: Should see `[SKILLS] Fetched: X skills`

**Expected Behavior**: Skills load with proper logging

### Add Skill
- [ ] On Skills page, enter skill name (e.g., "Python")
- [ ] Click "Add Skill" button
- [ ] Check console: `[SKILLS] Adding skill: Python`
- [ ] Check Network tab: POST request to `/skills` should be 200
- [ ] Check console: `[SKILLS] Skill added successfully`
- [ ] Skill should appear in list
- [ ] No error message should appear

**Expected Behavior**: Skill added successfully with [SKILLS] logs

### Add Skill Error Handling
- [ ] Try to add skill with no name (empty)
- [ ] Should show validation error
- [ ] Check Network tab: Request might be 400 (validation error)
- [ ] Check console: Should see error details

**Expected Behavior**: Proper validation with error message

---

## Profile Feature Testing

### Load Profile
- [ ] Click user profile menu / "My Profile"
- [ ] Check console: Should see `[PROFILE] Fetching profile`
- [ ] Check Network tab: GET to `/profiles/me` should be 200
- [ ] Profile information should display
- [ ] Check console: `[PROFILE] Profile loaded:` with details

**Expected Behavior**: Profile loads with [PROFILE] logs

### Edit Profile
- [ ] On profile page, edit name or bio
- [ ] Click "Save" button
- [ ] Check console: `[PROFILE] Saving profile...`
- [ ] Check Network tab: PUT to `/profiles/me` should be 200
- [ ] Changes should appear immediately
- [ ] Check console: `[PROFILE] Profile updated successfully`

**Expected Behavior**: Profile updates with proper logging

### Auto-Profile Creation
- [ ] Log in as new user (different dev login or new Google account)
- [ ] Go to Skills page
- [ ] Check console: Should see `[PROFILE] Creating new profile`
- [ ] Check console: Should see `[PROFILE] Profile created:`
- [ ] Check Network tab: POST to `/profiles` should be 201
- [ ] Should proceed without errors
- [ ] Profile should exist in dashboard

**Expected Behavior**: New profiles auto-created on first login

---

## Requests Feature Testing

### List Requests
- [ ] Click "Requests" in navigation
- [ ] Check console: `[REQUESTS] Fetching requests`
- [ ] Check Network tab: GET to `/requests` should be 200
- [ ] Page loads properly
- [ ] If requests exist, should display list
- [ ] Check console: `[REQUESTS] Fetched X incoming, Y outgoing`

**Expected Behavior**: Requests load with detailed logging

### Accept Request
- [ ] Find a request from another user
- [ ] Click "Accept" button
- [ ] Check console: `[REQUESTS] Accepting request`
- [ ] Check Network tab: POST request should be 200
- [ ] Check console: `[REQUESTS] Request accepted`
- [ ] Request should move from list to accepted

**Expected Behavior**: Request accepted with proper logs

### Reject Request
- [ ] Find a request
- [ ] Click "Reject" button
- [ ] Check console: `[REQUESTS] Rejecting request`
- [ ] Check Network tab: DELETE request should be 200
- [ ] Request should disappear from list

**Expected Behavior**: Request rejected cleanly

---

## Sessions Feature Testing

### List Sessions
- [ ] Click "Sessions" in navigation
- [ ] Check console: `[SESSIONS] Fetching sessions`
- [ ] Check Network tab: GET to `/sessions` should be 200
- [ ] If sessions exist, should display list
- [ ] Check console: Shows session count

**Expected Behavior**: Sessions load properly

### Create Session (via Request)
- [ ] Accept a skill request (from Requests page)
- [ ] Should automatically create session
- [ ] Session should appear in Sessions page
- [ ] Check console: Logs from request acceptance

**Expected Behavior**: Sessions created when request accepted

### Complete Session
- [ ] Go to Sessions page
- [ ] Find a session with other user
- [ ] Click "Complete" button
- [ ] Check console: `[SESSIONS] Completing session`
- [ ] Check Network tab: PUT request should be 200
- [ ] Session status should change

**Expected Behavior**: Session completed with logging

---

## Chat Feature Testing

### WebSocket Connection
- [ ] Open Sessions page
- [ ] Click "Chat" in a session
- [ ] Check console: `[CHAT] Connecting to` with WebSocket URL
- [ ] Wait for connection to establish
- [ ] Check console: `[CHAT] Connected` should appear
- [ ] Click on chat area (should be focused)
- [ ] Don't look for Network tab requests (WebSocket uses different protocol)

**Expected Behavior**: WebSocket connects with [CHAT] logs

### Send Message
- [ ] Type message in chat input box
- [ ] Press Enter or click Send
- [ ] Check console: `[CHAT] Sending message:` with text
- [ ] Message should appear in chat
- [ ] Check WebSocket state in console logs

**Expected Behavior**: Messages send with [CHAT] logs

### Receive Message
- [ ] Have another window with same session
- [ ] Send message from other window
- [ ] Message should appear in first window
- [ ] Check console: `[CHAT] Message received:` with content

**Expected Behavior**: Real-time message reception

---

## Rating Feature Testing

### Submit Rating
- [ ] Complete a session (see Sessions testing)
- [ ] Find "Rate" button for completed session
- [ ] Enter rating (1-5 stars) and optional comment
- [ ] Click "Submit Rating"
- [ ] Check console: `[RATING] Submitting rating:` with details
- [ ] Check Network tab: POST to `/ratings` should be 201
- [ ] Check console: `[RATING] Rating submitted successfully`
- [ ] Rating should disappear or show confirmation

**Expected Behavior**: Rating submitted with proper logging

---

## Error Handling Testing

### 401 Unauthorized
- [ ] Manually delete dev_token from localStorage
- [ ] Try to make API call (go to Skills, refresh)
- [ ] Should see 401 error in Network tab
- [ ] Check console: Error message with status: 401
- [ ] Should be redirected to login
- [ ] Check console: `[AUTH] Unauthorized, logging out`

**Expected Behavior**: 401 errors trigger logout and redirect

### 404 Not Found
- [ ] Go to Requests page
- [ ] If no requests exist, should show "No requests" message
- [ ] Try to accept non-existent request ID via URL
- [ ] Should see 404 error in Network tab
- [ ] Should show "Not found" message to user
- [ ] Check console: Error with status: 404

**Expected Behavior**: 404 errors handled gracefully

### 500 Server Error
- [ ] Stop backend server
- [ ] Try to make API call
- [ ] Should see connection error in Network tab
- [ ] Check console: Error message with connection details
- [ ] Should show "Connection failed" message
- [ ] Restart backend (should recover)

**Expected Behavior**: Server errors shown to user

### Network Error
- [ ] Disable internet (airplane mode or unplug)
- [ ] Try to make API call
- [ ] Should see Network error in DevTools
- [ ] Check console: Connection error message
- [ ] Re-enable internet

**Expected Behavior**: Network errors handled properly

---

## Database Verification

### MongoDB Document Check
Open MongoDB compass or mongosh:

#### User Profile Document
```bash
# In Terminal
mongosh
use skill_exchange
db.userprofiles.findOne({_id: "dev"})
# Should return profile with: name, email, skills, etc.
```
- [ ] Document exists
- [ ] Has correct fields
- [ ] Email is set (or empty)
- [ ] Skills array exists

#### Skills Collection
```bash
db.userprofiles.findOne({_id: "dev"})
# Look at skills array
# Should have entries: [{skill: "Python", level: 3}, ...]
```
- [ ] Skills appear after adding
- [ ] Skill format is correct
- [ ] Level/proficiency is saved

---

## Performance Testing

### Response Time
- [ ] Open DevTools Network tab
- [ ] Make API calls
- [ ] Check response time (should be < 500ms for most)
- [ ] Skill list: < 200ms
- [ ] Profile load: < 200ms
- [ ] Add skill: < 500ms

**Expected**: Instant/responsive performance

### Console Performance
- [ ] With console open, make several API calls
- [ ] Should see logs instantly
- [ ] No lag in UI or console
- [ ] Logs should be readable and clear

**Expected**: No performance degradation

---

## Browser Compatibility

- [ ] Chrome/Chromium
  - [ ] All features work
  - [ ] Console logs visible
  - [ ] Network tab functional

- [ ] Firefox
  - [ ] All features work
  - [ ] Console logs visible
  - [ ] Network tab functional

- [ ] Safari/Edge
  - [ ] All features work
  - [ ] Console logs visible

---

## Final Validation

### All Features Working
- [ ] Authentication (login/logout)
- [ ] Skills (list/add/delete)
- [ ] Profile (view/edit)
- [ ] Requests (list/accept/reject)
- [ ] Sessions (list/complete)
- [ ] Chat (message/receive)
- [ ] Ratings (submit)

### All Logging Present
- [ ] [AUTH] tags in authentication
- [ ] [SKILLS] tags in skills operations
- [ ] [PROFILE] tags in profile operations
- [ ] [API] tags on all API calls
- [ ] [REQUESTS] tags on requests
- [ ] [CHAT] tags on chat
- [ ] Error tags with status codes

### Error Handling Works
- [ ] 401 errors redirect to login
- [ ] 404 errors show message
- [ ] 500 errors show error detail
- [ ] Network errors handled gracefully

### No Errors in Console
- [ ] No red error messages (except intentional errors)
- [ ] No CORS warnings
- [ ] No 404 requests (except intentional tests)
- [ ] No token-related warnings

---

## Troubleshooting

If any test fails:

1. **Check Console for [TAG] logs**
   - Look for error details: status, message
   - Error should explain what went wrong

2. **Check Network Tab**
   - Find the failing request
   - Check response status code (200, 401, 404, 500)
   - Check response body for error details

3. **Check Backend Console**
   - Look for error messages
   - Check database connection logs
   - Verify endpoint exists

4. **Run Diagnostic Commands**
   ```bash
   # Test backend
   curl http://127.0.0.1:8000/docs
   
   # Check MongoDB
   mongosh && db.userprofiles.find()
   
   # Check frontend logs
   # Open DevTools Console and search for [API]
   ```

5. **Refer to DEBUG_GUIDE.md**
   - Comprehensive troubleshooting guide
   - Common issues and solutions
   - Detailed diagnostic procedures

---

## Sign-Off

Once ALL items are checked:

✅ **Integration Debugging Complete**

System is fully functional and ready for:
- Additional feature development
- Performance optimization
- Production deployment
- User testing

All fixes have been validated and verified working correctly.
