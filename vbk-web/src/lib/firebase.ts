import { getApp, getApps, initializeApp, type FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

/** Bez konfiguracije aplikacija se i dalje builduje — samo portal ne radi. */
export const firebaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
);

// Placeholderi drže build u životu kada .env.local ne postoji (npr. CI);
// pravi ključevi dolaze iz okruženja.
const config: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "nedostaje-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "vbk.example.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "vbk-nije-podesen",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(config);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
