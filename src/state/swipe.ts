import { STOPS } from '../three/poses'
import { live, useTour } from './tour'

/**
 * Gestul de swipe dintre filmări. Același cod servește scena (drag pe hologramă)
 * și cardul din pagină, ca gestul să se simtă la fel oriunde l-ai începe.
 */

/** Sala în care stă turul acum (indice în `ROOMS`), sau `null` dacă nu e așezat într-o sală. */
export function activeRoom(): number | null {
  const { stop, settled, flying } = useTour.getState()
  if (!settled || flying || STOPS[stop].kind !== 'room') return null
  return stop - 1
}

let room: number | null = null
let startX = 0
let span = 1

/** Cât din lățimea gestului trebuie parcurs ca filmarea să se schimbe la eliberare. */
const COMMIT = 0.2

export function swipeStart(x: number): boolean {
  room = activeRoom()
  if (room === null) return false
  startX = x
  span = Math.max(200, window.innerWidth * 0.26)
  return true
}

export function swipeMove(x: number) {
  if (room === null) return
  // Tragi spre stânga ca să aduci filmarea următoare, ca la orice carusel.
  live.swipe = Math.max(-1, Math.min(1, (startX - x) / span))
}

export function swipeEnd() {
  if (room === null) return
  const pulled = live.swipe
  live.swipe = 0
  if (Math.abs(pulled) > COMMIT) useTour.getState().stepRecording(room, pulled > 0 ? 1 : -1)
  room = null
}

export function swipeCancel() {
  live.swipe = 0
  room = null
}
