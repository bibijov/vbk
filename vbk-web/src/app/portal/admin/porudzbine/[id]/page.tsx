"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { ArrowLeft, Building2, MapPin, Phone, StickyNote, User } from "lucide-react";
import { db } from "@/lib/firebase";
import { authedFetch } from "@/lib/api";
import { PageHeader } from "@/components/portal/PortalShell";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  ErrorNote,
  Spinner,
  inputClass,
} from "@/components/ui/kit";
import { OrderStatusBadge } from "@/components/ui/status";
import { formatDateTime, formatRsd } from "@/lib/format";
import {
  DELIVERY_LABEL,
  ORDER_STATUS_FLOW,
  ORDER_STATUS_LABEL,
  type Clinic,
  type Order,
  type OrderStatus,
} from "@/types";

export default function AdminOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [missing, setMissing] = useState(false);
  const [busy, setBusy] = useState<OrderStatus | null>(null);
  const [error, setError] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);

  useEffect(() => {
    if (!id) return;
    return onSnapshot(
      doc(db, "orders", id),
      (snap) => {
        if (!snap.exists()) {
          setMissing(true);
          return;
        }
        const data = { id: snap.id, ...snap.data() } as Order;
        setOrder(data);
        setAdminNote((prev) => (prev === "" ? (data.adminNote ?? "") : prev));
        // Otvaranje porudžbine je znak da ju je admin video.
        if (!data.seenByAdmin) {
          void updateDoc(doc(db, "orders", snap.id), { seenByAdmin: true });
        }
      },
      () => setMissing(true),
    );
  }, [id]);

  useEffect(() => {
    if (!order?.clinicId) return;
    return onSnapshot(doc(db, "clinics", order.clinicId), (snap) => {
      if (snap.exists()) setClinic({ id: snap.id, ...snap.data() } as Clinic);
    });
  }, [order?.clinicId]);

  async function changeStatus(status: OrderStatus) {
    setError("");
    setBusy(status);
    try {
      await authedFetch(`/api/orders/${id}/status`, { body: { status } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Promena statusa nije uspela.");
    } finally {
      setBusy(null);
    }
  }

  async function saveNote() {
    if (!id) return;
    await updateDoc(doc(db, "orders", id), { adminNote: adminNote.trim() });
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2500);
  }

  if (missing) {
    return (
      <Card className="p-8 text-center text-sm text-ink-soft">
        Porudžbina nije pronađena.{" "}
        <Link href="/portal/admin/porudzbine" className="text-blood hover:underline">
          Nazad na listu
        </Link>
      </Card>
    );
  }
  if (!order) return <Spinner />;

  const nextStatuses = ORDER_STATUS_FLOW[order.status] ?? [];

  return (
    <>
      <Link
        href="/portal/admin/porudzbine"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-mute hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Sve porudžbine
      </Link>

      <PageHeader
        title={order.orderNumber}
        subtitle={`Primljena ${formatDateTime(order.createdAt)}`}
        action={
          <div className="flex items-center gap-2">
            {order.urgent && <Badge tone="blood">Hitno</Badge>}
            <OrderStatusBadge status={order.status} />
          </div>
        }
      />

      {nextStatuses.length > 0 && (
        <Card className="mb-4 p-4">
          <p className="mb-3 text-sm font-medium text-ink">Sledeći korak</p>
          <div className="flex flex-wrap gap-2">
            {nextStatuses.map((status) => (
              <Button
                key={status}
                variant={status === "cancelled" ? "danger" : "primary"}
                loading={busy === status}
                onClick={() => {
                  if (
                    status === "cancelled" &&
                    !confirm("Otkazati porudžbinu? Rezervisane jedinice se vraćaju u zalihe.")
                  ) {
                    return;
                  }
                  void changeStatus(status);
                }}
              >
                {ORDER_STATUS_LABEL[status]}
              </Button>
            ))}
          </div>
          {error && <div className="mt-3">{<ErrorNote>{error}</ErrorNote>}</div>}
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Stavke" />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-ink-mute">
                  <th className="px-5 py-3 font-medium">Proizvod</th>
                  <th className="px-5 py-3 font-medium">Količina</th>
                  <th className="px-5 py-3 font-medium">Cena</th>
                  <th className="px-5 py-3 text-right font-medium">Ukupno</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {order.items?.map((item) => (
                  <tr key={item.productId}>
                    <td className="px-5 py-3">
                      <span className="block font-medium text-ink">{item.name}</span>
                      <span className="text-xs text-ink-mute">
                        {item.sku} · {item.unit}
                      </span>
                    </td>
                    <td className="px-5 py-3 tabular-nums">{item.quantity}</td>
                    <td className="px-5 py-3 tabular-nums text-ink-soft">
                      {formatRsd(item.unitPrice)}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums">
                      {formatRsd(item.lineTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-line">
                  <td colSpan={3} className="px-5 py-3 text-right font-medium">
                    Ukupno bez PDV-a
                  </td>
                  <td className="px-5 py-3 text-right text-base font-semibold tabular-nums">
                    {formatRsd(order.total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {order.note && (
            <div className="border-t border-line px-5 py-4">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-ink-mute">
                <StickyNote className="h-3.5 w-3.5" />
                Napomena klinike
              </p>
              <p className="text-sm text-ink">{order.note}</p>
            </div>
          )}
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Klinika" />
            <div className="space-y-2.5 px-5 py-4 text-sm">
              <p className="flex items-start gap-2">
                <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-ink-mute" />
                <Link
                  href={`/portal/admin/klinike/${order.clinicId}`}
                  className="font-medium text-blood hover:underline"
                >
                  {order.clinicName}
                </Link>
              </p>
              <p className="flex items-start gap-2 text-ink-soft">
                <User className="mt-0.5 h-4 w-4 shrink-0 text-ink-mute" />
                {order.createdByName}
              </p>
              {clinic?.phone && (
                <p className="flex items-start gap-2 text-ink-soft">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-ink-mute" />
                  <a href={`tel:${clinic.phone}`} className="hover:underline">
                    {clinic.phone}
                  </a>
                </p>
              )}
              <p className="flex items-start gap-2 text-ink-soft">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink-mute" />
                <span>
                  {DELIVERY_LABEL[order.deliveryMethod]}
                  {order.deliveryMethod === "delivery" && order.deliveryAddress
                    ? ` — ${order.deliveryAddress}`
                    : ""}
                </span>
              </p>
            </div>
          </Card>

          <Card>
            <CardHeader title="Interna beleška" subtitle="Klinika je ne vidi" />
            <div className="space-y-3 px-5 py-4">
              <textarea
                rows={3}
                className={inputClass}
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="npr. dogovoreno preuzimanje u 16 h"
              />
              <Button size="sm" variant="secondary" onClick={saveNote}>
                {noteSaved ? "Sačuvano" : "Sačuvaj belešku"}
              </Button>
            </div>
          </Card>

          <Card>
            <CardHeader title="Tok porudžbine" />
            <ol className="space-y-3 px-5 py-4">
              {(order.history ?? []).map((event, i) => (
                <li key={`${event.status}-${i}`} className="flex gap-3 text-sm">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blood" />
                  <span>
                    <span className="block font-medium text-ink">
                      {ORDER_STATUS_LABEL[event.status]}
                    </span>
                    <span className="block text-xs text-ink-mute">
                      {formatDateTime(event.at)} · {event.byName}
                    </span>
                    {event.note && (
                      <span className="mt-0.5 block text-xs text-ink-soft">{event.note}</span>
                    )}
                  </span>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </>
  );
}
