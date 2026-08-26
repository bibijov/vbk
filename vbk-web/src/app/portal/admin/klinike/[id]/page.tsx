"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { ArrowLeft, KeyRound, UserPlus } from "lucide-react";
import { db } from "@/lib/firebase";
import { authedFetch } from "@/lib/api";
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
import { ClinicStatusBadge, OrderStatusBadge } from "@/components/ui/status";
import { formatDate, formatRsd } from "@/lib/format";
import {
  CLINIC_STATUS_LABEL,
  type AppUser,
  type Clinic,
  type ClinicStatus,
  type Order,
} from "@/types";

const STATUS_ORDER: ClinicStatus[] = ["pending", "verified", "active", "suspended"];

export default function AdminClinicDetail() {
  const { id } = useParams<{ id: string }>();
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [missing, setMissing] = useState(false);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [creatingUser, setCreatingUser] = useState(false);
  const [form, setForm] = useState<Partial<Clinic>>({});
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    return onSnapshot(
      doc(db, "clinics", id),
      (snap) => {
        if (!snap.exists()) {
          setMissing(true);
          return;
        }
        const data = { id: snap.id, ...snap.data() } as Clinic;
        setClinic(data);
        setForm((prev) => (Object.keys(prev).length ? prev : data));
      },
      () => setMissing(true),
    );
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const unsubs = [
      onSnapshot(query(collection(db, "users"), where("clinicId", "==", id)), (snap) =>
        setUsers(snap.docs.map((d) => ({ uid: d.id, ...d.data() }) as AppUser)),
      ),
      onSnapshot(
        query(
          collection(db, "orders"),
          where("clinicId", "==", id),
          orderBy("createdAt", "desc"),
        ),
        (snap) => setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order)),
        () => setOrders([]),
      ),
    ];
    return () => unsubs.forEach((u) => u());
  }, [id]);

  async function setStatus(status: ClinicStatus) {
    if (!id) return;
    await updateDoc(doc(db, "clinics", id), { status, updatedAt: serverTimestamp() });
  }

  async function saveDetails(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    setError("");
    try {
      const { id: _ignored, createdAt: _c, ...rest } = form as Clinic;
      void _ignored;
      void _c;
      await updateDoc(doc(db, "clinics", id), { ...rest, updatedAt: serverTimestamp() });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Čuvanje nije uspelo.");
    }
  }

  if (missing) {
    return (
      <Card className="p-8 text-center text-sm text-ink-soft">
        Klinika nije pronađena.{" "}
        <Link href="/portal/admin/klinike" className="text-blood hover:underline">
          Nazad na listu
        </Link>
      </Card>
    );
  }
  if (!clinic) return <Spinner />;

  const set = (key: keyof Clinic, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <>
      <Link
        href="/portal/admin/klinike"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-mute hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Sve klinike
      </Link>

      <PageHeader
        title={clinic.name}
        subtitle={`Zahtev primljen ${formatDate(clinic.createdAt)}`}
        action={<ClinicStatusBadge status={clinic.status} />}
      />

      <Card className="mb-4 p-4">
        <p className="mb-3 text-sm font-medium text-ink">Status pristupa</p>
        <div className="flex flex-wrap gap-2">
          {STATUS_ORDER.map((status) => (
            <Button
              key={status}
              size="sm"
              variant={clinic.status === status ? "primary" : "secondary"}
              onClick={() => setStatus(status)}
              disabled={clinic.status === status}
            >
              {CLINIC_STATUS_LABEL[status]}
            </Button>
          ))}
        </div>
        <p className="mt-3 text-xs text-ink-mute">
          Poručivanje je moguće samo u statusu „Aktivna”. Nalog za prijavu se otvara
          posebno, u sekciji ispod.
        </p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Podaci klinike" />
          <form onSubmit={saveDetails} className="space-y-4 px-5 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Naziv">
                <input
                  className={inputClass}
                  value={form.name ?? ""}
                  onChange={(e) => set("name", e.target.value)}
                />
              </Field>
              <Field label="Email">
                <input
                  className={inputClass}
                  value={form.email ?? ""}
                  onChange={(e) => set("email", e.target.value)}
                />
              </Field>
              <Field label="PIB">
                <input
                  className={inputClass}
                  value={form.pib ?? ""}
                  onChange={(e) => set("pib", e.target.value)}
                />
              </Field>
              <Field label="Matični broj">
                <input
                  className={inputClass}
                  value={form.mb ?? ""}
                  onChange={(e) => set("mb", e.target.value)}
                />
              </Field>
              <Field label="Adresa">
                <input
                  className={inputClass}
                  value={form.address ?? ""}
                  onChange={(e) => set("address", e.target.value)}
                />
              </Field>
              <Field label="Grad">
                <input
                  className={inputClass}
                  value={form.city ?? ""}
                  onChange={(e) => set("city", e.target.value)}
                />
              </Field>
              <Field label="Kontakt osoba">
                <input
                  className={inputClass}
                  value={form.contactPerson ?? ""}
                  onChange={(e) => set("contactPerson", e.target.value)}
                />
              </Field>
              <Field label="Telefon">
                <input
                  className={inputClass}
                  value={form.phone ?? ""}
                  onChange={(e) => set("phone", e.target.value)}
                />
              </Field>
            </div>

            <Field label="Adresa isporuke">
              <input
                className={inputClass}
                value={form.deliveryAddress ?? ""}
                onChange={(e) => set("deliveryAddress", e.target.value)}
              />
            </Field>

            <Field label="Interna napomena">
              <textarea
                rows={2}
                className={inputClass}
                value={form.note ?? ""}
                onChange={(e) => set("note", e.target.value)}
              />
            </Field>

            <ErrorNote>{error}</ErrorNote>
            {saved && <SuccessNote>Podaci su sačuvani.</SuccessNote>}

            <Button type="submit">Sačuvaj izmene</Button>
          </form>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader
              title="Nalozi za prijavu"
              action={
                <Button size="sm" variant="secondary" onClick={() => setCreatingUser(true)}>
                  <UserPlus className="h-4 w-4" />
                  Otvori nalog
                </Button>
              }
            />
            {users.length === 0 ? (
              <EmptyState
                icon={<KeyRound className="h-7 w-7" />}
                title="Klinika još nema nalog"
                description="Otvorite nalog i prosledite pristupne podatke kontakt osobi."
              />
            ) : (
              <ul className="divide-y divide-line">
                {users.map((u) => (
                  <li key={u.uid} className="px-5 py-3">
                    <span className="block text-sm font-medium text-ink">{u.name}</span>
                    <span className="block text-xs text-ink-mute">{u.email}</span>
                    {u.active === false && (
                      <Badge tone="neutral" className="mt-1">
                        Deaktiviran
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title="Porudžbine" subtitle={`Ukupno ${orders.length}`} />
            {orders.length === 0 ? (
              <EmptyState title="Još nema porudžbina" />
            ) : (
              <ul className="divide-y divide-line">
                {orders.slice(0, 10).map((o) => (
                  <li key={o.id}>
                    <Link
                      href={`/portal/admin/porudzbine/${o.id}`}
                      className="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-paper"
                    >
                      <span className="min-w-0">
                        <span className="block font-mono text-sm text-ink">
                          {o.orderNumber}
                        </span>
                        <span className="text-xs text-ink-mute">
                          {formatDate(o.createdAt)} · {formatRsd(o.total)}
                        </span>
                      </span>
                      <OrderStatusBadge status={o.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {creatingUser && (
        <NewUserModal
          onClose={() => setCreatingUser(false)}
          clinicId={clinic.id}
          defaultName={clinic.contactPerson ?? ""}
          defaultEmail={clinic.email ?? ""}
        />
      )}
    </>
  );
}

function NewUserModal({
  onClose,
  clinicId,
  defaultName,
  defaultEmail,
}: {
  onClose: () => void;
  clinicId: string;
  defaultName: string;
  defaultEmail: string;
}) {
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await authedFetch<{ generatedPassword: string | null }>(
        "/api/admin/users",
        {
          body: {
            email,
            name,
            role: "clinic",
            clinicId,
            password: password.trim() || undefined,
          },
        },
      );
      setCreated(res.generatedPassword ?? password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Otvaranje naloga nije uspelo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Nalog za kliniku">
      {created ? (
        <div className="space-y-4">
          <SuccessNote>Nalog je otvoren.</SuccessNote>
          <div className="rounded-lg border border-line bg-paper p-4 text-sm">
            <p className="text-ink-mute">Email</p>
            <p className="mb-3 font-mono text-ink">{email}</p>
            <p className="text-ink-mute">Lozinka</p>
            <p className="font-mono text-ink">{created}</p>
          </div>
          <p className="text-xs text-ink-mute">
            Prosledite podatke klinici. Lozinku više nećete videti — korisnik je menja
            preko „Zaboravili ste lozinku?”.
          </p>
          <div className="flex justify-end">
            <Button onClick={onClose}>U redu</Button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Field label="Ime i prezime" required>
            <input
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field label="Email" required>
            <input
              type="email"
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field label="Lozinka" hint="Ostavite prazno da je sistem generiše.">
            <input
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <ErrorNote>{error}</ErrorNote>
          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Odustani
            </Button>
            <Button type="submit" loading={busy}>
              Otvori nalog
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
