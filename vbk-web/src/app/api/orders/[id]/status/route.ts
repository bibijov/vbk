import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { AuthError, errorResponse, requireUser } from "@/lib/auth-server";
import { ORDER_STATUS_FLOW, type Order, type OrderStatus } from "@/types";

export const runtime = "nodejs";

/** Statusi u kojima su zalihe još rezervisane — otkazivanje ih vraća na stanje. */
const RESERVED_STATUSES: OrderStatus[] = ["new", "confirmed", "preparing"];

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const caller = await requireUser(req);
    const { id } = await params;
    const { status, note } = (await req.json()) as { status: OrderStatus; note?: string };

    const db = adminDb();

    await db.runTransaction(async (tx) => {
      const orderRef = db.collection("orders").doc(id);
      const snap = await tx.get(orderRef);
      if (!snap.exists) throw new AuthError("Porudžbina nije pronađena.", 404);

      const order = snap.data() as Order;

      // Klinika sme jedino da otkaže svoju porudžbinu dok je još nova.
      if (caller.role === "clinic") {
        if (order.clinicId !== caller.clinicId) {
          throw new AuthError("Nemate pristup ovoj porudžbini.", 403);
        }
        if (status !== "cancelled" || order.status !== "new") {
          throw new AuthError(
            "Porudžbina se može otkazati samo dok je u statusu „Nova”. Za izmene pozovite VBK.",
            400,
          );
        }
      }

      if (!ORDER_STATUS_FLOW[order.status]?.includes(status)) {
        throw new AuthError("Taj prelaz statusa nije dozvoljen.", 400);
      }

      // Otkazivanje vraća rezervisane jedinice u zalihe.
      if (status === "cancelled" && RESERVED_STATUSES.includes(order.status)) {
        for (const item of order.items ?? []) {
          tx.update(db.collection("products").doc(item.productId), {
            stock: FieldValue.increment(item.quantity),
            updatedAt: FieldValue.serverTimestamp(),
          });
        }
      }

      tx.update(orderRef, {
        status,
        seenByAdmin: caller.role === "admin" ? true : order.seenByAdmin,
        history: FieldValue.arrayUnion({
          status,
          at: new Date().toISOString(),
          byUid: caller.uid,
          byName: caller.name,
          ...(note?.trim() ? { note: note.trim() } : {}),
        }),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    // TODO(Faza 2): email klinici o promeni statusa.
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
