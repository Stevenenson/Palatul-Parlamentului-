import {
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  ShapeUtils,
  Vector2,
} from 'three'
import { UNIRII_AXIS } from '../../content/city'
import { PAPER } from '../Lights'
import { PALACE } from '../palace/massing'
import { type CathedralSpot, buildCathedral } from './buildCathedral'

/**
 * Macheta orașului din jurul palatului: clădirile ca volume albe, parcurile, apa și bulevardele
 * ca suprafețe plate, în tonuri stinse. Datele vin din OpenStreetMap, prin
 * `scripts/fetch-city.mjs`, deja aduse în sistemul machetei (zecimi de metru, +Z est, +X nord).
 *
 * Totul se desenează din câteva apeluri: un mesh pentru toate clădirile, unul pentru catedrală
 * și unul pentru teren. Spre margine, clădirile scad și terenul se topește în hârtie, ca macheta
 * să nu aibă o muchie tăiată.
 */

/** Un contur, ca șir plat `[x, z, x, z, …]`, în zecimi de metru. */
type Ring = number[]

export type CityData = {
  source: string
  cathedral: CathedralSpot | null
  /** `[înălțime, contur exterior, …curți]` */
  buildings: [number, ...Ring[]][]
  parks: Ring[]
  water: Ring[]
  /** `[lățime, x, z, x, z, …]` */
  rivers: number[][]
  streets: number[][]
}

const WALL = '#f5f3ee'
const STREET = '#e8e4db'
const PARK = '#dde3d0'
const WATER = '#c5d5dc'
const AXIS = '#c8452b'

/** Elipsa machetei: în interiorul ei orașul e întreg, spre marginea ei se stinge. */
const EXTENT = { x: 0, z: 190, rx: 1080, rz: 1400 }

/** 1 în mijlocul machetei, 0 la marginea ei. */
function reach(x: number, z: number) {
  const d = Math.hypot((x - EXTENT.x) / EXTENT.rx, (z - EXTENT.z) / EXTENT.rz)
  return 1 - MathUtils.smoothstep(d, 0.7, 1)
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

  const walls = (ring: Ring, top: number, hole: boolean) => {
    const sign = (signedArea(ring) > 0 ? 1 : -1) * (hole ? -1 : 1)
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
        positions.push(ax, 0, az, bx, top, bz, bx, 0, bz, ax, 0, az, ax, top, az, bx, top, bz)
        shade(FOOT, 1, FOOT, FOOT, 1, 1)
      } else {
        positions.push(ax, 0, az, bx, 0, bz, bx, top, bz, ax, 0, az, bx, top, bz, ax, top, az)
        shade(FOOT, FOOT, 1, FOOT, 1, 1)
      }
      for (let k = 0; k < 6; k++) normals.push(nx, 0, nz)
    }
  }

  for (const [tall, outer, ...holes] of data.buildings) {
    const k = reach(outer[0] / 10, outer[1] / 10)
    if (k < 0.04) continue
    const top = Math.max(1.5, (tall / 10) * k)
    walls(outer, top, false)
    for (const hole of holes) walls(hole, top, true)
    triangles(toPoints(outer), holes.map(toPoints), (a, b, c) => {
      positions.push(a.x, top, a.y, b.x, top, b.y, c.x, top, c.y)
      normals.push(0, 1, 0, 0, 1, 0, 0, 1, 0)
      shade(1, 1, 1)
    })
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3))
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3))
  return geometry
}

/** Terenul: straturi plate, colorate pe vârfuri, care se topesc în culoarea hârtiei spre margine. */
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

  const fill = (rings: Ring[], y: number, hex: string) => {
    const color = new Color(hex)
    for (const ring of rings) {
      if (reach(ring[0] / 10, ring[1] / 10) < 0.02) continue
      triangles(toPoints(ring), [], (a, b, c) => {
        vertex(a.x, y, a.y, color)
        vertex(b.x, y, b.y, color)
        vertex(c.x, y, c.y, color)
      })
    }
  }

  /** O linie cu lățime: fâșie plată, cu colțurile îmbinate. */
  const strip = (line: number[], width: number, y: number, hex: string) => {
    const color = new Color(hex)
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

  const meters = (line: number[]) => line.slice(1).map((value) => value / 10)

  fill(data.parks, 0.02, PARK)
  for (const street of data.streets) strip(meters(street), street[0] / 10, 0.05, STREET)
  fill(data.water, 0.08, WATER)
  for (const river of data.rivers) strip(meters(river), river[0] / 10, 0.08, WATER)
  // Axa compoziției, peste toate celelalte.
  strip([UNIRII_AXIS.from[0], UNIRII_AXIS.from[1], UNIRII_AXIS.to[0], UNIRII_AXIS.to[1]], 4.5, 0.4, AXIS)

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3))
  return geometry
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
  const flat = new MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, side: DoubleSide })

  const ground = new Mesh(buildGround(data), flat)
  // Terenul stă sub umbra palatului, care se desenează pe un plan transparent propriu.
  ground.renderOrder = -2

  // Clădirile se ridică și coboară împreună, într-un grup scalat pe verticală.
  const risen = new Group()
  const buildings = new Mesh(buildBuildings(data), shaded)
  buildings.renderOrder = 1
  risen.add(buildings)
  if (data.cathedral) {
    const cathedral = new Mesh(buildCathedral(data.cathedral), wall)
    cathedral.renderOrder = 1
    risen.add(cathedral)
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
      wall.opacity = shaded.opacity = MathUtils.smoothstep(amount, 0, 0.3)
      flat.opacity = MathUtils.smoothstep(amount, 0, 0.45)
    },
    dispose() {
      for (const child of [ground, ...risen.children] as Mesh[]) child.geometry.dispose()
      wall.dispose()
      shaded.dispose()
      flat.dispose()
    },
  }
}
