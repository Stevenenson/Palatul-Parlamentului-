import type { CSSProperties } from 'react'
import { ROOMS, type RoomSpec } from '../content/rooms'
import { toRoman } from '../content/roman'
import { useTour } from '../state/tour'
import { stopLink } from './links'
import { PhotoStrip } from './PhotoStrip'
import { RecordingCard } from './RecordingCard'

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
        {room.streetView && (
          <div className="view">
            <div className="segmented glass" role="group" aria-label={`Vederea sălii: ${room.name}`}>
              <button type="button" aria-pressed="true">
                Machetă
              </button>
              <button
                type="button"
                className="view__real"
                aria-pressed="false"
                onClick={() => useTour.getState().set({ real: index })}
              >
                Sala reală 360°
              </button>
            </div>
            <p className="view__note">Imaginile reale se încarcă de la Google Street View.</p>
          </div>
        )}
        <article className="panel">
          <p className="panel__index">
            <span aria-hidden="true">
              Sala {toRoman(index + 1)} din {toRoman(ROOMS.length)}
            </span>
            <span className="sr-only">
              Sala {index + 1} din {ROOMS.length}
            </span>
          </p>
          <h2 id={titleId} tabIndex={-1}>
            {room.name}
          </h2>
          <p className="panel__note">{room.note}</p>
          <dl className="facts facts--panel">
            {room.facts.slice(0, 2).map((fact) => (
              <div key={fact.label} className="fact">
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
          {/* Restul stă pliat, ca panoul să lase sala la vedere. */}
          <details className="about">
            <summary>Despre sală</summary>
            <p>{room.text}</p>
            {room.facts.length > 2 && (
              <dl className="facts facts--panel">
                {room.facts.slice(2).map((fact) => (
                  <div key={fact.label} className="fact">
                    <dt>{fact.label}</dt>
                    <dd>{fact.value}</dd>
                  </div>
                ))}
              </dl>
            )}
            <PhotoStrip room={room} />
          </details>
          <a className="link" {...stopLink('harta')}>
            Vezi sala pe hartă
          </a>
        </article>
        <RecordingCard room={room} index={index} />
      </div>
    </section>
  )
}
