import type { Timestamp } from "firebase/firestore";

/** Firestore Timestamp ili ISO string (posle serijalizacije kroz API). */
export type TS = Timestamp | string | null;

/* ---------------------------------- Uloge --------------------------------- */

export type Role = "admin" | "clinic";

export interface AppUser {
  uid: string;
  email: string;
  name: string;
  role: Role;
  /** Popunjeno samo za role === "clinic". */
  clinicId?: string | null;
  phone?: string;
  active: boolean;
  createdAt: TS;
}

/* --------------------------------- Klinike -------------------------------- */

export type ClinicStatus = "pending" | "verified" | "active" | "suspended";

export const CLINIC_STATUS_LABEL: Record<ClinicStatus, string> = {
  pending: "Na čekanju",
  verified: "Verifikovana",
  active: "Aktivna",
  suspended: "Suspendovana",
};

export interface Clinic {
  id: string;
  name: string;
  /** Poreski identifikacioni broj. */
  pib: string;
  /** Matični broj. */
  mb: string;
  address: string;
  city: string;
  postalCode?: string;
  /** Adresa isporuke ako se razlikuje od sedišta. */
  deliveryAddress?: string;
  contactPerson: string;
  phone: string;
  emergencyPhone?: string;
  email: string;
  status: ClinicStatus;
  note?: string;
  createdAt: TS;
  updatedAt?: TS;
}

/* -------------------------------- Proizvodi ------------------------------- */

export type Species = "dog" | "cat";

export const SPECIES_LABEL: Record<Species, string> = {
  dog: "Pas",
  cat: "Mačka",
};

export interface Product {
  id: string;
  /** Interna šifra, npr. VBK-PK-D. */
  sku: string;
  name: string;
  species: Species;
  shortDescription: string;
  /** Kada se koristi — prikazuje se klinikama u katalogu. */
  indications: string;
  /** Uslovi čuvanja, npr. "+2 do +6 °C". */
  storage: string;
  /** Rok trajanja u danima od prikupljanja. */
  shelfLifeDays: number;
  /** Jedinica mere, npr. "kesa 450 ml". */
  unit: string;
  /** Cena u dinarima, bez PDV-a. */
  price: number;
  /** Trenutno stanje zaliha u jedinicama. */
  stock: number;
  /** Ispod ovog broja dashboard pali crveno upozorenje. */
  lowStockThreshold: number;
  /** Da li je vidljiv klinikama u katalogu. */
  active: boolean;
  sortOrder: number;
  createdAt: TS;
  updatedAt?: TS;
}

/* ------------------------------- Porudžbine ------------------------------- */

export type OrderStatus =
  | "new"
  | "confirmed"
  | "preparing"
  | "dispatched"
  | "completed"
  | "cancelled";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  new: "Nova",
  confirmed: "Potvrđena",
  preparing: "U pripremi",
  dispatched: "Poslata",
  completed: "Završena",
  cancelled: "Otkazana",
};

/** Dozvoljeni prelazi statusa — koristi ih i UI i server. */
export const ORDER_STATUS_FLOW: Record<OrderStatus, OrderStatus[]> = {
  new: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["dispatched", "cancelled"],
  dispatched: ["completed"],
  completed: [],
  cancelled: [],
};

export type DeliveryMethod = "delivery" | "pickup";

export const DELIVERY_LABEL: Record<DeliveryMethod, string> = {
  delivery: "Dostava",
  pickup: "Preuzimanje",
};

export interface OrderItem {
  productId: string;
  sku: string;
  name: string;
  species: Species;
  unit: string;
  /** Cena po jedinici u trenutku poručivanja (ne menja se retroaktivno). */
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  /** Čitljiv broj porudžbine, npr. VBK-2026-0007. */
  orderNumber: string;
  clinicId: string;
  clinicName: string;
  createdByUid: string;
  createdByName: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  urgent: boolean;
  deliveryMethod: DeliveryMethod;
  deliveryAddress?: string;
  note?: string;
  /** Interna beleška VBK tima — klinika je ne vidi. */
  adminNote?: string;
  /** Log promena statusa. */
  history: OrderEvent[];
  /** Da li je admin video porudžbinu (za badge i zvučni signal). */
  seenByAdmin: boolean;
  createdAt: TS;
  updatedAt?: TS;
}

