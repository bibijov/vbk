"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { Hospital, Plus, Search } from "lucide-react";
import { db } from "@/lib/firebase";
import { PageHeader } from "@/components/portal/PortalShell";
import {
  Button,
  Card,
  EmptyState,
  ErrorNote,
  Field,
  Modal,
  Spinner,
  inputClass,
} from "@/components/ui/kit";
import { ClinicStatusBadge } from "@/components/ui/status";
import { cx, formatDate } from "@/lib/format";
import { CLINIC_STATUS_LABEL, type Clinic, type ClinicStatus } from "@/types";

const FILTERS: { value: ClinicStatus | "all"; label: string }[] = [
  { value: "pending", label: CLINIC_STATUS_LABEL.pending },
  { value: "verified", label: CLINIC_STATUS_LABEL.verified },
  { value: "active", label: CLINIC_STATUS_LABEL.active },
  { value: "suspended", label: CLINIC_STATUS_LABEL.suspended },
  { value: "all", label: "Sve" },
];

export default function AdminClinicsPage() {
  const [clinics, setClinics] = useState<Clinic[] | null>(null);
  const [filter, setFilter] = useState<ClinicStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    return onSnapshot(
      query(collection(db, "clinics"), orderBy("createdAt", "desc")),
      (snap) => setClinics(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Clinic)),
      () => setClinics([]),
    );
  }, []);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (clinics ?? [])
      .filter((c) => filter === "all" || c.status === filter)
      .filter(
        (c) =>
          !term ||
          c.name?.toLowerCase().includes(term) ||
          c.city?.toLowerCase().includes(term) ||
          c.email?.toLowerCase().includes(term),
      );
  }, [clinics, filter, search]);

  if (clinics === null) return <Spinner />;

  return (
    <>
      <PageHeader
        title="Klinike"
        subtitle="Klinika mora biti u statusu „Aktivna” da bi mogla da poručuje."
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" />
            Dodaj kliniku
          </Button>
        }
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
            <span className="ml-1.5 text-xs text-ink-mute">
              {f.value === "all"
                ? clinics.length
                : clinics.filter((c) => c.status === f.value).length}
            </span>
          </button>
        ))}
        <div className="relative ml-auto w-full sm:w-64">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-mute" />
          <input
            className={cx(inputClass, "pl-9")}
            placeholder="Naziv, grad, email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card>
        {visible.length === 0 ? (
          <EmptyState
            icon={<Hospital className="h-8 w-8" />}
            title="Nema klinika u ovom filteru"
            description="Klinike stižu kroz zahtev sa sajta ili ih dodajete ručno."
          />
        ) : (
          <ul className="divide-y divide-line">
            {visible.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/portal/admin/klinike/${c.id}`}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 transition-colors hover:bg-paper"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-ink">{c.name}</span>
                    <span className="block truncate text-sm text-ink-mute">
                      {[c.city, c.contactPerson, c.phone].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  <ClinicStatusBadge status={c.status} />
                  <span className="w-24 text-right text-xs text-ink-mute">
                    {formatDate(c.createdAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <NewClinicModal open={creating} onClose={() => setCreating(false)} />
    </>
  );
}

function NewClinicModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({
    name: "",
    pib: "",
    mb: "",
    address: "",
    city: "",
    postalCode: "",
    deliveryAddress: "",
    contactPerson: "",
    phone: "",
    emergencyPhone: "",
    email: "",
    note: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const set = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      setError("Naziv i email su obavezni.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await addDoc(collection(db, "clinics"), {
        ...form,
        email: form.email.trim().toLowerCase(),
        status: "verified" as ClinicStatus,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      onClose();
      setForm({
        name: "",
        pib: "",
        mb: "",
        address: "",
        city: "",
        postalCode: "",
        deliveryAddress: "",
        contactPerson: "",
        phone: "",
        emergencyPhone: "",
        email: "",
        note: "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Čuvanje nije uspelo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Nova klinika" wide>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Naziv klinike" required>
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </Field>
          <Field label="Email" required>
            <input
              type="email"
              className={inputClass}
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </Field>
          <Field label="PIB">
            <input
              className={inputClass}
              value={form.pib}
              onChange={(e) => set("pib", e.target.value)}
            />
          </Field>
          <Field label="Matični broj">
            <input
              className={inputClass}
              value={form.mb}
              onChange={(e) => set("mb", e.target.value)}
            />
          </Field>
          <Field label="Adresa">
            <input
              className={inputClass}
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
            />
          </Field>
          <Field label="Grad">
            <input
              className={inputClass}
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
            />
          </Field>
          <Field label="Kontakt osoba">
            <input
              className={inputClass}
              value={form.contactPerson}
              onChange={(e) => set("contactPerson", e.target.value)}
            />
          </Field>
          <Field label="Telefon">
            <input
              className={inputClass}
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
          </Field>
        </div>

        <Field label="Adresa isporuke" hint="Ostavite prazno ako je ista kao adresa klinike.">
          <input
            className={inputClass}
            value={form.deliveryAddress}
            onChange={(e) => set("deliveryAddress", e.target.value)}
          />
        </Field>

        <ErrorNote>{error}</ErrorNote>

        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Odustani
          </Button>
          <Button type="submit" loading={busy}>
            Sačuvaj kliniku
          </Button>
        </div>
      </form>
    </Modal>
  );
}
