import { type RefObject, Suspense, lazy, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { MathUtils, type PerspectiveCamera, Vector3 } from 'three'
import { AO_ENABLED, Ground, LIGHT_DEVICE, Lights, PAPER } from '../../three/Lights'
import { fovForAspect, makePose } from '../../three/poses'
import { onReading, reading } from '../progress'
import { buildOldSite } from './oldSite'
import { buildDimensions, buildRisingPalace } from './rise'
import { makeState, stateAt } from './states'

const Effects = lazy(() => import('../../three/Effects'))

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Etichetele cotelor (capitolul despre dimensiuni), ca text HTML peste scenă. */
const LABELS = ['270 m', '240 m']

type Props = { labels: RefObject<(HTMLSpanElement | null)[]> }

/**
 * Leagă macheta de lectură: netezește poziția de citire, așază camera și ridică palatul.
 * Scena desenează un cadru doar cât se mișcă ceva (`frameloop="demand"`).
 */
function Story({ labels }: Props) {
  const rising = useMemo(() => buildRisingPalace(), [])
  const dimensions = useMemo(() => buildDimensions(), [])
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
      oldSite.dispose()
    }
  }, [gl, rising, dimensions, oldSite])

  useEffect(() => onReading(() => invalidate()), [invalidate])

  useFrame((_, delta) => {
    const still = reducedMotion()
    const goal = reading.target
    const k = still ? 1 : 1 - Math.exp(-Math.min(delta, 0.1) * 5)
    t.current += (goal - t.current) * k
    if (Math.abs(goal - t.current) < 0.0004) t.current = goal

    stateAt(t.current, still, state)
    const { pose } = state
    camera.position.copy(pose.position)
    camera.lookAt(pose.target)
    const fov = fovForAspect(pose.fov, size.width / Math.max(1, size.height))
    if (Math.abs(camera.fov - fov) > 1e-3) {
      camera.fov = fov
      camera.updateProjectionMatrix()
    }

    if (rising.setClip(state.clip)) gl.shadowMap.needsUpdate = true
    rising.setSite(state.site > 0.5)
    dimensions.set(state.dimensions)
    oldSite.set({
      hill: state.hill,
      move: state.move,
      floor: state.clip,
      outline: state.outline,
      visible: state.clip < 60 || state.move > 0.5,
    })

    // Etichetele cotelor urmează capetele liniilor pe ecran.
    labels.current?.forEach((label, i) => {
      if (!label) return
      projected.copy(dimensions.labels[i]).project(camera)
      const x = (projected.x * 0.5 + 0.5) * size.width
      const y = (-projected.y * 0.5 + 0.5) * size.height
      label.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%)`
      label.style.opacity = MathUtils.clamp(state.dimensions, 0, 1).toFixed(3)
    })

    // Primele cadre: luminile își fac harta de umbre, efectele își încarcă shaderele.
    if (warm.current > 0) warm.current -= 1
    if (t.current !== goal || warm.current > 0) invalidate()
  })

  return (
    <>
      <primitive object={rising.group} />
      <primitive object={dimensions.lines} />
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
      {LABELS.map((text, i) => (
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
