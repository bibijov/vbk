"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { Droplets, Minus, Pencil, Plus, Trash2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { PageHeader } from "@/components/portal/PortalShell";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorNote,
  Field,
  Modal,
  Spinner,
  inputClass,
} from "@/components/ui/kit";
import { StockBadge } from "@/components/ui/status";
import { cx, formatRsd } from "@/lib/format";
import { SPECIES_LABEL, type Product, type Species } from "@/types";

type Draft = Omit<Product, "id" | "createdAt" | "updatedAt">;

const EMPTY: Draft = {
  sku: "",
  name: "",
  species: "dog",
  shortDescription: "",
  indications: "",
  storage: "",
  shelfLifeDays: 35,
  unit: "",
  price: 0,
  stock: 0,
  lowStockThreshold: 2,
  active: true,
  sortOrder: 100,
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const [speciesFilter, setSpeciesFilter] = useState<Species | "all">("all");

  useEffect(() => {
    return onSnapshot(
      query(collection(db, "products"), orderBy("sortOrder", "asc")),
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

  async function adjustStock(product: Product, delta: number) {
    if (product.stock + delta < 0) return;
    await updateDoc(doc(db, "products", product.id), {
      stock: increment(delta),
      updatedAt: serverTimestamp(),
    });
  }

  async function removeProduct(product: Product) {
    if (
      !confirm(
        `Obrisati „${product.name}"? Ako je proizvod već korišćen u porudžbinama, bolje ga samo deaktivirajte.`,
      )
    ) {
      return;
    }
    await deleteDoc(doc(db, "products", product.id));
  }

  if (products === null) return <Spinner />;

  return (
    <>
      <PageHeader
        title="Proizvodi i zalihe"
        subtitle="Stanje zaliha se automatski umanjuje kada klinika poruči, i vraća pri otkazivanju."
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" />
            Novi proizvod
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {([["all", "Svi"], ["dog", "Psi"], ["cat", "Mačke"]] as const).map(
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
            title="Nema proizvoda"
            description="Pokrenite `npm run seed` da ubacite predloženih 9 proizvoda, ili ih dodajte ručno."
            action={<Button onClick={() => setCreating(true)}>Dodaj proizvod</Button>}
          />
        </Card>
      ) : (
        <div className="grid gap-3">
          {visible.map((p) => (
            <Card key={p.id} className={cx("p-5", !p.active && "opacity-60")}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-ink">{p.name}</h3>
                    <Badge>{SPECIES_LABEL[p.species]}</Badge>
                    {!p.active && <Badge tone="neutral">Neaktivan</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-ink-soft">{p.shortDescription}</p>
                  <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-ink-mute">
                    <div>
                      <dt className="inline">Šifra: </dt>
                      <dd className="inline font-mono text-ink-soft">{p.sku}</dd>
                    </div>
                    <div>
                      <dt className="inline">Jedinica: </dt>
                      <dd className="inline text-ink-soft">{p.unit}</dd>
                    </div>
                    <div>
                      <dt className="inline">Čuvanje: </dt>
                      <dd className="inline text-ink-soft">{p.storage}</dd>
                    </div>
                    <div>
                      <dt className="inline">Rok: </dt>
                      <dd className="inline text-ink-soft">{p.shelfLifeDays} dana</dd>
                    </div>
                    <div>
                      <dt className="inline">Cena: </dt>
                      <dd className="inline text-ink-soft">{formatRsd(p.price)}</dd>
                    </div>
                  </dl>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 rounded-lg border border-line p-1">
                    <button
                      onClick={() => adjustStock(p, -1)}
                      disabled={p.stock <= 0}
                      aria-label="Smanji zalihe"
                      className="rounded-md p-1.5 text-ink-soft hover:bg-paper disabled:opacity-40"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-10 text-center text-lg font-semibold tabular-nums">
                      {p.stock}
                    </span>
                    <button
                      onClick={() => adjustStock(p, 1)}
                      aria-label="Povećaj zalihe"
                      className="rounded-md p-1.5 text-ink-soft hover:bg-paper"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <StockBadge stock={p.stock} threshold={p.lowStockThreshold} />
                  <button
                    onClick={() => setEditing(p)}
                    aria-label="Izmeni"
                    className="rounded-md p-2 text-ink-mute hover:bg-paper hover:text-ink"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => removeProduct(p)}
                    aria-label="Obriši"
                    className="rounded-md p-2 text-ink-mute hover:bg-blood-soft hover:text-blood"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal se montira tek na otvaranju — tako mu se stanje resetuje samo. */}
      {creating && (
        <ProductModal
          onClose={() => setCreating(false)}
          initial={EMPTY}
          title="Novi proizvod"
          onSave={async (draft) => {
            await addDoc(collection(db, "products"), {
              ...draft,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }}
        />
      )}

      {editing && (
        <ProductModal
          onClose={() => setEditing(null)}
          initial={editing}
          title="Izmena proizvoda"
          onSave={async (draft) => {
            await updateDoc(doc(db, "products", editing.id), {
              ...draft,
              updatedAt: serverTimestamp(),
            });
          }}
        />
      )}
    </>
  );
}

function ProductModal({
  onClose,
  initial,
  title,
  onSave,
}: {
  onClose: () => void;
  initial: Draft;
  title: string;
  onSave: (draft: Draft) => Promise<void>;
}) {
  const [draft, setDraft] = useState<Draft>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!draft.name.trim() || !draft.sku.trim()) {
      setError("Naziv i šifra su obavezni.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onSave(draft);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Čuvanje nije uspelo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={title} wide>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Naziv" required>
            <input
              className={inputClass}
              value={draft.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </Field>
          <Field label="Šifra (SKU)" required>
            <input
              className={inputClass}
              value={draft.sku}
              onChange={(e) => set("sku", e.target.value)}
            />
          </Field>
          <Field label="Vrsta">
            <select
              className={inputClass}
              value={draft.species}
              onChange={(e) => set("species", e.target.value as Species)}
            >
              <option value="dog">Pas</option>
              <option value="cat">Mačka</option>
            </select>
          </Field>
          <Field label="Jedinica" hint="npr. kesa 450 ml">
            <input
              className={inputClass}
              value={draft.unit}
              onChange={(e) => set("unit", e.target.value)}
            />
          </Field>
        </div>

        <Field label="Kratak opis">
          <input
            className={inputClass}
            value={draft.shortDescription}
            onChange={(e) => set("shortDescription", e.target.value)}
          />
        </Field>

        <Field label="Indikacije" hint="Vidljivo klinikama u katalogu.">
          <textarea
            rows={2}
            className={inputClass}
            value={draft.indications}
            onChange={(e) => set("indications", e.target.value)}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Uslovi čuvanja">
            <input
              className={inputClass}
              value={draft.storage}
              onChange={(e) => set("storage", e.target.value)}
            />
          </Field>
          <Field label="Rok trajanja (dana)">
            <input
              type="number"
              min={1}
              className={inputClass}
              value={draft.shelfLifeDays}
              onChange={(e) => set("shelfLifeDays", Number(e.target.value))}
            />
          </Field>
          <Field label="Cena (RSD, bez PDV-a)">
            <input
              type="number"
              min={0}
              className={inputClass}
              value={draft.price}
              onChange={(e) => set("price", Number(e.target.value))}
            />
          </Field>
          <Field label="Zalihe (jedinica)">
            <input
              type="number"
              min={0}
              className={inputClass}
              value={draft.stock}
              onChange={(e) => set("stock", Number(e.target.value))}
            />
          </Field>
          <Field label="Prag upozorenja" hint="Ispod ovoga dashboard pali alarm.">
            <input
              type="number"
              min={0}
              className={inputClass}
              value={draft.lowStockThreshold}
              onChange={(e) => set("lowStockThreshold", Number(e.target.value))}
            />
          </Field>
          <Field label="Redosled prikaza">
            <input
              type="number"
              className={inputClass}
              value={draft.sortOrder}
              onChange={(e) => set("sortOrder", Number(e.target.value))}
            />
          </Field>
        </div>

        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={draft.active}
            onChange={(e) => set("active", e.target.checked)}
            className="h-4 w-4 accent-[var(--color-blood)]"
          />
          Vidljiv klinikama u katalogu
        </label>

        <ErrorNote>{error}</ErrorNote>

        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Odustani
          </Button>
          <Button type="submit" loading={busy}>
            Sačuvaj
          </Button>
        </div>
      </form>
    </Modal>
  );
}
