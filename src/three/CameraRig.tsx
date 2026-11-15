import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { MathUtils, type PerspectiveCamera, Spherical, Vector3 } from 'three'
import { activeRoom, swipeCancel, swipeEnd, swipeMove, swipeStart } from '../state/swipe'
import { live, useTour } from '../state/tour'
import { ZOOM_STEP, setZoom, zoom, zoomBy } from '../state/zoom'
import {
  type CityFrame,
  NARROW_WIDTH,
  STOPS,
  blendPose,
  cityAt,
  fovForAspect,
  framingAt,
  liftBetween,
  makePose,
  mapAt,
  poseAt,
  setCityFrame,
  solidAt,
} from './poses'

const FLIGHT_SECONDS = 2.2
const DRAG_YAW = 0.0052
const DRAG_PITCH = 0.0034
const KEY_YAW = 0.14
const PITCH_MIN = -0.55
const PITCH_MAX = 0.42
/** Limitele unghiului față de verticală pentru rotirea făcută de utilizator. */
const PHI_MIN = 0.2
const PHI_MAX = 1.5
const FAR = 4200
const FAR_CITY = 9000

type Flight = { to: number; from: number; k: number; lift: number; solid: number; map: number; city: number }

const wrapAngle = (a: number) => Math.atan2(Math.sin(a), Math.cos(a))
const smooth = (x: number) => x * x * (3 - 2 * x)
const lastStop = STOPS.length - 1

