import { PALACE_FACTS, ROOMS } from '../content/rooms'
import { useTour } from '../state/tour'
import { stopLink } from './links'

export function Hero() {
  const hasOrbited = useTour((s) => s.hasOrbited)

  return (
    <section id="palat" className="stop hero" aria-labelledby="titlu">
      <div className="wrap hero__grid">
        <div className="hero__text">
          <h1 id="titlu">Palatul Parlamentului din București, în 3D</h1>
          <p className="lead">
            Trage de machetă ca să o rotești. Derulează ca să intri pe rând în patru săli și să
            asculți ce spun oamenii despre clădire.
          </p>
          <div className="actions">
            <a className="btn btn--primary" {...stopLink(ROOMS[0].id)}>
              Începe turul sălilor
            </a>
            <a className="btn" {...stopLink('harta')}>
              Vezi harta sălilor
            </a>
          </div>
        </div>

        <dl className="facts hero__facts">
          {PALACE_FACTS.map((fact) => (
            <div key={fact.label} className="fact">
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>

        <p className="hint" data-done={hasOrbited || undefined}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 12a8 4 0 0 0 16 0M4 12a8 4 0 0 1 16 0M17 15.5l3-3.5-4-1.5" />
          </svg>
          Trage ca să rotești macheta
        </p>
      </div>
    </section>
  )
}
