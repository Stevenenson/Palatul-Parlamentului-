/**
 * Capitolele paginii de istorie. Textul e scris pentru acest site, după articolele de pe
 * Wikipedia în limba română listate în `HISTORY_SOURCES`; fiecare cifră se găsește acolo.
 *
 * Fiecare capitol are o stare a machetei 3D, în `src/history/stage/states.ts`, la același indice.
 */

export type HistoryPhoto = {
  kind: 'photo'
  src: string
  alt: string
  /** Ce scrie sub imagine: ce e și când a fost făcută. */
  caption: string
  author: string
  year: string
  license: string
  /** Pagina fișierului pe Wikimedia Commons, cu licența. */
  source: string
  /** Ce am schimbat la imagine, dacă am schimbat ceva. */
  edit?: string
  /** Proporția imaginii, ca locul ei să fie rezervat înainte să se încarce. */
  ratio: number
}

export type HistoryDrawing = { kind: 'drawing'; id: 'mihai-voda' }

export type HistoryFigure = HistoryPhoto | HistoryDrawing

/** Un paragraf, urmat opțional de o imagine. */
export type HistoryBlock = { text: string; figure?: HistoryFigure }

export type HistoryChapter = {
  id: string
  /** Semnul mare al capitolului: un an sau o cifră. */
  mark: string
  /** Intervalul de ani, pentru fir și cuprins. */
  years: string
  title: string
  blocks: HistoryBlock[]
  /** Cifre de pus în evidență, ca pe o planșă. */
  facts?: { value: string; label: string }[]
}

const COMMONS = 'https://commons.wikimedia.org/wiki/File:'

