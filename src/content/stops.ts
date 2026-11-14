import { ROOMS, type RoomSpec } from './rooms'

/**
 * Opririle turului, în ordinea de pe pagină: exteriorul, sălile, harta. Fiecare are o
 * secțiune în pagină cu același `id`. Fișierul nu atinge three.js, ca pagina să poată
 * porni (text, meniu, scroll) înainte ca scena 3D să se fi descărcat.
 */

export type StopKind = 'exterior' | 'room' | 'map'
export type StopInfo = { id: string; kind: StopKind; label: string; room?: RoomSpec }

export const STOP_LIST: StopInfo[] = [
  { id: 'palat', kind: 'exterior', label: 'Palatul' },
  ...ROOMS.map<StopInfo>((room) => ({ id: room.id, kind: 'room', label: room.name, room })),
  { id: 'harta', kind: 'map', label: 'Harta sălilor' },
]

export const LAST_STOP = STOP_LIST.length - 1
