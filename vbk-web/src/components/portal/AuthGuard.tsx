"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button, Spinner } from "@/components/ui/kit";
import type { Role } from "@/types";

/**
 * Prva linija odbrane je UI, prava je u Firestore pravilima (`firestore.rules`).
 */
export function AuthGuard({ role, children }: { role: Role; children: ReactNode }) {
  const { firebaseUser, profile, loading, blocked, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!firebaseUser) {
      router.replace(`/portal/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (profile && profile.role !== role) {
      router.replace(profile.role === "admin" ? "/portal/admin" : "/portal/klinika");
    }
  }, [loading, firebaseUser, profile, role, router, pathname]);

  if (loading || !firebaseUser) return <Spinner label="Provera pristupa…" />;

  if (blocked) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-24 text-center">
        <h1 className="text-lg font-semibold text-ink">Nalog nije aktivan</h1>
        <p className="text-sm text-ink-soft">
          Vaš nalog još nije odobren ili je deaktiviran. Ako mislite da je ovo greška,
          javite se timu Veterinarske banke krvi.
        </p>
        <Button variant="secondary" onClick={logout}>
          Odjavi se
        </Button>
      </div>
    );
  }

  if (!profile || profile.role !== role) return <Spinner label="Preusmeravanje…" />;

  return <>{children}</>;
}
