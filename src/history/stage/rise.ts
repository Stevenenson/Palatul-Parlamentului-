import {
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineSegments,
  type Material,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Plane,
  PlaneGeometry,
  Vector3,
} from 'three'
import { buildPalace } from '../../three/palace/buildPalace'
import { PALACE, TERRACES, VOLUMES } from '../../three/palace/massing'
import { CLIP_TOP } from './states'

/** Culoarea tăieturii: piatră mai închisă decât pereții, ca secțiunea unei machete. */
const CUT = '#e0d9cb'
const INK = '#2b2d31'

/** Amprenta clădirii, în metri (fațada spre +Z). */
export const FOOTPRINT = { x0: -135, x1: 135, z0: -120, z1: 120 }

type Box = { x0: number; x1: number; y0: number; y1: number; z0: number; z1: number }

/**
 * Macheta pentru pagina de istorie: același palat ca în tur, plus un plan orizontal care îl
 * taie la o înălțime dată. Sub plan, clădirea e întreagă; deasupra, nu există încă. Ca
 * volumele tăiate să nu pară goale pe dinăuntru, fiecare primește un capac la înălțimea
 * tăieturii, în culoarea secțiunii. Toate volumele sunt cutii, deci capacul unei cutii e
 * chiar dreptunghiul ei.
 */
export function buildRisingPalace() {
  const palace = buildPalace()
  const plane = new Plane(new Vector3(0, -1, 0), CLIP_TOP)

  const clipped = new Set<Material>()
  palace.group.traverse((object) => {
    if (object.name === 'sit') return
    const material = (object as Mesh).material as Material | Material[] | undefined
    if (!material) return
    for (const m of Array.isArray(material) ? material : [material]) clipped.add(m)
  })
  // Planul de sit rămâne mereu: e locul, nu clădirea.
  const site = palace.group.getObjectByName('sit') as Mesh | undefined
  if (site) clipped.delete(site.material as Material)
  for (const material of clipped) {
    material.clippingPlanes = [plane]
    material.clipShadows = true
  }

  const capMaterial = new MeshStandardMaterial({ color: CUT, roughness: 0.96 })
  const caps: { mesh: Mesh; box: Box }[] = []
  const capGeometry = new PlaneGeometry(1, 1)
  capGeometry.rotateX(-Math.PI / 2)
  const capGroup = new Group()
  for (const box of [...VOLUMES, ...TERRACES] as Box[]) {
    const mesh = new Mesh(capGeometry, capMaterial)
    mesh.scale.set(box.x1 - box.x0, 1, box.z1 - box.z0)
    mesh.position.set((box.x0 + box.x1) / 2, 0, (box.z0 + box.z1) / 2)
    mesh.receiveShadow = true
    mesh.visible = false
    capGroup.add(mesh)
    caps.push({ mesh, box })
  }
  palace.group.add(capGroup)

  let lastClip = Number.NaN

  /** Întoarce `true` dacă s-a schimbat ceva care aruncă umbră. */
  const setClip = (height: number) => {
    if (Math.abs(height - lastClip) < 0.005) return false
    lastClip = height
    plane.constant = height
    for (const { mesh, box } of caps) {
      const inside = height > box.y0 + 0.01 && height < box.y1 - 0.01
      mesh.visible = inside
      if (inside) mesh.position.y = height - 0.01
    }
    return true
  }

  return {
    group: palace.group,
    setClip,
    setSite: (visible: boolean) => {
      if (site) site.visible = visible
    },
    dispose: () => {
      palace.dispose()
      capGeometry.dispose()
      capMaterial.dispose()
    },
  }
}

/**
 * Cotele de pe teren, ca pe o planșă: o linie de cotă în fața fațadei (lungimea) și una pe
 * latura din dreapta (lățimea), cu linii de capăt. Etichetele sunt text HTML, așezat de scenă.
 */
