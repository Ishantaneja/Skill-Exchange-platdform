import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { auth, googleProvider } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;
const AuthContext = createContext();

// Setup axios base URL once at module level
axios.defaults.baseURL = API_URL;

// Track whether interceptors have been installed (module-level flag)
let interceptorsInstalled = false;

function installInterceptors() {
  if (interceptorsInstalled) return;
  interceptorsInstalled = true;

  // ── Request interceptor ──
  // 1. Dynamically fetch a fresh Firebase ID token before every request
  //    (getIdToken() returns the cached token if still valid, or silently
  //    refreshes it when expired — no extra network call unless needed).
  // 2. Append trailing slash to prevent 307 redirects that strip the header.
  axios.interceptors.request.use(async (config) => {
    // Trailing-slash fix (before token logic so the URL is final for logging)
    if (config.url && !config.url.includes('?') && !config.url.endsWith('/')) {
      config.url = config.url + '/';
    }

    // Skip token injection if the request explicitly opted out
    if (config._skipAuth) {
      return config;
    }

    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        // getIdToken(false) → returns cached token or refreshes if expired
        const freshToken = await currentUser.getIdToken(/* forceRefresh */ false);
        config.headers['Authorization'] = `Bearer ${freshToken}`;
      } else {
        // No Firebase user — check for dev token fallback
        const devToken = localStorage.getItem('dev_token');
        if (devToken) {
          config.headers['Authorization'] = `Bearer ${devToken}`;
        }
      }
    } catch (err) {
      console.error('[API] Failed to get fresh token:', err);
      // Let the request proceed — backend will return 401 which we handle below
    }

    const tkn = config.headers?.Authorization?.split(' ')[1] || '';
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, {
      baseURL: config.baseURL,
      hasAuth: tkn ? 'YES' : 'NO',
      tokenLength: tkn.length,
    });
    return config;
  });

  // ── Response interceptor with comprehensive error logging ──
  axios.interceptors.response.use(
    response => {
      console.log(`[API] ${response.status} ${response.config.url}`);
      return response;
    },
    error => {
      const status = error.response?.status;
      const detail = error.response?.data?.detail || error.message;
      console.error(`[API] Error ${status || 'NETWORK'}: ${error.config?.url}`, {
        detail,
        data: error.response?.data,
      });
      return Promise.reject(error);
    }
  );
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Install interceptors exactly once
  installInterceptors();

  // simple helper to inspect JWT payload for debugging
  const decodeJwt = (token) => {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payload = parts[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded);
    } catch (e) {
      return null;
    }
  };

  // Fetch profile from backend; if the stored email is a fake UID-based one,
  // patch it with the real Google email via PUT (frontend-only fix, no backend changes).
  const ensureProfile = async (firebaseUser) => {
    try {
      console.log('[PROFILE] Fetching my profile');
      const res = await axios.get('/profiles/me');
      const profile = res.data;
      console.log('[PROFILE] Profile data:', profile);

      // Detect stale UID-based email and fix it from the frontend
      const realEmail = firebaseUser?.email;
      const realName = firebaseUser?.displayName;
      const storedEmail = profile?.email || '';

      if (realEmail && storedEmail.endsWith('@skillexchange.local')) {
        console.log('[PROFILE] Stale email detected, patching with real Google email:', realEmail);
        const patch = { email: realEmail };
        if (realName && (!profile.name || profile.name === 'User')) {
          patch.name = realName;
        }
        try {
          const updated = await axios.put('/profiles/me', patch);
          console.log('[PROFILE] Patched profile:', updated.data);
          return updated.data;
        } catch (patchErr) {
          console.error('[PROFILE] Patch failed:', patchErr.response?.data || patchErr.message);
        }
      }

      return profile;
    } catch (err) {
      // if even the auto-create failed, log but don't crash
      console.error('[PROFILE] Unable to fetch profile:', err.response?.data || err.message);
      return null;
    }
  };

  useEffect(() => {
    console.log('[AUTH] Setting up onAuthStateChanged listener');

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('[AUTH] onAuthStateChanged fired, user =', firebaseUser);
      try {
        if (firebaseUser) {
          console.log('[AUTH] Firebase user logged in:', firebaseUser.email);
          const idToken = await firebaseUser.getIdToken(/* forceRefresh */ true);
          console.log('[AUTH] Got Firebase token:', idToken ? 'YES' : 'NO');
          if (idToken) console.log('[AUTH] token payload:', decodeJwt(idToken));
          
          setUser(firebaseUser);
          setToken(idToken);
          // Token is now injected dynamically by the axios request interceptor
          // (calls auth.currentUser.getIdToken() before every request)
          
          // fetch profile (server will auto-create if necessary)
          await ensureProfile(firebaseUser);
        } else {
          // Check for dev token
          const devToken = localStorage.getItem('dev_token');
          if (devToken) {
            console.log('[AUTH] Using persisted dev token');
            const devUser = { email: 'dev@localhost', displayName: 'Developer', uid: 'dev' };
            setUser(devUser);
            setToken(devToken);
            // Dev token is picked up by the axios request interceptor from localStorage
            await ensureProfile(devUser);
          } else {
            console.log('[AUTH] No user logged in');
            setUser(null);
            setToken(null);
          }
        }
      } catch (err) {
        console.error('[AUTH] Error in auth state change:', err);
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Popup-based sign-in
  const loginWithGoogle = async () => {
    console.log('[AUTH] Starting Google sign-in via popup');
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      console.log('[AUTH] Popup login succeeded:', firebaseUser.email);
      
      const idToken = await firebaseUser.getIdToken(/* forceRefresh */ true);
      console.log('[AUTH] Got Firebase token from popup:', idToken ? 'YES' : 'NO');
      if (idToken) console.log('[AUTH] token payload:', decodeJwt(idToken));
      
      setUser(firebaseUser);
      setToken(idToken);
      // Token is injected dynamically by the axios request interceptor
      
      // fetch or create profile
      await ensureProfile(firebaseUser);
    } catch (err) {
      console.error('[AUTH] Google popup sign-in failed:', err);
      const code = err.code || 'unknown';
      const message = err.message || 'no message';
      alert(`Google sign-in error (${code}): ${message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginDev = (token = 'dev') => {
    console.log('[AUTH] Logging in with dev token');
    localStorage.setItem('dev_token', token);
    const devUser = { email: 'dev@localhost', displayName: 'Developer', uid: 'dev' };
    setUser(devUser);
    setToken(token);
    // Dev token is picked up by the axios request interceptor from localStorage
    console.log('[AUTH] Dev token set successfully');
  };

  const logout = async () => {
    console.log('[AUTH] Logging out');
    localStorage.removeItem('dev_token');
    setUser(null);
    setToken(null);
    // Interceptor checks auth.currentUser which will be null after signOut
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, token, loginWithGoogle, loginDev, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
