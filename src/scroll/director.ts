import { live, useTour } from '../state/tour'
import { LAST_STOP, STOP_LIST as STOPS } from '../content/stops'

/**
 * Directorul leagă scroll-ul nativ al paginii de poziția din tur.
 * Fiecare oprire are o secțiune cu același `id`. Cât secțiunea umple fereastra, turul
 * stă pe oprirea ei; după ce marginea ei de jos trece de marginea ferestrei, începe
 * drumul spre oprirea următoare. O secțiune mai înaltă decât fereastra se derulează
 * deci liber până la capăt, fără ca turul să plece din sală.
 */

type Section = {
  /** Poziția de scroll la care secțiunea ajunge sus în fereastră. */
  top: number
  /** Cu cât e secțiunea mai înaltă decât fereastra (0 dacă încape). */
  extra: number
}

let sections: Section[] = []
let tween: number | null = null
/** Oprirea spre care duce animația de scroll în curs. */
let tweenStop: number | null = null
let idleTimer: number | null = null
let lastY = 0
let direction = 0
let touching = false
let scrollbarHeld = false
let snapEnabled = true

const IDLE_MS = 150
/** Cât din drum trebuie parcurs ca scroll-ul să continue singur spre oprirea următoare... */
const COMMIT_RATIO = 0.12
/** ...dar niciodată mai mult de atât, ca o singură crestătură de rotiță să ajungă pe orice ecran. */
const COMMIT_MAX_PX = 60

const clampStop = (i: number) => Math.max(0, Math.min(LAST_STOP, i))

function measure() {
  const y = window.scrollY
  const viewport = window.innerHeight
  sections = STOPS.map((stop) => {
    const el = document.getElementById(stop.id)
    if (!el) return { top: 0, extra: 0 }
    const rect = el.getBoundingClientRect()
    return { top: Math.round(rect.top + y), extra: Math.max(0, Math.round(rect.height - viewport)) }
  })
}

/** Poziția de la care secțiunea `i` începe să iasă din fereastră. */
const leave = (i: number) => sections[i].top + sections[i].extra

function tFromScroll(y: number): number {
  if (sections.length < 2 || y <= sections[0].top) return 0
  for (let i = 0; i < LAST_STOP; i++) {
    const next = sections[i + 1].top
    if (y < next) {
      const from = leave(i)
      return y <= from ? i : i + (y - from) / Math.max(1, next - from)
    }
  }
  return LAST_STOP
}

function stopFromHash(): number | null {
  const id = decodeURIComponent(window.location.hash.slice(1))
  if (!id) return null
  const i = STOPS.findIndex((stop) => stop.id === id)
  return i >= 0 ? i : null
}

function hashUrl(stop: number) {
  const hash = stop === 0 ? '' : `#${STOPS[stop].id}`
  return window.location.pathname + window.location.search + hash
}

function sync() {
  const t = tFromScroll(window.scrollY)
  live.tTarget = t
  const stop = Math.round(t)
  const settled = Math.abs(t - stop) < 0.015
  const state = useTour.getState()
  if (state.stop !== stop || state.settled !== settled) state.set({ stop, settled })
  // Scroll-ul doar corectează adresa curentă; intrări noi în istoric fac numai salturile explicite.
  if (settled && live.flightTo === null && stopFromHash() !== (stop === 0 ? null : stop)) {
    window.history.replaceState(null, '', hashUrl(stop))
  }
}

function cancelTween() {
  if (tween !== null) cancelAnimationFrame(tween)
  tween = null
  tweenStop = null
}

function armSettle() {
  if (idleTimer !== null) window.clearTimeout(idleTimer)
  idleTimer = window.setTimeout(settle, IDLE_MS)
}

const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)

function tweenScroll(to: number, duration: number, stop: number | null = null) {
  cancelTween()
  const from = window.scrollY
  if (Math.abs(to - from) < 1) return
  if (live.reducedMotion || duration <= 0) {
    window.scrollTo(0, to)
    return
  }
  tweenStop = stop
  const start = performance.now()
  const step = (now: number) => {
    const k = Math.min(1, (now - start) / duration)
    window.scrollTo(0, from + (to - from) * easeInOut(k))
    if (k < 1) {
      tween = requestAnimationFrame(step)
    } else {
      tween = null
      tweenStop = null
    }
  }
  tween = requestAnimationFrame(step)
}

/**
 * După ce scroll-ul se oprește între două opriri, îl ducem pe cea spre care mergea
 * utilizatorul. Cu mișcare redusă nu așezăm nimic: pagina rămâne unde a fost lăsată.
 */
