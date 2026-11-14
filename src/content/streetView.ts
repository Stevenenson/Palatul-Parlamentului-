/**
 * Vederile reale ale sălilor vin din Google Street View și se afișează doar prin
 * încorporarea oficială Google (un `<iframe>`). Regulile Google permit încorporarea, dar
 * interzic descărcarea imaginilor, capturile și acoperirea atribuirii; de aceea aici se
 * păstrează doar identificatorul panoramei și direcția de pornire, niciodată imagini.
 */

export type StreetView = {
  /** Identificatorul panoramei, de 22 de caractere. */
  pano: string
  /** Direcția de pornire, în grade: 0 = nord, 90 = est. */
  heading: number
  /** Înclinarea de pornire, în grade: negativ privește în jos. */
  pitch: number
  lat: number
  lng: number
  /** Linkul Google Arts & Culture din care au fost citite valorile. */
  source: string
}

const number = (value: string | null, fallback = 0) => {
  const parsed = Number.parseFloat(value ?? '')
  return Number.isFinite(parsed) ? parsed : fallback
}

/** `sv_pid` vine uneori împachetat în base64 (începe cu „CAIS”): 4 octeți de antet, apoi identificatorul. */
function unwrapPano(id: string): string {
  if (!id.startsWith('CAIS')) return id
  const base64 = id.replace(/-/g, '+').replace(/_/g, '/')
  const bytes = atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4))
  return bytes.slice(4)
}

/**
 * Citește o vedere dintr-un link Google Arts & Culture: mergi în sală, te întorci spre
 * unghiul dorit și copiezi adresa din bara browserului.
 */
export function fromArtsLink(url: string): StreetView {
  const params = new URL(url).searchParams
  const id = params.get('sv_pid')
  if (!id) throw new Error(`Linkul nu are parametrul sv_pid: ${url}`)
  return {
    pano: unwrapPano(decodeURIComponent(id)),
    heading: number(params.get('sv_h')),
    pitch: number(params.get('sv_p')),
    lat: number(params.get('sv_lat')),
    lng: number(params.get('sv_lng')),
    source: url,
  }
}

const round = (value: number) => Math.round(value * 100) / 100

/**
 * Adresa cadrului Google. Cu `VITE_GOOGLE_MAPS_KEY` setată se folosește Maps Embed API
 * (varianta documentată, potrivită pentru publicare); fără cheie, adresa pe care o dă
 * Google Maps la „Distribuie → Încorporează o hartă”.
 */
export function embedUrl(view: StreetView): string {
  const key: string | undefined = import.meta.env?.VITE_GOOGLE_MAPS_KEY
  if (key) {
    const query = new URLSearchParams({
      key,
      pano: view.pano,
      heading: String(round(view.heading)),
      pitch: String(round(view.pitch)),
      fov: '90',
      language: 'ro',
    })
    return `https://www.google.com/maps/embed/v1/streetview?${query}`
  }
  return (
    'https://www.google.com/maps/embed?pb=!4v1731580000000!6m8!1m7' +
    `!1s${encodeURIComponent(view.pano)}!2m2!1d${view.lat}!2d${view.lng}` +
    `!3f${round(view.heading)}!4f${round(view.pitch)}!5f0.7820865974627469`
  )
}

/** Aceeași vedere, deschisă direct în Google Maps. */
export function mapsUrl(view: StreetView): string {
  const query = new URLSearchParams({
    api: '1',
    map_action: 'pano',
    pano: view.pano,
    heading: String(round(view.heading)),
    pitch: String(round(view.pitch)),
  })
  return `https://www.google.com/maps/@?${query}`
}
