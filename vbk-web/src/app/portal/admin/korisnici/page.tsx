"use client";

import { useEffect, useState, type FormEvent } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { Plus, ShieldCheck, Users } from "lucide-react";
import { db } from "@/lib/firebase";
import { authedFetch } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
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
  SuccessNote,
  inputClass,
} from "@/components/ui/kit";
import { formatDate } from "@/lib/format";
import type { AppUser, Clinic, Role } from "@/types";

export default function AdminUsersPage() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<AppUser[] | null>(null);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubs = [
      onSnapshot(
        query(collection(db, "users"), orderBy("createdAt", "desc")),
        (snap) => setUsers(snap.docs.map((d) => ({ uid: d.id, ...d.data() }) as AppUser)),
        () => setUsers([]),
      ),
      onSnapshot(collection(db, "clinics"), (snap) =>
        setClinics(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Clinic)),
      ),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  const clinicName = (id?: string | null) =>
    clinics.find((c) => c.id === id)?.name ?? "—";

  async function toggleActive(user: AppUser) {
    setError("");
    setBusy(user.uid);
    try {
      await authedFetch("/api/admin/users", {
        method: "PATCH",
        body: { uid: user.uid, active: !user.active },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Izmena nije uspela.");
    } finally {
      setBusy(null);
    }
  }

  if (users === null) return <Spinner />;

  return (
    <>
      <PageHeader
        title="Korisnici"
        subtitle="Nalozi tima VBK i klinika. Deaktiviran nalog ne može da se prijavi."
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" />
            Novi nalog
          </Button>
        }
      />

      {error && <div className="mb-4">{<ErrorNote>{error}</ErrorNote>}</div>}

      <Card>
        {users.length === 0 ? (
          <EmptyState icon={<Users className="h-8 w-8" />} title="Nema korisnika" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-ink-mute">
                  <th className="px-5 py-3 font-medium">Ime</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Uloga</th>
                  <th className="px-5 py-3 font-medium">Klinika</th>
                  <th className="px-5 py-3 font-medium">Otvoren</th>
                  <th className="px-5 py-3 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {users.map((u) => (
                  <tr key={u.uid} className="transition-colors hover:bg-paper">
                    <td className="px-5 py-3 font-medium text-ink">
                      {u.name}
                      {u.uid === profile?.uid && (
                        <span className="ml-2 text-xs text-ink-mute">(vi)</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-ink-soft">{u.email}</td>
                    <td className="px-5 py-3">
                      {u.role === "admin" ? (
                        <Badge tone="blood">
                          <ShieldCheck className="h-3 w-3" />
                          VBK tim
                        </Badge>
                      ) : (
                        <Badge>Klinika</Badge>
                      )}
                    </td>
                    <td className="px-5 py-3 text-ink-soft">
                      {u.role === "clinic" ? clinicName(u.clinicId) : "—"}
                    </td>
                    <td className="px-5 py-3 text-ink-mute">{formatDate(u.createdAt)}</td>
                    <td className="px-5 py-3 text-right">
                      <Button
                        size="sm"
                        variant={u.active ? "secondary" : "primary"}
                        loading={busy === u.uid}
                        disabled={u.uid === profile?.uid}
                        onClick={() => toggleActive(u)}
                      >
                        {u.active ? "Deaktiviraj" : "Aktiviraj"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {creating && (
        <NewUserModal onClose={() => setCreating(false)} clinics={clinics} />
      )}
    </>
  );
}

function NewUserModal({
  onClose,
  clinics,
}: {
  onClose: () => void;
  clinics: Clinic[];
}) {
  const [role, setRole] = useState<Role>("clinic");
  const [clinicId, setClinicId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);

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
            phone,
            role,
            clinicId: role === "clinic" ? clinicId : null,
            password: password.trim() || undefined,
          },
        },
      );
      setCreated({ email, password: res.generatedPassword ?? password });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Otvaranje naloga nije uspelo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Novi nalog">
      {created ? (
        <div className="space-y-4">
          <SuccessNote>Nalog je otvoren.</SuccessNote>
          <div className="rounded-lg border border-line bg-paper p-4 text-sm">
            <p className="text-ink-mute">Email</p>
            <p className="mb-3 font-mono text-ink">{created.email}</p>
            <p className="text-ink-mute">Lozinka</p>
            <p className="font-mono text-ink">{created.password}</p>
          </div>
          <div className="flex justify-end">
            <Button onClick={onClose}>U redu</Button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Field label="Uloga">
            <select
              className={inputClass}
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
            >
              <option value="clinic">Klinika</option>
              <option value="admin">VBK tim (admin)</option>
            </select>
          </Field>

          {role === "clinic" && (
            <Field label="Klinika" required>
              <select
                className={inputClass}
                value={clinicId}
                onChange={(e) => setClinicId(e.target.value)}
              >
                <option value="">— izaberite kliniku —</option>
                {clinics.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
          )}

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
          <Field label="Telefon">
            <input
              className={inputClass}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
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
