"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button, Card, ErrorNote, Field, inputClass } from "@/components/ui/kit";
import { EMERGENCY_PHONE } from "@/lib/constants";

const EMPTY = {
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
  website: "", // honeypot
};

export default function ClinicRegistrationPage() {
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const set = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/clinics/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Slanje nije uspelo.");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Slanje nije uspelo.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <main className="mx-auto max-w-lg px-6 py-20 text-center">
        <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-ok" />
        <h1 className="text-xl font-semibold text-ink">Zahtev je primljen</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Proverićemo podatke i otvoriti nalog za vašu kliniku. Pristupne podatke
          šaljemo na {form.email}.
        </p>
        <p className="mt-4 text-sm text-ink-mute">
          Do tada, za hitne slučajeve zovite {EMERGENCY_PHONE}.
        </p>
        <Link href="/" className="mt-8 inline-block text-sm text-blood hover:underline">
          Nazad na početnu
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Link
        href="/portal/login"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-ink-mute hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Nazad na prijavu
      </Link>

      <h1 className="text-2xl font-semibold text-ink">Zahtev za pristup portalu</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Portal je namenjen registrovanim veterinarskim ordinacijama i klinikama.
        Nakon provere podataka otvaramo nalog i šaljemo pristupne podatke.
      </p>

      <Card className="mt-6 p-6">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Naziv klinike" required>
              <input
                required
                className={inputClass}
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </Field>
            <Field label="Email klinike" required>
              <input
                type="email"
                required
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
            <Field label="Kontakt osoba" required>
              <input
                required
                className={inputClass}
                value={form.contactPerson}
                onChange={(e) => set("contactPerson", e.target.value)}
              />
            </Field>
            <Field label="Telefon" required>
              <input
                required
                className={inputClass}
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
              />
            </Field>
          </div>

          <Field
            label="Adresa isporuke"
            hint="Ostavite prazno ako je ista kao adresa klinike."
          >
            <input
              className={inputClass}
              value={form.deliveryAddress}
              onChange={(e) => set("deliveryAddress", e.target.value)}
            />
          </Field>

          <Field label="Napomena">
            <textarea
              rows={3}
              className={inputClass}
              value={form.note}
              onChange={(e) => set("note", e.target.value)}
              placeholder="Okvirne potrebe, radno vreme, ko preuzima pošiljke…"
            />
          </Field>

          {/* Honeypot — sakriveno od ljudi. */}
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden
            className="hidden"
            value={form.website}
            onChange={(e) => set("website", e.target.value)}
          />

          <ErrorNote>{error}</ErrorNote>

          <Button type="submit" loading={busy} className="w-full">
            Pošalji zahtev
          </Button>
        </form>
      </Card>
    </main>
  );
}
