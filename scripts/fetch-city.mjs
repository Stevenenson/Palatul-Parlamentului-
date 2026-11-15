// Macheta orașului din jurul palatului, din date OpenStreetMap (© colaboratorii OpenStreetMap, ODbL).
//   node scripts/fetch-city.mjs               → cere datele de la Overpass și scrie public/data/oras.json
//   node scripts/fetch-city.mjs --raw f.json  → pornește de la un răspuns Overpass salvat (se pot da mai multe fișiere)
//
// Scriptul se rulează rar, de mână: rezultatul stă în repo, deci site-ul nu depinde de Overpass.
// Coordonatele ies în sistemul machetei: metri, cu originea în centrul palatului, fațada
// principală spre +Z (est) și +X spre nord, ca în `src/three/palace/massing.ts`.
import { readFile, writeFile, mkdir } from 'node:fs/promises'

/** sud, vest, nord, est: de la Casa Academiei și catedrală până la Piața Unirii și Dâmbovița. */
const BBOX = [44.4185, 26.073, 44.4375, 26.106]
/** Zona, ceva mai strânsă, în care aducem și detaliile: copaci, alei, părți de clădiri, terenuri. */
const DETAIL = [44.4195, 26.0745, 44.4365, 26.104]
const PALACE_RELATION = 2230391
const CATHEDRAL_WAY = 232332568

const all = `(${BBOX.join(',')})`
const near = `(${DETAIL.join(',')})`
const QUERY = `[out:json][timeout:180];
(
  way[building]${all};
  relation[building]${all};
  way[leisure~"^(park|garden)$"]${all};
  relation[leisure~"^(park|garden)$"]${all};
  way[landuse~"^(grass|forest)$"]${all};
  way[natural=water]${all};
  relation[natural=water]${all};
  way[waterway~"^(river|canal)$"]${all};
  way[highway~"^(trunk|primary|secondary|tertiary)$"]${all};
  node[natural=tree]${near};
  way[natural=tree_row]${near};
  way["building:part"]${near};
  relation["building:part"]${near};
  way[highway~"^(footway|path|pedestrian|residential|living_street|unclassified|service|cycleway|steps)$"]${near};
  way[amenity~"^(parking|fountain)$"]${near};
  way[leisure~"^(pitch|playground)$"]${near};
  way[natural~"^(scrub|wood)$"]${near};
  way[landuse~"^(meadow|flowerbed|village_green)$"]${near};
  way[barrier=hedge]${near};
);
out geom;`

async function load() {
  const i = process.argv.indexOf('--raw')
  if (i > 0) {
    // Mai multe răspunsuri salvate se pun cap la cap, fără dubluri.
    const seen = new Set()
    const merged = { elements: [] }
    for (const file of process.argv.slice(i + 1)) {
      const part = JSON.parse(await readFile(file, 'utf8'))
      merged.osm3s ??= part.osm3s
      for (const element of part.elements) {
        const key = `${element.type}/${element.id}`
        if (seen.has(key)) continue
        seen.add(key)
        merged.elements.push(element)
      }
    }
    return merged
  }
  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'User-Agent': 'city-model-script/1.0' },
    body: new URLSearchParams({ data: QUERY }),
  })
  if (!response.ok) throw new Error(`Overpass a răspuns ${response.status}`)
  return response.json()
}

// ——— Proiecția: metri spre est și spre nord față de mijlocul zonei ———

const LAT0 = (BBOX[0] + BBOX[2]) / 2
const LON0 = (BBOX[1] + BBOX[3]) / 2
const phi = (LAT0 * Math.PI) / 180
const M_LAT = 111132.95 - 559.85 * Math.cos(2 * phi) + 1.17 * Math.cos(4 * phi)
const M_LON = 111412.88 * Math.cos(phi) - 93.5 * Math.cos(3 * phi)

const toEN = (p) => [(p.lon - LON0) * M_LON, (p.lat - LAT0) * M_LAT]

// ——— Geometrie ———

const area = (ring) => {
  let a = 0
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    a += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1]
  }
  return a / 2
}

