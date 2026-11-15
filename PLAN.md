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

- [x] **Pas 2 — Săli + tur pe scroll.** Trusă comună (`src/three/rooms/kit.ts`) și patru săli construite după descrierile
  din articol (`buildRoom.ts`): galeria cu 34 de coloane octogonale, 67 de lustre și covor roșu; Sala Unirii cu luminator
  de sticlă și colonade; Sala Drepturilor Omului cu masa rotundă și 60 de scaune; Sala Cuza cu 7 luminatoare și logie.
  Pereții se văd doar din interior, deci din zbor și de pe hartă sălile apar ca machete secționate.
  *Gata când:* scroll în ambele sensuri trece lin prin toate sălile, fără salturi, cu indicator de sală activă.

- [x] **Pas 3 — Holograme + carusel.** Holograma fiecărei săli (`src/three/hologram/`): panou cu shader (tentă în culoarea
  sălii, linii de baleiaj, pâlpâire), pe soclu sau în rama de pe perete; imagine sau video. Filmările se schimbă din
  săgeți, puncte, tastele stânga/dreapta sau cu swipe pe hologramă ori pe card. Video-ul rulează doar cât sala e activă.
  O filmare de test MP4 (`scripts/make-test-video.mjs`) dovedește calea video.
  *Gata când:* swipe merge cu mouse și touch, video se oprește la ieșirea din sală, textul e lizibil.
  *Rămas:* ramele foto de pe pereții 3D. Fotografiile au deocamdată un rând de miniaturi cu casetă mare în panoul sălii
  (`ui/PhotoStrip.tsx`), care apare când pui poze în `rooms.ts`.

- [x] **Pas 4 — Harta 3D cu pinuri.** Palat transparent cu sălile văzute ca machete secționate, conturul fiecărei săli în
  culoarea ei, pinuri cu etichete care nu se acoperă între ele, evidențiere comună cu legenda, zbor în sală la click,
  link-uri directe (`#sala-unirii`) și buton Înapoi funcțional.
  *Gata când:* fiecare pin duce în sala corectă cu tranziție lină și se poate folosi și din tastatură (prin legendă).

- [x] **Pas 5 — Finisaj.** Scena se încarcă după text (77 kB gzip la pornire, scena cu three.js separat), cu mesaj de
  încărcare; fără WebGL sau la eroare pagina rămâne utilizabilă și filmările se văd în carduri; pe telefoane fără
  postprocesare; `prefers-reduced-motion` respectat în scroll, cameră și hologramă; orice filmare se poate deschide
  mare, cu comenzile browserului; cifrele au sursa, cu link și dată, în subsol. Restanțele sunt în `review/REVIEW.md`.

## Faza 2

Săli reale în 360°, design nou și fonturi cu aer roman. Planul întreg e în `PLAN-FAZA-2.md`.

- [x] **Pas 6 — Fundația de design.** Cinzel la titluri, EB Garamond la textul de lectură, Plex Mono la cifre;
  panouri de sticlă, butoane-pastilă, cifre romane, meandru desenat din cod.
- [x] **Pas 7 — Sala reală 360°.** Panorama Google Street View a sălii, prin încorporarea oficială, pe tot ecranul,
  cu filmările alături; cadrul se creează abia la clic. Au panoramă Galeria de Onoare și Sala Drepturilor Omului.
- [x] **Pas 8 — Hero.** Titlul sus, macheta mare la mijloc, un singur buton principal, cifrele la bază.
- [x] **Pas 9 — Sălile.** Panou compact cu „Despre sală” pliat, player de filmări pe un rând, holograme mai mari,
  covoare mai potolite.
- [x] **Pas 10 — Hartă și subsol.** Pinuri de sticlă cu cifre romane, sursele imaginilor și ale fonturilor.
- [ ] **Pas 11 — opțional.** Panoramă proprie în scena 3D, cu holograma în sala reală: cere fotografii 360° proprii.
- [x] **Pas 12 — Pagina de istorie.** Pagină separată, `istorie/`, cu link „Istorie” în bara de sus, lângă siglă. Opt capitole pe
  un fir cronologic care se umple la citire, cu cuprins; macheta 3D stă fixă alături și urmează povestea: palatul
  coboară în teren, apare dealul cu biserica Mihai Vodă și conturul viitoarei clădiri, se ridică terasele, biserica
  se mută spre est, palatul crește etaj cu etaj cu tăietura colorată ca la o machetă secționată, apoi cotele de 270 și
  240 m. Desen în cerneală pentru mutarea bisericii, două imagini vechi în domeniul public (gravura din 1841, fotografia
  bisericii din 1901–1904). Textul e scris după trei articole de pe Wikipedia, listate pe pagină.

