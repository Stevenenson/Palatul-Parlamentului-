import { MathUtils, Vector3 } from 'three'
import type { RoomSpec } from '../content/rooms'
import { LAST_STOP, STOP_LIST, type StopInfo } from '../content/stops'

export type Pose = { position: Vector3; target: Vector3; fov: number }
export type Stop = StopInfo & { pose: Pose }

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

const EXTERIOR: Pose = { position: v(-337, 112, 556), target: v(0, 27, 8), fov: 30 }
const MAP: Pose = { position: v(-320, 430, 500), target: v(0, 10, 20), fov: 30 }

/** Opririle turului, cu poziția camerei pe fiecare. */
export const STOPS: Stop[] = STOP_LIST.map((info) => ({
  ...info,
  pose: info.room ? roomPose(info.room) : info.kind === 'map' ? MAP : EXTERIOR,
}))

export const makePose = (): Pose => ({ position: new Vector3(), target: new Vector3(), fov: 30 })

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
 * Pe ecrane înguste strângem puțin cadrul pe orizontală, ca subiectul să umple lățimea
 * telefonului, dar fără să-i taie colțurile.
 */
export function fovForAspect(fov: number, aspect: number): number {
  if (aspect >= REF_ASPECT) return fov
  const fill = MathUtils.lerp(0.86, 1, MathUtils.smoothstep(aspect, 0.6, REF_ASPECT))
  const half = Math.tan(MathUtils.degToRad(fov) / 2) * REF_ASPECT * fill
  return Math.min(MathUtils.radToDeg(2 * Math.atan(half / aspect)), 84)
}

/** Același prag ca în CSS (`@media (max-width: 760px)`): sub el, panoul de text stă jos. */
export const NARROW_WIDTH = 760

/**
 * Unde stă subiectul pe ecran (0..1). Pe ecrane late: la mijloc pe exterior, sub titlu, apoi
 * spre dreapta în săli și pe hartă, ca să lase loc panoului din stânga. Pe ecrane înguste: la
 * mijloc pe exterior și mai sus în săli și pe hartă, unde panoul de text ocupă partea de jos.
 */
export function framingAt(t: number, width: number, out: { cx: number; cy: number }) {
  const inside = MathUtils.smoothstep(t, 0.15, 0.85)
  if (width > NARROW_WIDTH) {
    out.cx = MathUtils.lerp(0.5, 0.64, inside)
    out.cy = MathUtils.lerp(0.55, 0.5, inside)
    return
  }
  out.cx = 0.5
  out.cy = MathUtils.lerp(0.5, 0.3, inside)
}
