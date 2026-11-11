// Teste rapide pe site-ul construit: scena pornește, scroll-ul mută turul,
// oprirea se așază singură, linkurile duc unde spun și consola rămâne curată.
import {
  launchBrowser,
  openTour,
  startSite,
  waitForCamera,
  wheelAndSettle,
} from './lib/site.mjs'

const site = await startSite()
const browser = await launchBrowser()
const results = []

async function check(name, fn) {
  try {
    await fn()
    results.push({ name, ok: true })
  } catch (error) {
    results.push({ name, ok: false, detail: String(error.message ?? error).split('\n')[0] })
  }
}

function expect(condition, message) {
  if (!condition) throw new Error(message)
}

const currentStop = (page) =>
  page.evaluate(() => {
    const items = [...document.querySelectorAll('.stopnav__item')]
    return items.findIndex((item) => item.hasAttribute('aria-current'))
  })

try {
  const { context, page, errors } = await openTour(browser, site.url, { width: 1280, height: 800 })
  const anchors = await page.evaluate(() => window.__tour.anchors())
  const last = anchors.length - 1

  await check('scena 3D desenează', async () => {
    const ok = await page.evaluate(() => {
      const canvas = document.querySelector('.stage canvas')
      return Boolean(canvas && canvas.width > 0 && window.__tour.live.frames > 8)
    })
    expect(ok, 'canvas-ul lipsește sau nu desenează')
  })

  await check('fiecare oprire are secțiune și ancoră distinctă', async () => {
    expect(anchors.length >= 6, `doar ${anchors.length} opriri`)
    for (let i = 1; i < anchors.length; i++) {
      expect(anchors[i] > anchors[i - 1], `ancora ${i} nu e sub ancora ${i - 1}`)
    }
  })

  await check('scroll-ul schimbă oprirea activă', async () => {
    await page.evaluate((y) => window.scrollTo(0, y), anchors[2])
    await waitForCamera(page)
    expect((await currentStop(page)) === 2, 'oprirea activă nu e a treia')
    const t = await page.evaluate(() => window.__tour.live.t)
    expect(Math.abs(t - 2) < 0.01, `camera e la t=${t}`)
  })

  await check('scroll-ul parțial se așază pe oprirea următoare', async () => {
    await page.evaluate((y) => window.scrollTo(0, y), anchors[1])
    await waitForCamera(page)
    await page.mouse.move(640, 400)
    await wheelAndSettle(page, (anchors[2] - anchors[1]) * 0.3)
    expect((await currentStop(page)) === 2, `s-a așezat pe oprirea ${await currentStop(page)}`)
  })

  await check('un scroll mic revine la oprirea curentă', async () => {
    await wheelAndSettle(page, (anchors[3] - anchors[2]) * 0.06)
    expect((await currentStop(page)) === 2, `s-a așezat pe oprirea ${await currentStop(page)}`)
  })

  await check('linkul „Hartă” zboară la hartă și scrie ancora în adresă', async () => {
    await page.evaluate(() => window.scrollTo(0, 0))
    await waitForCamera(page)
    await page.click('.topbar__nav a[href="#harta"]')
    await page.waitForFunction(() => window.__tour.live.flightTo === null, null, { timeout: 15000 })
    await waitForCamera(page)
    expect((await currentStop(page)) === last, 'nu a ajuns la hartă')
    expect((await page.evaluate(() => location.hash)) === '#harta', 'ancora din adresă lipsește')
  })

  await check('din legenda hărții se ajunge în sală', async () => {
    await page.click('.legend__item[href="#sala-unirii"]')
    await page.waitForFunction(() => window.__tour.live.flightTo === null, null, { timeout: 15000 })
    await waitForCamera(page)
    expect((await currentStop(page)) === 2, 'nu a ajuns în Sala Unirii')
  })

  await check('macheta se rotește cu drag pe exterior', async () => {
    await page.evaluate(() => window.scrollTo(0, 0))
    await waitForCamera(page)
    const before = await page.evaluate(() => window.__tour.live.dragging)
    await page.mouse.move(900, 450)
    await page.mouse.down()
    await page.mouse.move(700, 450, { steps: 6 })
    const during = await page.evaluate(() => window.__tour.live.dragging)
    await page.mouse.up()
    expect(!before && during, 'drag-ul nu a fost preluat de scenă')
    const hidden = await page.evaluate(() => document.querySelector('.hint')?.hasAttribute('data-done'))
    expect(hidden, 'indiciul de rotire a rămas pe ecran')
  })

  await check('rotița derulează pagina și peste machetă', async () => {
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.mouse.move(900, 450)
    await page.mouse.wheel(0, 300)
    await page.waitForFunction(() => window.scrollY > 0, null, { timeout: 3000 })
  })

  await check('fără erori în consolă', async () => {
    expect(errors.length === 0, errors.join(' | '))
  })

  await context.close()

  const reduced = await openTour(browser, site.url, { width: 1280, height: 800, reducedMotion: true })
  await check('cu mișcare redusă, saltul la hartă e instantaneu', async () => {
    await reduced.page.click('.topbar__nav a[href="#harta"]')
    await reduced.page.waitForFunction(
      () => window.__tour.live.flightTo === null && Math.abs(window.__tour.live.t - 5) < 0.01,
      null,
      { timeout: 1500 },
    )
  })
  await reduced.context.close()
} finally {
  await browser.close()
  await site.close()
}

let failed = 0
for (const result of results) {
  console.log(`${result.ok ? '  ok  ' : ' PICAT'}  ${result.name}${result.ok ? '' : ` — ${result.detail}`}`)
  if (!result.ok) failed += 1
}
console.log(`\n${results.length - failed} din ${results.length} verificări au trecut.`)
process.exit(failed === 0 ? 0 : 1)
