import { BoxGeometry, BufferGeometry, CylinderGeometry, Float32BufferAttribute, SphereGeometry } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/**
 * Catedrala Națională, din spatele palatului, ca volum schematic: nava cu acoperiș în două ape,
 * transeptul, absidele, turla mare de deasupra naosului, clopotnița dinspre vest și patru turle
 * mici. Locul și orientarea vin din OpenStreetMap; proporțiile sunt aproximate din fotografii, nu
 * măsurate. Crucea turlei mari stă la circa 130 m, cât dă articolul de pe Wikipedia.
 *
 * Toate volumele au fețe plane (turlele sunt prisme cu opt laturi), ca lumina să cadă pe ele la
 * fel ca pe restul machetei orașului. Local, altarul e spre +Z (est), iar baza stă la y = 0.
 */

export type CathedralSpot = { x: number; z: number; angle: number; length: number; width: number }

const SIDES = 8

const box = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number) => {
  const g = new BoxGeometry(x1 - x0, y1 - y0, z1 - z0)
  g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2)
  return g
}

const drum = (x: number, z: number, radius: number, y0: number, y1: number) => {
  const g = new CylinderGeometry(radius, radius, y1 - y0, SIDES)
  g.rotateY(Math.PI / SIDES)
  g.translate(x, (y0 + y1) / 2, z)
  return g
}

/** Calotă cu opt fețe: o jumătate de sferă, turtită sau alungită pe verticală. */
const dome = (x: number, z: number, radius: number, y: number, rise: number) => {
  const g = new SphereGeometry(radius, SIDES, 4, 0, Math.PI * 2, 0, Math.PI / 2)
  g.rotateY(Math.PI / SIDES)
  g.scale(1, rise / radius, 1)
  g.translate(x, y, z)
  return g
}

/** Acoperiș în două ape, cu coama de-a lungul axei Z. */
const gable = (x0: number, x1: number, y: number, rise: number, z0: number, z1: number) => {
  const xm = (x0 + x1) / 2
  const top = y + rise
  // prettier-ignore
  const positions = [
    // Cele două ape.
    x0, y, z0, x0, y, z1, xm, top, z1, x0, y, z0, xm, top, z1, xm, top, z0,
    x1, y, z1, x1, y, z0, xm, top, z0, x1, y, z1, xm, top, z0, xm, top, z1,
    // Frontoanele.
    x0, y, z1, x1, y, z1, xm, top, z1,
    x1, y, z0, x0, y, z0, xm, top, z0,
  ]
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(positions, 3))
  return g
}

/** O turlă: tambur, calotă și cruce. */
function tower(x: number, z: number, radius: number, y0: number, y1: number, top: number): BufferGeometry[] {
  const rise = radius * 1.15
  const arm = Math.max(0.6, radius * 0.09)
  const cross = top - (top - y1 - rise) * 0.3
  return [
    drum(x, z, radius, y0, y1),
    dome(x, z, radius * 1.08, y1, rise),
    box(x - arm, x + arm, y1 + rise - 0.5, top, z - arm, z + arm),
    box(x - arm * 4, x + arm * 4, cross - arm, cross + arm, z - arm, z + arm),
  ]
}

export function buildCathedral(spot: CathedralSpot): BufferGeometry {
  // Proporțiile sunt gândite pentru o amprentă de 120 × 70 m și se întind după cea din date.
  const kz = spot.length / 120
  const kx = spot.width / 70

  const parts: BufferGeometry[] = [
    // Nava și pronaosul, cu acoperișul lor.
    box(-21, 21, 0, 40, -52, 32),
    gable(-21, 21, 40, 7, -52, 32),
    box(-26, 26, 0, 30, -60, -42),
    // Transeptul, cu absidele laterale, și absida altarului: toate mai joase decât nava.
    box(-31, 31, 0, 40, -4, 22),
    gable(-4, 22, 40, 6, -31, 31).rotateY(Math.PI / 2).translate(0, 0, 18),
    drum(-31, 9, 12, 0, 28),
    dome(-31, 9, 12, 28, 7),
    drum(31, 9, 12, 0, 28),
    dome(31, 9, 12, 28, 7),
    drum(0, 34, 16, 0, 30),
    dome(0, 34, 16, 30, 9),
    // Turla mare, zveltă, de deasupra naosului.
    box(-13, 13, 40, 52, -4, 22),
    ...tower(0, 9, 10, 52, 100, 130),
    // Clopotnița, deasupra intrării.
    box(-9, 9, 0, 64, -60, -42),
    ...tower(0, -51, 7, 64, 84, 104),
    // Turlele mici, la colțurile navei.
    ...tower(-17, -28, 4.6, 40, 60, 74),
    ...tower(17, -28, 4.6, 40, 60, 74),
    ...tower(-17, 28, 4.2, 40, 56, 68),
    ...tower(17, 28, 4.2, 40, 56, 68),
  ]

  // Fără indici și fără normalele netezite ale cilindrilor: le recalculăm pe fețe, la sfârșit.
  const flat = parts.map((part) => {
    const plain = part.index ? part.toNonIndexed() : part.clone()
    plain.deleteAttribute('uv')
    plain.deleteAttribute('normal')
    return plain
  })
  const merged = mergeGeometries(flat)
  for (const part of [...parts, ...flat]) part.dispose()
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
  merged.computeVertexNormals()
  return merged
}
