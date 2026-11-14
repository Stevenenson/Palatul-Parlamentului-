# Faza 2 — săli reale în 360°, design nou, fonturi cu aer roman

Plan de execuție pentru modelul care continuă proiectul (Opus 5.5). Continuă `PLAN.md` (pașii 0–5, toți
terminați) cu pașii 6–11. Scris pe 14 noiembrie 2026, pe commitul `143f3d6`.

## Înainte să începi

Citește, în ordinea asta: `README.md`, `PLAN.md`, ultima secțiune din `review/REVIEW.md` (restanțele),
`.claude/agents/pp-reviewer.md`, `src/content/rooms.ts`, `src/styles/tokens.css`.

Reguli care nu se negociază:

- Scrii în română, cu diacritice: interfață, comentarii, commituri, documente.
- După fiecare pas: `npm run build`, `npm run lint`, `npm run test:e2e` (azi trec 29 din 29), apoi commit
  și `git push` simplu, fără `--force`. Adresa de commit e deja cea `noreply` de GitHub; nu o schimba.
- Repo-ul e public. Nu urca filmări cu oameni reali sau poze reale ale sălilor fără să întrebi.
- Nu strica ce merge: 60 de cadre pe secundă pe exterior, pornire sub 85 kB gzip, three.js rămâne în
  bucata `Scene` încărcată leneș, pagina rămâne utilizabilă fără WebGL și cu `prefers-reduced-motion`.
- Limita de utilizare e strânsă: un singur subagent o dată, cu sarcină îngustă.

## Ce vrea utilizatorul

1. Imaginile 360° de pe Google Arts & Culture să apară în sălile din aplicație.
2. Un design mai frumos, lucrat după principiile de design Apple.
3. Litere cu notă istorică, „de pe vremea romanilor și a dacilor”, combinate cu alte fonturi pentru dinamism.
4. Un subagent care verifică munca în fundal după fiecare pas, ca până acum; apoi se aplică îmbunătățirile.

## Partea A — imaginile 360°

### Ce am verificat

**Regula Google.** Pagina „Geo Guidelines” (about.google/brand-resource-center/products-and-services/geo-guidelines)
spune, pentru Street View:

- permis: „If you simply need to embed a Street View image or panorama on your website, you don't need our permission.”
- interzis: „Downloading Street View images to use separately from Google services (such as an offline copy)”,
  „Merging or stitching together multiple Street View images into a larger image” și „You may not screenshot
  Street View imagery or remove it from embedded sources for any purpose.”
- „These restrictions apply to all academic, nonprofit, and commercial projects.”
- atribuirea Google nu se acoperă, nu se taie și nu se mută.

Deci **nu descărcăm panoramele în proiect**. Le afișăm prin încorporarea oficială: aceleași imagini,
aceeași calitate, fără fișiere în repo și fără risc de drepturi.

**Încorporarea merge.** Am încărcat într-un `<iframe>` panorama din linkul utilizatorului
(`sv_pid=zThnLg9hbmGVBhLBd-uujg`) și s-a afișat interiorul: o galerie lungă cu busturi pe socluri și covor verde.
Adresa testată, fără cheie API:

```
https://www.google.com/maps/embed?pb=!4v<milisecunde>!6m8!1m7!1s<PANO>!2m2!1d<LAT>!2d<LNG>!3f<DIRECȚIE>!4f<ÎNCLINARE>!5f0.7820865974627469
```

Înclinarea negativă privește în jos. Cadrul are propriile comenzi Google: caseta „Vedeți în Google Maps”
în stânga sus, ecran complet în dreapta sus, selectorul de etaj (P1, P, S2, S1), busola și zoomul în dreapta,
sigla și atribuirea jos.

**Parametrii din linkul Arts & Culture.** `sv_pid` e identificatorul panoramei, `sv_h` direcția, `sv_p` înclinarea,
`sv_lat` și `sv_lng` poziția, `sv_z` zoomul. Uneori `sv_pid` vine împachetat în base64 și începe cu `CAIS`:
decodat, are 4 octeți de antet (`08 02 12 16`) urmați de cele 22 de caractere ale identificatorului.

### Ce nu se poate cu încorporarea

Cadrul e de pe alt domeniu, deci: nu îi putem citi pixelii (nu poate deveni textură în three.js), nu aflăm
încotro privește vizitatorul (holograma 3D nu se poate ancora în imaginea reală), iar rotița mouse-ului
rămâne în el cât timp cursorul e deasupra. Planul ține cont de toate trei.

### Soluția: „Sala reală 360°”

