"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authErrorMessage, useAuth } from "@/hooks/useAuth";
import {
  Button,
  ErrorNote,
  Field,
  Spinner,
  SuccessNote,
  inputClass,
} from "@/components/ui/kit";
import { EMERGENCY_PHONE } from "@/lib/constants";

function LoginForm() {
  const { firebaseUser, profile, loading, signIn, resetPassword } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  // Već prijavljen korisnik ne treba da vidi formu.
  useEffect(() => {
    if (loading || !firebaseUser || !profile) return;
    const home = profile.role === "admin" ? "/portal/admin" : "/portal/klinika";
    router.replace(next && next.startsWith("/portal") ? next : home);
  }, [loading, firebaseUser, profile, next, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);
    try {
      await signIn(email, password);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function onReset() {
    setError("");
    setNotice("");
    if (!email.trim()) {
      setError("Unesite email adresu, pa kliknite ponovo.");
      return;
    }
    try {
      await resetPassword(email);
      setNotice("Poslali smo link za promenu lozinke na vašu adresu.");
    } catch (err) {
      setError(authErrorMessage(err));
    }
  }

  if (loading || (firebaseUser && profile)) return <Spinner label="Prijava…" />;

  return (
    <div className="w-full max-w-sm">
      <Link href="/" className="mb-8 flex items-center gap-2.5">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-blood text-sm font-bold text-white">
          VBK
        </span>
        <span className="text-sm font-semibold text-ink">Veterinarska banka krvi</span>
      </Link>

      <h1 className="text-xl font-semibold text-ink">Prijava na portal</h1>
      <p className="mt-1 text-sm text-ink-mute">
        Pristup je namenjen veterinarskim klinikama i timu VBK.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <Field label="Email" required>
          <input
            type="email"
            required
            autoComplete="email"
            className={inputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ordinacija@primer.rs"
          />
        </Field>

        <Field label="Lozinka" required>
          <input
            type="password"
            required
            autoComplete="current-password"
            className={inputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>

        <ErrorNote>{error}</ErrorNote>
        <SuccessNote>{notice}</SuccessNote>

        <Button type="submit" loading={busy} className="w-full">
          Prijavi se
        </Button>

        <button
          type="button"
          onClick={onReset}
          className="w-full text-center text-sm text-ink-mute underline-offset-2 hover:text-navy hover:underline"
        >
          Zaboravili ste lozinku?
        </button>
      </form>

      <div className="mt-8 rounded-lg border border-line bg-surface p-4">
        <p className="text-sm font-medium text-ink">Nemate nalog?</p>
        <p className="mt-1 text-sm text-ink-mute">
          Klinike se registruju preko{" "}
          <Link href="/portal/registracija" className="text-blood hover:underline">
            zahteva za pristup
          </Link>
          . Nalog otvaramo nakon provere podataka.
        </p>
        <p className="mt-3 text-sm text-ink-mute">
          Hitan slučaj? Zovite <span className="font-medium text-ink">{EMERGENCY_PHONE}</span>.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-6 py-12">
      <Suspense fallback={<Spinner />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
