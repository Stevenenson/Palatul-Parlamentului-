import { create } from 'zustand'
import { ROOMS } from '../content/rooms'

/**
 * Valori care se schimbă la fiecare cadru. Stau în afara React ca să nu
 * redeseneze interfața la fiecare pixel de scroll; scena le citește în `useFrame`.
 */
export const live = {
  /** Poziția în tur cerută de scroll: 0 = exterior, 1..n = săli, ultima = hartă. */
  tTarget: 0,
  /** Aceeași poziție, netezită; după ea se mișcă efectiv camera. */
  t: 0,
  /** Oprirea spre care zboară camera după un salt (click pe pin, meniu), altfel `null`. */
  flightTo: null as number | null,
  /** Carcasa palatului: 1 opacă, 0 transparentă. */
  solid: 1,
  /** 0..1: modul hartă. */
  map: 0,
  /** Utilizatorul trage cu mouse-ul sau cu degetul pe scenă. */
  dragging: false,
  /** Poziția cursorului, normalizată la -1..1, pentru privitul în jur din săli. */
  pointerX: 0,
  pointerY: 0,
  /** Cât a tras utilizatorul spre filmarea vecină, în timpul unui swipe: -1..1. */
  swipe: 0,
  reducedMotion: false,
  /** Pagina a fost deschisă cu `?debug`: fără legănare, ca două capturi la fel să iasă identice. */
  debug: false,
  /** Cadre desenate de la pornire; scripturile de test așteaptă după el. */
  frames: 0,
}

type TourState = {
  /** Oprirea cea mai apropiată de poziția de scroll. */
  stop: number
  /** Scroll-ul s-a așezat exact pe oprire. */
  settled: boolean
  /** Camera e într-un zbor pornit de un salt. */
  flying: boolean
  /** A apucat utilizatorul să rotească macheta. */
  hasOrbited: boolean
  /**
   * Filmarea curentă din fiecare sală. Numărul crește și scade fără limită, ca holograma
   * să alunece mereu în direcția gestului; pe ecran contează restul împărțirii la numărul de filmări.
   */
  recording: number[]
  /** Filmările pornesc fără sunet; utilizatorul îl pornește din card. */
  muted: boolean
  /** Utilizatorul a pus filmarea pe pauză. Se anulează când trece la altă filmare. */
  paused: boolean
  /** Sala evidențiată pe hartă (cursorul e pe pinul sau pe rândul ei din legendă). */
  hoverRoom: number | null
  /** Sala a cărei vedere reală 360° e deschisă (indice în `ROOMS`), altfel `null`. */
  real: number | null
  /** Starea scenei 3D: se încarcă, desenează, sau nu a putut porni (fără WebGL, eroare). */
  scene: 'loading' | 'ready' | 'failed'
}

type TourStore = TourState & {
  set: (patch: Partial<TourState>) => void
  stepRecording: (room: number, direction: 1 | -1) => void
  showRecording: (room: number, index: number) => void
}

/** Indicele filmării afișate, din poziția fără limită. */
export const wrapIndex = (position: number, count: number) => ((position % count) + count) % count

export const useTour = create<TourStore>((set) => ({
  stop: 0,
  settled: true,
  flying: false,
  hasOrbited: false,
  recording: ROOMS.map(() => 0),
  muted: true,
  paused: false,
  hoverRoom: null,
  real: null,
  scene: 'loading',
  set: (patch) => set(patch),
  stepRecording: (room, direction) =>
    set((state) => ({
      paused: false,
      recording: state.recording.map((p, i) => (i === room ? p + direction : p)),
    })),
  showRecording: (room, index) =>
    set((state) => {
      const count = ROOMS[room].recordings.length
      const position = state.recording[room]
      // Drumul cel mai scurt până la filmarea cerută, în oricare direcție.
      let delta = index - wrapIndex(position, count)
      if (delta > count / 2) delta -= count
      if (delta < -count / 2) delta += count
      return { paused: false, recording: state.recording.map((p, i) => (i === room ? p + delta : p)) }
    }),
}))
