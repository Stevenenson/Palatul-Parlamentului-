import { create } from 'zustand'

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
  reducedMotion: false,
  /** Pagina a fost deschisă cu `?debug`: fără legănare, ca două capturi la fel să iasă identice. */
  debug: false,
  /** Cadre desenate de la pornire; scripturile de test așteaptă după el. */
  frames: 0,
}

type TourStore = {
  /** Oprirea cea mai apropiată de poziția de scroll. */
  stop: number
  /** Scroll-ul s-a așezat exact pe oprire. */
  settled: boolean
  /** Camera e într-un zbor pornit de un salt. */
  flying: boolean
  /** A apucat utilizatorul să rotească macheta. */
  hasOrbited: boolean
  set: (patch: Partial<Omit<TourStore, 'set'>>) => void
}

export const useTour = create<TourStore>((set) => ({
  stop: 0,
  settled: true,
  flying: false,
  hasOrbited: false,
  set: (patch) => set(patch),
}))