const centroid = (ring) => {
  let x = 0
  let y = 0
  for (const p of ring) {
    x += p[0]
    y += p[1]
  }
  return [x / ring.length, y / ring.length]
}

function distanceToSegment(p, a, b) {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const l2 = dx * dx + dy * dy
  const t = l2 === 0 ? 0 : Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2))
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy)
}

/** Douglas–Peucker pe o linie deschisă. */
function simplifyLine(points, tolerance) {
  if (points.length < 3) return points
  const keep = new Uint8Array(points.length)
  keep[0] = keep[points.length - 1] = 1
  const stack = [[0, points.length - 1]]
  while (stack.length) {
    const [a, b] = stack.pop()
    let worst = 0
    let at = -1
    for (let i = a + 1; i < b; i++) {
      const d = distanceToSegment(points[i], points[a], points[b])
      if (d > worst) {
        worst = d
        at = i
      }
    }
    if (worst > tolerance) {
      keep[at] = 1
      stack.push([a, at], [at, b])
    }
  }
  return points.filter((_, i) => keep[i])
}

/** Un contur închis (fără punctul de capăt repetat), simplificat. */
function simplifyRing(ring, tolerance) {
  if (ring.length < 5) return ring
  // Tăiem conturul în două linii, între punctele cele mai depărtate, ca ambele capete să rămână.
  let far = 0
  let best = -1
  for (let i = 1; i < ring.length; i++) {
    const d = Math.hypot(ring[i][0] - ring[0][0], ring[i][1] - ring[0][1])
    if (d > best) {
      best = d
      far = i
    }
  }
  const first = simplifyLine(ring.slice(0, far + 1), tolerance)
  const second = simplifyLine([...ring.slice(far), ring[0]], tolerance)
  return [...first.slice(0, -1), ...second.slice(0, -1)]
}

const closedRing = (geometry) => {
  const ring = geometry.map(toEN)
  const a = ring[0]
  const b = ring[ring.length - 1]
  if (ring.length > 1 && Math.hypot(a[0] - b[0], a[1] - b[1]) < 0.01) ring.pop()
  return ring
}

/** Leagă bucățile unei relații în contururi închise. */
function stitch(members) {
  const pieces = members.map((m) => m.geometry.map(toEN))
  const rings = []
  const near = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]) < 0.01
  while (pieces.length) {
    let line = pieces.pop()
    let grown = true
    while (!near(line[0], line[line.length - 1]) && grown) {
      grown = false
      for (let i = 0; i < pieces.length; i++) {
        const piece = pieces[i]
        const end = line[line.length - 1]
        if (near(piece[0], end)) line = [...line, ...piece.slice(1)]
        else if (near(piece[piece.length - 1], end)) line = [...line, ...piece.slice(0, -1).reverse()]
        else continue
        pieces.splice(i, 1)
        grown = true
        break
      }
    }
    if (line.length > 3 && near(line[0], line[line.length - 1])) rings.push(line.slice(0, -1))
  }
  return rings
}

/** Poligoanele unui element: fiecare cu un contur exterior și eventualele curți. */
function polygons(element) {
  if (element.type === 'way') {
    if (!element.geometry || element.geometry.length < 4) return []
    const first = element.geometry[0]
    const last = element.geometry[element.geometry.length - 1]
    if (first.lat !== last.lat || first.lon !== last.lon) return []
    return [{ outer: closedRing(element.geometry), holes: [] }]
  }
  const members = (element.members ?? []).filter((m) => m.type === 'way' && m.geometry)
  const outers = stitch(members.filter((m) => m.role !== 'inner'))
  const inners = stitch(members.filter((m) => m.role === 'inner'))
  return outers.map((outer) => ({
    outer,
    holes: inners.filter((hole) => inside(centroid(hole), outer)),
  }))
}

function inside(p, ring) {
  let hit = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i]
    const b = ring[j]
    if (a[1] > p[1] !== b[1] > p[1] && p[0] < ((b[0] - a[0]) * (p[1] - a[1])) / (b[1] - a[1]) + a[0]) hit = !hit
  }
  return hit
}

