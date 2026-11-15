# Progres — Palatul Parlamentului

Starea proiectului, ca o sesiune nouă să poată continua fără istoricul conversațiilor vechi.
**Actualizează fișierul la sfârșitul fiecărui pas** (ce s-a făcut, ce a rămas deschis).

Ultima actualizare: 15 noiembrie 2026, după commit-ul `e32f809`.

## Ce e proiectul

Aplicație web despre Palatul Parlamentului, cu două pagini:

- **Turul** (`/`):
  - o machetă 3D mare a palatului, generată din cod, pe care o poți roti;
  - un tur pe scroll din sală în sală, cu câte o hologramă și filmări cu swipe în fiecare sală;
  - o hartă 3D cu pinuri.
- **Istoria** (`/istorie/`): o cronologie pe un fir care se umple pe măsură ce citești. Lângă ea stă
  macheta 3D, fixă, care se schimbă la fiecare capitol.

Planul pe pași e în `PLAN.md`, iar Faza 2 în `PLAN-FAZA-2.md`. Pașii 0–10 și 12 sunt făcuți. Pasul 11,
cu fotografii 360° proprii, e opțional și nu e început.

## Stack și comenzi

Folosim Vite 8 (multi-page), React 19, TypeScript, `three` 0.187, `@react-three/fiber` 9,
`@react-three/postprocessing` (N8AO) și `zustand`. Fonturile sunt Cinzel, EB Garamond, IBM Plex Sans și
IBM Plex Mono. Testele rulează cu `playwright-core` pe Chrome-ul instalat.

```
npm run dev                  # http://localhost:5173/  și  /istorie/
npm run build                # tsc --noEmit && vite build
npm run lint
npm run test:e2e             # scripts/smoke.mjs — 42/42 trec
npm run shots -- <etichetă>  # capturi în review/shots/<etichetă>/ (ignorat de git)
```

Pornirea turului are ~81,5 kB gzip, iar `buildPalace` ~249 kB gzip și se încarcă lazy. Avertismentul
Vite pentru chunk-ul de peste 500 kB exista și înainte.

## Reguli (de respectat mereu)

- **Limba**: utilizatorul scrie în română. Răspunsurile, documentația, interfața, comentariile și
  commit-urile se scriu în română, cu diacritice.
- **Repo public**: `https://github.com/Stevenenson/Palatul-Parlamentului-`, ramura `main`.
  - Commit-urile folosesc doar adresa `noreply` setată deja în `git config user.email`.
  - Emailul personal nu apare nicăieri: nici în commit-uri, nici în cod, nici în cereri externe.
  - Push se face doar cu `git push` simplu, niciodată `--force`.
  - Commit și push după fiecare pas.
- **Întreabă înainte** să urci filmări reale cu oameni sau poze reale din săli.
- **Google Street View**: doar încorporarea oficială. Imaginile nu se descarcă, nu se capturează și nu
  se păstrează în repo. Testele și capturile folosesc un cadru local în locul lui.
- **Fără `npx --yes`** pentru pachete noi, pentru că clasificatorul refuză descărcarea.
- **Limita de utilizare e strânsă**: cel mult un subagent odată, cu o sarcină delimitată.
- **Calitatea vizuală contează**: un model mai vechi a fost respins fiindcă „arăta ieftin”.

## Review

Subagentul `pp-reviewer` (`.claude/agents/pp-reviewer.md`) scrie în `review/REVIEW.md`. Fluxul:

1. Faci un git worktree detașat al commit-ului într-un folder temporar și legi simbolic `node_modules`.
2. Pornești reviewer-ul în fundal, cu cel mult 6–7 imagini.
3. Aplici observațiile și le notezi în REVIEW.md, la „Ce am aplicat”.
4. Ștergi worktree-ul.

Ultimul review a fost pe Pasul 12. Commit-ul `e32f809` (bara de sus și textul nou) **nu a trecut încă
prin review**.

## Unde e codul

### Turul

| Ce | Fișier |
|---|---|
| Sălile, textele, filmările (`recordings`, `silent: true`) | `src/content/rooms.ts` |
| Macheta procedurală | `src/three/palace/buildPalace.ts`, `massing.ts` |
| Scena turului | `src/three/Scene.tsx`, `src/three/poses.ts` |
| Luminile și terenul, comune ambelor pagini | `src/three/Lights.tsx` (`PAPER`, `AO_ENABLED`, `Lights`, `Ground`) |
| Bara de sus (`page: 'tur' \| 'istorie'`) | `src/ui/TopBar.tsx` |
| Subsolul | `src/ui/Footer.tsx` |
| Linkuri între pagini | `src/ui/pages.ts` (`HISTORY_URL`, `tourUrl(stop?)`) |
| Detectarea WebGL | `src/ui/webgl.ts` |
| Scena cu fallback | `src/ui/SceneBoundary.tsx` (`onError`) |
| Stiluri | `src/styles/tokens.css`, `global.css` |
| Media | `public/media/videos/`, `public/media/photos/` (goale, se așteaptă materialele) |

