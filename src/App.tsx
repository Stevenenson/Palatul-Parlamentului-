import { useEffect } from 'react'
import { ROOMS } from './content/rooms'
import { initDirector } from './scroll/director'
import { Scene } from './three/Scene'
import { Footer } from './ui/Footer'
import { Hero } from './ui/Hero'
import { MapSection } from './ui/MapSection'
import { RoomSection } from './ui/RoomSection'
import { StopNav } from './ui/StopNav'
import { TopBar } from './ui/TopBar'

export function App() {
  useEffect(() => initDirector(), [])

  return (
    <>
      <a className="skip" href="#continut">
        Sari la conținut
      </a>
      <TopBar />
      <div className="stage" aria-hidden="true">
        <Scene />
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
