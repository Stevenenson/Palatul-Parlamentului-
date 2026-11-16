/**
 * The chapters of the history page. The text is written for this site, from the Romanian-language Wikipedia
 * articles listed in `HISTORY_SOURCES`; every figure can be found there.
 *
 * Each chapter has a state of the 3D model, in `src/history/stage/states.ts`, at the same index.
 */

export type HistoryPhoto = {
  kind: 'photo'
  src: string
  alt: string
  /** The caption under the image: what it shows and when it was made. */
  caption: string
  author: string
  year: string
  license: string
  /** The file's page on Wikimedia Commons, with the licence. */
  source: string
  /** What we changed in the image, if anything. */
  edit?: string
  /** The image's aspect ratio, so its space is reserved before it loads. */
  ratio: number
}

export type HistoryDrawing = { kind: 'drawing'; id: 'mihai-voda' }

export type HistoryFigure = HistoryPhoto | HistoryDrawing

/** A paragraph, optionally followed by an image. */
export type HistoryBlock = { text: string; figure?: HistoryFigure }

export type HistoryChapter = {
  id: string
  /** The chapter's large mark: a year or a figure. */
  mark: string
  /** The span of years, for the thread and the contents. */
  years: string
  title: string
  blocks: HistoryBlock[]
  /** Figures to highlight, as on a drawing sheet. */
  facts?: { value: string; label: string }[]
}

const COMMONS = 'https://commons.wikimedia.org/wiki/File:'

