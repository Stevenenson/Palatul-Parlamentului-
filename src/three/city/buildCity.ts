import {
  BufferGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  MathUtils,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  Quaternion,
  ShapeUtils,
  Vector2,
  Vector3,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { UNIRII_AXIS } from '../../content/city'
import { PAPER } from '../Lights'
import { PALACE } from '../palace/massing'
import { type CathedralSpot, buildCathedral } from './buildCathedral'

/**
 * Macheta orașului din jurul palatului: clădirile ca volume albe, copacii, iar parcurile, aleile,
 * apa, străzile, parcările și terenurile de sport ca suprafețe plate, în tonuri stinse. Datele
 * vin din OpenStreetMap, prin `scripts/fetch-city.mjs`, deja aduse în sistemul machetei (zecimi
 * de metru, +Z est, +X nord).
 *
 * Totul se desenează din câteva apeluri: un mesh pentru toate clădirile, unul pentru catedrală,
 * unul pentru toți copacii (instanțiat) și unul pentru teren. Spre margine, clădirile și copacii
 * scad, iar terenul se topește în hârtie, ca macheta să nu aibă o muchie tăiată.
 */

/** Un contur, ca șir plat `[x, z, x, z, …]`, în zecimi de metru. */
type Ring = number[]
/** O linie cu lățime: `[lățime, x, z, x, z, …]`. */
type Line = number[]

export type CityData = {
  source: string
  cathedral: CathedralSpot | null
  /** `[înălțime, contur exterior, …curți]` */
  buildings: [number, ...Ring[]][]
  /** Părți de clădire: `[înălțime, nivelul de la care pornesc, contur]` */
  parts?: [number, number, Ring][]
  parks: Ring[]
  lots?: Ring[]
  courts?: Ring[]
  plazas?: Ring[]
  water: Ring[]
  rivers: Line[]
  streets: Line[]
  paths?: Line[]
  hedges?: Line[]
  /** Copacii, câte unul: `[x, z, x, z, …]` */
  trees?: number[]
}

const WALL = '#f5f3ee'
const STREET = '#e8e4db'
const PARK = '#d6e0c6'
const WATER = '#bfd3dd'
const AXIS = '#c8452b'
/** Aleile: aproape culoarea hârtiei, ca să se vadă doar pe verdele parcurilor. */
const PATH = '#f3efe6'
const COURT = '#e4d9c3'
const HEDGE = '#bccba6'
const LEAF = '#adc192'
const TRUNK = '#b3a893'

/** Elipsa machetei: în interiorul ei orașul e întreg, spre marginea ei se stinge. */
const EXTENT = { x: 0, z: 190, rx: 1080, rz: 1400 }

/** 1 în mijlocul machetei, 0 la marginea ei. */
function reach(x: number, z: number) {
  const d = Math.hypot((x - EXTENT.x) / EXTENT.rx, (z - EXTENT.z) / EXTENT.rz)
  return 1 - MathUtils.smoothstep(d, 0.7, 1)
}

/** Un număr între 0 și 1, mereu același pentru același punct. */
function noise(x: number, z: number, salt = 0) {
  const v = Math.sin(x * 12.9898 + z * 78.233 + salt * 37.719) * 43758.5453
  return v - Math.floor(v)
}

const signedArea = (ring: Ring) => {
  let area = 0
  for (let i = 0, j = ring.length - 2; i < ring.length; j = i, i += 2) {
    area += ring[j] * ring[i + 1] - ring[i] * ring[j + 1]
  }
  return area / 2
}

const toPoints = (ring: Ring) => {
  const points: Vector2[] = []
  for (let i = 0; i < ring.length; i += 2) points.push(new Vector2(ring[i] / 10, ring[i + 1] / 10))
  return points
}

/** Triunghiurile unui poligon cu eventuale goluri, cu fața în sus. */
function triangles(outer: Vector2[], holes: Vector2[][], each: (a: Vector2, b: Vector2, c: Vector2) => void) {
  const all = holes.length ? outer.concat(...holes) : outer
  for (const [i, j, k] of ShapeUtils.triangulateShape(outer, holes)) {
    const a = all[i]
    const b = all[j]
    const c = all[k]
    // Privit de sus, cu +Y spre privitor, triunghiul trebuie să iasă în sens trigonometric.
    const up = (b.y - a.y) * (c.x - a.x) - (b.x - a.x) * (c.y - a.y)
    if (up >= 0) each(a, b, c)
    else each(a, c, b)
  }
}

/** Cât de închis e peretele la bază: o umbră de contact falsă, fără hartă de umbre. */
const FOOT = 0.84

function buildBuildings(data: CityData) {
  const positions: number[] = []
  const normals: number[] = []
  const colors: number[] = []
  const shade = (...levels: number[]) => {
    for (const level of levels) colors.push(level, level, level)
  }

  /** Pereții unui contur, de la `base` la `top`. Doar pereții care pornesc de la sol au umbra de contact. */
  const walls = (ring: Ring, base: number, top: number, hole: boolean) => {
    const sign = (signedArea(ring) > 0 ? 1 : -1) * (hole ? -1 : 1)
    const foot = base < 0.5 ? FOOT : 1
    for (let i = 0, j = ring.length - 2; i < ring.length; j = i, i += 2) {
      const ax = ring[j] / 10
      const az = ring[j + 1] / 10
      const bx = ring[i] / 10
      const bz = ring[i + 1] / 10
      const dx = bx - ax
      const dz = bz - az
      const length = Math.hypot(dx, dz)
      if (length < 0.05) continue
      const nx = (dz / length) * sign
      const nz = (-dx / length) * sign
      if (sign > 0) {
        positions.push(ax, base, az, bx, top, bz, bx, base, bz, ax, base, az, ax, top, az, bx, top, bz)
        shade(foot, 1, foot, foot, 1, 1)
      } else {
        positions.push(ax, base, az, bx, base, bz, bx, top, bz, ax, base, az, bx, top, bz, ax, top, az)
        shade(foot, foot, 1, foot, 1, 1)
      }
      for (let k = 0; k < 6; k++) normals.push(nx, 0, nz)
    }
  }

  const roof = (outer: Ring, holes: Ring[], top: number) => {
    triangles(toPoints(outer), holes.map(toPoints), (a, b, c) => {
      positions.push(a.x, top, a.y, b.x, top, b.y, c.x, top, c.y)
      normals.push(0, 1, 0, 0, 1, 0, 0, 1, 0)
      shade(1, 1, 1)
    })
  }

  for (const [tall, outer, ...holes] of data.buildings) {
    const k = reach(outer[0] / 10, outer[1] / 10)
    if (k < 0.04) continue
    const top = Math.max(1.5, (tall / 10) * k)
    walls(outer, 0, top, false)
    for (const hole of holes) walls(hole, 0, top, true)
    roof(outer, holes, top)
  }

  for (const [tall, from, outer] of data.parts ?? []) {
    const k = reach(outer[0] / 10, outer[1] / 10)
    if (k < 0.04) continue
    const base = (from / 10) * k
    const top = Math.max(base + 1, (tall / 10) * k)
    walls(outer, base, top, false)
    roof(outer, [], top)
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3))
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3))
  return geometry
}

