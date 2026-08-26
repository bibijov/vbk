"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Spinner } from "@/components/ui/kit";

/** Raskrsnica: vodi korisnika u njegov deo portala, a goste na prijavu. */
export default function PortalIndex() {
  const { firebaseUser, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!firebaseUser) {
      router.replace("/portal/login");
      return;
    }
    if (profile) {
      router.replace(profile.role === "admin" ? "/portal/admin" : "/portal/klinika");
    }
  }, [loading, firebaseUser, profile, router]);

  return <Spinner />;
}
