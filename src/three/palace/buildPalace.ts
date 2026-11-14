import {
  BoxGeometry,
  BufferGeometry,
  CircleGeometry,
  Color,
  CylinderGeometry,
  EdgesGeometry,
  Euler,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  Quaternion,
  RingGeometry,
  Shape,
  Vector3,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import {
  BAY,
  PALACE,
  PORTICO,
  ROOF_LIGHTS,
  TERRACES,
  VOLUMES,
  type Band,
  type Face,
  type Volume,
} from './massing'

/**
 * Palatul ca machetă albă, construit din cod. Totul se reduce la câteva apeluri de desenare:
 * volumele (un singur mesh), profilele orizontale (un mesh), iar ferestrele, ancadramentele,
 * pilaștrii și coloanele sunt instanțiate.
 */

const WALL = '#f5f3ee'
const TRIM = '#fbfaf7'
/** Geamul: gri cald, mai închis decât peretele, ca golul să pară adânc. */
const PANE = '#989389'
const TERRACE = '#e7e3da'
const SITE = '#e8e4db'
const EDGE = '#6f6b63'

const ALL_FACES: Face[] = ['front', 'back', 'left', 'right']

/** Cât iese ancadramentul din perete; geamul rămâne în spatele lui, în umbră. */
const REVEAL = 0.36
const JAMB = 0.3

/** Rotația în jurul axei Y care întoarce normala +Z spre exteriorul feței. */
const FACE_YAW: Record<Face, number> = {
  front: 0,
  back: Math.PI,
  right: Math.PI / 2,
  left: -Math.PI / 2,
}

function box(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number) {
  const geometry = new BoxGeometry(x1 - x0, y1 - y0, z1 - z0)
  geometry.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2)
  return geometry
}

/** Adună matrici de instanță și le transformă la final într-un singur InstancedMesh. */
class Instances {
  private readonly matrices: Matrix4[] = []
  private readonly position = new Vector3()
  private readonly quaternion = new Quaternion()
  private readonly scale = new Vector3()
  private readonly euler = new Euler()

  add(x: number, y: number, z: number, yaw: number, sx: number, sy: number, sz: number) {
    this.position.set(x, y, z)
    this.quaternion.setFromEuler(this.euler.set(0, yaw, 0))
    this.scale.set(sx, sy, sz)
    this.matrices.push(new Matrix4().compose(this.position, this.quaternion, this.scale))
  }

  build(geometry: BufferGeometry, material: MeshStandardMaterial, shadows: boolean) {
    const mesh = new InstancedMesh(geometry, material, this.matrices.length)
    this.matrices.forEach((matrix, i) => mesh.setMatrixAt(i, matrix))
    mesh.instanceMatrix.needsUpdate = true
    mesh.castShadow = shadows
    mesh.receiveShadow = true
    mesh.computeBoundingSphere()
    return mesh
  }
}

type Detail = {
  paneRect: Instances
  paneArc: Instances
  /** Cutii instanțiate: pilaștri, montanți, buiandrugi, glafuri. */
  block: Instances
  /** Arhivolta ferestrelor cu arc. */
  hood: Instances
  column: Instances
  trim: BufferGeometry[]
  /** Cutiile cărora li se desenează muchiile pe macheta opacă (cornișe, antablament). */
  outlined: BufferGeometry[]
}

function contains(v: Volume, x: number, y: number, z: number) {
  return x > v.x0 && x < v.x1 && y > v.y0 && y < v.y1 && z > v.z0 && z < v.z1
}

/** Un punct din fața unui perete e „îngropat” dacă stă în interiorul altui volum: acolo nu punem nimic. */
function buried(own: Volume, x: number, y: number, z: number) {
  return VOLUMES.some((v) => v !== own && contains(v, x, y, z))
}

/** Punctul de pe o față, la distanța `along` de-a lungul ei și `out` metri în afara peretelui. */
function onFace(volume: Volume, face: Face, along: number, out: number): [number, number] {
  switch (face) {
    case 'front':
      return [along, volume.z1 + out]
    case 'back':
      return [along, volume.z0 - out]
    case 'right':
      return [volume.x1 + out, along]
    case 'left':
      return [volume.x0 - out, along]
  }
}

