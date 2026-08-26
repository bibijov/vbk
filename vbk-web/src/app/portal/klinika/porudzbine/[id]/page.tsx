"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { ArrowLeft, MapPin, Phone, StickyNote } from "lucide-react";
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
} from "@/components/ui/kit";
import { OrderStatusBadge } from "@/components/ui/status";
import { formatDateTime, formatRsd } from "@/lib/format";
import { EMERGENCY_PHONE } from "@/lib/constants";
import { DELIVERY_LABEL, ORDER_STATUS_LABEL, type Order, type OrderStatus } from "@/types";

/** Koraci koje klinika vidi kao traku napretka. */
const STEPS: OrderStatus[] = ["new", "confirmed", "preparing", "dispatched", "completed"];

export default function ClinicOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [missing, setMissing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    return onSnapshot(
      doc(db, "orders", id),
      (snap) => {
        if (!snap.exists()) {
          setMissing(true);
          return;
        }
        setOrder({ id: snap.id, ...snap.data() } as Order);
      },
      () => setMissing(true),
    );
  }, [id]);

  async function cancel() {
    if (!confirm("Otkazati porudžbinu?")) return;
    setError("");
    setBusy(true);
    try {
      await authedFetch(`/api/orders/${id}/status`, { body: { status: "cancelled" } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Otkazivanje nije uspelo.");
    } finally {
      setBusy(false);
    }
  }

  if (missing) {
    return (
      <Card className="p-8 text-center text-sm text-ink-soft">
        Porudžbina nije pronađena.{" "}
        <Link href="/portal/klinika/porudzbine" className="text-blood hover:underline">
          Nazad na listu
        </Link>
      </Card>
    );
  }
  if (!order) return <Spinner />;

  const currentStep = STEPS.indexOf(order.status);
  const cancelled = order.status === "cancelled";

  return (
    <>
      <Link
        href="/portal/klinika/porudzbine"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-mute hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Moje porudžbine
      </Link>

      <PageHeader
        title={order.orderNumber}
        subtitle={`Poslata ${formatDateTime(order.createdAt)}`}
        action={
          <div className="flex items-center gap-2">
            {order.urgent && <Badge tone="blood">Hitno</Badge>}
            <OrderStatusBadge status={order.status} />
          </div>
        }
      />

      {!cancelled && (
        <Card className="mb-4 px-5 py-5">
          <ol className="flex flex-wrap gap-3">
            {STEPS.map((step, i) => {
              const done = i <= currentStep;
              return (
                <li key={step} className="flex flex-1 items-center gap-2">
                  <span
                    className={
                      done
                        ? "grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blood text-xs font-semibold text-white"
                        : "grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line text-xs text-ink-mute"
                    }
                  >
                    {i + 1}
                  </span>
                  <span
                    className={
                      done
                        ? "text-sm font-medium text-ink"
                        : "text-sm text-ink-mute"
                    }
                  >
                    {ORDER_STATUS_LABEL[step]}
                  </span>
                </li>
              );
            })}
          </ol>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Stavke" />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-ink-mute">
                  <th className="px-5 py-3 font-medium">Proizvod</th>
                  <th className="px-5 py-3 font-medium">Količina</th>
                  <th className="px-5 py-3 text-right font-medium">Ukupno</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {order.items?.map((item) => (
                  <tr key={item.productId}>
                    <td className="px-5 py-3">
                      <span className="block font-medium text-ink">{item.name}</span>
                      <span className="text-xs text-ink-mute">
                        {item.unit} · {formatRsd(item.unitPrice)}/jed.
                      </span>
                    </td>
                    <td className="px-5 py-3 tabular-nums">{item.quantity}</td>
                    <td className="px-5 py-3 text-right tabular-nums">
                      {formatRsd(item.lineTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-line">
                  <td colSpan={2} className="px-5 py-3 text-right font-medium">
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
                Vaša napomena
              </p>
              <p className="text-sm text-ink">{order.note}</p>
            </div>
          )}
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Isporuka" />
            <div className="space-y-2 px-5 py-4 text-sm">
              <p className="flex items-start gap-2 text-ink-soft">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink-mute" />
                <span>
                  {DELIVERY_LABEL[order.deliveryMethod]}
                  {order.deliveryMethod === "delivery" && order.deliveryAddress
                    ? ` — ${order.deliveryAddress}`
                    : ""}
                </span>
              </p>
              <p className="flex items-start gap-2 text-ink-soft">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-ink-mute" />
                <a
                  href={`tel:${EMERGENCY_PHONE.replace(/\s/g, "")}`}
                  className="hover:underline"
                >
                  Hitno: {EMERGENCY_PHONE}
                </a>
              </p>
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
                      {formatDateTime(event.at)}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </Card>

          {order.status === "new" && (
            <Card className="p-4">
              <ErrorNote>{error}</ErrorNote>
              <Button
                variant="danger"
                className="mt-2 w-full"
                loading={busy}
                onClick={cancel}
              >
                Otkaži porudžbinu
              </Button>
              <p className="mt-2 text-xs text-ink-mute">
                Otkazivanje je moguće dok VBK ne potvrdi porudžbinu. Kasnije — telefonom.
              </p>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
