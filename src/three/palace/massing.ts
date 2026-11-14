/**
 * Volumele palatului, în metri. Fațada principală privește spre +Z, axa X merge
 * de-a lungul ei, iar baza clădirii e la y = 0.
 *
 * Proporțiile vin din analiza fotografiilor de referință (vezi `.img2threejs/image-analysis.md`):
 * corp de bază până la 28 m, registru median până la 48 m, turnuri laterale până la 56 m,
 * turn central până la 84 m. Adâncimile și fațadele care nu se văd în fotografii
 * (spate, lateral, acoperișuri, curți) sunt deduse prin simetrie.
 */

export type WindowKind = 'rect' | 'arch' | 'square'

/** Un registru orizontal de ferestre, între două înălțimi absolute. */
export type Band = { y0: number; y1: number; kind: WindowKind; pilasters?: boolean }

/** front = +Z, back = -Z, right = +X, left = -X */
export type Face = 'front' | 'back' | 'left' | 'right'

export type Cornice = { depth: number; height: number; parapet: number }

export type Volume = {
  id: string
  x0: number
  x1: number
  z0: number
  z1: number
  y0: number
  y1: number
  bands?: Band[]
  /** Fețele care primesc ferestre și pilaștri. Implicit, toate patru. */
  faces?: Face[]
  /** Fețele care primesc atic (parapet). Implicit, aceleași ca `faces`. */
  parapet?: Face[]
  /** Înălțimile brâielor orizontale care despart registrele. */
  courses?: number[]
  cornice?: Cornice
  /** Lățimea zonei pline de la colțuri, fără ferestre. */
  margin?: number
  /** Numărul de travee pe fețele lungi, când cel socotit din modul nu se potrivește cu clădirea. */
  bays?: number
}

/** Modulul de travee: distanța dintre axele a două ferestre vecine. */
export const BAY = 6.2

export const PALACE = {
  width: 270,
  depth: 240,
  height: 84,
  /** Nivelul terenului din jurul teraselor. */
  ground: -9,
}

const MAIN_CORNICE: Cornice = { depth: 1.9, height: 1.7, parapet: 1.3 }
const TIER_CORNICE: Cornice = { depth: 1.5, height: 1.4, parapet: 1.2 }
const TOWER_CORNICE: Cornice = { depth: 2.1, height: 1.9, parapet: 1.4 }

const BASE_BANDS: Band[] = [
  { y0: 1.8, y1: 7.4, kind: 'rect' },
  { y0: 9.2, y1: 21.4, kind: 'arch', pilasters: true },
  { y0: 22.9, y1: 25.6, kind: 'square' },
]
const BASE_COURSES = [8.3, 22.1]

const MID_BANDS: Band[] = [
  { y0: 29.9, y1: 34.6, kind: 'rect' },
  { y0: 35.7, y1: 40.4, kind: 'rect' },
  { y0: 41.4, y1: 46.2, kind: 'arch', pilasters: true },
]
const MID_COURSES = [35.1, 40.9]

const PAVILION_BANDS: Band[] = [...BASE_BANDS, { y0: 29.6, y1: 35.9, kind: 'arch', pilasters: true }]

const SIDE_TOWER_BANDS: Band[] = [...MID_BANDS, { y0: 48.6, y1: 53.9, kind: 'arch', pilasters: true }]

const TOWER_BANDS: Band[] = [
  { y0: 49.6, y1: 55.4, kind: 'arch' },
  { y0: 56.9, y1: 61.2, kind: 'rect' },
  { y0: 62.4, y1: 66.7, kind: 'rect' },
  { y0: 67.9, y1: 72.2, kind: 'rect' },
  { y0: 73.6, y1: 81.4, kind: 'arch', pilasters: true },
]
const TOWER_COURSES = [56.1, 72.9]

const REAR_BANDS: Band[] = [
  { y0: 49.6, y1: 54.2, kind: 'rect' },
  { y0: 55.4, y1: 61.6, kind: 'arch', pilasters: true },
]

