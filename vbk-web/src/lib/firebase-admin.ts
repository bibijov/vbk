import { cert, getApp, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

/**
 * Admin SDK — samo na serveru (API rute). Kredencijali dolaze iz service account
 * JSON-a, prosleđenog kroz tri env varijable da se izbegne fajl u repou.
 */
function initAdmin(): App {
  if (getApps().length) return getApp();

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin nije konfigurisan — nedostaju FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL ili FIREBASE_PRIVATE_KEY.",
    );
  }

  return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

export function adminAuth() {
  return getAuth(initAdmin());
}

export function adminDb() {
  return getFirestore(initAdmin());
}