function faceRange(volume: Volume, face: Face): [number, number] {
  return face === 'front' || face === 'back' ? [volume.x0, volume.x1] : [volume.z0, volume.z1]
}

/**
 * O fereastră: geamul lipit de perete și, în jurul lui, un ancadrament care iese în afară
 * (montanți, buiandrug sau arhivoltă, glaf). Umbra ancadramentului cade pe geam și dă golului adâncime.
 */
function addWindow(detail: Detail, volume: Volume, face: Face, band: Band, step: number, along: number) {
  const yaw = FACE_YAW[face]
  const height = band.y1 - band.y0
  const at = (out: number, offset = 0) => onFace(volume, face, along + offset, out)
  const [px, pz] = at(0.05)
  const [fx, fz] = at(REVEAL / 2)

  let w: number
  let bottom: number
  let straight: number
  const arched = band.kind === 'arch'
  if (band.kind === 'rect') {
    w = Math.min(step * 0.42, 2.7)
    straight = height * 0.74
    bottom = band.y0 + (height - straight) / 2
  } else if (band.kind === 'square') {
    w = Math.min(step * 0.34, height * 0.72)
    straight = w
    bottom = band.y0 + (height - w) / 2
  } else {
    // Fereastră cu arc: un dreptunghi și un semicerc deasupra, ca arcul să rămână rotund.
    w = Math.min(step * 0.56, 3.7)
    const total = height * 0.9
    straight = Math.max(total - w / 2, 0.4)
    bottom = band.y0 + (height - total) / 2
  }

  detail.paneRect.add(px, bottom + straight / 2, pz, yaw, w, straight, 1)
  if (arched) detail.paneArc.add(px, bottom + straight, pz, yaw, w, w, 1)

  // Montanții, în stânga și în dreapta golului.
  for (const side of [-1, 1]) {
    const [jx, jz] = at(REVEAL / 2, side * (w / 2 + JAMB / 2))
    detail.block.add(jx, bottom + straight / 2, jz, yaw, JAMB, straight, REVEAL)
  }
  if (arched) {
    detail.hood.add(fx, bottom + straight, fz, yaw, w, w, REVEAL)
  } else {
    detail.block.add(fx, bottom + straight + JAMB / 2, fz, yaw, w + JAMB * 2 + 0.3, JAMB, REVEAL + 0.08)
  }
  if (band.kind !== 'square') {
    const [sx, sz] = at(REVEAL * 0.7)
    detail.block.add(sx, bottom - 0.12, sz, yaw, w + JAMB * 2 + 0.5, 0.24, REVEAL * 1.4)
  }
}

function addFacade(detail: Detail, volume: Volume, face: Face) {
  const bands = volume.bands
  if (!bands || bands.length === 0) return
  const [from, to] = faceRange(volume, face)
  const margin = Math.min(volume.margin ?? 3, (to - from) / 2 - 1.2)
  const usable = to - from - 2 * margin
  if (usable < BAY * 0.7) return
  const count = volume.bays ?? Math.max(1, Math.round(usable / BAY))
  const step = usable / count
  const yaw = FACE_YAW[face]

  for (const band of bands) {
    const mid = (band.y0 + band.y1) / 2
    for (let i = 0; i < count; i++) {
      const along = from + margin + step * (i + 0.5)
      const [tx, tz] = onFace(volume, face, along, 0.5)
      if (buried(volume, tx, mid, tz)) continue
      addWindow(detail, volume, face, band, step, along)
    }
    if (!band.pilasters) continue
    const height = band.y1 - band.y0 + 1.5
    for (let i = 0; i <= count; i++) {
      const along = from + margin + step * i
      const [tx, tz] = onFace(volume, face, along, 0.8)
      if (buried(volume, tx, mid, tz)) continue
      const [x, z] = onFace(volume, face, along, 0.32)
      detail.block.add(x, mid, z, yaw, 1.0, height, 0.66)
    }
  }
}

