"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { Check, Droplets, Minus, Plus, ShoppingCart } from "lucide-react";
import { db } from "@/lib/firebase";
import { useCart } from "@/hooks/useCart";
import { PageHeader } from "@/components/portal/PortalShell";
import { Badge, Button, Card, EmptyState, Spinner } from "@/components/ui/kit";
import { StockBadge } from "@/components/ui/status";
import { cx, formatRsd } from "@/lib/format";
import { SPECIES_LABEL, type Product, type Species } from "@/types";

export default function ClinicCatalogPage() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [speciesFilter, setSpeciesFilter] = useState<Species | "all">("all");
  const { quantityOf, setQuantity, count } = useCart();

  useEffect(() => {
    return onSnapshot(
      query(
        collection(db, "products"),
        where("active", "==", true),
        orderBy("sortOrder", "asc"),
      ),
      (snap) => setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Product)),
      () => setProducts([]),
    );
  }, []);

  const visible = useMemo(
    () =>
      (products ?? []).filter(
        (p) => speciesFilter === "all" || p.species === speciesFilter,
      ),
    [products, speciesFilter],
  );

  if (products === null) return <Spinner />;

  return (
    <>
      <PageHeader
        title="Katalog krvnih produkata"
        subtitle="Cene su bez PDV-a. Fakturisanje ide van portala."
        action={
          count > 0 ? (
            <Link href="/portal/klinika/korpa">
              <Button>
                <ShoppingCart className="h-4 w-4" />
                Korpa ({count})
              </Button>
            </Link>
          ) : undefined
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {([["all", "Sve"], ["dog", "Za pse"], ["cat", "Za mačke"]] as const).map(
          ([value, label]) => (
            <button
              key={value}
              onClick={() => setSpeciesFilter(value as Species | "all")}
              className={cx(
                "rounded-full border px-3 py-1.5 text-sm transition-colors",
                speciesFilter === value
                  ? "border-blood bg-blood-soft font-medium text-blood-dark"
                  : "border-line bg-surface text-ink-soft hover:border-ink-mute",
              )}
            >
              {label}
            </button>
          ),
        )}
      </div>

      {visible.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Droplets className="h-8 w-8" />}
            title="Katalog je trenutno prazan"
            description="Javite se timu VBK — proizvodi se upravo pripremaju."
          />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((p) => {
            const qty = quantityOf(p.id);
            const soldOut = p.stock <= 0;
            return (
              <Card key={p.id} className="flex flex-col p-5">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <Badge>{SPECIES_LABEL[p.species]}</Badge>
                  <StockBadge stock={p.stock} threshold={p.lowStockThreshold} />
                </div>

                <h3 className="text-base font-semibold text-ink">{p.name}</h3>
                <p className="mt-1 text-sm text-ink-soft">{p.shortDescription}</p>

                {p.indications && (
                  <p className="mt-3 text-sm text-ink-soft">
                    <span className="text-ink-mute">Indikacije: </span>
                    {p.indications}
                  </p>
                )}

                <dl className="mt-3 space-y-1 text-xs text-ink-mute">
                  <div>
                    <dt className="inline">Jedinica: </dt>
                    <dd className="inline text-ink-soft">{p.unit}</dd>
                  </div>
                  <div>
                    <dt className="inline">Čuvanje: </dt>
                    <dd className="inline text-ink-soft">{p.storage}</dd>
                  </div>
                  <div>
                    <dt className="inline">Rok trajanja: </dt>
                    <dd className="inline text-ink-soft">{p.shelfLifeDays} dana</dd>
                  </div>
                </dl>

                <div className="mt-4 flex items-end justify-between gap-3 border-t border-line pt-4">
                  <span>
                    <span className="block text-lg font-semibold text-ink">
                      {formatRsd(p.price)}
                    </span>
                    <span className="text-xs text-ink-mute">po jedinici, bez PDV-a</span>
                  </span>

                  {qty === 0 ? (
                    <Button
                      size="sm"
                      disabled={soldOut}
                      onClick={() => setQuantity(p.id, 1)}
                    >
                      <Plus className="h-4 w-4" />
                      {soldOut ? "Nedostupno" : "Dodaj"}
                    </Button>
                  ) : (
                    <span className="flex items-center gap-1 rounded-lg border border-blood/40 bg-blood-soft p-1">
                      <button
                        onClick={() => setQuantity(p.id, qty - 1)}
                        aria-label="Manje"
                        className="rounded-md p-1.5 text-blood hover:bg-white"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center font-semibold tabular-nums text-blood-dark">
                        {qty}
                      </span>
                      <button
                        onClick={() => setQuantity(p.id, Math.min(qty + 1, p.stock))}
                        disabled={qty >= p.stock}
                        aria-label="Više"
                        className="rounded-md p-1.5 text-blood hover:bg-white disabled:opacity-40"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </span>
                  )}
                </div>

                {qty > 0 && qty >= p.stock && (
                  <p className="mt-2 flex items-center gap-1 text-xs text-warn">
                    <Check className="h-3 w-3" />
                    To je sve što trenutno imamo na stanju.
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
