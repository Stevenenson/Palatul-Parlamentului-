import { useEffect, useRef } from 'react'
import { ROOMS } from '../content/rooms'
import { toRoman } from '../content/roman'
import { embedUrl } from '../content/streetView'
import { recordingVideos } from '../state/media'
import { useTour, wrapIndex } from '../state/tour'

/**
 * „Sala reală 360°”: panorama Google Street View a sălii, pe tot ecranul, cu filmările alături.
 * Cadrul Google se creează abia când vizitatorul cere vederea, deci până atunci pagina nu
 * trimite nimic către Google. Peste cadru nu punem nimic: atribuirea Google trebuie să rămână întreagă.
 */
export function RealRoom() {
  const real = useTour((s) => s.real)
  const position = useTour((s) => (s.real === null ? 0 : s.recording[s.real]))
  const dialog = useRef<HTMLDialogElement>(null)
  const { set, stepRecording } = useTour.getState()

  useEffect(() => {
    const el = dialog.current
    if (!el) return
    if (real !== null && !el.open) {
      // Scena 3D se oprește cât e deschisă foaia, deci filmarea din hologramă trebuie oprită de aici.
      for (const video of recordingVideos.values()) video.pause()
      el.showModal()
    } else if (real === null && el.open) {
      el.close()
    }
  }, [real])

  const room = real === null ? null : ROOMS[real]
  const view = room?.streetView
  const count = room?.recordings.length ?? 1
  const current = wrapIndex(position, count)
  const recording = room?.recordings[current]

  return (
    <dialog
      ref={dialog}
      className="real"
      aria-labelledby="real-titlu"
      onClose={() => set({ real: null })}
    >
      {room && view && recording && real !== null && (
        <>
          <header className="real__bar">
            <div className="real__name">
              <p className="overline" aria-hidden="true">
                Sala {toRoman(real + 1)}
              </p>
              <h2 id="real-titlu">{room.name}</h2>
            </div>
            <div className="segmented real__switch" role="group" aria-label="Vederea sălii">
              <button type="button" aria-pressed="false" onClick={() => set({ real: null })}>
                Machetă
              </button>
              <button type="button" aria-pressed="true">
                Sala reală 360°
              </button>
            </div>
            <button
              type="button"
              className="icon-btn real__close"
              aria-label="Închide vederea 360° și revino la machetă"
              onClick={() => set({ real: null })}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </header>

          <div className="real__body">
            <iframe
              className="real__frame"
              src={embedUrl(view)}
              title={`Vedere 360° din ${room.name}, Google Street View`}
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            />

            <section className="real__side" aria-label={`Filmări din ${room.name}`}>
              <p className="real__count">
                Filmarea {current + 1} din {count}
                {recording.demo && <span className="tag">Conținut de test</span>}
              </p>
              {recording.media.kind === 'video' ? (
                <video
                  key={recording.id}
                  className="real__media"
                  src={recording.media.src}
                  poster={recording.media.poster}
                  controls
                  playsInline
                  preload="metadata"
                />
              ) : (
                <img className="real__media" src={recording.media.src} alt="" />
              )}
              <div aria-live="polite">
                <h3>{recording.title}</h3>
                <p className="real__who">{recording.who}</p>
                <p className="real__text">{recording.text}</p>
              </div>
              <div className="real__controls">
                <button
                  type="button"
                  className="icon-btn"
                  aria-label="Filmarea anterioară"
                  onClick={() => stepRecording(real, -1)}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M14.5 5.5 8 12l6.5 6.5" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  aria-label="Filmarea următoare"
                  onClick={() => stepRecording(real, 1)}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M9.5 5.5 16 12l-6.5 6.5" />
                  </svg>
                </button>
              </div>
            </section>
          </div>

          <p className="real__credit">
            Imagini: Google Street View.{' '}
            <a href={view.source} target="_blank" rel="noreferrer">
              Deschide sala în Google Arts &amp; Culture
            </a>
          </p>
        </>
      )}
    </dialog>
  )
}
