import { stopLink } from './links'

export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer__row">
        <p className="footer__brand">Palatul Parlamentului, tur 3D</p>
        <p>
          Macheta este schematică: proporțiile clădirii și pozițiile sălilor sunt aproximative.
          Filmările de test vor fi înlocuite cu cele reale.
        </p>
        <p>
          Date despre clădire: Wikipedia, articolul „Palatul Parlamentului”.{' '}
          <a className="link" {...stopLink('palat')}>
            Mergi la începutul turului
          </a>
        </p>
      </div>
    </footer>
  )
}
