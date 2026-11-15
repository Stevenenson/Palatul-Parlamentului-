import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import {
  HISTORY_CHAPTERS as CHAPTERS,
  HISTORY_NOTES,
  HISTORY_PHOTOS,
  HISTORY_SOURCES,
  type HistoryFigure,
} from '../content/history'
import { toRoman } from '../content/roman'
import { Footer } from '../ui/Footer'
import { Meander } from '../ui/Meander'
import { tourUrl } from '../ui/pages'
import { SceneBoundary } from '../ui/SceneBoundary'
import { TopBar } from '../ui/TopBar'
import { hasWebGL } from '../ui/webgl'
import { MihaiVodaDrawing } from './drawings/MihaiVoda'
import { onReading, readingLine, trackReading } from './progress'

// Macheta se încarcă după text, ca pagina să se poată citi imediat.
const Stage = lazy(() => import('./stage/HistoryStage'))

const WEBGL = hasWebGL()
const BASE = import.meta.env.BASE_URL

type SceneState = 'loading' | 'ready' | 'failed'

function Figure({ figure }: { figure: HistoryFigure }) {
  if (figure.kind === 'drawing') {
    return (
      <figure className="figure figure--drawing" data-draw>
        <MihaiVodaDrawing />
        <figcaption>Mutarea bisericii, în 1985. Desen schematic, fără scară.</figcaption>
      </figure>
    )
  }
  return (
    <figure className="figure figure--photo">
      <div className="figure__frame" style={{ aspectRatio: String(figure.ratio) }}>
        <img src={`${BASE}${figure.src}`} alt={figure.alt} loading="lazy" decoding="async" />
        <span className="figure__year" aria-hidden="true">
          {figure.year}
        </span>
      </div>
      <figcaption>
        {figure.caption}{' '}
        <a className="link" href={figure.source}>
          Sursa
        </a>
      </figcaption>
    </figure>
  )
}

export function HistoryPage() {
  const [chapter, setChapter] = useState(0)
  const [scene, setScene] = useState<SceneState>(WEBGL ? 'loading' : 'failed')
  const intro = useRef<HTMLElement>(null)
  const chapters = useRef<(HTMLElement | null)[]>([])
  const thread = useRef<HTMLOListElement>(null)

  useEffect(() => {
    const parts = [intro.current, ...chapters.current].filter((el): el is HTMLElement => Boolean(el))
    return trackReading(parts)
  }, [])

  // Capitolul curent (pentru fir și cuprins) și cât din fir e umplut.
  useEffect(
    () =>
      onReading((t) => {
        setChapter(Math.floor(t + 1e-3))
        const el = thread.current
        if (!el) return
        const top = el.getBoundingClientRect().top + window.scrollY
        const fill = Math.max(0, Math.min(el.offsetHeight, readingLine() - top))
        el.style.setProperty('--fill', `${Math.round(fill)}px`)
      }),
    [],
  )

  // Desenele se trasează o singură dată, când ajung în ecran.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.classList.add('is-drawn')
          observer.unobserve(entry.target)
        }
      },
      { rootMargin: '0px 0px -20% 0px' },
    )
    document.querySelectorAll('[data-draw]').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <a className="skip" href="#continut">
        Sari la conținut
      </a>
      <TopBar page="istorie" />
      <main id="continut" className="history" data-chapter={chapter} data-scene={scene}>
        <div className="history__stage" aria-hidden="true">
          {WEBGL && (
            <SceneBoundary onError={() => setScene('failed')}>
              <Suspense fallback={null}>
                <Stage onReady={() => setScene('ready')} />
              </Suspense>
            </SceneBoundary>
          )}
          {scene === 'loading' && (
            <p className="stage__status">
              <Meander units={5} draw />
              Se încarcă macheta
            </p>
          )}
        </div>

        <div className="history__text">
          <header className="history__intro" ref={intro}>
            <p className="overline">Istorie · 1594 – azi</p>
            <h1 id="titlu">Povestea palatului</h1>
            <Meander units={9} />
            <p className="lead">
              De la o mănăstire pe un deal la una dintre cele mai mari clădiri din lume. Macheta urmează
              povestea pe măsură ce citești.
            </p>
            <nav className="toc" aria-label="Capitole">
              <ol>
                {CHAPTERS.map((c, i) => (
                  <li key={c.id}>
                    <a href={`#${c.id}`} aria-current={chapter === i + 1 ? 'step' : undefined}>
                      <span className="toc__num" aria-hidden="true">
                        {toRoman(i + 1)}
                      </span>
                      <span className="toc__title">{c.title}</span>
                      {/\d/.test(c.years) && <span className="toc__years">{c.years}</span>}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </header>

          <ol className="thread" ref={thread}>
            {CHAPTERS.map((c, i) => {
              const index = i + 1
              const state = index < chapter ? 'past' : index === chapter ? 'current' : 'future'
              return (
                <li key={c.id}>
                  <section
                    id={c.id}
                    className="chapter"
                    data-state={state}
                    aria-labelledby={`${c.id}-titlu`}
                    ref={(el) => {
                      chapters.current[i] = el
                    }}
                  >
                    {/* Nodul firului duce la începutul capitolului; din tastatură, același drum e în cuprins. */}
                    <a className="chapter__node" href={`#${c.id}`} aria-hidden="true" tabIndex={-1} />
                    <p className="overline">
                      <span aria-hidden="true">Capitolul {toRoman(index)}</span>
                      <span className="sr-only">Capitolul {index}</span> · {c.years}
                    </p>
                    <p className="chapter__mark" aria-hidden="true">
                      {c.mark}
                    </p>
                    <h2 id={`${c.id}-titlu`}>{c.title}</h2>
                    {c.blocks.map((block, j) => (
                      <div className="chapter__block" key={j}>
                        <p>{block.text}</p>
                        {block.figure && <Figure figure={block.figure} />}
                      </div>
                    ))}
                    {c.facts && (
                      <dl className="facts chapter__facts">
                        {c.facts.map((fact) => (
                          <div key={fact.label} className="fact">
                            <dt>{fact.label}</dt>
                            <dd>{fact.value}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                    {index === CHAPTERS.length && (
                      <div className="actions chapter__actions">
                        <a className="btn btn--primary" href={tourUrl()}>
                          Intră în tur
                        </a>
                        <a className="link" href={tourUrl('harta')}>
                          Harta sălilor
                        </a>
                      </div>
                    )}
                  </section>
                </li>
              )
            })}
          </ol>

          <section className="sources" aria-labelledby="surse">
            <h2 id="surse">Surse și imagini</h2>
            <p>Textul e scris după aceste articole de pe Wikipedia în limba română, citite în noiembrie 2026:</p>
            <ul>
              {HISTORY_SOURCES.map((source) => (
                <li key={source.url}>
                  <a className="link" href={source.url}>
                    {source.title}
                  </a>
                  , ultima modificare pe {source.edited}
                </li>
              ))}
            </ul>
            <p>Unde sursele dau valori diferite:</p>
            <ul>
              {HISTORY_NOTES.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
            <p>Imagini:</p>
            <ul>
              {HISTORY_PHOTOS.map((photo) => (
                <li key={photo.src}>
                  {photo.author}, {photo.year}, {photo.license}
                  {photo.edit ? `; ${photo.edit}` : ''}.{' '}
                  <a className="link" href={photo.source}>
                    Pagina imaginii pe Wikimedia Commons
                  </a>
                </li>
              ))}
              <li>Macheta 3D și desenul mutării bisericii sunt făcute pentru acest site.</li>
            </ul>
          </section>
        </div>
      </main>
      <Footer page="istorie" />
    </>
  )
}
