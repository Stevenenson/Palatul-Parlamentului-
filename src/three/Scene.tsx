import { useEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { EffectComposer, N8AO } from '@react-three/postprocessing'
import { type AmbientLight, type DirectionalLight, MathUtils } from 'three'
import { live } from '../state/tour'
import { CameraRig } from './CameraRig'
import { Palace } from './palace/Palace'
import { PALACE } from './palace/massing'
import { Rooms } from './rooms/Rooms'

/** Aceeași culoare ca `--paper` din CSS: fundalul scenei se continuă în pagină. */
export const PAPER = '#f2f0eb'

/**
 * Lumină de machetă: una principală din stânga-sus, razantă pe fațada principală, ca
 * pilaștrii, cornișele și pavilioanele să arunce umbre lungi, și o umplere difuză, ca
 * umbrele să rămână deschise.
 *
 * Clădirea și lumina stau pe loc, deci harta de umbre se desenează o singură dată, la
 * pornire; pe urmă se schimbă doar tăria umbrelor, care scade odată cu opacitatea carcasei.
 */
function Lights() {
  const sun = useRef<DirectionalLight>(null)
  const fill = useRef<AmbientLight>(null)
  const gl = useThree((state) => state.gl)
  const warmup = useRef(0)

  useEffect(() => {
    gl.shadowMap.autoUpdate = false
    gl.shadowMap.needsUpdate = true
    return () => {
      gl.shadowMap.autoUpdate = true
    }
  }, [gl])

  useFrame(() => {
    if (warmup.current < 4) {
      warmup.current += 1
      gl.shadowMap.needsUpdate = true
    }
    const inside = 1 - live.solid
    if (sun.current) {
      sun.current.shadow.intensity = MathUtils.smoothstep(live.solid, 0.3, 0.95)
      // În săli nu există umbre de la soare, deci lumina devine mai difuză ca pereții să nu rămână gri.
      sun.current.intensity = MathUtils.lerp(2.45, 0.95, inside)
    }
    if (fill.current) fill.current.intensity = 1.05 * inside
  })

  return (
    <>
      <hemisphereLight args={['#ffffff', '#d6d1c6', 1.5]} />
      <ambientLight ref={fill} intensity={0} />
      <directionalLight
        ref={sun}
        position={[-390, 420, 320]}
        intensity={2.45}
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-bias={-0.0003}
        shadow-normalBias={0.35}
        shadow-radius={2.5}
      >
        <orthographicCamera attach="shadow-camera" args={[-260, 260, 260, -260, 100, 1300]} />
      </directionalLight>
    </>
  )
}

/** `?ao=0` în adresă oprește ocluzia ambientală, pentru comparații și măsurători. */
const AO_ENABLED = new URLSearchParams(window.location.search).get('ao') !== '0'

/**
 * Ocluzie ambientală: întunecă ușor colțurile și golurile, ca la o machetă fotografiată.
 * Raza e în metri: mare pe exterior, unde contează cornișele, și mică în săli, unde
 * altfel pereții apropiați ar înnegri tot interiorul.
 */
function Effects() {
  const ao = useRef<{ configuration: { aoRadius: number; intensity: number } }>(null)

  useFrame(() => {
    const config = ao.current?.configuration
    if (!config) return
    config.aoRadius = MathUtils.lerp(2.2, 6.5, live.solid)
    config.intensity = MathUtils.lerp(1.6, 2.6, live.solid)
  })

  return (
    <EffectComposer multisampling={4} enableNormalPass={false}>
      <N8AO ref={ao} aoRadius={6.5} distanceFalloff={1} intensity={2.6} quality="medium" color="#3b362d" />
    </EffectComposer>
  )
}

/** Terenul nu are culoare proprie: prinde doar umbrele, peste fundalul de hârtie. */
function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, PALACE.ground, 0]} receiveShadow>
      <circleGeometry args={[2400, 64]} />
      <shadowMaterial transparent opacity={0.17} />
    </mesh>
  )
}

export function Scene() {
  return (
    <Canvas
      flat
      shadows
      resize={{ scroll: false }}
      dpr={[1, 1.75]}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
      camera={{ fov: 30, near: 2, far: 4200, position: [-300, 130, 520] }}
    >
      <color attach="background" args={[PAPER]} />
      <fog attach="fog" args={[PAPER, 1100, 2700]} />
      <Lights />
      <Ground />
      <Palace />
      <Rooms />
      <CameraRig />
      {AO_ENABLED && <Effects />}
    </Canvas>
  )
}
