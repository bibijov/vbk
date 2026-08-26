"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import {
  AlertTriangle,
  Bell,
  ClipboardList,
  Dog as DogIcon,
  Droplets,
  Hospital,
  Volume2,
  VolumeX,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { PageHeader } from "@/components/portal/PortalShell";
import { StatCard } from "@/components/portal/StatCard";
import { Badge, Button, Card, CardHeader, EmptyState, Spinner } from "@/components/ui/kit";
import { OrderStatusBadge } from "@/components/ui/status";
import { daysUntil, formatRsd, timeAgo, toISODate } from "@/lib/format";
import { useBeep, useIncreaseAlert } from "@/hooks/useOrderAlert";
import type { Application, Dog, Order, Product } from "@/types";

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [pendingClinics, setPendingClinics] = useState(0);
  const [soundOn, setSoundOn] = useState(true);

  const beep = useBeep();

  useEffect(() => {
    const unsubs = [
      onSnapshot(
        query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(25)),
        (snap) =>
          setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order)),
        () => setOrders([]),
      ),
      onSnapshot(collection(db, "products"), (snap) =>
        setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Product)),
      ),
      onSnapshot(collection(db, "dogs"), (snap) =>
        setDogs(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Dog)),
      ),
      onSnapshot(
        query(collection(db, "applications"), where("status", "==", "new")),
        (snap) =>
          setApplications(
            snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Application),
          ),
      ),
      onSnapshot(
        query(collection(db, "clinics"), where("status", "==", "pending")),
        (snap) => setPendingClinics(snap.size),
      ),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  const newOrders = useMemo(
    () => (orders ?? []).filter((o) => o.status === "new"),
    [orders],
  );

  // Zvučni signal kada broj novih poraste (Sloj 1 iz plana).
  useIncreaseAlert(newOrders.length, () => {
    if (soundOn) beep();
  });

  const activeOrders = useMemo(
    () =>
      (orders ?? []).filter((o) =>
        ["new", "confirmed", "preparing", "dispatched"].includes(o.status),
      ),
    [orders],
  );

  const lowStock = useMemo(
    () =>
      products
        .filter((p) => p.active && (p.stock ?? 0) <= (p.lowStockThreshold ?? 0))
        .sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0)),
    [products],
  );

  const activeDonors = dogs.filter((d) => d.donorStatus === "active");

  const readyToDonate = useMemo(
    () =>
      activeDonors
        .filter((d) => {
          const days = daysUntil(d.nextEligibleDate);
          return d.nextEligibleDate === null || (days !== null && days <= 0);
        })
        .slice(0, 6),
    [activeDonors],
  );

  const today = toISODate();
  const ordersToday = (orders ?? []).filter((o) => {
    const created = o.createdAt;
    if (!created || typeof created === "string") return false;
    try {
      return (created as { toDate: () => Date }).toDate().toISOString().slice(0, 10) === today;
    } catch {
      return false;
    }
  }).length;

  if (orders === null) return <Spinner />;

  return (
    <>
      <PageHeader
        title="Pregled"
        subtitle="Porudžbine stižu uživo — panel ne treba osvežavati."
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setSoundOn((v) => !v);
              if (!soundOn) beep();
            }}
          >
            {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            {soundOn ? "Zvuk uključen" : "Zvuk isključen"}
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Nove porudžbine"
          value={newOrders.length}
          hint={newOrders.length > 0 ? "Čekaju potvrdu" : "Sve je obrađeno"}
          tone={newOrders.length > 0 ? "blood" : "neutral"}
          icon={<Bell className="h-5 w-5" />}
          href="/portal/admin/porudzbine"
        />
        <StatCard
          label="Porudžbine danas"
          value={ordersToday}
          hint={`${activeOrders.length} u obradi`}
          icon={<ClipboardList className="h-5 w-5" />}
          href="/portal/admin/porudzbine"
        />
        <StatCard
          label="Proizvodi ispod praga"
          value={lowStock.length}
          hint={lowStock.length > 0 ? "Potrebna dopuna zaliha" : "Zalihe su uredne"}
          tone={lowStock.length > 0 ? "warn" : "ok"}
          icon={<Droplets className="h-5 w-5" />}
          href="/portal/admin/proizvodi"
        />
        <StatCard
          label="Aktivni donori"
          value={activeDonors.length}
          hint={`${readyToDonate.length} spremno za donaciju`}
          icon={<DogIcon className="h-5 w-5" />}
          href="/portal/admin/psi"
        />
      </div>

      {(pendingClinics > 0 || applications.length > 0) && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {pendingClinics > 0 && (
            <Link
              href="/portal/admin/klinike"
              className="flex items-center gap-3 rounded-card border border-warn/30 bg-warn-soft px-5 py-4 text-sm text-warn"
            >
              <Hospital className="h-5 w-5 shrink-0" />
              <span>
                <strong className="font-semibold">{pendingClinics}</strong>{" "}
                {pendingClinics === 1 ? "klinika čeka" : "klinika čeka"} verifikaciju
              </span>
            </Link>
          )}
          {applications.length > 0 && (
            <Link
              href="/portal/admin/prijave"
              className="flex items-center gap-3 rounded-card border border-info/30 bg-info-soft px-5 py-4 text-sm text-info"
            >
              <ClipboardList className="h-5 w-5 shrink-0" />
              <span>
                <strong className="font-semibold">{applications.length}</strong> novih
                prijava donora sa sajta
              </span>
            </Link>
          )}
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Poslednje porudžbine"
            subtitle="Uživo iz baze"
            action={
              <Link
                href="/portal/admin/porudzbine"
                className="text-sm text-blood hover:underline"
              >
                Sve porudžbine
              </Link>
            }
          />
          {orders.length === 0 ? (
            <EmptyState
              icon={<ClipboardList className="h-8 w-8" />}
              title="Još nema porudžbina"
              description="Kada klinika pošalje porudžbinu, pojaviće se ovde odmah."
            />
          ) : (
            <ul className="divide-y divide-line">
              {orders.slice(0, 8).map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/portal/admin/porudzbine/${order.id}`}
                    className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3 transition-colors hover:bg-paper"
                  >
                    <span className="font-mono text-sm text-ink-soft">
                      {order.orderNumber}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
                      {order.clinicName}
                    </span>
                    {order.urgent && <Badge tone="blood">Hitno</Badge>}
                    <OrderStatusBadge status={order.status} />
                    <span className="text-sm tabular-nums text-ink-soft">
                      {formatRsd(order.total)}
                    </span>
                    <span className="w-20 text-right text-xs text-ink-mute">
                      {timeAgo(order.createdAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Zalihe pri kraju" />
            {lowStock.length === 0 ? (
              <EmptyState title="Sve je iznad praga" />
            ) : (
              <ul className="divide-y divide-line">
                {lowStock.slice(0, 6).map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-3 px-5 py-3"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-ink">{p.name}</span>
                      <span className="text-xs text-ink-mute">prag: {p.lowStockThreshold}</span>
                    </span>
                    <Badge tone={p.stock <= 0 ? "blood" : "warn"}>
                      <AlertTriangle className="h-3 w-3" />
                      {p.stock}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title="Spremni za donaciju" subtitle="Prošlo je 8 nedelja" />
            {readyToDonate.length === 0 ? (
              <EmptyState title="Trenutno nema slobodnih donora" />
            ) : (
              <ul className="divide-y divide-line">
                {readyToDonate.map((d) => (
                  <li key={d.id}>
                    <Link
                      href={`/portal/admin/psi/${d.id}`}
                      className="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-paper"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm text-ink">{d.name}</span>
                        <span className="text-xs text-ink-mute">{d.breed || "—"}</span>
                      </span>
                      <Badge tone="ok">{d.bloodType}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
