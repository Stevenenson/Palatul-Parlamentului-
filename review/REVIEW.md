# Jurnal de review

Aici scrie agentul `pp-reviewer` după fiecare pas din `PLAN.md`. Cel care aplică îmbunătățirile
bifează ce a rezolvat și adaugă sub fiecare review o secțiune „Ce am aplicat”, cu ce a amânat și de ce.

Capturile de ecran folosite la review stau în `review/shots/` (nu intră în git).

## Pas 0 — Fundație · runda 1 · 14 noiembrie 2026

**Verdict:** APROBAT CU OBSERVAȚII

**Verificări rulate:** build ok (JS 1.157,85 kB, 318,35 kB gzip; CSS 20,12 kB; avertisment Vite pentru chunk peste 500 kB),
lint ok (0 probleme), teste 11 din 11, capturi 17 în `review/shots/pas-0-review/` (11 desktop 1440 × 900, 6 mobil 390 × 844),
fără erori în consolă. Commit verificat: `2a6caab`.

Cum am verificat, ca să se știe cât de sigură e fiecare observație:
- **în browser** (o sondă Playwright rulată din afara proiectului, pe build-ul de producție): Tab prin pagină, Enter pe
  „Hartă” urmat de Tab, săgeți / PageDown / Space / Home / End, o crestătură de rotiță;
- **prin calcul** cu valorile din cod: unghiul camerei în săli, lățimea vizibilă pe telefon;
- **cu sursa**: textul articolului „Palatul Parlamentului” de pe ro.wikipedia.org, descărcat azi;
- **doar din citirea codului** (marcat „neconfirmat în browser”): linkul direct cu `#ancoră`, secțiunile mai înalte decât
  fereastra, bara de scroll trasă cu mouse-ul, rotița orizontală, touch, lipsa WebGL. Sonda pentru ele nu a apucat să
  ruleze până la capăt; cine le repară să le confirme întâi cu un test.

### Criteriile pasului
- [x] dev și build merg — `npm run build` trece (tsc + vite build). `npm run dev` nu l-am pornit separat; folosește aceeași
  configurare Vite, iar testele și capturile rulează pe build + preview.
- [x] capturile se generează — `npm run shots -- pas-0-review` a scris 17 PNG-uri și a ieșit cu 0.
- [x] reviewer-ul scrie prima intrare — aceasta.

### Ce e bine
- Scroll-ul rămâne cel nativ. Rotița peste machetă derulează pagina, drag-ul o rotește, iar pe touch `touch-action: pan-y`
  lasă gestul vertical paginii. Nu există `preventDefault` pe wheel sau touch nicăieri.
- Împărțirea stării e curată: `live` pentru valorile pe cadru, zustand pentru cele discrete. `StopNav` se redesenează doar
  când se schimbă oprirea, nu la fiecare pixel de scroll.
- `100svh` pe secțiuni și `100lvh` pe scenă: bara de adrese de pe telefon nu schimbă nici ancorele, nici mărimea canvas-ului.
  `ResizeObserver` pe `body` reface ancorele și la încărcarea fonturilor.
- Zborul pornește din poziția reală a camerei (cu tot cu rotirea utilizatorului), deci nu sare la început; la sfârșit
  `live.t` e pus exact pe oprire, deci nu sare nici acolo. `prefers-reduced-motion` e tratat și în CSS, și în director, și în cameră.
- Textele sunt în română corectă, cu ș și ț cu virgulă, ghilimele românești, fără semne de exclamare. Filmările de test sunt
  marcate (`demo: true`, „Filmare de test”, „Loc rezervat pentru…”) și nu pun vorbe în gura nimănui.
- Capturile arată un schelet așezat: titlu, panouri și legendă lizibile pe desktop și pe mobil, holograma provizorie vizibilă
  deasupra panoului în toate cele patru săli pe telefon, nimic suprapus.

### Probleme
- [x] **(major)** `src/scroll/director.ts:83-96` — Navigarea cu Tab e stricată de așezare. Confirmat în browser la 1440 × 900:
  Tab de pe butoanele din hero duce focusul pe „Vezi sala pe hartă” din Galeria de Onoare, browserul aduce linkul în mijlocul
  ferestrei (t ≈ 1,27), iar `settle()` continuă spre oprirea 2. Pagina rămâne la y = 1800 cu linkul focusat la 247 px deasupra
  ferestrei. La fel pentru Sala Drepturilor Omului (pagina ajunge pe oprirea 4). Două din patru săli nu pot fi citite din
  tastatură. Rezolvare: la `focusin` într-o secțiune `.stop`, mergi la oprirea acelei secțiuni (`goToStop`), iar `settle()`
  să prefere secțiunea care conține `document.activeElement`.
- [x] **(major)** `src/ui/links.ts:11-15` — După un salt, focusul rămâne pe linkul apăsat. Confirmat: Enter pe „Hartă” duce la
  hartă (oprirea 5), dar următorul Tab pune focusul pe „Începe turul sălilor” și pagina se întoarce la y = 0. Din tastatură,
  legenda hărții se poate atinge doar trecând prin toate secțiunile. Rezolvare: după `goToStopId`, mută focusul pe titlul
  secțiunii țintă (`tabIndex={-1}` pe `h1`/`h2`, `focus({ preventScroll: true })`).
- [x] **(major)** `src/three/CameraRig.tsx:180` — Limita `phi ≤ 1.5` se aplică și poziției de bază a camerei, nu doar rotirii
  făcute de utilizator. În trei săli camera din `rooms.ts` privește ușor în sus (phi > 1,5), așa că e ridicată pe ascuns:
  Galeria de Onoare 3,4 m → 4,03 m, Sala Unirii 4,6 m → 7,03 m, Sala Cuza 5,2 m → 8,64 m (calculat cu aceleași formule; în
  `desktop-2-sala-unirii.png` linia pardoselii e la y ≈ 681, cât dă camera ridicată, nu 691). La Pasul 2 sălile se construiesc
  în jurul acestor poziții, deci trebuie reparat înainte. Rezolvare: limitează doar contribuția utilizatorului
  (`phi = clamp(phi0 - pitch, min(phi0, 0.2), max(phi0, 1.5))`) sau aplică limita numai pe opririle care se pot roti.
- [x] **(major)** `src/scroll/director.ts:20` — Pragul `COMMIT = 0.12` e o fracțiune din înălțimea ferestrei, deci pe ecrane
  obișnuite un gest mic e anulat. Confirmat: la 1920 × 1080 o crestătură de rotiță (100 px) derulează, apoi pagina revine la
  y = 0; abia două crestături trec la sală. O apăsare pe săgeată jos (40 px) revine mereu, la fel trei apăsări rare
  (la 600 ms). PageDown, Space, Home și End merg corect. O pagină care îți anulează scroll-ul se simte tocmai „deturnată”.
  Rezolvare: prag în pixeli (`min(0.12 × distanța, 60 px)`), iar pentru săgeți sus/jos și PageUp/PageDown, salt explicit
  cu `goToStop(stop ± 1)`.
- [x] **(major, neconfirmat în browser)** `src/scroll/director.ts:138-141` cu `:48-56` — Link direct cu ancoră la încărcare
  (`/#sala-unirii`). `initDirector` rulează într-un `useEffect`, imediat după primul render; dacă browserul nu a derulat
  încă la ancoră, `sync()` vede y = 0, consideră turul așezat pe oprirea 0 și `writeHash(0)` șterge ancora din adresă.
  Comentariul din `links.ts` promite că linkul merge deschis în filă nouă, iar niciun test nu acoperă cazul. Rezolvare:
  la pornire citește `location.hash`; dacă e o oprire, fă `scrollTo(anchors[i])` și pune `live.t` direct pe ea, fără zbor.
  Adaugă un test care deschide `/?debug#sala-unirii` și verifică oprirea, `scrollY` și ancora.
- [x] **(major, neconfirmat în browser)** `src/scroll/director.ts:83-96` cu `src/styles/global.css:104-109` — Așezarea presupune
  că o secțiune încape într-o fereastră. Când conținutul e mai înalt (telefon culcat 844 × 390, laptop cu fereastra joasă,
  în jur de 1366 × 650: titlul din hero are 4 rânduri de 70 px), partea de jos a panoului rămâne sub marginea ferestrei, iar
  ca să o vezi derulezi peste 12 % și pagina pleacă la oprirea următoare; sub 12 % revine. Textul de jos nu poate fi citit.
  Rezolvare: așază doar când secțiunea încape în fereastră; altfel lasă scroll liber în interiorul ei și așază abia la
  trecerea în secțiunea vecină. Merită o captură la 1366 × 650 și una la 844 × 390 în `shots.mjs`.
- [x] **(minor)** `src/three/poses.ts:103-108` — Pe telefon macheta e tăiată în stânga și în dreapta (`mobil-0-palat.png`,
  `mobil-5-harta.png`). Cu `fill = 0.66`, la 390 × 844 se văd 314 m la distanța țintei, iar amprenta de 270 × 240 m văzută din
  ¾ are 354 m. Palatul adevărat, cu terase, va fi și mai lat. De reglat la Pasul 1, pe model: `fill` spre 0,85 sau camera
  mai departe pe ecrane înguste.
- [x] **(minor, neconfirmat în browser)** `src/styles/global.css:552` și `src/three/poses.ts:115-118` — Două praguri diferite
  decid „mobil”: CSS-ul după lățime (760 px), camera după proporție (1,15). Pe o tabletă în picioare (820 × 1180) CSS-ul pune
  panoul în stânga, la mijloc, iar camera pune subiectul sus, în centru. Pe un telefon mic culcat (667 × 375) e invers.
  Rezolvare: o singură sursă, de exemplu camera citește același `matchMedia('(max-width: 760px)')`.
- [x] **(minor, neconfirmat în browser)** `src/scroll/director.ts:166` și `:175-177` — `onWheel` și `onKey` opresc animația de
  așezare, dar nu repornesc cronometrul. Un eveniment de rotiță care nu derulează (mișcare orizontală pe trackpad, coada
  inerției) lasă pagina între două opriri până la următorul scroll, timp în care macheta nu se poate roti (`settled` e fals).
  Rezolvare: după `cancelTween()`, rearmează `idleTimer`, cum face deja `onTouchEnd`.
- [x] **(minor, neconfirmat în browser)** `src/scroll/director.ts:98-106` — Bara de scroll trasă cu mouse-ul nu e recunoscută
  ca gest în curs. O pauză de 150 ms cu butonul apăsat pornește așezarea, care apoi rescrie poziția la fiecare cadru și se
  bate cu mâna utilizatorului. Rezolvare: ține un steag `pointerdown`/`pointerup` pe `window` (ca `touching`) și nu așeza cât
  e apăsat butonul.
- [x] **(minor)** `src/three/CameraRig.tsx:82-97` — Trei scăpări la pointer: (1) drag-ul se verifică doar la `pointerdown`,
  deci dacă ții butonul apăsat și dai din rotiță, rotirea continuă în tranzit și în sală; (2) `live.pointerX/Y` se scriu și
  pentru touch, deci în săli camera rămâne întoarsă cu până la 5,7° spre locul ultimei atingeri; (3) `hasOrbited` devine
  adevărat la primii pixeli ai unui swipe vertical, deși utilizatorul nu a rotit nimic. Rezolvare: eliberează drag-ul când
  `canOrbit()` devine fals sau `event.buttons === 0`; urmărește cursorul doar pentru `pointerType === 'mouse'`; marchează
  `hasOrbited` după o rotire de câteva grade.
- [x] **(minor)** `src/content/rooms.ts:100-104` — Sala Unirii nu se potrivește cu sursa. Articolul dă navei centrale
  „înălțimea medie de 15 m”, nu 16 m. „Zona centrală a palatului” nu apare; articolul spune că sala „se deschide direct către
  exterior, către parc” și că azi e folosită mai ales pentru târguri și expoziții. Covorul de 1.100 m² și tavanul de sticlă
  sunt corecte. De corectat cifra, locul și fraza despre folosire.
- [x] **(minor)** `src/content/rooms.ts:167-168` — Dimensiunile din hero au sursa în contradicție cu ea însăși. Introducerea
  articolului dă 270 × 240 m și 84 m; secțiunea „Dimensiunile clădirii” dă 270 × 245 m și 86 m. De ales o sursă primară
  (cdep.ro) și de spus în subsol de unde vine fiecare cifră. Data pietrei de temelie, 25 iunie 1984, e corectă: apare în
  textul articolului („așezarea pietrei fundamentale”); infocaseta are 1983 la începerea construcției, dar e alt câmp.
- [x] **(minor)** `src/content/rooms.ts:122` — La Sala Drepturilor Omului, `place` nu e un loc („Sală de 625 m², lambrisată în
  stejar”), deși în legenda hărții apare pe rândul de localizare, și repetă cifra din `facts`. Restul datelor sălii
  (625 m², 60 de scaune, candelabru de circa 2 t, al doilea ca mărime) se regăsesc în articol. Tot acolo, Galeria de Onoare:
  150 m, 18 m, 34 de coloane octogonale, 67 de lustre de cristal, latura de est — corecte; articolul spune „cu deschidere
  spre Piața Unirii”, turul spune „spre Piața Constituției”. Sala Cuza: circa 20 m, 2.040 m², etajul 1, logie spre Piața
  Constituției și Bulevardul Unirii — corecte.
- [ ] **(minor)** `src/ui/Hero.tsx:14-15` și `src/ui/MapSection.tsx:11` — Textul promite lucruri care nu există încă: „să asculți
  ce spun oamenii” (nu e nicio filmare) și „un pin de pe machetă” (pinurile vin la Pasul 4). La fel descrierea din
  `index.html`. De reformulat până atunci sau de bifat ca restanță pentru Pasul 3 și 4.
- [x] **(minor)** `src/styles/global.css:545-548` — Linkul „Mergi la începutul turului” din subsol are 25 px înălțime (măsurat),
  sub ținta de 44 px. Restul țintelor verificate au cel puțin 44 px.
- [x] **(minor)** `scripts/smoke.mjs:92-104` — Testul de drag verifică doar steagul `live.dragging` și dispariția indiciului,
  nu că s-a rotit camera. Lipsesc teste pentru: ancoră la încărcare, Tab, săgeți, așezare la scroll în sus, o fereastră de
  telefon. Toate cele 11 rulează la 1280 × 800.
- [x] **(minor)** `scripts/shots.mjs:47-61` — Pe mobil nu se fac capturi de tranzit și de subsol, deci subsolul pe telefon nu a
  putut fi judecat. Capturile hero diferă de la o rulare la alta din cauza legănării machetei (77.819 față de 77.923 octeți
  între `pas-0` și `pas-0-review`); pentru comparații între pași, oprește legănarea când pagina are `?debug`.
- [ ] **(minor)** `package.json:14` — `@react-three/drei` e instalat și nefolosit. Nu ajunge în bundle, dar ori se folosește
  la Pasul 1, ori se scoate.

### Îmbunătățiri propuse
- [x] Cu `prefers-reduced-motion`, renunță de tot la așezare. Acum pagina sare instant pe oprire la 150 ms după ce te-ai
  oprit, ceea ce e tot o mișcare neașteptată.
- [x] Salturile explicite (meniu, legendă, puncte) să folosească `pushState`, iar scroll-ul `replaceState`. Acum butonul
  Înapoi părăsește site-ul după un click pe „Hartă”.
- [x] Rotire din tastatură pe exterior și pe hartă (săgeți stânga/dreapta), ca „trage ca să rotești” să aibă un echivalent
  fără mouse.
- [x] `<Canvas resize={{ scroll: false }}>`: canvas-ul e fix, nu trebuie remăsurat la fiecare scroll.
- [x] În `useFrame` (`CameraRig.tsx:199-201`) se creează la fiecare cadru un șir (`key`) și un obiect (`framingAt`).
  Compară numerele direct și scrie într-un obiect refolosit.
- [x] Un steag `flying` actualizat și în `live.t` pe durata zborului: acum `live.t` rămâne la valoarea dinaintea saltului,
  deci un al doilea click dat în timpul zborului calculează distanța și arcul (`liftBetween`) față de o poziție veche.

### De reluat mai târziu
- [x] **Pas 1:** pe desktop, colțul din stânga al machetei intră sub lead și sub butoane (`desktop-0-palat.png`), iar colțul
  din dreapta ajunge la 50 px de punctele de navigare. Pe volumul alb nu deranjează; pe o fațadă cu coloane și ferestre textul
  va fi greu de citit. De reglat `cx` și distanța camerei odată cu modelul.