/** Dreptunghiul de arie minimă al unui contur: centru, unghiul laturii lungi, laturi. */
function boundingRect(ring) {
  let best = null
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]
    const b = ring[(i + 1) % ring.length]
    const angle = Math.atan2(b[1] - a[1], b[0] - a[0])
    const c = Math.cos(angle)
    const s = Math.sin(angle)
    let u0 = Infinity
    let u1 = -Infinity
    let v0 = Infinity
    let v1 = -Infinity
    for (const p of ring) {
      const u = p[0] * c + p[1] * s
      const v = -p[0] * s + p[1] * c
      u0 = Math.min(u0, u)
      u1 = Math.max(u1, u)
      v0 = Math.min(v0, v)
      v1 = Math.max(v1, v)
    }
    const size = (u1 - u0) * (v1 - v0)
    if (!best || size < best.size) {
      const cu = (u0 + u1) / 2
      const cv = (v0 + v1) / 2
      best = { size, angle, center: [cu * c - cv * s, cu * s + cv * c], u: u1 - u0, v: v1 - v0 }
    }
  }
  return best
}

// ——— Înălțimi ———

const LOW = new Set(['house', 'detached', 'garage', 'garages', 'shed', 'hut', 'kiosk', 'roof', 'service', 'cabin'])

function heightOf(tags, footprint) {
  const tagged = Number.parseFloat(tags.height)
  if (Number.isFinite(tagged) && tagged > 1) return Math.min(tagged, 110)
  const levels = Number.parseFloat(tags['building:levels'])
  if (Number.isFinite(levels) && levels > 0) return Math.min(levels * 3.1 + 1.5, 110)
  if (LOW.has(tags.building)) return 5
  if (tags.building === 'apartments') return footprint > 400 ? 28 : 16
  if (tags.building === 'church' || tags.building === 'cathedral' || tags.building === 'chapel') return 16
  if (footprint < 120) return 5
  if (footprint < 500) return 9
  return 15
}

// ——— Prelucrarea ———

const data = await load()
const elements = data.elements

const palace = elements.find((e) => e.type === 'relation' && e.id === PALACE_RELATION)
if (!palace) throw new Error('Palatul lipsește din răspuns.')
const palaceRing = polygons(palace).sort((a, b) => Math.abs(area(b.outer)) - Math.abs(area(a.outer)))[0].outer
const rect = boundingRect(palaceRing)

// Latura lungă a palatului merge aproximativ nord–sud; axa Z a machetei e perpendiculara ei, spre est.
let east = rect.u >= rect.v ? rect.angle - Math.PI / 2 : rect.angle
east = Math.atan2(Math.sin(east), Math.cos(east))
if (Math.cos(east) < 0) east += Math.PI
const cz = [Math.cos(east), Math.sin(east)]
const cx = [-cz[1], cz[0]]
const origin = rect.center

/** Din metri est/nord în coordonatele machetei [x, z]. */
const toModel = (p) => {
  const e = p[0] - origin[0]
  const n = p[1] - origin[1]
  return [e * cx[0] + n * cx[1], e * cz[0] + n * cz[1]]
}

const dm = (value) => Math.round(value * 10)
const flat = (ring) => ring.flatMap((p) => [dm(p[0]), dm(p[1])])
const modelRing = (ring, tolerance) => simplifyRing(ring.map(toModel), tolerance)

/** Curtea palatului, cu terasele: aici desenăm noi, nu OSM. */
const inPalace = ([x, z]) => Math.abs(x) < 150 && z > -140 && z < 150

/** Zona strictă a detaliilor, în coordonatele machetei: ce cade în afara ei nu intră în date. */
const inDetail = (p) => {
  const e = p[0] * cx[0] + p[1] * cz[0] + origin[0]
  const n = p[0] * cx[1] + p[1] * cz[1] + origin[1]
  const lon = LON0 + e / M_LON
  const lat = LAT0 + n / M_LAT
  return lat > DETAIL[0] && lat < DETAIL[2] && lon > DETAIL[1] && lon < DETAIL[3]
}

