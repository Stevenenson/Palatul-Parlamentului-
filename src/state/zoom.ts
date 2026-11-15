/**
 * Apropierea cerută de utilizator pe opririle în care macheta se poate roti (orașul, palatul,
 * harta): 1 = cadrul opririi, sub 1 = mai aproape. O citește camera, o schimbă butoanele din
 * pagină, ciupirea pe ecran și rotița cu Ctrl (gestul de ciupire de pe trackpad).
 */
export const ZOOM_MIN = 0.38
export const ZOOM_MAX = 1.7
/** Un pas de buton sau de tastă. */
export const ZOOM_STEP = 0.76

export const zoom = { target: 1 }

export function setZoom(value: number) {
  zoom.target = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, value))
}

export const zoomBy = (factor: number) => setZoom(zoom.target * factor)
