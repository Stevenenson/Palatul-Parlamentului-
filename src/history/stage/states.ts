import { MathUtils, Vector3 } from 'three'
import { type Pose, blendPose } from '../../three/poses'

/**
 * Ce arată macheta la fiecare punct al poveștii. Indicele 0 e începutul paginii, apoi câte
 * unul pe capitol, în ordinea din `HISTORY_CHAPTERS`.
 *
 * Camera trece la poza capitolului următor în ultima parte a capitolului curent, ca la
 * titlul lui să fie deja pe loc. Înălțimea tăieturii, conturul trasat pe teren și cotele
 * au puncte-cheie proprii, pe aceeași axă a lecturii.
 */

const v = (x: number, y: number, z: number) => new Vector3(x, y, z)
const pose = (position: Vector3, target: Vector3, fov = 30): Pose => ({ position, target, fov })

/** Peste vârful turnului: nimic nu e tăiat. */
export const CLIP_TOP = 130
/** Sub teren: din palat nu se vede nimic, doar planul de sit. */
export const CLIP_NONE = -9.6
/** Deasupra teraselor: dealul e gata, clădirea încă nu. */
export const CLIP_TERRACES = 0.06

export const POSES: Pose[] = [
  // Începutul paginii: palatul întreg, ca în tur.
  pose(v(-400, 150, 640), v(0, 24, 4)),
  // I. Dealul de dinainte: dealul și pintenul cu mănăstirea, dinspre sud-est.
  pose(v(-300, 300, 700), v(100, 0, 125)),
  // II. Cutremurul și concursul: conturul viitoarei clădiri, aproape de plan.
  pose(v(-150, 470, 330), v(0, -9, 10)),
  // III. Piatra de temelie: terasele, mai de jos.
  pose(v(-420, 200, 560), v(0, -6, 40)),
  // IV. Demolările: ca un plan, de sus, cu terasele și drumul bisericii spre nord-est.
  pose(v(120, 1300, 520), v(120, -6, 160)),
  // V. Șantierul: trei sferturi, cât să se vadă clădirea crescând.
  pose(v(-430, 190, 600), v(0, 26, 0)),
  // VI. După revoluție: fațada, de jos, din axul bulevardului.
  pose(v(0, 28, 600), v(0, 34, 0), 32),
  // VII. Cât de mare e: de sus, cu cotele pe teren.
  pose(v(-140, 600, 360), v(0, 0, 14)),
  // VIII. Azi: vederea din tur.
  pose(v(-380, 123, 627), v(0, 27, 8)),
]

/** Puncte-cheie [poziție de citire, valoare]; între ele, interpolare liniară. */
type Keys = [number, number][]

function at(keys: Keys, t: number) {
  if (t <= keys[0][0]) return keys[0][1]
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1] = keys[i]
    if (t <= t1) {
      const [t0, v0] = keys[i - 1]
      return MathUtils.lerp(v0, v1, (t - t0) / Math.max(1e-6, t1 - t0))
    }
  }
  return keys[keys.length - 1][1]
}

const CLIP: Keys = [
  [0.55, CLIP_TOP],
  // Spre primul capitol, palatul coboară înapoi în teren: povestea începe înainte de el.
  [0.98, CLIP_NONE],
  [3.12, CLIP_NONE],
  [3.7, CLIP_TERRACES],
  [5.08, CLIP_TERRACES],
  // Șantierul: clădirea crește odată cu lectura capitolului, până la vârful turnului.
  [5.86, 90],
  [5.9, CLIP_TOP],
]

/** Dealul Arsenalului: apare când palatul coboară în teren și se topește în terase. */
const HILL: Keys = [
  [0.55, 0],
  [0.95, 1],
  [3.05, 1],
  [3.6, 0],
]

/** Pintenul cu mănăstirea: rămâne până după mutarea bisericii, în 1985. */
const SPUR: Keys = [
  [0.55, 0],
  [0.95, 1],
  [4.9, 1],
  [5.15, 0],
]

/** Drumul bisericii Mihai Vodă, în capitolul despre demolări. */
const MOVE: Keys = [
  [4.3, 0],
  [4.85, 1],
]

/** Planul de sit (piața, bulevardul) e al centrului civic nou: apare cu terasele. */
const SITE: Keys = [
  [3.3, 0],
  [3.7, 1],
]

const OUTLINE: Keys = [
  [1.55, 0],
  [2.0, 1],
  [3.0, 1],
  [3.3, 0],
]

const DIMENSIONS: Keys = [
  [6.6, 0],
  [7.0, 1],
  [7.6, 1],
  [7.95, 0],
]

/** Cu mișcare redusă: o singură stare pe capitol, fără animația dintre ele. */
const STILL_CLIP = [CLIP_TOP, CLIP_NONE, CLIP_NONE, CLIP_TERRACES, CLIP_TERRACES, CLIP_TOP, CLIP_TOP, CLIP_TOP, CLIP_TOP]

export type StageState = {
  pose: Pose
  clip: number
  outline: number
  dimensions: number
  hill: number
  spur: number
  move: number
  site: number
  /** Biserica se ascunde cât palatul coboară în teren, ca să nu sară dintr-un loc în altul. */
  church: boolean
}

export const makeState = (pose: Pose): StageState => ({
  pose,
  clip: CLIP_TOP,
  outline: 0,
  dimensions: 0,
  hill: 0,
  spur: 0,
  move: 1,
  site: 1,
  church: true,
})

export function stateAt(t: number, still: boolean, out: StageState) {
  const last = POSES.length - 1
  const tc = MathUtils.clamp(t, 0, last)
  if (still) {
    const i = Math.min(last, Math.floor(tc + 0.02))
    const p = POSES[i]
    out.pose.position.copy(p.position)
    out.pose.target.copy(p.target)
    out.pose.fov = p.fov
    out.clip = STILL_CLIP[i]
    out.outline = i === 2 ? 1 : 0
    out.dimensions = i === 7 ? 1 : 0
    out.hill = i >= 1 && i <= 2 ? 1 : 0
    out.spur = i >= 1 && i <= 3 ? 1 : 0
    out.move = i >= 4 || i === 0 ? 1 : 0
    out.church = true
    out.site = i >= 3 || i === 0 ? 1 : 0
    return out
  }
  const i = Math.min(Math.floor(tc), last - 1)
  // Camera pornește spre capitolul următor abia după ce s-a citit mai mult de jumătate din cel curent.
  const f = MathUtils.clamp((tc - i - 0.5) / 0.5, 0, 1)
  blendPose(POSES[i], POSES[i + 1], f, 0, out.pose)
  out.clip = at(CLIP, tc)
  out.outline = at(OUTLINE, tc)
  out.dimensions = at(DIMENSIONS, tc)
  out.hill = at(HILL, tc)
  out.spur = at(SPUR, tc)
  // Azi biserica e la locul nou: la începutul paginii o arătăm acolo.
  out.move = tc < 0.75 ? 1 : at(MOVE, tc)
  out.church = tc < 0.5 || tc > 0.92
  // La începutul paginii palatul e întreg, cu tot cu piață.
  out.site = tc < 0.75 ? 1 : at(SITE, tc)
  return out
}
