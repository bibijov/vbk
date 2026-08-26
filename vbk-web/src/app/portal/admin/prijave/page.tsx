"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { CheckCircle2, ClipboardList, Mail, Phone, XCircle } from "lucide-react";
import { db } from "@/lib/firebase";
import { PageHeader } from "@/components/portal/PortalShell";
import { Badge, Button, Card, EmptyState, Spinner } from "@/components/ui/kit";
import { ApplicationStatusBadge } from "@/components/ui/status";
import { cx, formatDateTime } from "@/lib/format";
import { DONOR_CRITERIA, SCREENING_QUESTIONS } from "@/lib/constants";
import {
  APPLICATION_STATUS_LABEL,
  SPECIES_LABEL,
  type Application,
  type ApplicationStatus,
} from "@/types";

const FILTERS: { value: ApplicationStatus | "all"; label: string }[] = [
  { value: "new", label: APPLICATION_STATUS_LABEL.new },
  { value: "contacted", label: APPLICATION_STATUS_LABEL.contacted },
  { value: "approved", label: APPLICATION_STATUS_LABEL.approved },
  { value: "rejected", label: APPLICATION_STATUS_LABEL.rejected },
  { value: "all", label: "Sve" },
];

export default function AdminApplicationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Application[] | null>(null);
  const [filter, setFilter] = useState<ApplicationStatus | "all">("new");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    return onSnapshot(
      query(collection(db, "applications"), orderBy("createdAt", "desc")),
      (snap) =>
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Application)),
      () => setItems([]),
    );
  }, []);

  const visible = useMemo(
    () => (items ?? []).filter((a) => filter === "all" || a.status === filter),
    [items, filter],
  );

  async function setStatus(app: Application, status: ApplicationStatus) {
    await updateDoc(doc(db, "applications", app.id), {
      status,
      updatedAt: serverTimestamp(),
    });
  }

  /** Prijava -> karton donora, sa statusom „kandidat". */
  async function convertToDog(app: Application) {
    setBusy(app.id);
    try {
      const created = await addDoc(collection(db, "dogs"), {
        name: app.dogName,
        species: app.species,
        breed: app.breed ?? "",
        birthDate: null,
        weightKg: app.weightKg ?? null,
        microchip: "",
        sex: null,
        bloodType: "unknown",
        donorStatus: "candidate",
        ownerName: app.ownerName,
        ownerPhone: app.ownerPhone,
        ownerEmail: app.ownerEmail ?? "",
        ownerCity: app.city ?? "",
        lastDonationDate: null,
        nextEligibleDate: null,
        donationCount: 0,
        note: app.note ?? "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await updateDoc(doc(db, "applications", app.id), {
        status: "approved",
        dogId: created.id,
        updatedAt: serverTimestamp(),
      });
      router.push(`/portal/admin/psi/${created.id}`);
    } finally {
      setBusy(null);
    }
  }

  if (items === null) return <Spinner />;

  return (
    <>
      <PageHeader
        title="Prijave donora"
        subtitle="Upitnik sa javnog sajta. Prihvaćena prijava postaje karton donora."
      />

      <div className="mb-4 flex flex-wrap gap-2">
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
                ? items.length
                : items.filter((a) => a.status === f.value).length}
            </span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <Card>
          <EmptyState
            icon={<ClipboardList className="h-8 w-8" />}
            title="Nema prijava u ovom filteru"
            description="Prijave stižu sa stranice /vlasnici/prijava kada javni sajt bude uživo."
          />
        </Card>
      ) : (
        <div className="grid gap-3">
          {visible.map((app) => {
            const flags = SCREENING_QUESTIONS.filter(
              (q) => app.answers?.[q.id] === q.disqualifyingAnswer,
            );
            const criteria = DONOR_CRITERIA[app.species];
            const tooLight =
              app.weightKg !== null && app.weightKg < criteria.minWeightKg;

            return (
              <Card key={app.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-ink">{app.dogName}</h3>
                      <Badge>{SPECIES_LABEL[app.species]}</Badge>
                      <ApplicationStatusBadge status={app.status} />
                    </div>
                    <p className="mt-1 text-sm text-ink-soft">
                      {[
                        app.breed,
                        app.ageYears !== null ? `${app.ageYears} god.` : null,
                        app.weightKg !== null ? `${app.weightKg} kg` : null,
                        app.city,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                      <span className="font-medium text-ink">{app.ownerName}</span>
                      <a
                        href={`tel:${app.ownerPhone}`}
                        className="inline-flex items-center gap-1 text-ink-soft hover:text-blood"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        {app.ownerPhone}
                      </a>
                      {app.ownerEmail && (
                        <a
                          href={`mailto:${app.ownerEmail}`}
                          className="inline-flex items-center gap-1 text-ink-soft hover:text-blood"
                        >
                          <Mail className="h-3.5 w-3.5" />
                          {app.ownerEmail}
                        </a>
                      )}
                    </p>
                  </div>
                  <span className="text-xs text-ink-mute">
                    {formatDateTime(app.createdAt)}
                  </span>
                </div>

                {(flags.length > 0 || tooLight) && (
                  <div className="mt-3 rounded-lg border border-warn/30 bg-warn-soft px-4 py-3 text-sm text-warn">
                    <p className="mb-1 font-medium">Zahteva proveru</p>
                    <ul className="list-inside list-disc space-y-0.5">
                      {tooLight && (
                        <li>
                          Težina {app.weightKg} kg je ispod minimuma (
                          {criteria.minWeightKg} kg).
                        </li>
                      )}
                      {flags.map((q) => (
                        <li key={q.id}>{q.label}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {app.note && (
                  <p className="mt-3 text-sm text-ink-soft">
                    <span className="text-ink-mute">Napomena vlasnika: </span>
                    {app.note}
                  </p>
                )}

                <details className="mt-3">
                  <summary className="cursor-pointer text-sm text-ink-mute hover:text-ink">
                    Svi odgovori iz upitnika
                  </summary>
                  <ul className="mt-2 space-y-1 text-sm">
                    {SCREENING_QUESTIONS.map((q) => {
                      const answer = app.answers?.[q.id];
                      return (
                        <li key={q.id} className="flex items-start gap-2">
                          <span
                            className={cx(
                              "mt-0.5 shrink-0",
                              answer === q.disqualifyingAnswer
                                ? "text-warn"
                                : "text-ink-mute",
                            )}
                          >
                            {answer === true ? "DA" : answer === false ? "NE" : "—"}
                          </span>
                          <span className="text-ink-soft">{q.label}</span>
                        </li>
                      );
                    })}
                  </ul>
                </details>

                <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
                  {app.status !== "approved" && (
                    <Button
                      size="sm"
                      loading={busy === app.id}
                      onClick={() => convertToDog(app)}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Napravi karton donora
                    </Button>
                  )}
                  {app.status === "new" && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setStatus(app, "contacted")}
                    >
                      Označi kao kontaktiranog
                    </Button>
                  )}
                  {app.status !== "rejected" && app.status !== "approved" && (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => setStatus(app, "rejected")}
                    >
                      <XCircle className="h-4 w-4" />
                      Odbij
                    </Button>
                  )}
                  {app.dogId && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => router.push(`/portal/admin/psi/${app.dogId}`)}
                    >
                      Otvori karton
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
