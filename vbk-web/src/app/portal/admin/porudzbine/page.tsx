"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { ClipboardList, Search } from "lucide-react";
import { db } from "@/lib/firebase";
import { PageHeader } from "@/components/portal/PortalShell";
import { Badge, Card, EmptyState, Spinner, inputClass } from "@/components/ui/kit";
import { OrderStatusBadge } from "@/components/ui/status";
import { cx, formatDateTime, formatRsd } from "@/lib/format";
import { ORDER_STATUS_LABEL, type Order, type OrderStatus } from "@/types";

type Filter = "active" | OrderStatus | "all";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "active", label: "U obradi" },
  { value: "new", label: ORDER_STATUS_LABEL.new },
  { value: "confirmed", label: ORDER_STATUS_LABEL.confirmed },
  { value: "preparing", label: ORDER_STATUS_LABEL.preparing },
  { value: "dispatched", label: ORDER_STATUS_LABEL.dispatched },
  { value: "completed", label: ORDER_STATUS_LABEL.completed },
  { value: "cancelled", label: ORDER_STATUS_LABEL.cancelled },
  { value: "all", label: "Sve" },
];

const ACTIVE_STATUSES: OrderStatus[] = ["new", "confirmed", "preparing", "dispatched"];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [filter, setFilter] = useState<Filter>("active");
  const [search, setSearch] = useState("");

  useEffect(() => {
    return onSnapshot(
      query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(300)),
      (snap) => setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order)),
      () => setOrders([]),
    );
  }, []);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (orders ?? [])
      .filter((o) => {
        if (filter === "all") return true;
        if (filter === "active") return ACTIVE_STATUSES.includes(o.status);
        return o.status === filter;
      })
      .filter((o) => {
        if (!term) return true;
        return (
          o.orderNumber?.toLowerCase().includes(term) ||
          o.clinicName?.toLowerCase().includes(term)
        );
      });
  }, [orders, filter, search]);

  const counts = useMemo(() => {
    const map = new Map<Filter, number>();
    for (const f of FILTERS) {
      map.set(
        f.value,
        (orders ?? []).filter((o) =>
          f.value === "all"
            ? true
            : f.value === "active"
              ? ACTIVE_STATUSES.includes(o.status)
              : o.status === f.value,
        ).length,
      );
    }
    return map;
  }, [orders]);

  if (orders === null) return <Spinner />;

  return (
    <>
      <PageHeader
        title="Porudžbine"
        subtitle="Lista se osvežava sama, bez refreša."
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cx(
              "rounded-full border px-3 py-1.5 text-sm transition-colors",
              filter === f.value
                ? "border-blood bg-blood-soft font-medium text-blood-dark"
                : "border-line bg-surface text-ink-soft hover:border-ink-mute",
            )}
          >
            {f.label}
            <span className="ml-1.5 text-xs text-ink-mute">{counts.get(f.value) ?? 0}</span>
          </button>
        ))}

        <div className="relative ml-auto w-full sm:w-64">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-mute" />
          <input
            className={cx(inputClass, "pl-9")}
            placeholder="Broj ili klinika…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card>
        {visible.length === 0 ? (
          <EmptyState
            icon={<ClipboardList className="h-8 w-8" />}
            title="Nema porudžbina u ovom filteru"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-ink-mute">
                  <th className="px-5 py-3 font-medium">Broj</th>
                  <th className="px-5 py-3 font-medium">Klinika</th>
                  <th className="px-5 py-3 font-medium">Stavke</th>
                  <th className="px-5 py-3 font-medium">Iznos</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Primljena</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visible.map((o) => (
                  <tr
                    key={o.id}
                    className={cx(
                      "transition-colors hover:bg-paper",
                      o.status === "new" && "bg-blood-soft/40",
                    )}
                  >
                    <td className="px-5 py-3">
                      <Link
                        href={`/portal/admin/porudzbine/${o.id}`}
                        className="font-mono text-blood hover:underline"
                      >
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-2">
                        {o.clinicName}
                        {o.urgent && <Badge tone="blood">Hitno</Badge>}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-ink-soft">
                      {o.items?.reduce((s, i) => s + i.quantity, 0) ?? 0} jed. /{" "}
                      {o.items?.length ?? 0} vrste
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
