# Palace of the Parliament — 3D tour

A site where you first see the Palace of the Parliament from above, in the city, then descend to its 3D model,
which you can turn. From there you scroll from hall to hall, see a hologram in each hall with videos you swipe
between, and jump straight to a hall from the map with pins. A second page tells the history of the building
and reads it as architecture.

The site is live at <https://stevenenson.github.io/Palatul-Parlamentului-/>. The QR code for the address is
in `public/qr.svg`.

Status: test version. The model and the four halls are built in code; the videos and photos are test content for
now, marked as such on the page.

## Getting started

You need Node 22 or newer.

```bash
git clone https://github.com/Stevenenson/Palatul-Parlamentului-.git
cd Palatul-Parlamentului-
npm install
npm run dev
```

Then open `http://localhost:5173/`. The history page is at `http://localhost:5173/history/` (the old `/istorie/`
address redirects there).

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | starts the dev server |
| `npm run build` | type-checks and builds the publishable version into `dist/` |
| `npm run preview` | serves what `build` produced, locally |
| `npm run lint` | checks the code with ESLint |
| `npm run test:e2e` | browser tests: scroll, swipe, pins, keyboard |
| `npm run shots -- <label>` | screenshots on desktop, laptop and phone, in `review/shots/<label>/` |
| `npm run qr` | rewrites the QR code for the public address, in `public/qr.svg` |
| `node scripts/fetch-city.mjs` | rebuilds the city model from OpenStreetMap, into `public/data/oras.json` |

Tests and screenshots use the Google Chrome installed on the machine.

## Publishing

On every push to `main`, `.github/workflows/pages.yml` builds the site and publishes it on GitHub Pages. The site
lives in a subfolder named after the repo, which the build receives through the `BASE_PATH` variable; locally,
without it, the base address stays `/`.

## Where to change the content

The tour content lives in `src/content/rooms.ts`: the names and texts of the halls, the accent colour, the camera
position, where the hologram stands, the videos and the photos.

- Videos: put the MP4 files in `public/media/videos/` and list them under `recordings` in their hall.
- Photos: create `public/media/photos/`, put them there and list them under `photos`.
- The real hall in 360°: go to the hall on Google Arts & Culture, copy the address from the browser and put it in
  `streetView: fromArtsLink('…')`. The images are not downloaded: they are shown through Google's embed.
- A video without sound gets `silent: true`, so the player doesn't show it a sound button.
- The city at the first stop (`src/three/city/buildCity.ts`): buildings and their parts, trees, paths, parks,
  car parks, sports grounds, water and streets come from OpenStreetMap, through `scripts/fetch-city.mjs`
  (© OpenStreetMap contributors, ODbL). The landmark labels are in `src/content/city.ts`.
- Zooming the model (the + and − buttons, pinch, Ctrl + wheel, the + and − keys): `src/state/zoom.ts`.
- The history page: chapters, figures, images and sources are in `src/content/history.ts`, and what the model
  shows in each chapter in `src/history/stage/states.ts`. The old images are in `public/media/history/`.

## How it's organised

```
src/content/    halls, tour stops, texts, history chapters
src/history/    the history page: the thread, the chapters, the model that follows your reading
src/scroll/     the scroll director: stops, keyboard, direct links
src/state/      tour state
src/three/      the 3D scene: palace, halls, holograms, map, camera
src/ui/         the page panels
scripts/        screenshots and tests
review/         the reviewer agent's log
```

`PLAN.md` holds the project steps and the deviations from the original plan (in Romanian). `review/REVIEW.md` is
the log of the reviewer agent (`.claude/agents/pp-reviewer.md`), which checks every step and notes what to improve.

## Sources

The facts about the building come from the Romanian Wikipedia article “Palatul Parlamentului”. The model is an
approximate reconstruction made in code, not a survey of the building.
