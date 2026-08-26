"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  addDoc,
  collection,
  doc,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import {
  ArrowLeft,
  CalendarClock,
  Droplet,
  FlaskConical,
  Plus,
  Stethoscope,
  StickyNote,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/portal/PortalShell";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  ErrorNote,
  Field,
  Modal,
  Spinner,
  SuccessNote,
  inputClass,
} from "@/components/ui/kit";
import { DonorStatusBadge } from "@/components/ui/status";
import {
  DONATION_INTERVAL_DAYS,
  addDays,
  ageFromBirthDate,
  cx,
  daysUntil,
  formatDate,
  toISODate,
} from "@/lib/format";
import { DONOR_CRITERIA } from "@/lib/constants";
import {
  BLOOD_TYPE_LABEL,
  DONOR_STATUS_LABEL,
  SPECIES_LABEL,
  VISIT_TYPE_LABEL,
  type Dog,
  type DonorStatus,
  type Visit,
  type VisitType,
} from "@/types";

const VISIT_ICON: Record<VisitType, typeof Droplet> = {
  donation: Droplet,
  labs: FlaskConical,
  exam: Stethoscope,
  note: StickyNote,
};

export default function AdminDogDetail() {
  const { id } = useParams<{ id: string }>();
  const [dog, setDog] = useState<Dog | null>(null);
  const [missing, setMissing] = useState(false);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [addingVisit, setAddingVisit] = useState(false);
  const [form, setForm] = useState<Partial<Dog>>({});
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    return onSnapshot(
      doc(db, "dogs", id),
      (snap) => {
        if (!snap.exists()) {
          setMissing(true);
          return;
        }
        const data = { id: snap.id, ...snap.data() } as Dog;
        setDog(data);
        setForm((prev) => (Object.keys(prev).length ? prev : data));
      },
      () => setMissing(true),
    );
  }, [id]);

  useEffect(() => {
    if (!id) return;
    return onSnapshot(
      query(collection(db, "dogs", id, "visits"), orderBy("date", "desc")),
      (snap) => setVisits(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Visit)),
      () => setVisits([]),
    );
  }, [id]);

  const expiringLabs = useMemo(() => {
    return visits
      .filter((v) => v.type === "labs" && v.validUntil)
      .map((v) => ({ visit: v, days: daysUntil(v.validUntil) }))
      .filter((x) => x.days !== null && x.days <= 30)
      .sort((a, b) => (a.days ?? 0) - (b.days ?? 0));
  }, [visits]);

  async function saveDetails(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    setError("");
    try {
      const { id: _i, createdAt: _c, ...rest } = form as Dog;
      void _i;
      void _c;
      await updateDoc(doc(db, "dogs", id), { ...rest, updatedAt: serverTimestamp() });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Čuvanje nije uspelo.");
    }
  }

  if (missing) {
    return (
      <Card className="p-8 text-center text-sm text-ink-soft">
        Karton nije pronađen.{" "}
        <Link href="/portal/admin/psi" className="text-blood hover:underline">
          Nazad na listu
        </Link>
      </Card>
    );
  }
  if (!dog) return <Spinner />;

  const set = (key: keyof Dog, value: unknown) =>
    setForm((f) => ({ ...f, [key]: value }));

  const age = ageFromBirthDate(dog.birthDate);
  const criteria = DONOR_CRITERIA[dog.species];
  const nextDays = daysUntil(dog.nextEligibleDate);
  const canDonate =
    dog.donorStatus === "active" &&
    (dog.nextEligibleDate === null || (nextDays !== null && nextDays <= 0));

  const warnings: string[] = [];
  if (dog.weightKg !== null && dog.weightKg < criteria.minWeightKg) {
    warnings.push(
      `Težina ${dog.weightKg} kg je ispod minimuma (${criteria.minWeightKg} kg).`,
    );
  }
  if (age !== null && age > criteria.maxAgeYears) {
    warnings.push(`Starost ${age} god. prelazi gornju granicu (${criteria.maxAgeYears}).`);
  }
  if (age !== null && age < criteria.minAgeYears) {
    warnings.push(`Starost ${age} god. je ispod donje granice (${criteria.minAgeYears}).`);
  }

  const bloodOptions =
    dog.species === "dog" ? ["unknown", "DEA1+", "DEA1-"] : ["unknown", "A", "B", "AB"];

  return (
    <>
      <Link
        href="/portal/admin/psi"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-mute hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Svi kartoni
      </Link>

      <PageHeader
        title={dog.name}
        subtitle={`${SPECIES_LABEL[dog.species]} · ${dog.breed || "rasa nepoznata"}${
          age !== null ? ` · ${age} god.` : ""
        }`}
        action={
          <div className="flex items-center gap-2">
            <Badge tone={dog.bloodType === "unknown" ? "neutral" : "blood"}>
              {BLOOD_TYPE_LABEL[dog.bloodType] ?? dog.bloodType}
            </Badge>
            <DonorStatusBadge status={dog.donorStatus} />
          </div>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Card className="px-5 py-4">
          <p className="text-sm text-ink-mute">Donacija</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{dog.donationCount ?? 0}</p>
          <p className="mt-1 text-xs text-ink-mute">
            poslednja: {formatDate(dog.lastDonationDate)}
          </p>
        </Card>
        <Card className={cx("px-5 py-4", canDonate && "border-ok/40 bg-ok-soft")}>
          <p className="text-sm text-ink-mute">Sledeća moguća donacija</p>
          <p className={cx("mt-1 text-lg font-semibold", canDonate && "text-ok")}>
            {dog.donorStatus !== "active"
              ? "Nije aktivan donor"
              : canDonate
                ? "Može odmah"
                : `${formatDate(dog.nextEligibleDate)} (za ${nextDays} d)`}
          </p>
          <p className="mt-1 text-xs text-ink-mute">
            pravilo: {DONATION_INTERVAL_DAYS} dana između donacija
          </p>
        </Card>
        <Card className="px-5 py-4">
          <p className="text-sm text-ink-mute">Analize koje ističu</p>
          {expiringLabs.length === 0 ? (
            <p className="mt-1 text-lg font-semibold text-ink">Nema u narednih 30 dana</p>
          ) : (
            <ul className="mt-1 space-y-1">
              {expiringLabs.slice(0, 3).map(({ visit, days }) => (
                <li key={visit.id} className="text-sm">
                  <span className="font-medium text-ink">{visit.title}</span>{" "}
                  <span className={cx("text-xs", (days ?? 0) < 0 ? "text-blood" : "text-warn")}>
                    {(days ?? 0) < 0 ? "istekla" : `još ${days} d`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {warnings.length > 0 && (
        <div className="mb-4 rounded-card border border-warn/30 bg-warn-soft px-5 py-4 text-sm text-warn">
          <p className="mb-1 font-medium">Odstupanje od kriterijuma</p>
          <ul className="list-inside list-disc space-y-0.5">
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Istorija"
            subtitle={`${visits.length} zapisa`}
            action={
              <Button size="sm" onClick={() => setAddingVisit(true)}>
                <Plus className="h-4 w-4" />
                Novi zapis
              </Button>
            }
          />
          {visits.length === 0 ? (
            <EmptyState
              icon={<CalendarClock className="h-8 w-8" />}
              title="Još nema zapisa"
              description="Upišite pregled, analize ili donaciju."
            />
          ) : (
            <ul className="divide-y divide-line">
              {visits.map((v) => {
                const Icon = VISIT_ICON[v.type];
                return (
                  <li key={v.id} className="flex gap-3 px-5 py-4">
                    <span
                      className={cx(
                        "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full",
                        v.type === "donation"
                          ? "bg-blood-soft text-blood"
                          : "bg-navy-soft text-navy",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-ink">{v.title}</span>
                        <Badge tone={v.type === "donation" ? "blood" : "neutral"}>
                          {VISIT_TYPE_LABEL[v.type]}
                        </Badge>
                        {v.volumeMl ? <Badge tone="info">{v.volumeMl} ml</Badge> : null}
                      </span>
                      <span className="mt-0.5 block text-xs text-ink-mute">
                        {formatDate(v.date)}
                        {v.validUntil ? ` · važi do ${formatDate(v.validUntil)}` : ""}
                        {v.createdByName ? ` · ${v.createdByName}` : ""}
                      </span>
                      {v.note && (
                        <span className="mt-1 block text-sm text-ink-soft">{v.note}</span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Podaci kartona" />
          <form onSubmit={saveDetails} className="space-y-4 px-5 py-4">
            <Field label="Ime">
              <input
                className={inputClass}
                value={form.name ?? ""}
                onChange={(e) => set("name", e.target.value)}
              />
            </Field>
            <Field label="Rasa">
              <input
                className={inputClass}
                value={form.breed ?? ""}
                onChange={(e) => set("breed", e.target.value)}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Datum rođenja">
                <input
                  type="date"
                  className={inputClass}
                  value={form.birthDate ?? ""}
                  onChange={(e) => set("birthDate", e.target.value || null)}
                />
              </Field>
              <Field label="Težina (kg)">
                <input
                  type="number"
                  step="0.1"
                  className={inputClass}
                  value={form.weightKg ?? ""}
                  onChange={(e) =>
                    set("weightKg", e.target.value ? Number(e.target.value) : null)
                  }
                />
              </Field>
            </div>
            <Field label="Mikročip">
              <input
                className={inputClass}
                value={form.microchip ?? ""}
                onChange={(e) => set("microchip", e.target.value)}
              />
            </Field>
            <Field label="Krvna grupa">
              <select
                className={inputClass}
                value={form.bloodType ?? "unknown"}
                onChange={(e) => set("bloodType", e.target.value)}
              >
                {bloodOptions.map((b) => (
                  <option key={b} value={b}>
                    {BLOOD_TYPE_LABEL[b]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Status donora">
              <select
                className={inputClass}
                value={form.donorStatus ?? "candidate"}
                onChange={(e) => set("donorStatus", e.target.value as DonorStatus)}
              >
                {Object.entries(DONOR_STATUS_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            {(form.donorStatus === "paused" || form.donorStatus === "retired") && (
              <Field label="Razlog isključenja" required>
                <input
                  className={inputClass}
                  value={form.statusReason ?? ""}
                  onChange={(e) => set("statusReason", e.target.value)}
                />
              </Field>
            )}

            <div className="border-t border-line pt-4">
              <Field label="Vlasnik">
                <input
                  className={inputClass}
                  value={form.ownerName ?? ""}
                  onChange={(e) => set("ownerName", e.target.value)}
                />
              </Field>
            </div>
            <Field label="Telefon">
              <input
                className={inputClass}
                value={form.ownerPhone ?? ""}
                onChange={(e) => set("ownerPhone", e.target.value)}
              />
            </Field>
            <Field label="Email">
              <input
                className={inputClass}
                value={form.ownerEmail ?? ""}
                onChange={(e) => set("ownerEmail", e.target.value)}
              />
            </Field>
            <Field label="Napomena">
              <textarea
                rows={2}
                className={inputClass}
                value={form.note ?? ""}
                onChange={(e) => set("note", e.target.value)}
              />
            </Field>

            <ErrorNote>{error}</ErrorNote>
            {saved && <SuccessNote>Karton je sačuvan.</SuccessNote>}
            <Button type="submit" className="w-full">
              Sačuvaj karton
            </Button>
          </form>
        </Card>
      </div>

      {addingVisit && (
        <VisitModal onClose={() => setAddingVisit(false)} dogId={dog.id} />
      )}
    </>
  );
}

function VisitModal({
  onClose,
  dogId,
}: {
  onClose: () => void;
  dogId: string;
}) {
  const { profile } = useAuth();
  const [type, setType] = useState<VisitType>("donation");
  const [date, setDate] = useState(toISODate());
  const [title, setTitle] = useState("");
  const [volumeMl, setVolumeMl] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await addDoc(collection(db, "dogs", dogId, "visits"), {
        dogId,
        type,
        date,
        title: title.trim() || VISIT_TYPE_LABEL[type],
        volumeMl: type === "donation" && volumeMl ? Number(volumeMl) : null,
        validUntil: type === "labs" && validUntil ? validUntil : null,
        note: note.trim(),
        createdByUid: profile?.uid ?? "",
        createdByName: profile?.name ?? "",
        createdAt: serverTimestamp(),
      });

      // Donacija pomera brojač i datum sledeće moguće donacije.
      if (type === "donation") {
        await updateDoc(doc(db, "dogs", dogId), {
          lastDonationDate: date,
          nextEligibleDate: addDays(date, DONATION_INTERVAL_DAYS),
          donationCount: increment(1),
          updatedAt: serverTimestamp(),
        });
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upis nije uspeo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Novi zapis u kartonu">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Tip zapisa">
          <select
            className={inputClass}
            value={type}
            onChange={(e) => setType(e.target.value as VisitType)}
          >
            {Object.entries(VISIT_TYPE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Datum" required>
          <input
            type="date"
            className={inputClass}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </Field>

        <Field
          label="Naziv"
          hint={
            type === "labs"
              ? "npr. Kompletna krvna slika, Test na dirofilariozu"
              : "Kratak opis zapisa"
          }
        >
          <input
            className={inputClass}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={VISIT_TYPE_LABEL[type]}
          />
        </Field>

        {type === "donation" && (
          <Field label="Prikupljena količina (ml)">
            <input
              type="number"
              min={0}
              className={inputClass}
              value={volumeMl}
              onChange={(e) => setVolumeMl(e.target.value)}
            />
          </Field>
        )}

        {type === "labs" && (
          <Field label="Analiza važi do" hint="Podsetnik se pali 30 dana pre isteka.">
            <input
              type="date"
              className={inputClass}
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
            />
          </Field>
        )}

        <Field label="Napomena">
          <textarea
            rows={3}
            className={inputClass}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </Field>

        {type === "donation" && (
          <p className="rounded-lg bg-navy-soft px-3 py-2 text-xs text-navy">
            Upisom donacije sistem automatski postavlja sledeću moguću donaciju na{" "}
            {formatDate(addDays(date, DONATION_INTERVAL_DAYS))}.
          </p>
        )}

        <ErrorNote>{error}</ErrorNote>

        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Odustani
          </Button>
          <Button type="submit" loading={busy}>
            Upiši
          </Button>
        </div>
      </form>
    </Modal>
  );
}