/**
 * Terenul: straturi plate, colorate pe vârfuri, care se topesc în culoarea hârtiei spre margine.
 * Straturile se desenează în ordinea în care sunt adăugate, deci cele de mai jos din listă stau deasupra.
 */
function buildGround(data: CityData) {
  const positions: number[] = []
  const colors: number[] = []
  const paper = new Color(PAPER)
  const mixed = new Color()

  const vertex = (x: number, y: number, z: number, color: Color) => {
    mixed.copy(paper).lerp(color, reach(x, z))
    positions.push(x, y, z)
    colors.push(mixed.r, mixed.g, mixed.b)
  }

  const fill = (rings: Ring[] | undefined, y: number, hex: string) => {
    const color = new Color(hex)
    for (const ring of rings ?? []) {
      if (reach(ring[0] / 10, ring[1] / 10) < 0.02) continue
      triangles(toPoints(ring), [], (a, b, c) => {
        vertex(a.x, y, a.y, color)
        vertex(b.x, y, b.y, color)
        vertex(c.x, y, c.y, color)
      })
    }
  }

  /** O linie cu lățime: fâșie plată, cu colțurile îmbinate. */
  const strip = (line: number[], width: number, y: number, color: Color) => {
    const n = line.length / 2
    if (n < 2) return
    const left: number[] = []
    const right: number[] = []
    for (let i = 0; i < n; i++) {
      const x = line[i * 2]
      const z = line[i * 2 + 1]
      const px = line[Math.max(0, i - 1) * 2]
      const pz = line[Math.max(0, i - 1) * 2 + 1]
      const qx = line[Math.min(n - 1, i + 1) * 2]
      const qz = line[Math.min(n - 1, i + 1) * 2 + 1]
      // Normalele celor două segmente vecine; în colț, fâșia merge pe bisectoarea lor.
      let ax = -(z - pz)
      let az = x - px
      let bx = -(qz - z)
      let bz = qx - x
      const al = Math.hypot(ax, az) || 1
      const bl = Math.hypot(bx, bz) || 1
      ax /= al
      az /= al
      bx /= bl
      bz /= bl
      if (i === 0) [ax, az] = [bx, bz]
      if (i === n - 1) [bx, bz] = [ax, az]
      let mx = ax + bx
      let mz = az + bz
      const ml = Math.hypot(mx, mz) || 1
      mx /= ml
      mz /= ml
      const half = width / 2 / Math.max(0.5, mx * ax + mz * az)
      left.push(x + mx * half, z + mz * half)
      right.push(x - mx * half, z - mz * half)
    }
    for (let i = 0; i < n - 1; i++) {
      const a = i * 2
      const b = a + 2
      vertex(left[a], y, left[a + 1], color)
      vertex(left[b], y, left[b + 1], color)
      vertex(right[b], y, right[b + 1], color)
      vertex(left[a], y, left[a + 1], color)
      vertex(right[b], y, right[b + 1], color)
      vertex(right[a], y, right[a + 1], color)
    }
  }

  const strips = (lines: Line[] | undefined, y: number, hex: string) => {
    const color = new Color(hex)
    for (const line of lines ?? []) {
      if (reach(line[1] / 10, line[2] / 10) < 0.02) continue
      strip(
        line.slice(1).map((value) => value / 10),
        line[0] / 10,
        y,
        color,
      )
    }
  }

  fill(data.parks, 0.02, PARK)
  fill(data.lots, 0.03, STREET)
  strips(data.streets, 0.05, STREET)
  fill(data.courts, 0.055, COURT)
  fill(data.plazas, 0.06, PATH)
  strips(data.paths, 0.065, PATH)
  fill(data.water, 0.08, WATER)
  strips(data.rivers, 0.08, WATER)
  strips(data.hedges, 0.09, HEDGE)
  // Axa compoziției, peste toate celelalte.
  strip([UNIRII_AXIS.from[0], UNIRII_AXIS.from[1], UNIRII_AXIS.to[0], UNIRII_AXIS.to[1]], 4.5, 0.4, new Color(AXIS))

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3))
  return geometry
}

