# Palatul Parlamentului — tur 3D interactiv

Tracker-ul proiectului. Fiecare pas se termină cu un review făcut de agentul `pp-reviewer`,
care scrie în `review/REVIEW.md`. Observațiile se aplică înainte de pasul următor.

## Ce construim

- Hero cu palatul 3D pe tot ecranul, care se rotește cu drag stânga.
- Tur pe scroll: camera intră în palat și trece din sală în sală.
- În fiecare sală, o hologramă (pe masă sau pe perete) cu filmări între care dai swipe.
- O hartă 3D cu pinuri, din care sari cu tranziție în orice sală.

## Decizii

| Subiect | Decizie |
|---|---|
| Model exterior | Procedural, din cod. Modelul ArcGIS (CityEngine, licență Esri) nu se poate descărca, iar un model liber mai bun nu există. |
| Stil | Machetă arhitecturală: alb mat, muchii fine, umbre moi, fundal „hârtie”, o culoare de accent pe sală. |
| Săli | 3D stilizate din cod, plus rame cu poze reale pe pereți. |
| Filmări | Conținut de test acum; filmările reale se pun în `src/content/rooms.ts`. |
| Săli de test | Galeria de Onoare, Sala Unirii, Sala Drepturilor Omului, Sala Alexandru Ioan Cuza. |
| Limbă | Română. |

### Abateri față de planul inițial

- **Galeria de Onoare în loc de „Holul de Onoare”**: pentru galerie există date verificabile
  (150 × 18 m, 34 de coloane, 67 de candelabre); pentru hol nu am găsit.
- **Fără GSAP și Lenis**: scroll-ul rămâne cel nativ al browserului. Un director propriu
  (`src/scroll/director.ts`) îl leagă de poziția din tur și îl așază pe opriri. Sunt mai puține
  dependențe și nu se deturnează scroll-ul.

- **`img2threejs` doar pentru analiză**: am folosit etapele de analiză ale skill-ului pe fotografiile de referință
  (clasificare, proporții, inventar de detalii). Generatorul lui de cod construiește obiecte unice din primitive și cere
  dovezi de material fotorealist, deci nu se potrivește cu o machetă albă făcută din mii de elemente repetate; modelul
  e scris de mână după analiză și comparat cu fotografiile (`review/shots/pas-1/comparatie-fata.png`).
- **Postprocesare**: am adăugat `@react-three/postprocessing` pentru ocluzia ambientală, care dă adâncime machetei.
  `?ao=0` în adresă o oprește, pentru comparații.

## Arhitectură

- **Un singur canvas WebGL fix** în spatele paginii (`src/three/Scene.tsx`). Secțiunile DOM dau lungimea de scroll.
- **Scroll-ul e singura sursă de adevăr.** Fiecare oprire (`STOPS` din `src/three/poses.ts`) are o secțiune cu
  același `id`. Poziția din tur `t` merge de la 0 (exterior) la 5 (hartă).
- **Salturile lungi** (meniu, pin, legendă) mută scroll-ul instant și pornesc un zbor de cameră (`live.flightTo`).
- **Scară 1 unitate = 1 m.** Sălile stau în interiorul palatului, la poziții aproximative. Fațada principală privește spre +Z.
- **Starea pe cadru** stă în obiectul `live` (`src/state/tour.ts`), în afara React; starea discretă, într-un store zustand.
- **Conținutul** stă într-un singur fișier: `src/content/rooms.ts`.

## Comenzi

| Comandă | Ce face |
|---|---|
| `npm run dev` | server local de dezvoltare |
| `npm run build` | verificare de tipuri + build de producție |
| `npm run lint` | ESLint |
| `npm run shots -- pas-N` | capturi ale fiecărei opriri în `review/shots/pas-N/` |
| `npm run test:e2e` | teste rapide în browser (scroll, așezare, salturi, drag) |

## Pași

- [x] **Pas 0 — Fundație.** Scaffold, tokens de design, schelet de pagină, directorul de scroll, camera,
  scripturile de capturi și teste, agentul reviewer.
  *Gata când:* dev și build merg, capturile se generează, reviewer-ul scrie prima intrare.

- [x] **Pas 1 — Palatul 3D + hero.** Model procedural (`src/three/palace/`): terase, corp de bază de 270 × 240 m cu
  trei registre sub cornișa principală, pavilioane de colț, registru median cu curți interioare, turnuri laterale, turn
  central cu travee de capăt, portic cu coloane și balcon, plan de sit discret. Circa 1.500 de ferestre, pilaștri și
  coloane instanțiate, în câteva apeluri de desenare. Lumină razantă, umbre moi, ocluzie ambientală.
  *Gata când:* se recunoaște clar din față și din ¾ aerian, nu arată „ieftin”, drag-ul merge, rotița derulează pagina, rulează fluid.

- [ ] **Pas 2 — Săli + tur pe scroll.** Kit de sală parametric, fiecare sală cu elemente proprii;
  carcasa trece în transparență la intrare; panou cu numele și descrierea sălii.
  *Gata când:* scroll în ambele sensuri trece lin prin toate sălile, fără salturi, cu indicator de sală activă.

- [ ] **Pas 3 — Holograme + carusel.** Proiector, con de lumină, plan cu shader; imagine sau video;
  carusel cu swipe, săgeți și tastatură; card cu titlu și text; rame foto pe pereți cu lightbox.
  *Gata când:* swipe merge cu mouse și touch, video se oprește la ieșirea din sală, textul e lizibil.

- [ ] **Pas 4 — Harta 3D cu pinuri.** Palat transparent, sălile ca volume colorate, pinuri cu etichete, hover, legendă;
  click → zbor în sală; link-uri directe.
  *Gata când:* fiecare pin duce în sala corectă cu tranziție lină și se poate folosi și din tastatură.

- [ ] **Pas 5 — Finisaj.** Ecran de încărcare, mobil, mișcare redusă, fallback fără WebGL, performanță,
  texte verificate cu surse, credite. Review final și restanțele din `review/REVIEW.md`.

## După test

Filmările și pozele reale, mai multe săli, versiune în engleză, publicare online.

## De primit de la tine

- Filmările (MP4) și pozele reale ale sălilor. Pozele trebuie să fie ale tale sau cu permisiune:
  fotografiile cu palatul au restricții de drepturi.
- Opțional: 1–2 fotografii cu palatul care îți plac ca unghi, puse în `reference/`.
