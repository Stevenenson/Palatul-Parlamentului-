import { live, useTour } from '../state/tour'
import { LAST_STOP, STOPS } from '../three/poses'

/**
 * Directorul leagă scroll-ul nativ al paginii de poziția din tur.
 * Fiecare oprire are o secțiune cu același `id`; când secțiunea ajunge sus în
 * fereastră, turul e exact pe oprirea ei. Între două secțiuni, poziția e liniară.
 */

let anchors: number[] = []
let tween: number | null = null
let idleTimer: number | null = null
let lastY = 0
let direction = 0
let touching = false
let snapEnabled = true

const IDLE_MS = 150
/** Cât din drum trebuie parcurs ca scroll-ul să continue singur spre oprirea următoare. */
const COMMIT = 0.12

function measure() {
  const y = window.scrollY
  anchors = STOPS.map((stop) => {
    const el = document.getElementById(stop.id)
    return el ? Math.round(el.getBoundingClientRect().top + y) : 0
  })
}

function tFromScroll(y: number): number {
  if (anchors.length < 2 || y <= anchors[0]) return 0
  for (let i = 0; i < LAST_STOP; i++) {
    const a = anchors[i]
    const b = anchors[i + 1]
    if (y < b) return i + (y - a) / Math.max(1, b - a)
  }
  return LAST_STOP
}

function sync() {
  const y = window.scrollY
  const t = tFromScroll(y)
  live.tTarget = t
  const stop = Math.round(t)
  const settled = Math.abs(t - stop) < 0.015
  const state = useTour.getState()
  if (state.stop !== stop || state.settled !== settled) state.set({ stop, settled })
  if (settled) writeHash(stop)
}

function writeHash(stop: number) {
  const wanted = stop === 0 ? '' : `#${STOPS[stop].id}`
  if (window.location.hash === wanted) return
  const url = window.location.pathname + window.location.search + wanted
  window.history.replaceState(null, '', url)
}

function cancelTween() {
  if (tween !== null) cancelAnimationFrame(tween)
  tween = null
}

const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)

function tweenScroll(to: number, duration: number) {
  cancelTween()
  const from = window.scrollY
  if (Math.abs(to - from) < 1) return
  if (live.reducedMotion || duration <= 0) {
    window.scrollTo(0, to)
    return
  }
  const start = performance.now()
  const step = (now: number) => {
    const k = Math.min(1, (now - start) / duration)
    window.scrollTo(0, from + (to - from) * easeInOut(k))
    tween = k < 1 ? requestAnimationFrame(step) : null
  }
  tween = requestAnimationFrame(step)
}

/** După ce scroll-ul se oprește, îl așezăm pe oprirea spre care mergea utilizatorul. */
function settle() {
  idleTimer = null
  if (!snapEnabled || touching || tween !== null) return
  const y = window.scrollY
  if (y >= anchors[LAST_STOP]) return // sub hartă urmează subsolul: acolo scroll-ul e liber
  const t = tFromScroll(y)
  const i = Math.floor(t)
  const f = t - i
  if (f < 0.004 || f > 0.996) return
  const next = direction >= 0 ? f > COMMIT : f > 1 - COMMIT
  const target = next ? i + 1 : i
  const span = Math.abs(target - t)
  tweenScroll(anchors[target], 420 + 760 * span)
}

function onScroll() {
  const y = window.scrollY
  if (y !== lastY) direction = y > lastY ? 1 : -1
  lastY = y
  sync()
  if (tween !== null) return
  if (idleTimer !== null) window.clearTimeout(idleTimer)
  idleTimer = window.setTimeout(settle, IDLE_MS)
}

const SCROLL_KEYS = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '])

/** Duce turul la o oprire. Salturile lungi devin un zbor de cameră, nu o derulare prin toate sălile. */
export function goToStop(index: number) {
  const i = Math.max(0, Math.min(LAST_STOP, index))
  if (anchors.length === 0) measure()
  const distance = Math.abs(i - live.t)
  if (distance < 0.01 && Math.abs(window.scrollY - anchors[i]) < 2) return
  if (distance <= 1.25 && live.flightTo === null) {
    tweenScroll(anchors[i], 700 + 500 * distance)
    return
  }
  cancelTween()
  live.flightTo = i
  useTour.getState().set({ flying: true })
  window.scrollTo(0, anchors[i])
}

export function goToStopId(id: string) {
  const i = STOPS.findIndex((stop) => stop.id === id)
  if (i >= 0) goToStop(i)
}

export function initDirector(): () => void {
  const media = window.matchMedia('(prefers-reduced-motion: reduce)')
  const onMotion = () => {
    live.reducedMotion = media.matches
  }
  onMotion()

  measure()
  sync()
  live.t = live.tTarget
  lastY = window.scrollY

  // `?debug` deschide o portiță pentru scripturile de capturi și de test.
  if (new URLSearchParams(window.location.search).has('debug')) {
    Object.assign(window, {
      __tour: {
        live,
        goToStop,
        anchors: () => anchors.slice(),
        setSnap: (on: boolean) => {
          snapEnabled = on
        },
      },
    })
  }

  const onResize = () => {
    const { stop, settled } = useTour.getState()
    measure()
    // Dacă eram așezați pe o oprire, rămânem pe ea și după redimensionare.
    if (settled && tween === null && window.scrollY <= anchors[LAST_STOP] + 2) {
      window.scrollTo(0, anchors[stop])
    }
    sync()
  }
  const onWheel = () => cancelTween()
  const onTouchStart = () => {
    touching = true
    cancelTween()
  }
  const onTouchEnd = () => {
    touching = false
    onScroll()
  }
  const onKey = (event: KeyboardEvent) => {
    if (SCROLL_KEYS.has(event.key)) cancelTween()
  }

  const observer = new ResizeObserver(onResize)
  observer.observe(document.body)
  media.addEventListener('change', onMotion)
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('wheel', onWheel, { passive: true })
  window.addEventListener('touchstart', onTouchStart, { passive: true })
  window.addEventListener('touchend', onTouchEnd, { passive: true })
  window.addEventListener('touchcancel', onTouchEnd, { passive: true })
  window.addEventListener('keydown', onKey)

  return () => {
    cancelTween()
    if (idleTimer !== null) window.clearTimeout(idleTimer)
    observer.disconnect()
    media.removeEventListener('change', onMotion)
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('wheel', onWheel)
    window.removeEventListener('touchstart', onTouchStart)
    window.removeEventListener('touchend', onTouchEnd)
    window.removeEventListener('touchcancel', onTouchEnd)
    window.removeEventListener('keydown', onKey)
  }
}