- [x] **Pas 1:** harta de umbre de 4096 × 4096 se redesenează la fiecare cadru, deși lumina și clădirea stau pe loc
  (`Scene.tsx:16`). `shadowMap.autoUpdate = false` plus o actualizare la schimbări; de măsurat pe un telefon real.
- [x] **Pas 2 / 4:** carcasa transparentă aruncă în continuare umbră plină pe sol (pata gri mare din `desktop-5-harta.png`).
  Opacitatea umbrei trebuie să urmeze `live.solid`.
- [ ] **Pas 4:** `.stage` are `aria-hidden`, deci pinurile din scenă nu vor fi accesibile; echivalentul lor din tastatură
  rămâne legenda, care trebuie să ducă la aceleași săli.
- [ ] **Pas 5:** nu există nicio limită de eroare în jurul lui `<Scene />`. Fără WebGL, eroarea din `<Canvas>` poate dărâma
  toată pagina, inclusiv textul (neconfirmat în browser). De pus un `ErrorBoundary` odată cu fallback-ul.
- [ ] **Pas 5:** `backdrop-filter` pe bara de sus și pe panouri, peste un canvas care se redesenează continuu, e scump pe
  telefoane. JS-ul de 1,16 MB merită împărțit: scena încărcată cu `import()` după text. Fonturile nu sunt preîncărcate.

### Ce am aplicat (runda 1)

Toate cele 6 probleme majore sunt rezolvate și acoperite de teste noi (`npm run test:e2e`: 22 din 22).

- **Tab și focus:** la `focusin` de la tastatură, turul merge pe secțiunea elementului focusat; după un salt, focusul trece
  pe titlul secțiunii țintă. Teste: „Tab duce turul pe secțiunea elementului focusat”, „după Enter pe «Hartă», Tab continuă
  din secțiunea hărții”.
- **Pragul de așezare:** e acum `min(12 % din drum, 60 px)`, iar săgețile sus/jos, PageUp/PageDown și Space sar explicit la
  oprirea vecină. Teste: „o singură crestătură de rotiță…”, „săgețile sus/jos…”.
- **Limita de unghi a camerei:** se aplică doar rotirii făcute de utilizator; pozițiile din `rooms.ts` sunt respectate.
- **Link direct cu ancoră:** citit la pornire, fără zbor și fără să fie șters. Test: „un link direct către o sală…”.
- **Secțiuni mai înalte decât fereastra:** turul rămâne pe oprire cât secțiunea se derulează; tranziția începe abia când
  marginea ei de jos ajunge la marginea ferestrei. Test la 1100 × 520 și capturi noi la 1366 × 650 (`laptop-jos-*`).
  Pe ferestre joase hero-ul are acum titlul mai mic și încape într-un ecran.
- **Minore rezolvate:** un singur prag pentru „îngust” (760 px, ca în CSS); cronometrul de așezare rearmat după rotiță și
  taste; bara de scroll ținută cu mouse-ul oprește așezarea (din citirea codului, fără test în browser); drag-ul se
  eliberează când turul pleacă de pe oprire, cursorul e urmărit doar pentru mouse, `hasOrbited` abia după o rotire reală;
  conținutul Sălii Unirii corectat după articol (15 m, 18 × 54 m, târguri și expoziții); `place` a devenit `note`;
  linkul din subsol are 44 px; testul de drag verifică acum că s-a mutat camera; capturi de subsol pe toate ferestrele și
  fără legănare în `?debug`.
- **Îmbunătățiri aplicate:** fără așezare la `prefers-reduced-motion`; `pushState` la salturile explicite (test pentru
  butonul Înapoi); rotire cu săgețile stânga/dreapta; `resize={{ scroll: false }}`; fără alocări în `useFrame`;
  `live.t` avansează și în timpul zborului.
- **De la „De reluat mai târziu”:** cadrul hero reglat pe modelul real; harta de umbre se desenează o singură dată;
  tăria umbrelor urmează opacitatea carcasei (`shadow.intensity`).

Amânate, cu motiv:

- **Dimensiunile clădirii:** site-ul oficial (cic.cdep.ro) nu a putut fi citit (eroare de certificat), deci sursa rămâne
  articolul Wikipedia; subsolul spune acum de unde vin cifrele și ce valoare am ales când articolul dă două.
- **Textele care promit filmări și pinuri:** devin adevărate la Pasul 3 și la Pasul 4; le verific atunci.
- **`@react-three/drei`:** rămâne până la Pasul 4, unde decid dacă pinurile îl folosesc; altfel îl scot.
- **Capturi de tranzit pe mobil:** nu le-am adăugat; tranzițiile se judecă pe desktop, iar pe mobil am adăugat subsolul.

## Pas 1 — Palatul 3D + hero · runda 1 · 14 noiembrie 2026

**Verdict:** NECESITĂ MODIFICĂRI

**Verificări rulate:** build ok (JS 1.389,30 kB, 421,23 kB gzip; CSS 20,43 kB; același avertisment Vite pentru chunk peste
500 kB), lint ok (0 probleme), teste 22 din 22, capturi 26 (12 desktop 1440 × 900, 7 laptop 1366 × 650, 7 mobil 390 × 844),
fără erori în consolă, GPU „ANGLE Metal, Apple M5 Pro”. Commit verificat: `5651210`, pe un instantaneu al lui; capturile au
rămas în instantaneu (`review-pas-1/review/shots/pas-1-review/` din scratchpad), nu în `review/shots/` din proiect.

Verdictul vine dintr-un singur criteriu, cel de aspect. Funcțional nu am găsit nimic stricat, iar cele două blocante sunt
reglaje (o lumină și tratarea ferestrelor), nu o refacere a modelului.

Cât de sigură e fiecare observație:
- **văzut pe captură**: doar `desktop-0-palat.png` și `desktop-0-palat-din-fata.png`, comparate cu `reference/palat-frontal.png`
  și `reference/palat-oblic.jpg`;
- **calculat din cod**: unghiurile luminii, pozițiile pe ecran (verificate pe captura de 1440 px: colțul clădirii iese la
  539 px din calcul și la circa 535 px în captură), numărul de ferestre și geometria îngropată, socotite de mână din `massing.ts`;
- **din citirea codului, neconfirmat în browser**: tot ce spun despre `director.ts`, `CameraRig.tsx` și trecerea în transparență;
- **neverificat**: review-ul s-a încheiat înainte să deschid restul capturilor. Nu am văzut `desktop-5-harta.png`,
  `desktop-tranzit-0_5.png`, `laptop-jos-0-palat.png`, `mobil-0-palat.png`, `mobil-5-harta.png` și nici celelalte 17. Nu am
  măsurat cadrele pe secundă și apelurile de desenare, nu am citit corpul testelor din `scripts/smoke.mjs` (le-am rulat doar)
  și nu am reverificat cifrele noi din `rooms.ts` cu articolul. Compoziția pe 1366 × 650 și pe 390 × 844 (punctul 4 din
  cerere) rămâne deci nejudecată pe imagine; pentru mobil dau mai jos doar un calcul.

### Criteriile pasului
- [x] se recunoaște clar din față — `desktop-0-palat-din-fata.png` față de `palat-frontal.png`: silueta în trei trepte, turnul
  central cu traveele de capăt mai înalte, turnurile laterale, pavilioanele de colț și porticul sunt la locul lor. Turnul
  ocupă 34 % din lățimea fațadei în captură și 32 % în fotografie.
- [x] se recunoaște din ¾ aerian — `desktop-0-palat.png`. Cu rezerva că unghiul e jos (camera stă la 7,5° deasupra
  orizontalei), deci „aerian” e mult spus, iar acoperișurile care se văd sunt plăci albe goale.
- [ ] nu arată „ieftin” — încă nu. E curat și ordonat, dar se citește ca un model low-poly cu ferestre desenate, nu ca o
  machetă: lumina nu separă volumele, ferestrele sunt plane albastru-gri lipite pe perete, pe exterior nu există muchii, iar
  acoperișurile și terasele sunt goale. Vezi cele două blocante și primul major.
- [x] drag-ul merge — testul „macheta se rotește cu drag și cu săgețile pe exterior” verifică mutarea camerei; captura din
  față e făcută cu patru apăsări pe săgeata stângă și arată macheta rotită.
- [x] rotița derulează pagina — testul „rotița derulează pagina și peste machetă”.
- [ ] rulează fluid — neverificat. Testele și capturile trec fără expirări pe un M5 Pro, ceea ce nu spune nimic despre un
  telefon. Nu există nicio măsurătoare și nicio variantă mai ieftină a ocluziei pentru ecrane mici (vezi al treilea major).

### Verificarea rundei 1 de la Pasul 0

Cele 6 majore, verificate prin teste (22 din 22) și prin citirea codului:
- **Tab și așezarea** — rezolvat. `onFocusIn` (`src/scroll/director.ts:306-316`) duce turul pe secțiunea elementului focusat
  și ține cont de secțiunile înalte; test propriu.
- **Focusul după salt** — rezolvat. `stopLink` cere `focus: true`, iar titlurile au `tabIndex={-1}`; test propriu. Apelul
  dublu `travel()` (o dată din `focusin`, o dată din `goToStop`) e inofensiv: al doilea reia aceeași țintă.
- **Limita de unghi** — rezolvat, din cod (`src/three/CameraRig.tsx:221-226`): fără rotire, `phi` rămâne exact cel din date.
  Nu are test. A apărut un efect secundar mic, trecut la minore.
- **Pragul de așezare** — rezolvat: `min(12 %, 60 px)` și salt explicit la săgeți, PageUp/PageDown și Space; două teste.
  Saltul explicit a adus cazul tastei ținute apăsat, trecut la minore.
- **Link direct cu ancoră** — rezolvat (`director.ts:210-215`); test propriu.
- **Secțiuni mai înalte decât fereastra** — rezolvat (`extra` și `leave()`, `director.ts:38-62`); test la 1100 × 520.
  Capturile `laptop-jos-*` există, dar nu le-am deschis.

Minorele bifate: pragul unic de 760 px, cronometrul rearmat, eliberarea drag-ului, cursorul doar pentru mouse, `hasOrbited`
după o rotire reală, `place` → `note`, corecturile la Sala Unirii, capturile de subsol și oprirea legănării în `?debug` se
regăsesc în cod. Două rezerve: bara de scroll ținută cu mouse-ul e rezolvată doar pentru barele clasice (vezi minore), iar
linkul de 44 px din subsol l-am văzut doar în CSS, nu l-am remăsurat. „Cadrul hero reglat” e adevărat pe jumătate: clădirea
nu mai intră sub text, dar a rămas la limită (vezi minore).

Amânările au fiecare un motiv scris (dimensiunile clădirii, textele despre filmări și pinuri, `drei`, tranzitul pe mobil).
Reparațiile nu au stricat nimic din ce acoperă testele; din citirea codului au apărut patru scăpări mici, toate la minore.

### Ce e bine
- Modelul e ieftin de desenat: 8 apeluri pentru tot palatul (sit, terase, volume, patru mesh-uri instanțiate, profile) și în
  jur de 40.000 de triunghiuri după socoteala mea. Rămâne loc pentru detaliu adevărat la ferestre.
- Proporțiile mari sunt credibile față de fotografii: turnul, rezalitul cu 15 travee (impar, deci cu fereastră în ax),
  registrul median cu 21, pavilioanele de 32 m, traveele de capăt ale turnului mai înalte decât corpul lui.
- Harta de umbre se desenează o dată, iar tăria umbrei urmează opacitatea carcasei, cum s-a cerut la Pasul 0. Cadrul
  camerei de umbre cuprinde toate terasele (colțul cel mai depărtat ajunge la 252 m din 260).
- Fundalul scenei se continuă în pagină fără cusătură, iar pe 1440 × 900 clădirea nu acoperă niciun text.
- `massing.ts` e doar date, `buildPalace.ts` doar construcție, iar oglindirile țin simetria fără duplicare. `?ao=0` și
  `?debug` fac comparațiile repetabile.

### Probleme
- [x] **(blocant)** `src/three/Scene.tsx:48` — Lumina nu e razantă și nu separă volumele. Cu soarele la `[-390, 420, 320]`,
  cele trei fețe care se văd în hero primesc aproape aceeași lumină: stânga 0,59, fațada 0,49, acoperișul 0,64 (produsul
  dintre normală și direcția luminii). Pe captură, pereții din stânga și din față au practic același alb, deci macheta pare
  plată. Un pilastru de 0,6 m aruncă 0,73 m de umbră, adică sub 2 px la distanța din hero; comentariul din cod promite
  „umbre lungi”. Rezolvare: adu soarele din dreapta și mai jos, de exemplu `[520, 330, 215]`. Fațada primește 0,33 (lumină
  la 19° față de planul ei, umbră de 1,45 m la pilaștri), fața din stânga cade în umbră, acoperișul rămâne cel mai deschis:
  trei tonuri distincte, iar umbra turnului cade pe aripa care se vede. Reverifică după aceea cadrul camerei de umbre.
- [x] **(blocant)** `src/three/palace/buildPalace.ts:115-133` și `:149` — Ferestrele sunt plane colorate așezate la 7 cm în
  fața peretelui: nu au gol, nu au ancadrament, nu prind nici umbră, nici ocluzie. Albastrul-gri `#97a3ab` e rece față de
  hârtia caldă și, la 6–8 px cât are o fereastră în hero, fațada arată ca un rând de puncte tipărite. Asta dă cel mai tare
  senzația de „ieftin”. Rezolvare: un ancadrament instanțiat care iese 0,25–0,35 m în jurul fiecărui gol (sau golul retras
  0,5 m, cu glafuri), geamul într-un gri cald mai închis, fără albastru. Bugetul de triunghiuri permite.
- [x] **(major)** `buildPalace.ts:293` și `:373-374` — Pe exterior nu există muchii: `edge.opacity` e 0 cât carcasa e opacă,
  deși direcția din `PLAN.md` e „alb mat, muchii fine”. Fără ele și cu lumina de acum, turnurile laterale se pierd în
  registrul median. Rezolvare: muchii la opacitate 0,2–0,3 și pe machetă opacă, dar construite din conturul reuniunii
  volumelor. Acum sunt luate cutie cu cutie (`:304-309`), deci ar apărea cusături pe pereți continui (la `x = ±97, z = 62`
  între `mid-front` și `mid-right`, la `x = ±40` între `mid-spine` și `rear-spine`); aceleași linii interioare se văd
  probabil deja în starea transparentă.
- [x] **(major, din citirea codului)** `buildPalace.ts:352-376` — Trecerea în transparență are un prag și scoate la iveală
  interiorul. (1) `depthWrite` se oprește la `solid = 0,6`, când peretele are încă opacitate 0,62: într-un singur cadru apar
  toate fețele din spate și dispare ocluzia de pe clădire, fiindcă N8AO citește adâncimea. (2) Volumele sunt cutii care
  intră una în alta, iar detaliul se pune și pe fețele îngropate: din circa 1.900 de poziții de fereastră, vreo 380 sunt în
  interiorul altui volum (fața bazei din spatele rezalitului, fețele interioare ale pavilioanelor și ale turnurilor
  laterale, spatele turnului), la fel 32 din cele 80 de coloane ale pavilioanelor. Cât macheta e opacă nu se văd; cât se
  stinge, se văd prin pereți. Pasul 2 se sprijină exact pe această trecere. Rezolvare: sari peste instanțele al căror punct
  cade în alt volum (un test punct-în-cutie în `addFacade` și `addPavilionColumns`); stinge întâi detaliul, apoi pereții,
  cu o trecere prealabilă de adâncime sau cu `alphaHash`, ca să nu existe comutare; scade ocluzia odată cu carcasa.
  De confirmat pe `desktop-tranzit-0_5.png` și pe două cadre de o parte și de alta a lui `t ≈ 0,39`.
- [x] **(major, nemăsurat)** `Scene.tsx:81-83` și `:103` — Ocluzia ambientală rulează la rezoluție întreagă, pe „medium”,
  cu MSAA 4 și `dpr` până la 1,75, la fiecare cadru, pe orice dispozitiv. Pe telefon costul e necunoscut și nu există o
  variantă mai ușoară, deci „rulează fluid” nu are nicio dovadă acolo. Pachetul a adus și 231 kB în bundle (103 kB gzip:
  de la 318 la 421 kB). Rezolvare: pe ecrane înguste sau cu touch, `halfRes` și calitate „low” ori „performance”, `dpr` cel
  mult 1,5; măsoară pe un telefon real, cu și fără `?ao=0`; expune în `__tour` numărul de apeluri și durata cadrului, ca
  testele să poată ține un buget.
