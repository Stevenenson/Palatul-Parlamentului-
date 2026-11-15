import { type RefObject, Suspense, lazy, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { MathUtils, type PerspectiveCamera, Vector3 } from 'three'
import { AO_ENABLED, Ground, LIGHT_DEVICE, Lights, PAPER } from '../../three/Lights'
import { fovForAspect, makePose } from '../../three/poses'
import { onReading, reading } from '../progress'
import { buildOldSite } from './oldSite'
import { buildDimensions, buildGuides, buildRisingPalace } from './rise'
import { type StageState, makeState, stateAt } from './states'

const Effects = lazy(() => import('../../three/Effects'))

const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)')

/**
 * Etichetele de pe machetă, ca text HTML peste scenă: cotele (capitolul despre dimensiuni), axa
 * (compoziția) și registrele (fațada). Fiecare apare odată cu stratul ei din `StageState`.
 */
const LABELS: { text: string; layer: 'dimensions' | 'axis' | 'registers'; side?: 'left' }[] = [
  { text: '270 m', layer: 'dimensions' },
  { text: '240 m', layer: 'dimensions' },
  { text: 'axa bulevardului', layer: 'axis' },
  // Registrele se citesc în stânga liniei lor, cu marginea din dreapta lipită de ea.
  { text: 'corp de bază', layer: 'registers', side: 'left' },
  { text: 'registru median', layer: 'registers', side: 'left' },
  { text: 'turn central', layer: 'registers', side: 'left' },
]

const amountOf = (state: StageState, layer: (typeof LABELS)[number]['layer']) => MathUtils.clamp(state[layer], 0, 1)

type Props = { labels: RefObject<(HTMLSpanElement | null)[]> }

/**
 * Leagă macheta de lectură: netezește poziția de citire, așază camera și ridică palatul.
 * Scena desenează un cadru doar cât se mișcă ceva (`frameloop="demand"`).
 */
function Story({ labels }: Props) {
  const rising = useMemo(() => buildRisingPalace(), [])
  const dimensions = useMemo(() => buildDimensions(), [])
  const guides = useMemo(() => buildGuides(), [])
  const anchors = useMemo(() => [...dimensions.labels, ...guides.labels], [dimensions, guides])
  const oldSite = useMemo(() => buildOldSite(), [])
  const state = useMemo(() => makeState(makePose()), [])
  const { gl, invalidate, size } = useThree()
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const t = useRef(reading.target)
  const warm = useRef(8)
  const projected = useMemo(() => new Vector3(), [])

  useEffect(() => {
    gl.localClippingEnabled = true
    return () => {
      rising.dispose()
      dimensions.dispose()
      guides.dispose()
      oldSite.dispose()
    }
  }, [gl, rising, dimensions, guides, oldSite])

  useEffect(() => onReading(() => invalidate()), [invalidate])

  useFrame((_, delta) => {
    const still = REDUCED_MOTION.matches
    const goal = reading.target
    const k = still ? 1 : 1 - Math.exp(-Math.min(delta, 0.1) * 5)
    t.current += (goal - t.current) * k
    if (Math.abs(goal - t.current) < 0.0004) t.current = goal

    stateAt(t.current, still, state)
    const { pose } = state
    camera.position.copy(pose.position)
    camera.lookAt(pose.target)
    // Etichetele cotelor se proiectează cu poziția de acum, nu cu cea din cadrul trecut.
    camera.updateMatrixWorld()
    const fov = fovForAspect(pose.fov, size.width / Math.max(1, size.height))
    if (Math.abs(camera.fov - fov) > 1e-3) {
      camera.fov = fov
      camera.updateProjectionMatrix()
    }

    if (rising.setClip(state.clip)) gl.shadowMap.needsUpdate = true
    rising.setSite(state.site > 0.5)
    dimensions.set(state.dimensions)
    guides.set(state.axis, state.registers)
    const moved = oldSite.set({
      main: state.hill,
      spur: state.spur,
      move: state.move,
      outline: state.outline,
      church: state.church,
    })
    if (moved) gl.shadowMap.needsUpdate = true

    // Etichetele urmează pe ecran punctele lor de pe machetă.
    labels.current?.forEach((label, i) => {
      if (!label) return
      projected.copy(anchors[i]).project(camera)
      const x = (projected.x * 0.5 + 0.5) * size.width
      const y = (-projected.y * 0.5 + 0.5) * size.height
      const shift = LABELS[i].side === 'left' ? '-100%' : '-50%'
      label.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(${shift}, -50%)`
      label.style.opacity = amountOf(state, LABELS[i].layer).toFixed(3)
    })

    // Primele cadre: luminile își fac harta de umbre, efectele își încarcă shaderele.
    if (warm.current > 0) warm.current -= 1
    if (t.current !== goal || warm.current > 0) invalidate()
  })

  return (
    <>
      <primitive object={rising.group} />
      <primitive object={dimensions.lines} />
      <primitive object={guides.group} />
      <primitive object={oldSite.group} />
    </>
  )
}

/** Semnalează paginii că scena a desenat primul cadru, pentru teste și pentru mesajul de încărcare. */
function Ready({ onReady }: { onReady: () => void }) {
  const done = useRef(false)
  useFrame(() => {
    if (done.current) return
    done.current = true
    onReady()
  })
  return null
}

export default function HistoryStage({ onReady }: { onReady: () => void }) {
  const labels = useRef<(HTMLSpanElement | null)[]>([])

  return (
    <>
      <Canvas
        frameloop="demand"
        flat
        shadows
        resize={{ scroll: false }}
        dpr={LIGHT_DEVICE ? [1, 1.5] : [1, 1.75]}
        gl={{ antialias: !AO_ENABLED, powerPreference: 'high-performance' }}
        camera={{ fov: 30, near: 2, far: 4200, position: [-400, 150, 640] }}
      >
        <color attach="background" args={[PAPER]} />
        <fog attach="fog" args={[PAPER, 1100, 2700]} />
        <Lights />
        <Ground />
        <Story labels={labels} />
        <Ready onReady={onReady} />
        {AO_ENABLED && (
          <Suspense fallback={null}>
            <Effects />
          </Suspense>
        )}
      </Canvas>
      {LABELS.map(({ text }, i) => (
        <span
          key={text}
          className="dimension"
          ref={(el) => {
            labels.current[i] = el
          }}
        >
          {text}
        </span>
      ))}
    </>
  )
}