/**
 * Mută camera după poziția din tur și adaugă peste ea rotirea făcută de utilizator.
 * Pe exterior și pe hartă se poate roti cu drag sau cu săgețile stânga/dreapta;
 * în săli camera doar urmărește discret cursorul, iar aceleași gesturi schimbă filmarea.
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
    zoom: 1,
    turned: 0,
    sway: 1,
    lookYaw: 0,
    lookPitch: 0,
    offset: new Vector3(),
    spherical: new Spherical(),
    framing: { cx: 0.5, cy: 0.5 },
    fov: 0,
    near: 0,
    far: 0,
    frame: null as CityFrame | null,
    cx: 0.5,
    cy: 0.5,
    view: [0, 0, 0, 0],
  })

  useEffect(() => {
    const el = gl.domElement
    const r = rig.current
    // Pe touch, gestul vertical rămâne al paginii (scroll); cel orizontal rotește macheta.
    el.style.touchAction = 'pan-y'
    let pointer: number | null = null
    let swiping: number | null = null
    let x = 0
    let y = 0
    /** Degetele de pe ecran și ciupirea în curs: distanța și apropierea de la începutul ei. */
    const touches = new Map<number, { x: number; y: number }>()
    let pinch: { distance: number; zoom: number } | null = null
    const spread = () => {
      const [a, b] = [...touches.values()]
      return Math.hypot(a.x - b.x, a.y - b.y)
    }

    const canOrbit = () => {
      const { stop, settled, flying } = useTour.getState()
      return settled && !flying && STOPS[stop].kind !== 'room'
    }
    const noteTurn = (angle: number) => {
      r.turned += Math.abs(angle)
      // Abia după o rotire adevărată socotim că utilizatorul a prins ideea.
      if (r.turned > 0.06 && !useTour.getState().hasOrbited) useTour.getState().set({ hasOrbited: true })
    }
    const release = () => {
      pointer = null
      live.dragging = false
      delete el.dataset.dragging
      r.yaw = wrapAngle(r.yaw)
    }
    const onDown = (event: PointerEvent) => {
      if (event.button !== 0) return
      if (event.pointerType === 'touch') {
        touches.set(event.pointerId, { x: event.clientX, y: event.clientY })
        // Al doilea deget: rotirea se oprește și începe ciupirea.
        if (touches.size === 2 && canOrbit()) {
          if (pointer !== null) release()
          pinch = { distance: Math.max(1, spread()), zoom: zoom.target }
          return
        }
      }
      if (!canOrbit()) {
        // Într-o sală, drag-ul orizontal pe scenă trece la filmarea vecină.
        if (swipeStart(event.clientX)) {
          swiping = event.pointerId
          el.setPointerCapture(swiping)
        }
        return
      }
      pointer = event.pointerId
      x = event.clientX
      y = event.clientY
      el.setPointerCapture(pointer)
      live.dragging = true
      el.dataset.dragging = 'true'
    }
    const onMove = (event: PointerEvent) => {
      if (event.pointerType === 'mouse') {
        live.pointerX = (event.clientX / window.innerWidth) * 2 - 1
        live.pointerY = (event.clientY / window.innerHeight) * 2 - 1
      }
      const touch = touches.get(event.pointerId)
      if (touch) {
        touch.x = event.clientX
        touch.y = event.clientY
        if (pinch && touches.size === 2) {
          // Degetele care se depărtează apropie macheta.
          setZoom((pinch.zoom * pinch.distance) / Math.max(1, spread()))
          return
        }
      }
      if (swiping === event.pointerId) {
        if (event.buttons === 0) {
          swiping = null
          swipeCancel()
        } else swipeMove(event.clientX)
        return
      }
      if (pointer !== event.pointerId) return
      // Dacă butonul s-a ridicat pe nevăzute sau turul a plecat de pe oprire, drag-ul se încheie.
      if (event.buttons === 0 || !canOrbit()) {
        release()
        return
      }
      const dx = event.clientX - x
      const dy = event.clientY - y
      x = event.clientX
      y = event.clientY
      r.yaw -= dx * DRAG_YAW
      noteTurn(dx * DRAG_YAW)
      if (event.pointerType !== 'touch') {
        r.pitch = MathUtils.clamp(r.pitch + dy * DRAG_PITCH, PITCH_MIN, PITCH_MAX)
      }
    }
    const onUp = (event: PointerEvent) => {
      if (touches.delete(event.pointerId) && touches.size < 2) pinch = null
      if (swiping === event.pointerId) {
        swiping = null
        if (event.type === 'pointercancel') swipeCancel()
        else swipeEnd()
      }
      if (pointer === event.pointerId) release()
    }
    /** Rotița cu Ctrl e gestul de ciupire de pe trackpad; rotița simplă rămâne a paginii. */
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey || !canOrbit()) return
      event.preventDefault()
      zoomBy(Math.exp(MathUtils.clamp(event.deltaY, -60, 60) * 0.012))
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return
      const target = event.target
      if (target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return
      if ((event.key === '+' || event.key === '=' || event.key === '-') && canOrbit()) {
        event.preventDefault()
        zoomBy(event.key === '-' ? 1 / ZOOM_STEP : ZOOM_STEP)
        return
      }
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
      if (!canOrbit()) {
        // În săli, săgețile schimbă filmarea.
        const room = activeRoom()
        if (room === null) return
        event.preventDefault()
        useTour.getState().stepRecording(room, event.key === 'ArrowRight' ? 1 : -1)
        return
      }
      event.preventDefault()
      const turn = event.key === 'ArrowLeft' ? KEY_YAW : -KEY_YAW
      r.yaw = wrapAngle(r.yaw + turn)
      noteTurn(turn)
    }

    el.addEventListener('pointerdown', onDown)
    el.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    window.addEventListener('keydown', onKey)
    return () => {
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('wheel', onWheel)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      window.removeEventListener('keydown', onKey)
    }
  }, [gl])

  useEffect(() => {
    if (!live.debug) return
    const tour = (window as unknown as { __tour?: Record<string, unknown> }).__tour
    if (!tour) return
    tour.cameraX = () => camera.position.x
    tour.cameraDistance = () => camera.position.distanceTo(rig.current.pose.target)
  }, [camera])

  useFrame((state, delta) => {
    const r = rig.current
    const dt = Math.min(delta, 0.1)
    const instant = live.reducedMotion
    live.frames += 1

    // Cadrul orașului depinde de lățimea ferestrei și de faptul că macheta lui există.
    const frame: CityFrame = live.cityFailed ? 'none' : size.width <= NARROW_WIDTH ? 'narrow' : 'wide'
    if (frame !== r.frame) {
      r.frame = frame
      setCityFrame(frame)
    }
    if (live.frames === 3) useTour.getState().set({ scene: 'ready' })

    // 1. Unde suntem în tur: fie într-un zbor pornit de un salt, fie pe traseul dat de scroll.
    if (live.flightTo !== null) {
      if (!r.flight || r.flight.to !== live.flightTo) {
        const to = STOPS[live.flightTo]
        const nearest = STOPS[Math.round(MathUtils.clamp(live.t, 0, lastStop))]
        r.from.position.copy(camera.position)
        r.from.target.copy(r.pose.target)
        r.from.fov = r.pose.fov
        r.flight = {
          to: live.flightTo,
          from: live.t,
          k: 0,
          lift: liftBetween(r.from, to.pose, nearest.kind === 'room' && to.kind === 'room'),
          solid: live.solid,
          map: live.map,
          city: live.city,
        }
        // Poziția de plecare conține deja rotirea utilizatorului.
        r.yaw = r.pitch = r.sway = r.lookYaw = r.lookPitch = 0
      }
      const flight = r.flight
      flight.k = instant ? 1 : Math.min(1, flight.k + dt / FLIGHT_SECONDS)
      blendPose(r.from, STOPS[flight.to].pose, flight.k, flight.lift, r.pose)
      const e = smooth(flight.k)
      live.t = MathUtils.lerp(flight.from, flight.to, e)
      live.solid = MathUtils.lerp(flight.solid, solidAt(flight.to), e)
      live.map = MathUtils.lerp(flight.map, mapAt(flight.to), e)
      live.city = MathUtils.lerp(flight.city, cityAt(flight.to), e)
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
      live.city = cityAt(live.t)
    }

    // 2. Rotirea făcută de utilizator, valabilă doar cât stăm pe o oprire.
    const nearestIndex = Math.round(MathUtils.clamp(live.t, 0, lastStop))
    const stop = STOPS[nearestIndex]
    const atStop = !r.flight && Math.abs(live.t - nearestIndex) < 0.02
    const orbitable = atStop && stop.kind !== 'room'
    if (!orbitable && !live.dragging) {
      r.yaw = MathUtils.damp(r.yaw, 0, 5, dt)
      r.pitch = MathUtils.damp(r.pitch, 0, 5, dt)
      // Apropierea ține de oprirea pe care a fost cerută: la plecare, cadrul revine la cel al traseului.
      zoom.target = 1
    }
    r.zoom = instant ? zoom.target : MathUtils.damp(r.zoom, zoom.target, 7, dt)
    if (Math.abs(r.zoom - zoom.target) < 1e-4) r.zoom = zoom.target

    // Macheta se leagănă încet până când utilizatorul o apucă prima dată.
    const swayOn =
      atStop && (stop.kind === 'exterior' || stop.kind === 'city') && !instant && !live.debug && !useTour.getState().hasOrbited
    r.sway = MathUtils.damp(r.sway, swayOn ? 1 : 0, 3, dt)
    const sway = Math.sin(state.clock.elapsedTime * 0.22) * 0.2 * r.sway

    const look = atStop && stop.kind === 'room' && !instant ? 1 : 0
    r.lookYaw = MathUtils.damp(r.lookYaw, -live.pointerX * 0.1 * look, 3.5, dt)
    r.lookPitch = MathUtils.damp(r.lookPitch, live.pointerY * 0.035 * look, 3.5, dt)

    r.offset.subVectors(r.pose.position, r.pose.target)
    r.spherical.setFromVector3(r.offset)
    r.spherical.theta += r.yaw + sway + r.lookYaw
    r.spherical.radius *= r.zoom
    // Limitele se aplică doar rotirii utilizatorului: unghiul de bază al opririi rămâne cel din date.
    const phi = r.spherical.phi
    r.spherical.phi =
      MathUtils.clamp(phi - r.pitch, Math.min(phi, PHI_MIN), Math.max(phi, PHI_MAX)) - r.lookPitch
    r.offset.setFromSpherical(r.spherical)
    camera.position.copy(r.pose.target).add(r.offset)
    camera.lookAt(r.pose.target)

    // 3. Obiectiv și planuri de tăiere.
    const aspect = size.width / size.height
    const fov = fovForAspect(r.pose.fov, aspect)
    const near = MathUtils.clamp(r.offset.length() * 0.02, 0.2, 6)
    // Orașul se întinde mult mai departe decât palatul; în săli, un plan îndepărtat apropiat ține adâncimea precisă.
    const far = live.city > 0 ? FAR_CITY : FAR
    if (Math.abs(fov - r.fov) > 0.01 || Math.abs(near - r.near) > 0.01 || far !== r.far) {
      r.fov = fov
      r.near = near
      r.far = far
      camera.fov = fov
      camera.near = near
      camera.far = far
      camera.updateProjectionMatrix()
    }

    // 4. Subiectul stă decalat față de centru, ca să lase loc textului.
    framingAt(r.flight ? r.flight.to : live.t, size.width, r.framing)
    r.cx = instant ? r.framing.cx : MathUtils.damp(r.cx, r.framing.cx, 4, dt)
    r.cy = instant ? r.framing.cy : MathUtils.damp(r.cy, r.framing.cy, 4, dt)
    const offsetX = Math.round((0.5 - r.cx) * size.width)
    const offsetY = Math.round((0.5 - r.cy) * size.height)
    const view = r.view
    if (view[0] !== size.width || view[1] !== size.height || view[2] !== offsetX || view[3] !== offsetY) {
      view[0] = size.width
      view[1] = size.height
      view[2] = offsetX
      view[3] = offsetY
      camera.setViewOffset(size.width, size.height, offsetX, offsetY, size.width, size.height)
    }
  })

  return null
}
