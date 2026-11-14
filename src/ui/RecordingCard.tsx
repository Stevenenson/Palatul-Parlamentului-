import { useRef, useState, type PointerEvent } from 'react'
import type { RoomSpec } from '../content/rooms'
import { recordingVideos } from '../state/media'
import { swipeCancel, swipeEnd, swipeMove, swipeStart } from '../state/swipe'
import { useTour, wrapIndex } from '../state/tour'

const ICONS = {
  previous: 'M14.5 5.5 8 12l6.5 6.5',
  next: 'M9.5 5.5 16 12l-6.5 6.5',
  pause: 'M9 6v12M15 6v12',
  play: 'M8.5 5.5v13l10.5-6.5z',
  soundOn: 'M4 10v4h3l4 3.5v-11L7 10zM15 9.5a3.5 3.5 0 0 1 0 5M17.5 7a7 7 0 0 1 0 10',
  soundOff: 'M4 10v4h3l4 3.5v-11L7 10zM16 9.5l5 5M21 9.5l-5 5',
  expand: 'M5 10V5h5M19 14v5h-5M5 5l6 6M19 19l-6-6',
}

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={d} />
    </svg>
  )
}

/**
 * Playerul filmărilor dintr-o sală: spune ce arată holograma acum și o schimbă cu
 * săgeți, puncte, tastele stânga/dreapta sau cu un swipe pe card ori pe hologramă.
 */
export function RecordingCard({ room, index }: { room: RoomSpec; index: number }) {
  const position = useTour((s) => s.recording[index])
  const muted = useTour((s) => s.muted)
  const failed = useTour((s) => s.scene === 'failed')
  const paused = useTour((s) => s.paused)
  const dialog = useRef<HTMLDialogElement>(null)
  const [open, setOpen] = useState(false)
  const count = room.recordings.length
  const current = wrapIndex(position, count)
  const recording = room.recordings[current]
  const { stepRecording, showRecording, set } = useTour.getState()
  const video = recording.media.kind === 'video' ? recording.media : null

  // Sunetul și pauza se aplică filmării chiar în click: Safari și iPhone opresc o filmare
  // căreia i se dă sunet în afara unui gest al utilizatorului.
  const toggleSound = () => {
    const element = recordingVideos.get(recording.id)
    if (element) {
      element.muted = !muted
      if (muted && !paused) void element.play().catch(() => {})
    }
    set({ muted: !muted })
  }
  const togglePause = () => {
    const element = recordingVideos.get(recording.id)
    if (element) {
      if (paused) void element.play().catch(() => {})
      else element.pause()
    }
    set({ paused: !paused })
  }

  // Filmarea mare, cu comenzile browserului: pauză, derulare, ecran complet, acces pentru cititoare de ecran.
  const openLarge = () => {
    recordingVideos.get(recording.id)?.pause()
    set({ paused: true })
    setOpen(true)
    dialog.current?.showModal()
  }

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
        <p className="recording__count">
          Filmarea {current + 1} din {count}
        </p>
        {recording.demo && <p className="tag">Conținut de test</p>}
      </div>
      {/* Fără scenă 3D nu există hologramă: filmarea se vede direct în card. */}
      {failed &&
        (recording.media.kind === 'video' ? (
          <video
            key={recording.id}
            className="recording__media"
            src={recording.media.src}
            poster={recording.media.poster}
            controls
            playsInline
            preload="metadata"
          />
        ) : (
          <img className="recording__media" src={recording.media.src} alt="" />
        ))}
      {/* Cititorul de ecran anunță filmarea nouă cu titlu și descriere, nu doar numărul ei. */}
      <div aria-live="polite">
        <h3>{recording.title}</h3>
        <p className="recording__who">{recording.who}</p>
        <p className="recording__text">{recording.text}</p>
      </div>
      <div className="recording__controls">
        <button
          type="button"
          className="icon-btn round"
          aria-label="Filmarea anterioară"
          onClick={() => stepRecording(index, -1)}
        >
          <Icon d={ICONS.previous} />
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
          className="icon-btn round"
          aria-label="Filmarea următoare"
          onClick={() => stepRecording(index, 1)}
        >
          <Icon d={ICONS.next} />
        </button>
        {!failed && (
          <span className="recording__video">
            {video && (
              <button
                type="button"
                className="icon-btn"
                aria-label={paused ? 'Pornește filmarea' : 'Pune pauză'}
                onClick={togglePause}
              >
                <Icon d={paused ? ICONS.play : ICONS.pause} />
              </button>
            )}
            {/* O filmare fără pistă audio nu primește buton de sunet. */}
            {video && !video.silent && (
              <button
                type="button"
                className="icon-btn"
                aria-label={muted ? 'Pornește sunetul' : 'Oprește sunetul'}
                onClick={toggleSound}
              >
                <Icon d={muted ? ICONS.soundOff : ICONS.soundOn} />
              </button>
            )}
            <button type="button" className="icon-btn" aria-label="Deschide filmarea mare" onClick={openLarge}>
              <Icon d={ICONS.expand} />
            </button>
          </span>
        )}
      </div>

      <dialog
        ref={dialog}
        className="lightbox"
        aria-label={`${recording.title}, ${room.name}`}
        onClose={() => setOpen(false)}
      >
        {open &&
          (recording.media.kind === 'video' ? (
            <video src={recording.media.src} poster={recording.media.poster} controls autoPlay playsInline />
          ) : (
            <img src={recording.media.src} alt={recording.title} />
          ))}
        <form method="dialog" className="lightbox__bar">
          <button className="btn btn--primary">Închide filmarea</button>
        </form>
      </dialog>
    </section>
  )
}
