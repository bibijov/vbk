import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { initAdmin, getAuth as getAdminAuth, getFirestore } from "./firebase-admin.mjs";

/**
 * Provera da je okruzenje zaista spremno: nalog, claims, katalog i prava prijava.
 *
 *   npm run verify -- email@vbk.rs lozinka
 */
const [email, password] = process.argv.slice(2);
if (!email || !password) {
  console.error("Upotreba: npm run verify -- email@vbk.rs lozinka");
  process.exit(1);
}

initAdmin();
const adminAuth = getAdminAuth();
const db = getFirestore();

const problems = [];

// 1. Nalog i custom claims
const user = await adminAuth.getUserByEmail(email);
const claims = user.customClaims ?? {};
console.log(`nalog          : ${user.email} (uid ${user.uid.slice(0, 8)}...)`);
console.log(`claims         : role=${claims.role ?? "—"} clinicId=${claims.clinicId ?? "null"}`);
if (claims.role !== "admin") problems.push("custom claim role nije 'admin'");
if (user.disabled) problems.push("nalog je disabled u Firebase Auth");

// 2. Profil u Firestore-u (odatle UI cita ulogu)
const profile = await db.collection("users").doc(user.uid).get();
if (!profile.exists) {
  problems.push("nema dokumenta users/{uid} — UI nece znati ulogu");
} else {
  const d = profile.data();
  console.log(`profil         : ${d.name} · role=${d.role} · active=${d.active}`);
  if (d.role !== "admin") problems.push("users/{uid}.role nije 'admin'");
  if (d.active !== true) problems.push("users/{uid}.active nije true");
}

// 3. Katalog
const products = await db.collection("products").get();
const stock = products.docs.reduce((sum, doc) => sum + (doc.data().stock ?? 0), 0);
console.log(`proizvodi      : ${products.size} (ukupno na stanju: ${stock})`);
if (products.size === 0) problems.push("katalog je prazan — pokreni npm run seed:products");

// 4. Prava prijava klijentskim SDK-om — dokazuje da je Email/Password ukljucen
try {
  const client = initializeApp({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
  const cred = await signInWithEmailAndPassword(getAuth(client), email, password);
  console.log(`prijava        : uspela (${cred.user.email})`);
} catch (err) {
  const code = err.code ?? "";
  if (code === "auth/operation-not-allowed") {
    problems.push(
      "Email/Password nije ukljucen: Firebase konzola -> Authentication -> Sign-in method",
    );
  } else if (code === "auth/invalid-credential" || code === "auth/wrong-password") {
    problems.push("lozinka se ne poklapa sa onom koja je postavljena");
  } else {
    problems.push(`prijava nije uspela: ${code || err.message}`);
  }
}

console.log("");
if (problems.length === 0) {
  console.log("SVE JE SPREMNO — mozes na /portal/login");
  process.exit(0);
}
console.log("PROBLEMI:");
for (const p of problems) console.log("  - " + p);
process.exit(1);
