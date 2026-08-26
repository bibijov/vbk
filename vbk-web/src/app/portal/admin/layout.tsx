"use client";

import { useEffect, useState, type ReactNode } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import {
  ClipboardList,
  Dog,
  Droplets,
  Hospital,
  LayoutDashboard,
  Users,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { AuthGuard } from "@/components/portal/AuthGuard";
import { PortalShell, type NavItem } from "@/components/portal/PortalShell";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard role="admin">
      <AdminShell>{children}</AdminShell>
    </AuthGuard>
  );
}

function AdminShell({ children }: { children: ReactNode }) {
  const [newOrders, setNewOrders] = useState(0);
  const [newApplications, setNewApplications] = useState(0);
  const [pendingClinics, setPendingClinics] = useState(0);

  useEffect(() => {
    const unsubs = [
      onSnapshot(
        query(collection(db, "orders"), where("status", "==", "new")),
        (snap) => setNewOrders(snap.size),
        () => setNewOrders(0),
      ),
      onSnapshot(
        query(collection(db, "applications"), where("status", "==", "new")),
        (snap) => setNewApplications(snap.size),
        () => setNewApplications(0),
      ),
      onSnapshot(
        query(collection(db, "clinics"), where("status", "==", "pending")),
        (snap) => setPendingClinics(snap.size),
        () => setPendingClinics(0),
      ),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  const nav: NavItem[] = [
    {
      href: "/portal/admin",
      label: "Pregled",
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      href: "/portal/admin/porudzbine",
      label: "Porudžbine",
      icon: <ClipboardList className="h-4 w-4" />,
      badge: newOrders,
      matchPrefix: true,
    },
    {
      href: "/portal/admin/proizvodi",
      label: "Proizvodi i zalihe",
      icon: <Droplets className="h-4 w-4" />,
      matchPrefix: true,
    },
    {
      href: "/portal/admin/klinike",
      label: "Klinike",
      icon: <Hospital className="h-4 w-4" />,
      badge: pendingClinics,
      matchPrefix: true,
    },
    {
      href: "/portal/admin/psi",
      label: "Kartoni donora",
      icon: <Dog className="h-4 w-4" />,
      matchPrefix: true,
    },
    {
      href: "/portal/admin/prijave",
      label: "Prijave donora",
      icon: <ClipboardList className="h-4 w-4" />,
      badge: newApplications,
      matchPrefix: true,
    },
    {
      href: "/portal/admin/korisnici",
      label: "Korisnici",
      icon: <Users className="h-4 w-4" />,
      matchPrefix: true,
    },
  ];

  return (
    <PortalShell nav={nav} areaLabel="Admin portal">
      {children}
    </PortalShell>
  );
}
