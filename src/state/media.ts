/**
 * Elementele video ale filmărilor, după `id`-ul filmării. Holograma le creează, iar cardul
 * din pagină are nevoie de ele ca să pornească sunetul chiar în handlerul de click:
 * Safari și iPhone opresc o filmare căreia i se dă sunet în afara unui gest al utilizatorului.
 */
export const recordingVideos = new Map<string, HTMLVideoElement>()