export const HISTORY_CHAPTERS: HistoryChapter[] = [
  {
    id: 'capitol-dealul',
    mark: '1594',
    years: '1594–1977',
    title: 'Dealul de dinainte',
    blocks: [
      {
        text:
          'Palatul stă pe Dealul Arsenalului, o colină din sudul centrului vechi, locuită încă din neolitic. ' +
          'Până în 1848 i se spunea Dealul Spirii; numele de azi vine de la Arsenalul Armatei, construit aici în 1860.',
        figure: {
          kind: 'photo',
          src: 'media/history/curtea-arsa-1841.jpg',
          alt: 'Gravură: orașul văzut de pe deal, cu o mănăstire cu clopotniță în stânga, o căruță cu coviltir și oameni lângă un foc.',
          caption: 'Bucureștiul văzut de pe deal, în 1841. Pe Wikimedia Commons, gravura apare ca „Curtea Arsă, Dealul Arsenalului”.',
          author: 'Eugène Cicéri, după Michel Bouquet',
          year: '1841',
          license: 'domeniu public',
          source: `${COMMONS}Curtea_Arsa,_Dealul_Arsenalului,_1841,_Ciceri-Bouquet.jpg`,
          ratio: 2704 / 844,
        },
      },
      {
        text:
          'Pe un pinten al dealului, numit Dealul Mihai Vodă, se afla mănăstirea ridicată în 1594 ' +
          'de Mihai Viteazul, pe când era ban al Olteniei.',
        figure: {
          kind: 'photo',
          src: 'media/history/mihai-voda-1901.jpg',
          alt: 'Fotografie veche: biserica Mănăstirii Mihai Vodă, cu turla ei, pe vârful dealului.',
          caption: 'Biserica Mănăstirii Mihai Vodă, la începutul secolului XX.',
          author: 'Alexandru Antoniu',
          year: '1901–1904',
          license: 'domeniu public',
          source: `${COMMONS}Antoniu_-_L%27Eglise_Michaiu_Voda.jpg`,
          edit: 'decupată: fără benzile negre de pe margini',
          ratio: 526 / 600,
        },
      },
      {
        text:
          'Locul fusese ales pentru o clădire a statului și mai devreme: în 1935, regele Carol al II-lea plănuia aici ' +
          'noul sediu al Camerei Deputaților. Demolările au fost anunțate în 1938, iar războiul a oprit lucrările.',
      },
    ],
  },
  {
    id: 'capitol-concursul',
    mark: '1977',
    years: '1977–1982',
    title: 'Cutremurul și concursul',
    blocks: [
      {
        text:
          'După cutremurul din 4 martie 1977, Nicolae Ceaușescu a folosit refacerea orașului ca pretext pentru a ' +
          'reconstrui centrul Bucureștiului după planul lui. „Proiectul București”, pornit în 1978, avea ca model Phenianul.',
      },
      {
        text:
          'Pentru reconstruirea Bucureștiului s-a ținut un concurs național, care a durat aproape patru ani. Pentru ' +
          'clădirea principală a fost aleasă Anca Petrescu, o arhitectă de numai 28 de ani, numită apoi arhitect-șef. ' +
          'Sub coordonarea ei au lucrat 700 de arhitecți.',
      },
    ],
  },
  {
    id: 'capitol-temelia',
    mark: '1984',
    years: '1984',
    title: 'Piatra de temelie',
    blocks: [
      {
        text:
          'Piatra de temelie a fost pusă pe 25 iunie 1984. Dealul, înalt de 18 metri, a fost remodelat: latura ' +
          'dinspre actualul Bulevard al Libertății a fost înălțată artificial.',
      },
      {
        text: 'În acei ani, clădirea se numea Casa Republicii sau Casa Poporului.',
      },
    ],
  },
  {
    id: 'capitol-demolarile',
    mark: '1985',
    years: '1984–1989',
    title: 'Demolările',
    blocks: [
      {
        text:
          'Pentru palat și pentru noul centru civic au fost demolați peste 7 km² din orașul vechi, iar peste ' +
          '40.000 de oameni au fost mutați. Printre clădirile dărâmate în acei ani au fost Mănăstirea Văcărești, ' +
          'Spitalul Brâncovenesc, Arhivele Naționale și Stadionul Republicii.',
      },
      {
        text:
          'Între 1977 și 1989 au fost demolate 20 de biserici, iar alte 8 au fost mutate. În ianuarie 1985, ' +
          'Mănăstirea Mihai Vodă a fost propusă pentru demolare; anexele și zidul au fost dărâmate, iar protestele ' +
          'intelectualilor au salvat biserica și clopotnița.',
      },
      {
        text:
          'În 1985, biserica a fost mutată întreagă: 289 de metri mai departe și 6,2 metri mai jos, până în strada ' +
          'Sapienței. Lucrarea a fost coordonată de inginerul Eugeniu Iordăchescu.',
        figure: { kind: 'drawing', id: 'mihai-voda' },
      },
    ],
  },
  {
    id: 'capitol-santierul',
    mark: '20.000',
    years: 'anii ’80',
    title: 'Șantierul',
    blocks: [
      {
        text:
          'Pe șantier au lucrat 20.000 de muncitori, 5.000 de soldați în termen și mulți așa-ziși „voluntari”, în ' +
          'trei schimburi, timp de șapte ani. Câți au murit acolo a rămas un subiect evitat; estimările vorbesc de sute de morți.',
      },
      {
        text:
          'Costul nu se cunoaște exact. În 1989 era estimat la 1,75 miliarde de dolari, iar în 2006 la 3 miliarde de euro.',
      },
    ],
    facts: [
      { value: '3.500 t', label: 'de cristal' },
      { value: '7.000 t', label: 'de oțel' },
      { value: '220.000 m²', label: 'de covoare' },
    ],
  },
  {
    id: 'capitol-revolutia',
    mark: '1989',
    years: '1989–1997',
    title: 'După revoluție',
    blocks: [
      {
        text:
          'Când regimul a căzut, în decembrie 1989, palatul era încă un șantier. Din 1994, aici lucrează Camera ' +
          'Deputaților, iar Sala Unirii a fost inaugurată pe 22 decembrie 1994, la cinci ani de la revoluție.',
      },
      {
        text:
          'Din 1995, clădirea găzduiește și sediul Inițiativei de Cooperare Sud-Est Europeană. Clădirea e socotită ' +
          'terminată în 1997, deși părți din aripile de vest și de est au rămas neterminate.',
      },
    ],
  },
  {
    id: 'capitol-cifrele',
    mark: '270 × 240',
    years: 'cifrele',
    title: 'Cât de mare e',
    blocks: [
      {
        text:
          'În 2012, World Record Academy l-a numit cea mai mare clădire administrativă civilă și cea mai grea ' +
          'clădire din lume; din 2021, clădirea parlamentului din Bangkok e mai mare, iar Pentagonul le întrece pe ' +
          'amândouă. Volumul palatului îl depășește cu 2% pe al piramidei lui Keops.',
      },
      {
        text:
          'Are aproximativ 1.000 de încăperi: 440 de birouri, peste 30 de săli, patru restaurante, trei ' +
          'biblioteci, două parcări subterane și o sală de concerte.',
      },
    ],
    facts: [
      { value: '270 × 240 m', label: 'amprenta la sol' },
      { value: '84 m', label: 'deasupra solului' },
      { value: '92 m', label: 'sub pământ' },
      { value: '9 + 9', label: 'niveluri, sus și jos' },
      { value: '330.000 m²', label: 'suprafață desfășurată' },
      { value: '2.550.000 m³', label: 'volum' },
    ],
  },
  {
    id: 'capitol-azi',
    mark: 'azi',
    years: 'azi',
    title: 'Palatul azi',
    blocks: [
      {
        text:
          'Din 2004, în palat lucrează și Senatul. Tot în 2004 s-a deschis, în aripa vestică, Muzeul Național de ' +
          'Artă Contemporană, cu o anexă de sticlă construită pentru el.',
      },
      {
        text:
          'Clădirea găzduiește evenimente, expoziții și întâlniri și e deschisă vizitatorilor, cu programe de vizitare ' +
          'în mai multe limbi.',
      },
    ],
  },
]

export const HISTORY_SOURCES = [
  {
    title: '„Palatul Parlamentului”',
    url: 'https://ro.wikipedia.org/wiki/Palatul_Parlamentului',
    edited: '29 mai 2026',
  },
  {
    title: '„Mănăstirea Mihai Vodă”',
    url: 'https://ro.wikipedia.org/wiki/M%C4%83n%C4%83stirea_Mihai_Vod%C4%83',
    edited: '1 noiembrie 2026',
  },
  {
    title: '„Dealul Arsenalului”',
    url: 'https://ro.wikipedia.org/wiki/Dealul_Arsenalului',
    edited: '1 iulie 2026',
  },
]

/** Unde sursele dau valori diferite, ce am ales. */
export const HISTORY_NOTES = [
  'Începutul lucrărilor: articolul dă și anul 1983; am folosit data pietrei de temelie, 25 iunie 1984.',
  'Lățimea: 240 m în introducere, 245 m în secțiunea despre dimensiuni; am folosit 240 m.',
  'Înălțimea: 84 m în introducere, 86 m în secțiunea despre dimensiuni; am folosit 84 m, ca în tur.',
]

export const HISTORY_PHOTOS = HISTORY_CHAPTERS.flatMap((chapter) =>
  chapter.blocks.flatMap((block) => (block.figure?.kind === 'photo' ? [block.figure] : [])),
)
