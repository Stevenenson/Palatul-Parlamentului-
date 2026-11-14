import { useTour } from '../state/tour'
import { STOP_LIST as STOPS } from '../content/stops'
import { stopLink } from './links'

/** Punctele din marginea ecranului: arată unde ești în tur și duc direct la orice oprire. */
export function StopNav() {
  const current = useTour((s) => s.stop)

  return (
    <nav className="stopnav" aria-label="Opririle turului">
      <ol>
        {STOPS.map((stop, i) => (
          <li key={stop.id}>
            <a
              className="stopnav__item"
              aria-current={i === current ? 'step' : undefined}
              {...stopLink(stop.id)}
            >
              <span className="stopnav__label">{stop.label}</span>
              <span className="stopnav__dot" aria-hidden="true" />
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
