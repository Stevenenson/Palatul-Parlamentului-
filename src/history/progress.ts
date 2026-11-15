/**
 * Poziția de citire pe pagina de istorie, ca număr continuu: 0 = începutul paginii,
 * 1..n = capitolele, cu partea zecimală = cât din capitol a trecut pe sub linia de citire.
 *
 * Linia de citire stă puțin deasupra mijlocului ferestrei. Un capitol devine curent când
 * titlul lui trece de ea. Totul se calculează din scroll, fără React pe fiecare cadru.
 */

/**
 * Unde e linia de citire, ca fracție din înălțimea ferestrei. Pe telefon, macheta ocupă
 * banda de sus, deci textul se citește mai jos.
 */
const line = () => (window.innerWidth <= 760 ? 0.66 : 0.45)

export const reading = {
  /** Poziția cerută de scroll. */
  target: 0,
  /** Câte secțiuni urmărim: începutul paginii plus capitolele. */
  count: 0,
}

type Listener = (t: number) => void
const listeners = new Set<Listener>()
let parts: HTMLElement[] = []
let tops: number[] = []
let bottom = 0
let frame = 0

function measure() {
  const y = window.scrollY
  tops = parts.map((el) => el.getBoundingClientRect().top + y)
  const last = parts[parts.length - 1]
  bottom = last ? last.getBoundingClientRect().bottom + y : 0
}

function compute(): number {
  if (!parts.length) return 0
  const y = readingLine()
  for (let i = parts.length - 1; i >= 0; i--) {
    if (y >= tops[i] || i === 0) {
      const end = i + 1 < parts.length ? tops[i + 1] : bottom
      const f = (y - tops[i]) / Math.max(1, end - tops[i])
      return i + Math.min(1, Math.max(0, f))
    }
  }
  return 0
}

function update() {
  frame = 0
  reading.target = compute()
  for (const listener of listeners) listener(reading.target)
}

const schedule = () => {
  if (!frame) frame = requestAnimationFrame(update)
}

const remeasure = () => {
  measure()
  schedule()
}

/** Pornește urmărirea. `elements`: începutul paginii, apoi capitolele, în ordine. */
export function trackReading(elements: HTMLElement[]) {
  parts = elements
  reading.count = elements.length
  measure()
  update()
  window.addEventListener('scroll', schedule, { passive: true })
  window.addEventListener('resize', remeasure)
  // Imaginile și literele care se încarcă mai târziu schimbă înălțimea capitolelor.
  const observer = new ResizeObserver(remeasure)
  observer.observe(document.body)
  return () => {
    window.removeEventListener('scroll', schedule)
    window.removeEventListener('resize', remeasure)
    observer.disconnect()
    if (frame) cancelAnimationFrame(frame)
    frame = 0
  }
}

export function onReading(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Unde e linia de citire, în pixeli de la începutul documentului. */
export const readingLine = () => window.scrollY + window.innerHeight * line()
