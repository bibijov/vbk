# Sken: Pet Blood Bank UK (petbloodbankuk.org)

> Skenirano 2026-07-13. Najveća i najzrelija veterinarska banka krvi u Evropi —
> UK charity (Scottish Charity No: 037745), radi 24/7, obrada u Loughborough-u.
> Veliki sajt (100+ stranica) sa dva jasna sveta: VLASNICI i VETERINARI.

## Profil

- **Model:** charity — donacije pasa/mačaka širom zemlje na terenskim sesijama, obrada u centralnoj laboratoriji, distribucija veterinarskim praksama
- **Skala:** "veterinari spasu hiljade života godišnje našim proizvodima", potražnja raste svake godine
- **Cene:** proizvodi po ceni koštanja (cost price); praksa se obavezuje da klijentu naplati istu cenu
- **Vrste:** psi, mačke, alpake (New World Camelids)
- **Imaju mobilnu aplikaciju za vlasnike donora!**

## Arhitektura sajta (glavne grane)

```
Home
├── Vet professionals            ← SVET 1: veterinari (B2B)
│   ├── I need blood products
│   │   ├── Order blood products online   ← online poručivanje (login)
│   │   ├── Blood sharing scheme (+ locator, registracija, repacking vodiči)
│   │   ├── Canine transfusion calculator ← alat-kalkulator
│   │   ├── Prices, delivery, and returns (+ prijava neispravnog proizvoda)
│   │   ├── New customers                 ← onboarding klinika
│   │   ├── Consumable products guide
│   │   ├── Understanding blood components ← edukacija o proizvodima
│   │   ├── Quality commitment
│   │   └── Finance and invoicing
│   ├── I need advice
│   │   ├── Transfusion advice service
│   │   ├── Blood typing (canine / feline)
│   │   ├── Cross matching (canine / feline)
│   │   ├── Administration (red cell / plazma / reakcije / xenotransfuzija...)
│   │   ├── Blood product storage
│   │   └── Blood collection
│   ├── Services (cross matching, camelid, advice)
│   ├── Training and CPD (19 webinara, online kurs, radionice, članci)
│   ├── I am a receptionist          ← čak i za recepcionere!
│   └── Veterinary FAQs
├── Order Blood Now                  ← brzi CTA u glavnom meniju
├── Pet owners                       ← SVET 2: vlasnici (emotivno)
│   ├── I have a dog (12 podstranica)
│   │   ├── Can your dog donate blood? / Dog blood types
│   │   ├── What happens at a session / to your dog's blood / how it helps
│   │   ├── Find nearest session / Register your dog / Training your dog
│   │   ├── Our mobile app (+ FAQs)
│   │   └── Dog owner FAQs / Sponsor
│   ├── I have a cat (7 podstranica)
│   └── I have alpacas
├── Get involved                     ← charity deo (donacije novca, volontiranje...)
├── About us (values, welfare, team, trustees, karijera, nagrade)
└── News
```

## Ključni tokovi

### 1. Poručivanje krvi (veterinari)

- **Hitno:** telefon 01509 232 222 opcija 1 — "primamo pozive samo od veterinara"; van radnog vremena postoji emergency služba uz doplatu
- **Standardno:** online sistem, presek u **15h za noćnu isporuku** (next-day)
- **Novi kupci:** registraciju radi "senior member of staff" (prihvatanje uslova) → verifikacija → email potvrda → kredencijali se dele celom timu prakse
- **Isporuka:** eksterni kurir; **temperaturne trakice za jednokratnu upotrebu** na pošiljci pokazuju da li je prekoračena maks. temperatura u transportu
- **Povraćaj:** krv se ne vraća (osim oštećene — prijava u 24h uz karantin proizvoda, foto, storage log); ostalo 7 dana neotvoreno
- **Fakturisanje:** faktura emailom pri isporuci, rok plaćanja 30 dana, BACS/kartica/ček, finance@ email za sve upite
- **Blood sharing scheme:** mreža praksi koje drže zalihe i "pozajmljuju" jedna drugoj — locator po poštanskom broju

### 2. Registracija donora (vlasnici)

- Online forma → potvrda emailom + consent form + health check form unapred → SMS podsetnik pred termin
- **Sesija (45 min):** pregled + mala proba krvi → vađenje ~450 ml (5–10 min, pas leži na boku) → voda, užina, goody bag (sponzor), foto za social media
- Kriterijumi: 1–8 god, >25 kg, zdrav, bez lekova, dobar temperament, nikad putovao van UK/Irske
- Odmor do kraja dana, normalna rutina sutra

### 3. Mobilna aplikacija (vlasnici donora)

- iOS + Android, poziv u app tek POSLE registracije psa
- **Funkcije:** zakazivanje termina / profil po psu + istorija donacija / direktna komunikacija (sve poruke na jednom mestu) / **push notifikacije kad su zalihe kritične** ("hitno trebaju donori") / notifikacije kad se otvore termini u blizini

## Proizvodi (koliko je javno vidljivo)

Javno pominju kategorije: **puna krv** (retko, uglavnom se separiše), **koncentrati eritrocita** (oxygen-carrying), **plazma proizvodi** (faktori koagulacije). Detaljna tabela komponenti je PDF download ("Canine blood component table"). Pored krvi prodaju i **potrošni materijal**: setovi za administraciju, kitovi za tipizaciju (Alvedia QuickTest, rezultat za 5 min), kitovi za cross matching, oprema za kolekciju.

## Medicinske činjenice (za VBK edukativni sadržaj)

- **DEA sistem:** psi su DEA 1 pozitivni ili negativni (novija klasifikacija, Acierno 2014); DEA 1 negativna krv = univerzalni donor za hitne slučajeve; većina pasa je DEA 1 pozitivna → tipizacija čuva negativnu krv za one kojima stvarno treba
- **Mačke:** grupe A, B, AB; prirodna aloantitela → tipizacija kritična; NIKAD pseća krv mačkama (xenotransfuzija samo izuzetno)
- **Cross matching:** obavezan za drugu transfuziju >4–7 dana posle prve i sve naredne
- **Otvorena jedinica krvi:** na sobnoj temp. baciti posle 4h; aseptički u frižideru do 24h
- **Jedna donacija = do 4 spasena života** (isti claim kao Zagreb)

## Šta VBK može da preuzme / nauči

✅ **Preuzeti:**
- **Dva sveta od prvog klika:** "Ja sam vlasnik" vs "Ja sam veterinar" — cela informaciona arhitektura
- "Order Blood Now" kao stalni CTA u glavnoj navigaciji
- Hitno = telefon, standardno = online sistem (praktično pravilo koje i VBK treba)
- Onboarding klinika: registracija → verifikacija → aktivacija naloga → tim deli pristup
- Presek za poručivanje (kod njih 15h) — jasno komunicirano svuda
- Temperaturne trakice + politika povraćaja + prijava neispravnog proizvoda (kredibilitet)
- Edukativni sadržaj kao SEO/autoritet mašina (typing, storage, administration vodiči)
- Transfusion calculator kao besplatan alat koji veterinari pamte
- App notifikacije za kritične zalihe — genijalan mehanizam za donore
- FAQ odvojen za vlasnike i za veterinare

⚠️ **Za VBK drugačije:**
- Oni su charity sa fundraising sekcijom — VBK je firma, taj deo otpada
- Njihova skala (24/7, kuriri, sharing scheme) je za kasnije faze
- Proizvodi su im skriveni u PDF-u — VBK: javna, lepa stranica sa 9 proizvoda
- Njihovo online poručivanje je klasičan e-commerce bez real-time admina — VBK ima živi dashboard
