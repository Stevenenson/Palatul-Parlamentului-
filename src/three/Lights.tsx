import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { type AmbientLight, type DirectionalLight, MathUtils } from 'three'
import { live } from '../state/tour'
import { PALACE } from './palace/massing'

/**
 * Lumina și terenul machetei, comune turului și paginii de istorie.
 */

/** Aceeași culoare ca `--paper` din CSS: fundalul scenei se continuă în pagină. */
export const PAPER = '#f2f0eb'

/** Telefoane și tablete: fără postprocesare, cu antialiasing-ul obișnuit al canvas-ului. */
export const LIGHT_DEVICE = window.matchMedia('(max-width: 760px), (pointer: coarse)').matches

/** `?ao=0` în adresă oprește ocluzia ambientală, pentru comparații și măsurători. */
export const AO_ENABLED = new URLSearchParams(window.location.search).get('ao') !== '0' && !LIGHT_DEVICE

/**
 * Lumină de machetă: soarele vine jos, din dreapta fațadei. Fațada principală e luminată
 * razant, deci pilaștrii, ancadramentele și pavilioanele aruncă umbre lungi pe ea, iar
 * latura din stânga rămâne în umbră și desparte volumele. O umplere difuză ține umbrele deschise.
 *
 * Clădirea și lumina stau pe loc, deci harta de umbre se desenează o singură dată, la
 * pornire; pe urmă se schimbă doar tăria umbrelor, care scade odată cu opacitatea carcasei.
 * Cine schimbă geometria (pagina de istorie ridică palatul din teren) cere singur o hartă nouă.
 */
export function Lights() {
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
      sun.current.intensity = MathUtils.lerp(3.0, 1.0, inside)
    }
    if (fill.current) fill.current.intensity = 1.05 * inside
  })

  return (
    <>
      <hemisphereLight args={['#ffffff', '#dbd6cc', 1.62]} />
      <ambientLight ref={fill} intensity={0} />
      <directionalLight
        ref={sun}
        position={[470, 390, 300]}
        intensity={3.0}
        castShadow
        shadow-mapSize={LIGHT_DEVICE ? [2048, 2048] : [4096, 4096]}
        shadow-bias={-0.0003}
        shadow-normalBias={0.3}
        shadow-radius={2}
      >
        <orthographicCamera attach="shadow-camera" args={[-260, 260, 260, -260, 100, 1300]} />
      </directionalLight>
    </>
  )
}

/** Terenul nu are culoare proprie: prinde doar umbrele, peste fundalul de hârtie. */
export function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, PALACE.ground, 0]} receiveShadow>
      <circleGeometry args={[2400, 64]} />
      <shadowMaterial transparent opacity={0.14} />
    </mesh>
  )
}
