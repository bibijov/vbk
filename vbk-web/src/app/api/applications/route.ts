import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { AuthError, errorResponse } from "@/lib/auth-server";
import { SCREENING_QUESTIONS } from "@/lib/constants";
import type { Species } from "@/types";

export const runtime = "nodejs";

interface Body {
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  city: string;
  dogName: string;
  species: Species;
  breed: string;
  ageYears: number | null;
  weightKg: number | null;
  answers: Record<string, boolean>;
  note?: string;
  /** Honeypot — botovi ga popune, ljudi ga ne vide. */
  website?: string;
}

/**
 * Prijava vlasnika psa/mačke sa javnog sajta. Piše se Admin SDK-om, pa klijent
 * nema nikakav pristup kolekciji `applications` (vidi firestore.rules).
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    if (body.website) return NextResponse.json({ ok: true }); // tiho odbaci bota

    const ownerName = body.ownerName?.trim();
    const ownerPhone = body.ownerPhone?.trim();
    const dogName = body.dogName?.trim();
    if (!ownerName || !ownerPhone || !dogName) {
      throw new AuthError("Ime vlasnika, telefon i ime ljubimca su obavezni.", 400);
    }

    const species: Species = body.species === "cat" ? "cat" : "dog";

    // Prihvatamo samo poznate ključeve pitanja.
    const answers: Record<string, boolean> = {};
    for (const q of SCREENING_QUESTIONS) {
      if (typeof body.answers?.[q.id] === "boolean") answers[q.id] = body.answers[q.id];
    }

    const ref = await adminDb()
      .collection("applications")
      .add({
        ownerName,
        ownerPhone,
        ownerEmail: body.ownerEmail?.trim() ?? "",
        city: body.city?.trim() ?? "",
        dogName,
        species,
        breed: body.breed?.trim() ?? "",
        ageYears: Number.isFinite(body.ageYears) ? body.ageYears : null,
        weightKg: Number.isFinite(body.weightKg) ? body.weightKg : null,
        answers,
        note: body.note?.trim() ?? "",
        status: "new",
        dogId: null,
        adminNote: "",
        createdAt: FieldValue.serverTimestamp(),
      });

    return NextResponse.json({ ok: true, id: ref.id });
  } catch (err) {
    return errorResponse(err);
  }
}
