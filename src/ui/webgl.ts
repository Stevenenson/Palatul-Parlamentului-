/** Poate browserul să deseneze macheta? Fără WebGL 2, paginile rămân doar cu text și imagini. */
export function hasWebGL() {
  try {
    const gl = document.createElement('canvas').getContext('webgl2')
    // Contextul de probă se eliberează imediat: browserele țin doar câteva deschise.
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
    return Boolean(gl)
  } catch {
    return false
  }
}
