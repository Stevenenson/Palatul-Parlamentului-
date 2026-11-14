import { Color, Group, MeshStandardMaterial } from 'three'
import type { RoomSpec } from '../../content/rooms'
import {
  Parts,
  box,
  ceilingPlane,
  chandelier,
  column,
  cylinder,
  floorDisc,
  floorPlane,
  onWall,
  ring,
  wallBox,
  walls,
  type Side,
} from './kit'

/**
 * Sălile ca machete stilizate, construite din cod. Originea fiecărei săli e centrul
 * pardoselii; X merge de-a lungul lățimii (`size[0]`), Z de-a lungul adâncimii (`size[2]`).
 * Formele urmează descrierile din articolul citat în `content/rooms.ts`; proporțiile
 * elementelor de decor sunt aproximative.
 */

function addChandelier(parts: Parts, x: number, top: number, z: number, radius: number, drop: number) {
  const { gold, bulbs } = chandelier(x, top, z, radius, drop)
  parts.add('gold', ...gold)
  parts.add('glow', ...bulbs)
}

/** Podeaua, pereții, tavanul și plinta: ce au toate sălile. */
function addEnvelope(parts: Parts, L: number, H: number, D: number, ceiling = true) {
  parts.add('floor', floorPlane(L, D))
  parts.add('shell', ...walls(L, H, D))
  if (ceiling) parts.add('shell', ceilingPlane(L, D, 0, H, 0))
  for (const side of ['-x', '+x', '-z', '+z'] as Side[]) {
    const run = side.endsWith('z') ? L : D
    parts.add('trim', wallBox(side, L, D, 0, 0, run, 0.45, 0.12))
    parts.add('trim', wallBox(side, L, D, 0, H - 0.7, run, 0.7, 0.35))
  }
}

/** Suportul hologramei: soclu cu proiector pentru „masă”, ramă pentru „perete”. */
function addMount(parts: Parts, room: RoomSpec) {
  const [x, y, z] = room.hologram.at
  const w = room.hologram.width
  if (room.hologram.kind === 'table') {
    parts.add('mount', cylinder(w * 0.2, 0.16, x, y + 0.92, z, 40))
    parts.add('gold', ring(w * 0.2, w * 0.215, y + 0.9, y + 1.1, 48).translate(x, 0, z))
    return
  }
  // Rama stă pe perete, cu fața spre cameră; holograma se desenează în fața ei.
  const h = (w * 9) / 16
  const frame = box(w + 0.5, h + 0.5, 0.14, 0, y - 0.25, 0)
  frame.rotateY(room.hologram.yaw)
  frame.translate(x, 0, z)
  parts.add('mount', frame)
}

/** Galeria de Onoare: culoar lung cu două șiruri de coloane octogonale, lustre și un covor roșu. */
function gallery(parts: Parts, room: RoomSpec) {
  const [L, H, D] = room.size
  addEnvelope(parts, L, H, D)

  // Pardoseala „în formă de covor” din zona centrală și covorul roșu de pe ea.
  parts.add('inlay', floorPlane(L - 6, 7.6, 0, 0.02, 0))
  parts.add('accent', floorPlane(L - 14, 4.4, 0, 0.05, 0))
  parts.add('inlay', floorPlane(L - 2, 0.35, 0, 0.02, 7.4), floorPlane(L - 2, 0.35, 0, 0.02, -7.4))

  // 34 de coloane octogonale: 17 pe fiecare parte.
  const perRow = 17
  const spacing = (L - 6) / (perRow - 1)
  for (let i = 0; i < perRow; i++) {
    const x = -(L - 6) / 2 + i * spacing
    for (const z of [-5.3, 5.3]) parts.add('trim', ...column(0.72, H - 0.7, x, z, 8))
    // Arcul transversal dintre coloane, redus la o grindă.
    parts.add('trim', box(0.9, 0.6, D, x, H - 1.3, 0))
  }
  parts.add('trim', box(L, 0.6, 0.9, 0, H - 1.3, -5.3), box(L, 0.6, 0.9, 0, H - 1.3, 5.3))

  // 14 ferestre și uși-fereastră pe latura dinspre fațadă, uși de lemn pe cealaltă.
  for (let i = 0; i < 14; i++) {
    const x = -(L - 16) / 2 + (i * (L - 16)) / 13
    parts.add('glow', onWall('+z', L, D, x, 0.5, 3.2, 8, { arched: true }))
    parts.add('trim', wallBox('+z', L, D, x, 0, 4.1, 0.5, 0.25))
  }
  for (let i = 0; i < 8; i++) {
    const x = -(L - 30) / 2 + (i * (L - 30)) / 7
    parts.add('wood', onWall('-z', L, D, x, 0.45, 2.6, 5.2, { arched: true }))
  }

  // 67 de lustre: 17 mari pe ax și câte 25 mai mici pe fiecare latură.
  for (let i = 0; i < 17; i++) {
    const x = -(L - 6) / 2 + i * spacing
    addChandelier(parts, x, H - 1.3, 0, 1.25, 2.6)
  }
  for (let i = 0; i < 25; i++) {
    const x = -(L - 10) / 2 + (i * (L - 10)) / 24
    addChandelier(parts, x, H - 0.7, 7.3, 0.55, 1.5)
    addChandelier(parts, x, H - 0.7, -7.3, 0.55, 1.5)
  }
}

