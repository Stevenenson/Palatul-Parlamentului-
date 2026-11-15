import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { MathUtils, type PerspectiveCamera } from 'three'
import { PALACE_STOP } from '../../content/stops'
import { live } from '../../state/tour'
import { LIGHT_DEVICE } from '../Lights'
import { type ArcgisCity, createArcgisCity } from './arcgis'

const params = new URLSearchParams(window.location.search)

/**
 * Scena ArcGIS se folosește în mod obișnuit. `?arcgis=0` o oprește (rămâne macheta noastră a
 * orașului), iar `?debug`, folosit de teste și de capturi, o oprește și el, ca ele să nu depindă
 * de rețea; `?debug&arcgis=1` o pornește la loc.
 */
const ENABLED = params.get('arcgis') === '1' || (params.get('arcgis') !== '0' && !params.has('debug'))

/** În câte secunde apare scena ArcGIS peste macheta noastră, după ce și-a adus datele. */
const FADE_IN = 0.9
/** De câte ori e scena ArcGIS mai înaltă decât ecranul; aceeași valoare ca în CSS (`inset: -12% 0`). */
const STRETCH = 1.24
/** Dacă datele întârzie, scena apare oricum după atâtea secunde și se completează pe parcurs. */
const SETTLE_TIMEOUT = 9

type Phase = 'idle' | 'loading' | 'warming' | 'shown' | 'off'

type Layer = {
  phase: Phase
  element: HTMLDivElement | null
  city: ArcgisCity | null
  /** Cât a apărut scena ArcGIS peste macheta noastră: 0..1. */
  shown: number
  waited: number
  visible: boolean
  opacity: number
  offsetY: number
}

/** Închide scena ArcGIS și lasă prima oprire cu macheta noastră a orașului. */
function close(state: Layer) {
  state.phase = 'off'
  state.city?.destroy()
  state.element?.remove()
  state.city = null
  state.element = null
  live.arcgis = 0
  delete document.documentElement.dataset.arcgis
}

/**
 * Orașul detaliat, din ArcGIS, în prima oprire. Stă într-un element din pagină, peste canvas-ul
 * machetei și sub text, și nu primește gesturi. Macheta noastră a orașului apare prima, fiindcă
 * e ușoară; când scena ArcGIS e gata, se așază lin peste ea, din exact același unghi. La
 * coborârea spre palat se stinge și lasă în loc macheta mare.
 */
export function ArcgisLayer() {
  const camera = useThree((state) => state.camera) as PerspectiveCamera
  const layer = useRef<Layer>({
    phase: ENABLED ? 'idle' : 'off',
    element: null,
    city: null,
    shown: 0,
    waited: 0,
    visible: true,
    opacity: -1,
    offsetY: 0,
  })

  useEffect(() => {
    const state = layer.current
    return () => close(state)
  }, [])

  useFrame((_, delta) => {
    const state = layer.current
    if (state.phase === 'off') return

    if (state.phase === 'idle') {
      // Pornim abia după ce macheta noastră desenează și doar dacă vizitatorul e încă în oraș.
      if (live.frames < 20 || live.city < 0.5) return
      const stage = document.querySelector('.stage')
      if (!stage) return
      const element = document.createElement('div')
      element.className = 'arcgis'
      element.style.opacity = '0'
      stage.append(element)
      state.element = element
      state.phase = 'loading'
      createArcgisCity(element).then(
        (city) => {
          if (state.phase !== 'loading') {
            city.destroy()
            return
          }
          state.city = city
          state.phase = 'warming'
        },
        () => close(state),
      )
      return
    }

    const { city, element } = state
    if (!city || !element) return

    // Pe telefon, două scene 3D țin multă memorie: după ce turul intră în săli, cea ArcGIS se închide.
    if (LIGHT_DEVICE && live.t > PALACE_STOP + 0.6) {
      close(state)
      return
    }

    const visible = live.city > 0.002
    if (visible !== state.visible) {
      state.visible = visible
      element.style.display = visible ? '' : 'none'
    }
    if (!visible) return

    city.follow(camera, STRETCH)

    if (state.phase === 'warming') {
      state.waited += delta
      if (city.settled() || state.waited > SETTLE_TIMEOUT) state.phase = 'shown'
    }
    if (state.phase === 'shown' && state.shown < 1) {
      state.shown = live.reducedMotion ? 1 : Math.min(1, state.shown + Math.min(delta, 0.1) / FADE_IN)
      live.arcgis = state.shown
      if (state.shown >= 1) document.documentElement.dataset.arcgis = ''
    }

    // La coborâre, scena ArcGIS se stinge înaintea textului: dedesubt rămâne macheta palatului.
    const opacity = state.shown * MathUtils.smoothstep(live.city, 0.3, 0.58)
    if (Math.abs(opacity - state.opacity) > 0.004 || (opacity !== state.opacity && opacity % 1 === 0)) {
      state.opacity = opacity
      element.style.opacity = opacity.toFixed(3)
    }

    // Camera machetei are cadrul decalat pe verticală (subiectul stă sub centru); scena ArcGIS se mută la fel.
    const offsetY = camera.view?.enabled ? camera.view.offsetY : 0
    if (offsetY !== state.offsetY) {
      state.offsetY = offsetY
      element.style.setProperty('--shift', `${-offsetY}px`)
    }
  })

  return null
}
