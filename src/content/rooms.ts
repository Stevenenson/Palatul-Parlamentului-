/**
 * Tot conținutul editabil al turului stă aici: sălile, textele, filmările și pozele.
 * Ca să înlocuiești o filmare de test, pune fișierul în `public/media/videos/`
 * și schimbă `media` în `{ kind: 'video', src: '/media/videos/nume.mp4' }`.
 *
 * Coordonatele sunt în metri. Fațada principală a palatului privește spre +Z,
 * iar pozițiile sălilor în clădire sunt aproximative (schematice).
 *
 * Cifrele despre săli vin din articolul „Palatul Parlamentului” de pe ro.wikipedia.org
 * (secțiunile „Galeria de Onoare și holul Intrării Oficiale”, „Sala Unirii”,
 * „Sala Drepturilor Omului” și „Sala A.I. Cuza”).
 */

import { fromArtsLink, type StreetView } from './streetView'

export type Vec3 = [number, number, number]

export type Media =
  | { kind: 'image'; src: string }
  | { kind: 'video'; src: string; poster?: string }

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

const TEST_IMAGE = '/media/placeholders/filmare-test.svg'

/** Generată cu `node scripts/make-test-video.mjs`; arată că și calea video funcționează. */
const TEST_VIDEO = '/media/videos/filmare-test.mp4'

function testRecordings(
  roomId: string,
  topics: [string, string, string],
  firstIsVideo = false,
): Recording[] {
  const slots = ['un elev sau un student', 'un adult', 'o persoană în vârstă']
  return topics.map((topic, i) => ({
    id: `${roomId}-test-${i + 1}`,
    title: `Filmare de test ${i + 1}`,
    who: `Loc rezervat pentru ${slots[i]}`,
    text: topic,
    media: firstIsVideo && i === 0 ? { kind: 'video', src: TEST_VIDEO } : { kind: 'image', src: TEST_IMAGE },
    demo: true,
  }))
}

