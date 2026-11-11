import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { MathUtils, type PerspectiveCamera, Spherical, Vector3 } from 'three'
import { live, useTour } from '../state/tour'
import {
  STOPS,
  blendPose,
  fovForAspect,
  framingAt,
  liftBetween,
  makePose,
  mapAt,
  poseAt,
  solidAt,
} from './poses'

const FLIGHT_SECONDS = 2.2
const DRAG_YAW = 0.0052
const DRAG_PITCH = 0.0034
const PITCH_MIN = -0.55
const PITCH_MAX = 0.42

type Flight = { to: number; k: number; lift: number; solid: number; map: number }

const wrapAngle = (a: number) => Math.atan2(Math.sin(a), Math.cos(a))
const smooth = (x: number) => x * x * (3 - 2 * x)

/**
 * Mută camera după poziția din tur și adaugă peste ea rotirea făcută de utilizator.
 * Pe exterior și pe hartă se poate roti cu drag; în săli camera doar urmărește discret cursorul.
 */
export function CameraRig() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const gl = useThree((s) => s.gl)
  const size = useThree((s) => s.size)

  const rig = useRef({
    pose: makePose(),
    from: makePose(),
    flight: null as Flight | null,
    yaw: 0,
    pitch: 0,
    sway: 1,
    lookYaw: 0,
    lookPitch: 0,
    offset: new Vector3(),
    spherical: new Spherical(),
    fov: 0,
    near: 0,
    cy: 0.5,
    viewKey: '',
  })

  useEffect(() => {
    const el = gl.domElement
    const r = rig.current
    // Pe touch, gestul vertical rămâne al paginii (scroll); cel orizontal rotește macheta.
    el.style.touchAction = 'pan-y'
    let pointer: number | null = null
    let x = 0
    let y = 0

    const canOrbit = () => {
      const { stop, settled, flying } = useTour.getState()
      return settled && !flying && STOPS[stop].kind !== 'room'
    }
    const release = () => {
      pointer = null
      live.dragging = false
      delete el.dataset.dragging
      r.yaw = wrapAngle(r.yaw)
    }
    const onDown = (event: PointerEvent) => {
      if (event.button !== 0 || !canOrbit()) return
      pointer = event.pointerId
      x = event.clientX
      y = event.clientY
      el.setPointerCapture(pointer)
      live.dragging = true
      el.dataset.dragging = 'true'
    }
    const onMove = (event: PointerEvent) => {
      live.pointerX = (event.clientX / window.innerWidth) * 2 - 1
      live.pointerY = (event.clientY / window.innerHeight) * 2 - 1
      if (pointer !== event.pointerId) return
      const dx = event.clientX - x
      const dy = event.clientY - y
      x = event.clientX
      y = event.clientY
      r.yaw -= dx * DRAG_YAW
      if (event.pointerType !== 'touch') {
        r.pitch = MathUtils.clamp(r.pitch + dy * DRAG_PITCH, PITCH_MIN, PITCH_MAX)
      }
      if (!useTour.getState().hasOrbited && Math.abs(dx) + Math.abs(dy) > 1) {
        useTour.getState().set({ hasOrbited: true })
      }
    }
    const onUp = (event: PointerEvent) => {
      if (pointer === event.pointerId) release()
    }

    el.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      el.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [gl])

  useFrame((state, delta) => {
    const r = rig.current
    const dt = Math.min(delta, 0.1)
    const instant = live.reducedMotion
    live.frames += 1

    // 1. Unde suntem în tur: fie într-un zbor pornit de un salt, fie pe traseul dat de scroll.
    if (live.flightTo !== null) {
      if (!r.flight || r.flight.to !== live.flightTo) {
        const to = STOPS[live.flightTo]
        const nearest = STOPS[Math.round(MathUtils.clamp(live.t, 0, STOPS.length - 1))]
        r.from.position.copy(camera.position)
        r.from.target.copy(r.pose.target)
        r.from.fov = r.pose.fov
        r.flight = {
          to: live.flightTo,
          k: 0,
          lift: liftBetween(r.from, to.pose, nearest.kind === 'room' && to.kind === 'room'),
          solid: live.solid,
          map: live.map,
        }
        // Poziția de plecare conține deja rotirea utilizatorului.
        r.yaw = r.pitch = r.sway = r.lookYaw = r.lookPitch = 0
      }
      const flight = r.flight
      flight.k = instant ? 1 : Math.min(1, flight.k + dt / FLIGHT_SECONDS)
      blendPose(r.from, STOPS[flight.to].pose, flight.k, flight.lift, r.pose)
      const e = smooth(flight.k)
      live.solid = MathUtils.lerp(flight.solid, solidAt(flight.to), e)
      live.map = MathUtils.lerp(flight.map, mapAt(flight.to), e)
      if (flight.k >= 1) {
        live.t = flight.to
        live.flightTo = null
        r.flight = null
        useTour.getState().set({ flying: false })
      }
    } else {
      live.t = instant ? live.tTarget : MathUtils.damp(live.t, live.tTarget, 6, dt)
      if (Math.abs(live.t - live.tTarget) < 1e-4) live.t = live.tTarget
      poseAt(live.t, r.pose)
      live.solid = solidAt(live.t)
      live.map = mapAt(live.t)
    }

    // 2. Rotirea făcută de utilizator, valabilă doar cât stăm pe o oprire.
    const nearestIndex = Math.round(MathUtils.clamp(live.t, 0, STOPS.length - 1))
    const stop = STOPS[nearestIndex]
    const atStop = !r.flight && Math.abs(live.t - nearestIndex) < 0.02
    const orbitable = atStop && stop.kind !== 'room'
    if (!orbitable && !live.dragging) {
      r.yaw = MathUtils.damp(r.yaw, 0, 5, dt)
      r.pitch = MathUtils.damp(r.pitch, 0, 5, dt)
    }

    // Macheta se leagănă încet până când utilizatorul o apucă prima dată.
    const swayOn = atStop && stop.kind === 'exterior' && !instant && !useTour.getState().hasOrbited
    r.sway = MathUtils.damp(r.sway, swayOn ? 1 : 0, 3, dt)
    const sway = Math.sin(state.clock.elapsedTime * 0.22) * 0.2 * r.sway

    const look = atStop && stop.kind === 'room' && !instant ? 1 : 0
    r.lookYaw = MathUtils.damp(r.lookYaw, -live.pointerX * 0.1 * look, 3.5, dt)
    r.lookPitch = MathUtils.damp(r.lookPitch, live.pointerY * 0.035 * look, 3.5, dt)

    r.offset.subVectors(r.pose.position, r.pose.target)
    r.spherical.setFromVector3(r.offset)
    r.spherical.theta += r.yaw + sway + r.lookYaw
    r.spherical.phi = MathUtils.clamp(r.spherical.phi - r.pitch - r.lookPitch, 0.2, 1.5)
    r.offset.setFromSpherical(r.spherical)
    camera.position.copy(r.pose.target).add(r.offset)
    camera.lookAt(r.pose.target)

    // 3. Obiectiv și planuri de tăiere.
    const aspect = size.width / size.height
    const fov = fovForAspect(r.pose.fov, aspect)
    const near = MathUtils.clamp(r.offset.length() * 0.02, 0.2, 6)
    if (Math.abs(fov - r.fov) > 0.01 || Math.abs(near - r.near) > 0.01) {
      r.fov = fov
      r.near = near
      camera.fov = fov
      camera.near = near
      camera.far = 4200
      camera.updateProjectionMatrix()
    }

    // 4. Subiectul stă decalat față de centru, ca să lase loc textului.
    const framing = framingAt(r.flight ? r.flight.to : live.t, aspect)
    r.cy = instant ? framing.cy : MathUtils.damp(r.cy, framing.cy, 4, dt)
    const key = `${size.width}x${size.height}:${framing.cx}:${r.cy.toFixed(3)}`
    if (key !== r.viewKey) {
      r.viewKey = key
      camera.setViewOffset(
        size.width,
        size.height,
        (0.5 - framing.cx) * size.width,
        (0.5 - r.cy) * size.height,
        size.width,
        size.height,
      )
    }
  })

  return null
}
