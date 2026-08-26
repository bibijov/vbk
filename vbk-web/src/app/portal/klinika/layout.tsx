"use client";

import { useEffect, useState, type ReactNode } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { Building2, ClipboardList, Droplets, LayoutDashboard, ShoppingCart } from "lucide-react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { CartProvider, useCart } from "@/hooks/useCart";
import { AuthGuard } from "@/components/portal/AuthGuard";
import { PortalShell, type NavItem } from "@/components/portal/PortalShell";

export default function ClinicLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard role="clinic">
      <ClinicShellWrapper>{children}</ClinicShellWrapper>
    </AuthGuard>
  );
}

function ClinicShellWrapper({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  return (
    <CartProvider key={profile?.clinicId ?? "none"} clinicId={profile?.clinicId ?? null}>
      <ClinicShell>{children}</ClinicShell>
    </CartProvider>
  );
}

function ClinicShell({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const { count } = useCart();
  const [activeOrders, setActiveOrders] = useState(0);

  useEffect(() => {
    if (!profile?.clinicId) return;
    return onSnapshot(
      query(
        collection(db, "orders"),
        where("clinicId", "==", profile.clinicId),
        where("status", "in", ["new", "confirmed", "preparing", "dispatched"]),
      ),
      (snap) => setActiveOrders(snap.size),
      () => setActiveOrders(0),
    );
  }, [profile?.clinicId]);

  const nav: NavItem[] = [
    { href: "/portal/klinika", label: "Pregled", icon: <LayoutDashboard className="h-4 w-4" /> },
    {
      href: "/portal/klinika/katalog",
      label: "Katalog",
      icon: <Droplets className="h-4 w-4" />,
      matchPrefix: true,
    },
    {
      href: "/portal/klinika/korpa",
      label: "Korpa",
      icon: <ShoppingCart className="h-4 w-4" />,
      badge: count,
      matchPrefix: true,
    },
    {
      href: "/portal/klinika/porudzbine",
      label: "Moje porudžbine",
      icon: <ClipboardList className="h-4 w-4" />,
      badge: activeOrders,
      matchPrefix: true,
    },
    {
      href: "/portal/klinika/profil",
      label: "Podaci klinike",
      icon: <Building2 className="h-4 w-4" />,
      matchPrefix: true,
    },
  ];

  return (
    <PortalShell nav={nav} areaLabel="Portal za klinike">
      {children}
    </PortalShell>
  );
}
