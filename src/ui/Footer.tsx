import { stopLink } from './links'
import { HISTORY_URL, tourUrl } from './pages'

export function Footer({ page = 'tur' }: { page?: 'tur' | 'istorie' }) {
  if (page === 'istorie') {
    return (
      <footer className="footer">
        <div className="wrap footer__row">
          <p className="footer__brand">Palace of the Parliament, 3D tour</p>
          <p>
            The text of this page was written for this site, from the Romanian-language Wikipedia articles listed
            above. The engraving and the old photograph are in the public domain, from Wikimedia Commons. The model
            is schematic, and its step-by-step rise does not reproduce the real order of the works.
          </p>
          <p>
            Typefaces: Cinzel, EB Garamond and IBM Plex, under the SIL Open Font Licence.{' '}
            <a className="link" href={tourUrl()}>
              Go to the 3D tour
            </a>
          </p>
        </div>
      </footer>
    )
  }

  return (
    <footer className="footer">
      <div className="wrap footer__row">
        <p className="footer__brand">Palace of the Parliament, 3D tour</p>
        <p>
          The model is schematic: the building’s proportions and the positions of the halls are approximate.
          The test videos will be replaced with real ones. The real 360° views are Google Street View
          panoramas, shown through Google’s embed; they are not copied into this site.
        </p>
        <p>
          City model (buildings, trees, paths, parks, water): map data ©{' '}
          <a className="link" href="https://www.openstreetmap.org/copyright">
            OpenStreetMap contributors
          </a>
          , under the ODbL. Heights missing from the data are estimated, all trees share one shape, and the
          National Cathedral is a schematic volume.
        </p>
        <p>
          The figures about the building come from the Romanian Wikipedia article{' '}
          <a className="link" href="https://ro.wikipedia.org/wiki/Palatul_Parlamentului">
            “Palatul Parlamentului”
          </a>
          , read in November 2026; where the article gives two values, we used the one in the introduction.{' '}
          Typefaces: Cinzel, EB Garamond and IBM Plex, under the SIL Open Font Licence.{' '}
          <a className="link" href={HISTORY_URL}>
            History of the palace
          </a>
          {' · '}
          <a className="link" {...stopLink('oras')}>
            Back to the start of the tour
          </a>
        </p>
      </div>
    </footer>
  )
}
