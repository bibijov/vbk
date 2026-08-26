import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { AuthError, errorResponse } from "@/lib/auth-server";

export const runtime = "nodejs";

interface Body {
  name: string;
  pib: string;
  mb?: string;
  address: string;
  city: string;
  postalCode?: string;
  deliveryAddress?: string;
  contactPerson: string;
  phone: string;
  emergencyPhone?: string;
  email: string;
  note?: string;
  website?: string; // honeypot
}

/**
 * Zahtev klinike za pristup portalu. Klinika se upisuje sa statusom `pending`;
 * admin je verifikuje i tek onda joj otvara korisnički nalog.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    if (body.website) return NextResponse.json({ ok: true });

    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const phone = body.phone?.trim();
    const contactPerson = body.contactPerson?.trim();
    if (!name || !email || !phone || !contactPerson) {
      throw new AuthError(
        "Naziv klinike, kontakt osoba, telefon i email su obavezni.",
        400,
      );
    }

    const db = adminDb();
    const existing = await db
      .collection("clinics")
      .where("email", "==", email)
      .limit(1)
      .get();
    if (!existing.empty) {
      throw new AuthError(
        "Zahtev sa tom email adresom već postoji. Javićemo vam se uskoro.",
        409,
      );
    }

    const ref = await db.collection("clinics").add({
      name,
      pib: body.pib?.trim() ?? "",
      mb: body.mb?.trim() ?? "",
      address: body.address?.trim() ?? "",
      city: body.city?.trim() ?? "",
      postalCode: body.postalCode?.trim() ?? "",
      deliveryAddress: body.deliveryAddress?.trim() ?? "",
      contactPerson,
      phone,
      emergencyPhone: body.emergencyPhone?.trim() ?? "",
      email,
      status: "pending",
      note: body.note?.trim() ?? "",
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true, id: ref.id });
  } catch (err) {
    return errorResponse(err);
  }
}