export const HISTORY_CHAPTERS: HistoryChapter[] = [
  {
    id: 'capitol-dealul',
    mark: '1594',
    years: '1594–1977',
    title: 'The hill before',
    blocks: [
      {
        text:
          'The palace stands on Arsenal Hill (Dealul Arsenalului), a rise south of the old centre. Until 1848 it was ' +
          'called Spirii Hill; today’s name comes from the Army Arsenal built here in 1860, when the chapel on the ' +
          'hill was turned into the “Army Powder Works”.',
        figure: {
          kind: 'photo',
          src: 'media/history/curtea-arsa-1841.jpg',
          alt: 'Engraving: the city seen from the hill, with a monastery and bell tower on the left, a covered wagon and people by a fire.',
          caption: 'Bucharest seen from the hill, in 1841. On Wikimedia Commons the engraving is titled “Curtea Arsă, Dealul Arsenalului”.',
          author: 'Eugène Cicéri, after Michel Bouquet',
          year: '1841',
          license: 'public domain',
          source: `${COMMONS}Curtea_Arsa,_Dealul_Arsenalului,_1841,_Ciceri-Bouquet.jpg`,
          ratio: 2704 / 844,
        },
      },
      {
        text:
          'The hill has been inhabited for a very long time: archaeologists found Neolithic traces here and the ' +
          'remains of a Dacian dwelling from the second Iron Age, with its hearth in the middle.',
      },
      {
        text:
          'On a spur of the hill called Mihai Vodă Hill, where Izvor Park is today, stood the monastery built in 1594 ' +
          'by Michael the Brave, then ban of Oltenia. The church’s frontispiece reads: “In 1594 this church was ' +
          'built”. Documents from 1696 say that a small 15th-century church, probably of wood, built by Vlad Dracul, ' +
          'had stood on the same spot before.',
        figure: {
          kind: 'photo',
          src: 'media/history/mihai-voda-1901.jpg',
          alt: 'Old photograph: the church of the Mihai Vodă Monastery, with its tower, on top of the hill.',
          caption: 'The church of the Mihai Vodă Monastery, in the early 20th century.',
          author: 'Alexandru Antoniu',
          year: '1901–1904',
          license: 'public domain',
          source: `${COMMONS}Antoniu_-_L%27Eglise_Michaiu_Voda.jpg`,
          edit: 'cropped: without the black bands at the edges',
          ratio: 526 / 600,
        },
      },
      {
        text:
          'The site had been chosen for a state building before: in 1935 King Carol II planned the new seat of the ' +
          'Chamber of Deputies here. Demolitions were announced in 1938, and the war stopped the works.',
      },
    ],
  },
  {
    id: 'capitol-concursul',
    mark: '1977',
    years: '1977–1982',
    title: 'The earthquake and the competition',
    blocks: [
      {
        text:
          'After the earthquake of 4 March 1977, Nicolae Ceaușescu used the rebuilding of the city as a pretext to ' +
          'rebuild the centre of Bucharest to his own plan. The “Bucharest Project”, started in 1978, took Pyongyang ' +
          'as its model.',
      },
      {
        text:
          'In 1978–1979 a national competition for rebuilding Bucharest began; it lasted almost four years. It was ' +
          'won by Anca Petrescu, an architect only 28 years old, who was then made chief architect of the project. ' +
          '700 architects worked under her coordination.',
      },
      {
        text:
          'The palace, then called the House of the Republic, was only one part of the project. The project also ' +
          'included other buildings, among them the Ministry of National Defence and Casa Radio.',
      },
    ],
  },
  {
    id: 'capitol-temelia',
    mark: '1984',
    years: '1984',
    title: 'The foundation stone',
    blocks: [
      {
        text:
          'The foundation stone was laid on 25 June 1984. The hill, 18 metres high, was reshaped: the side facing ' +
          'today’s Libertății Boulevard was raised artificially.',
      },
      {
        text:
          'The building site proper began with the demolition of a large part of the old centre. In those years the ' +
          'building was called the House of the Republic or the People’s House.',
      },
    ],
  },
  {
    id: 'capitol-demolarile',
    mark: '1985',
    years: '1984–1989',
    title: 'The demolitions',
    blocks: [
      {
        text:
          'For the palace and the new civic centre, over 7 km² of the old city were demolished and over 40,000 people ' +
          'were moved. Among the buildings torn down in those years were the Văcărești Monastery, the Brâncovenesc ' +
          'Hospital, the National Archives and the Republic Stadium.',
      },
      {
        text:
          'Between 1977 and 1989, 20 churches were demolished and another 8 were moved. The White Church – Postăvari, ' +
          'built in 1564 and part of the Mihai Vodă Monastery ensemble, was demolished in 1984. In January 1985 the ' +
          'Mihai Vodă Monastery was proposed for demolition; its annexes and wall were torn down, and protests by ' +
          'intellectuals saved the church and the bell tower.',
      },
      {
        text:
          'In 1985 the church was moved in one piece: 289 metres east and 6.2 metres lower, to Sapienței Street. The ' +
          'work was led by the engineer Eugeniu Iordăchescu.',
        figure: { kind: 'drawing', id: 'mihai-voda' },
      },
    ],
  },
  {
    id: 'capitol-santierul',
    mark: '20,000',
    years: 'the 1980s',
    title: 'The building site',
    blocks: [
      {
        text:
          '20,000 workers, 5,000 conscript soldiers and many so-called “volunteers” worked on the site, in three ' +
          'shifts, for seven years. How many died there remained an avoided subject; estimates speak of hundreds of deaths.',
      },
      {
        text:
          'The halls show where the materials came from. In the Gallery of Honour the floor combines white marble ' +
          'from Rușchița, beige marble from Căprioara and red and black marble from Moneasa. In the Nicolae Bălcescu ' +
          'Hall the columns are pink Rușchița marble, the chandeliers were made in Mediaș and the silk drapes were ' +
          'woven in Sighișoara.',
      },
      {
        text:
          'The exact cost is not known. In 1989 it was estimated at 1.75 billion dollars, and in 2006 at 3 billion ' +
          'euros. ArchDaily ranked the palace second among the most expensive architecture projects ever built.',
      },
    ],
    facts: [
      { value: '3,500 t', label: 'of crystal' },
      { value: '7,000 t', label: 'of steel' },
      { value: '220,000 m²', label: 'of carpets' },
      { value: '15,000', label: 'chandeliers' },
    ],
  },
  {
    id: 'capitol-revolutia',
    mark: '1989',
    years: '1989–1997',
    title: 'After the revolution',
    blocks: [
      {
        text:
          'When the regime fell, in December 1989, the palace was still a building site. Nicolae and Elena Ceaușescu ' +
          'were executed on 25 December 1989.',
      },
      {
        text:
          'Since 1994 the Chamber of Deputies has worked here, after its old seat, the Palace of the Chamber of ' +
          'Deputies, was given by the state to the Romanian Orthodox Church. The Union Hall was inaugurated on ' +
          '22 December 1994, five years after the revolution. The names of the halls were also chosen after 1989: ' +
          'they recall events from Romanian history and well-known figures.',
      },
      {
        text:
          'Since 1995 the building has also housed the seat of the Southeast European Cooperative Initiative. The ' +
          'building is considered finished in 1997, although parts of the west and east wings were left unfinished.',
      },
    ],
  },
  {
    id: 'capitol-cifrele',
    mark: '270 × 240',
    years: 'the figures',
    title: 'How big it is',
    blocks: [
      {
        text:
          'In 2012 the World Record Academy named it the largest civilian administrative building, the most ' +
          'expensive administrative building and the heaviest building in the world; since 2021 the parliament ' +
          'building in Bangkok is larger, and the Pentagon exceeds both. The palace’s volume is 2% greater than that ' +
          'of the Pyramid of Cheops.',
      },
      {
        text:
          'It has about 1,000 rooms: 440 offices, over 30 halls and salons, four restaurants, three libraries, two ' +
          'underground car parks and a concert hall. According to the same article, about 70% of the building is ' +
          'not used.',
      },
    ],
    facts: [
      { value: '270 × 240 m', label: 'footprint' },
      { value: '84 m', label: 'above ground' },
      { value: '92 m', label: 'below ground' },
      { value: '9 + 9', label: 'levels, above and below' },
      { value: '66,000 m²', label: 'built on the ground' },
      { value: '330,000 m²', label: 'total floor area' },
      { value: '2,550,000 m³', label: 'volume' },
    ],
  },
  {
    id: 'capitol-compozitia',
    mark: 'axis',
    years: 'composition',
    title: 'An axis and a symmetry',
    blocks: [
      {
        text:
          'The palace was conceived as part of an ensemble. The plan for rebuilding Bucharest also included the ' +
          'Ministry of National Defence, Casa Radio, the guest house that is today the Marriott Hotel, the Romanian ' +
          'Academy building (Casa Academiei), Izvor Park and a new boulevard, Victoria Socialismului, today Unirii ' +
          'Boulevard.',
      },
      {
        text:
          'The boulevard leads straight to the main facade. On the model, the red line is its axis: the volumes to ' +
          'its left and right are the same, mirrored, and rise in steps towards the central tower.',
      },
      {
        text:
          'The axis is older than the palace. The demolitions announced in 1938, for the seat of the Chamber of ' +
          'Deputies, were meant to open exactly this axis towards the hill.',
      },
    ],
  },
  {
    id: 'capitol-fatada',
    mark: '3',
    years: 'the facade',
    title: 'The facade, in three registers',
    blocks: [
      {
        text:
          'According to the Wikipedia article, the palace was built in the spirit of socialist realist architecture, ' +
          'which the regime wanted for the capital rebuilt after the earthquake.',
      },
      {
        text:
          'Vertically, three registers can be told apart, and they also match different functional zones. On the ' +
          'model we marked them as three steps: the base, the set-back middle register and the central tower. This ' +
          'division is ours, made from photographs.',
      },
      {
        text:
          'The facade repeats the same bay along its whole length: rectangular windows below, then arched windows, ' +
          'between pilasters. On the axis, the official entrance has a portico with columns. Here too the model is ' +
          'schematic: it shows the rhythm of the facade, not its detail.',
      },
    ],
  },
  {
    id: 'capitol-materialele',
    mark: '1,000,000',
    years: 'materials',
    title: 'Marble, wood, glass',
    blocks: [
      {
        text:
          'The article’s list of materials starts with marble: one million cubic metres. Then come 900,000 m³ of ' +
          'wood and 200,000 m³ of glass. Crystal, steel, carpets and chandeliers are in the chapter on the building ' +
          'site.',
      },
      {
        text:
          'The building has nine levels above ground and as many below, where it goes down 92 m. Here the model is ' +
          'cut through the middle register, like a sectional model. The cut shows the volumes, not the rooms.',
      },
    ],
    facts: [
      { value: '1,000,000 m³', label: 'of marble' },
      { value: '900,000 m³', label: 'of wood' },
      { value: '200,000 m³', label: 'of glass' },
      { value: '2,000,000 t', label: 'of sand' },
      { value: '1,000 t', label: 'of basalt' },
    ],
  },
  {
    id: 'capitol-azi',
    mark: 'today',
    years: 'today',
    title: 'The palace today',
    blocks: [
      {
        text:
          'Since 2004 the Senate has also worked in the palace; until then it sat in the former building of the ' +
          'Central Committee of the Romanian Communist Party. Also in 2004 the National Museum of Contemporary Art ' +
          'opened in the west wing, with a glass annex built for it.',
      },
      {
        text:
          'Of the old hill, a mound enclosed in the palace courtyard remains. At its edge, on the site of the former ' +
          'Republic Stadium, is today the Parliament’s car park.',
      },
      {
        text:
          'Behind the palace, also on Arsenal Hill, rose the People’s Salvation Cathedral, also called the National ' +
          'Cathedral. The foundation stone was laid in February 2011, and the consecration took place on ' +
          '26 October 2025. The cross of the tallest tower stands about 130 m above the ground, higher than the ' +
          'palace’s tower.',
      },
      {
        text:
          'The building hosts events, exhibitions and meetings and is open to visitors, with tours in several ' +
          'languages.',
      },
    ],
  },
]

