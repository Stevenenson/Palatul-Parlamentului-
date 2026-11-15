# Palatul Parlamentului — tur 3D

Un site în care vezi Palatul Parlamentului întâi de sus, în oraș, apoi cobori la macheta lui 3D, pe
care o poți roti. Mai departe treci cu scroll din sală în sală, vezi în fiecare sală o hologramă cu
filmări între care dai swipe și sari direct într-o sală din harta cu pinuri. O a doua pagină spune
istoria clădirii.

Site-ul e publicat la <https://stevenenson.github.io/Palatul-Parlamentului-/>. Codul QR al adresei
e în `public/qr.svg`.

Stadiu: versiune de test. Macheta și cele patru săli sunt construite din cod; filmările și
pozele sunt deocamdată conținut de test, marcat ca atare în pagină.

## Pornire

Ai nevoie de Node 22 sau mai nou.

```bash
git clone https://github.com/Stevenenson/Palatul-Parlamentului-.git
cd Palatul-Parlamentului-
npm install
npm run dev
```

Apoi deschide `http://localhost:5173/`. Pagina de istorie e la `http://localhost:5173/istorie/`.

## Comenzi

| Comandă | Ce face |
|---|---|
| `npm run dev` | pornește serverul de dezvoltare |
| `npm run build` | verifică tipurile și construiește versiunea de publicat în `dist/` |
| `npm run preview` | servește local ce a construit `build` |
| `npm run lint` | verifică codul cu ESLint |
| `npm run test:e2e` | teste în browser: scroll, swipe, pinuri, tastatură |
| `npm run shots -- <etichetă>` | capturi de ecran pe desktop, laptop și telefon, în `review/shots/<etichetă>/` |
| `npm run qr` | scrie din nou codul QR al adresei publice, în `public/qr.svg` |
| `node scripts/fetch-city.mjs` | reface macheta orașului din OpenStreetMap, în `public/data/oras.json` |

Testele și capturile folosesc Google Chrome instalat pe calculator.

## Publicare

La fiecare push pe `main`, `.github/workflows/pages.yml` construiește site-ul și îl publică pe GitHub
Pages. Site-ul stă într-un subfolder cu numele repo-ului, pe care build-ul îl primește prin variabila
`BASE_PATH`; local, fără ea, adresa de bază rămâne `/`.

## Unde schimbi conținutul

Tot ce ține de conținut stă în `src/content/rooms.ts`: numele și textele sălilor, culoarea de
accent, poziția camerei, locul hologramei, filmările și pozele.

- Filmări: pune fișierele MP4 în `public/media/videos/` și trece-le la `recordings` în sala lor.
- Poze: creează `public/media/photos/`, pune-le acolo și trece-le la `photos`.
- Sala reală în 360°: mergi în sală pe Google Arts & Culture, copiază adresa din browser și pune-o la
  `streetView: fromArtsLink('…')`. Imaginile nu se descarcă: se afișează prin încorporarea Google.
- O filmare fără sunet primește `silent: true`, ca playerul să nu-i arate butonul de sunet.
- Orașul din prima oprire: etichetele reperelor stau în `src/content/city.ts`, iar clădirile, parcurile, apa
  și bulevardele vin din OpenStreetMap, prin `scripts/fetch-city.mjs` (© colaboratorii OpenStreetMap, ODbL).
- Pagina de istorie: capitolele, cifrele, imaginile și sursele stau în `src/content/history.ts`, iar ce arată
  macheta la fiecare capitol, în `src/history/stage/states.ts`. Imaginile vechi stau în `public/media/history/`.

## Cum e organizat

```
src/content/    sălile, opririle turului, textele, capitolele de istorie
src/history/    pagina de istorie: firul, capitolele, macheta care urmează lectura
src/scroll/     directorul de scroll: opriri, tastatură, linkuri directe
src/state/      starea turului
src/three/      scena 3D: palatul, sălile, hologramele, harta, camera
src/ui/         panourile din pagină
scripts/        capturi de ecran și teste
review/         jurnalul agentului reviewer
```

`PLAN.md` ține pașii proiectului și abaterile de la planul inițial. `review/REVIEW.md` e jurnalul
agentului reviewer (`.claude/agents/pp-reviewer.md`), care verifică fiecare pas și notează ce e
de îmbunătățit.

## Surse

Datele despre clădire vin din articolul „Palatul Parlamentului” de pe Wikipedia în limba română.
Macheta e o reconstrucție aproximativă, făcută din cod, nu un releveu al clădirii.
