import { stopLink } from './links'

export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer__row">
        <p className="footer__brand">Palatul Parlamentului, tur 3D</p>
        <p>
          Macheta este schematică: proporțiile clădirii și pozițiile sălilor sunt aproximative.
          Filmările de test vor fi înlocuite cu cele reale. Vederile reale în 360° sunt panorame Google
          Street View, afișate prin încorporarea Google; nu sunt copiate în acest site.
        </p>
        <p>
          Cifrele despre clădire vin din articolul{' '}
          <a className="link" href="https://ro.wikipedia.org/wiki/Palatul_Parlamentului">
            „Palatul Parlamentului” de pe Wikipedia
          </a>
          , citit în noiembrie 2026; unde articolul dă două valori, am folosit-o pe cea din introducere.{' '}
          <a className="link" {...stopLink('palat')}>
            Mergi la începutul turului
          </a>
        </p>
      </div>
    </footer>
  )
}
