"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { AlertTriangle, ClipboardList, Droplets, Phone, ShoppingCart } from "lucide-react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/portal/PortalShell";
import { StatCard } from "@/components/portal/StatCard";
import { Badge, Button, Card, CardHeader, EmptyState, Spinner } from "@/components/ui/kit";
import { OrderStatusBadge } from "@/components/ui/status";
import { formatDate, formatRsd } from "@/lib/format";
import { EMERGENCY_PHONE } from "@/lib/constants";
import type { Clinic, Order } from "@/types";

const ACTIVE = ["new", "confirmed", "preparing", "dispatched"];

export default function ClinicDashboard() {
  const { profile } = useAuth();
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    if (!profile?.clinicId) return;
    return onSnapshot(doc(db, "clinics", profile.clinicId), (snap) => {
      if (snap.exists()) setClinic({ id: snap.id, ...snap.data() } as Clinic);
    });
  }, [profile?.clinicId]);

  useEffect(() => {
    if (!profile?.clinicId) return;
    return onSnapshot(
      query(
        collection(db, "orders"),
        where("clinicId", "==", profile.clinicId),
        orderBy("createdAt", "desc"),
        limit(50),
      ),
      (snap) => setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order)),
      () => setOrders([]),
    );
  }, [profile?.clinicId]);

  if (orders === null) return <Spinner />;

  const active = orders.filter((o) => ACTIVE.includes(o.status));
  const completed = orders.filter((o) => o.status === "completed");
  const canOrder = clinic?.status === "active";

  return (
    <>
      <PageHeader
        title={clinic?.name ?? "Portal za klinike"}
        subtitle="Poručivanje krvnih produkata i praćenje statusa."
        action={
          <Link href="/portal/klinika/katalog">
            <Button>
              <Droplets className="h-4 w-4" />
              Poruči krv
            </Button>
          </Link>
        }
      />

      {!canOrder && (
        <div className="mb-4 flex items-start gap-3 rounded-card border border-warn/30 bg-warn-soft px-5 py-4 text-sm text-warn">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <span>
            <strong className="font-semibold">Poručivanje još nije otvoreno.</strong> Vaš
            nalog je u statusu verifikacije. Za hitne slučajeve zovite {EMERGENCY_PHONE}.
          </span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Porudžbine u toku"
          value={active.length}
          icon={<ClipboardList className="h-5 w-5" />}
          href="/portal/klinika/porudzbine"
        />
        <StatCard
          label="Završene porudžbine"
          value={completed.length}
          icon={<ShoppingCart className="h-5 w-5" />}
          href="/portal/klinika/porudzbine"
        />
        <StatCard
          label="Hitan slučaj"
          value={<span className="text-lg">{EMERGENCY_PHONE}</span>}
          hint="Van portala — uvek telefonom"
          tone="blood"
          icon={<Phone className="h-5 w-5" />}
        />
      </div>

      <Card className="mt-6">
        <CardHeader
          title="Porudžbine u toku"
          action={
            <Link
              href="/portal/klinika/porudzbine"
              className="text-sm text-blood hover:underline"
            >
              Sve porudžbine
            </Link>
          }
        />
        {active.length === 0 ? (
          <EmptyState
            icon={<ClipboardList className="h-8 w-8" />}
            title="Nemate porudžbina u toku"
            description="Otvorite katalog i pošaljite novu porudžbinu."
            action={
              <Link href="/portal/klinika/katalog">
                <Button>Otvori katalog</Button>
              </Link>
            }
          />
        ) : (
          <ul className="divide-y divide-line">
            {active.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/portal/klinika/porudzbine/${o.id}`}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3 transition-colors hover:bg-paper"
                >
                  <span className="font-mono text-sm text-ink-soft">{o.orderNumber}</span>
                  <span className="flex-1 text-sm text-ink">
                    {o.items?.reduce((s, i) => s + i.quantity, 0) ?? 0} jedinica
                  </span>
                  {o.urgent && <Badge tone="blood">Hitno</Badge>}
                  <OrderStatusBadge status={o.status} />
                  <span className="text-sm tabular-nums text-ink-soft">
                    {formatRsd(o.total)}
                  </span>
                  <span className="w-24 text-right text-xs text-ink-mute">
                    {formatDate(o.createdAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
