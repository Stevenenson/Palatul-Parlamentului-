import {
  BoxGeometry,
  BufferGeometry,
  ConeGeometry,
  CylinderGeometry,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineDashedMaterial,
  LineSegments,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  Vector3,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { PALACE } from '../../three/palace/massing'
import { FOOTPRINT } from './rise'

/**
 * Locul de dinainte de palat, ca machetă topografică: dealul (cu curbe de nivel) și biserica
 * Mănăstirii Mihai Vodă pe el. Dealul coboară în teren când apar terasele; biserica rămâne
 * și, în capitolul despre demolări, se mută pe lângă palat, ca în 1985.
 *
 * Totul e schematic: forma dealului, locul și traseul bisericii nu sunt măsurate.
 */

const HILL_HEIGHT = 18
const CENTER = { x: 10, z: 0 }
const SIGMA = { x: 95, z: 85 }
const GROUND = PALACE.ground

/** Înălțimea dealului (0..1 din vârf) într-un punct. */
const bump = (x: number, z: number) =>
  Math.exp(-(((x - CENTER.x) / SIGMA.x) ** 2 + ((z - CENTER.z) / SIGMA.z) ** 2) / 2)

/** Unde stătea biserica și unde a ajuns: aproape 290 m spre est, mai jos. */
const FROM = new Vector3(70, 0, -22)
const TO = new Vector3(352, GROUND, 12)

function buildHill() {
  const geometry = new PlaneGeometry(560, 500, 96, 96)
  geometry.rotateX(-Math.PI / 2)
  const position = geometry.attributes.position
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i) + CENTER.x
    const z = position.getZ(i) + CENTER.z
    position.setXYZ(i, x, HILL_HEIGHT * bump(x, z), z)
  }
  geometry.computeVertexNormals()
  const mesh = new Mesh(geometry, new MeshStandardMaterial({ color: '#f2f0eb', roughness: 1 }))
  mesh.castShadow = true
  mesh.receiveShadow = true

  // Curbele de nivel, din 3 în 3 metri: elipsele pe care funcția dealului are aceeași înălțime.
  const positions: number[] = []
  for (let level = 3; level < HILL_HEIGHT; level += 3) {
    const r = Math.sqrt(2 * Math.log(HILL_HEIGHT / level))
    const steps = 96
    for (let s = 0; s < steps; s++) {
      const a0 = (s / steps) * Math.PI * 2
      const a1 = ((s + 1) / steps) * Math.PI * 2
      positions.push(
        CENTER.x + Math.cos(a0) * r * SIGMA.x, level + 0.12, CENTER.z + Math.sin(a0) * r * SIGMA.z,
        CENTER.x + Math.cos(a1) * r * SIGMA.x, level + 0.12, CENTER.z + Math.sin(a1) * r * SIGMA.z,
      )
    }
  }
  const lines = new BufferGeometry()
  lines.setAttribute('position', new Float32BufferAttribute(positions, 3))
  const contours = new LineSegments(
    lines,
    new LineBasicMaterial({ color: '#8d877b', transparent: true, opacity: 0.55 }),
  )

  // Conturul viitoarei clădiri, trasat pe deal cu linie punctată, ca pe un plan de concurs.
  const outline = new LineSegments(
    draped([FOOTPRINT, { x0: -50, x1: 50, z0: 120, z1: 126 }]),
    new LineDashedMaterial({ color: '#2b2d31', dashSize: 4, gapSize: 3, transparent: true, opacity: 0 }),
  )
  outline.computeLineDistances()
  outline.visible = false

  const group = new Group()
  group.add(mesh, contours, outline)
  return { group, outline }
}