Fiecare sală care are o panoramă primește o a doua vedere, pe lângă machetă. Vederea se deschide ca foaie
pe tot ecranul, cu filmările sălii alături, ca vizitatorul să vadă sala adevărată și să asculte în continuare oamenii.

```
┌──────────────────────────────────────────────────────────────┐
│  II · SALA UNIRII            Machetă │ Sala reală 360°    ✕  │  bara noastră, în afara cadrului
├───────────────────────────────────────────┬──────────────────┤
│                                           │  Filmarea 1 / 3  │
│        cadrul Google Street View          │  [video / poză]  │
│        (nimic de-al nostru peste el)      │  titlu, cine     │
│                                           │  ‹  pauză  ›  sunet │
├───────────────────────────────────────────┴──────────────────┤
│  Imagini: Google Street View · Deschide în Google Arts & Culture │
└──────────────────────────────────────────────────────────────┘
```

Pe telefon: bara sus, cadrul pe 58% din înălțime, filmările dedesubt.

### De primit de la utilizator

Câte un link Arts & Culture pentru fiecare sală. Se obține așa: deschizi turul, mergi în sală, te întorci
spre unghiul care îți place și copiezi adresa din bara browserului.

| Sală | Link | Stare |
|---|---|---|
| Galeria de Onoare | linkul primit (`sv_pid=zThnLg9hbmGVBhLBd-uujg`) | de confirmat că e galeria; din imagine pare o galerie lungă cu busturi |
| Sala Unirii | — | lipsește |
| Sala Drepturilor Omului | — | lipsește |
| Sala Alexandru Ioan Cuza | — | lipsește |

O sală fără link nu primește butonul 360°. Pasul nu se blochează din cauza asta.

## Partea B — design

### Ce se vede azi (capturile din `review/shots/final/`)

- **Hero:** titlul pe patru rânduri, într-un grotesc lat și greu, concurează cu macheta; macheta e împinsă
  în dreapta și tăiată de margine; două butoane cu greutate aproape egală.
- **Săli:** două carduri opace acoperă aproape jumătate din scenă; holograma ocupă cam 28% din lățime;
  comenzile filmării se rup pe două rânduri, cu trei linkuri subliniate; covorul colorat inundă jumătatea de jos,
  mai ales pe telefon.
- **Litere:** o singură voce, de produs tehnic. Nimic nu spune „monument”.

### Principiile Apple pe care le aplicăm

Nu există un skill „Apple design” instalat în Claude Code pe acest calculator (am verificat `~/.claude/skills` și
pluginurile). Direcția de mai jos vine din principiile publice ale Apple (Human Interface Guidelines):

- **Claritate:** o singură idee pe ecran, literă mare și sigură, mult aer.
- **Deferență:** conținutul conduce. Macheta, holograma și sala reală sunt vedetele; panourile se retrag.
- **Profunzime:** straturi translucide peste scenă și mișcare care explică de unde vine și unde pleacă un element.
- Comenzi cunoscute: control segmentat, butoane-pastilă, butoane cu pictogramă de minimum 44 × 44 px.

Dacă utilizatorul instalează un plugin de profil (în directorul de pluginuri există „HIG Compliance Auditor”,
cu țintă Web), rulează-l ca verificare în plus la Pasul 10. Planul nu depinde de el.

### Litere

Capitalele romane clasice au ca model inscripția de la baza Columnei lui Traian, monumentul ridicat după
războaiele cu dacii. Cinzel e un font liber desenat după inscripțiile romane din secolul I, deci nota istorică
cerută are aici o legătură directă cu subiectul.

Am testat glifele românești (Ă Â Î Ș Ț) în Chrome: **Cinzel, EB Garamond, Forum și Cormorant Garamond le au pe
toate; Marcellus nu are Ș și Ț**, deci nu se folosește.

| Rol | Font | Unde | Cum |
|---|---|---|---|
| Titluri | `Cinzel Variable` | h1, numele sălilor, titluri de secțiune, cifre romane | 500 la titlul mare, 600 sub 24 px; spațiere +0,01em la mare, +0,2…0,32em la supratitluri |
| Lectură și citate | `EB Garamond Variable` | paragraful de sub titlu, nota sălii, vorbele oamenilor din filmări (cursiv) | 400, 19–23 px, rând de 1,5 |
| Interfață | `IBM Plex Sans` (rămâne) | butoane, meniuri, text mic | 400–600 |
| Cifre și etichete | `IBM Plex Mono` (rămâne) | dimensiuni, contoare, etichete | 400–500 |

- Cinzel nu are litere mici (le desenează ca majuscule mici). Folosește-l doar pentru titluri scurte, sub
  40 de caractere, niciodată pentru paragrafe. Textul rămâne scris normal în HTML; nu pune `text-transform`.
