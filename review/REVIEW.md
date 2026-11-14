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
- Cifrele romane au variantă arabă pentru cititoarele de ecran (`RoomSection.tsx`); fără `text-transform`, fără U→V.
- Pastila punctului activ, bara subțire și razele de 22 px se leagă între ele; linkul „Harta sălilor” are 44 px.
- `framingAt` și `r.cx` amortizat nu alocă nimic pe cadru; revenirile pentru transparență redusă există.

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
- [ ] **(minor)** `mobil-0-palat.png` — a treia cifră („25 iunie 1984”) cade singură pe rândul al doilea; macheta
  ocupă doar o cincime din înălțime, cu două benzi goale deasupra și dedesubt.
- [ ] **(minor)** Trei suprafețe de sticlă pe ecran în săli (bară, panou, filmare); planul spune cel mult două.

### Îmbunătățiri propuse
- [ ] Meandrul e desenat din șapte bucăți despărțite, care la 11 px se citesc ca un șir de cifre. Leagă-le printr-o
  linie de bază continuă (`h20` în loc de `h15`) și lățește-l la 160–200 px, ca să arate a friză.
- [ ] Pe telefon, o poză de exterior mai frontală și mai de sus (sau `cy` 0,45) ar umple golul și ar scoate
  esplanada din margini; cifrele pe trei coloane egale, cu valori de 15 px.
- [ ] Hero-ul are patru familii de litere pe un ecran. Treci indiciul „Trage ca să rotești macheta” pe Plex Sans și
  valorile cifrelor la grosime 400, ca rândul de jos să fie cu adevărat „fin”.
- [ ] Paragraful sălii în Garamond de 19 px, ca panoul să nu amestece Cinzel, Garamond, Plex Sans și Plex Mono.
- [ ] Covorul amestecat cu pardoseala (circa 35% accent) merită adus înaintea Pasului 9: pe telefon ambele panouri
  ies albăstrui și arată a carduri colorate, nu a sticlă peste piatră.
- [ ] Garamond `latin-ext` cântărește 114 + 89 kB doar pentru ă, ș, ț; un subset propriu ar scădea mult fonturile.

