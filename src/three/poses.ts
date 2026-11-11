import { MathUtils, Vector3 } from 'three'
import { ROOMS, type RoomSpec } from '../content/rooms'

export type Pose = { position: Vector3; target: Vector3; fov: number }
export type StopKind = 'exterior' | 'room' | 'map'
export type Stop = { id: string; kind: StopKind; label: string; room?: RoomSpec; pose: Pose }

const v = (x: number, y: number, z: number) => new Vector3(x, y, z)

function roomPose(room: RoomSpec): Pose {
  const [fx, fy, fz] = room.floor
  const { eye, look, fov } = room.camera
  return {
    position: v(fx + eye[0], fy + eye[1], fz + eye[2]),
    target: v(fx + look[0], fy + look[1], fz + look[2]),
    fov,
  }
}

/** Opririle turului, în ordinea de pe pagină. Fiecare are o secțiune DOM cu același `id`. */
export const STOPS: Stop[] = [
  {
    id: 'palat',
    kind: 'exterior',
    label: 'Palatul',
    pose: { position: v(300, 150, 520), target: v(0, 34, 0), fov: 30 },
  },
  ...ROOMS.map<Stop>((room) => ({
    id: room.id,
    kind: 'room',
    label: room.name,
    room,
    pose: roomPose(room),
  })),
  {
    id: 'harta',
    kind: 'map',
    label: 'Harta sălilor',
    pose: { position: v(-300, 400, 480), target: v(0, 14, 24), fov: 30 },
  },
]

export const LAST_STOP = STOPS.length - 1

export const makePose = (): Pose => ({ position: new Vector3(), target: new Vector3(), fov: 30 })

export function copyPose(from: Pose, to: Pose) {
  to.position.copy(from.position)
  to.target.copy(from.target)
  to.fov = from.fov
}

const smoother = (x: number) => x * x * x * (x * (x * 6 - 15) + 10)

/** Cât se ridică traiectoria între două opriri: între două săli camera trece pe deasupra lor. */
export function liftBetween(a: Pose, b: Pose, bothRooms: boolean): number {
  if (!bothRooms) return 0
  return MathUtils.clamp(a.position.distanceTo(b.position) * 0.42, 14, 64)
}

/**
 * Poziția camerei pe drumul de la `a` la `b`. `f` e fracțiunea brută (0..1);
 * capetele au un mic palier, ca sala să stea pe loc cât scroll-ul abia a pornit.
 */
export function blendPose(a: Pose, b: Pose, f: number, lift: number, out: Pose) {
  const e = smoother(MathUtils.clamp((f - 0.05) / 0.9, 0, 1))
  out.position.lerpVectors(a.position, b.position, e)
  out.position.y += Math.sin(Math.PI * e) * lift
  // Privirea pleacă puțin înaintea camerei, ca să vezi încotro mergi.
  const et = smoother(MathUtils.clamp((f - 0.02) / 0.78, 0, 1))
  out.target.lerpVectors(a.target, b.target, et)
  out.fov = MathUtils.lerp(a.fov, b.fov, e)
}

export function poseAt(t: number, out: Pose) {
  const tc = MathUtils.clamp(t, 0, LAST_STOP)
  const i = Math.min(Math.floor(tc), LAST_STOP - 1)
  const a = STOPS[i]
  const b = STOPS[i + 1]
  const lift = liftBetween(a.pose, b.pose, a.kind === 'room' && b.kind === 'room')
  blendPose(a.pose, b.pose, tc - i, lift, out)
}

/** 1 = carcasa palatului e opacă (exterior), 0 = transparentă (în săli și pe hartă). */
export function solidAt(t: number): number {
  if (t <= 0) return 1
  if (t >= 1) return 0
  return 1 - MathUtils.smoothstep(t, 0.22, 0.62)
}

/** 0..1: cât de mult suntem în modul hartă. */
export function mapAt(t: number): number {
  return MathUtils.smoothstep(t, LAST_STOP - 0.75, LAST_STOP - 0.1)
}

/** Sub proporția asta de ecran păstrăm câmpul vizual orizontal, nu pe cel vertical. */
const REF_ASPECT = 1.45

/**
 * Pe ecrane înguste strângem cadrul pe orizontală, ca subiectul să umple lățimea
 * telefonului în loc să rămână mic în mijloc.
 */
export function fovForAspect(fov: number, aspect: number): number {
  if (aspect >= REF_ASPECT) return fov
  const fill = MathUtils.lerp(0.66, 1, MathUtils.smoothstep(aspect, 0.6, REF_ASPECT))
  const half = Math.tan(MathUtils.degToRad(fov) / 2) * REF_ASPECT * fill
  return Math.min(MathUtils.radToDeg(2 * Math.atan(half / aspect)), 84)
}

/**
 * Unde stă subiectul pe ecran (0..1): spre dreapta pe ecrane late, ca să lase loc
 * textului din stânga; pe telefon, la mijloc pe exterior și mai sus în săli și pe
 * hartă, unde panoul de text ocupă partea de jos.
 */
export function framingAt(t: number, aspect: number): { cx: number; cy: number } {
  if (aspect > 1.15) return { cx: 0.6, cy: 0.5 }
  return { cx: 0.5, cy: MathUtils.lerp(0.5, 0.3, MathUtils.smoothstep(t, 0.15, 0.85)) }
}
