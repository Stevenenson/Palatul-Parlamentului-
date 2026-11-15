import { stopLink } from './links'
import { HISTORY_URL, tourUrl } from './pages'

export function Footer({ page = 'tur' }: { page?: 'tur' | 'istorie' }) {
  if (page === 'istorie') {
    return (
      <footer className="footer">
        <div className="wrap footer__row">
          <p className="footer__brand">Palatul Parlamentului, tur 3D</p>
          <p>
            Textul paginii e scris pentru acest site, după articolele de pe Wikipedia în limba română listate mai
            sus. Gravura și fotografia veche sunt în domeniul public, de pe Wikimedia Commons. Macheta este
            schematică, iar ridicarea ei pe etape nu reproduce ordinea reală a lucrărilor.
          </p>
          <p>
            Litere: Cinzel, EB Garamond și IBM Plex, sub licența SIL Open Font.{' '}
            <a className="link" href={tourUrl()}>
              Mergi la turul 3D
            </a>
          </p>
        </div>
      </footer>
    )
  }

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
          Litere: Cinzel, EB Garamond și IBM Plex, sub licența SIL Open Font.{' '}
          <a className="link" href={HISTORY_URL}>
            Istoria palatului
          </a>
          {' · '}
          <a className="link" {...stopLink('palat')}>
            Mergi la începutul turului
          </a>
        </p>
      </div>
    </footer>
  )
}
