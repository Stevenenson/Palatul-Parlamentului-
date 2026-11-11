/**
 * Tot conținutul editabil al turului stă aici: sălile, textele, filmările și pozele.
 * Ca să înlocuiești o filmare de test, pune fișierul în `public/media/videos/`
 * și schimbă `media` în `{ kind: 'video', src: '/media/videos/nume.mp4' }`.
 *
 * Coordonatele sunt în metri. Fațada principală a palatului privește spre +Z,
 * iar pozițiile sălilor în clădire sunt aproximative (schematice).
 */

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
  place: string
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
}

const TEST_IMAGE = '/media/placeholders/filmare-test.svg'

function testRecordings(roomId: string, topics: [string, string, string]): Recording[] {
  const slots = ['un elev sau un student', 'un adult', 'un senior']
  return topics.map((topic, i) => ({
    id: `${roomId}-test-${i + 1}`,
    title: `Filmare de test ${i + 1}`,
    who: `Loc rezervat pentru ${slots[i]}`,
    text: topic,
    media: { kind: 'image', src: TEST_IMAGE },
    demo: true,
  }))
}

export const ROOMS: RoomSpec[] = [
  {
    id: 'galeria-de-onoare',
    name: 'Galeria de Onoare',
    place: 'Latura de est, spre Piața Constituției',
    text: 'Un culoar lung de 150 m și lat de 18 m, cu 34 de coloane octogonale și 67 de candelabre de cristal. De aici pornesc cele două scări monumentale.',
    facts: [
      { value: '150 m', label: 'lungime' },
      { value: '18 m', label: 'lățime' },
      { value: '34', label: 'coloane octogonale' },
      { value: '67', label: 'candelabre de cristal' },
    ],
    accent: '#c8452b',
    floor: [0, 8, 99],
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
  },
  {
    id: 'sala-unirii',
    name: 'Sala Unirii',
    place: 'Zona centrală a palatului',
    text: 'Una dintre cele mai mari săli ale clădirii, luminată de sus printr-un tavan de sticlă. Aici se țin recepții și evenimente oficiale.',
    facts: [
      { value: '16 m', label: 'înălțime aproximativă' },
      { value: '1.100 m²', label: 'covorul sălii' },
    ],
    accent: '#1f5fbf',
    floor: [0, 22, 30],
    size: [54, 16, 42],
    style: 'hall',
    camera: { eye: [0, 4.6, 3], look: [0, 5.4, -20], fov: 46 },
    hologram: { kind: 'wall', at: [0, 2, -20.4], yaw: 0, width: 12 },
    recordings: testRecordings('unirii', [
      'Aici intră prima filmare: o părere despre dimensiunile sălii.',
      'Aici intră a doua filmare: povestea covorului și a tavanului de sticlă.',
      'Aici intră a treia filmare: ce evenimente au loc aici.',
    ]),
    photos: [],
  },
  {
    id: 'sala-drepturilor-omului',
    name: 'Sala Drepturilor Omului',
    place: 'Sală de 625 m², lambrisată în stejar',
    text: 'În mijloc stă o masă rotundă din stejar cu 60 de scaune. Deasupra ei atârnă un candelabru de cristal de Mediaș de aproximativ 2 tone, al doilea ca mărime din clădire.',
    facts: [
      { value: '625 m²', label: 'suprafață' },
      { value: '60', label: 'scaune la masa rotundă' },
      { value: '2 t', label: 'candelabrul, aproximativ' },
    ],
    accent: '#0f8a74',
    floor: [-82, 22, 34],
    size: [25, 10, 25],
    style: 'round',
    camera: { eye: [0, 4.4, 11.2], look: [0, 2.7, 0], fov: 50 },
    hologram: { kind: 'table', at: [0, 0, 0], yaw: 0, width: 3.8 },
    recordings: testRecordings('drepturi', [
      'Aici intră prima filmare: prima impresie despre masa rotundă.',
      'Aici intră a doua filmare: pentru cine a fost gândită sala la început.',
      'Aici intră a treia filmare: ce ședințe se țin aici acum.',
    ]),
    photos: [],
  },
  {
    id: 'sala-alexandru-ioan-cuza',
    name: 'Sala Alexandru Ioan Cuza',
    place: 'Etajul 1, spre Piața Constituției',
    text: 'Cea mai înaltă dintre sălile din tur, la etajul 1. Din loggia ei se văd Piața Constituției și Bulevardul Unirii.',
    facts: [
      { value: '20 m', label: 'înălțime aproximativă' },
      { value: '2.040 m²', label: 'suprafață aproximativă' },
    ],
    accent: '#b7791a',
    floor: [0, 24, 97],
    size: [60, 20, 34],
    style: 'plenary',
    camera: { eye: [-3, 5.2, 0], look: [-29, 6.8, 0], fov: 46 },
    hologram: { kind: 'wall', at: [-29.4, 2.4, 0], yaw: Math.PI / 2, width: 13 },
    recordings: testRecordings('cuza', [
      'Aici intră prima filmare: cum se vede orașul din loggie.',
      'Aici intră a doua filmare: istoria sălii și a balconului.',
      'Aici intră a treia filmare: ce se întâmplă în sală în zilele de ședință.',
    ]),
    photos: [],
  },
]

export const PALACE_FACTS = [
  { value: '270 × 240 m', label: 'amprenta la sol' },
  { value: '84 m', label: 'înălțime deasupra solului' },
  { value: '25 iunie 1984', label: 'piatra de temelie' },
]