- Nu înlocui U cu V și nu inventa ortografii „latine”: strică lizibilitatea și cititoarele de ecran.
- Sălile se numerotează cu cifre romane (I–IV), cu varianta arabă pentru cititoarele de ecran.
- Scoate `@fontsource-variable/archivo`. Adaugă `@fontsource-variable/cinzel` și `@fontsource-variable/eb-garamond`
  (normal și cursiv), ambele sub licența OFL 1.1.
- Buget: fonturile noi cântăresc circa 40 kB (Cinzel) și circa 295 kB (EB Garamond, normal și cursiv, cu
  subsetul `latin-ext`, de care e nevoie pentru ă, ș, ț). Dacă depășești 400 kB transferați pentru fonturi,
  renunță la cursivul variabil și păstrează un singur cursiv static.
- Fără salt de pagină la încărcarea fonturilor: rezervă potrivită (`Georgia` cu `size-adjust`) și CLS sub 0,02.

### Culori, materiale, mișcare

- Hârtia și macheta albă rămân. Se adaugă `--stone: #e3ded3`, `--bronze: #7d5f27` (text mic pe hârtie, contrast
  circa 5:1), `--gold: #d9c28c` (doar pe fundal închis) și `--night: #101216` (foaia 360° și filmarea mare).
- Accentul sălii rămâne pe lucruri mici (linie, punct, pin, tenta hologramei). Pe suprafețe mari din 3D, cum e
  covorul, amestecă-l cu pardoseala (circa 35% accent), ca să nu mai inunde ecranul.
- **Sticlă:** panourile de peste scenă devin translucide: fundal `--surface` la 72%, `backdrop-filter:
  blur(24px) saturate(1.6)`, margine albă de 1 px la 50%. Cel mult două panouri de sticlă pe ecran. Cu
  `prefers-reduced-transparency` sau fără suport, panoul devine opac.
- Raze concentrice: 22 px panouri, 14 px elemente din interior, pastile complet rotunde. Spațiere pe trepte
  de 4 și 8 px.
- Mișcare: `cubic-bezier(0.32, 0.72, 0, 1)`, 180 / 320 / 520 ms; butoanele se strâng la 0,98 la apăsare.
  Totul se oprește cu `prefers-reduced-motion`.
- **Ornament:** un singur motiv, desenat de noi în SVG: meandrul (greaca), care apare și în bordura de marmură
  a galeriei reale. Se folosește ca linie fină sub titluri și ca desen de încărcare. Rămâne decorativ și
  ascuns cititoarelor de ecran; nu îl prezenta în text drept reconstituire istorică.

## Pașii

Fiecare pas se închide cu bucla de review descrisă mai jos.

### Pas 6 — Fundația de design

- `src/styles/tokens.css`: culorile, razele, treptele de spațiere, curbele de mișcare și familiile de font de mai sus.
- `src/main.tsx`, `package.json`: fonturile noi, Archivo scos.
- `src/styles/global.css`: clasele `.glass`, `.pill`, `.segmented`, `.icon-btn`, `.overline`; titlurile trec pe Cinzel.
- `src/content/roman.ts`: `toRoman(n)`.
- Nu schimba încă așezarea în pagină.

*Gata când:* toate titlurile sunt în Cinzel, cu diacriticele corecte la „București”, „Săli”, „Hartă”; contrastul
textului pe sticlă e cel puțin 4,5:1 peste cel mai colorat fundal (covorul albastru din Sala Unirii); testele trec.

### Pas 7 — Sala reală 360°

- `src/content/rooms.ts`: câmp opțional `streetView?: StreetView` în `RoomSpec`.
- `src/content/streetView.ts`, fără dependențe:
  - `fromArtsLink(url)`: întoarce `{ pano, heading, pitch, lat, lng, zoom, source }`; acceptă și `sv_pid`
    împachetat (`CAIS…`); aruncă o eroare clară dacă linkul nu are `sv_pid`.
  - `embedUrl(view)`: dacă există `import.meta.env.VITE_GOOGLE_MAPS_KEY`, folosește varianta documentată
    `https://www.google.com/maps/embed/v1/streetview?key=…&pano=…&heading=…&pitch=…&fov=…&language=ro`;
    altfel adresa fără cheie de mai sus.
  - `mapsUrl(view)`: `https://www.google.com/maps/@?api=1&map_action=pano&pano=…&heading=…&pitch=…`.
