import { CITY_LABELS } from '../content/city'

/**
 * Elementele din pagină ale etichetelor de pe macheta orașului. Le înregistrează `ui/Hero.tsx`,
 * iar scena le mută peste reperele lor (`three/city/City.tsx`).
 */
export const cityLabelElements: (HTMLElement | null)[] = CITY_LABELS.map(() => null)
