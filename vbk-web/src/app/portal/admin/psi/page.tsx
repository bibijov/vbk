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
import { Dog as DogIcon, Plus, Search } from "lucide-react";
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
import { DonorStatusBadge } from "@/components/ui/status";
import { cx, daysUntil, formatDate } from "@/lib/format";
import {
  BLOOD_TYPE_LABEL,
  DONOR_STATUS_LABEL,
  SPECIES_LABEL,
  type Dog,
  type DonorStatus,
  type Species,
} from "@/types";

const FILTERS: { value: DonorStatus | "all"; label: string }[] = [
  { value: "all", label: "Svi" },
  { value: "candidate", label: DONOR_STATUS_LABEL.candidate },
  { value: "active", label: DONOR_STATUS_LABEL.active },
  { value: "paused", label: DONOR_STATUS_LABEL.paused },
  { value: "retired", label: DONOR_STATUS_LABEL.retired },
];

export default function AdminDogsPage() {
  const [dogs, setDogs] = useState<Dog[] | null>(null);
  const [filter, setFilter] = useState<DonorStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    return onSnapshot(
      query(collection(db, "dogs"), orderBy("name", "asc")),
      (snap) => setDogs(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Dog)),
      () => setDogs([]),
    );
  }, []);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (dogs ?? [])
      .filter((d) => filter === "all" || d.donorStatus === filter)
      .filter(
        (d) =>
          !term ||
          d.name?.toLowerCase().includes(term) ||
          d.breed?.toLowerCase().includes(term) ||
          d.ownerName?.toLowerCase().includes(term) ||
          d.microchip?.includes(term),
      );
  }, [dogs, filter, search]);

  if (dogs === null) return <Spinner />;

  return (
    <>
      <PageHeader
        title="Kartoni donora"
        subtitle="Registar pasa i mačaka donora — pregledi, analize i donacije na jednom mestu."
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" />
            Novi karton
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
                ? dogs.length
                : dogs.filter((d) => d.donorStatus === f.value).length}
            </span>
          </button>
        ))}
        <div className="relative ml-auto w-full sm:w-64">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-mute" />
          <input
            className={cx(inputClass, "pl-9")}
            placeholder="Ime, rasa, vlasnik, čip…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card>
        {visible.length === 0 ? (
          <EmptyState
            icon={<DogIcon className="h-8 w-8" />}
            title="Nema kartona"
            description="Kartoni nastaju ručno ili iz prijave donora sa sajta."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-ink-mute">
                  <th className="px-5 py-3 font-medium">Ime</th>
                  <th className="px-5 py-3 font-medium">Vrsta / rasa</th>
                  <th className="px-5 py-3 font-medium">Krvna grupa</th>
                  <th className="px-5 py-3 font-medium">Vlasnik</th>
                  <th className="px-5 py-3 font-medium">Donacija</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visible.map((d) => {
                  const days = daysUntil(d.nextEligibleDate);
                  const ready = d.nextEligibleDate === null || (days !== null && days <= 0);
                  return (
                    <tr key={d.id} className="transition-colors hover:bg-paper">
                      <td className="px-5 py-3">
                        <Link
                          href={`/portal/admin/psi/${d.id}`}
                          className="font-medium text-blood hover:underline"
                        >
                          {d.name}
                        </Link>
                        <span className="block text-xs text-ink-mute">
                          {d.donationCount ?? 0} donacija
                        </span>
                      </td>
                      <td className="px-5 py-3 text-ink-soft">
                        {SPECIES_LABEL[d.species]} · {d.breed || "—"}
                      </td>
                      <td className="px-5 py-3">
                        <Badge tone={d.bloodType === "unknown" ? "neutral" : "blood"}>
                          {d.bloodType}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-ink-soft">
                        {d.ownerName}
                        <span className="block text-xs text-ink-mute">{d.ownerPhone}</span>
                      </td>
                      <td className="px-5 py-3">
                        {d.donorStatus !== "active" ? (
                          <span className="text-ink-mute">—</span>
                        ) : ready ? (
                          <Badge tone="ok">Može odmah</Badge>
                        ) : (
                          <span className="text-xs text-ink-soft">
                            za {days} d ({formatDate(d.nextEligibleDate)})
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <DonorStatusBadge status={d.donorStatus} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {creating && <NewDogModal onClose={() => setCreating(false)} />}
    </>
  );
}

function NewDogModal({ onClose }: { onClose: () => void }) {
  const empty = {
    name: "",
    species: "dog" as Species,
    breed: "",
    birthDate: "",
    weightKg: "",
    microchip: "",
    sex: "" as "" | "m" | "f",
    bloodType: "unknown",
    donorStatus: "candidate" as DonorStatus,
    ownerName: "",
    ownerPhone: "",
    ownerEmail: "",
    ownerCity: "",
    note: "",
  };
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const set = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.ownerName.trim()) {
      setError("Ime ljubimca i ime vlasnika su obavezni.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await addDoc(collection(db, "dogs"), {
        ...form,
        birthDate: form.birthDate || null,
        weightKg: form.weightKg ? Number(form.weightKg) : null,
        sex: form.sex || null,
        lastDonationDate: null,
        nextEligibleDate: null,
        donationCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Čuvanje nije uspelo.");
    } finally {
      setBusy(false);
    }
  }

  const bloodOptions =
    form.species === "dog"
      ? ["unknown", "DEA1+", "DEA1-"]
      : ["unknown", "A", "B", "AB"];

  return (
    <Modal open onClose={onClose} title="Novi karton donora" wide>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Ime ljubimca" required>
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </Field>
          <Field label="Vrsta">
            <select
              className={inputClass}
              value={form.species}
              onChange={(e) => {
                set("species", e.target.value);
                set("bloodType", "unknown");
              }}
            >
              <option value="dog">Pas</option>
              <option value="cat">Mačka</option>
            </select>
          </Field>
          <Field label="Rasa">
            <input
              className={inputClass}
              value={form.breed}
              onChange={(e) => set("breed", e.target.value)}
            />
          </Field>
          <Field label="Datum rođenja">
            <input
              type="date"
              className={inputClass}
              value={form.birthDate}
              onChange={(e) => set("birthDate", e.target.value)}
            />
          </Field>
          <Field label="Težina (kg)">
            <input
              type="number"
              step="0.1"
              min={0}
              className={inputClass}
              value={form.weightKg}
              onChange={(e) => set("weightKg", e.target.value)}
            />
          </Field>
          <Field label="Pol">
            <select
              className={inputClass}
              value={form.sex}
              onChange={(e) => set("sex", e.target.value)}
            >
              <option value="">—</option>
              <option value="m">Mužjak</option>
              <option value="f">Ženka</option>
            </select>
          </Field>
          <Field label="Broj mikročipa">
            <input
              className={inputClass}
              value={form.microchip}
              onChange={(e) => set("microchip", e.target.value)}
            />
          </Field>
          <Field label="Krvna grupa">
            <select
              className={inputClass}
              value={form.bloodType}
              onChange={(e) => set("bloodType", e.target.value)}
            >
              {bloodOptions.map((b) => (
                <option key={b} value={b}>
                  {BLOOD_TYPE_LABEL[b]}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
          <Field label="Ime vlasnika" required>
            <input
              className={inputClass}
              value={form.ownerName}
              onChange={(e) => set("ownerName", e.target.value)}
            />
          </Field>
          <Field label="Telefon vlasnika">
            <input
              className={inputClass}
              value={form.ownerPhone}
              onChange={(e) => set("ownerPhone", e.target.value)}
            />
          </Field>
          <Field label="Email vlasnika">
            <input
              type="email"
              className={inputClass}
              value={form.ownerEmail}
              onChange={(e) => set("ownerEmail", e.target.value)}
            />
          </Field>
          <Field label="Grad">
            <input
              className={inputClass}
              value={form.ownerCity}
              onChange={(e) => set("ownerCity", e.target.value)}
            />
          </Field>
        </div>

        <ErrorNote>{error}</ErrorNote>

        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Odustani
          </Button>
          <Button type="submit" loading={busy}>
            Sačuvaj karton
          </Button>
        </div>
      </form>
    </Modal>
  );
}
