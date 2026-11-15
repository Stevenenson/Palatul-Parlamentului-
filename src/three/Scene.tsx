import { Suspense, lazy } from 'react'
import { Canvas } from '@react-three/fiber'
import { useTour } from '../state/tour'
import { CameraRig } from './CameraRig'
import { ArcgisLayer } from './city/ArcgisLayer'
import { City } from './city/City'
import { AO_ENABLED, Ground, LIGHT_DEVICE, Lights, PAPER } from './Lights'
import { Palace } from './palace/Palace'
import { Holograms } from './hologram/Holograms'
import { MapMarkers } from './map/MapMarkers'
import { Rooms } from './rooms/Rooms'

const Effects = lazy(() => import('./Effects'))

export function Scene() {
  // Cât e deschisă vederea reală 360°, macheta nu se vede: nu mai desenăm cadre degeaba.
  const covered = useTour((s) => s.real !== null)

  return (
    <Canvas
      frameloop={covered ? 'never' : 'always'}
      flat
      shadows
      resize={{ scroll: false }}
      dpr={LIGHT_DEVICE ? [1, 1.5] : [1, 1.75]}
      gl={{ antialias: !AO_ENABLED, powerPreference: 'high-performance' }}
      camera={{ fov: 30, near: 6, far: 9000, position: [-1150, 1050, 1500] }}
    >
      <color attach="background" args={[PAPER]} />
      <fog attach="fog" args={[PAPER, 1100, 2700]} />
      <Lights />
      <Ground />
      <Palace />
      <City />
      <Rooms />
      <Holograms />
      <MapMarkers />
      <CameraRig />
      <ArcgisLayer />
      {AO_ENABLED && (
        <Suspense fallback={null}>
          <Effects />
        </Suspense>
      )}
    </Canvas>
  )
}
