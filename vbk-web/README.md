# VBK — platforma (Faza 2)

Portal Veterinarske banke krvi: admin panel za VBK tim i portal za veterinarske
klinike. Javni sajt (Faza 1 iz `../PLAN.md`) dolazi kasnije u istu aplikaciju,
pa je platforma smeštena pod `/portal`.

**Stack:** Next.js 16 (App Router, Turbopack) · React 19 · Tailwind CSS v4 ·
Firebase (Auth + Firestore) · TypeScript

---

## Pokretanje

### 1. Firebase projekat

1. [console.firebase.google.com](https://console.firebase.google.com) → novi projekat (npr. `vbk-portal`)
2. **Build → Authentication** → Sign-in method → uključi **Email/Password**
3. **Build → Firestore Database** → Create database → produkcioni mod, region `eur3`
4. **Project settings → General → Your apps** → dodaj Web app → prepiši `firebaseConfig`
5. **Project settings → Service accounts** → *Generate new private key* → preuzmi JSON

### 2. Env varijable

```bash
cp .env.local.example .env.local
```

Popuni vrednosti iz koraka 4 i 5. `FIREBASE_PRIVATE_KEY` ostaje pod navodnicima,
sa `\n` umesto stvarnih prelaza reda.

### 3. Pravila i indeksi

```bash
npm i -g firebase-tools
firebase login
firebase use --add            # izaberi svoj projekat
npm run deploy:rules
```

Bez ovoga portal radi, ali baza je otvorena/zatvorena po podrazumevanim pravilima —
obavezno pre bilo kakvih pravih podataka.

### 4. Prvi admin i katalog

```bash
npm run create:admin -- ti@vbk.rs "Ime Prezime" nekaLozinka123
npm run seed:products
```

`create:admin` postavlja custom claim `role: admin` — bez toga niko ne može u portal.
`seed:products` ubacuje predloženih 9 proizvoda sa zalihom 0 (preskače postojeće po SKU).

### 5. Dev

```bash
npm run dev     # http://localhost:3000
```

---

## Deploy na Vercel

Aplikacija NIJE u korenu repoa, pa je jedno podesavanje obavezno:

1. **Settings -> Build and Deployment -> Root Directory** = `vbk-web`
   Bez toga Vercel ne nadje `package.json`, build se ne pokrene i sajt vraca
   404 NOT_FOUND. Podesavanje ne vazi za vec napravljene deploye - posle izmene
   ide Redeploy.

2. **Settings -> Environment Variables** - nalepi ceo sadrzaj `.env.local` u
   polje za ime varijable; Vercel prepozna `.env` format i razbije ga sam.
   Ukljuci Production, Preview i Development. `FIREBASE_PRIVATE_KEY` ide bez
   spoljnih navodnika (radi i u jednom redu sa `\n` i kao viseredni tekst).

3. **Firebase konzola -> Authentication -> Settings -> Authorized domains** ->
   dodaj `<projekat>.vercel.app`, pa kasnije i pravi domen. Bez toga prijava
   puca sa `auth/unauthorized-domain`.

Firestore pravila i indeksi se ne deployuju kroz Vercel - to ide zasebno,
`npm run deploy:rules`.

## Strukura

```
src/
  app/
    portal/login              prijava (email + reset lozinke)
    portal/registracija       javni zahtev klinike za pristup
    portal/admin/             VBK tim
      /                       dashboard uživo + zvučni signal za nove porudžbine
      /porudzbine             lista + detalj sa promenom statusa
      /proizvodi              CRUD proizvoda + ručno vođenje zaliha
      /klinike                verifikacija, podaci, otvaranje naloga
      /psi                    kartoni donora + posete/analize/donacije
      /prijave                prijave donora sa sajta → karton
      /korisnici              nalozi i deaktivacija
    portal/klinika/           klijenti
      /                       pregled
      /katalog                proizvodi + dodavanje u korpu
      /korpa                  slanje porudžbine
      /porudzbine             praćenje statusa
      /profil                 kontakt podaci i lozinka
    api/                      rute koje traže server (Admin SDK)
  components/ui               dugmad, kartice, modal, bedževi
  components/portal           AuthGuard, PortalShell, StatCard
  hooks                       useAuth, useCart, useOrderAlert
  lib                         firebase (klijent/admin), format, konstante
  types                       model podataka
firestore.rules               ko šta sme da vidi i menja
firestore.indexes.json        složeni indeksi za upite
scripts/                      create:admin, seed:products
```

## Kako radi

**Uloge.** `users/{uid}` je izvor istine za UI; iste vrednosti stoje i u custom
claims (`role`, `clinicId`) koje čitaju Firestore pravila. Oba postavlja
`/api/admin/users`, pa se ne mogu razići.

**Porudžbine.** Kreiranje ide isključivo kroz `/api/orders` u jednoj Firestore
transakciji: provera zaliha → umanjenje → uzimanje rednog broja (`VBK-2026-0007`)
→ upis. Zato dve klinike ne mogu rezervisati istu kesu. Otkazivanje vraća jedinice
u zalihe. Direktan upis u `orders` sa klijenta je zabranjen pravilima.

**Real-time.** Admin panel sluša `onSnapshot` — porudžbina se pojavi istog
trenutka, uz zvučni signal (Web Audio, bez fajla; browser traži da korisnik
prvo klikne bilo gde na stranici).

**Kartoni donora.** Upis donacije automatski pomera `lastDonationDate`,
`nextEligibleDate` (+56 dana) i brojač. Analize sa rokom pale podsetnik 30 dana
pre isteka.

## Šta još nije urađeno

- **Email notifikacije** (Sloj 3 iz plana) — Cloud Function na `orders/onCreate`
  preko Resend-a. Mesta su označena `TODO(Faza 2)` u `src/app/api/orders/`.
- **FCM web push** (Sloj 2) — dashboard i zvuk rade i bez toga.
- **Javni sajt** — Faza 1; stranica `/vlasnici/prijava` gađa gotovu rutu
  `/api/applications`.

## Otvorena pitanja za klijenta

Ugrađene su radne pretpostavke; menjaju se bez prepravke koda osim gde piše drugo:

| Pitanje | Pretpostavka |
|---|---|
| Lista i cene 9 proizvoda | `scripts/products.seed.json` — cene vidljive samo ulogovanim klinikama |
| Zalihe: po kesi ili brojčano | Brojčano (`stock` po proizvodu). Praćenje pojedinačnih kesa sa rokom traži novu kolekciju |
| Ko unosi kartone pasa | Samo VBK admin |
| Dostava | Dostava ili lično preuzimanje, bira klinika pri poručivanju |
| Mačke | Uključene od starta (vrsta na proizvodu i kartonu) |
| Login za vlasnike donora | Nema ga — samo upitnik, kao u planu |