/** Sala Unirii: navă centrală sub un luminator de sticlă, două nave laterale și covorul mare. */
function hall(parts: Parts, room: RoomSpec) {
  const [L, H, D] = room.size
  const nave = 18
  const sideHeight = 12.5
  addEnvelope(parts, L, H, D, false)

  // Tavanul: sticlă peste nava centrală, tavane mai joase peste navele laterale.
  const side = (D - nave) / 2
  parts.add('sky', ceilingPlane(L - 4, nave - 2, 0, H - 0.02, 0))
  parts.add('shell', ceilingPlane(L, 1, 0, H, nave / 2 - 0.5), ceilingPlane(L, 1, 0, H, -nave / 2 + 0.5))
  parts.add('shell', ceilingPlane(2, nave, L / 2 - 1, H, 0), ceilingPlane(2, nave, -L / 2 + 1, H, 0))
  for (const z of [nave / 2 + side / 2, -nave / 2 - side / 2]) {
    parts.add('shell', ceilingPlane(L, side, 0, sideHeight, z))
  }
  // Grila aurie a luminatorului.
  for (let i = 0; i <= 8; i++) {
    const x = -(L - 4) / 2 + (i * (L - 4)) / 8
    parts.add('gold', box(0.22, 0.22, nave - 2, x, H - 0.3, 0))
  }
  for (const z of [-(nave - 2) / 2, 0, (nave - 2) / 2]) parts.add('gold', box(L - 4, 0.22, 0.22, 0, H - 0.3, z))

  // Colonadele care despart navele, cu antablamentul lor.
  for (const z of [nave / 2, -nave / 2]) {
    for (let i = 0; i < 9; i++) {
      const x = -24 + i * 6
      parts.add('trim', ...column(0.62, sideHeight, x, z, 20))
    }
    parts.add('trim', box(L, H - sideHeight, 1.5, 0, sideHeight, z))
  }

  // Covorul de 1.100 m² din partea centrală.
  parts.add('accent', floorPlane(L - 10, nave - 3.4, 0, 0.05, 0))
  parts.add('inlay', floorPlane(L - 8.6, nave - 2, 0, 0.02, 0))

  // Ieșirile spre parc, pe o latură.
  for (let i = 0; i < 7; i++) {
    const x = -21 + i * 7
    parts.add('glow', onWall('+z', L, D, x, 0.45, 3.4, 9.4, { arched: true }))
  }
  for (let i = 0; i < 7; i++) {
    const x = -21 + i * 7
    parts.add('wood', onWall('-z', L, D, x, 0.45, 2.8, 6.2, { arched: true }))
  }
  for (const z of [nave / 2 + side / 2, -nave / 2 - side / 2]) {
    for (let i = 0; i < 4; i++) addChandelier(parts, -18 + i * 12, sideHeight, z, 0.7, 2)
  }
}

/** Sala Drepturilor Omului: lambriu de stejar, masă rotundă cu 60 de scaune și candelabrul mare. */
function round(parts: Parts, room: RoomSpec) {
  const [L, H, D] = room.size
  addEnvelope(parts, L, H, D)

  // Lambriul și modulul de doi pilaștri de stejar, repetat la 6 m.
  const sides: Side[] = ['-x', '+x', '-z', '+z']
  for (const side of sides) {
    const run = side.endsWith('z') ? L : D
    parts.add('wood', wallBox(side, L, D, 0, 0.45, run, 6.4, 0.1))
    parts.add('woodDark', wallBox(side, L, D, 0, 6.85, run, 0.3, 0.2))
    for (const u of [-9, -3, 3, 9]) {
      for (const offset of [-0.55, 0.55]) {
        parts.add('woodDark', wallBox(side, L, D, u + offset, 0.45, 0.5, 8.6, 0.28))
      }
    }
  }
  // Cinci ferestre pe o latură.
  for (let i = 0; i < 5; i++) {
    parts.add('glow', onWall('+x', L, D, -12 + i * 6, 1.6, 2.6, 5.6, { arched: true, inset: 0.14 }))
  }

  // Covorul, masa rotundă și scaunele.
  parts.add('accent', floorDisc(9.4, 0, 0.05, 0))
  parts.add('inlay', floorDisc(10.2, 0, 0.02, 0))
  parts.add('wood', ring(3.5, 5.5, 0.72, 0.82))
  parts.add('woodDark', ring(3.62, 3.7, 0, 0.72), ring(5.3, 5.38, 0, 0.72))
  const chairs = 60
  for (let i = 0; i < chairs; i++) {
    const a = (i / chairs) * Math.PI * 2
    const seat = box(0.46, 0.1, 0.46, 0, 0.44, 6.15)
    const back = box(0.46, 0.62, 0.08, 0, 0.5, 6.4)
    const legs = box(0.4, 0.44, 0.4, 0, 0, 6.15)
    for (const part of [seat, back]) parts.add('woodDark', part.rotateY(a))
    parts.add('wood', legs.rotateY(a))
  }

  // Candelabrul de circa 2 tone, deasupra mesei.
  addChandelier(parts, 0, H - 0.7, 0, 2.5, 2.3)
  addChandelier(parts, 0, H - 2.2, 0, 1.5, 1.4)
}