- [ ] **(minor)** `src/three/poses.ts:26` și `src/three/palace/massing.ts:327-331` — Compoziția pe 1440 × 900 e la limită.
  Pavilionul din stânga începe la circa 13 px de capătul primului rând din lead; vârful terasei intră sub coloana de text
  (x ≈ 447, y ≈ 510); terasa de jos e tăiată de marginea din dreapta și trece pe sub ultimul punct de navigare. Clădirea
  ocupă 55 % din lățime, dar are doar vreo 300 px înălțime. Cu macheta rotită din față, terasa ajunge la 5 px de butonul
  „Vezi harta sălilor”. Rezolvare: terase mai strânse în față (`z1` 186 → circa 165), lead mai îngust, apoi clădirea adusă
  mai aproape.
- [ ] **(minor, din calcul)** `poses.ts:97-102` — Pe 390 × 844 macheta ar ocupa o fâșie de circa 270 × 100 px (clădirea între
  16 % și 86 % din lățime), iar colțul din dreapta al terasei ar ieși cu vreo 4 px din cadru. Captura mobilă nu am
  deschis-o. Dacă se confirmă, pe ecrane înguste merită o poziție de cameră mai sus (25–30°), ca amprenta să umple înălțimea.
- [x] **(minor)** `massing.ts:126-138` — Turnurile laterale sunt prea late și prea lipite de pavilioane: au 30 m, iar între
  ele și pavilion rămâne un șanț de 3 m (`x` 100–103, `z` 88–103), cu ferestre față în față. În `palat-frontal.png` au cam
  24 m și sunt despărțite clar de pavilion prin acoperișul aripii. O parte din diferență poate veni din perspectiva
  fotografiei. De încercat `x` 64–90.
- [x] **(minor)** `massing.ts:286-299` — Turnul central are 10 travee, deci un pilastru în ax; în fotografie arcada de sus
  are 11 ferestre, cu una în ax. Pe fețele simetrice numărul de travee ar trebui forțat impar.
- [x] **(minor)** `buildPalace.ts:218-233` — Coloanele pavilioanelor plutesc: stau la 1,25 m de perete, între 8,6 și 22 m,
  fără nimic dedesubt (brâul iese 0,38 m) și fără antablament deasupra. Nu se vede din hero, dar se vede de aproape.
  Rezolvare: o consolă și un antablament, sau coloane angajate la 0,7 m.
- [x] **(minor)** `buildPalace.ts:195-198` cu `massing.ts:315-324` — La portic, bazele coloanelor (0–1,1 m) sunt îngropate
  în podiumul de trepte (2,1 m), deci sunt geometrie moartă, iar coloanele ies direct din trepte. Pasul coloanelor (7,2 m)
  nu se potrivește cu traveea rezalitului (6,21 m), deci coloanele nu cad pe pilaștrii din spate.
- [x] **(minor)** `massing.ts:154-167` cu `:254-266` — Traveele de capăt ale turnului (`x` până la ±48) ies 8 m în consolă
  peste curțile interioare (`mid-spine` are doar ±40), cu fața de jos la 48 m. Se vede când utilizatorul ridică unghiul.
- [x] **(minor)** `massing.ts:273-285` cu `:74-80` — Acoperișul lui `rear-spine` (64 m) taie al treilea rând de ferestre de
  pe spatele turnului (62,4–66,7 m): rămân jumătăți de fereastră. De coborât la 61,8 m sau de sărit rândurile de sub el.
- [x] **(minor)** `buildPalace.ts:268-270` — Banda transversală din planul de sit se termină brusc, cu capăt drept, în golul
  dintre text și machetă (x ≈ 620, y ≈ 690 în hero). De scurtat la lățimea teraselor sau de estompat spre capete.
- [ ] **(minor)** `buildPalace.ts:370-375` cu `src/three/palace/Palace.tsx:21` — Harta de umbre de 4096 × 4096 se
  redesenează când detaliul dispare (`solid = 0,015`), deși tăria umbrei e deja 0, și încă o dată la întoarcere: două
  treceri inutile, în mijlocul tranziției. Obiectele nu se mișcă, deci harta veche rămâne bună; `update` poate să nu mai
  ceară nimic.
- [ ] **(minor, nemăsurat)** `buildPalace.ts:363-367` — La primul scroll, cele trei materiale trec pe `transparent` și se
  recompilează exact când pornește mișcarea. De măsurat; dacă se simte, compilează ambele variante la încărcare.
- [x] **(minor, din citirea codului)** `src/scroll/director.ts:269-303` — Tasta ținută apăsat sare în lanț: fiecare repetare
  pleacă de la oprirea țintă și cere următoarea, deci o jumătate de secundă pe săgeată jos duce până la hartă. Rezolvare:
  ignoră `event.repeat` (cu `preventDefault`, fără pas nou).
- [x] **(minor, din citirea codului)** `director.ts:76-87` și `:129-132` cu `CameraRig.tsx:183-188` — La sfârșitul unui
  zbor nu se resincronizează nimic. După Home de la hartă sau după săgeți în lanț, adresa păstrează ancora veche. Dacă
  dai din rotiță în timpul zborului, camera merge întâi la țintă și abia apoi revine, iar așezarea nu mai e rearmată.
  Rezolvare: la `flight.k >= 1`, cheamă din director o funcție care face `sync()` și `armSettle()`.
- [ ] **(minor, din citirea codului)** `director.ts:257-262` — Bara de scroll ținută cu mouse-ul e recunoscută doar când
  ocupă loc (`clientX >= clientWidth`). Cu barele suprapuse, implicite pe macOS, condiția nu e niciodată adevărată.
- [x] **(minor)** `CameraRig.tsx:221-226` — În sălile unde camera privește în sus (`phi` peste 1,5), limita superioară
  devine chiar `phi`, deci urmărirea cursorului merge pe verticală într-un singur sens. Limitează doar `r.pitch` și adaugă
  `lookPitch` după.
- [x] **(minor)** `src/content/rooms.ts` — Cifre noi, pe care nu le-am reverificat cu articolul: covorul „de circa 3 tone”,
  „7 luminatoare”, nava de „18 × 54 m”, „a doua ca suprafață”. Tot aici: `massing.ts:5` trimite la
  `.img2threejs/image-analysis.md`, iar `PLAN.md` la `review/shots/pas-1/comparatie-fata.png`; ambele sunt în `.gitignore`,
  deci cine clonează proiectul nu le găsește.

### Îmbunătățiri propuse
- [x] Acoperișuri: luminatoarele Sălii Unirii și ale Sălii Cuza, un atic retras și câteva linii de panouri. Dau scară, iar
  la Pasul 4 devin repere pe hartă.
- [ ] O captură în `shots.mjs` din unghiul fotografiei (jos, din ax, dinspre piață) și una de aproape cu porticul. Din hero,
  pilaștrii au 2 px, deci detaliul fațadei nu se poate judeca.
- [ ] `frameloop="demand"` cât turul stă pe o oprire și nu se mișcă nimic: acum scena și ocluzia se redesenează continuu.
- [x] `history.scrollRestoration = 'manual'`, ca butonul Înapoi să facă mereu zbor, nu un salt de scroll urmat de o
  trecere rapidă a camerei prin toate sălile (neconfirmat în browser; depinde de ordinea evenimentelor din browser).

### De reluat mai târziu
- [ ] **Runda 2:** capturile nedeschise acum (hartă, tranzit, laptop jos, mobil) și o măsurătoare de cadre pe secundă.
- [x] **Pas 3 / 4:** textele care promit filmări și pinuri (amânate la Pasul 0, încă valabile).
- [x] **Pas 4:** `@react-three/drei`, tot nefolosit; `.stage` cu `aria-hidden` și pinurile.
- [x] **Pas 5:** scena și postprocesarea încărcate cu `import()` după text (421 kB gzip într-un singur fișier); limită de
  eroare în jurul lui `<Scene />`; `backdrop-filter` peste canvas.

### Ce am aplicat (runda 1)

Cele două probleme blocante și cele trei majore sunt rezolvate; capturile noi sunt în `review/shots/pas-4/`.

- **Lumina:** soarele vine acum jos, din dreapta fațadei (`[470, 390, 300]`). Latura din stânga rămâne în umbră și
  desparte volumele, iar pavilioanele, porticul și ancadramentele aruncă umbre pe fațadă și pe terase. Am ridicat puțin
  umplerea difuză și am slăbit ocluzia ambientală, ca macheta să rămână albă, nu gri.
- **Ferestrele:** fiecare are acum un ancadrament care iese 36 cm din perete (montanți, buiandrug sau arhivoltă, glaf),
  iar geamul e gri cald, fără albastru. Umbra ancadramentului cade pe geam și dă golului adâncime.
- **Muchiile fine:** volumele și cornișele au contur subțire și pe macheta opacă (`edge.opacity` 0,2).
- **Trecerea în transparență:** ferestrele și pilaștrii îngropați în alte volume nu se mai construiesc deloc (`buried`),
  iar detaliul se stinge înaintea pereților.
- **Ocluzia ambientală și bundle-ul:** pe telefoane și tablete scena rulează fără postprocesare; biblioteca stă într-un
  fișier separat (97 kB gzip), încărcat doar pe calculatoare. Scena întreagă se încarcă după text: fișierul de pornire
  are acum 72 kB gzip în loc de 421. Scriptul de capturi măsoară cadrele pe secundă: 60 pe exterior, pe un M5 Pro.
- **Proporții și detalii:** turnurile laterale au 24 m în loc de 30; turnul central are 11 travee, cu fereastră în ax;
  coloanele care pluteau la pavilioane au dispărut; coloanele porticului stau pe ultima treaptă; corpul de sub turn e
  lățit ca traveele de capăt să nu mai iasă în consolă; banda transversală din planul de sit a fost scoasă; pe
  acoperișuri au apărut luminatoare.
- **Scăpările din director și cameră:** o tastă ținută apăsat mută turul o singură oprire; după un zbor, adresa și
  așezarea se pun la zi; privitul în jur merge în ambele sensuri și în sălile unde camera privește în sus;
  `scrollRestoration` e pe `manual`.
- **Cifrele din `rooms.ts`:** covorul de circa 3 t, cei 2.040 m², cele 7 luminatoare și logia vin cuvânt cu cuvânt din
  secțiunile „Sala Unirii” și „Sala A.I. Cuza” ale articolului, citite prin API-ul Wikipedia.

Rămase deschise:

- compoziția hero la limită pe 1440 × 900 și macheta mică pe telefon: de reglat după ce vede utilizatorul pagina;
- bara de scroll ținută cu mouse-ul pe macOS cu bare suprapuse: browserul nu dă niciun semnal pentru ea;
- harta de umbre refăcută la schimbarea vizibilității detaliului și recompilarea materialelor la primul scroll: nemăsurate;
- `frameloop="demand"` și o captură din unghiul fotografiilor: neimplementate.

## Pașii 2–5 · runda 1 și Pas 1 · runda 2 · 14 noiembrie 2026

**Verdict:** APROBAT CU OBSERVAȚII

Niciun blocant: pe desktop, Pașii 2–4 fac ce spun criteriile lor, cu teste. Sunt însă 6 majore, iar Pasul 5 nu poate fi
socotit închis până nu se rezolvă cele două ale lui. Cele două blocante de la Pasul 1 sunt rezolvate pe imagine.

**Verificări rulate:** build ok (fișier de pornire `index` 228,06 kB, 72,04 kB gzip; `Scene` 38,87 kB, 14,56 kB gzip;
`Effects` 214,56 kB, 97,52 kB gzip; bucata comună three/fiber `events` 930,62 kB, 247,97 kB gzip; CSS 25,88 kB, 5,26 kB gzip;
același avertisment Vite pentru chunk peste 500 kB), lint ok (0 probleme), teste 27 din 27, capturi 26 (10 desktop
1440 × 900, 6 laptop 1366 × 650, 6 mobil 390 × 844, din care 4 cadre de tranzit pe desktop), fără erori în consolă,
60 de cadre pe secundă pe exterior pe „ANGLE Metal, Apple M5 Pro”. Commit verificat: `4404c74`, pe un instantaneu al lui;
capturile au rămas în instantaneu (`review-final/review/shots/final-review/` din scratchpad), nu în `review/shots/` din proiect.

Cât de sigură e fiecare observație:
- **văzut pe captură** (10 imagini deschise, cât permitea limita): `desktop-0-palat`, `desktop-1` … `desktop-4` (cele patru
  săli), `desktop-5-harta`, `desktop-tranzit-1_5`, `mobil-1-galeria-de-onoare`, `mobil-5-harta`, plus `reference/palat-oblic.jpg`;
- **citit integral**: `rooms/kit.ts`, `rooms/buildRoom.ts`, `rooms/Rooms.tsx`, `hologram/Holograms.tsx`,
  `hologram/hologramMaterial.ts`, `state/swipe.ts`, `ui/RecordingCard.tsx`, `map/MapMarkers.tsx`, `ui/MapSection.tsx`,
  `three/Scene.tsx`, `three/Effects.tsx`, `App.tsx`, `ui/SceneBoundary.tsx`, `ui/Footer.tsx`, `content/rooms.ts`, partea de
  pointer din `CameraRig.tsx` (76–172);
- **verificat în build**: ce se încarcă la pornire (`dist/index.html` și primul rând din `dist/assets/index-*.js`);
- **neverificat**: celelalte 16 capturi (toate `laptop-jos-*`, `mobil-0/2/3/4`, tranzitele `0_5`, `2_5`, `4_5`, vederea din
  față a palatului); `buildPalace.ts` și `massing.ts` doar prin căutări punctuale, nu rând cu rând; `director.ts` deloc
  (testele trec); corpul testelor din `scripts/smoke.mjs` în afară de cel video; `ui/PhotoStrip.tsx` (nu se desenează,
  fiindcă `photos` e gol peste tot); Safari și un telefon real; rezerva fără WebGL doar din cod, nu într-un browser;
  cifrele din `rooms.ts` nu le-am recitit în articol.

### Pas 1 · runda 2: punctele din runda 1

- **(blocant) Lumina** — rezolvat, văzut pe `desktop-0-palat.png`. Soarele e la `[470, 390, 300]` (`Scene.tsx:57`): acoperișurile
  sunt cele mai deschise, fațada principală e luminată, latura lungă din stânga e vizibil mai gri. Volumele se despart.
- **(blocant) Ferestrele** — rezolvat pe imagine. Au ancadrament și geam gri cald; fațada nu mai arată ca un rând de puncte
  tipărite, iar parterul cu arcade se citește ca arcade.
- **(major) Muchiile** — rezolvat (`buildPalace.ts:465-466`, opacitate 0,2 pe macheta opacă); conturul fin se vede pe cornișe
  și pe turn.
- **(major) Trecerea în transparență** — parțial. `buried()` există și e folosit (`buildPalace.ts:115`, `:203`, `:211`), iar
  detaliul se stinge înaintea pereților. Pragul a rămas: `material.depthWrite = solid > 0.6` (`:460`), când peretele are
  încă opacitate peste 0,6. Nu l-am confirmat pe imagine (`desktop-tranzit-0_5.png` a rămas nedeschis). Trecut la minore.
- **(major) Ocluzia și bundle-ul** — parțial. Pe telefoane și tablete postprocesarea e oprită și `dpr` e cel mult 1,5
  (`Scene.tsx:74-77`, `:97`), iar `Effects` e fișier separat. Dar afirmația „fișierul de pornire are 72 kB gzip în loc de
  421” e adevărată doar pe hârtie: fișierul de pornire importă static bucata cu three.js (248 kB gzip). Vezi majorul de la
  Pasul 5. Cadrele pe secundă sunt măsurate tot numai pe M5 Pro (60).
- **Minorele bifate** — banda transversală din planul de sit a dispărut și luminatoarele de pe acoperiș există (văzute pe
  captură). Turnurile de 24 m, cele 11 travee, coloanele porticului, `rear-spine`, tasta ținută apăsat, sincronizarea
  după zbor și `scrollRestoration` nu le-am reverificat în cod; testele care le ating trec, iar captura nu le contrazice.
- **Rămase deschise** — toate patru au motiv scris. Compoziția hero pe 1440 × 900 e tot la limită pe captura nouă:
  pavilionul din stânga începe la circa 13 px de capătul primului rând din lead, iar terasa de jos e tăiată de marginea
  din dreapta și trece pe sub punctele de navigare.