function settle() {
  idleTimer = null
  if (!snapEnabled || live.reducedMotion || touching || scrollbarHeld) return
  if (tween !== null || live.flightTo !== null) return
  const y = window.scrollY
  if (y >= sections[LAST_STOP].top) return // sub hartă urmează subsolul: acolo scroll-ul e liber
  const i = Math.min(Math.floor(tFromScroll(y)), LAST_STOP - 1)
  const from = leave(i)
  const to = sections[i + 1].top
  if (y <= from + 1 || y >= to - 1) return // în interiorul unei secțiuni sau exact pe o oprire
  const span = to - from
  const moved = y - from
  const commit = Math.min(span * COMMIT_RATIO, COMMIT_MAX_PX)
  const forward = direction >= 0 ? moved > commit : span - moved <= commit
  const target = forward ? to : from
  tweenScroll(target, 420 + (760 * Math.abs(target - y)) / span, forward ? i + 1 : i)
}

function onScroll() {
  const y = window.scrollY
  if (y !== lastY) direction = y > lastY ? 1 : -1
  lastY = y
  sync()
  if (tween === null) armSettle()
}

/** Duce pagina la poziția `y` din oprirea `i`: derulare animată de aproape, zbor de cameră de departe. */
function travel(i: number, y: number) {
  const distance = Math.abs(i - live.t)
  if (Math.abs(window.scrollY - y) < 2 && live.flightTo === null) return
  // Fără scenă 3D nu are cine să zboare: pagina doar derulează până la oprire.
  const noScene = useTour.getState().scene === 'failed'
  if (noScene || (distance <= 1.25 && live.flightTo === null)) {
    tweenScroll(y, 700 + 500 * Math.min(distance, 1.5), i)
    return
  }
  cancelTween()
  live.flightTo = i
  useTour.getState().set({ flying: true })
  window.scrollTo(0, y)
}

type GoOptions = {
  /** Adaugă o intrare în istoric, ca butonul Înapoi să revină la oprirea de dinainte. */
  push?: boolean
  /** Mută focusul pe titlul secțiunii, ca următorul Tab să pornească de acolo. */
  focus?: boolean
}

export function goToStop(index: number, options: GoOptions = {}) {
  const i = clampStop(index)
  if (sections.length === 0) measure()
  if (options.push && stopFromHash() !== (i === 0 ? null : i)) {
    window.history.pushState(null, '', hashUrl(i))
  }
  if (options.focus) {
    const heading = document.getElementById(STOPS[i].id)?.querySelector<HTMLElement>('h1, h2')
    heading?.focus({ preventScroll: true })
  }
  travel(i, sections[i].top)
}

export function goToStopId(id: string, options: GoOptions = {}) {
  const i = STOPS.findIndex((stop) => stop.id === id)
  if (i >= 0) goToStop(i, options)
}

const isTyping = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))

const isControl = (el: EventTarget | null) =>
  el instanceof HTMLElement && el.closest('a, button, [role="button"], summary') !== null

