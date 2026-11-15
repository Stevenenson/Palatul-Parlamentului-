import type { CityData } from '../three/city/buildCity'

const DATA_URL = `${import.meta.env.BASE_URL}data/oras.json`

let request: Promise<CityData> | null = null

/**
 * Datele machetei orașului. Cererea pornește o singură dată, de la primul apel: pagina o face
 * la pornire, în paralel cu descărcarea scenei 3D, ca orașul să fie gata odată cu palatul.
 */
export function loadCityData(): Promise<CityData> {
  request ??= fetch(DATA_URL).then((response) => {
    if (!response.ok) throw new Error(`oras.json: ${response.status}`)
    return response.json() as Promise<CityData>
  })
  return request
}