**Mai arată „ieftin”?** Pe captura hero, nu. Se citește ca o machetă albă cu relief adevărat, nu ca un model low-poly.
Ce o mai ține sub nivelul fotografiei `palat-oblic.jpg`, în ordinea efectului:
1. acoperișurile sunt capace albe, fără atic: în fotografie fiecare treaptă se termină cu o cornișă grea și o balustradă.
   Un atic retras de 1,5–2 m pe fiecare volum ar da „coroana” siluetei în trepte;
2. registrul al doilea și pavilioanele au în realitate arcade adânci cu coloane; în machetă relieful e același peste tot
   (ancadrament de 36 cm). Trei–patru arcade retrase cu 1–1,5 m la pavilioane și pe rezalit ar prinde umbră adevărată;
3. terasele sunt trei plăci goale cu scări foarte mici: câteva linii de parapet sau de gard viu le-ar da scară.

### Criteriile pașilor

**Pas 1 (runda 2)**
- [x] nu arată „ieftin” — îndeplinit pe `desktop-0-palat.png`, cu cele trei rezerve de mai sus. Din față și pe mobil nu am
  deschis capturile.
- [ ] rulează fluid — 60 de cadre pe secundă pe M5 Pro, măsurate de scriptul de capturi. Pe telefon tot nemăsurat.

**Pas 2 — Săli + tur pe scroll**
- [x] scroll în ambele sensuri, fără salturi — testele „scroll-ul schimbă oprirea activă”, „scroll-ul parțial se așază pe
  oprirea următoare”, „la scroll în sus…”, „o singură crestătură de rotiță…”. Dintr-un singur cadru de tranzit nu pot
  judeca fluiditatea; cadrul în sine e slab compus (vezi minore).
- [x] indicator de sală activă — punctele din dreapta, văzute pe fiecare captură, cu punctul plin pe oprirea corectă.
- Recunoaștere din descriere: **Galeria de Onoare** da (două șiruri de coloane, covor roșu, șir de lustre, grinzi);
  **Sala Drepturilor Omului** da (masă inelară, 60 de scaune, lambriu, candelabru); **Sala Unirii** da (luminator cu ramă
  aurie, colonade, covor); **Sala Cuza** nu: se vede un singur luminator din 7 și nicio logie (vezi majorul).

**Pas 3 — Holograme + carusel**
- [x] swipe cu mouse și touch — testele „filmările se schimbă din săgeți, din puncte, din tastatură și cu swipe” și „pe
  telefon, un swipe orizontal pe hologramă schimbă filmarea”.
- [x] video se oprește la ieșirea din sală — testul „filmarea video rulează doar cât sala e activă” (`smoke.mjs:202-211`)
  și `Holograms.tsx:128-137`.
- [x] textul e lizibil — textul stă pe card, pe fond aproape opac, la mărimea textului de bază. Pe holograma de soclu
  imaginea se vede, dar are benzi gri în lateral (vezi majorul).
- [x] conținutul de test e marcat — eticheta „Conținut de test”, titlul „Filmare de test N”, „Loc rezervat pentru…” și
  „Aici intră prima filmare: …”. Nu pune nicio părere în gura cuiva.

**Pas 4 — Harta 3D cu pinuri**
- [x] fiecare pin duce în sala corectă — testul „fiecare pin de pe hartă duce în sala lui”; pe `desktop-5-harta.png` fiecare
  pin stă pe sala lui.
- [x] se poate folosi din tastatură prin legendă — testul „din legenda hărții se ajunge în sală”; legenda e o listă de
  linkuri, cu evidențiere comună cu pinurile la focus (`MapSection.tsx:31-34`).
- [x] etichetele nu se acoperă — pe desktop da; pe `mobil-5-harta.png` nu (vezi majorul).

**Pas 5 — Finisaj**
- [x] scena se încarcă după text — nu în fapt: three.js e pe drumul critic (vezi majorul).
- [x] mesaj de încărcare — „Se încarcă macheta” (`App.tsx:48-52`), ascuns la al treilea cadru desenat (`CameraRig.tsx:185`).
- [x] fără WebGL pagina rămâne utilizabilă — din cod: `hasWebGL()`, `SceneBoundary` și nota din hero. Filmările însă nu
  mai au unde să se vadă (vezi majorul). Niciun test nu acoperă cazul.
- [x] pe telefoane fără postprocesare — `Scene.tsx:74-77`.
- [x] `prefers-reduced-motion` — două teste pentru scroll; holograma oprește baleiajul și pâlpâirea (`Holograms.tsx:106-109`, `:124`).
- [x] sursa cifrelor în subsol — `Footer.tsx:12-14`; e numită, dar fără link și fără data consultării.

### Ce e bine
- Sălile costă puține apeluri de desenare: fiecare își unește piesele pe materiale (`Parts`, `kit.ts:48-69`), deci în jur de
  opt mesh-uri pe sală, cu materiale comune între săli.
- Galeria și Sala Drepturilor Omului arată a machetă îngrijită, nu a cutie: numerele din text (34 de coloane, 67 de
  lustre, 60 de scaune) sunt chiar construite în cod (`buildRoom.ts:72-76`, `:94-102`, `:181-189`).
- Gestul de swipe are un singur cod pentru scenă și pentru card (`swipe.ts`), cu anulare la `pointercancel` și la buton
  ridicat pe nevăzute (`CameraRig.tsx:110-114`, `:136`). Trecerea de la tras la filmarea nouă e continuă.
- Conținutul de test e cinstit: marcat vizibil, fără nume, fără citate inventate.
- Pinurile sunt linkuri reale din pagină, poziționate din scenă; legenda le dublează pentru tastatură, iar pinurile ies
  din ordinea de Tab ca să nu apară fiecare sală de două ori.
- Testele au crescut de la 22 la 27 și acoperă exact lucrurile noi: caruselul pe toate căile, video pornit și oprit,
  pinurile, swipe-ul pe telefon.

### Probleme

**Pas 1 (runda 2)**
- [ ] **(minor, din cod, neconfirmat pe imagine)** `src/three/palace/buildPalace.ts:460` — A rămas pragul din majorul 4 al
  rundei 1: `depthWrite` se oprește la `solid = 0,6`, când peretele are încă opacitate peste 0,6, deci într-un singur
  cadru pot apărea fețele din spate și dispare ocluzia. La `:458`, `material.needsUpdate` recompilează materialele la
  primul scroll (lăsat deschis, nemăsurat). Rezolvare: leagă `depthWrite` de un prag la care peretele e deja aproape
  transparent (sub 0,15) sau folosește `alphaHash`; confirmă pe `desktop-tranzit-0_5.png` și pe două cadre în jurul pragului.

**Pas 2 — Săli**
- [x] **(major)** `src/content/rooms.ts:169` cu `src/three/rooms/buildRoom.ts:201-228` — Sala Cuza nu se recunoaște din
  descriere. Cardul spune „7 luminatoare în plafon” și „logie amplă”, iar `desktop-4-sala-alexandru-ioan-cuza.png` arată un
  singur luminator, un perete gol cu un ecran și nicio arcadă: logia e pe peretele din dreapta camerei, ascunsă după
  coloane, iar luminatoarele din față sunt strivite de perspectivă (camera stă la 5,4 m sub un tavan de 19,6 m). Sala
  seamănă până la confuzie cu Sala Unirii: cutie albă, coloane, luminator, covor, ecran. Rezolvare: mută poziția camerei
  în colț și deschide unghiul (de încercat `eye: [-24, 4, -8]`, `look: [18, 9, 6]`, `fov` 58), ca să intre în cadru 4–5
  fâșii de luminator și arcadele logiei; sau mută holograma pe peretele opus logiei, ca logia să fie fundalul.
- [x] **(minor)** `src/three/rooms/kit.ts:78-82` cu `buildRoom.ts:76` — Coloanele „octogonale” ale galeriei ies rotunde pe
  captură: cilindrul cu 8 segmente păstrează normalele netede, deci fețele nu se văd. „34 de coloane octogonale” e
  cifra de pe card. Rezolvare: normale plate pentru coloanele cu 8 segmente (`toNonIndexed()` și `computeVertexNormals()`).
- [ ] **(minor, din calcul)** `kit.ts:184-206`, `buildRoom.ts:93-102`, `src/three/rooms/Rooms.tsx:9-20`, `kit.ts:61` — Lustrele
  galeriei au, după socoteala mea, circa 119.000 de triunghiuri (17 mari a câte ~2.100 și 50 mici a câte ~1.650; un bec
  are 80 de triunghiuri și ocupă 2–3 px). E de trei ori cât tot exteriorul palatului. Sălile sunt mereu vizibile, deci
  se desenează și în hero, în spatele carcasei opace. `toNonIndexed()` de la `:61` triplează în plus vârfurile, deși
  toate piesele din trusă au index. Pe M5 Pro nu se simte; pe telefon e nemăsurat. Rezolvare: becuri și inele
  instanțiate sau mult mai sărace (icosaedru de 20 de triunghiuri, tor 4 × 16), unire cu index, `group.visible = false`
  cât `live.solid` e peste 0,99.
- [x] **(minor)** `buildRoom.ts:55-58` cu `rooms.ts:124` și `:170` — Ramele de perete plutesc la circa 0,5 m în fața
  peretelui (rama la `x = -26,4`, peretele la `-27`; la Cuza 29,4 față de 30). Din poziția camerei nu se vede; se vede
  când privești în jur și pe hartă. Rezolvare: pune rama la 7 cm de perete și holograma în fața ei.
- [ ] **(minor)** `desktop-tranzit-1_5.png` — La jumătatea drumului dintre galerie și Sala Unirii, cam 70 % din ecran e
  hârtie goală cu câteva linii, iar sala de destinație stă în colțul din dreapta sus, pe sub bara de sus și pe sub
  cardul filmărilor galeriei. Nu e un salt, dar e un cadru mort. Rezolvare: întoarce privirea spre sala următoare mai
  devreme decât poziția (curbă separată pentru `look`), ca destinația să stea în mijlocul cadrului pe tot tranzitul.

**Pas 3 — Holograme + filmări**
- [x] **(major)** `src/three/hologram/hologramMaterial.ts:48-50` cu `src/three/hologram/Holograms.tsx:54-57` — Holograma de
  soclu are două benzi gri murdare în lateral. Panoul are proporția 1,39 : 1, imaginea de test e pe înalt, iar în afara
  imaginii shaderul desenează „geamul” întunecat (`tint * 0.12`) cu opacitate 0,36. Într-o sală albă nu arată a
  proiecție, ci a dreptunghi gri lipit în aer: se vede pe `desktop-1`, `desktop-3` și `mobil-1`, deci e primul lucru
  văzut la intrarea în tur. Filmările reale făcute cu telefonul pe înalt vor arăta la fel. Rezolvare: dă panoului
  proporția filmării curente (scalează mesh-ul pe X, interpolat cât durează alunecarea) sau aplică `backing` doar sub
  imagine și lasă restul complet transparent.
- [x] **(major, din cod, neverificat pe Safari)** `Holograms.tsx:133-135` cu `src/ui/RecordingCard.tsx:77` — Sunetul se
  pornește în afara gestului utilizatorului. Butonul schimbă doar `muted` din store, iar `video.muted = false` se aplică
  la cadrul următor, din `useFrame`. Regula WebKit e că un video care rulează fără gest și își pierde `muted` în afara
  unui gest este pus pe pauză; `play()` cerut apoi din buclă e respins, iar `catch(() => {})` ascunde eroarea și cererea
  se repetă la fiecare cadru. Pe iPhone, „Pornește sunetul” ar îngheța deci filmarea. Filmarea de test nu are pistă
  audio (scriptul nu generează una), deci testele nu pot prinde cazul. Rezolvare: în handlerul de click, pune sincron
  `muted` pe elementul video curent și cheamă `play()` acolo (un registru al elementelor video în `live`); după un
  `play()` respins, revino la `muted` și nu mai încerca la fiecare cadru. De verificat pe un iPhone cu o filmare cu voce.
- [x] **(minor)** `Holograms.tsx:83-89`, `:71`, `:36-41` — (1) La demontare, `removeAttribute('src')` fără `video.load()` nu
  eliberează resursa video. (2) Toate filmările din toate sălile se încarcă la pornirea scenei, iar același SVG de test
  se descarcă și se urcă pe placa video de 11 ori (cache-ul three e oprit implicit). Cu conținut real înseamnă toate
  imaginile și metadatele tuturor filmelor la început. Rezolvare: încarcă filmările unei săli când turul se apropie de
  ea (`|t − stop| < 1`) și eliberează-le când se îndepărtează.
- [x] **(minor)** `Holograms.tsx:100-138` — Fiecare hologramă lucrează la fiecare cadru și când e stinsă: citire din store,
  `containFit`, o funcție nouă pentru `forEach`. Rezolvare: ieșire timpurie când sala nu e activă și `power` e sub 0,01.
- [x] **(minor, din cod)** `src/state/swipe.ts:16-18`, `:31-43` cu `Holograms.tsx:108` — Gest întrerupt: dacă turul pleacă din
  sală cât ții apăsat (rotiță sau săgeată), `live.swipe` rămâne nenul și se aplică hologramei din sala următoare, iar la
  eliberare pasul se face în sala veche. Un al doilea deget suprascrie `startX`. Rezolvare: în `swipeMove`, dacă
  `activeRoom() !== room`, cheamă `swipeCancel()`; ține minte și `pointerId`.
- [x] **(minor)** `src/styles/global.css:772-776` și `:673-675` — Punctele caruselului au țintă de 28 × 44 px, sub cei 44 px
  pe lățime (săgețile au 44). `user-select: none` pe tot cardul face ca textul filmării să nu poată fi selectat sau
  copiat, ceea ce va conta când acolo va sta o transcriere. Rezolvare: puncte la 44 px sau mai rare; `user-select: none`
  doar cât durează gestul.
- [x] **(minor)** `RecordingCard.tsx:34` — `aria-live` e doar pe contor: cititorul de ecran aude „Filmarea 2 din 3”, dar nu
  și titlul și persoana. Pune regiunea live pe un element care le cuprinde pe toate trei.
- [ ] **(minor)** `RecordingCard.tsx:76-80` — „Pornește sunetul” apare pentru o filmare de test fără sunet, deci butonul nu
  face nimic audibil. Imaginea de test are un triunghi de redare care nu pornește nimic la click. Rezolvare: un ton
  scurt în filmarea de test (ar acoperi și majorul de mai sus) și fără simbol de redare pe imaginea statică.

**Pas 4 — Hartă**
- [x] **(major)** `src/three/map/MapMarkers.tsx:89-121` — Pe telefon, etichetele hărții sunt stricate (`mobil-5-harta.png`).
  Algoritmul ridică o etichetă până nu mai calcă altă etichetă, dar nu ține seama nici de bara de sus, nici de punctele
  și tijele celorlalte pinuri. Pe 390 px, „Sala Unirii” urcă trei trepte (tijă de 190 px) și ajunge sub bara de sus:
  nu se vede și nu se poate atinge. „Galeria de Onoare” acoperă punctele Sălii Unirii și Sălii Cuza, iar tija Sălii Cuza
  trece prin textul ei. Am refăcut calculul din pozițiile de pe captură și dă exact așezarea văzută. Rezolvare: pe ecrane
  înguste, pinuri numerotate 1–4 (cu aceleași numere în legendă) în loc de etichete cu nume, sau etichete așezate în
  lateral cu linie de legătură; în orice variantă, limitează poziția sub bara de sus și tratează punctele ca obstacole.
- [x] **(minor)** `MapMarkers.tsx:96` — `offsetWidth` se citește pentru fiecare pin la fiecare cadru, imediat după ce s-au
  scris `transform` și `opacity`: recalculare de layout forțată pe cadru cât se vede harta. Lățimile nu se schimbă; ține-le
  minte la înregistrarea pinului și la redimensionare.
- [ ] **(minor)** `desktop-5-harta.png` — Pe desktop, eticheta „Galeria de Onoare” acoperă jumătate din macheta Sălii Cuza.
  Aceeași tratare a sălilor ca obstacole ar rezolva și asta.

