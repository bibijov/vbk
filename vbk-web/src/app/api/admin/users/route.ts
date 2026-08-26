import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { AuthError, errorResponse, requireAdmin } from "@/lib/auth-server";
import type { Role } from "@/types";

export const runtime = "nodejs";

interface CreateBody {
  email: string;
  name: string;
  phone?: string;
  role: Role;
  clinicId?: string | null;
  /** Ako se izostavi, generišemo privremenu lozinku i vratimo je adminu. */
  password?: string;
}

function randomPassword() {
  return `vbk-${Math.random().toString(36).slice(2, 8)}-${Math.random()
    .toString(36)
    .slice(2, 6)}`;
}

/** Otvaranje naloga za kliniku ili novog člana tima VBK. */
export async function POST(req: Request) {
  try {
    await requireAdmin(req);
    const body = (await req.json()) as CreateBody;

    const email = body.email?.trim().toLowerCase();
    const name = body.name?.trim();
    if (!email || !name) throw new AuthError("Email i ime su obavezni.", 400);
    if (body.role !== "admin" && body.role !== "clinic") {
      throw new AuthError("Nepoznata uloga.", 400);
    }
    if (body.role === "clinic" && !body.clinicId) {
      throw new AuthError("Za nalog klinike morate izabrati kliniku.", 400);
    }

    const password = body.password?.trim() || randomPassword();
    if (password.length < 6) {
      throw new AuthError("Lozinka mora imati bar 6 karaktera.", 400);
    }

    const auth = adminAuth();
    let uid: string;
    try {
      const created = await auth.createUser({ email, password, displayName: name });
      uid = created.uid;
    } catch (err) {
      if ((err as { code?: string }).code === "auth/email-already-exists") {
        throw new AuthError("Nalog sa tom email adresom već postoji.", 409);
      }
      throw err;
    }

    // Claims za Firestore pravila, ogledalo u `users` za UI.
    await auth.setCustomUserClaims(uid, {
      role: body.role,
      clinicId: body.role === "clinic" ? body.clinicId : null,
    });

    await adminDb()
      .collection("users")
      .doc(uid)
      .set({
        email,
        name,
        phone: body.phone?.trim() ?? "",
        role: body.role,
        clinicId: body.role === "clinic" ? body.clinicId : null,
        active: true,
        createdAt: FieldValue.serverTimestamp(),
      });

    return NextResponse.json({
      ok: true,
      uid,
      // Vraćamo lozinku samo ako smo je mi generisali — admin je prosleđuje klinici.
      generatedPassword: body.password ? null : password,
    });
  } catch (err) {
    return errorResponse(err);
  }
}

interface PatchBody {
  uid: string;
  active?: boolean;
  name?: string;
  phone?: string;
}

/** Aktiviranje/deaktiviranje naloga i sitne izmene podataka. */
export async function PATCH(req: Request) {
  try {
    const caller = await requireAdmin(req);
    const body = (await req.json()) as PatchBody;
    if (!body.uid) throw new AuthError("Nedostaje uid.", 400);
    if (body.uid === caller.uid && body.active === false) {
      throw new AuthError("Ne možete deaktivirati sopstveni nalog.", 400);
    }

    const updates: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
    if (typeof body.active === "boolean") updates.active = body.active;
    if (body.name?.trim()) updates.name = body.name.trim();
    if (typeof body.phone === "string") updates.phone = body.phone.trim();

    await adminDb().collection("users").doc(body.uid).update(updates);

    if (typeof body.active === "boolean") {
      await adminAuth().updateUser(body.uid, { disabled: !body.active });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
