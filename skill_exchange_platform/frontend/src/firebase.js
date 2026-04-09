import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCaxAC7VAjc0L0jyc7OFSMYUdlgPFGHSD8",
  authDomain: "skill-swap-system.firebaseapp.com",
  projectId: "skill-swap-system",
  storageBucket: "skill-swap-system.firebasestorage.app",
  messagingSenderId: "469517247185",
  appId: "1:469517247185:web:5350ac8aa4f3e04efedbf0",
  measurementId: "G-H1W7VGXESG",
};

// initialize firebase app (guard against duplicate in hot reload)
let app;
if (!getApps().length) {
  console.log('[FIREBASE] Initializing app');
  app = initializeApp(firebaseConfig);
} else {
  console.log('[FIREBASE] Using existing app instance');
  app = getApps()[0];
}

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
// optional: always prompt account chooser for debugging
googleProvider.setCustomParameters({ prompt: 'select_account' }); //Without this: Google may auto-login previous account
 
console.log('[FIREBASE] authDomain =', firebaseConfig.authDomain);

export { auth, googleProvider };