/** The titles are the Romanian Wikipedia article names. */
export const HISTORY_SOURCES = [
  {
    title: '“Palatul Parlamentului”',
    url: 'https://ro.wikipedia.org/wiki/Palatul_Parlamentului',
    edited: '29 May 2026',
  },
  {
    title: '“Mănăstirea Mihai Vodă”',
    url: 'https://ro.wikipedia.org/wiki/M%C4%83n%C4%83stirea_Mihai_Vod%C4%83',
    edited: '1 November 2026',
  },
  {
    title: '“Dealul Arsenalului”',
    url: 'https://ro.wikipedia.org/wiki/Dealul_Arsenalului',
    edited: '1 July 2026',
  },
  {
    title: '“Catedrala Mântuirii Neamului”',
    url: 'https://ro.wikipedia.org/wiki/Catedrala_M%C3%A2ntuirii_Neamului',
    edited: '30 October 2026',
  },
  {
    title: '“Parcul Izvor”',
    url: 'https://ro.wikipedia.org/wiki/Parcul_Izvor',
    edited: '15 October 2025',
  },
]

/** Where the sources give different values, what we chose. */
export const HISTORY_NOTES = [
  'Start of works: the article also gives the year 1983; we used the date of the foundation stone, 25 June 1984.',
  'Width: 240 m in the introduction, 245 m in the section on dimensions; we used 240 m.',
  'Height: 84 m in the introduction, 86 m in the section on dimensions; we used 84 m, as in the tour.',
]

export const HISTORY_PHOTOS = HISTORY_CHAPTERS.flatMap((chapter) =>
  chapter.blocks.flatMap((block) => (block.figure?.kind === 'photo' ? [block.figure] : [])),
)
