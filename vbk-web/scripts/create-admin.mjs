import { FieldValue } from "firebase-admin/firestore";
import { initAdmin, getAuth, getFirestore } from "./firebase-admin.mjs";

/**
 * Otvara prvi admin nalog — bez njega niko ne moze u portal.
 * Sve kasnije naloge admin otvara kroz UI (/portal/admin/korisnici).
 *
 *   npm run create:admin -- email@vbk.rs "Ime Prezime" lozinka
 */
const [email, name, password] = process.argv.slice(2);

if (!email || !name || !password) {
  console.error('Upotreba: npm run create:admin -- email@vbk.rs "Ime Prezime" lozinka');
  process.exit(1);
}
if (password.length < 6) {
  console.error("Lozinka mora imati bar 6 karaktera.");
  process.exit(1);
}

initAdmin();
const auth = getAuth();
const db = getFirestore();

let uid;
try {
  const user = await auth.createUser({ email, password, displayName: name });
  uid = user.uid;
  console.log(`Nalog kreiran: ${email}`);
} catch (err) {
  if (err.code === "auth/email-already-exists") {
    const existing = await auth.getUserByEmail(email);
    uid = existing.uid;
    await auth.updateUser(uid, { password, displayName: name });
    console.log(`Nalog vec postoji — lozinka azurirana: ${email}`);
  } else {
    throw err;
  }
}

await auth.setCustomUserClaims(uid, { role: "admin", clinicId: null });

await db.collection("users").doc(uid).set(
  {
    email,
    name,
    role: "admin",
    clinicId: null,
    phone: "",
    active: true,
    createdAt: FieldValue.serverTimestamp(),
  },
  { merge: true },
);

console.log(`\nAdmin je spreman. Prijava: /portal/login`);
process.exit(0);