- `src/ui/RealRoom.tsx`: foaia din schiță, ca `<dialog>` deschis cu `showModal()`.
  - **Două clicuri:** cadrul se creează abia după ce vizitatorul apasă „Vezi sala reală în 360°”. Până atunci
    pagina nu trimite nicio cerere către Google. Lângă buton: „Imaginile se încarcă de la Google Street View.”
  - Nimic de-al nostru peste cadru. Colțurile cadrului rămân drepte sau rotunjite cu cel mult 6 px, ca atribuirea
    de jos să se vadă întreagă.
  - `title` pe cadru: „Vedere 360° din {sală}, Google Street View”; `allowfullscreen`; `loading="lazy"`.
  - Filmările folosesc aceeași stare ca holograma (`useTour`: `recording`, `muted`, `paused`), deci filmarea
    aleasă în machetă rămâne aleasă aici și invers.
  - Cât e deschisă foaia: scena 3D nu mai desenează cadre și filmarea din hologramă stă pe pauză. La închidere
    revin amândouă, iar focusul se întoarce pe butonul care a deschis foaia.
  - Esc închide. Sub cadru: „Imagini: Google Street View” și linkul către pagina Arts & Culture a sălii.
- `src/ui/RoomSection.tsx`: butonul apare doar la sălile cu `streetView`. `src/ui/MapSection.tsx`: semn „360°”
  în legendă la aceleași săli. `src/ui/Footer.tsx`: un rând despre sursa imaginilor.
- Teste (`scripts/smoke.mjs`), cu cererile către `google.com/maps/embed` interceptate și înlocuite cu o pagină
  locală, ca testele să nu depindă de rețea: butonul există doar unde trebuie; nicio cerere către Google înainte
  de clic; după clic, `src`-ul cadrului începe cu `https://www.google.com/maps/embed`; Esc închide și întoarce
  focusul; `live.frames` nu mai crește cât e deschisă foaia; `fromArtsLink` trece pe linkul real și pe varianta `CAIS`.
- Capturile (`scripts/shots.mjs`) folosesc aceeași pagină locală în locul cadrului Google: nu facem capturi
  de ecran cu imagini Street View.
- Nu adăuga în `public/` niciun fișier provenit de la Google și nu scrie cod care cere `streetviewpixels` sau
  alte adrese de plăci de imagine.

*Gata când:* din sala cu link se ajunge în vederea 360° cu un clic și înapoi cu Esc; direcția de pornire e
cea din link (compară cu pagina Arts & Culture deschisă alături); atribuirea Google e întreagă la 1440 × 900,
1366 × 650 și 390 × 844; filmările se schimbă din foaie; fără link, butonul lipsește.

### Pas 8 — Hero, bara de sus, încărcare

- Compoziție centrată, ca o pagină de produs Apple: supratitlu („București · tur 3D”), titlul „Palatul Parlamentului”
  pe cel mult două rânduri, un rând de text în Garamond, un singur buton-pastilă („Începe turul”) și un link
  („Harta sălilor”), apoi macheta mare, centrată. `h1` păstrează textul complet pentru cititoarele de ecran.
- `src/three/poses.ts`: poza de exterior și `framingAt` se reglează ca macheta să stea centrată și întreagă.
- Cele trei cifre devin un rând fin la baza ecranului, cu valorile în Plex Mono.
- La derulare, titlul se micșorează și se stinge în prima parte a drumului spre prima sală.
- Bara de sus: sticlă, linie fină, numele în Cinzel. Indicatorul de opriri din dreapta: punctul activ devine pastilă alungită.
- Mesajul de încărcare: meandrul care se desenează, apoi dispare când scena e gata.

*Gata când:* la 1440 × 900 macheta ocupă cel puțin 55% din lățime și nu e tăiată; la 390 × 844 cel puțin 80%;
titlul nu acoperă macheta la niciuna dintre cele trei mărimi de ecran; un singur buton principal.

### Pas 9 — Sălile

- Panoul sălii devine compact, din sticlă, jos în stânga: supratitlu „Sala II din IV”, numele în Cinzel, nota în
  Garamond cursiv, două cifre. Restul textului și cifrelor stau sub „Despre sală”, un element care se deschide.
- Filmările devin un mic player din sticlă, pe un singur rând: înapoi, pauză, înainte, sunet, mărește — butoane cu
  pictogramă de 44 px, fiecare cu `aria-label`; „1 / 3” în loc de puncte pe telefon; vorbele omului în Garamond cursiv.
  Butonul de sunet apare doar la filmările care au pistă audio.
- Control segmentat „Machetă | Sala reală 360°” sus, la mijloc, doar în sălile cu panoramă; a doua opțiune
  deschide foaia de la Pasul 7.
