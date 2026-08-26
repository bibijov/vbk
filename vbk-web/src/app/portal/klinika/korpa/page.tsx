"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { Minus, Phone, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { authedFetch } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { PageHeader } from "@/components/portal/PortalShell";
import {
  Button,
  Card,
  CardHeader,
  EmptyState,
  ErrorNote,
  Field,
  Spinner,
  inputClass,
} from "@/components/ui/kit";
import { formatRsd } from "@/lib/format";
import { EMERGENCY_PHONE } from "@/lib/constants";
import type { Clinic, DeliveryMethod, Product } from "@/types";

export default function CartPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const { lines, setQuantity, remove, clear } = useCart();

  const [products, setProducts] = useState<Product[] | null>(null);
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("delivery");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [note, setNote] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    return onSnapshot(
      collection(db, "products"),
      (snap) => setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Product)),
      () => setProducts([]),
    );
  }, []);

  useEffect(() => {
    if (!profile?.clinicId) return;
    return onSnapshot(doc(db, "clinics", profile.clinicId), (snap) => {
      if (!snap.exists()) return;
      const data = { id: snap.id, ...snap.data() } as Clinic;
      setClinic(data);
      setDeliveryAddress((prev) => prev || data.deliveryAddress || data.address || "");
    });
  }, [profile?.clinicId]);

  const rows = useMemo(() => {
    return lines
      .map((line) => {
        const product = (products ?? []).find((p) => p.id === line.productId);
        return product ? { line, product } : null;
      })
      .filter((x): x is { line: (typeof lines)[number]; product: Product } => x !== null);
  }, [lines, products]);

  const total = rows.reduce((sum, r) => sum + r.product.price * r.line.quantity, 0);
  const overStock = rows.filter((r) => r.line.quantity > r.product.stock);
  const canOrder = clinic?.status === "active";

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await authedFetch<{ id: string }>("/api/orders", {
        body: {
          items: lines,
          note,
          urgent,
          deliveryMethod,
          deliveryAddress,
        },
      });
      clear();
      router.push(`/portal/klinika/porudzbine/${res.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Slanje porudžbine nije uspelo.");
      setBusy(false);
    }
  }

  if (products === null) return <Spinner />;

  if (rows.length === 0) {
    return (
      <>
        <PageHeader title="Korpa" />
        <Card>
          <EmptyState
            icon={<ShoppingCart className="h-8 w-8" />}
            title="Korpa je prazna"
            description="Dodajte proizvode iz kataloga."
            action={
              <Link href="/portal/klinika/katalog">
                <Button>Otvori katalog</Button>
              </Link>
            }
          />
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Korpa" subtitle="Proverite stavke pre slanja porudžbine." />

      <form onSubmit={submit} className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title={`Stavke (${rows.length})`} />
          <ul className="divide-y divide-line">
            {rows.map(({ line, product }) => (
              <li key={product.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-ink">{product.name}</span>
                  <span className="text-xs text-ink-mute">
                    {product.sku} · {product.unit} · {formatRsd(product.price)}/jed.
                  </span>
                  {line.quantity > product.stock && (
                    <span className="mt-1 block text-xs text-blood">
                      Na stanju je samo {product.stock} — smanjite količinu.
                    </span>
                  )}
                </span>

                <span className="flex items-center gap-1 rounded-lg border border-line p-1">
                  <button
                    type="button"
                    onClick={() => setQuantity(product.id, line.quantity - 1)}
                    aria-label="Manje"
                    className="rounded-md p-1.5 text-ink-soft hover:bg-paper"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-9 text-center font-semibold tabular-nums">
                    {line.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setQuantity(product.id, Math.min(line.quantity + 1, product.stock))
                    }
                    disabled={line.quantity >= product.stock}
                    aria-label="Više"
                    className="rounded-md p-1.5 text-ink-soft hover:bg-paper disabled:opacity-40"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </span>

                <span className="w-24 text-right font-medium tabular-nums">
                  {formatRsd(product.price * line.quantity)}
                </span>

                <button
                  type="button"
                  onClick={() => remove(product.id)}
                  aria-label="Ukloni"
                  className="rounded-md p-2 text-ink-mute hover:bg-blood-soft hover:text-blood"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Isporuka" />
            <div className="space-y-4 px-5 py-4">
              <Field label="Način preuzimanja">
                <select
                  className={inputClass}
                  value={deliveryMethod}
                  onChange={(e) => setDeliveryMethod(e.target.value as DeliveryMethod)}
                >
                  <option value="delivery">Dostava do klinike</option>
                  <option value="pickup">Preuzimamo lično</option>
                </select>
              </Field>

              {deliveryMethod === "delivery" && (
                <Field label="Adresa isporuke">
                  <input
                    className={inputClass}
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                  />
                </Field>
              )}

              <Field label="Napomena" hint="Vreme, kontakt osoba, poseban zahtev…">
                <textarea
                  rows={3}
                  className={inputClass}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </Field>

              <label className="flex items-start gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={urgent}
                  onChange={(e) => setUrgent(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[var(--color-blood)]"
                />
                <span>
                  Označi kao hitno
                  <span className="mt-0.5 block text-xs text-ink-mute">
                    Za stvarno hitne slučajeve uvek prvo pozovite telefonom.
                  </span>
                </span>
              </label>
            </div>
          </Card>

          <Card>
            <div className="space-y-3 px-5 py-4">
              <div className="flex items-center justify-between text-sm text-ink-soft">
                <span>Ukupno jedinica</span>
                <span className="tabular-nums">
                  {rows.reduce((s, r) => s + r.line.quantity, 0)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-line pt-3">
                <span className="font-medium text-ink">Ukupno bez PDV-a</span>
                <span className="text-lg font-semibold tabular-nums">
                  {formatRsd(total)}
                </span>
              </div>

              <ErrorNote>{error}</ErrorNote>

              {!canOrder && (
                <p className="rounded-lg border border-warn/30 bg-warn-soft px-3 py-2 text-sm text-warn">
                  Nalog klinike još nije aktiviran za poručivanje.
                </p>
              )}

              <Button
                type="submit"
                className="w-full"
                loading={busy}
                disabled={!canOrder || overStock.length > 0}
              >
                Pošalji porudžbinu
              </Button>

              <p className="text-xs text-ink-mute">
                Slanjem porudžbine rezervišete jedinice. Plaćanje ne ide kroz portal —
                fakturu šaljemo naknadno.
              </p>

              <a
                href={`tel:${EMERGENCY_PHONE.replace(/\s/g, "")}`}
                className="flex items-center justify-center gap-2 rounded-lg border border-line py-2 text-sm text-ink-soft hover:border-ink-mute"
              >
                <Phone className="h-4 w-4" />
                Hitno: {EMERGENCY_PHONE}
              </a>
            </div>
          </Card>
        </div>
      </form>
    </>
  );
}