/** Înălțimea formei de copac, în unitățile ei: instanțele o întind până la înălțimea reală. */
const TREE_UNIT = 3.1

/** Un copac: coroană cu fețe plane și un trunchi scurt, colorate pe vârfuri. */
function treeGeometry() {
  const crown = new IcosahedronGeometry(1, 0)
  crown.scale(1, 1.2, 1)
  crown.translate(0, 1.9, 0)
  const trunk = new CylinderGeometry(0.11, 0.16, 0.9, 5).toNonIndexed()
  trunk.translate(0, 0.45, 0)
  const paint = (geometry: BufferGeometry, color: Color) => {
    const count = geometry.getAttribute('position').count
    const values: number[] = []
    for (let i = 0; i < count; i++) values.push(color.r, color.g, color.b)
    geometry.setAttribute('color', new Float32BufferAttribute(values, 3))
    geometry.deleteAttribute('uv')
  }
  // Culoarea instanței (verdele frunzelor) înmulțește culoarea vârfurilor: coroana rămâne verde, trunchiul iese gri-cald.
  paint(crown, new Color(1, 1, 1))
  paint(trunk, new Color(TRUNK))
  const merged = mergeGeometries([crown, trunk])
  crown.dispose()
  trunk.dispose()
  return merged
}

/** Toți copacii, într-un singur apel de desen. Înălțimea, rotirea și nuanța variază puțin de la unul la altul. */
function buildTrees(data: CityData, material: MeshLambertMaterial) {
  const spots = data.trees ?? []
  const kept: { x: number; z: number; k: number }[] = []
  for (let i = 0; i < spots.length; i += 2) {
    const x = spots[i] / 10
    const z = spots[i + 1] / 10
    const k = reach(x, z)
    if (k > 0.12) kept.push({ x, z, k })
  }
  if (kept.length === 0) return null

  const mesh = new InstancedMesh(treeGeometry(), material, kept.length)
  const matrix = new Matrix4()
  const position = new Vector3()
  const rotation = new Quaternion()
  const scale = new Vector3()
  const up = new Vector3(0, 1, 0)
  const leaf = new Color(LEAF)
  const tint = new Color()
  kept.forEach(({ x, z, k }, i) => {
    const height = MathUtils.lerp(6.5, 13.5, noise(x, z)) * k
    const girth = (height / TREE_UNIT) * MathUtils.lerp(0.95, 1.35, noise(x, z, 1))
    position.set(x, 0, z)
    rotation.setFromAxisAngle(up, noise(x, z, 2) * Math.PI * 2)
    scale.set(girth, height / TREE_UNIT, girth)
    mesh.setMatrixAt(i, matrix.compose(position, rotation, scale))
    mesh.setColorAt(i, tint.copy(leaf).multiplyScalar(MathUtils.lerp(0.9, 1.08, noise(x, z, 3))))
  })
  mesh.instanceMatrix.needsUpdate = true
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  // Instanțele acoperă tot orașul: fără o sferă de încadrare corectă, mesh-ul ar fi tăiat la marginea ecranului.
  mesh.computeBoundingSphere()
  return mesh
}

