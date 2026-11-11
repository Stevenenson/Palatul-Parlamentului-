import type { CSSProperties } from 'react'
import { ROOMS, type RoomSpec } from '../content/rooms'
import { stopLink } from './links'

export function RoomSection({ room, index }: { room: RoomSpec; index: number }) {
  const titleId = `${room.id}-titlu`

  return (
    <section
      id={room.id}
      className="stop room"
      aria-labelledby={titleId}
      style={{ '--accent': room.accent } as CSSProperties}
    >
      <div className="wrap room__grid">
        <article className="panel">
          <p className="panel__index">
            Sala {index + 1} din {ROOMS.length}
          </p>
          <h2 id={titleId}>{room.name}</h2>
          <p className="panel__place">{room.place}</p>
          <p>{room.text}</p>
          <dl className="facts facts--panel">
            {room.facts.map((fact) => (
              <div key={fact.label} className="fact">
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
          <a className="link" {...stopLink('harta')}>
            Vezi sala pe hartă
          </a>
        </article>
      </div>
    </section>
  )
}
