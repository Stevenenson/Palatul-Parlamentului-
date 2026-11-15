import { CITY_LABELS } from '../content/city'
import { PALACE_FACTS, ROOMS } from '../content/rooms'
import { cityLabelElements } from '../state/cityLabels'
import { useTour } from '../state/tour'
import { stopLink } from './links'
import { Meander } from './Meander'

/**
 * Primul ecran: palatul văzut de sus, în oraș. Titlul stă sus, iar reperele din jur sunt
 * etichete așezate de scena 3D peste macheta orașului.
 */
export function Hero() {
  const failed = useTour((s) => s.scene === 'failed')

  return (
    <section id="oras" className="stop hero hero--city" aria-labelledby="titlu">
      <div className="wrap hero__grid">
        <div className="hero__head">
          <p className="overline">București · tur 3D</p>
          <h1 id="titlu" tabIndex={-1}>
            Palatul Parlamentului
            <span className="sr-only"> din București, în 3D</span>
          </h1>
          <Meander units={9} />
          <p className="lead">Întâi în oraș, la capătul Bulevardului Unirii. Apoi de aproape, sală cu sală.</p>
          {failed && (
            <p className="notice">
              Browserul acesta nu poate desena macheta 3D. Textele despre săli și lista lor rămân mai jos.
            </p>
          )}
        </div>

        <div className="hero__foot">
          <a className="descend" {...stopLink('palat')}>
            Coboară spre palat
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 4v15M6 13l6 6 6-6" />
            </svg>
          </a>
        </div>
      </div>

      <a className="osm" href="https://www.openstreetmap.org/copyright">
        © OpenStreetMap
      </a>

      <div className="citylabels" aria-hidden="true">
        {CITY_LABELS.map((label, i) => (
          <span
            key={label.id}
            ref={(el) => {
              cityLabelElements[i] = el
            }}
            className="citylabel"
          >
            <span className="citylabel__dot" />
            <span className="citylabel__name">{label.name}</span>
          </span>
        ))}
      </div>
    </section>
  )
}

/** Al doilea ecran: macheta mare a palatului, pe care o poți roti, cu cifrele ei. */
export function PalaceSection() {
  const hasOrbited = useTour((s) => s.hasOrbited)
  const failed = useTour((s) => s.scene === 'failed')

  return (
    <section id="palat" className="stop hero hero--palace" aria-labelledby="palat-titlu">
      <div className="wrap hero__grid">
        <div className="hero__head">
          <p className="overline">Macheta</p>
          <h2 id="palat-titlu" className="hero__title" tabIndex={-1}>
            Palatul, de aproape
          </h2>
          <p className="lead">Rotește macheta, apoi coboară prin patru săli și vezi filmările din fiecare.</p>
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