export type City = {
  group: Group
  /** `amount`: 1 = orașul ridicat, 0 = retras în hârtie. */
  update: (amount: number) => void
  dispose: () => void
}

export function buildCity(data: CityData): City {
  const group = new Group()
  group.position.y = PALACE.ground

  const wall = new MeshLambertMaterial({ color: WALL, transparent: true })
  const shaded = new MeshLambertMaterial({ color: WALL, transparent: true, vertexColors: true })
  const leaves = new MeshLambertMaterial({ transparent: true, vertexColors: true })
  const flat = new MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, side: DoubleSide })

  const ground = new Mesh(buildGround(data), flat)
  // Terenul stă sub umbra palatului, care se desenează pe un plan transparent propriu.
  ground.renderOrder = -2

  // Clădirile și copacii se ridică și coboară împreună, într-un grup scalat pe verticală.
  const risen = new Group()
  const buildings = new Mesh(buildBuildings(data), shaded)
  buildings.renderOrder = 1
  risen.add(buildings)
  if (data.cathedral) {
    const cathedral = new Mesh(buildCathedral(data.cathedral), wall)
    cathedral.renderOrder = 1
    risen.add(cathedral)
  }
  const trees = buildTrees(data, leaves)
  if (trees) {
    trees.renderOrder = 1
    risen.add(trees)
  }
  group.add(ground, risen)

  let shown = -1

  return {
    group,
    update(amount) {
      if (amount === shown) return
      shown = amount
      group.visible = amount > 0.004
      if (!group.visible) return
      risen.scale.y = Math.max(0.001, amount)
      wall.opacity = shaded.opacity = leaves.opacity = MathUtils.smoothstep(amount, 0, 0.3)
      flat.opacity = MathUtils.smoothstep(amount, 0, 0.45)
    },
    dispose() {
      for (const child of [ground, ...risen.children] as Mesh[]) child.geometry.dispose()
      wall.dispose()
      shaded.dispose()
      leaves.dispose()
      flat.dispose()
    },
  }
}
