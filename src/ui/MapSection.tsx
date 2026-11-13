import type { CSSProperties } from 'react'
import { ROOMS } from '../content/rooms'
import { stopLink } from './links'

export function MapSection() {
  return (
    <section id="harta" className="stop map" aria-labelledby="harta-titlu">
      <div className="wrap room__grid">
        <div className="panel">
          <h2 id="harta-titlu" tabIndex={-1}>
            Harta sălilor
          </h2>
          <p>Alege o sală din listă sau un pin de pe machetă ca să ajungi direct în ea.</p>
          <ol className="legend">
            {ROOMS.map((room) => (
              <li key={room.id}>
                <a
                  className="legend__item"
                  style={{ '--accent': room.accent } as CSSProperties}
                  {...stopLink(room.id)}
                >
                  <span className="legend__dot" aria-hidden="true" />
                  <span className="legend__name">{room.name}</span>
                  <span className="legend__note">{room.note}</span>
                </a>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
