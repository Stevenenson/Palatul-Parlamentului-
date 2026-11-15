import { MathUtils, type PerspectiveCamera, Vector3 } from 'three'
import { CITY_GEO, UNIRII_AXIS } from '../../content/city'
import { LIGHT_DEVICE, PAPER } from '../Lights'

/**
 * Scena ArcGIS a orașului (clădiri 3D detaliate, copaci, străzi), pentru prima oprire a turului.
 * Biblioteca Esri se încarcă de pe serverul ei abia când e nevoie de ea, deci nu intră în
 * pachetul site-ului. Scena nu primește gesturi: camera ei urmează, cadru cu cadru, camera
 * machetei noastre, așa că rotirea, apropierea și coborârea spre palat rămân ale turului.
 *
 * Dacă biblioteca sau datele nu se pot încărca, prima oprire rămâne cu macheta noastră a orașului.
 */

const SDK = 'https://js.arcgis.com/4.33/'
const LOAD_TIMEOUT = 25000

type EsriCamera = {
  position: { longitude: number; latitude: number; z: number }
  heading: number
  tilt: number
  fov: number
  clone: () => EsriCamera
}
type EsriLayer = { title: string | null; visible: boolean }
type EsriView = {
  camera: EsriCamera
  updating: boolean
  when: () => Promise<unknown>
  destroy: () => void
  map: { allLayers: { forEach: (each: (layer: EsriLayer) => void) => void }; add: (layer: object) => void }
}
type Constructor<T = object> = new (properties: object) => T
type AmdRequire = (modules: string[], loaded: (...modules: unknown[]) => void, failed: (error: unknown) => void) => void

let sdk: Promise<AmdRequire> | null = null

function loadSdk(): Promise<AmdRequire> {
  sdk ??= new Promise<AmdRequire>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error('ArcGIS: biblioteca nu a răspuns')), LOAD_TIMEOUT)
    const style = document.createElement('link')
    style.rel = 'stylesheet'
    style.href = `${SDK}esri/themes/light/main.css`
    const script = document.createElement('script')
    script.src = SDK
    script.async = true
    script.onload = () => {
      window.clearTimeout(timer)
      const amd = (window as unknown as { require?: AmdRequire }).require
      if (amd) resolve(amd)
      else reject(new Error('ArcGIS: biblioteca s-a încărcat fără `require`'))
    }
    script.onerror = () => {
      window.clearTimeout(timer)
      reject(new Error('ArcGIS: biblioteca nu s-a putut descărca'))
    }
    document.head.append(style, script)
  })
  return sdk
}

// ——— Din coordonatele machetei pe glob ———

const east = MathUtils.degToRad(CITY_GEO.eastDegrees)
/** Axele machetei, în metri spre est și spre nord: +Z e fațada (aproape est), +X e aproape nord. */
const Z_AXIS = [Math.cos(east), Math.sin(east)]
const X_AXIS = [-Z_AXIS[1], Z_AXIS[0]]

const longitudeOf = (x: number, z: number) =>
  CITY_GEO.longitude + (x * X_AXIS[0] + z * Z_AXIS[0]) / CITY_GEO.metersPerLongitude
const latitudeOf = (x: number, z: number) =>
  CITY_GEO.latitude + (x * X_AXIS[1] + z * Z_AXIS[1]) / CITY_GEO.metersPerLatitude

const forward = new Vector3()

export type ArcgisCity = {
  /** Scena a terminat de adus datele pentru cadrul curent. */
  settled: () => boolean
  /**
   * Pune camera scenei ArcGIS exact unde e camera machetei. `stretch` spune de câte ori e scena
   * ArcGIS mai înaltă decât canvas-ul machetei: imaginea ei trebuie să aibă aceeași scară.
   */
  follow: (camera: PerspectiveCamera, stretch: number) => void
  destroy: () => void
}

