import { readFile } from "node:fs/promises";
import { FieldValue } from "firebase-admin/firestore";
import { initAdmin, getFirestore } from "./firebase-admin.mjs";

/**
 * Puni kolekciju `products` predlozenih 9 proizvoda.
 * Postojeci proizvod (isti SKU) se preskace — zalihe se nikad ne gaze.
 *
 *   npm run seed:products
 */
initAdmin();
const db = getFirestore();

const seed = JSON.parse(
  await readFile(new URL("./products.seed.json", import.meta.url), "utf8"),
);

let created = 0;
let skipped = 0;

for (const product of seed) {
  const existing = await db
    .collection("products")
    .where("sku", "==", product.sku)
    .limit(1)
    .get();

  if (!existing.empty) {
    skipped += 1;
    console.log(`  preskocen (vec postoji): ${product.sku} — ${product.name}`);
    continue;
  }

  await db.collection("products").add({
    ...product,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  created += 1;
  console.log(`  dodat: ${product.sku} — ${product.name}`);
}

console.log(`\nGotovo. Dodato ${created}, preskoceno ${skipped}.`);
process.exit(0);