**Pas 5 — Finisaj**
- [x] **(major)** `src/ui/MapSection.tsx:4` (și de verificat `src/three/poses.ts`, importat din `state/swipe.ts:1`) — Scena
  nu se încarcă după text. `MapSection` importă `pinElements` din `three/map/MapMarkers.tsx`, care importă
  `@react-three/fiber` și `three`, deci biblioteca intră în graful static al paginii. Dovada din build: `dist/index.html`
  are `<link rel="modulepreload">` pentru `events-…js` (930,62 kB, 247,97 kB gzip), iar `index-…js` începe cu un import
  static din el. La pornire se descarcă și se interpretează deci 72 + 248 = 320 kB gzip înainte să apară orice text, nu
  72 kB cum scrie în „Ce am aplicat”. Întârziate sunt doar `Scene` (14,56 kB gzip) și `Effects` (97,52 kB gzip).
  Rezolvare: mută `pinElements` într-un modul fără importuri din three (de exemplu `src/state/pins.ts`); `poses.ts` să
  folosească tupluri simple sau doar `import type`; React într-o bucată proprie, ca să nu stea în aceeași bucată cu
  three. Criteriu de verificare: `dist/index.html` fără `modulepreload` către bucata cu three.
- [x] **(major)** `src/ui/RecordingCard.tsx` cu `src/App.tsx:41-47` — Filmările există doar ca textură în WebGL. Fără WebGL
  (rezerva de la `App.tsx:16-24`) cardul rămâne cu titlu și text, dar filmarea nu are unde să se vadă; cu WebGL, video-ul
  nu are pauză, derulare, subtitrări sau ecran mare și nu există pentru un cititor de ecran. Cu conținut de test nu
  doare; cu filmările reale, miezul paginii e inaccesibil pentru o parte din vizitatori. Rezolvare: un buton „Deschide
  filmarea” pe card, care arată un `<video controls>` (sau imaginea) într-o casetă, cum face deja `PhotoStrip` pentru
  poze; când `scene === 'failed'`, filmarea direct în card.
- [x] **(minor)** `App.tsx:48-52` cu `global.css:471-481` și `:1062-1069` — Mesajul de încărcare rămâne în pagină cu
  opacitate 0 și cu animația infinită pornită. Regula pentru mișcare redusă scurtează durata la 0,01 ms fără
  `animation-iteration-count: 1`, deci bara nu se oprește, ci se repetă de mii de ori pe secundă. Mesajul stă în
  `.stage`, care are `aria-hidden`, deci un cititor de ecran nu-l aude. Rezolvare: scoate elementul după ce scena e gata;
  adaugă `animation-iteration-count: 1` în regulă.
- [x] **(minor, nemăsurat)** `src/three/Scene.tsx:60` și `App.tsx:16-22` — Harta de umbre are 4096 × 4096 și pe telefoane
  (2048 ar ajunge acolo). `hasWebGL()` creează un context WebGL2 de probă pe care nu-l mai eliberează
  (`WEBGL_lose_context`).
- [x] **(minor)** `scripts/smoke.mjs` — Niciun test pentru rezerva fără WebGL și niciunul pentru mesajul de încărcare. Un
  test care pornește pagina cu `getContext` înlocuit să întoarcă `null` ar verifica nota din hero, legenda și linkurile.

**Texte**
- [x] **(minor)** `src/ui/Hero.tsx:17-18` — „să asculți ce spun oamenii despre clădire” promite ce pagina nu are încă:
  filmările sunt de test și fără sunet. Până vin cele reale: „și să vezi filmările din fiecare sală”.
- [x] **(minor)** `src/content/rooms.ts:73` — „Loc rezervat pentru un senior”: „senior” cu sensul acesta e anglicism; mai
  firesc „o persoană în vârstă”.
- [x] **(minor)** `src/ui/Footer.tsx:12-14` — Sursa cifrelor e numită, dar nu e link și nu are data consultării. Articolul
  se schimbă; pune adresa și data. Cifrele din `rooms.ts` nu le-am reverificat în articol în runda aceasta; intern se
  potrivesc (625 m² = 25 × 25, 2.040 m² = 60 × 34, nava de 18 × 54 m cu dimensiunile sălii din cod).

### Îmbunătățiri propuse
- [ ] Umbre de contact în săli: un disc moale, închis, sub fiecare coloană, sub masă și sub socluri, desenat o singură
  dată. Sălile nu au umbre de la soare, iar pe telefon nici ocluzie, deci acolo coloanele par să plutească pe podea.
- [ ] Atic retras pe acoperișuri și trei–patru arcade adânci la pavilioane și pe rezalit (vezi lista de la Pasul 1):
  cel mai mare câștig de asemănare cu fotografia pentru puțină geometrie.
- [ ] Sala Unirii și Sala Cuza să difere și prin altceva decât culoarea covorului: la Unirii camera mai jos și spre
  luminator, ca tavanul de sticlă să fie subiectul; la Cuza logia.
- [ ] Holograma de soclu puțin în lateralul axului galeriei, nu pe mijlocul covorului, ca perspectiva coloanelor să
  rămână liberă; cardul filmărilor acoperă acum și marginea soclului (`desktop-1`).
- [ ] O captură în `shots.mjs` cu harta pe 390 px după ce se repară etichetele și una fără WebGL, ca cele două cazuri să
  rămână sub ochi la fiecare pas.
- [ ] Rămase din runda 1 a Pasului 1 și încă valabile: `frameloop="demand"` cât turul stă pe o oprire; captura din
  unghiul fotografiei și una de aproape cu porticul.

### De reluat mai târziu
- [ ] **Capturile nedeschise:** `laptop-jos-*`, `mobil-0/2/3/4`, tranzitele `0_5`, `2_5`, `4_5` și palatul din față. Până
  atunci, compoziția pe 1366 × 650 și hero-ul pe telefon rămân nejudecate pe imagine, a doua oară la rând.
- [ ] **Telefon real:** cadre pe secundă în galerie (acolo sunt cele mai multe triunghiuri), sunetul pe iPhone, harta.
- [ ] **Ordinea pe mobil:** pe `mobil-1`, cardul filmărilor stă deasupra panoului sălii. De verificat dacă ordinea din DOM
  e aceeași cu cea de pe ecran, ca Tab și cititorul de ecran să nu sară în sus și în jos.
- [ ] **`PhotoStrip`:** nu se desenează cât `photos` e gol, deci nu l-am văzut și nu are test. De verificat cu prima poză reală.
- [ ] **Ramele foto de pe pereții 3D:** rămase din Pasul 3, cu motiv scris în `PLAN.md`.
- [ ] **Cifrele:** de recitit o dată în articol, cu link și dată, înainte de publicare.
- [ ] **Hero pe 1440 × 900 și macheta mică pe telefon:** lăsate deschise la Pasul 1, în așteptarea utilizatorului.

### Ce am aplicat (runda 1)

Toate cele 6 probleme majore sunt rezolvate. Testele din browser au crescut de la 27 la 29 și trec toate; capturile noi
sunt în `review/shots/final/`.

- **Sala Cuza:** camera privește acum în diagonală, cu logia luminată în dreapta și mai multe luminatoare în tavan;
  holograma e mai mare (17 m) și stă pe peretele din capăt. Nu mai seamănă cu Sala Unirii.
- **Holograma de soclu:** panoul ia forma filmării din față, deci nu mai are benzi gri pe lateral.
- **Sunetul filmărilor:** „Pornește sunetul” și „Pune pauză” acționează asupra filmării chiar în click
  (`state/media.ts`), nu în bucla de desenare. Pe iPhone și Safari tot trebuie încercat cu o filmare cu voce.
- **Harta pe telefon:** pinurile arată numărul sălii, același cu cel din legendă; nu se mai acoperă și nu mai ies sub
  bara de sus.
- **three.js în afara pornirii:** opririle și registrul pinurilor stau în module fără three (`content/stops.ts`,
  `state/pins.ts`). `dist/index.html` nu mai are niciun `modulepreload`; la pornire se încarcă 77 kB gzip, iar scena
  (256 kB gzip, cu three.js) vine după text.
- **Filmările în afara scenei:** orice filmare se poate deschide mare, într-o casetă cu comenzile browserului
  („Deschide filmarea”); fără WebGL, filmarea apare direct în card. Ambele cazuri au test.
- **Minore rezolvate:** coloane octogonale cu muchii; ramele hologramelor lipite de perete; video eliberat cu `load()`;
  holograma stinsă nu mai calculează nimic; un swipe se anulează dacă turul pleacă din sală; punctele caruselului au
  44 px; cititorul de ecran aude titlul filmării noi; lățimile etichetelor de pe hartă se măsoară o singură dată;
  mesajul de încărcare dispare din pagină când scena e gata; hartă de umbre de 2048 px pe telefoane; contextul WebGL
  de probă e eliberat; textele „să asculți ce spun oamenii” și „senior” corectate; sursa cifrelor are link și dată.

Rămase deschise, cu motiv:

- **Aspectul machetei:** aticul de pe acoperișuri, arcadele adânci de la pavilioane și terasele mai puțin goale sunt
  îmbunătățiri de asemănare, nu defecte; le fac după ce vede utilizatorul macheta și spune ce contează pentru el.
- **Butonul de sunet la filmarea de test:** filmarea generată nu are pistă audio; butonul capătă rost la filmările reale.
- **Pragul `depthWrite`, lustrele, cadrul de tranzit dintre galerie și Sala Unirii, eticheta „Galeria de Onoare” peste
  Sala Cuza pe desktop:** minore, nejudecate încă pe imagine de reviewer.
- **Telefon real, Safari, `PhotoStrip` cu poze adevărate, ramele foto de pe pereții 3D:** au nevoie de dispozitive și de
  materialele utilizatorului.

## Faza 2 — Pașii 6 și 8 · runda 1 · 2026-11-14

**Verdict:** NECESITĂ MODIFICĂRI — două reparații mici (contrastul supratitlului, sticla fără estompare); restul e bun.

**Verificări rulate** (instantaneul `b8fd831`): build ok — `index` 244,91 kB / 77,63 kB gzip, CSS 33,22 kB / 6,27 kB
gzip, `Scene` 955,16 kB / 256,23 kB gzip, `Effects` 214,58 kB / 97,52 kB gzip; lint ok, 0 probleme; teste 29 din 29;
capturi 26, în `review/shots/f2-pas6-review/` (am deschis 6), fără erori în consolă, 60 cadre/s. Contrastul l-am
măsurat pe pixelii capturilor. Abaterea de ordine (Pasul 8 înaintea Pasului 7) nu strică nimic.

### Criteriile pașilor
- [x] Pas 6: titlurile în Cinzel, diacritice corecte — „BUCUREȘTI” (Ș cu virgulă) și „HARTA SĂLILOR” se văd bine;
  „Săli”/„Hartă” din bară sunt în Plex. Ț, Â și Î nu apar în niciun titlu din cele 6 capturi: nu le-am putut vedea.
- [ ] Pas 6: contrast de cel puțin 4,5:1 pe sticlă peste covorul albastru — textul gri trece (4,83:1), titlul 12,2:1,
  citatul 6,7:1; **supratitlul „SALA II DIN IV” pe telefon are 4,12:1** (`mobil-2-sala-unirii.png`).
- [x] Pas 6: testele trec (29 din 29); pornirea 77,63 kB gzip (sub 85); `index` nu conține three.js, `Scene` da.
- [x] Pas 8: 1440×900 — clădirea ține de la x≈268 la x≈1196, adică 64% din lățime, cu tot cu esplanadă, netăiată.
- [x] Pas 8: 390×844 — clădirea ocupă 82% din lățime; esplanada e tăiată de ambele margini (clădirea nu).
- [x] Pas 8: titlul nu acoperă macheta la niciuna dintre cele trei mărimi; un singur buton plin plus un link.
- Neverificat: stingerea titlului la derulare și meandrul de încărcare (nu apar în capturi), Safari, telefon real.

### Ce e bine
- Hero-ul e clar mai bun decât cel din `final/`: titlul pe un rând, macheta la mijloc și întreagă, o singură
  acțiune. Capitalele Cinzel peste macheta albă dau în sfârșit nota de monument; Garamond la 23 px se citește ușor.
- Cifrele romane au variantă arabă pentru cititoarele de ecran; fără `text-transform`; `framingAt` nu alocă pe cadru.

