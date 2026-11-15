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
 * Locul de dinainte de palat, ca machetă topografică, cu curbe de nivel: Dealul Arsenalului,
 * pe care stă azi palatul, și pintenul lui dinspre nord, Dealul Mihai Vodă, unde e azi Parcul
 * Izvor, cu biserica mănăstirii în incinta ei. Dealul mare coboară în terase când începe
 * șantierul; biserica se mută în 1985 cu 289 m spre est și 6,2 m mai jos, până în strada
 * Sapienței, iar pintenul dispare după ea.
 *
 * Axele: fațada principală privește spre est (+Z), deci +X e nordul. Locul de azi al bisericii
 * vine din OpenStreetMap (biserica „Sfântul Ierarh Nicolae” – Mihai Vodă), iar locul vechi e la
 * 289 m spre vest de el, cum spun sursele. Forma dealurilor e schematică, nu măsurată.
 */

const GROUND = PALACE.ground
const HEIGHT = 18

const MAIN = { x: 10, z: 0, sx: 95, sz: 85, peak: 1 }
/** Unde a ajuns biserica (strada Sapienței, din OpenStreetMap) și unde stătea: 289 m mai la vest. */
const TO = new Vector3(483, GROUND, 434)
/** Estul geografic, în axele machetei: fațada palatului e rotită cu 3,6° față de est. */
const EAST = new Vector3(0.062, 0, 0.998)
const FROM = TO.clone().addScaledVector(EAST, -289).setY(0)
const SPUR = { x: FROM.x, z: FROM.z, sx: 70, sz: 62, peak: 0.8 }
/** Șaua dintre cele două dealuri: face din Dealul Mihai Vodă un pinten al Dealului Arsenalului. */
const SADDLE = { x: 250, z: 80, sx: 130, sz: 70, peak: 0.42 }

const gauss = (b: typeof MAIN, x: number, z: number) =>
  b.peak * Math.exp(-(((x - b.x) / b.sx) ** 2 + ((z - b.z) / b.sz) ** 2) / 2)

/** Cât din fiecare deal mai există (0..1). */
const amounts = { main: 1, spur: 1 }

/** Înălțimea terenului deasupra solului într-un punct, în metri. */
const heightAt = (x: number, z: number) =>
  HEIGHT *
  Math.max(
    gauss(MAIN, x, z) * amounts.main,
    gauss(SPUR, x, z) * amounts.spur,
    gauss(SADDLE, x, z) * Math.min(amounts.main, amounts.spur),
  )

/** Zona în care calculăm curbele de nivel. */
const AREA = { x0: -260, x1: 640, z0: -260, z1: 560, n: 160 }

/**
 * Curbele de nivel, din 3 în 3 metri, prin „marching squares” pe o grilă: în fiecare celulă,
 * segmentul trece pe unde muchiile ei traversează nivelul.
 */
function contourPositions(): number[] {
  const { x0, x1, z0, z1, n } = AREA
  const dx = (x1 - x0) / n
  const dz = (z1 - z0) / n
  const grid = new Float32Array((n + 1) * (n + 1))
  for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) grid[j * (n + 1) + i] = heightAt(x0 + i * dx, z0 + j * dz)
  const out: number[] = []
  for (let level = 3; level < HEIGHT; level += 3) {
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        const a = grid[j * (n + 1) + i]
        const b = grid[j * (n + 1) + i + 1]
        const c = grid[(j + 1) * (n + 1) + i + 1]
        const d = grid[(j + 1) * (n + 1) + i]
        const points: number[] = []
        const edge = (h0: number, h1: number, ax: number, az: number, bx: number, bz: number) => {
          if ((h0 < level) === (h1 < level)) return
          const f = (level - h0) / (h1 - h0)
          points.push(x0 + (ax + (bx - ax) * f) * dx, z0 + (az + (bz - az) * f) * dz)
        }
        edge(a, b, i, j, i + 1, j)
        edge(b, c, i + 1, j, i + 1, j + 1)
        edge(c, d, i + 1, j + 1, i, j + 1)
        edge(d, a, i, j + 1, i, j)
        for (let p = 0; p + 3 < points.length; p += 4) {
          out.push(points[p], level + 0.15, points[p + 1], points[p + 2], level + 0.15, points[p + 3])
        }
      }
    }
  }
  return out
}

