import type { PointerEvent } from 'react'
import type { RoomSpec } from '../content/rooms'
import { swipeCancel, swipeEnd, swipeMove, swipeStart } from '../state/swipe'
import { useTour, wrapIndex } from '../state/tour'

/**
 * Cardul filmărilor dintr-o sală: spune ce arată holograma acum și o schimbă cu
 * săgeți, puncte, tastele stânga/dreapta sau cu un swipe pe card ori pe hologramă.
 */
export function RecordingCard({ room, index }: { room: RoomSpec; index: number }) {
  const position = useTour((s) => s.recording[index])
  const muted = useTour((s) => s.muted)
  const count = room.recordings.length
  const current = wrapIndex(position, count)
  const recording = room.recordings[current]
  const { stepRecording, showRecording, set } = useTour.getState()

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    // Butoanele rămân butoane; gestul pornește doar de pe restul cardului.
    if ((event.target as HTMLElement).closest('button')) return
    if (swipeStart(event.clientX)) event.currentTarget.setPointerCapture(event.pointerId)
  }

  return (
    <section
      className="recording"
      aria-label={`Filmări din ${room.name}`}
      onPointerDown={onPointerDown}
      onPointerMove={(event) => swipeMove(event.clientX)}
      onPointerUp={swipeEnd}
      onPointerCancel={swipeCancel}
    >
      <div className="recording__top">
        <p className="recording__count" aria-live="polite">
          Filmarea {current + 1} din {count}
        </p>
        {recording.demo && <p className="tag">Conținut de test</p>}
      </div>
      <h3>{recording.title}</h3>
      <p className="recording__who">{recording.who}</p>
      <p className="recording__text">{recording.text}</p>
      <div className="recording__controls">
        <button
          type="button"
          className="round"
          aria-label="Filmarea anterioară"
          onClick={() => stepRecording(index, -1)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M14.5 5.5 8 12l6.5 6.5" />
          </svg>
        </button>
        <ol className="dots">
          {room.recordings.map((item, i) => (
            <li key={item.id}>
              <button
                type="button"
                className="dot"
                aria-label={`Filmarea ${i + 1}: ${item.title}`}
                aria-current={i === current ? 'true' : undefined}
                onClick={() => showRecording(index, i)}
              />
            </li>
          ))}
        </ol>
        <button
          type="button"
          className="round"
          aria-label="Filmarea următoare"
          onClick={() => stepRecording(index, 1)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9.5 5.5 16 12l-6.5 6.5" />
          </svg>
        </button>
        {recording.media.kind === 'video' && (
          <button type="button" className="sound" onClick={() => set({ muted: !muted })}>
            {muted ? 'Pornește sunetul' : 'Oprește sunetul'}
          </button>
        )}
      </div>
    </section>
  )
}
