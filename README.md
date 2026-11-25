# Pastrim kimik · aplikacion për një dyqan real

Projekti individual i lëndës "Programimi për Pajisje Mobile" (AAB, 2026/2027). Aplikacion Next.js (PWA, mobile-first) për një dyqan pastrimi kimik.

> **Gjendja:** kjo është një HIPOTEZË që duhet vërtetuar me pronarin real. Emri i dyqanit, kontakti, orari, çmimet, kategoritë dhe emrat e shërbimeve janë `[PLOTËSO]` ose shembuj deri sa të flasësh me pronarin. Asgjë nuk është shpikur si fakt.

## Si funksionon (sipas aplikacioneve të vërteta të pastrimit kimik)

Struktura u mor nga mënyra si punojnë aplikacionet e dyqaneve të vërteta (porosi me disa artikuj, ditë sjelljeje, status i dukshëm për klientin, çmimore e grupuar sipas llojit). Nuk u kopjuan çmime, tekste apo marka.

1. **Klienti** zgjedh disa artikuj (shporta me + / −), ditën kur i sjell rrobat dhe dërgon porosinë.
2. **Dyqani (pronari)** e pranon dhe e çon përpara: `pranuar → në pastrim → gati → marrë` (ose refuzon porosinë e re).
3. **Klienti sheh vijën kohore të statusit** pa rifreskuar (rilexim çdo 5 sekonda). Çmimorja dhe orari lexohen edhe pa internet.

**Jashtë MVP** (për t'u ndryshuar pas bisedës me pronarin): pagesa online, njoftime push, "po vij ta marr", marrja/dorëzimi me shofer, kapaciteti ditor, anulimi nga klienti, disa dyqane, fotografi të rrobave.

## Hyrja

Hyrja është me **Google** (klientët dhe pronari). GitHub aktivizohet vetëm nëse `GH_CLIENT_ID` dhe `GH_CLIENT_SECRET` ekzistojnë, për prova gjatë zhvillimit; mos i vendos në publikim. Çdo llogari e re fillon si `klient`. Roli `pronar` (stafi i dyqanit) vendoset vetëm nga databaza (`schema-pronari.sql`), kurrë nga një formular.

## Si e nis

```bash
cd aplikacioni
npm install
# 1) Krijo një databazë në Neon dhe vendos DATABASE_URL në .env.local (shih env.example).
# 2) npm run db:skema      (krijon tabelat nga schema.sql)
# 3) Plotëso GOOGLE_CLIENT_ID dhe GOOGLE_CLIENT_SECRET në .env.local (mos e ngarko kurrë në GitHub).
npm run dev          # http://localhost:3000
```

Pas hyrjes së parë, hap `/panel`, merr ID-në e llogarisë (p.sh. `google:123…`) dhe ekzekuto `schema-pronari.sql` me atë ID në Neon. Pa këtë hap askush nuk është pronar dhe porositë nuk pranohen.

Për të provuar dy rolet përdor një dritare normale dhe një private (dy skeda normale ndajnë të njëjtin sesion).

## Provat

```bash
npm run test:validim    # pa databazë: validimi i hyrjes
npm run test:porosite   # kundër Neon (lexon .env.local); përdor vetëm rreshta TEST-… dhe i fshin
```

## Çfarë mungon (vetëm ti e di)

Kërko `[PLOTËSO]` në `aplikacioni/src/lib/biznesi.ts` (emri, kontakti, telefoni, adresa, orari) dhe plotëso çmimet dhe emrat e vërtetë të shërbimeve te tabela `sherbimet`. Mos shpik emra, çmime, orare ose biseda.

## Struktura

- `aplikacioni/src/lib/porosite-core.ts` · rregullat (marrin `sql` si parametër, pra provohen pa Next.js)
- `aplikacioni/src/lib/` · lidhja me Neon, hyrja, roli nga databaza, çmimorja
- `aplikacioni/src/app/` · faqet (`/` çmimorja, `/porosi-e-re`, `/porosite`, `/panel`), API-të dhe veprimet e serverit
- `aplikacioni/public/sw.js`, `offline.html` · lexim pa internet
- `aplikacioni/schema.sql`, `schema-pronari.sql` · databaza dhe roli i pronarit
