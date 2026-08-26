import type { TS } from "@/types";

/** Minimalni razmak između dve donacije (8 nedelja iz plana). */
export const DONATION_INTERVAL_DAYS = 56;

/** Firestore Timestamp | ISO string | Date -> Date. */
export function toDate(value: TS | Date | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "string") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === "object" && "toDate" in value) {
    try {
      return (value as { toDate: () => Date }).toDate();
    } catch {
      return null;
    }
  }
  return null;
}

export function formatDate(value: TS | Date | undefined): string {
  const d = toDate(value);
  if (!d) return "—";
  return d.toLocaleDateString("sr-RS", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTime(value: TS | Date | undefined): string {
  const d = toDate(value);
  if (!d) return "—";
  return d.toLocaleString("sr-RS", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "pre 3 min", "pre 2 h" — za real-time listu porudžbina. */
export function timeAgo(value: TS | Date | undefined): string {
  const d = toDate(value);
  if (!d) return "—";
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return "upravo sada";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `pre ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `pre ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `pre ${days} d`;
  return formatDate(d);
}

export function formatRsd(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return "—";
  return new Intl.NumberFormat("sr-RS", {
    style: "currency",
    currency: "RSD",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** ISO datum (YYYY-MM-DD) u lokalnoj zoni — za <input type="date">. */
export function toISODate(d: Date = new Date()): string {
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 10);
}

export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00`);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

/** Broj dana od danas do datuma; negativno = prošlo. */
export function daysUntil(isoDate: string | null | undefined): number | null {
  if (!isoDate) return null;
  const target = new Date(`${isoDate}T00:00:00`).getTime();
  const today = new Date(`${toISODate()}T00:00:00`).getTime();
  return Math.round((target - today) / 86400000);
}

export function ageFromBirthDate(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const b = new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(b.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age -= 1;
  return age;
}

/** "Milan Petrović" -> "MP" */
export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
