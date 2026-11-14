import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  Color,
  DoubleSide,
  type Group,
  MathUtils,
  MeshBasicMaterial,
  SRGBColorSpace,
  type Texture,
  TextureLoader,
  VideoTexture,
} from 'three'
import { ROOMS, type Recording, type RoomSpec } from '../../content/rooms'
import { live, useTour, wrapIndex } from '../../state/tour'
import { containFit, createHologramMaterial } from './hologramMaterial'

type Slide = { texture: Texture; aspect: number; video: HTMLVideoElement | null }

function loadSlide(recording: Recording): Slide {
  if (recording.media.kind === 'video') {
    const video = document.createElement('video')
    video.src = recording.media.src
    video.muted = true
    video.loop = true
    video.playsInline = true
    video.preload = 'metadata'
    const texture = new VideoTexture(video)
    texture.colorSpace = SRGBColorSpace
    const slide: Slide = { texture, aspect: 16 / 9, video }
    video.addEventListener('loadedmetadata', () => {
      if (video.videoHeight > 0) slide.aspect = video.videoWidth / video.videoHeight
    })
    return slide
  }
  const slide: Slide = { texture: null as unknown as Texture, aspect: 1, video: null }
  slide.texture = new TextureLoader().load(recording.media.src, (texture) => {
    const image = texture.image as { width: number; height: number }
    if (image.height > 0) slide.aspect = image.width / image.height
  })
  slide.texture.colorSpace = SRGBColorSpace
  return slide
}

/**
 * Holograma unei săli: un panou pe care alunecă filmările, deasupra soclului
 * (`table`) sau în rama de pe perete (`wall`). Se aprinde când turul ajunge în sală;
 * filmările video pornesc doar cât sala e activă și se opresc la plecare.
 */
function Hologram({ room, index }: { room: RoomSpec; index: number }) {
  const group = useRef<Group>(null)
  const wall = room.hologram.kind === 'wall'
  const width = wall ? room.hologram.width - 0.3 : room.hologram.width
  const height = wall ? (room.hologram.width * 9) / 16 - 0.3 : room.hologram.width * 0.72

  const { material, uniforms } = useMemo(
    () => createHologramMaterial(room.accent, wall ? 0 : 0.36),
    [room.accent, wall],
  )
  const beam = useMemo(
    () =>
      new MeshBasicMaterial({
        color: new Color(room.accent).lerp(new Color('#ffffff'), 0.35),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        side: DoubleSide,
      }),
    [room.accent],
  )
  const slides = useMemo(() => room.recordings.map(loadSlide), [room.recordings])
  const state = useRef({ position: 0, power: 0 })

  useEffect(() => {
    if (live.debug) {
      // Scripturile de test întreabă care filmări video rulează.
      const tour = (window as unknown as { __tour?: { playing?: Record<string, () => boolean[]> } }).__tour
      if (tour) {
        tour.playing = tour.playing ?? {}
        tour.playing[room.id] = () => slides.map((slide) => Boolean(slide.video && !slide.video.paused))
      }
    }
    return () => {
      for (const slide of slides) {
        slide.video?.pause()
        slide.video?.removeAttribute('src')
        slide.texture.dispose()
      }
    }
  }, [slides, room.id])

  useEffect(
    () => () => {
      material.dispose()
      beam.dispose()
    },
    [material, beam],
  )

  useFrame((_, delta) => {
    const s = state.current
    const dt = Math.min(delta, 0.1)
    const store = useTour.getState()
    const stop = index + 1
    const here = store.stop === stop && Math.abs(live.t - stop) < 0.3
    s.power = live.reducedMotion ? (here ? 1 : 0) : MathUtils.damp(s.power, here ? 1 : 0, 4.5, dt)

    const target = store.recording[index] + (here ? live.swipe : 0)
    s.position = live.reducedMotion ? target : MathUtils.damp(s.position, target, 10, dt)
    if (Math.abs(s.position - target) < 0.0005) s.position = target

    const count = slides.length
    const base = Math.floor(s.position)
    const a = slides[wrapIndex(base, count)]
    const b = slides[wrapIndex(base + 1, count)]
    const panel = width / height
    uniforms.mapA.value = a.texture
    uniforms.mapB.value = b.texture
    containFit(a.aspect, panel, uniforms.fitA.value)
    containFit(b.aspect, panel, uniforms.fitB.value)
    uniforms.shift.value = s.position - base
    uniforms.time.value += dt
    uniforms.power.value = s.power
    uniforms.motion.value = live.reducedMotion ? 0 : 1
    beam.opacity = 0.13 * s.power
    if (group.current) group.current.visible = s.power > 0.01

    // Rulează doar filmarea din față, și doar cât sala e activă.
    const current = wrapIndex(Math.round(s.position), count)
    slides.forEach((slide, i) => {
      const video = slide.video
      if (!video) return
      video.muted = store.muted
      const shouldPlay = here && i === current
      if (shouldPlay && video.paused) void video.play().catch(() => {})
      if (!shouldPlay && !video.paused) video.pause()
    })
  })

  const [fx, fy, fz] = room.floor
  const [hx, hy, hz] = room.hologram.at
  const yaw = room.hologram.yaw
  // Pe perete, panoul stă cu puțin în fața ramei; deasupra soclului, plutește la înălțimea ochilor.
  const out = wall ? 0.12 : 0
  const base = wall ? hy + 0.15 : hy + 1.8
  const position: [number, number, number] = [
    fx + hx + Math.sin(yaw) * out,
    fy + base + height / 2,
    fz + hz + Math.cos(yaw) * out,
  ]

  return (
    <group ref={group} visible={false}>
      <mesh position={position} rotation={[0, yaw, 0]} material={material} renderOrder={3}>
        <planeGeometry args={[width, height]} />
      </mesh>
      {!wall && (
        <mesh position={[fx + hx, fy + hy + 1.1 + 0.45, fz + hz]} material={beam} renderOrder={2}>
          <cylinderGeometry args={[width * 0.44, room.hologram.width * 0.17, 0.9, 40, 1, true]} />
        </mesh>
      )}
    </group>
  )
}

export function Holograms() {
  return (
    <>
      {ROOMS.map((room, index) => (
        <Hologram key={room.id} room={room} index={index} />
      ))}
    </>
  )
}