/** Brâiele, cornișa și aticul unui volum. Sunt cutii simple care ies puțin din perete. */
function addProfiles(detail: Detail, volume: Volume) {
  const { x0, x1, z0, z1 } = volume
  for (const y of volume.courses ?? []) {
    detail.trim.push(box(x0 - 0.42, x1 + 0.42, y - 0.34, y + 0.34, z0 - 0.42, z1 + 0.42))
  }
  const cornice = volume.cornice
  if (!cornice) return
  const d = cornice.depth
  const top = volume.y1
  // Cornișa în două trepte: o placă lată sus și una mai retrasă sub ea.
  const slab = box(x0 - d, x1 + d, top - cornice.height * 0.5, top + 0.06, z0 - d, z1 + d)
  detail.trim.push(slab)
  detail.outlined.push(slab)
  detail.trim.push(
    box(x0 - d * 0.5, x1 + d * 0.5, top - cornice.height, top - cornice.height * 0.5, z0 - d * 0.5, z1 + d * 0.5),
  )
  if (cornice.parapet <= 0) return
  const p = d - 0.7
  const t = 0.55
  const y0 = top + 0.06
  const y1 = y0 + cornice.parapet
  for (const face of volume.parapet ?? volume.faces ?? ALL_FACES) {
    if (face === 'front') detail.trim.push(box(x0 - p, x1 + p, y0, y1, z1 + p - t, z1 + p))
    if (face === 'back') detail.trim.push(box(x0 - p, x1 + p, y0, y1, z0 - p, z0 - p + t))
    if (face === 'right') detail.trim.push(box(x1 + p - t, x1 + p, y0, y1, z0 - p, z1 + p))
    if (face === 'left') detail.trim.push(box(x0 - p, x0 - p + t, y0, y1, z0 - p, z1 + p))
  }
}

function addPortico(detail: Detail) {
  const { columns, spacing, radius, height, z, entablature: e, steps } = PORTICO
  // Coloanele stau pe ultima treaptă, nu îngropate în scară.
  const base = steps.count * steps.rise
  const shaft = height - base
  const first = -((columns - 1) * spacing) / 2
  for (let i = 0; i < columns; i++) {
    const x = first + i * spacing
    detail.column.add(x, base + shaft / 2, z, 0, radius, shaft, radius)
    detail.trim.push(box(x - 1.6, x + 1.6, base, base + 1.0, z - 1.6, z + 1.6))
    detail.trim.push(box(x - 1.5, x + 1.5, height - 0.9, height, z - 1.5, z + 1.5))
  }
  const beam = box(e.x0, e.x1, e.y0, e.y1, e.z0, e.z1)
  detail.trim.push(beam)
  detail.outlined.push(beam)
  detail.trim.push(box(e.x0 - 0.8, e.x1 + 0.8, e.y1, e.y1 + 0.7, e.z0, e.z1 + 0.8))
  // Balustrada balconului principal.
  detail.trim.push(box(e.x0 - 0.3, e.x1 + 0.3, e.y1 + 0.7, e.y1 + 1.9, e.z1 - 0.1, e.z1 + 0.4))
  detail.trim.push(box(e.x0 - 0.3, e.x0 + 0.2, e.y1 + 0.7, e.y1 + 1.9, e.z0, e.z1 + 0.4))
  detail.trim.push(box(e.x1 - 0.2, e.x1 + 0.3, e.y1 + 0.7, e.y1 + 1.9, e.z0, e.z1 + 0.4))
  // Treptele din fața intrării.
  for (let i = 0; i < steps.count; i++) {
    const grow = (steps.count - 1 - i) * 1.3
    detail.trim.push(
      box(steps.x0 - grow, steps.x1 + grow, i * steps.rise - 0.02, (i + 1) * steps.rise, steps.z0, steps.z1 + grow),
    )
  }
  // Catargul de pe turnul central.
  detail.trim.push(box(-0.22, 0.22, 89.5, 99, 47.78, 48.22))
}

/** Ramele luminatoarelor de pe acoperișuri; geamul lor se adaugă separat. Dau acoperișului scară. */
function addRoofLights(detail: Detail) {
  for (const { x0, x1, z0, z1, y } of ROOF_LIGHTS) {
    detail.trim.push(box(x0, x1, y, y + 0.7, z0, z1))
  }
}