/** Sala A.I. Cuza: cea mai înaltă, cu 7 luminatoare, coloane de marmură, logie și balconul orchestrei. */
function plenary(parts: Parts, room: RoomSpec) {
  const [L, H, D] = room.size
  addEnvelope(parts, L, H, D, false)

  // Plafonul cu 7 luminatoare ritmate pe traversele sălii.
  const strip = 4.4
  const pitch = L / 7
  for (let i = 0; i < 7; i++) {
    const x = -L / 2 + pitch * (i + 0.5)
    parts.add('sky', ceilingPlane(strip, D - 6, x, H - 0.02, 0))
    parts.add('gold', box(strip + 0.5, 0.25, 0.25, x, H - 0.4, D / 2 - 3), box(strip + 0.5, 0.25, 0.25, x, H - 0.4, -D / 2 + 3))
    parts.add('gold', box(0.25, 0.25, D - 6, x - strip / 2, H - 0.4, 0), box(0.25, 0.25, D - 6, x + strip / 2, H - 0.4, 0))
  }
  for (let i = 0; i <= 7; i++) {
    const x = -L / 2 + pitch * i
    const w = i === 0 || i === 7 ? (pitch - strip) / 2 : pitch - strip
    const cx = i === 0 ? x + w / 2 : i === 7 ? x - w / 2 : x
    parts.add('shell', ceilingPlane(w, D, cx, H, 0))
  }
  parts.add('shell', ceilingPlane(L, 3, 0, H, D / 2 - 1.5), ceilingPlane(L, 3, 0, H, -D / 2 + 1.5))

  // Coloanele de marmură de pe laturile lungi.
  for (let i = 0; i <= 8; i++) {
    const x = -L / 2 + 2 + (i * (L - 4)) / 8
    for (const z of [-D / 2 + 1.4, D / 2 - 1.4]) parts.add('trim', ...column(0.8, H - 0.7, x, z, 24))
  }

  // Logia spre Piața Constituției: cinci arcade luminate.
  for (let i = 0; i < 5; i++) {
    const x = -22 + i * 11
    parts.add('glow', onWall('+z', L, D, x, 0.5, 5.4, 14, { arched: true }))
  }
  // Balconul orchestrei, pe peretele opus logiei, mai sus de sală.
  parts.add('trim', wallBox('-z', L, D, -4, 8.4, 13, 0.4, 3.4))
  parts.add('gold', wallBox('-z', L, D, -4, 8.8, 13, 1.1, 0.12).translate(0, 0, 3.28))
  parts.add('wood', onWall('-z', L, D, -4, 8.85, 4.2, 5.2, { arched: true }))
  parts.add('wood', onWall('-x', L, D, -9, 0.45, 3.2, 6.6, { arched: true }), onWall('-x', L, D, 9, 0.45, 3.2, 6.6, { arched: true }))

  parts.add('accent', floorPlane(L - 20, D - 13, 0, 0.05, 1.5))
  parts.add('inlay', floorPlane(L - 18.4, D - 11.4, 0, 0.02, 1.5))
}

const BUILDERS: Record<RoomSpec['style'], (parts: Parts, room: RoomSpec) => void> = {
  gallery,
  hall,
  round,
  plenary,
}

export type BuiltRoom = { group: Group; accent: MeshStandardMaterial; dispose: () => void }

export function buildRoom(room: RoomSpec): BuiltRoom {
  const parts = new Parts()
  BUILDERS[room.style](parts, room)
  addMount(parts, room)

  // Covoarele sunt suprafețe mari: accentul sălii se amestecă pe jumătate cu pardoseala, ca să nu inunde ecranul.
  const tone = new Color(room.accent).lerp(new Color('#ece8df'), 0.5)
  const accent = new MeshStandardMaterial({ color: tone, roughness: 0.95 })
  const group = new Group()
  group.name = room.id
  group.position.set(...room.floor)
  const meshes = parts.build(accent)
  group.add(...meshes)

  const dispose = () => {
    for (const mesh of meshes) mesh.geometry.dispose()
    accent.dispose()
  }
  return { group, accent, dispose }
}
