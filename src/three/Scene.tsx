import { Canvas } from '@react-three/fiber'
import { CameraRig } from './CameraRig'
import { PalacePlaceholder, RoomsPlaceholder } from './Placeholder'

/** Aceeași culoare ca `--paper` din CSS: fundalul scenei se continuă în pagină. */
export const PAPER = '#f2f0eb'

function Lights() {
  return (
    <>
      <hemisphereLight args={['#ffffff', '#d9d5cc', 2]} />
      <directionalLight
        position={[260, 420, 340]}
        intensity={1.9}
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.6}
      >
        <orthographicCamera attach="shadow-camera" args={[-330, 330, 330, -330, 50, 1200]} />
      </directionalLight>
    </>
  )
}

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <circleGeometry args={[2400, 64]} />
      <shadowMaterial transparent opacity={0.16} />
    </mesh>
  )
}

export function Scene() {
  return (
    <Canvas
      flat
      shadows
      dpr={[1, 1.75]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      camera={{ fov: 30, near: 2, far: 4200, position: [300, 150, 520] }}
    >
      <color attach="background" args={[PAPER]} />
      <fog attach="fog" args={[PAPER, 1100, 2600]} />
      <Lights />
      <Ground />
      <PalacePlaceholder />
      <RoomsPlaceholder />
      <CameraRig />
    </Canvas>
  )
}