function mirrorX(volume: Volume, id: string): Volume {
  const flip: Record<Face, Face> = { front: 'front', back: 'back', left: 'right', right: 'left' }
  return {
    ...volume,
    id,
    x0: -volume.x1,
    x1: -volume.x0,
    faces: volume.faces?.map((f) => flip[f]),
    parapet: volume.parapet?.map((f) => flip[f]),
  }
}

function mirrorZ(volume: Volume, id: string): Volume {
  const flip: Record<Face, Face> = { front: 'back', back: 'front', left: 'left', right: 'right' }
  return {
    ...volume,
    id,
    z0: -volume.z1,
    z1: -volume.z0,
    faces: volume.faces?.map((f) => flip[f]),
    parapet: volume.parapet?.map((f) => flip[f]),
  }
}

const pavilionFrontRight: Volume = {
  id: 'pavilion-front-right',
  x0: 103,
  x1: 135,
  z0: 88,
  z1: 120,
  y0: 0,
  y1: 38,
  bands: PAVILION_BANDS,
  courses: [...BASE_COURSES, 27.2],
  cornice: MAIN_CORNICE,
  margin: 3.4,
}

const sideTowerFrontRight: Volume = {
  id: 'side-tower-front-right',
  x0: 70,
  x1: 94,
  z0: 72,
  z1: 103,
  y0: 28,
  y1: 56,
  bands: SIDE_TOWER_BANDS,
  courses: [...MID_COURSES, 47.4],
  cornice: TIER_CORNICE,
  margin: 2.6,
}

const midRight: Volume = {
  id: 'mid-right',
  x0: 70,
  x1: 97,
  z0: -57,
  z1: 62,
  y0: 28,
  y1: 48,
  bands: MID_BANDS,
  courses: MID_COURSES,
  cornice: TIER_CORNICE,
  faces: ['left', 'right'],
}

const towerEndRight: Volume = {
  id: 'tower-end-right',
  x0: 31,
  x1: 48,
  z0: 16.4,
  z1: 79.6,
  y0: 48,
  y1: 86.2,
  bands: TOWER_BANDS.map((band, i) => (i === 4 ? { ...band, y1: 83.2 } : band)),
  courses: TOWER_COURSES,
  cornice: TOWER_CORNICE,
  faces: ['front', 'back', 'right'],
  margin: 2.2,
}

const pavilionFrontLeft = mirrorX(pavilionFrontRight, 'pavilion-front-left')
const sideTowerFrontLeft = mirrorX(sideTowerFrontRight, 'side-tower-front-left')