export function buildDimensions() {
  const y = 0.25
  const front = FOOTPRINT.z1 + 15
  const side = FOOTPRINT.x1 + 8.5
  const tick = 2.5
  const positions = [
    // Lungimea, 270 m.
    FOOTPRINT.x0, y, front, FOOTPRINT.x1, y, front,
    FOOTPRINT.x0, y, FOOTPRINT.z1 + 2, FOOTPRINT.x0, y, front + tick,
    FOOTPRINT.x1, y, FOOTPRINT.z1 + 2, FOOTPRINT.x1, y, front + tick,
    // Lățimea, 240 m.
    side, y, FOOTPRINT.z0, side, y, FOOTPRINT.z1,
    FOOTPRINT.x1 + 2, y, FOOTPRINT.z0, side + tick, y, FOOTPRINT.z0,
    FOOTPRINT.x1 + 2, y, FOOTPRINT.z1, side + tick, y, FOOTPRINT.z1,
  ]
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  const material = new LineBasicMaterial({ color: INK, transparent: true, opacity: 0, depthWrite: false })
  const lines = new LineSegments(geometry, material)
  lines.visible = false
  lines.renderOrder = 2
  return {
    lines,
    /** Unde stau etichetele: lângă mijlocul fiecărei linii de cotă, în afara clădirii. */
    labels: [new Vector3(0, y, front + 9), new Vector3(side + 12, y, 0)],
    set: (amount: number) => {
      material.opacity = 0.85 * amount
      lines.visible = amount > 0.005
    },
    dispose: () => {
      geometry.dispose()
      material.dispose()
    },
  }
}

const ACCENT = '#c8452b'

/**
 * Liniile capitolelor de arhitectură. Axa de simetrie e o fâșie roșie pe teren, din spatele
 * clădirii până la capătul bulevardului; se desenează peste clădire, ca pe o planșă, iar din
 * axul ei (de unde o privește camera) cade exact pe mijlocul fațadei. Registrele sunt o linie
 * verticală pe colțul din stânga al fațadei, cu câte o crestătură la fiecare treaptă.
 */
export function buildGuides() {
  const axisGeometry = new PlaneGeometry(2.4, 968)
  axisGeometry.rotateX(-Math.PI / 2)
  axisGeometry.translate(0, PALACE.ground + 0.3, 334)
  const axisMaterial = new MeshBasicMaterial({
    color: ACCENT,
    transparent: true,
    opacity: 0,
    depthTest: false,
    depthWrite: false,
  })
  const axis = new Mesh(axisGeometry, axisMaterial)
  axis.visible = false
  axis.renderOrder = 3

  // Treptele vin din volumele machetei: corpul de bază, registrul median, turnul.
  const top = (id: string) => VOLUMES.find((volume) => volume.id === id)?.y1 ?? 0
  const levels = [0, top('base'), top('mid-front'), top('tower')]
  const x = FOOTPRINT.x0 - 17
  const z = FOOTPRINT.z1 + 7
  const tick = 5
  const positions = [x, levels[0], z, x, levels[3], z]
  for (const y of levels) positions.push(x - tick, y, z, x + tick, y, z)
  const registerGeometry = new BufferGeometry()
  registerGeometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  const registerMaterial = new LineBasicMaterial({ color: INK, transparent: true, opacity: 0, depthWrite: false })
  const registers = new LineSegments(registerGeometry, registerMaterial)
  registers.visible = false
  registers.renderOrder = 2

  const group = new Group()
  group.add(axis, registers)

  return {
    group,
    /** Eticheta axei, pe bulevard, și câte una la mijlocul fiecărui registru, în stânga liniei. */
    labels: [
      new Vector3(0, PALACE.ground + 0.3, 285),
      ...[0, 1, 2].map((i) => new Vector3(x - 9, (levels[i] + levels[i + 1]) / 2, z)),
    ],
    set: (axisAmount: number, registerAmount: number) => {
      axisMaterial.opacity = 0.9 * axisAmount
      axis.visible = axisAmount > 0.005
      registerMaterial.opacity = 0.85 * registerAmount
      registers.visible = registerAmount > 0.005
    },
    dispose: () => {
      axisGeometry.dispose()
      axisMaterial.dispose()
      registerGeometry.dispose()
      registerMaterial.dispose()
    },
  }
}