- Holograma mai mare: reglează `camera` și `hologram.width` din `rooms.ts` până ocupă cel puțin 38% din lățime
  pe desktop. Covorul mai potolit, cum scrie la culori.
- Swipe-ul, tastele stânga/dreapta și cititorul de ecran trebuie să meargă exact ca înainte.

*Gata când:* panourile acoperă cel mult 30% din ecran la 1440 × 900; comenzile filmării stau pe un rând la toate
cele trei mărimi; 55 de cadre pe secundă sau mai mult cu sticla activă; toate testele vechi trec.

### Pas 10 — Hartă, subsol, restanțe, verificare finală

- Harta: etichetele pinurilor ca pastile de sticlă cu cifră romană; legenda la fel.
- Subsol: surse, imagini (Google Street View), fonturi (Cinzel și EB Garamond, OFL).
- Restanțele din `review/REVIEW.md`, în ordinea asta, cât încap: eticheta „Galeria de Onoare” peste Sala Cuza pe
  desktop; cadrul de tranzit dintre galerie și Sala Unirii; umbre de contact în săli; `frameloop="demand"`;
  coronamentul de pe acoperișuri și arcadele adânci ale pavilioanelor.
- Actualizează `README.md` și `PLAN.md` (pașii 6–10 bifați, abaterile notate).

*Gata când:* reviewer-ul dă „APROBAT” sau „APROBAT CU OBSERVAȚII” fără probleme blocante pe tot turul.

### Pas 11 — opțional: panoramă proprie, cu holograma în sala reală

Doar dacă utilizatorul aduce fotografii 360° **făcute de el** sau are acordul scris al Camerei Deputaților.
Cu fișierul în proiect dispar limitele cadrului Google: imaginea devine o sferă în three.js în jurul camerei,
macheta se topește în fotografia reală, iar holograma rămâne în spațiu, în fața ei.

- `RoomSpec.panorama?: { src, credit, yaw }`; fișiere echirectangulare JPEG, 8192 × 4096 pe desktop și
  4096 × 2048 pe telefon, încărcate abia la cerere.
- Imaginea de test se generează din cod (`scripts/make-test-pano.mjs`: grilă cu punctele cardinale), ca
  funcția să poată fi construită fără nicio fotografie.
- Când o sală are și `panorama`, și `streetView`, controlul segmentat arată vederea proprie.

Alternativa cu imaginile Google și hologramă ancorată există, dar cere Maps JavaScript API, cu cheie și cont de
facturare Google. Nu o porni fără acordul utilizatorului.

## Bucla de review, după fiecare pas

1. Termini pasul, rulezi build, lint și teste, faci commit și push.
2. Pornești agentul **`pp-reviewer`** în fundal, pe un instantaneu al commitului (un `git worktree` detașat într-un
   folder temporar, cu `node_modules` legat simbolic), ca să poți lucra mai departe fără să-i schimbi fișierele
   sub el. Îi dai: numărul pasului, commitul, criteriile „Gata când”, cel mult 6 capturi de deschis și cerința să
   scrie devreme în `review/REVIEW.md`, nu la sfârșit.
3. Cât lucrează el, începi pasul următor doar în fișiere pe care review-ul nu le atinge.
4. Când termină: citești secțiunea „Faza 2 — Pas N”, repari tot ce e blocant sau major, bifezi ce ai făcut și
   scrii „Ce am aplicat”. Ce amâni primește un motiv scris. Cel mult două runde pe pas.
5. Ștergi folderul temporar al review-ului.

Pentru faza asta, adaugă în `.claude/agents/pp-reviewer.md` (la „La ce te uiți”) patru verificări:

- direcția de design e acum „machetă arhitecturală + litere romane + sticlă”, nu grotescul de dinainte;
- atribuirea Google e vizibilă și neacoperită în vederea 360°;
- în repo nu există imagini provenite din Street View și nicio cerere către Google înainte de clicul vizitatorului;
- diacriticele românești se văd corect în titlurile cu Cinzel.

## Ce nu intră în faza asta

Tema închisă pentru toată pagina, versiunea în engleză, publicarea online, săli noi.

## Mesajul de pornire pentru Opus 5.5

```
Citește PLAN-FAZA-2.md din rădăcina proiectului și aplică-l de la Pasul 6, în ordine.
După fiecare pas rulează build, lint și teste, fă commit și push, apoi pornește agentul pp-reviewer
în fundal, cum scrie la „Bucla de review”, și aplică-i observațiile înainte să închizi pasul.
Linkurile Arts & Culture pentru săli: <lipește-le aici, câte unul pe sală>.
Oprește-te și întreabă-mă doar dacă trebuie o decizie care nu e în plan.
```
