import { useEffect, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { type Fog, MathUtils, Vector3 } from 'three'
import { CITY_LABELS } from '../../content/city'
import { loadCityData } from '../../state/cityData'
import { cityLabelElements } from '../../state/cityLabels'
import { live } from '../../state/tour'
import { NARROW_WIDTH } from '../poses'
import { PALACE } from '../palace/massing'
import { type City as CityModel, buildCity } from './buildCity'

/** Ceața scenei: aproape de palat ca până acum, mult mai departe cât se vede orașul. */
const FOG_NEAR = [1100, 2700]
const FOG_FAR = [2700, 7200]

const anchor = new Vector3()

/** Ce am scris ultima dată în fiecare etichetă, ca să nu atingem pagina când nimic nu s-a mișcat. */
const drawn = CITY_LABELS.map(() => ({ x: -1, y: -1, opacity: -1, side: 'right' as 'left' | 'right' }))

function hideLabel(el: HTMLElement, i: number) {
  if (drawn[i].opacity === 0) return
  drawn[i].opacity = 0
  el.style.visibility = 'hidden'
}

/**
 * Macheta orașului, în prima oprire a turului. Datele se descarcă în paralel cu scena, apoi
 * clădirile se ridică din hârtie; la coborârea spre palat se retrag la loc. Tot aici se așază
 * etichetele reperelor, care sunt elemente din pagină (`ui/Hero.tsx`), și se scrie în pagină
 * variabila `--city`, după care se sting și se aprind textele celor două ecrane.
 */
export function City() {
  const [city, setCity] = useState<CityModel | null>(null)
  const camera = useThree((state) => state.camera)
  const size = useThree((state) => state.size)
  const scene = useThree((state) => state.scene)
  /** Cât s-a ridicat macheta de la încărcare: 0..1. */
  const grown = useRef(0)
  const written = useRef(-1)

  useEffect(() => {
    let cancelled = false
    let built: CityModel | null = null
    loadCityData()
      .then((data) => {
        if (cancelled) return
        built = buildCity(data)
        setCity(built)
      })
      // Fără datele orașului, prima oprire arată palatul, ca la oprirea următoare.
      .catch(() => {
        live.cityFailed = true
      })
    return () => {
      cancelled = true
      built?.dispose()
    }
  }, [])

  useEffect(
    () => () => {
      document.documentElement.style.removeProperty('--city')
    },
    [],
  )

  useFrame((_, delta) => {
    const fog = scene.fog as Fog | null
    if (fog) {
      fog.near = MathUtils.lerp(FOG_NEAR[0], FOG_FAR[0], live.city)
      fog.far = MathUtils.lerp(FOG_NEAR[1], FOG_FAR[1], live.city)
    }

    if (Math.abs(live.city - written.current) > 0.004 || (live.city !== written.current && live.city % 1 === 0)) {
      written.current = live.city
      document.documentElement.style.setProperty('--city', live.city.toFixed(3))
    }

    if (city) {
      const instant = live.reducedMotion || live.debug
      grown.current = instant ? 1 : Math.min(1, grown.current + Math.min(delta, 0.1) / 1.4)
      const rise = MathUtils.smootherstep(grown.current, 0, 1)
      // Sub scena ArcGIS, odată apărută cu totul, macheta noastră nu se mai desenează.
      city.update(live.arcgis >= 1 ? 0 : live.city * rise)
      if (grown.current >= 1 && !live.cityReady) live.cityReady = true
    }

    const shown = city ? MathUtils.smoothstep(live.city * grown.current, 0.75, 1) : 0
    const narrow = size.width <= NARROW_WIDTH
    // Sub titlu, orașul trece pe sub un văl de hârtie (`.hero--city::before`): acolo etichetele se sting.
    const top = Math.min(size.height * 0.46, 420) * 0.78
    for (let i = 0; i < CITY_LABELS.length; i++) {
      const label = CITY_LABELS[i]
      const el = cityLabelElements[i]
      if (!el) continue
      if (shown < 0.02 || (narrow && !label.phone)) {
        hideLabel(el, i)
        continue
      }
      const at = (narrow && label.phoneAt) || label.at
      anchor.set(at[0], PALACE.ground + at[1], at[2]).project(camera)
      const x = (anchor.x * 0.5 + 0.5) * size.width
      const y = (-anchor.y * 0.5 + 0.5) * size.height
      // Spre marginile ecranului și spre titlu, eticheta se stinge treptat, nu dispare dintr-odată.
      const edge = MathUtils.smoothstep(Math.min(x, size.width - x), 6, 30)
      const veil = MathUtils.smoothstep(y, top - 12, top + 18) * MathUtils.smoothstep(size.height - y, 8, 32)
      const opacity = shown * edge * veil
      if (opacity < 0.02) {
        hideLabel(el, i)
        continue
      }
      const last = drawn[i]
      // Aproape de marginea din dreapta, numele trece în stânga punctului; pragurile diferă la dus și
      // la întors, ca numele să nu sară dintr-o parte în alta când reperul stă chiar pe prag.
      const side = x > size.width * 0.66 ? 'left' : x < size.width * 0.54 ? 'right' : last.side
      if (side !== last.side || el.dataset.side === undefined) {
        last.side = side
        el.dataset.side = side
      }
      if (last.opacity === 0 || last.opacity === -1) el.style.visibility = 'visible'
      // Capătul (complet vizibilă) se scrie mereu, altfel eticheta ar rămâne la 0,99.
      if (opacity !== last.opacity && (Math.abs(opacity - last.opacity) > 0.01 || opacity === 1)) {
        last.opacity = opacity
        el.style.opacity = opacity.toFixed(2)
      }
      if (Math.abs(x - last.x) > 0.5 || Math.abs(y - last.y) > 0.5) {
        last.x = x
        last.y = y
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`
      }
    }
  })

  return city ? <primitive object={city.group} /> : null
}
