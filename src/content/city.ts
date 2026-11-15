/**
 * Reperele de pe macheta orașului (prima oprire a turului). Coordonatele sunt în sistemul
 * machetei: metri, cu originea în centrul palatului, +Z spre est (fațada principală) și +X
 * spre nord; `y` e înălțimea deasupra terenului. Pozițiile vin din `scripts/fetch-city.mjs`.
 *
 * Fișierul nu atinge three.js, ca pagina să pornească înainte ca scena 3D să se fi descărcat.
 */

export type CityLabel = {
  id: string
  name: string
  at: [x: number, y: number, z: number]
  /** Rămâne și pe ecrane înguste, unde arătăm doar trei repere. */
  phone?: boolean
  /** Locul etichetei în cadrul de telefon, dacă cel obișnuit iese din el. */
  phoneAt?: [x: number, y: number, z: number]
}

export const CITY_LABELS: CityLabel[] = [
  { id: 'catedrala', name: 'Catedrala Națională', at: [-199, 124, -395], phone: true },
  { id: 'unirii', name: 'Bulevardul Unirii', at: [-4, 0, 800], phone: true, phoneAt: [-2, 0, 400] },
  { id: 'izvor', name: 'Parcul Izvor', at: [468, 0, -22], phone: true, phoneAt: [390, 0, -190] },
  { id: 'academie', name: 'Casa Academiei', at: [-563, 44, -5] },
  { id: 'dambovita', name: 'Dâmbovița', at: [455, 0, 565] },
]

/** Axa compoziției: de la treptele fațadei, prin Piața Constituției, pe Bulevardul Unirii spre est. */
export const UNIRII_AXIS = { from: [0, 132] as const, to: [-5, 1420] as const }

/**
 * Locul machetei pe glob, pentru scena ArcGIS din prima oprire: originea (centrul palatului),
 * unghiul axei +Z față de est și altitudinea la care stă baza clădirii (y = 0). Primele trei
 * le tipărește `scripts/fetch-city.mjs`; altitudinea e cea a terenului ArcGIS sub palat.
 */
export const CITY_GEO = {
  latitude: 44.427496,
  longitude: 26.087404,
  eastDegrees: -3.559,
  metersPerLatitude: 111120.6,
  metersPerLongitude: 79627.5,
  altitude: 86,
}
