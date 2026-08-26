import Link from "next/link";
import { ArrowRight, Droplet, Phone } from "lucide-react";
import { EMERGENCY_PHONE } from "@/lib/constants";

/**
 * Privremena početna. Javni sajt (Faza 1 iz PLAN.md) dolazi kasnije —
 * ova stranica za sada samo vodi ka portalu.
 */
export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
      <span className="mb-6 grid h-14 w-14 place-items-center rounded-xl bg-blood text-lg font-bold text-white">
        VBK
      </span>

      <h1 className="text-3xl font-semibold text-ink sm:text-4xl">
        Veterinarska banka krvi
      </h1>
      <p className="mt-3 max-w-xl text-ink-soft">
        Prva veterinarska banka krvi u Srbiji. Javni sajt je u izradi — portal za
        veterinarske klinike je već dostupan.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/portal/login"
          className="inline-flex items-center gap-2 rounded-lg bg-blood px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-blood-dark"
        >
          <Droplet className="h-4 w-4" />
          Portal za klinike
          <ArrowRight className="h-4 w-4" />
        </Link>
        <a
          href={`tel:${EMERGENCY_PHONE.replace(/\s/g, "")}`}
          className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-5 py-3 text-sm font-medium text-ink transition-colors hover:border-ink-mute"
        >
          <Phone className="h-4 w-4" />
          Hitno: {EMERGENCY_PHONE}
        </a>
      </div>

      <p className="mt-10 text-xs text-ink-mute">
        Za hitne slučajeve uvek zovite telefonom — porudžbine kroz portal obrađujemo
        u toku radnog vremena.
      </p>
    </main>
  );
}
