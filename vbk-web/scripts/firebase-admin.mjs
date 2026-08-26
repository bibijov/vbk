import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

/** Zajednička inicijalizacija za skripte. Pokreće se sa `node --env-file=.env.local`. */
export function initAdmin() {
  if (getApps().length) return;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    console.error(
      "Nedostaju kredencijali. Popunite .env.local (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)\n" +
        "i pokrenite skriptu preko npm skripte (koristi --env-file=.env.local).",
    );
    process.exit(1);
  }

  initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

export { getAuth, getFirestore };