/** Un număr între 0 și 1, mereu același pentru același punct: macheta iese la fel la fiecare rulare. */
const noise = (x, z, salt = 0) => {
  const v = Math.sin(x * 12.9898 + z * 78.233 + salt * 37.719) * 43758.5453
  return v - Math.floor(v)
}

const buildings = []
/** Contururile clădirilor, păstrate ca să le potrivim cu părțile lor. */
const outlines = []
const partsFound = []
const parks = []
const water = []
const rivers = []
const streets = []
const trees = []
const paths = []
const plazas = []
const lots = []
const courts = []
const hedges = []
const marks = {}
let cathedral = null
let cathedralRing = null

/** Terasele machetei palatului (`TERRACES` din `src/three/palace/massing.ts`), cu o margine de 4 m. */
const onTerraces = ([x, z]) => Math.abs(x) < 174 && z > -156 && z < 190

const addTree = (p) => {
  if (!onTerraces(p) && inDetail(p)) trees.push(dm(p[0]), dm(p[1]))
}

/** Lățimea unei alei sau a unei străzi mici, în metri. */
const PATH_WIDTH = { footway: 2.4, path: 2, steps: 2.6, cycleway: 2, pedestrian: 5 }
const LANE_WIDTH = { residential: 6.5, living_street: 5.5, unclassified: 6.5, service: 3.6 }