export interface OrderEvent {
  status: OrderStatus;
  at: TS;
  byUid: string;
  byName: string;
  note?: string;
}

/* --------------------------- Kartoni pasa donora -------------------------- */

/** DEA 1 je klinički najvažniji sistem kod pasa. */
export type BloodTypeDog = "DEA1+" | "DEA1-" | "unknown";
/** AB sistem kod mačaka. */
export type BloodTypeCat = "A" | "B" | "AB" | "unknown";

export const BLOOD_TYPE_LABEL: Record<string, string> = {
  "DEA1+": "DEA 1 pozitivan",
  "DEA1-": "DEA 1 negativan (univerzalni donor)",
  A: "Grupa A",
  B: "Grupa B",
  AB: "Grupa AB",
  unknown: "Nije određena",
};

export type DonorStatus = "candidate" | "active" | "paused" | "retired";

export const DONOR_STATUS_LABEL: Record<DonorStatus, string> = {
  candidate: "Kandidat",
  active: "Aktivan donor",
  paused: "Privremeno isključen",
  retired: "Trajno isključen",
};

export interface Dog {
  id: string;
  name: string;
  species: Species;
  breed: string;
  /** ISO datum rođenja (YYYY-MM-DD). */
  birthDate: string | null;
  /** Težina u kilogramima. */
  weightKg: number | null;
  /** Broj mikročipa. */
  microchip: string;
  sex: "m" | "f" | null;
  bloodType: BloodTypeDog | BloodTypeCat;
  donorStatus: DonorStatus;
  /** Razlog isključenja — obavezan kad je status paused/retired. */
  statusReason?: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  ownerCity?: string;
  /** ISO datum poslednje donacije — održava se pri upisu posete. */
  lastDonationDate: string | null;
  /** ISO datum od kog pas ponovo sme da donira (lastDonation + 56 dana). */
  nextEligibleDate: string | null;
  donationCount: number;
  note?: string;
  createdAt: TS;
  updatedAt?: TS;
}

export type VisitType = "exam" | "labs" | "donation" | "note";

export const VISIT_TYPE_LABEL: Record<VisitType, string> = {
  exam: "Pregled",
  labs: "Analize",
  donation: "Donacija",
  note: "Beleška",
};

export interface Visit {
  id: string;
  dogId: string;
  type: VisitType;
  /** ISO datum posete. */
  date: string;
  /** Za type === "donation": prikupljena količina u ml. */
  volumeMl?: number | null;
  /** Za type === "labs": do kada analiza važi (ISO datum) — pali podsetnik. */
  validUntil?: string | null;
  /** Naziv analize/pregleda, npr. "Kompletna krvna slika". */
  title: string;
  note?: string;
  createdByUid: string;
  createdByName: string;
  createdAt: TS;
}

/* --------------------- Prijave donora (forma sa sajta) -------------------- */

export type ApplicationStatus = "new" | "contacted" | "approved" | "rejected";

export const APPLICATION_STATUS_LABEL: Record<ApplicationStatus, string> = {
  new: "Nova",
  contacted: "Kontaktiran",
  approved: "Prihvaćena",
  rejected: "Odbijena",
};

export interface Application {
  id: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  city: string;
  dogName: string;
  species: Species;
  breed: string;
  ageYears: number | null;
  weightKg: number | null;
  /** Odgovori na skrining pitanja — ključ je id pitanja iz SCREENING_QUESTIONS. */
  answers: Record<string, boolean | string>;
  note?: string;
  status: ApplicationStatus;
  /** Popunjeno kada admin prevede prijavu u karton. */
  dogId?: string | null;
  adminNote?: string;
  createdAt: TS;
  updatedAt?: TS;
}