export const ROOMS: RoomSpec[] = [
  {
    id: 'galeria-de-onoare',
    name: 'Galeria de Onoare',
    note: 'Latura de est a palatului',
    text: 'Un culoar lung de 150 m și lat de 18 m, cu 34 de coloane octogonale și 67 de lustre de cristal. Aici se află cele două scări monumentale care urcă la etajul 1.',
    facts: [
      { value: '150 m', label: 'lungime' },
      { value: '18 m', label: 'lățime' },
      { value: '34', label: 'coloane octogonale' },
      { value: '67', label: 'lustre de cristal' },
    ],
    accent: '#c8452b',
    floor: [0, 2, 100],
    size: [150, 11, 18],
    style: 'gallery',
    camera: { eye: [-13, 3.4, 1.4], look: [0, 3.1, 0], fov: 46 },
    hologram: { kind: 'table', at: [0, 0, 0], yaw: -Math.PI / 2, width: 4.2 },
    recordings: testRecordings('galeria', [
      'Aici intră prima filmare: ce simte cineva care vede galeria pentru prima oară.',
      'Aici intră a doua filmare: cum a fost construită galeria și din ce materiale.',
      'Aici intră a treia filmare: la ce folosește galeria astăzi.',
    ]),
    photos: [],
    // De confirmat de utilizator că panorama e din Galeria de Onoare (coloane de marmură albă, covor roșu).
    streetView: fromArtsLink(
      'https://artsandculture.google.com/streetview/palatul-parlamentului-camera-deputa%C5%A3ilor-bucure%C5%9Fti-rom%C3%A2nia/zQEC7KIv69LFug?sv_lng=26.087973174509607&sv_lat=44.42811747889636&sv_h=183.2362377121136&sv_p=1.2913230928367625&sv_pid=14eTnatAqjBDRpLrMDlVdg&sv_z=0.3020190226523405',
    ),
  },
  {
    id: 'sala-unirii',
    name: 'Sala Unirii',
    note: 'Cu ieșire directă spre parc',
    text: 'Gândită pentru marile recepții, sala are o navă centrală de 18 × 54 m sub un tavan de sticlă. Astăzi găzduiește mai ales târguri și expoziții.',
    facts: [
      { value: '18 × 54 m', label: 'nava centrală' },
      { value: '15 m', label: 'înălțimea medie a navei' },
      { value: '1.100 m²', label: 'covorul, de circa 3 tone' },
    ],
    accent: '#1f5fbf',
    floor: [0, 6, 20],
    size: [54, 15, 30],
    style: 'hall',
    camera: { eye: [6, 4.6, 0], look: [-26, 5.4, 0], fov: 46 },
    hologram: { kind: 'wall', at: [-26.92, 2, 0], yaw: Math.PI / 2, width: 12 },
    recordings: testRecordings('unirii', [
      'Aici intră prima filmare: o părere despre dimensiunile sălii.',
      'Aici intră a doua filmare: povestea covorului și a tavanului de sticlă.',
      'Aici intră a treia filmare: ce evenimente au loc aici.',
    ], true),
    photos: [],
  },
  {
    id: 'sala-drepturilor-omului',
    name: 'Sala Drepturilor Omului',
    note: 'Lambrisată complet în stejar',
    text: 'În mijloc stă o masă rotundă din stejar cu 60 de scaune. Deasupra ei atârnă un candelabru din cristal de Mediaș de circa 2 tone, al doilea ca mărime din clădire.',
    facts: [
      { value: '625 m²', label: 'suprafață' },
      { value: '60', label: 'scaune la masa rotundă' },
      { value: '2 t', label: 'candelabrul, aproximativ' },
    ],
    accent: '#0f8a74',
    floor: [-110, 12, 30],
    size: [25, 10, 25],
    style: 'round',
    camera: { eye: [0, 5.6, 11.7], look: [0, 1.9, 0], fov: 54 },
    hologram: { kind: 'table', at: [0, 0, 0], yaw: 0, width: 3.8 },
    recordings: testRecordings('drepturi', [
      'Aici intră prima filmare: prima impresie despre masa rotundă.',
      'Aici intră a doua filmare: pentru cine a fost gândită sala la început.',
      'Aici intră a treia filmare: ce ședințe se țin aici acum.',
    ]),
    photos: [],
    // De confirmat de utilizator că panorama e din Sala Drepturilor Omului (sală lambrisată în stejar).
    streetView: fromArtsLink(
      'https://artsandculture.google.com/streetview/palatul-parlamentului-camera-deputa%C5%A3ilor-bucure%C5%9Fti-rom%C3%A2nia/zQEC7KIv69LFug?sv_lng=26.088336328231183&sv_lat=44.42816184643911&sv_h=248.49521466771355&sv_p=-1.6791443112335287&sv_pid=hIaGuTOuL8428i_hbIqn6w&sv_z=0.3020190226523405',
    ),
  },
  {
    id: 'sala-alexandru-ioan-cuza',
    name: 'Sala Alexandru Ioan Cuza',
    note: 'Etajul 1, în axul palatului',
    text: 'Sala cu cea mai mare înălțime din palat și a doua ca suprafață. Se deschide printr-o logie amplă spre Piața Constituției și Bulevardul Unirii.',
    facts: [
      { value: '20 m', label: 'înălțime, aproximativ' },
      { value: '2.040 m²', label: 'suprafață' },
      { value: '7', label: 'luminatoare în plafon' },
    ],
    accent: '#b7791a',
    floor: [0, 28.2, 81],
    size: [60, 19.6, 34],
    style: 'plenary',
    camera: { eye: [-11, 4.4, -7.5], look: [29.4, 9.8, 2.5], fov: 60 },
    hologram: { kind: 'wall', at: [29.92, 2.6, 0], yaw: -Math.PI / 2, width: 17 },
    recordings: testRecordings('cuza', [
      'Aici intră prima filmare: cum se vede orașul din logie.',
      'Aici intră a doua filmare: istoria sălii și a balconului pentru orchestră.',
      'Aici intră a treia filmare: ce se întâmplă în sală la evenimente.',
    ]),
    photos: [],
  },
]

/** Din introducerea aceluiași articol; unde articolul dă două valori, e folosită cea din introducere. */
export const PALACE_FACTS = [
  { value: '270 × 240 m', label: 'amprenta la sol' },
  { value: '84 m', label: 'înălțime deasupra solului' },
  { value: '25 iunie 1984', label: 'piatra de temelie' },
]