### Istoria

| Ce | Fișier |
|---|---|
| Intrarea | `istorie/index.html` → `src/history/main.tsx`; `vite.config.ts` are două intrări |
| **Textul capitolelor, sursele, notele, fotografiile** | `src/content/history.ts` |
| Pagina: firul, cuprinsul, figurile, sursele | `src/history/HistoryPage.tsx` |
| Poziția de citire | `src/history/progress.ts` (linia de citire la 0,45 pe desktop și 0,66 sub 760 px) |
| Canvas-ul | `src/history/stage/HistoryStage.tsx` (`frameloop="demand"`) |
| Pozele de cameră și stările pe capitol | `src/history/stage/states.ts` (`POSES`, `CLIP`, `MOVE`, `OUTLINE`, `DIMENSIONS`) |
| Ridicarea palatului cu tăietură și cotele | `src/history/stage/rise.ts` |
| Dealul vechi, curbele de nivel, biserica mutată | `src/history/stage/oldSite.ts` (axe: +Z est, +X nord) |
| Desenul mutării bisericii | `src/history/drawings/MihaiVoda.tsx` |
| Stilurile | `src/styles/history.css` |
| Imaginile de arhivă (domeniu public) | `public/media/history/` (`curtea-arsa-1841.jpg`, `mihai-voda-1901.jpg`) |

Pagina are 8 capitole: dealul (1594), concursul (1977), temelia (1984), demolările (1985), șantierul
(anii ’80), revoluția (1989), cifrele și azi.

Sursele sunt trei articole de pe ro.wikipedia: Palatul Parlamentului, Mănăstirea Mihai Vodă și Dealul
Arsenalului. Valorile divergente (1983/1984, 240/245 m, 84/86 m) sunt notate în `HISTORY_NOTES`.

### Teste și documentație

- `scripts/smoke.mjs` conține testele e2e, inclusiv cele pentru istorie.
- `scripts/shots.mjs` face capturile pentru tur și istorie, la trei mărimi.
- `README.md` și `PLAN.md` (bifele și abaterile fiecărui pas).

## Ce a rămas deschis

1. **Review**: rulează `pp-reviewer` pe `e32f809`, opțional sau la următorul pas mare.
2. **Panoramele 360°**: maparea sală ↔ panoramă e **neconfirmată** de utilizator.
   - `sv_pid=14eTnatAqjBDRpLrMDlVdg` → Galeria de Onoare.
   - `sv_pid=hIaGuTOuL8428i_hbIqn6w` → Sala Drepturilor Omului.
   - Nefolosite: `2yqLqyAzT6SFvYy_IOh52A` (marmură roz, poate Sala Nicolae Bălcescu) și
     `zThnLg9hbmGVBhLBd-uujg` (galerie cu busturi).
   - Lipsesc linkurile pentru Sala Unirii și Sala Cuza.
3. **Restanțe din review-uri**:
   - fallback de font cu `size-adjust`;
   - macheta e mică pe telefon;
   - punctele de sub filmări pe telefon;
   - o singură foaie de sticlă pe telefon;
   - eticheta pinului Sălii Unirii se suprapune pe hartă;
   - aspectul hologramei și bordura covoarelor;
   - test cu o filmare cu sunet;
   - fps-ul în săli;
   - macheta: coronament, arcade, umbre de contact, ramele foto 3D.
4. **Restanțe pe istorie**:
   - linii de cotă mai groase (`Line2`);
   - vederea de sus mai înclinată în capitolul VII;
   - cota de înălțime lângă text în capitolul V;
   - cartierul Uranus (are sursă doar în engleză).
5. **Netestat**: un telefon real, Safari pe iPhone, `PhotoStrip` cu poze reale.
6. **Așteptăm de la utilizator**:
   - filmări MP4 în `public/media/videos/`;
   - poze în `public/media/photos/`;
   - părerea despre aspect.

## Jurnal pe scurt

| Commit | Ce |
|---|---|
| Pașii 0–5 | Scheletul, macheta, turul, sălile |
| `143f3d6` … `587f4cf` | Faza 2 și README |
| `4d35f65` | Pas 12: pagina de istorie |
| `d766993` | Review-ul pe Pasul 12, aplicat |
| `499fd99` | Imaginile vechi ale paginii de istorie |
| `e32f809` | „Istorie” lângă siglă și detalii noi în capitole |