/** Contururi de dreptunghiuri, așezate pe suprafața terenului. */
function draped(rects: { x0: number; x1: number; z0: number; z1: number }[]) {
  const positions: number[] = []
  const at = (x: number, z: number) => [x, heightAt(x, z) + 0.35, z]
  for (const r of rects) {
    const corners = [
      [r.x0, r.z0],
      [r.x1, r.z0],
      [r.x1, r.z1],
      [r.x0, r.z1],
    ]
    for (let k = 0; k < 4; k++) {
      const [ax, az] = corners[k]
      const [bx, bz] = corners[(k + 1) % 4]
      const steps = Math.max(1, Math.round(Math.hypot(bx - ax, bz - az) / 6))
      for (let s = 0; s < steps; s++) {
        positions.push(
          ...at(MathUtils.lerp(ax, bx, s / steps), MathUtils.lerp(az, bz, s / steps)),
          ...at(MathUtils.lerp(ax, bx, (s + 1) / steps), MathUtils.lerp(az, bz, (s + 1) / steps)),
        )
      }
    }
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  return geometry
}

function dashed(geometry: BufferGeometry) {
  const lines = new LineSegments(
    geometry,
    new LineDashedMaterial({ color: '#2b2d31', dashSize: 4, gapSize: 3, transparent: true, opacity: 0 }),
  )
  lines.computeLineDistances()
  lines.visible = false
  return lines
}

/** Biserica triconcă, cu turla pe naos și clopotnița la vest. Altarul privește spre est. */
function buildChurch() {
  // Construită cu altarul spre +X, apoi rotită: estul e +Z.
  const walls = mergeGeometries([
    box(26, 10, 10, -3, 5, 0),
    half(5.2, 9, 0, -5, Math.PI / 2),
    half(5.2, 9, 0, 5, -Math.PI / 2),
    half(5.6, 9, 10, 0, 0),
    box(6, 14, 6, 0, 7, 0),
    box(6, 16, 6, -26, 8, 0),
  ])
  const roofs = mergeGeometries([roof(28, 12, 3.2, -3, 10), cone(5.2, 5, 0, 14, 0), cone(4.4, 4, -26, 18, 0)])
  const wall = new Mesh(walls, new MeshStandardMaterial({ color: '#f5f3ee', roughness: 0.93 }))
  const top = new Mesh(roofs, new MeshStandardMaterial({ color: '#b9b1a2', roughness: 0.9 }))
  for (const mesh of [wall, top]) {
    mesh.castShadow = true
    mesh.receiveShadow = true
  }
  const group = new Group()
  group.add(wall, top)
  group.rotation.y = -Math.PI / 2
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

/** Acoperișul naosului, în patru ape. */
function roof(length: number, width: number, height: number, x: number, y: number) {
  const g = new CylinderGeometry(0.01, width / 2, height, 4, 1)
  g.rotateY(Math.PI / 4)
  g.scale(length / width, 1, 1)
  g.translate(x, y + height / 2, 0)
  return g
}

export type OldSiteState = {
  /** 0..1: cât din Dealul Arsenalului mai există. */
  main: number
  /** 0..1: cât din pintenul cu mănăstirea mai există. */
  spur: number
  /** 0..1: cât din drum a făcut biserica. */
  move: number
  /** 0..1: conturul punctat al viitoarei clădiri. */
  outline: number
  /** Biserica se vede (se ascunde cât sare de la locul nou la cel vechi). */
  church: boolean
}

export function buildOldSite() {
  // Terenul: o foaie mare, opacă doar unde se ridică, ca marginile să nu se vadă pe hârtie.
  const terrain = new PlaneGeometry(AREA.x1 - AREA.x0, AREA.z1 - AREA.z0, 120, 120)
  terrain.rotateX(-Math.PI / 2)
  terrain.translate((AREA.x0 + AREA.x1) / 2, 0, (AREA.z0 + AREA.z1) / 2)
  const count = terrain.attributes.position.count
  terrain.setAttribute('color', new Float32BufferAttribute(new Float32Array(count * 4).fill(1), 4))
  const hill = new Mesh(
    terrain,
    new MeshStandardMaterial({ color: '#f2f0eb', roughness: 1, vertexColors: true, transparent: true }),
  )
  hill.castShadow = true
  hill.receiveShadow = true

  const contours = new LineSegments(
    new BufferGeometry(),
    new LineBasicMaterial({ color: '#8d877b', transparent: true, opacity: 0.55 }),
  )

  // Conturul viitoarei clădiri, trasat cu linie punctată ca pe un plan de concurs.
  const outline = dashed(draped([FOOTPRINT, { x0: -50, x1: 50, z0: 120, z1: 126 }]))
  // Incinta mănăstirii, cu zidul dărâmat în 1985.
  const precinct = dashed(draped([{ x0: FROM.x - 34, x1: FROM.x + 34, z0: FROM.z - 30, z1: FROM.z + 30 }]))

  const land = new Group()
  land.position.y = GROUND - 0.04
  land.add(hill, contours, outline, precinct)

  const church = buildChurch()
  const group = new Group()
  group.add(land, church)

  const reshape = () => {
    const position = terrain.attributes.position
    const color = terrain.attributes.color
    for (let i = 0; i < count; i++) {
      const h = heightAt(position.getX(i), position.getZ(i))
      position.setY(i, h)
      color.setW(i, MathUtils.smoothstep(h, 0.05, 2.2))
    }
    position.needsUpdate = true
    color.needsUpdate = true
    terrain.computeVertexNormals()
    contours.geometry.dispose()
    const lines = new BufferGeometry()
    lines.setAttribute('position', new Float32BufferAttribute(contourPositions(), 3))
    contours.geometry = lines
  }

  let last = { main: -1, spur: -1 }

  const before = new Vector3()

  /** Întoarce `true` dacă s-a schimbat ceva care aruncă umbră (terenul sau locul bisericii). */
  const set = (state: OldSiteState) => {
    let changed = church.visible !== state.church
    church.visible = state.church
    before.copy(church.position)
    // Terenul se recalculează doar când se schimbă, nu la fiecare cadru.
    if (Math.abs(state.main - last.main) > 0.002 || Math.abs(state.spur - last.spur) > 0.002) {
      amounts.main = state.main
      amounts.spur = state.spur
      last = { main: state.main, spur: state.spur }
      reshape()
      changed = true
    }
    land.visible = state.main > 0.002 || state.spur > 0.002
    const outlineMaterial = outline.material as LineDashedMaterial
    outlineMaterial.opacity = 0.8 * state.outline
    outline.visible = state.outline > 0.005
    const wall = 1 - MathUtils.smoothstep(state.move, 0, 0.12)
    ;(precinct.material as LineDashedMaterial).opacity = 0.7 * wall * Math.min(1, state.spur)
    precinct.visible = wall > 0.005

    const m = MathUtils.smootherstep(state.move, 0, 1)
    church.position.lerpVectors(FROM, TO, m)
    // Biserica stă pe vârful pintenului și coboară pe drum până la nivelul străzii.
    const start = GROUND + heightAt(FROM.x, FROM.z)
    church.position.y = MathUtils.lerp(start, TO.y, m)
    return changed || before.distanceToSquared(church.position) > 1e-4
  }

  return {
    group,
    set,
    dispose: () => {
      group.traverse((object) => {
        const mesh = object as Mesh
        mesh.geometry?.dispose()
        ;(mesh.material as MeshStandardMaterial | undefined)?.dispose()
      })
    },
  }
}
