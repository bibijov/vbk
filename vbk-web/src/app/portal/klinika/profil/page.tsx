"use client";

import { useEffect, useState, type FormEvent } from "react";
import { doc, onSnapshot, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/portal/PortalShell";
import {
  Button,
  Card,
  CardHeader,
  ErrorNote,
  Field,
  Spinner,
  SuccessNote,
  inputClass,
} from "@/components/ui/kit";
import { ClinicStatusBadge } from "@/components/ui/status";
import type { Clinic } from "@/types";

export default function ClinicProfilePage() {
  const { profile, resetPassword } = useAuth();
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [form, setForm] = useState({
    contactPerson: "",
    phone: "",
    emergencyPhone: "",
    deliveryAddress: "",
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [passwordNote, setPasswordNote] = useState("");

  useEffect(() => {
    if (!profile?.clinicId) return;
    return onSnapshot(doc(db, "clinics", profile.clinicId), (snap) => {
      if (!snap.exists()) return;
      const data = { id: snap.id, ...snap.data() } as Clinic;
      setClinic(data);
      setForm({
        contactPerson: data.contactPerson ?? "",
        phone: data.phone ?? "",
        emergencyPhone: data.emergencyPhone ?? "",
        deliveryAddress: data.deliveryAddress ?? "",
      });
    });
  }, [profile?.clinicId]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!profile?.clinicId) return;
    setBusy(true);
    setError("");
    try {
      await updateDoc(doc(db, "clinics", profile.clinicId), {
        ...form,
        updatedAt: serverTimestamp(),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError(
        "Izmena nije sačuvana. Podatke o firmi (naziv, PIB, adresa) menja tim VBK — javite nam se.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (!clinic) return <Spinner />;

  return (
    <>
      <PageHeader
        title="Podaci klinike"
        subtitle="Kontakt i adresu isporuke menjate sami; pravne podatke menja tim VBK."
        action={<ClinicStatusBadge status={clinic.status} />}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Kontakt i isporuka" />
          <form onSubmit={submit} className="space-y-4 px-5 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Kontakt osoba">
                <input
                  className={inputClass}
                  value={form.contactPerson}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, contactPerson: e.target.value }))
                  }
                />
              </Field>
              <Field label="Telefon">
                <input
                  className={inputClass}
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </Field>
              <Field label="Telefon za hitne slučajeve">
                <input
                  className={inputClass}
                  value={form.emergencyPhone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, emergencyPhone: e.target.value }))
                  }
                />
              </Field>
              <Field label="Adresa isporuke">
                <input
                  className={inputClass}
                  value={form.deliveryAddress}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, deliveryAddress: e.target.value }))
                  }
                />
              </Field>
            </div>

            <ErrorNote>{error}</ErrorNote>
            {saved && <SuccessNote>Podaci su sačuvani.</SuccessNote>}

            <Button type="submit" loading={busy}>
              Sačuvaj
            </Button>
          </form>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Pravni podaci" subtitle="Menja ih tim VBK" />
            <dl className="space-y-3 px-5 py-4 text-sm">
              {[
                ["Naziv", clinic.name],
                ["PIB", clinic.pib],
                ["Matični broj", clinic.mb],
                ["Adresa", clinic.address],
                ["Grad", clinic.city],
                ["Email", clinic.email],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-ink-mute">{label}</dt>
                  <dd className="text-ink">{value || "—"}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card>
            <CardHeader title="Vaš nalog" />
            <div className="space-y-3 px-5 py-4 text-sm">
              <div>
                <p className="text-xs text-ink-mute">Ime</p>
                <p className="text-ink">{profile?.name}</p>
              </div>
              <div>
                <p className="text-xs text-ink-mute">Email</p>
                <p className="text-ink">{profile?.email}</p>
              </div>
              {passwordNote && <SuccessNote>{passwordNote}</SuccessNote>}
              <Button
                variant="secondary"
                size="sm"
                onClick={async () => {
                  if (!profile?.email) return;
                  await resetPassword(profile.email);
                  setPasswordNote("Link za promenu lozinke je poslat na vaš email.");
                }}
              >
                Promeni lozinku
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
