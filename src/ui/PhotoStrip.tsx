import { useRef, useState } from 'react'
import type { RoomSpec } from '../content/rooms'

/**
 * Fotografiile reale ale unei săli: un rând de miniaturi în panoul sălii, care se
 * deschid mari într-o casetă. Apare doar când sala are fotografii în `rooms.ts`.
 */
export function PhotoStrip({ room }: { room: RoomSpec }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [open, setOpen] = useState(0)

  if (room.photos.length === 0) return null
  const photo = room.photos[open]

  const show = (index: number) => {
    setOpen(index)
    dialog.current?.showModal()
  }

  return (
    <div className="photos">
      <h3 className="photos__title">Photos of the hall</h3>
      <ul className="photos__list">
        {room.photos.map((item, i) => (
          <li key={item.src}>
            <button type="button" className="photos__thumb" onClick={() => show(i)}>
              <img src={item.src} alt={item.alt} loading="lazy" />
            </button>
          </li>
        ))}
      </ul>
      <dialog ref={dialog} className="lightbox" aria-label={`Photo of ${room.name}`}>
        <img src={photo.src} alt={photo.alt} />
        <form method="dialog" className="lightbox__bar">
          {room.photos.length > 1 && (
            <button
              type="button"
              className="btn"
              onClick={() => setOpen((open + 1) % room.photos.length)}
            >
              Next photo
            </button>
          )}
          <button className="btn btn--primary">Close the photo</button>
        </form>
      </dialog>
    </div>
  )
}
