"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { ClipboardList } from "lucide-react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/portal/PortalShell";
import { Badge, Button, Card, EmptyState, Spinner } from "@/components/ui/kit";
import { OrderStatusBadge } from "@/components/ui/status";
import { formatDateTime, formatRsd } from "@/lib/format";
import type { Order } from "@/types";

export default function ClinicOrdersPage() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    if (!profile?.clinicId) return;
    return onSnapshot(
      query(
        collection(db, "orders"),
        where("clinicId", "==", profile.clinicId),
        orderBy("createdAt", "desc"),
      ),
      (snap) => setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order)),
      () => setOrders([]),
    );
  }, [profile?.clinicId]);

  if (orders === null) return <Spinner />;

  return (
    <>
      <PageHeader title="Moje porudžbine" subtitle="Status se menja uživo." />

      <Card>
        {orders.length === 0 ? (
          <EmptyState
            icon={<ClipboardList className="h-8 w-8" />}
            title="Još nemate porudžbina"
            action={
              <Link href="/portal/klinika/katalog">
                <Button>Otvori katalog</Button>
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-ink-mute">
                  <th className="px-5 py-3 font-medium">Broj</th>
                  <th className="px-5 py-3 font-medium">Stavke</th>
                  <th className="px-5 py-3 font-medium">Iznos</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Poslata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {orders.map((o) => (
                  <tr key={o.id} className="transition-colors hover:bg-paper">
                    <td className="px-5 py-3">
                      <Link
                        href={`/portal/klinika/porudzbine/${o.id}`}
                        className="font-mono text-blood hover:underline"
                      >
                        {o.orderNumber}
                      </Link>
                      {o.urgent && (
                        <Badge tone="blood" className="ml-2">
                          Hitno
                        </Badge>
                      )}
                    </td>
                    <td className="px-5 py-3 text-ink-soft">
                      {o.items?.reduce((s, i) => s + i.quantity, 0) ?? 0} jed.
                    </td>
                    <td className="px-5 py-3 tabular-nums">{formatRsd(o.total)}</td>
                    <td className="px-5 py-3">
                      <OrderStatusBadge status={o.status} />
                    </td>
                    <td className="px-5 py-3 text-ink-mute">
                      {formatDateTime(o.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
