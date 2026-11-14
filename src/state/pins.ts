import { ROOMS } from '../content/rooms'

/**
 * Elementele din pagină ale pinurilor de pe hartă. Le înregistrează `ui/MapSection.tsx`,
 * iar scena le mută peste sălile lor (`three/map/MapMarkers.tsx`).
 */
export const pinElements: (HTMLElement | null)[] = ROOMS.map(() => null)
