import { ROOMS } from '../content/rooms'
import { stopLink } from './links'

export function TopBar() {
  return (
    <header className="topbar">
      <div className="wrap topbar__row">
        <a className="brand" {...stopLink('palat')}>
          <svg className="brand__mark" viewBox="0 0 28 20" aria-hidden="true">
            <path d="M1 19h26v-6h-4V8h-5V3h-8v5H5v5H1z" />
          </svg>
          Palatul Parlamentului
        </a>
        <nav className="topbar__nav" aria-label="Principal">
          <a {...stopLink(ROOMS[0].id)}>Săli</a>
          <a {...stopLink('harta')}>Hartă</a>
        </nav>
      </div>
    </header>
  )
}
