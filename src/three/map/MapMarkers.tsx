import { useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import {
  BoxGeometry,
  EdgesGeometry,
  LineBasicMaterial,
  LineSegments,
  MathUtils,
  Vector3,
} from 'three'
import { ROOMS } from '../../content/rooms'
import { live, useTour } from '../../state/tour'

/**
 * Harta 3D: conturul fiecărei săli, în culoarea ei, și poziția pe ecran a pinurilor.
 * Pinurile propriu-zise sunt linkuri din pagină (`ui/MapSection.tsx`); aici doar le
 * spunem unde să stea, proiectând centrul fiecărei săli prin camera scenei.
 */

/** Elementele DOM ale pinurilor, înregistrate de `MapSection`. */
export const pinElements: (HTMLElement | null)[] = ROOMS.map(() => null)

const anchor = new Vector3()
const screenX = ROOMS.map(() => 0)
const screenY = ROOMS.map(() => 0)
const lifts = ROOMS.map(() => 0)
const order = ROOMS.map((_, i) => i)
/** Dreptunghiurile etichetelor deja așezate în cadrul curent: stânga, dreapta, sus, jos. */
const placed = ROOMS.map(() => [0, 0, 0, 0])
/** Înălțimea tijei și a etichetei, în pixeli (aceleași valori ca în CSS). */
const LIFT = 34
const LABEL = 44

export function MapMarkers() {
  const camera = useThree((state) => state.camera)
  const size = useThree((state) => state.size)

  const outlines = useMemo(
    () =>
      ROOMS.map((room) => {
        const [w, h, d] = room.size
        const box = new BoxGeometry(w, h, d)
        const edges = new EdgesGeometry(box)
        box.dispose()
        const material = new LineBasicMaterial({ color: room.accent, transparent: true, opacity: 0 })
        const lines = new LineSegments(edges, material)
        lines.position.set(room.floor[0], room.floor[1] + h / 2, room.floor[2])
        lines.visible = false
        lines.renderOrder = 4
        return { lines, material }
      }),
    [],
  )

  useEffect(
    () => () => {
      for (const { lines, material } of outlines) {
        lines.geometry.dispose()
        material.dispose()
      }
    },
    [outlines],
  )

  useFrame(() => {
    const map = live.map
    const hovered = useTour.getState().hoverRoom
    ROOMS.forEach((room, i) => {
      const { lines, material } = outlines[i]
      material.opacity = map * (hovered === i ? 1 : 0.6)
      lines.visible = map > 0.02

      const pin = pinElements[i]
      if (!pin) return
      if (map < 0.02) {
        if (pin.style.visibility !== 'hidden') pin.style.visibility = 'hidden'
        return
      }
      // Pinul stă deasupra sălii, ca tija lui să coboare până în tavanul ei.
      anchor.set(room.floor[0], room.floor[1] + room.size[1], room.floor[2]).project(camera)
      screenX[i] = (anchor.x * 0.5 + 0.5) * size.width
      screenY[i] = (-anchor.y * 0.5 + 0.5) * size.height
      pin.style.visibility = 'visible'
      pin.style.opacity = String(MathUtils.smoothstep(map, 0.55, 1))
      pin.style.transform = `translate3d(${screenX[i].toFixed(1)}px, ${screenY[i].toFixed(1)}px, 0)`
    })
    if (map < 0.02) return

    // Etichetele nu au voie să se acopere: pornind de la pinul cel mai de jos, o etichetă
    // care ar călca peste una deja așezată urcă pe o tijă mai lungă.
    order.sort((a, b) => screenY[b] - screenY[a])
    let count = 0
    for (const i of order) {
      const pin = pinElements[i]
      if (!pin) continue
      const half = (pin.firstElementChild as HTMLElement).offsetWidth / 2 + 5
      let lift = LIFT
      for (let attempt = 0; attempt < 5; attempt++) {
        const top = screenY[i] - lift - LABEL - 5
        const bottom = screenY[i] - lift + 5
        let clash = false
        for (let k = 0; k < count; k++) {
          const other = placed[k]
          if (screenX[i] - half < other[1] && screenX[i] + half > other[0] && top < other[3] && bottom > other[2]) {
            clash = true
            break
          }
        }
        if (!clash) break
        lift += LABEL + 8
      }
      const slot = placed[count++]
      slot[0] = screenX[i] - half
      slot[1] = screenX[i] + half
      slot[2] = screenY[i] - lift - LABEL - 5
      slot[3] = screenY[i] - lift + 5
      if (lifts[i] !== lift) {
        lifts[i] = lift
        pin.style.setProperty('--lift', `${lift}px`)
      }
    }
  })

  return (
    <>
      {outlines.map(({ lines }, i) => (
        <primitive key={ROOMS[i].id} object={lines} />
      ))}
    </>
  )
}