function buildTerraces() {
  const parts: BufferGeometry[] = TERRACES.map((t) => box(t.x0, t.x1, t.y0, t.y1, t.z0, t.z1))
  // Scările din axul fațadei, care coboară de pe o terasă pe alta.
  TERRACES.forEach((t) => {
    const steps = 6
    const rise = (t.y1 - t.y0) / steps
    for (let i = 0; i < steps - 1; i++) {
      const run = (i + 1) * 1.15
      parts.push(box(-13, 13, t.y0, t.y1 - (i + 1) * rise, t.z1, t.z1 + run))
    }
  })
  const geometry = mergeGeometries(parts)
  const mesh = new Mesh(geometry, new MeshStandardMaterial({ color: TERRACE, roughness: 0.95 }))
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

/** Planul de sit, desenat discret pe teren: piața semicirculară și axul bulevardului. */
function buildSite() {
  const material = new MeshStandardMaterial({ color: SITE, roughness: 1 })
  const y = PALACE.ground + 0.04
  const plaza = new RingGeometry(74, 82, 64, 1, 0, Math.PI)
  plaza.rotateX(-Math.PI / 2)
  plaza.rotateY(Math.PI)
  plaza.translate(0, y, 190)
  const disc = new CircleGeometry(60, 64, 0, Math.PI)
  disc.rotateX(-Math.PI / 2)
  disc.rotateY(Math.PI)
  disc.translate(0, y, 190)
  const boulevard = new PlaneGeometry(30, 620)
  boulevard.rotateX(-Math.PI / 2)
  boulevard.translate(0, y, 198 + 310)
  const mesh = new Mesh(mergeGeometries([plaza, disc, boulevard]), material)
  mesh.receiveShadow = true
  return mesh
}

/** Arhivolta: o jumătate de inel cu grosime, în unități de lățime a ferestrei. */
function hoodGeometry() {
  const outer = 0.5 + JAMB / 3.2
  const shape = new Shape()
  shape.absarc(0, 0, outer, 0, Math.PI, false)
  shape.lineTo(-0.5, 0)
  shape.absarc(0, 0, 0.5, Math.PI, 0, true)
  shape.lineTo(outer, 0)
  const geometry = new ExtrudeGeometry(shape, { depth: 1, bevelEnabled: false, curveSegments: 12 })
  geometry.translate(0, 0, -0.5)
  return geometry
}

/** Muchiile unor cutii, împinse puțin în afară ca linia să nu se bată cu fața pe care stă. */
function outline(boxes: BufferGeometry[], grow: number) {
  const positions: number[] = []
  const center = new Vector3()
  const size = new Vector3()
  for (const geometry of boxes) {
    geometry.computeBoundingBox()
    const bounds = geometry.boundingBox!
    bounds.getCenter(center)
    bounds.getSize(size)
    const grown = new BoxGeometry(size.x + grow * 2, size.y + grow * 2, size.z + grow * 2)
    grown.translate(center.x, center.y, center.z)
    const edges = new EdgesGeometry(grown)
    positions.push(...(edges.getAttribute('position').array as Float32Array))
    grown.dispose()
    edges.dispose()
  }
  const lines = new BufferGeometry()
  lines.setAttribute('position', new Float32BufferAttribute(positions, 3))
  return lines
}

export type Palace = {
  group: Group
  /**
   * `solid`: 1 = machetă opacă, 0 = carcasă transparentă. `map`: 0..1, modul hartă.
   * Întoarce `true` când s-a schimbat ce aruncă umbră, deci harta de umbre trebuie refăcută.
   */
  update: (solid: number, map: number) => boolean
  dispose: () => void
}

export function buildPalace(): Palace {
  const group = new Group()
  group.name = 'palat'

  const wall = new MeshStandardMaterial({ color: WALL, roughness: 0.93 })
  const trim = new MeshStandardMaterial({ color: TRIM, roughness: 0.9 })
  const pane = new MeshStandardMaterial({ color: PANE, roughness: 0.5 })
  const edge = new LineBasicMaterial({ color: new Color(EDGE), transparent: true, opacity: 0.2 })
  const fineEdge = new LineBasicMaterial({ color: new Color(EDGE), transparent: true, opacity: 0.2 })

  // ——— Volumele ———
  const volumeBoxes = VOLUMES.map((v) => box(v.x0, v.x1, v.y0, v.y1, v.z0, v.z1))
  const massing = new Mesh(mergeGeometries(volumeBoxes), wall)
  massing.castShadow = true
  massing.receiveShadow = true

  // ——— Detaliul fațadelor ———
  const detail: Detail = {
    paneRect: new Instances(),
    paneArc: new Instances(),
    block: new Instances(),
    hood: new Instances(),
    column: new Instances(),
    trim: [],
    outlined: [],
  }
  for (const volume of VOLUMES) {
    for (const face of volume.faces ?? ALL_FACES) addFacade(detail, volume, face)
    addProfiles(detail, volume)
  }
  // Soclul clădirii.
  detail.trim.push(box(-129.5, 129.5, 0, 1.3, -112.5, 112.5))
  addPortico(detail)
  addRoofLights(detail)

  // ——— Muchiile: fine pe macheta opacă, mai apăsate când carcasa devine transparentă ———
  const edges = new LineSegments(outline(volumeBoxes, 0.09), edge)
  const fineEdges = new LineSegments(outline(detail.outlined, 0.05), fineEdge)

  const trimMesh = new Mesh(mergeGeometries(detail.trim), trim)
  trimMesh.castShadow = true
  trimMesh.receiveShadow = true

  const roofGlass = new Mesh(
    mergeGeometries(
      ROOF_LIGHTS.map((l) => {
        const glass = new PlaneGeometry(l.x1 - l.x0 - 1.2, l.z1 - l.z0 - 1.2)
        glass.rotateX(-Math.PI / 2)
        glass.translate((l.x0 + l.x1) / 2, l.y + 0.75, (l.z0 + l.z1) / 2)
        return glass
      }),
    ),
    pane,
  )
  roofGlass.receiveShadow = true

  const facade = [
    detail.paneRect.build(new PlaneGeometry(1, 1), pane, false),
    detail.paneArc.build(new CircleGeometry(0.5, 20, 0, Math.PI), pane, false),
    detail.block.build(new BoxGeometry(1, 1, 1), trim, true),
    detail.hood.build(hoodGeometry(), trim, true),
    detail.column.build(new CylinderGeometry(1, 1, 1, 20), trim, true),
    trimMesh,
    roofGlass,
    fineEdges,
  ]

  const terraces = buildTerraces()
  const site = buildSite()
  group.add(site, terraces, massing, edges, ...facade)

  const shell = [wall, trim, pane]
  let last = -1

  const update = (solid: number, map: number) => {
    const key = solid * 10 + map
    if (Math.abs(key - last) < 1e-4) return false
    last = key
    const opaque = solid > 0.999
    // Detaliul se stinge primul; peretele rămâne ca o fantomă abia vizibilă.
    const fine = Math.min(1, Math.max(0, (solid - 0.3) / 0.55))
    const ghost = 0.045 + 0.05 * map
    wall.opacity = ghost + (1 - ghost) * solid
    trim.opacity = fine
    pane.opacity = fine
    for (const material of shell) {
      if (material.transparent === opaque) {
        // Shaderul unui material opac ignoră opacitatea, deci la schimbare trebuie recompilat.
        material.transparent = !opaque
        material.needsUpdate = true
      }
      material.depthWrite = solid > 0.6
    }
    const detailVisible = fine > 0.01
    const changed = facade[0].visible !== detailVisible
    for (const mesh of facade) mesh.visible = detailVisible
    fineEdge.opacity = 0.2 * fine
    edge.opacity = 0.2 * solid + (1 - solid) * (0.32 + 0.3 * map)
    return changed
  }
  update(1, 0)

  const dispose = () => {
    group.traverse((object) => {
      const mesh = object as Mesh
      mesh.geometry?.dispose()
    })
    for (const geometry of volumeBoxes) geometry.dispose()
    for (const material of [...shell, edge, fineEdge, terraces.material, site.material]) {
      ;(material as MeshStandardMaterial).dispose()
    }
  }

  return { group, update, dispose }
}
