import type { CSSProperties } from 'react'
import { ROOMS } from '../content/rooms'
import { useTour } from '../state/tour'
import { pinElements } from '../state/pins'
import { stopLink } from './links'

/**
 * Harta sălilor: legenda din panou și pinurile de pe machetă duc în aceleași săli.
 * Pinurile sunt pentru mouse și atingere; din tastatură se folosește legenda, deci
 * pinurile sunt scoase din ordinea de Tab ca să nu apară fiecare sală de două ori.
 * Numerele din legendă se regăsesc pe pinuri; pe ecrane înguste pinurile arată doar numărul.
 */
export function MapSection() {
  const hovered = useTour((s) => s.hoverRoom)
  const hover = (room: number | null) => useTour.getState().set({ hoverRoom: room })

  return (
    <section id="harta" className="stop map" aria-labelledby="harta-titlu">
      <div className="wrap room__grid">
        <div className="panel">
          <h2 id="harta-titlu" tabIndex={-1}>
            Harta sălilor
          </h2>
          <p>Alege o sală din listă sau un pin de pe machetă ca să ajungi direct în ea.</p>
          <ol className="legend">
            {ROOMS.map((room, i) => (
              <li key={room.id}>
                <a
                  className="legend__item"
                  data-hover={hovered === i || undefined}
                  style={{ '--accent': room.accent } as CSSProperties}
                  onPointerEnter={() => hover(i)}
                  onPointerLeave={() => hover(null)}
                  onFocus={() => hover(i)}
                  onBlur={() => hover(null)}
                  {...stopLink(room.id)}
                >
                  <span className="legend__dot" aria-hidden="true">
                    {i + 1}
                  </span>
                  <span className="legend__name">
                    {room.name}
                    {room.streetView && (
                      <span className="badge" title="Are vedere reală în 360°">
                        360°
                      </span>
                    )}
                  </span>
                  <span className="legend__note">{room.note}</span>
                </a>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="pins" aria-hidden="true">
        {ROOMS.map((room, i) => (
          <a
            key={room.id}
            ref={(el) => {
              pinElements[i] = el
            }}
            className="pin"
            data-hover={hovered === i || undefined}
            style={{ '--accent': room.accent } as CSSProperties}
            tabIndex={-1}
            onPointerEnter={() => hover(i)}
            onPointerLeave={() => hover(null)}
            {...stopLink(room.id)}
          >
            <span className="pin__label">
              <span className="pin__number">{i + 1}</span>
              <span className="pin__name">{room.name}</span>
            </span>
            <span className="pin__stem" />
            <span className="pin__dot" />
          </a>
        ))}
      </div>
    </section>
  )
}
