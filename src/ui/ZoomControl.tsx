import { STOP_LIST } from '../content/stops'
import { useTour } from '../state/tour'
import { ZOOM_STEP, zoomBy } from '../state/zoom'

/**
 * Butoanele de apropiere și depărtare, pe opririle în care macheta se poate roti: orașul,
 * palatul și harta. Același lucru îl fac ciupirea pe ecran, ciupirea pe trackpad și tastele + și −.
 */
export function ZoomControl() {
  const kind = useTour((s) => STOP_LIST[s.stop].kind)
  const usable = useTour((s) => s.scene === 'ready' && s.settled && !s.flying && s.real === null)
  const hidden = kind === 'room' || !usable

  return (
    <div className="zoom" data-hidden={hidden || undefined} role="group" aria-label="Apropierea machetei">
      <button type="button" className="zoom__btn" aria-label="Apropie" disabled={hidden} onClick={() => zoomBy(ZOOM_STEP)}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
      <button
        type="button"
        className="zoom__btn"
        aria-label="Depărtează"
        disabled={hidden}
        onClick={() => zoomBy(1 / ZOOM_STEP)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 12h14" />
        </svg>
      </button>
    </div>
  )
}