for (const element of elements) {
  const tags = element.tags ?? {}

  if (element.type === 'node') {
    if (tags.natural === 'tree') addTree(toModel(toEN(element)))
    continue
  }

  // Un șir de copaci: câte unul la 8 m de-a lungul liniei.
  if (tags.natural === 'tree_row' && element.geometry) {
    const line = element.geometry.map(toEN).map(toModel)
    let carry = 0
    for (let i = 1; i < line.length; i++) {
      const a = line[i - 1]
      const b = line[i]
      const length = Math.hypot(b[0] - a[0], b[1] - a[1])
      for (let d = carry; d < length; d += 8) {
        addTree([a[0] + ((b[0] - a[0]) * d) / length, a[1] + ((b[1] - a[1]) * d) / length])
      }
      carry = (carry + 8 - (length % 8)) % 8
    }
    continue
  }

  // O parte de clădire: volum propriu, cu înălțimea și, uneori, cu nivelul de la care pornește.
  if (tags['building:part'] && !tags.building) {
    const tall = Number.parseFloat(tags.height)
    const levels = Number.parseFloat(tags['building:levels'])
    const top = Number.isFinite(tall) && tall > 1 ? tall : Number.isFinite(levels) && levels > 0 ? levels * 3.1 + 1.5 : null
    if (top === null) continue
    const from = Number.parseFloat(tags.min_height)
    const fromLevel = Number.parseFloat(tags['building:min_level'])
    const base = Number.isFinite(from) ? from : Number.isFinite(fromLevel) ? fromLevel * 3.1 : 0
    if (top - base < 1) continue
    for (const polygon of polygons(element)) {
      const outer = modelRing(polygon.outer, 0.6)
      const footprint = Math.abs(area(outer))
      if (outer.length < 3 || footprint < 12) continue
      const center = centroid(outer)
      if (inPalace(center)) continue
      partsFound.push({ top: Math.min(top, 110), base, outer, footprint, center })
    }
    continue
  }

  if (tags.building) {
    if (element.type === 'relation' && element.id === PALACE_RELATION) continue
    for (const polygon of polygons(element)) {
      const outer = modelRing(polygon.outer, 0.7)
      const footprint = Math.abs(area(outer))
      if (outer.length < 3 || footprint < 30) continue
      const center = centroid(outer)
      if (inPalace(center)) continue
      if (element.type === 'way' && element.id === CATHEDRAL_WAY) {
        cathedralRing = outer
        const box = boundingRect(outer)
        cathedral = {
          x: +box.center[0].toFixed(1),
          z: +box.center[1].toFixed(1),
          // Unghiul laturii lungi față de axa X a machetei, în jurul verticalei.
          angle: +(box.u >= box.v ? box.angle : box.angle + Math.PI / 2).toFixed(4),
          length: +Math.max(box.u, box.v).toFixed(1),
          width: +Math.min(box.u, box.v).toFixed(1),
        }
        continue
      }
      const holes = polygon.holes
        .map((hole) => modelRing(hole, 0.7))
        .filter((hole) => hole.length >= 3 && Math.abs(area(hole)) > 40)
      outlines.push({ entry: [dm(heightOf(tags, footprint)), flat(outer), ...holes.map(flat)], outer, footprint })
      if (tags.name === 'Casa Academiei') marks.academie = center.map((c) => Math.round(c))
    }
    continue
  }

  // Parcările, terenurile de sport și locurile de joacă: suprafețe plate, fiecare cu tonul ei.
  if (tags.amenity === 'parking' || tags.leisure === 'pitch' || tags.leisure === 'playground') {
    for (const polygon of polygons(element)) {
      const outer = modelRing(polygon.outer, 0.8)
      if (outer.length < 3 || Math.abs(area(outer)) < 60) continue
      ;(tags.amenity === 'parking' ? lots : courts).push(flat(outer))
    }
    continue
  }

  if (tags.barrier === 'hedge' && element.geometry) {
    const line = simplifyLine(element.geometry.map(toEN).map(toModel), 0.8)
    if (line.length > 1) hedges.push([dm(1.6), ...flat(line)])
    continue
  }

  const green =
    tags.leisure === 'park' ||
    tags.leisure === 'garden' ||
    ['grass', 'forest', 'meadow', 'flowerbed', 'village_green'].includes(tags.landuse) ||
    tags.natural === 'wood' ||
    tags.natural === 'scrub'
  if (green) {
    const small = tags.landuse === 'flowerbed' || tags.natural === 'scrub' || tags.natural === 'wood'
    for (const polygon of polygons(element)) {
      const outer = modelRing(polygon.outer, small ? 0.8 : 1.5)
      if (outer.length < 3 || Math.abs(area(outer)) < (small ? 40 : 500)) continue
      parks.push(flat(outer))
      // Un pâlc de pădure nu are copacii desenați unul câte unul: îi presărăm noi, la circa 11 m.
      if (tags.natural === 'wood' || tags.landuse === 'forest') {
        const xs = outer.map((p) => p[0])
        const zs = outer.map((p) => p[1])
        for (let x = Math.min(...xs); x < Math.max(...xs); x += 11) {
          for (let z = Math.min(...zs); z < Math.max(...zs); z += 11) {
            const p = [x + noise(x, z) * 8, z + noise(x, z, 1) * 8]
            if (inside(p, outer)) addTree(p)
          }
        }
      }
      if (tags.name === 'Parcul Izvor') marks.izvor = centroid(outer).map((c) => Math.round(c))
      if (tags.name === 'Parcul Unirii') marks.unirii = centroid(outer).map((c) => Math.round(c))
    }
    continue
  }

  if (tags.natural === 'water' || tags.amenity === 'fountain') {
    for (const polygon of polygons(element)) {
      const outer = modelRing(polygon.outer, 1)
      if (outer.length >= 3 && Math.abs(area(outer)) > 150) water.push(flat(outer))
    }
    continue
  }

  if (tags.waterway && element.geometry) {
    const line = simplifyLine(element.geometry.map(toEN).map(toModel), 1.5)
    rivers.push([dm(26), ...flat(line)])
    continue
  }

  // Aleile și piețele pietonale.
  if (tags.highway in PATH_WIDTH && element.geometry) {
    if (tags.area === 'yes') {
      for (const polygon of polygons(element)) {
        const outer = modelRing(polygon.outer, 0.8)
        if (outer.length >= 3 && Math.abs(area(outer)) > 60) plazas.push(flat(outer))
      }
      continue
    }
    const line = simplifyLine(element.geometry.map(toEN).map(toModel), 0.8)
    if (line.length > 1) paths.push([dm(PATH_WIDTH[tags.highway]), ...flat(line)])
    continue
  }

  // Străzile mici, dintre blocuri.
  if (tags.highway in LANE_WIDTH && element.geometry) {
    const line = simplifyLine(element.geometry.map(toEN).map(toModel), 1)
    if (line.length > 1) streets.push([dm(LANE_WIDTH[tags.highway]), ...flat(line)])
    continue
  }

  if (tags.highway && element.geometry) {
    const line = simplifyLine(element.geometry.map(toEN).map(toModel), 1)
    const lanes = Number.parseFloat(tags.lanes)
    const width = Number.isFinite(lanes) ? lanes * 3.4 : tags.highway === 'tertiary' ? 8 : 11
    streets.push([dm(Math.min(width, 18)), ...flat(line)])
    if (tags.name === 'Bulevardul Unirii') {
      const zs = line.map((p) => p[1])
      const xs = line.map((p) => p[0])
      marks.bulevard = marks.bulevard ?? { z0: Infinity, z1: -Infinity, x: [] }
      marks.bulevard.z0 = Math.round(Math.min(marks.bulevard.z0, ...zs))
      marks.bulevard.z1 = Math.round(Math.max(marks.bulevard.z1, ...zs))
      marks.bulevard.x.push(...xs)
    }
  }
}