Abateri față de `PLAN-FAZA-2.md`: Pasul 8 a fost făcut odată cu Pasul 6; sticla e la 82% (nu 72%) și bronzul mai
închis, pentru contrast; clasa `.pill` nu există, butoanele sunt direct pastile; restanțele de machetă din Pasul 10
(coronament, arcade, umbre de contact, `frameloop="demand"`) au rămas nefăcute. Două dintre cele patru linkuri primite
(galeria cu busturi și sala cu marmură roz) nu par să fie din cele patru săli ale turului și nu sunt folosite încă.

Abateri față de planul Pasului 12: fără WebGL, capitolele nu primesc un desen al fațadei, ci textul trece la mijloc;
dealul și biserica din scenă sunt schematice; cartierul Uranus nu apare, fiindcă articolul despre el nu există pe
Wikipedia în limba română și nu l-am putut verifica. Pornirea turului a crescut cu circa 2 kB (bara de sus și verificarea WebGL, comune
acum celor două pagini). Bara de sus arată pe telefoanele sub 420 px doar semnul siglei, ca să încapă „Istorie”.

## Faza 3

Site-ul devine suportul unei prezentări de arhitectură: juriul îl deschide pe telefon, dintr-un cod QR.

- [x] **Pas 13 — Publicare.** GitHub Pages, la fiecare push pe `main` (`.github/workflows/pages.yml`), la
  `https://stevenenson.github.io/Palatul-Parlamentului-/`. Adresa de bază vine din `BASE_PATH`. Codul QR al
  adresei e în `public/qr.svg` (`npm run qr`).
- [x] **Pas 14 — Orașul.** Oprire nouă la începutul turului: palatul văzut de sus, în cartier, pe o machetă
  albă a orașului făcută din date OpenStreetMap (`scripts/fetch-city.mjs` → `public/data/oras.json`, 147 kB
  comprimat). Cinci repere etichetate, axa Bulevardului Unirii trasă cu roșu și Catedrala Națională ca volum
  schematic. La scroll, camera coboară la macheta mare, iar clădirile orașului se retrag în hârtie. Pe telefon
  cadrul e altul: din axul bulevardului, mai de aproape, cu trei etichete.
- [x] **Pas 15 — Arhitectura.** Pagina de istorie devine „Istorie și arhitectură”, cu trei capitole noi înainte de
  „Palatul azi”: compoziția (axa bulevardului, trasă cu roșu peste machetă, văzută exact din ax), fațada (cele trei
  registre, marcate pe colțul clădirii) și materialele (macheta tăiată prin registrul median). „Palatul azi” are un
  paragraf despre Catedrala Națională, cu articolul ei ca a patra sursă. Pagina are acum unsprezece capitole.

- [x] **Pas 16 — Orașul din ArcGIS și apropierea.** La cererea utilizatorului, prima oprire arată scena ArcGIS
  (`topo-3d`: clădiri 3D detaliate, copaci, străzi), așezată lin peste macheta noastră după ce se încarcă. Scena nu
  primește gesturi: camera ei urmează cadru cu cadru camera turului, deci etichetele, rotirea și coborârea spre palat
  rămân aceleași. Macheta se poate apropia și depărta pe opririle în care se rotește (oraș, palat, hartă): butoane,
  ciupire pe telefon, Ctrl + rotiță, tastele + și −.

Abateri la Pasul 16: biblioteca Esri vine de pe serverul ei (nu din pachetul site-ului) și merge fără cheie; dacă
Esri va cere una, e nevoie de un cont gratuit ArcGIS. Numele de locuri ale Esri sunt ascunse. În scena ArcGIS palatul
e un bloc simplu; macheta noastră detaliată apare la coborâre. Pe telefon, scena ArcGIS se închide după ce turul
intră în săli, ca să elibereze memoria. Testele și capturile rulează fără ArcGIS (`?debug`), ca să nu depindă de rețea.

Abateri față de planul Pasului 14: n-am folosit ArcGIS, ci aceleași date OpenStreetMap, desenate în scena
noastră, ca trecerea de la oraș la palat să fie o singură mișcare de cameră și ca pagina să nu depindă de un
serviciu extern. Orașul nu aruncă umbre. Textul primului ecran s-a împărțit în două secțiuni: titlul în oraș,
cifrele și butonul „Începe turul” la machetă.

Abateri față de planul Pasului 15: capitolele spun doar ce are sursă. Înălțimile registrelor, traveea și detaliile
fațadei vin din fotografii, nu dintr-o sursă scrisă, deci apar fără cifre și cu mențiunea că împărțirea e a noastră.
Secțiunea arată volumele, nu încăperile.

## După test

Filmările și pozele reale, mai multe săli, versiune în engleză.

## De primit de la tine

- Filmările (MP4) și pozele reale ale sălilor. Pozele trebuie să fie ale tale sau cu permisiune:
  fotografiile cu palatul au restricții de drepturi.
- Opțional: 1–2 fotografii cu palatul care îți plac ca unghi, puse în `reference/`.