/** Contururile unor dreptunghiuri, așezate pe suprafața dealului. */
function draped(rects: { x0: number; x1: number; z0: number; z1: number }[]) {
  const positions: number[] = []
  const at = (x: number, z: number) => [x, HILL_HEIGHT * bump(x, z) + 0.35, z]
  for (const r of rects) {
    const corners = [
      [r.x0, r.z0],
      [r.x1, r.z0],
      [r.x1, r.z1],
      [r.x0, r.z1],
    ]
    for (let i = 0; i < 4; i++) {
      const [ax, az] = corners[i]
      const [bx, bz] = corners[(i + 1) % 4]
      const steps = Math.max(1, Math.round(Math.hypot(bx - ax, bz - az) / 6))
      for (let s = 0; s < steps; s++) {
        const p0 = at(MathUtils.lerp(ax, bx, s / steps), MathUtils.lerp(az, bz, s / steps))
        const p1 = at(MathUtils.lerp(ax, bx, (s + 1) / steps), MathUtils.lerp(az, bz, (s + 1) / steps))
        positions.push(...p0, ...p1)
      }
    }
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  return geometry
}

/** Biserica triconcă, cu turla pe naos, și clopotnița de la intrare. Altarul privește spre est (+X). */
function buildChurch() {
  const walls = mergeGeometries([
    box(26, 10, 10, -3, 5, 0),
    half(5.2, 9, 0, -5, Math.PI / 2),
    half(5.2, 9, 0, 5, -Math.PI / 2),
    half(5.6, 9, 10, 0, 0),
    box(6, 14, 6, 0, 7, 0),
    // Clopotnița, la vest.
    box(6, 16, 6, -26, 8, 0),
  ])
  const roofs = mergeGeometries([
    roof(28, 12, 3.2, -3, 10),
    cone(5.2, 5, 0, 14, 0),
    cone(4.4, 4, -26, 18, 0),
  ])
  const group = new Group()
  const wall = new Mesh(walls, new MeshStandardMaterial({ color: '#f5f3ee', roughness: 0.93 }))
  const top = new Mesh(roofs, new MeshStandardMaterial({ color: '#b9b1a2', roughness: 0.9 }))
  for (const mesh of [wall, top]) {
    mesh.castShadow = true
    mesh.receiveShadow = true
  }
  group.add(wall, top)
  // Puțin mai mare decât în realitate, ca să se vadă de la înălțimea de la care privim dealul.
  group.scale.setScalar(1.35)
  return group
}

function box(w: number, h: number, d: number, x: number, y: number, z: number) {
  const g = new BoxGeometry(w, h, d)
  g.translate(x, y, z)
  return g
}

/** O absidă: jumătate de cilindru lipită de naos; fără rotire, se bombează spre +X. */
function half(radius: number, height: number, x: number, z: number, yaw: number) {
  const g = new CylinderGeometry(radius, radius, height, 20, 1, false, 0, Math.PI)
  g.rotateY(yaw)
  g.translate(x, height / 2, z)
  return g
}

function cone(radius: number, height: number, x: number, y: number, z: number) {
  const g = new ConeGeometry(radius, height, 8)
  g.translate(x, y + height / 2, z)
  return g
}

/** Acoperișul în două ape al naosului. */
function roof(length: number, width: number, height: number, x: number, y: number) {
  const g = new CylinderGeometry(0.01, width / 2, height, 4, 1)
  g.rotateY(Math.PI / 4)
  g.scale(length / width, 1, 1)
  g.translate(x, y + height / 2, 0)
  return g
}

export function buildOldSite() {
  const { group: hill, outline } = buildHill()
  hill.position.y = GROUND - 0.04
  const church = buildChurch()
  const group = new Group()
  group.add(hill, church)

  const place = new Vector3()

  /**
   * `hill`: 0..1, cât din deal mai există. `move`: 0..1, cât din drum a făcut biserica.
   * `floor`: înălțimea teraselor deja ridicate sub biserică (sub teren cât nu există).
   */
  const set = (amount: { hill: number; move: number; floor: number; outline: number; visible: boolean }) => {
    group.visible = amount.visible
    ;(outline.material as LineDashedMaterial).opacity = 0.8 * amount.outline
    outline.visible = amount.outline > 0.005
    hill.visible = amount.hill > 0.002
    hill.scale.y = Math.max(0.002, amount.hill)
    const onHill = GROUND + HILL_HEIGHT * bump(FROM.x, FROM.z) * amount.hill
    const start = Math.max(onHill, Math.min(amount.floor, 0))
    const m = MathUtils.smootherstep(amount.move, 0, 1)
    place.lerpVectors(FROM, TO, m)
    // Coboară abia la capătul drumului, după ce iese de pe terase.
    place.y = MathUtils.lerp(start, TO.y, MathUtils.smoothstep(m, 0.55, 0.85))
    church.position.copy(place)
  }

  return {
    group,
    set,
    dispose: () => {
      group.traverse((object) => {
        const mesh = object as Mesh
        mesh.geometry?.dispose()
        const material = mesh.material as MeshStandardMaterial | undefined
        material?.dispose()
      })
    },
  }
}
