# VBK — Veterinarska Banka Krvi · Master plan

> Prva veterinarska banka krvi u Srbiji. Plan pisan 2026-07-13 na osnovu skena
> referentnih sajtova (`_scan/bankakrvi-vef.md`, `_scan/petbloodbankuk.md`).
> Status: okvirni plan — detalji platforme se preciziraju sa klijentom.

## Deliverables

| # | Šta | Status |
|---|---|---|
| 1 | Logo + brend | ✅ Logo izabran (Higgsfield `logo-v1.png`), paket u `brand/` |
| 2 | Sajt (javna prezentacija) | Planiranje |
| 3 | Platforma (CRM + poručivanje) | 🔨 MVP napravljen (`vbk-web/`, 2026-08-18) — čeka Firebase projekat i odgovore klijenta |
| 4 | PDF pamflet | Čeka sadržaj |

**Boje brenda:** `#D7292A` (krv, primarna), `#BB242B` (tamnija), `#1D3557` (teget — predlog za tipografiju/UI), off-white pozadine.

---

## 1. SAJT — javna prezentacija

Ključna lekcija iz oba skena: **od prvog klika razdvojiti dva sveta** — vlasnike
pasa (emotivan ton, "tvoj pas je heroj") i veterinarske klinike (B2B, stručno,
efikasno). Pet Blood Bank UK ovo radi savršeno.

### Predložena struktura (sitemap)

```
/                        Početna — hero, statistike, dva sveta, proizvodi teaser, CTA
├── /vlasnici            Za vlasnike pasa
│   ├── /vlasnici/donori          Ko može biti donor (kriterijumi)
│   ├── /vlasnici/postupak        Kako izgleda doniranje (koraci, 45-60 min)
│   ├── /vlasnici/krvne-grupe     Edukacija: DEA sistem, univerzalni donori
│   ├── /vlasnici/nasi-donori     Galerija pasa heroja + testimonijali
│   ├── /vlasnici/prijava         Upitnik za prijavu donora (naš sistem, ne Forms!)
│   └── /vlasnici/pitanja         FAQ za vlasnike (~14 pitanja po uzoru na Zagreb)
├── /klinike             Za veterinarske klinike (KLIJENTI)
│   ├── /klinike/proizvodi        9 proizvoda — javna stranica sa karticama
│   ├── /klinike/porucivanje      Kako se poručuje (hitno = telefon, ostalo = platforma)
│   ├── /klinike/registracija     Onboarding nove klinike
│   ├── /klinike/vodici           Stručni vodiči (tipizacija, skladištenje, administracija)
│   └── /klinike/pitanja          FAQ za veterinare
├── /o-nama              Priča, tim, laboratorija, standardi kvaliteta
├── /vesti               Obaveštenja (Zagreb ima praznu sekciju — mi planiramo sadržaj!)
├── /kontakt             Forma sa temama + mapa + radno vreme
└── /portal              → ulaz u platformu (login)
```

### Sadržajni principi (iz skenova)

- **Hero sa statistikama:** "1 donacija = do 4 spasena života" (oba sajta koriste), min kg, trajanje, besplatno za donore
- **Postupak u 4 koraka** sa vizuelnim prikazom
- **Profili pasa donora** — emotivno najjači sadržaj, besplatan marketing, vlasnici ga dele
- **"Poruči krv" dugme stalno u navigaciji** (kao UK "Order Blood Now")
- Edukativni vodiči = SEO autoritet + poverenje klinika
- Srpski jezik primarno; engleski kasnije ako zatreba

### Tehnologija sajta

- **Next.js 16 (App Router) + Tailwind CSS v4** — isti stack kao ostali projekti
- SSG za javne stranice (brzina + SEO), deploy na Vercel
- Framer Motion / GSAP za animacije, mobile-first (375px/390px test)

---

## 2. PLATFORMA — CRM + poručivanje

### Korisničke uloge

| Uloga | Šta radi |
|---|---|
| **Admin (VBK)** | Sve: psi/kartoni, klinike, proizvodi, zalihe, porudžbine real-time, obaveštenja |
| **Klinika (klijent)** | Login → katalog 9 proizvoda → porudžbina → praćenje statusa svojih porudžbina |
| *(kasnije?)* Vlasnik donora | Profil svog psa, istorija donacija, zakazivanje — kao UK app; NIJE MVP |

### Moduli

**A) Kartoni pasa (registar donora)**
- Svaki pas ima karton: osnovni podaci (ime, rasa, starost, težina, čip), vlasnik (kontakt), krvna grupa (DEA 1 +/-), status donora (aktivan / privremeno isključen / trajno isključen + razlog)
- **Posete/zapisi:** hronološki log — pregledi, analize (rok važenja: neke 6 meseci, neke godišnje — podsetnici!), donacije (datum, količina, napomene)
- Pravilo 8 nedelja između donacija → sistem sam računa "sledeća moguća donacija"
- Screening upitnik sa sajta (/vlasnici/prijava) upada direktno ovde kao "kandidat"

**B) Klinike (klijenti)**
- Profil: naziv, PIB/MB, adresa isporuke, kontakt osobe, telefoni, email
- Status: na čekanju → verifikovana → aktivna (admin odobrava — kao UK onboarding)
- Istorija porudžbina po klinici

