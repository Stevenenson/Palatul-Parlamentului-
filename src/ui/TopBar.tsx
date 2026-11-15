import { ROOMS } from '../content/rooms'
import { stopLink } from './links'
import { HISTORY_URL, tourUrl } from './pages'

type Page = 'tur' | 'istorie'

/**
 * Bara de sus, comună celor două pagini. Pe tur, linkurile spre săli și hartă zboară cu
 * camera; pe pagina de istorie, duc la tur, deschis direct la oprirea respectivă.
 */
export function TopBar({ page = 'tur' }: { page?: Page }) {
  const onTour = page === 'tur'
  const toStop = (id: string) => (onTour ? stopLink(id) : { href: tourUrl(id === 'palat' ? undefined : id) })

  return (
    <header className="topbar">
      <div className="wrap topbar__row">
        <a className="brand" {...toStop('palat')}>
          <svg className="brand__mark" viewBox="0 0 28 20" aria-hidden="true">
            <path d="M1 19h26v-6h-4V8h-5V3h-8v5H5v5H1z" />
          </svg>
          Palatul Parlamentului
        </a>
        <nav className="topbar__nav" aria-label="Principal">
          <a href={HISTORY_URL} aria-current={onTour ? undefined : 'page'}>
            Istorie
          </a>
          <a {...toStop(ROOMS[0].id)}>Săli</a>
          <a {...toStop('harta')}>Hartă</a>
        </nav>
      </div>
    </header>
  )
}
