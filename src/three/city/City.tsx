import { useEffect, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { type Fog, MathUtils, Vector3 } from 'three'
import { CITY_LABELS } from '../../content/city'
import { cityLabelElements } from '../../state/cityLabels'
import { live } from '../../state/tour'
import { NARROW_WIDTH } from '../poses'
import { PALACE } from '../palace/massing'
import { type City as CityModel, type CityData, buildCity } from './buildCity'

const DATA_URL = `${import.meta.env.BASE_URL}data/oras.json`

/** Ceața scenei: aproape de palat ca până acum, mult mai departe cât se vede orașul. */
const FOG_NEAR = [1100, 2700]
const FOG_FAR = [2700, 7200]

const anchor = new Vector3()

/**
 * Macheta orașului, în prima oprire a turului. Datele se descarcă după ce scena a pornit, apoi
 * clădirile se ridică din hârtie; la coborârea spre palat se retrag la loc. Tot aici se așază
 * etichetele reperelor, care sunt elemente din pagină (`ui/Hero.tsx`).
 */
export function City() {
  const [city, setCity] = useState<CityModel | null>(null)
  const camera = useThree((state) => state.camera)
  const size = useThree((state) => state.size)
  const scene = useThree((state) => state.scene)
  /** Cât s-a ridicat macheta de la încărcare: 0..1. */
  const grown = useRef(0)

  useEffect(() => {
    let cancelled = false
    let built: CityModel | null = null
    fetch(DATA_URL)
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status))
        return response.json() as Promise<CityData>
      })
      .then((data) => {
        if (cancelled) return
        built = buildCity(data)
        setCity(built)
      })
      // Fără datele orașului, turul merge mai departe doar cu palatul.
      .catch(() => {})
    return () => {
      cancelled = true
      built?.dispose()
    }
  }, [])

  useFrame((_, delta) => {
    const fog = scene.fog as Fog | null
    if (fog) {
      fog.near = MathUtils.lerp(FOG_NEAR[0], FOG_FAR[0], live.city)
      fog.far = MathUtils.lerp(FOG_NEAR[1], FOG_FAR[1], live.city)
    }

    if (city) {
      const instant = live.reducedMotion || live.debug
      grown.current = instant ? 1 : Math.min(1, grown.current + Math.min(delta, 0.1) / 1.4)
      const rise = MathUtils.smootherstep(grown.current, 0, 1)
      city.update(live.city * rise)
      if (grown.current >= 1 && !live.cityReady) live.cityReady = true
    }

    const shown = city ? MathUtils.smoothstep(live.city * grown.current, 0.75, 1) : 0
    const narrow = size.width <= NARROW_WIDTH
    CITY_LABELS.forEach((label, i) => {
      const el = cityLabelElements[i]
      if (!el) return
      if (shown < 0.02 || (narrow && !label.phone)) {
        if (el.style.visibility !== 'hidden') el.style.visibility = 'hidden'
        return
      }
      const at = (narrow && label.phoneAt) || label.at
      anchor.set(at[0], PALACE.ground + at[1], at[2]).project(camera)
      const x = (anchor.x * 0.5 + 0.5) * size.width
      const y = (-anchor.y * 0.5 + 0.5) * size.height
      // Un reper ieșit din cadru nu lasă o etichetă tăiată la margine.
      if (x < 10 || x > size.width - 10) {
        if (el.style.visibility !== 'hidden') el.style.visibility = 'hidden'
        return
      }
      // Aproape de marginea din dreapta, numele trece în stânga punctului, ca să nu fie tăiat.
      const side = x > size.width * 0.6 ? 'left' : 'right'
      if (el.dataset.side !== side) el.dataset.side = side
      el.style.visibility = 'visible'
      el.style.opacity = String(shown)
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`
    })
  })

  return city ? <primitive object={city.group} /> : null
}
