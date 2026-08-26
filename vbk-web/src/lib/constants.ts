import type { Species } from "@/types";

/* ------------------------- Skrining prijave donora ------------------------ */

export interface ScreeningQuestion {
  id: string;
  label: string;
  /** Odgovor koji diskvalifikuje kandidata — koristi se za automatsko upozorenje. */
  disqualifyingAnswer: boolean;
  helper?: string;
}

export const SCREENING_QUESTIONS: ScreeningQuestion[] = [
  {
    id: "vaccinated",
    label: "Da li je vakcinacija redovna i važeća?",
    disqualifyingAnswer: false,
  },
  {
    id: "parasiteControl",
    label: "Da li redovno sprovodite tretman protiv parazita?",
    disqualifyingAnswer: false,
    helper: "Interni i eksterni paraziti, uključujući preventivu dirofilarioze.",
  },
  {
    id: "everTransfused",
    label: "Da li je životinja ikada primila transfuziju krvi?",
    disqualifyingAnswer: true,
    helper: "Primaoci transfuzije ne mogu biti donori.",
  },
  {
    id: "chronicIllness",
    label: "Da li boluje od hronične bolesti ili prima stalnu terapiju?",
    disqualifyingAnswer: true,
  },
  {
    id: "everGaveBirth",
    label: "Da li je ženka ikada bila gravidna ili se legla?",
    disqualifyingAnswer: true,
    helper: "Odnosi se samo na ženke; mužjaci odgovaraju sa NE.",
  },
  {
    id: "outdoorOnly",
    label: "Da li životinja živi isključivo napolju / bez nadzora?",
    disqualifyingAnswer: true,
  },
  {
    id: "calmTemperament",
    label: "Da li je mirne naravi i podnosi pregled bez sedacije?",
    disqualifyingAnswer: false,
  },
  {
    id: "travelAbroad",
    label: "Da li je u poslednjih 12 meseci boravila van Srbije?",
    disqualifyingAnswer: true,
    helper: "Zbog rizika od vektorskih bolesti tražimo dodatne analize.",
  },
];

/* ---------------------------- Kriterijumi donora --------------------------- */

export const DONOR_CRITERIA: Record<
  Species,
  { minWeightKg: number; minAgeYears: number; maxAgeYears: number }
> = {
  dog: { minWeightKg: 25, minAgeYears: 1, maxAgeYears: 8 },
  cat: { minWeightKg: 4.5, minAgeYears: 1, maxAgeYears: 8 },
};

/** Kontakt za hitne slučajeve — poručivanje van radnog vremena ide telefonom. */
export const EMERGENCY_PHONE = process.env.NEXT_PUBLIC_EMERGENCY_PHONE ?? "+381 60 000 0000";
