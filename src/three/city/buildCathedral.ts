import { BoxGeometry, type BufferGeometry, CylinderGeometry, SphereGeometry } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/**
 * Catedrala Națională, din spatele palatului, ca volum schematic: nava, absidele, turla mare de
 * deasupra naosului, clopotnița dinspre vest și patru turle mici. Locul și orientarea vin din
 * OpenStreetMap; proporțiile sunt aproximate din fotografii, nu măsurate.
 *
 * Local, altarul e spre +Z (est), iar baza stă la y = 0.
 */

export type CathedralSpot = { x: number; z: number; angle: number; length: number; width: number }

const box = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number) => {
  const g = new BoxGeometry(x1 - x0, y1 - y0, z1 - z0)
  g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2)
  return g
}

const drum = (x: number, z: number, radius: number, y0: number, y1: number, segments = 24) => {
  const g = new CylinderGeometry(radius, radius, y1 - y0, segments)
  g.translate(x, (y0 + y1) / 2, z)
  return g
}

/** Calotă: o jumătate de sferă, turtită sau alungită pe verticală. */
const dome = (x: number, z: number, radius: number, y: number, rise: number) => {
  const g = new SphereGeometry(radius, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2)
  g.scale(1, rise / radius, 1)
  g.translate(x, y, z)
  return g
}

/** O turlă: tambur, calotă și cruce. */
function tower(x: number, z: number, radius: number, y0: number, y1: number, top: number): BufferGeometry[] {
  const rise = radius * 1.05
  return [
    drum(x, z, radius, y0, y1),
    dome(x, z, radius * 1.06, y1, rise),
    box(x - 0.5, x + 0.5, y1 + rise - 0.5, top, z - 0.5, z + 0.5),
  ]
}

export function buildCathedral(spot: CathedralSpot): BufferGeometry {
  // Proporțiile sunt gândite pentru o amprentă de 120 × 70 m și se întind după cea din date.
  const kz = spot.length / 120
  const kx = spot.width / 70

  const parts: BufferGeometry[] = [
    // Nava și pronaosul.
    box(-22, 22, 0, 42, -52, 32),
    box(-27, 27, 0, 34, -60, -40),
    // Transeptul, cu absidele laterale, și absida altarului.
    box(-31, 31, 0, 42, -6, 24),
    drum(-31, 9, 14, 0, 37),
    drum(31, 9, 14, 0, 37),
    dome(-31, 9, 14, 37, 9),
    dome(31, 9, 14, 37, 9),
    drum(0, 36, 19, 0, 37),
    dome(0, 36, 19, 37, 11),
    // Turla mare, de deasupra naosului.
    ...tower(0, 9, 14, 42, 94, 127),
    // Clopotnița, deasupra intrării.
    box(-10, 10, 0, 62, -60, -40),
    ...tower(0, -50, 8, 62, 80, 98),
    // Turlele mici, la colțurile navei.
    ...tower(-20, -26, 5.5, 42, 56, 68),
    ...tower(20, -26, 5.5, 42, 56, 68),
    ...tower(-20, 30, 5, 42, 53, 64),
    ...tower(20, 30, 5, 42, 53, 64),
  ]

  const merged = mergeGeometries(parts.map((part) => part.toNonIndexed()))
  for (const part of parts) part.dispose()
  merged.deleteAttribute('uv')
  merged.scale(kx, 1, kz)

  // În date, `angle` e direcția laturii lungi față de axa X; altarul rămâne spre est (+Z).
  let dx = Math.cos(spot.angle)
  let dz = Math.sin(spot.angle)
  if (dz < 0) {
    dx = -dx
    dz = -dz
  }
  merged.rotateY(Math.atan2(dx, dz))
  merged.translate(spot.x, 0, spot.z)
  return merged
}