### Probleme
- [ ] **(blocant)** `src/styles/tokens.css:16` — `--bronze` (#7d5f27) pe sticla de peste covorul albastru (fundal
  rezultat 204/216/235) dă 4,12:1 la un text de 11 px; criteriul Pasului 6 cere 4,5:1. Reparație: un bronz mai închis
  pentru textul de pe sticlă (de exemplu #6b5020, circa 5,2:1) sau sticlă la 0,86 în panourile sălilor.
- [ ] **(major)** `src/styles/global.css:70-71, 226-227, 510-511, 853-854` — în `dist` nu rămâne nicio declarație
  `backdrop-filter` fără prefix: minificatorul păstrează doar `-webkit-backdrop-filter` (5 apariții cu prefix, 0 fără,
  în afară de condiția `@supports`). Chrome și Firefox nu cunosc prefixul, deci panourile sunt doar semitransparente:
  în capturi muchia covorului și silueta coloanei trec nete pe sub text, iar culoarea e exact amestecul alfa, fără
  `saturate`. Am verificat separat că același Chrome estompează corect o pagină de probă, deci nu e o limită a
  capturilor. Reparație: scrie întâi varianta cu prefix și apoi pe cea standard (sau valori literale în loc de
  `var()`, ori `build.cssTarget`), verifică în `dist` și adaugă un test: `getComputedStyle(panou).backdropFilter`
  diferit de `none`. Remăsoară contrastul după aceea.
- [ ] **(major)** `src/three/poses.ts:20, 100` — la 1440×900 și 1366×650 butonul „Începe turul” stă peste colțul din
  față al esplanadei, iar linkul peste desenul pieței: macheta pare tăiată de buton. Reparație: `cy` de exterior
  0,55 → circa 0,50 sau camera puțin mai departe, până rămân 24 px liberi între esplanadă și buton.
- [ ] **(minor)** `src/ui/Hero.tsx:21` — „ascultă oamenii din fiecare” readuce promisiunea scoasă la review-ul final
  (filmările sunt de test și fără sunet). Până vin cele reale: „și vezi filmările din fiecare”.
- [ ] **(minor)** `src/styles/tokens.css:21-22` — lipsește rezerva `Georgia` cu `size-adjust` cerută de plan. Pe
  telefon titlul are două rânduri în Cinzel și probabil unul în Georgia, deci textul sare la sosirea fontului.
  CLS nemăsurat.
- [ ] **(minor)** `src/styles/global.css:66-153` — `.pill` din lista Pasului 6 nu există; `.glass`, `.segmented` și
  `.icon-btn` nu sunt folosite nicăieri, iar `.panel` și `.recording` repetă declarațiile din `.glass`.
- [ ] **(minor)** `mobil-0-palat.png` — a treia cifră („25 iunie 1984”) cade singură pe rândul al doilea. În săli
  sunt trei suprafețe de sticlă pe ecran (bară, panou, filmare); planul spune cel mult două (de văzut la Pasul 9).

### Îmbunătățiri propuse
- [ ] Meandrul e desenat din șapte bucăți despărțite, care la 11 px se citesc ca un șir de cifre. Leagă-le printr-o
  linie de bază continuă (`h20` în loc de `h15`) și lățește-l la 160–200 px, ca să arate a friză.
- [ ] Pe telefon macheta ocupă o cincime din înălțime, între două benzi goale: o poză de exterior mai frontală și
  mai de sus ar umple golul și ar scoate esplanada din margini; cifrele pe trei coloane egale, la 15 px.
- [ ] Prea multe voci: hero-ul și panoul sălii amestecă patru familii de litere. Indiciul „Trage ca să rotești
  macheta” pe Plex Sans, valorile cifrelor la grosime 400, paragraful sălii în Garamond de 19 px.
- [ ] Covorul amestecat cu pardoseala (circa 35% accent) merită adus înaintea Pasului 9: pe telefon ambele panouri
  ies albăstrui și arată a carduri colorate, nu a sticlă peste piatră.

### Ce am aplicat (runda 1)

- [x] **Blocant, contrastul supratitlului:** `--bronze` e acum `#6b5020`, iar sticla la 82%.
- [x] **Major, estomparea dispărută la build:** am scos declarațiile scrise de mână cu prefix; minificatorul le
  generează acum pe amândouă (4 cu prefix, 4 fără, verificat în `dist`). Test nou: `backdropFilter` al panoului conține `blur`.
- [x] **Major, butonul peste esplanadă:** camera de exterior e puțin mai departe și macheta mai sus (`cy` 0,515).
- [x] **Minor, „ascultă oamenii”:** înlocuit cu „vezi filmările din fiecare”.
- [x] **Minor, a treia cifră singură pe rând, pe telefon:** cifrele stau pe trei coloane.
- [x] **Minor, clase nefolosite:** `.segmented` și `.icon-btn` sunt folosite de la Pașii 7 și 9. `.pill` nu există: butoanele sunt direct pastile.
- [x] **Propuneri:** meandrul are linia de bază continuă și e mai lat; indiciul de rotire e pe Plex Sans, cifrele la
  grosime 400; covorul e amestecat pe jumătate cu pardoseala.
- [ ] **Amânat, rezerva de font cu `size-adjust`:** cere măsurarea lățimilor reale ale Cinzel față de Georgia; fără
  măsurătoare aș pune cifre ghicite. CLS rămâne nemăsurat.
- [ ] **Amânat, macheta mică pe telefon:** cere o poză de exterior separată pentru ecrane înguste; de făcut odată cu
  restanțele de machetă.
- **Trei suprafețe de sticlă în săli** (bară, panou, player): am păstrat-o; bara de sus e subțire și fixă.


## Faza 2 — Pașii 7, 9 și 10 · runda 1 (și Pașii 6 și 8 · runda 2) · 2026-11-14

**Verdict:** APROBAT CU OBSERVAȚII — nicio problemă blocantă; trei majore, mici ca efort, de rezolvat înainte de publicare.

**Verificări rulate** (instantaneul `591f820`): build ok — `index` 250,91 kB / 79,51 kB gzip, CSS 36,39 kB / 7,02 kB gzip, `Scene` 955,25 kB / 256,27 kB gzip, `Effects` 214,58 kB / 97,52 kB gzip; lint ok, 0 probleme; teste 31 din 31; capturi 29, în `review/shots/f2-final-review/` (am deschis 7), fără erori în consolă, 60 cadre/s pe exterior. În plus am măsurat, într-un Chrome fără fereastră, pe versiunea construită: dreptunghiurile panourilor, comenzile, contrastul și foaia 360°.

**Neverificat:** cadrul Google adevărat (în teste și capturi e înlocuit): atribuirea întreagă la cele trei mărimi, direcția de pornire și dacă cele două panorame chiar sunt Galeria de Onoare și Sala Drepturilor Omului — trebuie văzute de un om, într-un browser. Tot neverificate: cadrele pe secundă în săli (scriptul măsoară doar exteriorul), Safari, telefon real. Capturile `laptop-jos` și subsolul le-am judecat din măsurători și din cod, nu din imagine.

### Runda 2 — Pașii 6 și 8
- **Contrastul supratitlului: rezolvat.** Cu `--bronze` #6b5020, pe pixelii reali din spatele textului: minimum 6,17:1 (Sala Drepturilor Omului, 1366×650), 6,44–6,54:1 pe telefon. Pragul e 4,5:1.
- **Estomparea în `dist`: rezolvată.** CSS-ul construit are 5 declarații `backdrop-filter` fără prefix și 5 cu; valoarea calculată e `blur(24px) saturate(1.6)` pe `.panel`, `.recording` și `.segmented` la toate cele trei mărimi; există test. În capturi, muchia covorului nu mai trece netă pe sub text.
- **Butonul peste esplanadă: rezolvat la 1440×900, la limită la 1366×650.** Deasupra butonului sunt 23 px liberi pe desktop, dar numai 4 px pe laptopul jos (măsurat pe pixeli; nu se suprapun, dar aproape se ating).

### Criteriile pașilor
- [x] Pas 7: nicio imagine Google în repo (`git ls-files public`: favicon și două fișiere de test proprii); în `src` există doar trei adrese Google (`maps/embed`, `maps/embed/v1/streetview`, `maps/@`), nicio adresă de plăci de imagine.
- [x] Pas 7: 0 cereri către Google înainte de clic, 1 după (adresa cadrului); la închidere cadrul dispare din DOM.
- [x] Pas 7: nimic peste cadru (86 de puncte verificate cu `elementFromPoint`, 0 acoperite), colțuri de 6 px, `title` corect, Esc închide și focusul revine pe „Sala reală 360°”, scena nu mai desenează (test), `html` are `overflow: hidden` cât e deschisă foaia, Tab rămâne în foaie.
- [x] Pas 7: butonul apare doar la sălile I și III (cele cu `streetView`); legenda hărții are semnul „360°” la aceleași două.
- [ ] Pas 7: „filmările se schimbă din foaie” — pe desktop da; pe telefon săgețile sunt ascunse sub marginea coloanei (problema 1).
- [ ] Pas 7: testul cerut de plan pentru `fromArtsLink` pe varianta „CAIS” lipsește (problema 3).
- [x] Pas 9: panourile acoperă 15,9–18,6% din ecran la 1440×900 (20,6–24,5% la 1366×650; pe telefon 43–50%, în afara criteriului).
- [x] Pas 9: comenzile filmării stau pe un rând la toate cele trei mărimi (0 px diferență între centre); niciun buton fără nume accesibil; butonul de sunet e condiționat de `silent` (`RecordingCard.tsx:154`). Toate filmările de test sunt mute, deci ramura cu sunet nu a rulat niciodată.
- [x] Pas 9: holograma din Sala Unirii are 568 px cu ramă, adică 39,4% din 1440; imaginea singură are 535 px (37,2%). Trece, la limită.
- [ ] Pas 9: 55 de cadre pe secundă cu sticla activă — nemăsurat în săli.
- [x] Pas 10: pinurile și legenda au cifre romane; subsolul numește Google Street View, Cinzel și EB Garamond (licența SIL Open Font).

### Ce e bine
- Respectarea regulilor Google e făcută serios: se păstrează doar identificatorul și direcția, cadrul se creează la cerere și se distruge la închidere, capturile folosesc un înlocuitor, iar subsolul spune clar că imaginile nu sunt copiate.
- Foaia 360° e curată pe desktop: o bară, cadrul, o coloană, un rând de sursă; nimic de-al nostru nu atinge cadrul.
- Sălile respiră: panourile au scăzut sub 19% din ecran, „Despre sală” e pliat, playerul e un singur rând. Hero-ul și harta arată a produs lucrat; pastilele cu cifre romane se citesc dintr-o privire.

### Probleme
- [ ] **(major)** `src/styles/global.css:1244-1258` — pe telefon, în foaia 360°, săgețile de schimbat filmarea sunt cu 67 px sub marginea coloanei, care se derulează fără niciun semn; ultimul rând de text e tăiat de margine (`mobil-360.png`). Vizitatorul nu are de unde ști că filmarea se poate schimba. Reparație: mută săgețile pe rândul cu „Filmarea 1 din 3” și pune imaginea lângă text (96 px lată) în loc de deasupra.
- [ ] **(major)** `src/ui/RealRoom.tsx:19-29` — cu foaia deschisă, butonul Înapoi al browserului nu o închide: pagina de dedesubt sare la hero (ancora dispare, `scrollY` 0), foaia rămâne pe „Galeria de Onoare”, iar la Esc vizitatorul se trezește în altă parte. Pe telefon, Înapoi e gestul firesc de închidere. Reparație: `history.pushState` la deschidere și închidere pe `popstate` (sau măcar `set({ real: null })` la `popstate`), plus un test.
- [ ] **(major)** `src/content/streetView.ts:27-32, 39` și `src/content/rooms.ts:117, 167` — `fromArtsLink` rulează la încărcarea modulului, deci un link greșit lipit pentru sălile II și IV lasă pagina albă. Cazuri găsite: link fără `https://` aruncă „Invalid URL”, nu eroarea clară cerută; un `sv_pid` „CAIS” cu octeți după identificator îi păstrează în `pano` (`slice(4)` ignoră lungimea din antet); `startsWith('CAIS')` fără verificarea lungimii strică un identificator brut care începe așa; `atob` aruncă o eroare fără legătură cu linkul. Testul „CAIS” din plan nu există. Reparație: `slice(4, 4 + lungime)`, despachetare doar dacă `id.length > 22`, validare `/^[\w-]{22}$/` cu mesaj clar, `try/catch` în `rooms.ts` care doar scoate butonul, și testul cerut.
- [ ] **(minor)** `src/content/streetView.ts:43, 46-47` — `searchParams.get` decodează deja, deci `decodeURIComponent` e a doua decodare (aruncă pe un „%” rămas); fără `sv_lat`/`sv_lng` adresa primește `!1d0!2d0`. `zoom` din plan nu e întors, iar `loading="lazy"` lipsește de pe cadru (fără efect, cadrul se creează la cerere): notează abaterile în `PLAN.md`.
- [ ] **(minor)** `src/ui/RealRoom.tsx:79` — `referrerPolicy="no-referrer-when-downgrade"` trimite la Google adresa completă a paginii; fără atribut, browserul trimite doar originea, destul și pentru o cheie restricționată pe domeniu.
- [ ] **(minor)** `src/styles/global.css:140, 999-1003` — ținte sub 44 px: „Machetă” și „Sala reală 360°” au 38 px înălțime, punctele filmărilor 28 px lățime. Planul cerea „1 / 3” în loc de puncte pe telefon; punctele au rămas și dublează „Filmarea 1 din 3”.
- [ ] **(minor)** `mobil-2-sala-unirii.png` — pe telefon playerul stă deasupra panoului sălii: întâi citești „Filmare de test 1”, apoi afli în ce sală ești; ordinea vizuală e inversă față de cea din DOM (și de focus), iar panoul e tăiat de marginea de jos după cifre.
- [ ] **(minor)** `desktop-0-palat.png` — catargul de pe acoperiș urcă până în rândul subtitlului, între „săli” și „și”; la 1366×650 macheta ajunge la 4 px de buton. Coboară macheta cu 10–12 px pe desktop și micșoreaz-o puțin pe laptopul jos (`src/three/poses.ts`, `framingAt`).
- [ ] **(minor)** `desktop-5-harta.png` — linia pinului „Sala Unirii” trece pe sub pastila „Sala Alexandru Ioan Cuza”, iar punctul albastru iese de sub ea: trei etichete în 120 px. Pune eticheta Sălii Unirii în stânga pinului.
- [ ] **(minor)** `src/ui/Footer.tsx:19` — IBM Plex Sans și IBM Plex Mono (tot SIL Open Font) nu sunt numite printre fonturi.

### Îmbunătățiri propuse
- [ ] **Aspect 1, holograma.** În galerie e un dreptunghi roz, translucid, cu dungi, de 18% din lățime: silueta se vede tulbure și e lucrul cel mai „ieftin” din cadru. Dungi la cel mult 8% opacitate, imagine opacă în mijloc cu margine luminoasă subțire, un reflex slab pe pardoseală și lățime de circa 26%. La ecranul din Sala Unirii, ramă mai subțire și fără marginea interioară neclară.
- [ ] **Aspect 2, sălile pe telefon.** O singură foaie de sticlă jos: numele sălii și nota pe primul rând, playerul dedesubt, „Despre sală” care o ridică. Scade acoperirea de la 43–50% spre 35%, rămân două suprafețe de sticlă în loc de trei și sala se vede.
- [ ] **Aspect 3, coloana din foaia 360°.** Filmarea verticală stă într-o cutie neagră cu benzi laterale, iar săgețile sunt singure în colțul de jos, sub un gol mare. Fundal transparent și cutie pe proporția filmării, număr și săgeți pe același rând sus, textul imediat sub.
- [ ] Covoarele pline (roz, lila) ocupă încă o treime din cadru: o bordură mai închisă de 30 cm și o saturație cu 20% mai mică le-ar face să arate a covor, nu a suprafață colorată.
- [ ] Focusul inițial în foaie cade pe „Machetă” (un Enter în plus o închide); mai firesc pe butonul de închidere, ca pe telefon.
- [ ] Un test care deschide foaia la 390×844 și verifică faptul că săgețile filmării sunt în fereastră; un test cu o filmare cu sunet, ca butonul de sunet să fie văzut măcar o dată.

### De reluat mai târziu
- [ ] Verificare de mână cu cadrul Google adevărat, la 1440×900, 1366×650 și 390×844: atribuirea întreagă, direcția din link, sala corectă.
- [ ] Linkurile pentru Sala Unirii și Sala Alexandru Ioan Cuza; filmările reale; cadrele pe secundă în săli pe un telefon adevărat.

### Ce am aplicat (runda 1)

- [x] **Major, săgețile filmării ascunse pe telefon în foaia 360°:** numărul filmării și săgețile stau acum pe același
  rând, sus; pe telefon imaginea stă lângă text. Test nou: săgeata e în fereastră la 390×844.
- [x] **Major, butonul Înapoi nu închidea foaia:** foaia are intrare proprie în istoric; Înapoi o închide și turul
  rămâne în sală (`RealRoom.tsx`, `director.ts`). Test nou.
- [x] **Major, un link greșit lăsa pagina albă:** `rooms.ts` folosește `artsView`, care doar scoate butonul și scrie
  motivul în consolă; despachetarea „CAIS” respectă lungimea din antet, identificatorul e validat, linkul fără
  `https://` primește un mesaj clar, a doua decodare a dispărut. Test nou pe modul, cu varianta „CAIS”.
- [x] **Minore:** `referrerPolicy` scos; comutatorul are 44 px înălțime; subsolul numește și IBM Plex; focusul inițial
  în foaie cade pe butonul de închidere; camera de exterior e puțin mai departe, deci catargul nu mai intră în
  subtitlu și butonul are loc și la 1366×650.
- [x] **Verificat de mine cu cadrul Google adevărat** (fără capturi, prin DOM, la 1440×900, 1366×650 și 390×844):
  0 cereri către Google înainte de clic, cadrul întreg în fereastră, niciun element peste el, textul de atribuire
  „© Google” și „Condiții” prezent în cadru.
- [ ] **Amânate:** punctele filmărilor de 28 px lățime și „1 / 3” pe telefon; ordinea player–panou pe telefon și foaia
  unică de sticlă; eticheta Sălii Unirii pe hartă; aspectul hologramei (dungi, margine luminoasă) și bordura
  covoarelor; test cu o filmare cu sunet. Sunt îmbunătățiri de aspect care cer o rundă separată pe imagine.
- [ ] **De confirmat de utilizator:** că cele două panorame sunt Galeria de Onoare și Sala Drepturilor Omului.


## Pas 12 — Pagina de istorie · runda 1 · 15 noiembrie 2026

**Verdict:** NECESITĂ MODIFICĂRI

**Verificări rulate** (instantaneul `4d35f65`, cu cele două imagini necomise copiate): build ok — pornirea turului
`main` 15,24 kB + `jsx-runtime` 19,10 kB + `preload-helper` 218,81 kB = 253,15 kB (81,56 kB gzip; la Pasul 10 erau
250,91 kB / 79,51 kB gzip), CSS comun 36,54 kB; pagina de istorie: `istorie` 15,23 kB + CSS 6,88 kB, macheta
`HistoryStage` 8,48 kB și `buildPalace` 935,64 kB / 249,00 kB gzip, încărcate lazy; același avertisment Vite pentru chunk
peste 500 kB. Lint ok, 0 probleme. Teste 41 din 41 (rulate de mine). Capturi: n-am refăcut, am deschis 7 din
`review/shots/pas-12/` (desktop: început, dealul, demolările, șantierul la jumătate, cifrele; mobil: concursul,
demolările; laptop jos: azi). În plus, o sondă proprie în Chrome fără fereastră, pe versiunea construită: apeluri de desen
WebGL cât pagina stă, link direct cu ancoră, derulare rapidă dus-întors, ordinea Tab, bara de sus la 360/375/390 px,
mișcare redusă. Am comparat cifrele cu textul articolelor ro.wikipedia descărcat azi (`action=raw`) și am citit licențele
celor două imagini prin API-ul Commons.

### Criteriile pasului
- [x] Pagină separată `istorie/` cu link „Istorie” sus — `vite.config.ts` cu două intrări, `dist/istorie/index.html`; pe istorie „Istorie” are `aria-current="page"`, iar „Săli”/„Hartă” duc la tur cu ancoră (test).
- [x] Opt capitole pe un fir care se umple la citire, cu cuprins — firul se umple până la linia de citire (45% din fereastră pe desktop, de ex. y=405 la 900 px; 66% pe telefon). Cuprinsul e în introducere, nu în nodurile firului (vezi problemele).
- [x] Macheta stă fixă și urmează povestea — văzut în capturi: palatul coboară, apar dealul cu curbe de nivel și biserica (`desktop-istorie-dealul`), conturul punctat (`mobil-istorie-concursul`), terasele, mutarea bisericii, ridicarea cu tăietură colorată (`desktop-istorie-santierul-jumatate`), cotele 270/240 m (`desktop-istorie-cifrele`).
- [x] Desen în cerneală pentru mutarea bisericii — `MihaiVoda.tsx`, cu `aria-label` complet. L-am văzut doar parțial, la marginea de jos a unei capturi.
- [x] Două imagini vechi în domeniul public — API-ul Commons dă pentru amândouă `LicenseShortName: Public domain`, `Copyrighted: False`. Gravura: Ciceri/Bouquet, 1841, 2704×844 (aici 1920×599). Fotografia: Alexandru Antoniu, „Album general al României”, 1901–1904, 800×600 pe Commons; aici e decupată la 526×600, iar decupajul nu e menționat.
- [~] Text după trei articole, listate pe pagină — sursele și notele cu valorile divergente sunt pe pagină. Am verificat circa 45 de cifre și date: aproape toate se regăsesc exact. Excepțiile sunt la „Probleme”.
- [~] „Bundle-ul de pornire al turului nu crește” — crește cu 2,24 kB (2,05 kB gzip), din `TopBar`/`pages`/`webgl`/`Lights`. E puțin, dar e o abatere nenotată.
- [x] `frameloop="demand"` se oprește — **0 apeluri de desen în 2 s** de stat, la început, după derularea la Șantier, după derularea rapidă jos-sus, pe desktop, pe telefon și cu mișcare redusă. După derularea rapidă, capitolul revine corect la 0.
- [x] Fără erori în consolă: 0 în toate cele trei rulări. Fără derulare orizontală la 390 px (`scrollWidth` 390).
- [ ] Telefon: bara de sus nu încape — vezi problema 3.
- [~] Mișcare redusă: camera sare direct la poză, desenele nu se mai animă, dar etichetele cotelor rămân în locul greșit (problema 5).

### Ce e bine
- Tăietura cu capace citește exact ca o machetă secționată (`desktop-istorie-santierul-jumatate`). Capacul în piatră, curțile interioare goale și cornișele tăiate fac din capitolul V momentul cel mai bun al paginii.
- Scena chiar stă când nu se mișcă nimic. Lumina își refă harta de umbre doar când tăietura se schimbă (`rise.ts:72-82`, `needsUpdate`). Pagina de istorie nu încarcă nimic din tur: nici săli, nici holograme, nici hartă.
- Sursele sunt tratate serios: trei articole cu data ultimei modificări, valorile divergente explicate (240/245 m, 84/86 m, 1983/1984), autorul și licența la fiecare imagine, iar desenul spune „schematic, fără scară”.
- Anul mare cu contur se citește bine: contur de 1 px în `--ink-2` pe Cinzel la 95 px pe desktop, iar pe telefon, la circa 54 px, încă e clar. E `aria-hidden`, deci nu dublează titlul. Diacriticele în Cinzel ies corect („Demolările”, „Șantierul”, „Cât de mare e”).
- Tastatura merge: „Sari la conținut”, bara, cele opt intrări din cuprins, „Sursa”, „Intră în tur”, toate cu contur de focus de 2 px; un singur `h1`, capitolele și „Surse și imagini” sunt `h2`.

### Probleme
- [ ] **(major)** `src/content/history.ts:203-207` și `src/history/HistoryPage.tsx:125` — „a doua clădire administrativă din lume, după Pentagon” e depășit chiar după sursa citată. Articolul „Palatul Parlamentului” spune că recordul World Records Academy „din 2021 a fost depășit ca suprafață de clădirea parlamentului din Bangkok, ambele fiind surclasate de [...] Pentagonul”. Fraza apare de două ori: în capitolul VII și în textul de deschidere. Reparație: „În 2012, World Record Academy l-a numit a doua clădire administrativă din lume, după Pentagon; din 2021, clădirea parlamentului din Bangkok e mai mare.” În deschidere, o formulă fără clasament.
- [ ] **(major)** `src/history/stage/oldSite.ts:38-40` — biserica pornește din interiorul amprentei palatului (`FROM = (70, 0, -22)`), deci macheta spune că palatul stă pe locul bisericii. După coordonatele din articole, palatul e la 44°25′39″N 26°05′15″E, iar biserica, azi, la 44°25′54″N 26°05′35″E, la circa 640 m de centrul palatului, spre nord-est. Cu un drum de 289 m, locul inițial era la cel puțin circa 350 m de centru, adică în afara conturului de 270×240 m, spre nord-est (pe Dealul Mihai Vodă, „fosta stradă a Arhivelor nr. 2”). Și textul trebuie nuanțat: „Pe deal se afla Mănăstirea Mihai Vodă” e susținut de articolul „Dealul Arsenalului”, dar articolul despre mănăstire numește locul „Dealul Mihai Vodă”. Reparație: `FROM` în afara conturului, în fața colțului dinspre +X+Z (fațada e spre est, deci +X e nordul), drumul de circa 290 m mai departe în aceeași direcție, cu poza IV ajustată. În text: „Pe un pinten al dealului, numit Dealul Mihai Vodă, se afla...”. Comentariul de la `oldSite.ts:117` („Altarul privește spre est (+X)”) e greșit: cu fațada spre +Z = est, +X e nordul.
- [ ] **(major)** `src/ui/TopBar.tsx:25-30` și stilurile `.topbar` — cu „Istorie” adăugat, bara nu mai încape pe telefon, pe **ambele** pagini. Măsurat: la 390 px, sigla se termină la 225 px, exact unde începe „Istorie” (0 px între ele), iar „Hartă” se termină la 395 px, adică 5 px în afara ecranului. La 375 și 360 px, „Hartă” se termină tot la 394 px, deci e tăiat pe jumătate (`rev12/bar-360.png`). E o regresie a turului pe cele mai comune lățimi de telefon. Reparație: sub 420 px sigla rămâne doar semnul (numele în `sr-only`) sau numele trece pe două rânduri mai mici; linkurile cu `padding-inline` mai mic, păstrând 44 px înălțime. Plus un test la 360 px care verifică faptul că ultimul link e în fereastră.
- [ ] **(major)** `src/history/stage/states.ts:32-33` (poza IV) — în „Demolările” macheta e împinsă spre stânga și tăiată drept de marginea canvasului: terasele și bulevardul se opresc brusc la x≈662 pe desktop (`desktop-istorie-demolarile`), iar pe telefon jumătate din model iese din bandă (`mobil-istorie-demolarile`). Restul cadrului e hârtie goală. E capitolul cu cea mai „ieftină” imagine: o placă bej goală, tăiată, cu o bisericuță pe ea. Reparație: ținta pozei IV mai spre centrul drumului bisericii (de exemplu x≈150) și camera mai departe; verificat la 1440×900, 1366×650 și 390×844. Pe terase, conturul punctat al viitoarei clădiri ar putea rămâne vizibil în IV (`OUTLINE` până la 4,9), ca placa să citească drept șantier, nu drept gol.
- [ ] **(minor)** `src/history/stage/HistoryStage.tsx:75-82` — etichetele cotelor se calculează cu `camera.matrixWorldInverse` din cadrul anterior. Cu mișcare redusă, camera sare dintr-un cadru și nu mai urmează altul, deci la `#capitol-cifrele` etichetele „270 m”/„240 m” ajung la y=2153 px și y=1505 px, în afara ecranului. Cu mișcare normală, eroarea e de câțiva pixeli și dispare. Reparație: `camera.updateMatrixWorld()` imediat după `camera.lookAt(...)`.
- [ ] **(minor)** `src/content/history.ts:154-161` — capitolul V are semnul „7 ani” și intervalul „1984–1989”, care face 5 ani. Sursa spune „3 schimburi timp de 7 ani”, fără ani de capăt. Reparație: semnul „1984”, iar „timp de șapte ani” rămâne în text; sau intervalul „1984–anii ’90”, dacă se găsește o sursă.
- [ ] **(minor)** `src/content/history.ts:157` — „5.000 de soldați și voluntari” schimbă sensul sursei: „5000 soldați, 700 arhitecți, o armată de așa-ziși «voluntari»”, iar mai sus „munca forțată a militarilor în termen”. Reparație: „20.000 de muncitori, 5.000 de soldați în termen și mulți așa-ziși «voluntari», în trei schimburi...”.
- [ ] **(minor)** `src/content/history.ts:110-112` — „Pentru clădirea principală s-a ținut un concurs național de arhitectură”: sursa spune „un concurs la nivel național pentru reconstruirea Bucureștiului”, în 1978–1979, care „a durat aproape 4 ani”. Reparație: „Pentru noul centru al orașului s-a ținut un concurs național, care a durat aproape patru ani.”
- [ ] **(minor)** `src/content/history.ts:181` — „Lucrările principale s-au încheiat în 1997” omite ce spune articolul: aripa vestică, o parte din aripa de est și subsolurile „urmează a fi terminate” (marcat „necesită citare”). O jumătate de frază ar face textul cinstit.
- [ ] **(minor)** `src/content/history.ts:61` — „Gravura se numește «Curtea Arsă, Dealul Arsenalului»”: ăsta e titlul fișierului de pe Commons, nu al gravurii. Pe aceeași pagină scrie că numele „Dealul Arsenalului” apare din 1848, deci în 1841 nu putea fi în titlu. Reparație: „Pe Commons, imaginea se numește...” sau titlul original din „Voyage illustré...”. Pentru fotografia lui Antoniu, de notat „decupată” în sursă.
- [ ] **(minor)** `src/history/HistoryPage.tsx:160` — planul cerea ca nodurile firului să fie linkuri („firul e și cuprins”). Nodurile sunt `span` `aria-hidden`, iar cuprinsul e o listă separată, care dispare după introducere. Ori nodurile devin linkuri (44×44 px zonă de atingere), ori abaterea se notează în `PLAN.md`.
- [ ] **(minor)** `src/history/stage/HistoryStage.tsx:13, 47` — `reducedMotion()` apelează `matchMedia` la fiecare cadru, deci o alocare pe cadru. Un `MediaQueryList` creat o dată, cu `.matches` citit în buclă.
- [ ] **(minor)** `src/history/stage/oldSite.ts:43, 52` — dealul e un plan de 560×500 m în culoarea hârtiei, dar luminat; marginile lui se văd ca o foaie mai deschisă, cu muchie dreaptă (`desktop-istorie-dealul`, diagonala de sus; `mobil-istorie-concursul`, colțul din dreapta sus). Reparație: plan mai mare decât ceața (ex. 2400 m, cu dealul doar în mijloc) sau culoarea înmulțită ca luminanța să egaleze `PAPER`.
- [ ] **(minor)** `src/styles/history.css:282-292` — în legenda imaginilor, linkul „Sursa” (36×44 px, `.link` cu înălțime minimă) umflă rândul: două rânduri de 14 px stau la circa 32 px distanță (`desktop-istorie-dealul`). „Sursa” are și 36 px lățime, sub 44. Reparație: în legendă, `.link` inline, cu zona de atingere mărită prin `padding` și `margin` negativ.
- [ ] **(minor)** `src/styles/history.css:228-231` — „2.550.000 m³” se rupe pe două rânduri la 1440 px (`desktop-istorie-cifrele`). Reparație: `white-space: nowrap` pe `dd` sau `minmax(150px, 1fr)`.

### Îmbunătățiri propuse
- [ ] **Cotele, capitolul VII.** Liniile de 1 px la opacitate 0,85 abia se văd de la 600 m, iar eticheta „270 m” stă peste scările fațadei. Linii mai groase (`Line2`, 1,5 px), capete oblice de cotă în loc de capete drepte, etichetele mutate în afara clădirii (`labels` cu +12 m spre exterior). Efect: arată a planșă, nu a linie rătăcită.
- [ ] **Vederea de sus, capitolul VII.** Curțile interioare ies ca dreptunghiuri gri-închis, ca niște găuri, iar acoperișurile plate albe arată simplitatea volumelor. Umbra soarelui mai scurtă doar în poza VII (sau `shadow.intensity` ≈ 0,6) și o cameră cu 10–15° mai înclinată decât planul vertical. Efect: se văd fațadele, nu doar capacele.
- [ ] **Biserica pe deal.** La scara 1,35 e tot un grup de cutii fără ferestre. Incinta mănăstirii (un dreptunghi punctat în jur, „zidul dărâmat în 1985”) ar lega scena de text mai mult decât orice detaliu nou pe clădire.
- [ ] **Capitolul V pe desktop.** Între faptele de la sfârșitul capitolului și capitolul VI rămân circa 60% din ecran de hârtie goală în coloana de text, cât crește palatul. O cotă de înălțime care urcă lângă text („34 m … 84 m”), legată de `state.clip`, ar umple golul cu informație.
- [ ] Anii din cuprins, „cifrele” și „azi” în IBM Plex Mono arată ca niște etichete de cod lângă anii adevărați. „—” sau nimic în coloana de ani pentru VII și VIII.

### De reluat mai târziu
- [ ] Cartierul Uranus lipsește (abatere notată: articolul nu există pe ro.wikipedia). Articolul „Palatul Parlamentului” în engleză îl menționează („Uranus Hill was leveled”), cu sursă (Descoperă.ro, 2014); poate fi o a patra sursă.
- [ ] Cele două imagini nu sunt încă în repo, așteaptă aprobarea utilizatorului. Licențele sunt în regulă (domeniu public, confirmat pe Commons); de adăugat la commit și mențiunea decupajului.
- [ ] Nu am verificat cifrele care nu sunt pe pagini de Wikipedia (de exemplu „tururi în mai multe limbi”, din capitolul VIII, care nu are sursă) și nici nu am măsurat cadrele pe secundă în timpul ridicării pe un telefon adevărat.

### Ce am aplicat (după runda 1)
- [x] Clasamentul: în capitolul VII, „în 2012 … cea mai mare clădire administrativă civilă și cea mai grea; din 2021,
  clădirea parlamentului din Bangkok e mai mare, iar Pentagonul le întrece pe amândouă”; în deschidere, „una dintre cele
  mai mari clădiri din lume”.
- [x] Biserica nu mai pornește din palat: macheta are acum Dealul Arsenalului și un pinten separat, Dealul Mihai Vodă,
  spre nord-est (+X+Z), în afara conturului, cu incinta mănăstirii punctată; biserica merge 289 m tot spre nord-est
  (ajunge la circa 615 m de centru) și pintenul dispare după ea. Curbele de nivel se calculează din teren (marching
  squares), iar marginile terenului se topesc în hârtie (alfa pe vârfuri). Comentariile despre axe sunt corectate
  (+Z = est, +X = nord); textul spune „Pe un pinten al dealului, numit Dealul Mihai Vodă”.
- [x] Bara de sus pe telefon: sub 420 px rămâne doar semnul siglei, numele trece în `sr-only`; test nou la 360 px pe
  ambele pagini (42 din 42).
- [x] „Demolările” se vede acum ca un plan, de sus: terasele, pintenul și tot drumul bisericii, fără tăieturi la margine.
  Harta de umbre se reface când biserica se mută sau terenul se schimbă (rămânea o umbră veche pe deal).
- [x] `camera.updateMatrixWorld()` după `lookAt`; `MediaQueryList` creat o dată.
- [x] Capitolul V: semnul „20.000”, intervalul „anii ’80”; „5.000 de soldați în termen și mulți așa-ziși «voluntari»”.
- [x] Concursul: „pentru reconstruirea Bucureștiului … a durat aproape patru ani”; capitolul VI spune că părți din
  aripi au rămas neterminate; capitolul VIII urmează formularea sursei („programe de vizitare în mai multe limbi”).
- [x] Legenda gravurii spune că titlul e cel de pe Commons; decupajul fotografiei din 1901 e notat la surse.
- [x] Nodurile firului sunt linkuri spre capitol (zonă de 44 px, scoase din ordinea Tab, cuprinsul rămâne drumul din tastatură).
- [x] „Sursa” din legendă e inline, subliniat; cifrele din capitole nu se mai rup pe două rânduri; etichetele cotelor
  stau în afara clădirii; valorile din desen sunt în Garamond, ca „m” să nu iasă majusculă.
- [x] Terasele (III) și dealul (I) au cadre mai largi, nu mai sunt tăiate de margine.
- Amânat: linii de cotă mai groase și capete oblice (cer `Line2`), vederea de sus mai înclinată în VII, cota de înălțime
  lângă text în V, cartierul Uranus (sursă în engleză). Creșterea de 2 kB a pornirii turului e notată în `PLAN.md`.

## Review — Pașii 13–14 (publicarea și orașul) · runda 1 · 15 noiembrie 2026

**Verdict:** APROBAT CU OBSERVAȚII

**Verificări rulate** (instantaneul `3dbbf23`, fiecare o singură dată): build ok — pornirea turului `main` 16,76 kB +
`jsx-runtime` 19,13 kB + `preload-helper` 219,30 kB = 255,19 kB (82,20 kB gzip; la Pasul 12 erau 253,15 / 81,56), CSS
comun 39,13 kB (7,57 gzip); `Scene` 26,16 kB (10,59 gzip), `Effects` 214,61 kB (97,56 gzip), `buildPalace` 935,91 kB
(249,07 gzip), `istorie` 17,74 kB (7,39 gzip); `public/data/oras.json` 353 kB, 147 kB gzip; același avertisment Vite
pentru chunk peste 500 kB. Lint ok, 0 probleme. Teste 44 din 44. Capturi: 63 în `review/shots/pas-14-review/`, am
deschis 7 (`mobil-0-oras`, `mobil-1-palat`, `mobil-2-galeria-de-onoare`, `desktop-0-oras`, `desktop-tranzit-0_5`,
`desktop-1-palat`, `laptop-jos-0-oras`). Scriptul raportează 60 de cadre pe secundă în oraș, dar pe un Mac, nu pe telefon.

**Ce n-am verificat:** n-am accesat rețeaua, deci nu știu dacă fluxul GitHub Actions a rulat cu succes și dacă adresa
publică răspunde. N-am făcut un build cu `BASE_PATH` (o singură rulare de build), deci subfolderul e judecat doar din
cod. Problemele 1 și 2 sunt deduse din cod și din captură, nu reproduse în browser. Cifrele noi din `e32f809` nu le-am
comparat cu articolele (fără internet în acest review).

### Criteriile pașilor
- [x] Pas 13, publicare la fiecare push pe `main` — `.github/workflows/pages.yml` construiește cu `BASE_PATH=/<repo>/` și publică `dist`. În cod nu rămâne nicio cale absolută: media (`rooms.ts:69`), `oras.json` (`City.tsx:11`), linkurile dintre pagini (`pages.ts:5`), imaginile de istorie (`HistoryPage.tsx:23`); `href="/favicon.svg"` din HTML îl rescrie Vite. Rularea propriu-zisă pe GitHub n-am văzut-o.
- [x] Cod QR — am generat din nou codul cu aceleași opțiuni și iese identic cu `public/qr.svg`, deci conține `https://stevenenson.github.io/Palatul-Parlamentului-/`. Nescanat cu un telefon.
- [x] Pas 14, oprire nouă la început, din date OSM — `oras.json` are 3.477 de clădiri, 167 de parcuri, 442 de străzi; un mesh pentru clădiri, unul pentru teren, unul pentru catedrală.
- [x] Cinci repere, axa cu roșu, catedrala — toate cinci se văd și nu se suprapun pe desktop și pe laptop jos; pe telefon trei, dar vezi problema 1.
- [x] La scroll, camera coboară și orașul se retrage — `desktop-1-palat` și `mobil-1-palat` sunt curate, ca înainte: nicio clădire de oraș, nicio etichetă (și testul verifică `live.city === 0`).
- [~] Trecerea oraș → palat — camera și retragerea clădirilor merg, dar textul trece peste machetă (problema 3).
- [x] Indicii decalați — `PALACE_STOP` și `FIRST_ROOM_STOP` sunt folosiți în `solidAt`, `framingAt`, `swipe.ts:13`, `Holograms.tsx:116`; n-am găsit niciun `stop - 1` sau `index + 1` rămas. `mobil-2-galeria-de-onoare` arată sala corectă, „Sala I din IV”.
- [x] `e32f809`, bara de sus — pe telefon: semnul siglei, linia, „Istorie”, apoi „Săli” și „Hartă” în dreapta, toate în ecran (test la 360 px).

### Ce e bine
- Orașul se citește din prima: peluza palatului ca o pată verde limpede, axa roșie care duce privirea la fațadă, Dâmbovița care închide cadrul pe desktop. Pe telefon, cadrul din axul bulevardului e alegerea bună: axa urcă pe diagonală direct în trepte.
- Marginea machetei se topește în hârtie (elipsa `reach` și vălul de sub titlu), fără muchie tăiată; titlul rămâne curat în toate cele trei mărimi.
- Oprirea „Palatul” n-a pierdut nimic: aceeași machetă, aceleași cifre, iar împărțirea în două ecrane a scos textul de pe primul. Pagina e mai aerisită decât înainte.
- Tot orașul costă trei apeluri de desen, se ascunde complet când `live.city` e 0 și nu depinde de niciun serviciu extern la rulare. Fără `oras.json`, turul merge mai departe.
- Subsolul spune cinstit ce e estimat (înălțimile) și ce e schematic (catedrala).

### Probleme
- [x] **(major)** `src/content/city.ts:22` și `src/three/city/City.tsx:82` — pe telefon, „Parcul Izvor” stă chiar pe marginea de la care eticheta se ascunde. În `mobil-0-oras`, punctul e la 379 px din 390, iar pragul e `x > lățime − 10`, adică 380. Captura e făcută fără legănare; pe un telefon adevărat macheta se leagănă ±0,2 rad până la prima atingere (`CameraRig.tsx:248`), deci eticheta apare și dispare brusc, fără estompare, la fiecare trecere. „Bulevardul Unirii” e la 68% din lățime, aproape de pragul de 60% la care numele sare de pe o parte pe alta (`City.tsx:87`). Reparație: `phoneAt` pentru Izvor mai aproape de palat (de exemplu `[300, 0, 40]`); la margine, opacitate care scade pe ultimii 24 px în loc de `visibility`; pragul de parte cu histerezis. Plus un test la 390 și 360 px: trei etichete vizibile, în ecran, la ambele capete ale legănării.
- [x] **(major)** `src/three/CameraRig.tsx:258-261` — cadrul de telefon al orașului se aplică peste poza de zbor, nu doar peste traseul de scroll. La pornirea unui zbor, `r.from` e poziția reală a camerei (cu legănarea sau cu rotirea utilizatorului, linia 199), dar imediat după, `r.pose.position.lerp(CITY_NARROW.position, live.city)` cu `live.city = 1` o înlocuiește cu poza fixă. Rezultatul: pe telefon, din oraș, la atingerea „Săli” sau „Hartă”, camera sare într-un cadru cu până la 11° (sau cu cât a rotit omul macheta). La un zbor întrerupt la jumătate, saltul e parțial. Pe ecrane late nu se întâmplă. Reparație: poza îngustă devine capăt adevărat de traseu, de exemplu `stopPose(i, narrow)` folosit în `poseAt` și ca țintă în `blendPose`, iar amestecul de după se șterge; sau amestecul se face doar când `r.flight` e `null` și ținta zborului spre oraș e `CITY_NARROW`.
- [x] **(minor)** `src/styles/global.css:409-418` — comentariul spune că textul celui de-al doilea ecran „nu urcă peste clădiri”, dar în `desktop-tranzit-0_5` „Palatul, de aproape” stă cu opacitate plină peste fațadă, „Macheta” nu se mai citește, iar „Coboară spre palat” plutește la mijlocul ecranului. Cauza: `animation-timeline: view()` e al blocului de titlu, înalt de circa 150 px, deci `entry 55% → 100%` se termină după primii 150 px de scroll. Pe Safari mai vechi de versiunea 26 nu există deloc `animation-timeline`, deci pe multe iPhone-uri nu se estompează nimic. Reparație: opacitatea legată de starea scenei, nu de scroll-ul CSS: `live.city` scris într-o variabilă `--city` pe `main`, cu `.hero--palace` la `opacity: clamp(0, (0.3 − var(--city)) / 0.3, 1)` și `.descend` invers. Merge la fel în toate browserele și în zboruri.
- [x] **(minor)** `src/ui/Footer.tsx:35-42` — textul atribuirii e corect și complet (©, colaboratorii, ODbL, link la pagina de drepturi), iar `oras.json` își poartă sursa în câmpul `source`. Dar stă în subsol, la șapte ecrane de machetă; ghidul fundației OSM cere mențiunea lângă hartă. Reparație: un rând mic pe primul ecran, în colțul de jos („© OpenStreetMap”, 11 px, în `--ink-2`, link spre aceeași pagină), care se stinge odată cu etichetele. Un singur rând nu încarcă pagina.
- [x] **(minor)** `src/three/city/buildCathedral.ts:55-62` — catedrala e singurul lucru din cadru care arată ieftin: în ambele capturi se citește ca un grup de silozuri. Cilindrii netezi, cu 24 de fețe și normale rotunjite, primesc o umbră în degrade între sute de volume cu fețe plane; absidele cu raza de 14–19 m pornesc de la sol și domină; crucile de 1 m nu se văd. Reparație: tambure cu 8 laturi și fețe plane; turla mare mai zveltă (rază 9–10 m în loc de 14) ca să iasă ierarhia de înălțimi; acoperiș în două ape pe navă în loc de cutie; absidele mai joase decât nava. Aceeași culoare ca restul orașului e în regulă.
- [x] **(minor)** `.github/workflows/pages.yml:27-28` — orice push pe `main` ajunge direct la juriu: fluxul nu rulează nici lint, nici teste, iar testele locale rulează doar cu baza `/`. O greșeală de cale în subfolder s-ar vedea abia pe telefonul cuiva. Reparație: `npm run lint` înainte de build și un pas scurt care servește `dist` sub `/<repo>/` și cere `index.html`, `istorie/`, `data/oras.json` și un fișier media (sau `smoke.mjs` cu `BASE_PATH`; `ubuntu-latest` are Chrome). De verificat de mână, o dată: Pages are sursa „GitHub Actions” în setările repo-ului, iar codul QR scanat deschide turul.
- [x] **(minor)** `src/content/history.ts:200` — „15.000 de candelabre” pare mult prea mare: cifra citată de obicei e de 480 de candelabre și 1.409 plafoniere, din 3.500 de tone de cristal, iar Galeria de Onoare, cea mai lungă sală, are 67. De verificat în articolul-sursă; dacă nu apare exact așa, de scos. Tot de verificat, din același commit: `history.ts:216-217`, ordinea „din 1994 … după ce vechiul sediu a fost donat” (din ce știu, Palatul Camerei Deputaților a trecut la Patriarhie mai târziu), și `history.ts:192`, clasamentul ArchDaily, care are nevoie de an.
- [x] **(minor)** `src/three/city/City.tsx:70-92` — bucla etichetelor verifică doar marginile laterale, nu și pe cele de sus și de jos. `.citylabels` vine în pagină după `.wrap`, deci se desenează peste văl și peste titlu: dacă vizitatorul rotește orașul, „Bulevardul Unirii” poate ajunge peste titlu. Reparație: eticheta se stinge când `y` intră în zona vălului (`min(46svh, 420px)`). Tot aici, la fiecare cadru se creează o funcție (`forEach`), două șiruri `toFixed` și un `transform` nou pentru fiecare etichetă, chiar când nimic nu s-a mișcat; de ținut minte ultimul `x`/`y` și de scris doar la o diferență de peste 0,5 px.
- [x] **(minor)** `src/three/city/City.tsx:35-46` — `oras.json` (147 kB gzip) se cere abia după ce s-au descărcat și au pornit `Scene` și `buildPalace`, deci pe date mobile primul ecran arată întâi un palat mic pe hârtie goală, apoi orașul. Dacă cererea eșuează, rămâne așa, cu textul despre bulevard deasupra, fără altă încercare. Reparație: cererea pornită din `main.tsx`, în paralel cu scena (o promisiune la nivel de modul, pe care `City` o așteaptă); la eșec, oprirea „Orașul” folosește poza `EXTERIOR`, ca macheta să nu rămână un punct.

### Îmbunătățiri propuse
- [x] **Cadrul de telefon** (`src/three/poses.ts`, `CITY_NARROW`). În `mobil-0-oras`, palatul ocupă circa 42% din lățime, iar blocurile din prim-plan, din jumătatea de jos, sunt mai mari decât el și au pereții cei mai întunecați din cadru. Camera cu 10–15% mai aproape și puțin mai sus (de exemplu `(-280, 540, 1000)`), ca palatul să treacă de jumătate din lățime, și elipsa `EXTENT` mai strânsă spre cameră, ca prim-planul să scadă în înălțime. Etichetele de la 10 px la 11 px (`global.css:1644`); la 10 px, cu majuscule spațiate, sunt la limită pentru un juriu care citește de pe telefon.
- [x] **Clădirile fără umbre** (`src/three/city/buildCity.ts:88-112`). Volumele stau lipite de teren doar prin tonul pereților. O culoare pe vârfuri la pereți, 0,86 la bază și 1 sus, dă o umbră de contact falsă, fără hartă de umbre și fără alt apel de desen; orașul ar sta pe planșă ca o machetă, nu ca niște cutii așezate pe ea.

### De reluat mai târziu
- [ ] Un telefon adevărat, înainte de prezentare: Safari pe iPhone (estomparea din problema 3, `backdrop-filter` pe „Coboară spre palat”), cadrele pe secundă în oraș (circa 77.000 de triunghiuri neindexate, construite pe firul principal la sosirea datelor) și codul QR scanat de pe un ecran proiectat. Rămân valabile restanțele vechi: macheta mică la oprirea „Palatul” pe telefon (`mobil-1-palat` are hârtie goală deasupra și dedesubt) și fallback-ul de font.

### Ce am aplicat (după runda 1)
- [x] Etichetele pe telefon: „Parcul Izvor” și „Bulevardul Unirii” au loc propriu în cadrul de telefon (`phoneAt`),
  la peste 40 px de margine. Spre margini și spre titlu etichetele se sting treptat în loc să dispară, iar partea pe
  care stă numele are praguri diferite la dus și la întors. Stilul se scrie doar când s-a mișcat ceva. Teste noi la
  390 și 360 px: trei repere, întregi, departe de margine (46 din 46).
- [x] Saltul de cameră la zbor, pe telefon: cadrul îngust nu mai e amestecat peste poză, ci e chiar capătul traseului
  (`setCityFrame` în `poses.ts`, ales în `CameraRig` după lățime). Scroll-ul și zborurile pleacă din el și ajung în el.
- [x] Textele celor două ecrane de început urmează scena: `City.tsx` scrie `--city`, iar „Palatul, de aproape”,
  butoanele lui, „Coboară spre palat” și creditul OSM își iau opacitatea din ea. Merge la fel în toate browserele
  și în zboruri; `hero-in` cu `animation-timeline` a fost scos.
- [x] „© OpenStreetMap”, cu link, pe primul ecran, lângă hartă; atribuirea completă rămâne în subsol.
- [x] Catedrala: turle cu opt laturi și fețe plane, turla mare mai zveltă, navă și transept cu acoperiș în două ape,
  abside mai joase decât nava, cruci care se văd.
- [x] Fluxul de publicare rulează lint și verifică, după build, că fișierele publicate există și pornesc din
  subfolder. Testele din browser rămân locale (rulate și cu `BASE_PATH`), ca un test instabil să nu blocheze
  publicarea înaintea prezentării. Verificat de mână: Pages are sursa „GitHub Actions”, iar adresa publică răspunde
  (turul, `istorie/`, un fișier media, `qr.svg`).
- [x] Cifrele din `e32f809`, comparate cu articolul „Palatul Parlamentului” (versiunea din 29 mai 2026): „15 000 de
  candelabre” apare exact așa în lista de resurse; „din 1994 … după ce sediul inițial … a fost donat” e formularea
  articolului; clasamentul ArchDaily e dat acolo fără an. Au rămas cum erau.
- [x] `oras.json` se cere de la pornirea paginii, în paralel cu scena (`state/cityData.ts`). Dacă cererea eșuează,
  prima oprire folosește vederea palatului (`live.cityFailed`).
- [x] Cadrul de telefon e mai aproape (palatul trece de jumătate din lățime), iar etichetele au 11 px și pe telefon.
- [x] Pereții clădirilor orașului sunt mai închiși la bază (culoare pe vârfuri), ca o umbră de contact.
- Amânat: elipsa machetei mai strânsă spre cameră pe telefon; testul cu legănarea pornită (în teste, `?debug` o
  oprește); telefonul adevărat și Safari pe iPhone, care rămân de încercat de utilizator, din codul QR.