export function initDirector(): () => void {
  const media = window.matchMedia('(prefers-reduced-motion: reduce)')
  const onMotion = () => {
    live.reducedMotion = media.matches
  }
  onMotion()

  live.debug = new URLSearchParams(window.location.search).has('debug')
  measure()

  // Link direct către o sală: pornim de acolo, fără zbor și fără să ștergem ancora din adresă.
  const initial = stopFromHash()
  if (initial !== null && initial > 0) window.scrollTo(0, sections[initial].top)
  sync()
  live.t = live.tTarget
  lastY = window.scrollY

  // `?debug` deschide o portiță pentru scripturile de capturi și de test.
  if (live.debug) {
    Object.assign(window, {
      __tour: {
        live,
        goToStop,
        anchors: () => sections.map((section) => section.top),
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
    if (settled && tween === null && window.scrollY <= sections[LAST_STOP].top + 2) {
      const section = sections[stop]
      const y = Math.max(section.top, Math.min(section.top + section.extra, window.scrollY))
      if (Math.abs(y - window.scrollY) > 1) window.scrollTo(0, y)
    }
    sync()
  }

  const onWheel = () => {
    cancelTween()
    armSettle() // un gest care nu derulează (orizontal, coada inerției) nu trebuie să lase pagina între opriri
  }
  const onTouchStart = () => {
    touching = true
    cancelTween()
  }
  const onTouchEnd = () => {
    touching = false
    onScroll()
  }

  // Bara de scroll trasă cu mouse-ul: cât e ținută, nu așezăm nimic.
  const onMouseDown = (event: MouseEvent) => {
    if (event.clientX >= document.documentElement.clientWidth) {
      scrollbarHeld = true
      cancelTween()
    }
  }
  const onMouseRelease = (event: MouseEvent) => {
    if (!scrollbarHeld || (event.type === 'mousemove' && event.buttons !== 0)) return
    scrollbarHeld = false
    armSettle()
  }

  const onKey = (event: KeyboardEvent) => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return
    if (isTyping(event.target)) return
    let step = 0
    if (event.key === 'ArrowDown' || event.key === 'PageDown') step = 1
    else if (event.key === 'ArrowUp' || event.key === 'PageUp') step = -1
    else if (event.key === ' ' && !isControl(event.target)) step = event.shiftKey ? -1 : 1
    else if (event.key === 'Home') {
      event.preventDefault()
      goToStop(0)
      return
    } else if (event.key === 'End') {
      cancelTween()
      return
    }
    if (step === 0) return

    const y = window.scrollY
    const moving = live.flightTo ?? tweenStop
    const base = moving ?? Math.round(tFromScroll(y))
    const section = sections[base]
    // Zonele în care tastele derulează normal: subsolul și interiorul unei secțiuni mai înalte decât fereastra.
    const inFooter = y > sections[LAST_STOP].top + 1
    const inside =
      moving === null &&
      section.extra > 0 &&
      (step > 0 ? y < leave(base) - 2 : y > section.top + 2 && y <= leave(base) + 1)
    if (inFooter || inside || base + step > LAST_STOP) {
      cancelTween()
      armSettle()
      return
    }
    event.preventDefault()
    // O tastă ținută apăsat nu trebuie să sară în lanț prin toate sălile: o apăsare, o oprire.
    if (event.repeat) return
    if (base + step >= 0) goToStop(base + step)
  }

  // Tab: browserul aduce elementul focusat undeva în fereastră; noi ducem turul pe oprirea lui.
  const onFocusIn = (event: FocusEvent) => {
    const el = event.target
    if (!(el instanceof HTMLElement) || !el.matches(':focus-visible')) return
    const id = el.closest('main > section')?.id
    const i = STOPS.findIndex((stop) => stop.id === id)
    if (i < 0 || live.flightTo === i || tweenStop === i) return
    const section = sections[i]
    const y = window.scrollY
    if (y >= section.top - 1 && y <= section.top + section.extra + 1) return
    travel(i, Math.max(section.top, Math.min(section.top + section.extra, y)))
  }

  const onPopState = () => {
    const i = stopFromHash() ?? 0
    travel(i, sections[i].top)
  }

  // După un zbor, adresa și așezarea se pun la zi cu locul în care a ajuns pagina.
  const unsubscribe = useTour.subscribe((state, previous) => {
    if (previous.flying && !state.flying) {
      sync()
      armSettle()
    }
  })

  // Fără restaurarea automată a scroll-ului: butonul Înapoi trece prin `popstate`, deci face zbor.
  window.history.scrollRestoration = 'manual'

  const observer = new ResizeObserver(onResize)
  observer.observe(document.body)
  media.addEventListener('change', onMotion)
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('wheel', onWheel, { passive: true })
  window.addEventListener('touchstart', onTouchStart, { passive: true })
  window.addEventListener('touchend', onTouchEnd, { passive: true })
  window.addEventListener('touchcancel', onTouchEnd, { passive: true })
  window.addEventListener('mousedown', onMouseDown)
  window.addEventListener('mouseup', onMouseRelease)
  window.addEventListener('mousemove', onMouseRelease)
  window.addEventListener('keydown', onKey)
  window.addEventListener('focusin', onFocusIn)
  window.addEventListener('popstate', onPopState)

  return () => {
    cancelTween()
    if (idleTimer !== null) window.clearTimeout(idleTimer)
    unsubscribe()
    observer.disconnect()
    media.removeEventListener('change', onMotion)
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('wheel', onWheel)
    window.removeEventListener('touchstart', onTouchStart)
    window.removeEventListener('touchend', onTouchEnd)
    window.removeEventListener('touchcancel', onTouchEnd)
    window.removeEventListener('mousedown', onMouseDown)
    window.removeEventListener('mouseup', onMouseRelease)
    window.removeEventListener('mousemove', onMouseRelease)
    window.removeEventListener('keydown', onKey)
    window.removeEventListener('focusin', onFocusIn)
    window.removeEventListener('popstate', onPopState)
  }
}
