import { Suspense, lazy, useEffect } from 'react'
import { ROOMS } from './content/rooms'
import { initDirector } from './scroll/director'
import { loadCityData } from './state/cityData'
import { useTour } from './state/tour'
import { Footer } from './ui/Footer'
import { Hero, PalaceSection } from './ui/Hero'
import { Meander } from './ui/Meander'
import { MapSection } from './ui/MapSection'
import { RealRoom } from './ui/RealRoom'
import { RoomSection } from './ui/RoomSection'
import { SceneBoundary } from './ui/SceneBoundary'
import { StopNav } from './ui/StopNav'
import { TopBar } from './ui/TopBar'
import { ZoomControl } from './ui/ZoomControl'
import { hasWebGL } from './ui/webgl'

// Scena 3D e partea grea a paginii: se încarcă separat, după ce textul e deja pe ecran.
const Scene = lazy(() => import('./three/Scene').then((module) => ({ default: module.Scene })))

const WEBGL = hasWebGL()

// Macheta orașului e primul lucru de pe ecran: datele ei pornesc odată cu scena, nu după ea.
if (WEBGL) loadCityData().catch(() => {})

export function App() {
  const scene = useTour((s) => s.scene)

  useEffect(() => initDirector(), [])
  useEffect(() => {
    if (!WEBGL) useTour.getState().set({ scene: 'failed' })
  }, [])

  return (
    <>
      <a className="skip" href="#continut">
        Sari la conținut
      </a>
      <TopBar />
      <div className="stage" aria-hidden="true">
        {WEBGL && (
          <SceneBoundary>
            <Suspense fallback={null}>
              <Scene />
            </Suspense>
          </SceneBoundary>
        )}
        {scene === 'loading' && (
          <p className="stage__status">
            <Meander units={5} draw />
            Se încarcă macheta
          </p>
        )}
      </div>
      <main id="continut">
        <Hero />
        <PalaceSection />
        {ROOMS.map((room, i) => (
          <RoomSection key={room.id} room={room} index={i} />
        ))}
        <MapSection />
      </main>
      <Footer />
      <StopNav />
      <ZoomControl />
      <RealRoom />
    </>
  )
}
