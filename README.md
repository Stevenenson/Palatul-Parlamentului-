# Palatul Parlamentului — tur 3D

Un site în care rotești macheta 3D a Palatului Parlamentului, cobori cu scroll din sală în sală,
vezi în fiecare sală o hologramă cu filmări între care dai swipe și sari direct într-o sală
din harta cu pinuri.

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

Apoi deschide `http://localhost:5173/`.

## Comenzi

| Comandă | Ce face |
|---|---|
| `npm run dev` | pornește serverul de dezvoltare |
| `npm run build` | verifică tipurile și construiește versiunea de publicat în `dist/` |
| `npm run preview` | servește local ce a construit `build` |
| `npm run lint` | verifică codul cu ESLint |
| `npm run test:e2e` | teste în browser: scroll, swipe, pinuri, tastatură |
| `npm run shots -- <etichetă>` | capturi de ecran pe desktop, laptop și telefon, în `review/shots/<etichetă>/` |

Testele și capturile folosesc Google Chrome instalat pe calculator.

## Unde schimbi conținutul

Tot ce ține de conținut stă în `src/content/rooms.ts`: numele și textele sălilor, culoarea de
accent, poziția camerei, locul hologramei, filmările și pozele.

- Filmări: pune fișierele MP4 în `public/media/videos/` și trece-le la `recordings` în sala lor.
- Poze: creează `public/media/photos/`, pune-le acolo și trece-le la `photos`.
- Sala reală în 360°: mergi în sală pe Google Arts & Culture, copiază adresa din browser și pune-o la
  `streetView: fromArtsLink('…')`. Imaginile nu se descarcă: se afișează prin încorporarea Google.
- O filmare fără sunet primește `silent: true`, ca playerul să nu-i arate butonul de sunet.

## Cum e organizat

```
src/content/    sălile, opririle turului, textele
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
