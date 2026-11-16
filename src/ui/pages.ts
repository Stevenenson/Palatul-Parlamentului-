/**
 * Adresele celor două pagini. Pornesc de la `BASE_URL`, ca site-ul să meargă și
 * publicat într-un subfolder.
 */
const BASE = import.meta.env.BASE_URL

export const HISTORY_URL = `${BASE}history/`

/** Turul, opțional deschis direct la o oprire (directorul citește ancora la pornire). */
export const tourUrl = (stop?: string) => (stop ? `${BASE}#${stop}` : BASE)