// Părțile unei clădiri îi înlocuiesc conturul doar dacă îl acoperă aproape tot; altfel rămâne
// conturul, iar părțile lui se lasă deoparte, ca aceeași clădire să nu fie desenată de două ori.
const parts = []
const taken = new Set()
for (const outline of outlines) {
  const mine = partsFound.filter((part, i) => !taken.has(i) && inside(part.center, outline.outer))
  const covered = mine.filter((part) => part.base < 1).reduce((sum, part) => sum + part.footprint, 0)
  const replace = covered >= outline.footprint * 0.7
  for (const part of mine) taken.add(partsFound.indexOf(part))
  if (!replace) {
    buildings.push(outline.entry)
    continue
  }
  for (const part of mine) parts.push([dm(part.top), dm(part.base), flat(part.outer)])
}
// Părțile fără contur de clădire (în afara catedralei, pe care o desenăm noi) rămân ca volume de sine stătătoare.
partsFound.forEach((part, i) => {
  if (taken.has(i) || (cathedralRing && inside(part.center, cathedralRing))) return
  parts.push([dm(part.top), dm(part.base), flat(part.outer)])
})

if (marks.bulevard) {
  const xs = marks.bulevard.x
  marks.bulevard.x = +(xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(1)
}

const out = {
  source: 'Date cartografice © colaboratorii OpenStreetMap, licența ODbL',
  osmBase: data.osm3s?.timestamp_osm_base ?? null,
  cathedral,
  buildings,
  parts,
  parks,
  lots,
  courts,
  plazas,
  water,
  rivers,
  streets,
  paths,
  hedges,
  trees,
}

const folder = new URL('../public/data/', import.meta.url)
await mkdir(folder, { recursive: true })
const json = JSON.stringify(out)
await writeFile(new URL('oras.json', folder), json)

console.log(`palat: ${Math.max(rect.u, rect.v).toFixed(0)} × ${Math.min(rect.u, rect.v).toFixed(0)} m în OSM`)
console.log(`axa fațadei: ${((east * 180) / Math.PI).toFixed(3)}° față de est`)
console.log(`centrul palatului: ${(LAT0 + origin[1] / M_LAT).toFixed(6)}, ${(LON0 + origin[0] / M_LON).toFixed(6)}`)
console.log(`clădiri ${buildings.length} + ${parts.length} părți, parcuri ${parks.length}, ape ${water.length + rivers.length}, străzi ${streets.length}`)
console.log(`copaci ${trees.length / 2}, alei ${paths.length}, piețe ${plazas.length}, parcări ${lots.length}, terenuri ${courts.length}, garduri vii ${hedges.length}`)
console.log('catedrala', cathedral)
console.log('repere', marks)
console.log(`public/data/oras.json: ${(json.length / 1024).toFixed(0)} kB`)
