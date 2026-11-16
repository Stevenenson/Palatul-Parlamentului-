/**
 * Tot conținutul editabil al turului stă aici: sălile, textele, filmările și pozele.
 * Ca să înlocuiești o filmare de test, pune fișierul în `public/media/videos/`
 * și schimbă `media` în `{ kind: 'video', src: `${MEDIA}videos/nume.mp4` }`.
 *
 * Coordonatele sunt în metri. Fațada principală a palatului privește spre +Z,
 * iar pozițiile sălilor în clădire sunt aproximative (schematice).
 *
 * Cifrele despre săli vin din articolul „Palatul Parlamentului” de pe ro.wikipedia.org
 * (secțiunile „Galeria de Onoare și holul Intrării Oficiale”, „Sala Unirii”,
 * „Sala Drepturilor Omului” și „Sala A.I. Cuza”).
 */

import { artsView, type StreetView } from './streetView'

export type Vec3 = [number, number, number]

export type Media =
  | { kind: 'image'; src: string }
  /** `silent: true` pentru o filmare fără pistă audio: playerul nu-i mai arată butonul de sunet. */
  | { kind: 'video'; src: string; poster?: string; silent?: boolean }

export type Recording = {
  id: string
  /** Titlul afișat pe card. */
  title: string
  /** Cine vorbește: nume și vârstă, sau descrierea locului rezervat. */
  who: string
  /** Rezumatul filmării sau transcrierea scurtă. */
  text: string
  media: Media
  /** `true` cât timp e conținut de test, fără o persoană reală în spate. */
  demo: boolean
}

export type Photo = { src: string; alt: string }

export type RoomSpec = {
  /** Folosit și ca ancoră în pagină (`#sala-unirii`). */
  id: string
  name: string
  /** Un rând scurt sub titlu: ce are sala deosebit. */
  note: string
  text: string
  facts: { value: string; label: string }[]
  accent: string
  /** Centrul pardoselii, în sistemul palatului. */
  floor: Vec3
  /** Lățime (X) × înălțime (Y) × adâncime (Z). */
  size: Vec3
  style: 'gallery' | 'hall' | 'round' | 'plenary'
  /** Poziția camerei și punctul privit, relative la centrul pardoselii. */
  camera: { eye: Vec3; look: Vec3; fov: number }
  hologram: {
    kind: 'table' | 'wall'
    /** Baza hologramei, relativă la centrul pardoselii. */
    at: Vec3
    /** Rotație în jurul axei Y, astfel încât holograma să privească spre cameră. */
    yaw: number
    width: number
  }
  recordings: Recording[]
  photos: Photo[]
  /** Vederea reală 360° a sălii, din Google Street View. Fără ea, sala are doar macheta. */
  streetView?: StreetView
}

/** Folderul `public/media/`, cu tot cu subfolderul în care e publicat site-ul. */
const MEDIA = `${import.meta.env.BASE_URL}media/`

const TEST_IMAGE = `${MEDIA}placeholders/filmare-test.svg`

/** Generată cu `node scripts/make-test-video.mjs`; arată că și calea video funcționează. */
const TEST_VIDEO = `${MEDIA}videos/filmare-test.mp4`

function testRecordings(
  roomId: string,
  topics: [string, string, string],
  firstIsVideo = false,
): Recording[] {
  const slots = ['a pupil or a student', 'an adult', 'an older person']
  return topics.map((topic, i) => ({
    id: `${roomId}-test-${i + 1}`,
    title: `Test video ${i + 1}`,
    who: `Reserved for ${slots[i]}`,
    text: topic,
    media:
      firstIsVideo && i === 0
        ? { kind: 'video', src: TEST_VIDEO, silent: true }
        : { kind: 'image', src: TEST_IMAGE },
    demo: true,
  }))
}

