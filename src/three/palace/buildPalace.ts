import {
  BoxGeometry,
  BufferGeometry,
  CircleGeometry,
  Color,
  CylinderGeometry,
  EdgesGeometry,
  Euler,
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
  Vector3,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import {
  BAY,
  PALACE,
  PORTICO,
  TERRACES,
  VOLUMES,
  type Band,
  type Face,
  type Volume,
} from './massing'

/**
 * Palatul ca machetă albă, construit din cod. Totul se reduce la câteva apeluri de desenare:
 * volumele (un singur mesh), profilele orizontale (un mesh), iar ferestrele, pilaștrii și
 * coloanele sunt instanțiate.
 */

const WALL = '#f5f3ee'
const TRIM = '#fbfaf7'
const PANE = '#97a3ab'
const TERRACE = '#e7e3da'
const SITE = '#e8e4db'
const EDGE = '#77736b'

const ALL_FACES: Face[] = ['front', 'back', 'left', 'right']

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
  pilaster: Instances
  column: Instances
  trim: BufferGeometry[]
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

function addWindow(detail: Detail, band: Band, step: number, x: number, z: number, yaw: number) {
  const height = band.y1 - band.y0
  if (band.kind === 'rect') {
    const w = Math.min(step * 0.42, 2.7)
    const h = height * 0.74
    detail.paneRect.add(x, band.y0 + height * 0.5, z, yaw, w, h, 1)
  } else if (band.kind === 'square') {
    const s = Math.min(step * 0.34, height * 0.72)
    detail.paneRect.add(x, band.y0 + height * 0.5, z, yaw, s, s, 1)
  } else {
    // Fereastră cu arc: un dreptunghi și un semicerc deasupra, ca arcul să rămână rotund.
    const w = Math.min(step * 0.56, 3.7)
    const total = height * 0.9
    const straight = Math.max(total - w / 2, 0.4)
    const bottom = band.y0 + (height - total) * 0.5
    detail.paneRect.add(x, bottom + straight / 2, z, yaw, w, straight, 1)
    detail.paneArc.add(x, bottom + straight, z, yaw, w, w, 1)
  }
}

function addFacade(detail: Detail, volume: Volume, face: Face) {
  const bands = volume.bands
  if (!bands || bands.length === 0) return
  const [from, to] = faceRange(volume, face)
  const margin = Math.min(volume.margin ?? 3, (to - from) / 2 - 1.2)
  const usable = to - from - 2 * margin
  if (usable < BAY * 0.7) return
  const count = Math.max(1, Math.round(usable / BAY))
  const step = usable / count
  const yaw = FACE_YAW[face]

  for (const band of bands) {
    for (let i = 0; i < count; i++) {
      const along = from + margin + step * (i + 0.5)
      const [x, z] = onFace(volume, face, along, 0.07)
      addWindow(detail, band, step, x, z, yaw)
    }
    if (!band.pilasters) continue
    const height = band.y1 - band.y0 + 1.5
    for (let i = 0; i <= count; i++) {
      const along = from + margin + step * i
      const [x, z] = onFace(volume, face, along, 0.3)
      detail.pilaster.add(x, (band.y0 + band.y1) / 2, z, yaw, 1.0, height, 0.62)
    }
  }
}

/** Brâiele, cornișa și aticul unui volum. Sunt cutii simple care ies puțin din perete. */
function addProfiles(detail: Detail, volume: Volume) {
  const { x0, x1, z0, z1 } = volume
  for (const y of volume.courses ?? []) {
    detail.trim.push(box(x0 - 0.38, x1 + 0.38, y - 0.34, y + 0.34, z0 - 0.38, z1 + 0.38))
  }
  const cornice = volume.cornice
  if (!cornice) return
  const d = cornice.depth
  const top = volume.y1
  // Cornișa în două trepte: o placă lată sus și una mai retrasă sub ea.
  detail.trim.push(box(x0 - d, x1 + d, top - cornice.height * 0.5, top + 0.06, z0 - d, z1 + d))
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
  const first = -((columns - 1) * spacing) / 2
  for (let i = 0; i < columns; i++) {
    const x = first + i * spacing
    detail.column.add(x, height / 2, z, 0, radius, height, radius)
    // Baza și capitelul coloanei.
    detail.trim.push(box(x - 1.6, x + 1.6, 0, 1.1, z - 1.6, z + 1.6))
    detail.trim.push(box(x - 1.5, x + 1.5, height - 0.9, height, z - 1.5, z + 1.5))
  }
  detail.trim.push(box(e.x0, e.x1, e.y0, e.y1, e.z0, e.z1))
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

/** Coloane libere la etajul nobil al pavilioanelor de colț, ca în fotografii. */
function addPavilionColumns(detail: Detail, volume: Volume) {
  if (!volume.id.startsWith('pavilion')) return
  const band = volume.bands?.[1]
  if (!band) return
  for (const face of ALL_FACES) {
    const [from, to] = faceRange(volume, face)
    const margin = volume.margin ?? 3
    const usable = to - from - 2 * margin
    const count = Math.max(1, Math.round(usable / BAY))
    const step = usable / count
    for (let i = 0; i <= count; i++) {
      const [x, z] = onFace(volume, face, from + margin + step * i, 1.25)
      detail.column.add(x, (band.y0 + band.y1) / 2, z, 0, 0.62, band.y1 - band.y0 + 1.2, 0.62)
    }
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
  const crossing = new PlaneGeometry(430, 18)
  crossing.rotateX(-Math.PI / 2)
  crossing.translate(0, y, 198)
  const mesh = new Mesh(mergeGeometries([plaza, disc, boulevard, crossing]), material)
  mesh.receiveShadow = true
  return mesh
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
  const pane = new MeshStandardMaterial({ color: PANE, roughness: 0.55 })
  const edge = new LineBasicMaterial({ color: new Color(EDGE), transparent: true, opacity: 0 })

  // ——— Volumele ———
  const massing = new Mesh(
    mergeGeometries(VOLUMES.map((v) => box(v.x0, v.x1, v.y0, v.y1, v.z0, v.z1))),
    wall,
  )
  massing.castShadow = true
  massing.receiveShadow = true

  // ——— Muchiile, vizibile când carcasa devine transparentă ———
  const edgePositions: number[] = []
  for (const v of VOLUMES) {
    const edges = new EdgesGeometry(box(v.x0, v.x1, v.y0, v.y1, v.z0, v.z1))
    edgePositions.push(...(edges.getAttribute('position').array as Float32Array))
    edges.dispose()
  }
  const edgeGeometry = new BufferGeometry()
  edgeGeometry.setAttribute('position', new Float32BufferAttribute(edgePositions, 3))
  const edges = new LineSegments(edgeGeometry, edge)
  edges.visible = false

  // ——— Detaliul fațadelor ———
  const detail: Detail = {
    paneRect: new Instances(),
    paneArc: new Instances(),
    pilaster: new Instances(),
    column: new Instances(),
    trim: [],
  }
  for (const volume of VOLUMES) {
    for (const face of volume.faces ?? ALL_FACES) addFacade(detail, volume, face)
    addProfiles(detail, volume)
    addPavilionColumns(detail, volume)
  }
  // Soclul clădirii.
  detail.trim.push(box(-129.5, 129.5, 0, 1.3, -112.5, 112.5))
  addPortico(detail)

  const trimMesh = new Mesh(mergeGeometries(detail.trim), trim)
  trimMesh.castShadow = true
  trimMesh.receiveShadow = true

  const arc = new CircleGeometry(0.5, 20, 0, Math.PI)
  const facade = [
    detail.paneRect.build(new PlaneGeometry(1, 1), pane, false),
    detail.paneArc.build(arc, pane, false),
    detail.pilaster.build(new BoxGeometry(1, 1, 1), trim, true),
    detail.column.build(new CylinderGeometry(1, 1, 1, 20), trim, true),
    trimMesh,
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
    // Peretele rămâne ca o fantomă abia vizibilă; detaliul dispare de tot.
    const ghost = 0.045 + 0.05 * map
    wall.opacity = ghost + (1 - ghost) * solid
    trim.opacity = solid
    pane.opacity = solid
    for (const material of shell) {
      if (material.transparent === opaque) {
        // Shaderul unui material opac ignoră opacitatea, deci la schimbare trebuie recompilat.
        material.transparent = !opaque
        material.needsUpdate = true
      }
      material.depthWrite = solid > 0.6
    }
    const detailVisible = solid > 0.015
    const changed = facade[0].visible !== detailVisible
    for (const mesh of facade) mesh.visible = detailVisible
    edge.opacity = (1 - solid) * (0.32 + 0.3 * map)
    edges.visible = edge.opacity > 0.01
    return changed
  }
  update(1, 0)

  const dispose = () => {
    group.traverse((object) => {
      const mesh = object as Mesh
      mesh.geometry?.dispose()
    })
    for (const material of [...shell, edge, terraces.material, site.material]) {
      ;(material as MeshStandardMaterial).dispose()
    }
  }

  return { group, update, dispose }
}
