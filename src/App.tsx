import { Suspense, lazy, useEffect } from 'react'
import { ROOMS } from './content/rooms'
import { initDirector } from './scroll/director'
import { useTour } from './state/tour'
import { Footer } from './ui/Footer'
import { Hero } from './ui/Hero'
import { MapSection } from './ui/MapSection'
import { RoomSection } from './ui/RoomSection'
import { SceneBoundary } from './ui/SceneBoundary'
import { StopNav } from './ui/StopNav'
import { TopBar } from './ui/TopBar'

// Scena 3D e partea grea a paginii: se încarcă separat, după ce textul e deja pe ecran.
const Scene = lazy(() => import('./three/Scene').then((module) => ({ default: module.Scene })))

function hasWebGL() {
  try {
    return Boolean(document.createElement('canvas').getContext('webgl2'))
  } catch {
    return false
  }
}

const WEBGL = hasWebGL()

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
        {scene !== 'failed' && (
          <p className="stage__status" data-hidden={scene === 'ready' || undefined}>
            Se încarcă macheta
          </p>
        )}
      </div>
      <main id="continut">
        <Hero />
        {ROOMS.map((room, i) => (
          <RoomSection key={room.id} room={room} index={i} />
        ))}
        <MapSection />
      </main>
      <Footer />
      <StopNav />
    </>
  )
}
