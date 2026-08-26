import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import type { Role } from "@/types";

export interface Caller {
  uid: string;
  email: string;
  name: string;
  role: Role;
  clinicId: string | null;
}

export class AuthError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/**
 * Verifikuje `Authorization: Bearer <idToken>` i vraća pozivaoca.
 * Uloga se čita iz `users/{uid}` dokumenta, koji je izvor istine i za claims.
 */
export async function requireUser(req: Request): Promise<Caller> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) throw new AuthError("Niste prijavljeni.", 401);

  let decodedUid: string;
  try {
    const decoded = await adminAuth().verifyIdToken(token);
    decodedUid = decoded.uid;
  } catch {
    throw new AuthError("Sesija je istekla, prijavite se ponovo.", 401);
  }

  const snap = await adminDb().collection("users").doc(decodedUid).get();
  if (!snap.exists) throw new AuthError("Nalog nije pronađen.", 403);

  const data = snap.data()!;
  if (data.active === false) throw new AuthError("Nalog je deaktiviran.", 403);

  return {
    uid: decodedUid,
    email: data.email ?? "",
    name: data.name ?? data.email ?? "",
    role: data.role as Role,
    clinicId: data.clinicId ?? null,
  };
}

export async function requireAdmin(req: Request): Promise<Caller> {
  const caller = await requireUser(req);
  if (caller.role !== "admin") throw new AuthError("Nemate ovlašćenje.", 403);
  return caller;
}

export async function requireClinic(req: Request): Promise<Caller> {
  const caller = await requireUser(req);
  if (caller.role !== "clinic" || !caller.clinicId) {
    throw new AuthError("Nemate ovlašćenje.", 403);
  }
  return caller;
}

/** Pretvara grešku u JSON odgovor sa porukom na srpskom. */
export function errorResponse(err: unknown) {
  if (err instanceof AuthError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  const message = err instanceof Error ? err.message : "Neočekivana greška.";
  console.error("[api]", err);
  return NextResponse.json({ error: message }, { status: 400 });
}
