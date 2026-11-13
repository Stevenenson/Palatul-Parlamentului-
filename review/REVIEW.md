# Jurnal de review

Aici scrie agentul `pp-reviewer` după fiecare pas din `PLAN.md`. Cel care aplică îmbunătățirile
bifează ce a rezolvat și adaugă sub fiecare review o secțiune „Ce am aplicat”, cu ce a amânat și de ce.

Capturile de ecran folosite la review stau în `review/shots/` (nu intră în git).

## Pas 0 — Fundație · runda 1 · 14 noiembrie 2026

**Verdict:** APROBAT CU OBSERVAȚII

**Verificări rulate:** build ok (JS 1.157,85 kB, 318,35 kB gzip; CSS 20,12 kB; avertisment Vite pentru chunk peste 500 kB),
lint ok (0 probleme), teste 11 din 11, capturi 17 în `review/shots/pas-0-review/` (11 desktop 1440 × 900, 6 mobil 390 × 844),
fără erori în consolă. Commit verificat: `b54ca25`.

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

