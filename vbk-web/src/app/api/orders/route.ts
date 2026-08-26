import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { AuthError, errorResponse, requireClinic } from "@/lib/auth-server";
import type { DeliveryMethod, OrderItem, Product } from "@/types";

export const runtime = "nodejs";

interface Body {
  items: { productId: string; quantity: number }[];
  note?: string;
  urgent?: boolean;
  deliveryMethod?: DeliveryMethod;
  deliveryAddress?: string;
}

/**
 * Kreiranje porudžbine. Sve ide kroz jednu transakciju da dve klinike ne bi
 * rezervisale istu kesu: proveri zalihe -> umanji ih -> uzmi broj -> upiši order.
 */
export async function POST(req: Request) {
  try {
    const caller = await requireClinic(req);
    const body = (await req.json()) as Body;

    const requested = (body.items ?? []).filter(
      (i) => i?.productId && Number.isFinite(i.quantity) && i.quantity > 0,
    );
    if (requested.length === 0) {
      throw new AuthError("Korpa je prazna.", 400);
    }

    const db = adminDb();
    const clinicSnap = await db.collection("clinics").doc(caller.clinicId!).get();
    if (!clinicSnap.exists) throw new AuthError("Klinika nije pronađena.", 404);

    const clinic = clinicSnap.data()!;
    if (clinic.status !== "active") {
      throw new AuthError(
        "Nalog klinike još nije aktiviran za poručivanje. Javite se timu VBK.",
        403,
      );
    }

    const deliveryMethod: DeliveryMethod =
      body.deliveryMethod === "pickup" ? "pickup" : "delivery";

    const result = await db.runTransaction(async (tx) => {
      const productRefs = requested.map((i) => db.collection("products").doc(i.productId));
      const productSnaps = await tx.getAll(...productRefs);

      const items: OrderItem[] = [];
      for (let i = 0; i < requested.length; i += 1) {
        const snap = productSnaps[i];
        const line = requested[i];
        if (!snap.exists) throw new AuthError("Proizvod više ne postoji.", 400);

        const product = snap.data() as Product;
        if (!product.active) {
          throw new AuthError(`Proizvod „${product.name}" trenutno nije dostupan.`, 400);
        }
        if ((product.stock ?? 0) < line.quantity) {
          throw new AuthError(
            `Nema dovoljno zaliha: „${product.name}" (na stanju ${product.stock ?? 0}).`,
            409,
          );
        }

        items.push({
          productId: snap.id,
          sku: product.sku,
          name: product.name,
          species: product.species,
          unit: product.unit,
          unitPrice: product.price ?? 0,
          quantity: line.quantity,
          lineTotal: (product.price ?? 0) * line.quantity,
        });
      }

      // Redni broj po godini: counters/orders_<godina>.
      const year = new Date().getFullYear();
      const counterRef = db.collection("counters").doc(`orders_${year}`);
      const counterSnap = await tx.get(counterRef);
      const seq = ((counterSnap.data()?.seq as number | undefined) ?? 0) + 1;
      const orderNumber = `VBK-${year}-${String(seq).padStart(4, "0")}`;

      for (let i = 0; i < requested.length; i += 1) {
        tx.update(productRefs[i], {
          stock: FieldValue.increment(-requested[i].quantity),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
      tx.set(counterRef, { seq, year }, { merge: true });

      const orderRef = db.collection("orders").doc();
      tx.set(orderRef, {
        orderNumber,
        clinicId: caller.clinicId,
        clinicName: clinic.name ?? "",
        createdByUid: caller.uid,
        createdByName: caller.name,
        items,
        total: items.reduce((sum, it) => sum + it.lineTotal, 0),
        status: "new",
        urgent: Boolean(body.urgent),
        deliveryMethod,
        deliveryAddress:
          deliveryMethod === "pickup"
            ? ""
            : (body.deliveryAddress?.trim() ||
              clinic.deliveryAddress ||
              clinic.address ||
              ""),
        note: body.note?.trim() ?? "",
        adminNote: "",
        seenByAdmin: false,
        history: [
          {
            status: "new",
            at: new Date().toISOString(),
            byUid: caller.uid,
            byName: caller.name,
          },
        ],
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      return { id: orderRef.id, orderNumber, total: items.reduce((s, i) => s + i.lineTotal, 0) };
    });

    // TODO(Faza 2): Cloud Function na orders/onCreate šalje email (Resend) + FCM push.
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return errorResponse(err);
  }
}
