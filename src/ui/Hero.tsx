import { PALACE_FACTS, ROOMS } from '../content/rooms'
import { useTour } from '../state/tour'
import { stopLink } from './links'
import { Meander } from './Meander'

export function Hero() {
  const hasOrbited = useTour((s) => s.hasOrbited)
  const failed = useTour((s) => s.scene === 'failed')

  return (
    <section id="palat" className="stop hero" aria-labelledby="titlu">
      <div className="wrap hero__grid">
        <div className="hero__head">
          <p className="overline">București · tur 3D</p>
          <h1 id="titlu" tabIndex={-1}>
            Palatul Parlamentului
            <span className="sr-only"> din București, în 3D</span>
          </h1>
          <Meander units={7} />
          <p className="lead">
            Rotește macheta, apoi coboară prin patru săli și ascultă oamenii din fiecare.
          </p>
          {failed && (
            <p className="notice">
              Browserul acesta nu poate desena macheta 3D. Textele despre săli și lista lor rămân mai jos.
            </p>
          )}
        </div>

        <div className="hero__foot">
          <div className="actions">
            <a className="btn btn--primary" {...stopLink(ROOMS[0].id)}>
              Începe turul
            </a>
            <a className="link" {...stopLink('harta')}>
              Harta sălilor
            </a>
          </div>
          <dl className="facts hero__facts">
            {PALACE_FACTS.map((fact) => (
              <div key={fact.label} className="fact">
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <p className="hint" data-done={hasOrbited || failed || undefined}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 12a8 4 0 0 0 16 0M4 12a8 4 0 0 1 16 0M17 15.5l3-3.5-4-1.5" />
          </svg>
          Trage ca să rotești macheta
        </p>
      </div>
    </section>
  )
}