export const ROOMS: RoomSpec[] = [
  {
    id: 'galeria-de-onoare',
    name: 'Gallery of Honour',
    note: 'The east side of the palace',
    text: 'A corridor 150 m long and 18 m wide, with 34 octagonal columns and 67 crystal chandeliers. The two monumental staircases up to the first floor start here.',
    facts: [
      { value: '150 m', label: 'length' },
      { value: '18 m', label: 'width' },
      { value: '34', label: 'octagonal columns' },
      { value: '67', label: 'crystal chandeliers' },
    ],
    accent: '#c8452b',
    floor: [0, 2, 100],
    size: [150, 11, 18],
    style: 'gallery',
    camera: { eye: [-11.5, 3.5, 1.3], look: [0, 3.2, 0], fov: 46 },
    hologram: { kind: 'table', at: [0, 0, 0], yaw: -Math.PI / 2, width: 5 },
    recordings: testRecordings('galeria', [
      'The first video goes here: what someone feels seeing the gallery for the first time.',
      'The second video goes here: how the gallery was built and from what materials.',
      'The third video goes here: what the gallery is used for today.',
    ]),
    photos: [],
    // De confirmat de utilizator că panorama e din Galeria de Onoare (coloane de marmură albă, covor roșu).
    streetView: artsView(
      'https://artsandculture.google.com/streetview/palatul-parlamentului-camera-deputa%C5%A3ilor-bucure%C5%9Fti-rom%C3%A2nia/zQEC7KIv69LFug?sv_lng=26.087973174509607&sv_lat=44.42811747889636&sv_h=183.2362377121136&sv_p=1.2913230928367625&sv_pid=14eTnatAqjBDRpLrMDlVdg&sv_z=0.3020190226523405',
    ),
  },
  {
    id: 'sala-unirii',
    name: 'Union Hall',
    note: 'With a direct exit to the park',
    text: 'Designed for grand receptions, the hall has an 18 × 54 m central nave under a glass ceiling. Today it mostly hosts fairs and exhibitions.',
    facts: [
      { value: '18 × 54 m', label: 'central nave' },
      { value: '15 m', label: 'average height of the nave' },
      { value: '1,100 m²', label: 'the carpet, about 3 tonnes' },
    ],
    accent: '#1f5fbf',
    floor: [0, 6, 20],
    size: [54, 15, 30],
    style: 'hall',
    camera: { eye: [4, 4.8, 0], look: [-26, 5.8, 0], fov: 46 },
    hologram: { kind: 'wall', at: [-26.92, 2, 0], yaw: Math.PI / 2, width: 16 },
    recordings: testRecordings('unirii', [
      'The first video goes here: a view on the size of the hall.',
      'The second video goes here: the story of the carpet and the glass ceiling.',
      'The third video goes here: what events take place here.',
    ], true),
    photos: [],
  },
  {
    id: 'sala-drepturilor-omului',
    name: 'Human Rights Hall',
    note: 'Panelled entirely in oak',
    text: 'In the middle stands a round oak table with 60 chairs. Above it hangs a chandelier of Mediaș crystal weighing about 2 tonnes, the second largest in the building.',
    facts: [
      { value: '625 m²', label: 'floor area' },
      { value: '60', label: 'chairs at the round table' },
      { value: '2 t', label: 'the chandelier, roughly' },
    ],
    accent: '#0f8a74',
    floor: [-110, 12, 30],
    size: [25, 10, 25],
    style: 'round',
    camera: { eye: [0, 5.6, 11.7], look: [0, 1.9, 0], fov: 54 },
    hologram: { kind: 'table', at: [0, 0, 0], yaw: 0, width: 4.6 },
    recordings: testRecordings('drepturi', [
      'The first video goes here: a first impression of the round table.',
      'The second video goes here: who the hall was first designed for.',
      'The third video goes here: what meetings are held here now.',
    ]),
    photos: [],
    // De confirmat de utilizator că panorama e din Sala Drepturilor Omului (sală lambrisată în stejar).
    streetView: artsView(
      'https://artsandculture.google.com/streetview/palatul-parlamentului-camera-deputa%C5%A3ilor-bucure%C5%9Fti-rom%C3%A2nia/zQEC7KIv69LFug?sv_lng=26.088336328231183&sv_lat=44.42816184643911&sv_h=248.49521466771355&sv_p=-1.6791443112335287&sv_pid=hIaGuTOuL8428i_hbIqn6w&sv_z=0.3020190226523405',
    ),
  },
  {
    id: 'sala-alexandru-ioan-cuza',
    name: 'Alexandru Ioan Cuza Hall',
    note: 'First floor, on the palace axis',
    text: 'The tallest hall in the palace and the second largest by area. A wide loggia opens it towards Constitution Square and Unirii Boulevard.',
    facts: [
      { value: '20 m', label: 'height, roughly' },
      { value: '2,040 m²', label: 'floor area' },
      { value: '7', label: 'skylights in the ceiling' },
    ],
    accent: '#b7791a',
    floor: [0, 28.2, 81],
    size: [60, 19.6, 34],
    style: 'plenary',
    camera: { eye: [-11, 4.4, -7.5], look: [29.4, 9.8, 2.5], fov: 60 },
    hologram: { kind: 'wall', at: [29.92, 2.6, 0], yaw: -Math.PI / 2, width: 21 },
    recordings: testRecordings('cuza', [
      'The first video goes here: how the city looks from the loggia.',
      'The second video goes here: the history of the hall and its orchestra balcony.',
      'The third video goes here: what happens in the hall during events.',
    ]),
    photos: [],
  },
]

/** Din introducerea aceluiași articol; unde articolul dă două valori, e folosită cea din introducere. */
export const PALACE_FACTS = [
  { value: '270 × 240 m', label: 'footprint' },
  { value: '84 m', label: 'height above ground' },
  { value: '25 June 1984', label: 'foundation stone' },
]
