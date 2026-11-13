import { build, preview } from 'vite'
import { chromium } from 'playwright-core'

/** Construiește site-ul și îl servește local, ca în producție. */
export async function startSite() {
  await build({ logLevel: 'error' })
  const server = await preview({
    logLevel: 'error',
    preview: { port: 4183, strictPort: false, host: '127.0.0.1' },
  })
  const url = server.resolvedUrls?.local?.[0]
  if (!url) throw new Error('Serverul de previzualizare nu a pornit.')
  return {
    url: `${url}?debug`,
    close: () => (server.close ? server.close() : server.httpServer.close()),
  }
}

/** Chrome-ul instalat pe calculator, fără fereastră; WebGL merge și pe procesor dacă lipsește placa video. */
export async function launchBrowser() {
  const args = ['--ignore-gpu-blocklist', '--enable-unsafe-swiftshader']
  try {
    return await chromium.launch({ channel: 'chrome', args })
  } catch {
    return chromium.launch({ args })
  }
}

/** Deschide pagina și așteaptă până când scena 3D desenează cadre. */
export async function openTour(browser, url, viewport) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: viewport.scale ?? 1,
    isMobile: Boolean(viewport.mobile),
    hasTouch: Boolean(viewport.mobile),
    reducedMotion: viewport.reducedMotion ? 'reduce' : 'no-preference',
  })
  const page = await context.newPage()
  const errors = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(String(error)))
  await page.goto(url + (viewport.hash ?? ''), { waitUntil: 'load' })
  await page.waitForFunction(() => window.__tour && window.__tour.live.frames > 8, null, {
    timeout: 30000,
  })
  await page.evaluate(() => document.fonts.ready)
  return { context, page, errors }
}

/** Așteaptă până când camera a ajuns unde o trimite scroll-ul. */
export async function waitForCamera(page) {
  // Evenimentul de scroll ajunge abia în cadrul următor; fără pauza asta am verifica poziția veche.
  await page.evaluate(
    () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))),
  )
  await page.waitForFunction(
    () => {
      const { live } = window.__tour
      return live.flightTo === null && Math.abs(live.t - live.tTarget) < 0.0015
    },
    null,
    { timeout: 30000 },
  )
  const frames = await page.evaluate(() => window.__tour.live.frames)
  await page.waitForFunction((n) => window.__tour.live.frames > n + 4, frames, { timeout: 30000 })
}

/** Dă din rotiță și așteaptă până când pagina se așază singură pe o oprire. */
export async function wheelAndSettle(page, deltaY) {
  const from = await page.evaluate(() => window.scrollY)
  await page.mouse.wheel(0, deltaY)
  await page.waitForFunction((y) => Math.abs(window.scrollY - y) > 1, from, { timeout: 5000 })
  await page.waitForFunction(
    () => {
      const still = window.__lastY === window.scrollY
      window.__lastY = window.scrollY
      return still && window.__tour.anchors().some((a) => Math.abs(a - window.scrollY) < 2)
    },
    null,
    { timeout: 10000, polling: 200 },
  )
  await waitForCamera(page)
}
