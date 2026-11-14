import {
  BoxGeometry,
  type BufferGeometry,
  CircleGeometry,
  CylinderGeometry,
  LatheGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  type Material,
  PlaneGeometry,
  Shape,
  ShapeGeometry,
  SphereGeometry,
  TorusGeometry,
  Vector2,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/**
 * Trusa comună a sălilor: materiale de machetă și piese mici de geometrie.
 * Fiecare sală își adună piesele pe materiale și le unește, deci ajunge la câteva
 * apeluri de desenare indiferent câte coloane sau scaune are.
 */

export type Side = '-x' | '+x' | '-z' | '+z'

/** Materialele sunt comune tuturor sălilor; doar accentul diferă de la una la alta. */
export const MATERIALS = {
  /** Pereți și tavane: se văd doar din interior, ca de afară să poți privi în sală ca într-o machetă secționată. */
  shell: new MeshStandardMaterial({ color: '#f4f2ec', roughness: 0.92 }),
  floor: new MeshStandardMaterial({ color: '#ece8df', roughness: 0.7 }),
  inlay: new MeshStandardMaterial({ color: '#d9d3c6', roughness: 0.7 }),
  trim: new MeshStandardMaterial({ color: '#fbfaf7', roughness: 0.88 }),
  wood: new MeshStandardMaterial({ color: '#cfb894', roughness: 0.72 }),
  woodDark: new MeshStandardMaterial({ color: '#b39a73', roughness: 0.7 }),
  gold: new MeshStandardMaterial({ color: '#d9c28c', roughness: 0.45, metalness: 0.35 }),
  /** Ferestre, luminatoare și becuri: lumină proprie, fără umbrire. */
  glow: new MeshBasicMaterial({ color: '#fffaf0' }),
  sky: new MeshBasicMaterial({ color: '#eef4f7' }),
  /** Soclurile și ramele pe care stau hologramele. */
  mount: new MeshStandardMaterial({ color: '#2b2f36', roughness: 0.55, metalness: 0.2 }),
}

export type MaterialKey = keyof typeof MATERIALS | 'accent'

/** Adună geometrii pe materiale și le transformă la final în câte un mesh pe material. */
export class Parts {
  private readonly bins = new Map<MaterialKey, BufferGeometry[]>()

  add(material: MaterialKey, ...geometries: BufferGeometry[]) {
    const bin = this.bins.get(material) ?? []
    bin.push(...geometries)
    this.bins.set(material, bin)
  }

  build(accent: Material): Mesh[] {
    const meshes: Mesh[] = []
    for (const [key, geometries] of this.bins) {
      // Unirea cere aceleași atribute peste tot; piesele au toate poziție, normală și uv.
      const merged = mergeGeometries(geometries.map((g) => (g.index ? g.toNonIndexed() : g)))
      for (const geometry of geometries) geometry.dispose()
      const mesh = new Mesh(merged, key === 'accent' ? accent : MATERIALS[key])
      mesh.name = key
      meshes.push(mesh)
    }
    return meshes
  }
}

export function box(w: number, h: number, d: number, x: number, y: number, z: number) {
  const geometry = new BoxGeometry(w, h, d)
  geometry.translate(x, y + h / 2, z)
  return geometry
}

/** Cilindru cu baza la înălțimea `y`. Cu 8 segmente devine coloană octogonală. */
export function cylinder(radius: number, h: number, x: number, y: number, z: number, segments = 20) {
  const geometry = new CylinderGeometry(radius, radius, h, segments)
  geometry.translate(x, y + h / 2, z)
  return geometry
}

/** Coloană cu bază și capitel. */
export function column(radius: number, h: number, x: number, z: number, segments = 20) {
  const r = radius
  return [
    box(r * 2.9, 0.5, r * 2.9, x, 0, z),
    cylinder(r * 1.2, 0.3, x, 0.5, z, segments),
    cylinder(r, h - 1.7, x, 0.8, z, segments),
    cylinder(r * 1.25, 0.35, x, h - 0.9, z, segments),
    box(r * 2.8, 0.55, r * 2.8, x, h - 0.55, z),
  ]
}

/** Pardoseală: plan orizontal care privește în sus. */
export function floorPlane(w: number, d: number, x = 0, y = 0, z = 0) {
  const geometry = new PlaneGeometry(w, d)
  geometry.rotateX(-Math.PI / 2)
  geometry.translate(x, y, z)
  return geometry
}

/** Disc orizontal care privește în sus (covor rotund, blat). */
export function floorDisc(radius: number, x: number, y: number, z: number, segments = 64) {
  const geometry = new CircleGeometry(radius, segments)
  geometry.rotateX(-Math.PI / 2)
  geometry.translate(x, y, z)
  return geometry
}

/** Tavan: plan orizontal care privește în jos, deci invizibil de deasupra. */
export function ceilingPlane(w: number, d: number, x: number, y: number, z: number) {
  const geometry = new PlaneGeometry(w, d)
  geometry.rotateX(Math.PI / 2)
  geometry.translate(x, y, z)
  return geometry
}

/** Dreptunghi cu arc semicircular deasupra, cu baza în origine. */
function archShape(w: number, h: number) {
  const r = w / 2
  const straight = Math.max(h - r, 0.1)
  const shape = new Shape()
  shape.moveTo(-r, 0)
  shape.lineTo(r, 0)
  shape.lineTo(r, straight)
  shape.absarc(0, straight, r, 0, Math.PI, false)
  shape.lineTo(-r, 0)
  return new ShapeGeometry(shape, 14)
}

/**
 * Așază un panou plat pe un perete al sălii, cu fața spre interior.
 * `u` e poziția de-a lungul peretelui, `y` baza panoului, `inset` distanța față de perete.
 */
export function onWall(
  side: Side,
  length: number,
  depth: number,
  u: number,
  y: number,
  w: number,
  h: number,
  options: { arched?: boolean; inset?: number } = {},
) {
  const inset = options.inset ?? 0.05
  const geometry = options.arched ? archShape(w, h) : new PlaneGeometry(w, h).translate(0, h / 2, 0)
  if (side === '-z') geometry.translate(u, y, -depth / 2 + inset)
  else if (side === '+z') geometry.rotateY(Math.PI).translate(u, y, depth / 2 - inset)
  else if (side === '-x') geometry.rotateY(Math.PI / 2).translate(-length / 2 + inset, y, u)
  else geometry.rotateY(-Math.PI / 2).translate(length / 2 - inset, y, u)
  return geometry
}

/** O cutie lipită de perete (pilastru, lambriu, balcon), ieșită `out` metri spre interior. */
export function wallBox(
  side: Side,
  length: number,
  depth: number,
  u: number,
  y: number,
  w: number,
  h: number,
  out: number,
) {
  if (side === '-z') return box(w, h, out, u, y, -depth / 2 + out / 2)
  if (side === '+z') return box(w, h, out, u, y, depth / 2 - out / 2)
  if (side === '-x') return box(out, h, w, -length / 2 + out / 2, y, u)
  return box(out, h, w, length / 2 - out / 2, y, u)
}

/** Cei patru pereți, văzuți doar din interior. */
export function walls(length: number, height: number, depth: number) {
  return [
    onWall('-z', length, depth, 0, 0, length, height, { inset: 0 }),
    onWall('+z', length, depth, 0, 0, length, height, { inset: 0 }),
    onWall('-x', length, depth, 0, 0, depth, height, { inset: 0 }),
    onWall('+x', length, depth, 0, 0, depth, height, { inset: 0 }),
  ]
}

/** Candelabru: tijă, două cercuri și becuri. Întoarce separat partea aurie și becurile. */
export function chandelier(x: number, top: number, z: number, radius: number, drop: number) {
  const gold: BufferGeometry[] = []
  const bulbs: BufferGeometry[] = []
  gold.push(cylinder(0.05, drop, x, top - drop, z, 6))
  const rings: [number, number][] = [
    [radius, top - drop],
    [radius * 0.6, top - drop + radius * 0.45],
  ]
  for (const [r, y] of rings) {
    const ring = new TorusGeometry(r, Math.max(0.05, radius * 0.045), 6, 28)
    ring.rotateX(Math.PI / 2)
    ring.translate(x, y, z)
    gold.push(ring)
    const count = Math.max(6, Math.round(r * 9))
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2
      const bulb = new SphereGeometry(Math.max(0.09, radius * 0.085), 8, 6)
      bulb.translate(x + Math.cos(a) * r, y + 0.16, z + Math.sin(a) * r)
      bulbs.push(bulb)
    }
  }
  return { gold, bulbs }
}

/** Inel plin (blatul unei mese rotunde), între două raze și două înălțimi. */
export function ring(inner: number, outer: number, y0: number, y1: number, segments = 72) {
  const profile = [
    new Vector2(inner, y0),
    new Vector2(outer, y0),
    new Vector2(outer, y1),
    new Vector2(inner, y1),
    new Vector2(inner, y0),
  ]
  return new LatheGeometry(profile, segments)
}
