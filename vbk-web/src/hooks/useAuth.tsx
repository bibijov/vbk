"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  type User,
} from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { AppUser } from "@/types";

interface AuthState {
  /** Firebase nalog — postoji čim je prijava uspela. */
  firebaseUser: User | null;
  /** Profil iz `users/{uid}` — nosi ulogu i clinicId. */
  profile: AppUser | null;
  loading: boolean;
  /** Prijavljen je, ali nema profil ili je deaktiviran. */
  blocked: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

/** Rezultat čitanja `users/{uid}` — pamtimo za koji uid važi. */
interface ProfileSnapshot {
  uid: string;
  profile: AppUser | null;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [snapshot, setSnapshot] = useState<ProfileSnapshot | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setAuthReady(true);
      if (!user) setSnapshot(null);
    });
  }, []);

  useEffect(() => {
    if (!firebaseUser) return;
    const uid = firebaseUser.uid;

    // onSnapshot, a ne getDoc — admin može uživo da deaktivira nalog.
    return onSnapshot(
      doc(db, "users", uid),
      (snap) =>
        setSnapshot({
          uid,
          profile: snap.exists() ? ({ uid: snap.id, ...snap.data() } as AppUser) : null,
        }),
      () => setSnapshot({ uid, profile: null }),
    );
  }, [firebaseUser]);

  const value = useMemo<AuthState>(() => {
    // Profil je učitan tek kada snapshot odgovara trenutnom nalogu.
    const loaded = Boolean(firebaseUser) && snapshot?.uid === firebaseUser?.uid;
    const profile = loaded ? (snapshot?.profile ?? null) : null;

    return {
      firebaseUser,
      profile,
      loading: !authReady || (Boolean(firebaseUser) && !loaded),
      blocked: loaded && (!profile || profile.active === false),
      signIn: async (email, password) => {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      },
      resetPassword: async (email) => {
        await sendPasswordResetEmail(auth, email.trim());
      },
      logout: async () => {
        await signOut(auth);
      },
    };
  }, [firebaseUser, authReady, snapshot]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth mora biti unutar <AuthProvider>.");
  return ctx;
}

/** Poruka na srpskom za najčešće Firebase Auth kodove. */
export function authErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  switch (code) {
    case "auth/invalid-email":
      return "Email adresa nije ispravna.";
    case "auth/user-disabled":
      return "Nalog je deaktiviran.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Pogrešan email ili lozinka.";
    case "auth/too-many-requests":
      return "Previše pokušaja. Sačekajte nekoliko minuta.";
    case "auth/network-request-failed":
      return "Nema veze sa internetom.";
    default:
      return err instanceof Error ? err.message : "Prijava nije uspela.";
  }
}