export async function createArcgisCity(container: HTMLElement): Promise<ArcgisCity> {
  const amd = await loadSdk()
  const [EsriMap, SceneView, GraphicsLayer, Graphic] = await new Promise<Constructor[]>((resolve, reject) => {
    amd(
      ['esri/Map', 'esri/views/SceneView', 'esri/layers/GraphicsLayer', 'esri/Graphic'],
      (...modules) => resolve(modules as Constructor[]),
      reject,
    )
  })

  const map = new EsriMap({ basemap: 'topo-3d', ground: 'world-elevation' }) as EsriView['map']

  // Axa Bulevardului Unirii, trasă pe teren, ca pe macheta noastră.
  const axis = new GraphicsLayer({ elevationInfo: { mode: 'on-the-ground' } }) as { add: (graphic: object) => void }
  axis.add(
    new Graphic({
      geometry: {
        type: 'polyline',
        spatialReference: { wkid: 4326 },
        paths: [
          [
            [longitudeOf(UNIRII_AXIS.from[0], UNIRII_AXIS.from[1]), latitudeOf(UNIRII_AXIS.from[0], UNIRII_AXIS.from[1])],
            [longitudeOf(UNIRII_AXIS.to[0], UNIRII_AXIS.to[1]), latitudeOf(UNIRII_AXIS.to[0], UNIRII_AXIS.to[1])],
          ],
        ],
      },
      symbol: { type: 'simple-line', color: [200, 69, 43, 0.92], width: LIGHT_DEVICE ? 2.5 : 3 },
    }),
  )
  map.add(axis)

  const view = new (SceneView as Constructor<EsriView>)({
    container,
    map,
    qualityProfile: LIGHT_DEVICE ? 'low' : 'high',
    // Cerul ia culoarea hârtiei, ca orizontul să se piardă în pagină.
    environment: {
      background: { type: 'color', color: PAPER },
      starsEnabled: false,
      atmosphereEnabled: false,
      lighting: {
        type: 'sun',
        // O dimineață de vară: soarele vine dinspre est și luminează fațada principală.
        date: new Date('2026-06-21T06:30:00Z'),
        directShadowsEnabled: !LIGHT_DEVICE,
      },
    },
    // Fără comenzile Esri: gesturile sunt ale turului. Atribuirea rămâne, cum cere licența.
    ui: { components: ['attribution'] },
    camera: {
      position: { longitude: longitudeOf(-1080, 1500), latitude: latitudeOf(-1080, 1500), z: 800 },
      heading: 320,
      tilt: 62,
    },
  })
  await view.when()

  // Numele de locuri ale Esri ar acoperi titlul și etichetele noastre.
  map.allLayers.forEach((layer) => {
    if (layer.title === 'Places and Labels') layer.visible = false
  })

  const last = { longitude: 0, latitude: 0, z: 0, heading: 0, tilt: 0, fov: 0 }

  return {
    settled: () => !view.updating,
    follow(camera, stretch) {
      const longitude = longitudeOf(camera.position.x, camera.position.z)
      const latitude = latitudeOf(camera.position.x, camera.position.z)
      const z = camera.position.y + CITY_GEO.altitude
      camera.getWorldDirection(forward)
      const towardEast = forward.x * X_AXIS[0] + forward.z * Z_AXIS[0]
      const towardNorth = forward.x * X_AXIS[1] + forward.z * Z_AXIS[1]
      const heading = (MathUtils.radToDeg(Math.atan2(towardEast, towardNorth)) + 360) % 360
      const tilt = MathUtils.radToDeg(Math.acos(MathUtils.clamp(-forward.y, -1, 1)))
      // Camera noastră are unghiul pe verticală; cea ArcGIS, pe diagonala ecranului.
      const half = Math.tan(MathUtils.degToRad(camera.fov) / 2)
      const fov = MathUtils.radToDeg(2 * Math.atan(half * Math.hypot(stretch, camera.aspect)))

      // Cât timp camera stă, scena ArcGIS e lăsată în pace, ca să nu deseneze degeaba.
      if (
        Math.abs(longitude - last.longitude) < 1e-8 &&
        Math.abs(latitude - last.latitude) < 1e-8 &&
        Math.abs(z - last.z) < 0.01 &&
        Math.abs(heading - last.heading) < 0.002 &&
        Math.abs(tilt - last.tilt) < 0.002 &&
        Math.abs(fov - last.fov) < 0.002
      ) {
        return
      }
      Object.assign(last, { longitude, latitude, z, heading, tilt, fov })
      const next = view.camera.clone()
      next.position.longitude = longitude
      next.position.latitude = latitude
      next.position.z = z
      next.heading = heading
      next.tilt = tilt
      next.fov = fov
      view.camera = next
    },
    destroy: () => view.destroy(),
  }
}