export const VOLUMES: Volume[] = [
  // ——— Corpul de bază: trei registre sub cornișa principală de la 28 m ———
  {
    id: 'base',
    x0: -129,
    x1: 129,
    z0: -112,
    z1: 112,
    y0: 0,
    y1: 28,
    bands: BASE_BANDS,
    courses: BASE_COURSES,
    cornice: MAIN_CORNICE,
    margin: 30,
  },
  {
    id: 'risalit-front',
    x0: -50,
    x1: 50,
    z0: 112,
    z1: 115.5,
    y0: 0,
    y1: 28,
    bands: BASE_BANDS,
    courses: BASE_COURSES,
    cornice: MAIN_CORNICE,
    faces: ['front'],
    parapet: ['front', 'left', 'right'],
    margin: 3.4,
  },
  {
    id: 'risalit-back',
    x0: -50,
    x1: 50,
    z0: -115.5,
    z1: -112,
    y0: 0,
    y1: 28,
    bands: BASE_BANDS,
    courses: BASE_COURSES,
    cornice: MAIN_CORNICE,
    faces: ['back'],
    parapet: ['back', 'left', 'right'],
    margin: 3.4,
  },
  pavilionFrontRight,
  pavilionFrontLeft,
  mirrorZ(pavilionFrontRight, 'pavilion-back-right'),
  mirrorZ(pavilionFrontLeft, 'pavilion-back-left'),

  // ——— Registrul median: un inel de corpuri în jurul a două curți interioare ———
  {
    id: 'mid-front',
    x0: -97,
    x1: 97,
    z0: 62,
    z1: 100,
    y0: 28,
    y1: 48,
    bands: MID_BANDS,
    courses: MID_COURSES,
    cornice: TIER_CORNICE,
    faces: ['front', 'back'],
    parapet: ['front'],
    margin: 32,
  },
  {
    id: 'mid-back',
    x0: -97,
    x1: 97,
    z0: -95,
    z1: -57,
    y0: 28,
    y1: 48,
    bands: MID_BANDS,
    courses: MID_COURSES,
    cornice: TIER_CORNICE,
    faces: ['front', 'back', 'left', 'right'],
    parapet: ['back', 'left', 'right'],
  },
  midRight,
  mirrorX(midRight, 'mid-left'),
  {
    id: 'mid-spine',
    x0: -48,
    x1: 48,
    z0: -57,
    z1: 62,
    y0: 28,
    y1: 48,
    bands: MID_BANDS,
    courses: MID_COURSES,
    cornice: TIER_CORNICE,
    faces: ['left', 'right'],
  },
  sideTowerFrontRight,
  sideTowerFrontLeft,
  mirrorZ(sideTowerFrontRight, 'side-tower-back-right'),
  mirrorZ(sideTowerFrontLeft, 'side-tower-back-left'),

  // ——— Turnul central și corpul din spatele lui ———
  {
    id: 'rear-spine',
    x0: -40,
    x1: 40,
    z0: -57,
    z1: 18,
    y0: 48,
    y1: 64,
    bands: REAR_BANDS,
    courses: [54.8],
    cornice: TIER_CORNICE,
    faces: ['back', 'left', 'right'],
  },
  {
    id: 'tower',
    x0: -31,
    x1: 31,
    z0: 18,
    z1: 78,
    y0: 48,
    y1: 84,
    bands: TOWER_BANDS,
    courses: TOWER_COURSES,
    cornice: TOWER_CORNICE,
    faces: ['front', 'back'],
    margin: 0.6,
    // 11 travee, ca în fotografii: o fereastră în ax, nu un pilastru.
    bays: 11,
  },
  towerEndRight,
  mirrorX(towerEndRight, 'tower-end-left'),
  {
    id: 'penthouse',
    x0: -24,
    x1: 24,
    z0: 32,
    z1: 64,
    y0: 84,
    y1: 89.5,
    cornice: { depth: 0.9, height: 0.9, parapet: 0 },
  },
]

/** Porticul intrării principale: coloane libere, antablament și balconul de deasupra. */
export const PORTICO = {
  columns: 8,
  spacing: 7.2,
  radius: 1.15,
  height: 20.6,
  /** Planul coloanelor, în fața rezalitului. */
  z: 120.4,
  entablature: { x0: -30.5, x1: 30.5, z0: 115.5, z1: 122.4, y0: 20.6, y1: 24.6 },
  steps: { x0: -33, x1: 33, z0: 115.5, z1: 126, rise: 0.42, count: 5 },
}

/** Luminatoarele de pe acoperișurile care se văd de sus (poziții schematice). */
export const ROOF_LIGHTS = [
  { x0: -20, x1: 20, z0: -50, z1: 8, y: 64.06 },
  { x0: -82, x1: -54, z0: -88, z1: -66, y: 48.06 },
  { x0: 54, x1: 82, z0: -88, z1: -66, y: 48.06 },
  { x0: 76, x1: 91, z0: -44, z1: 44, y: 48.06 },
  { x0: -91, x1: -76, z0: -44, z1: 44, y: 48.06 },
]

/** Terasele pe care stă clădirea, de sus în jos. */
export const TERRACES = [
  { x0: -146, x1: 146, z0: -130, z1: 142, y0: -3, y1: 0 },
  { x0: -158, x1: 158, z0: -141, z1: 164, y0: -6, y1: -3 },
  { x0: -170, x1: 170, z0: -152, z1: 186, y0: -9, y1: -6 },
]