**C) Proizvodi (9 komada)**
- Krv (puna), plazma, trombociti, koncentrat eritrocita... (tačnu listu definiše klijent)
- Po proizvodu: naziv, opis, indikacije, uslovi čuvanja, rok trajanja, cena, **trenutno stanje zaliha**
- Admin dodaje/menja/uklanja proizvode i ručno vodi stanje zaliha
- Javna verzija kataloga na sajtu (bez cena ili sa cenama — pitanje za klijenta)

**D) Porudžbine**
- Klinika: korpa → količine → napomena → potvrda (BEZ plaćanja online — fakturisanje van platforme)
- Statusi: `nova → potvrđena → priprema → poslata/preuzeta → završena` (+ `otkazana`)
- Admin vidi porudžbine **real-time** na dashboardu
- Hitni slučajevi: telefon (kao UK) — na sajtu jasno istaknuto

**E) Notifikacije (za admina, kad stigne porudžbina)**
- **Sloj 1 — real-time dashboard:** Firestore `onSnapshot` — porudžbina se pojavljuje istog trenutka, uz zvučni signal u admin panelu
- **Sloj 2 — push:** FCM web push na adminov telefon/browser (radi i kad panel nije otvoren)
- **Sloj 3 — email:** Cloud Function na `orders/onCreate` šalje email (Resend, jeftino i pouzdano)
- Klinika dobija email potvrdu porudžbine + email pri promeni statusa

**F) Admin dashboard**
- Pregled: današnje/nove porudžbine, stanje zaliha (crveno ispod praga), broj aktivnih donora, zakazane posete
- Podsetnici: analize kojima ističe rok, psi koji "otključavaju" novu donaciju

### Tehnologija platforme

- **Next.js + Firebase** (Auth, Firestore, Cloud Functions, FCM, Hosting/Vercel)
- Razlog: real-time out of the box, poznat stack (BBIT PORTAL je isti obrazac:
  klinike=klijenti login, admin real-time, bez plaćanja), brz razvoj, niska cena
- Firestore kolekcije (skica):
  - `dogs` (karton) + subkolekcija `visits`
  - `clinics` + `users` (custom claims: admin / clinic)
  - `products` (9 dokumenata, sa `stock` poljem)
  - `orders` + subkolekcija `items` (ili items kao array)
  - `applications` (prijave donora sa sajta)
- Security rules: klinika vidi samo svoje porudžbine; kartoni pasa samo admin

### Otvorena pitanja za klijenta

1. Tačna lista i nazivi 9 proizvoda + cene (javne ili samo za ulogovane?)
2. Da li zalihe vodimo po jedinicama (kesa krvi sa rokom trajanja pojedinačno) ili prosto brojčano?
3. Ko unosi kartone pasa — samo VBK admin, ili i klinike šalju svoje pse donore?
4. Dostava: sopstvena / kurir / preuzimanje? (utiče na statuse porudžbine)
5. Mačke — od starta ili kasnije? (Zagreb: samo psi; UK: psi + mačke + alpake)
6. Treba li vlasnicima donora ikakav login u MVP-u? (predlog: NE — samo upitnik)

---

## 3. PDF PAMFLET

- Čeka se izvorni PDF od klijenta ("ukrasiti postojeći PDF")
- Dizajn nasleđuje brend: crvena `#D7292A`, teget, logo, kap+šapa motivi
- Verovatan sadržaj: šta je VBK, zašto donori trebaju, kriterijumi, kontakt — 
  isti sadržaj kao sajt /vlasnici sekcija, samo sažeto
- Format: A5 ili tripold A4? — pitati klijenta; štampa 300 dpi CMYK + verzija za web/social

---

## 4. FAZE (predlog redosleda)

**Faza 1 — Sajt (javna prezentacija)**
Setup projekta → dizajn sistem (boje/font/logo) → početna → vlasnici sekcija →
klinike sekcija → o nama/kontakt/vesti → prijava donora (upitnik u Firestore) → SEO + deploy

**Faza 2 — Platforma MVP** — *kod napisan 2026-08-18, vidi `vbk-web/README.md`*
✅ auth + uloge · ✅ proizvodi CRUD + zalihe · ✅ klinike onboarding · ✅ poručivanje
(transakcija sa rezervacijom zaliha) · ✅ real-time dashboard + zvučni signal ·
✅ kartoni pasa + posete · ✅ prijave donora · ⬜ email notifikacije (Resend) · ⬜ FCM push
Ostaje pre puštanja: Firebase projekat, `.env.local`, deploy pravila, `create:admin`, `seed:products`.

**Faza 3 — Pamflet** (paralelno sa bilo čim, kad stigne PDF)

**Faza 4 — Dorade**
Podsetnici za analize, statistika/izveštaji, mačke, vlasnički portal, aplikacija
(mobilna = verovatno PWA od platforme, odluka kasnije)

---

*Reference: `_scan/bankakrvi-vef.md` (Zagreb — sadržaj i ton za vlasnike),
`_scan/petbloodbankuk.md` (UK — arhitektura, poručivanje, onboarding klinika).*
