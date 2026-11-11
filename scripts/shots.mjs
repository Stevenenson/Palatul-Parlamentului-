// Capturi de ecran pentru review: fiecare oprire a turului, pe desktop și pe telefon,
// plus câteva cadre din mijlocul tranzițiilor.
//   npm run shots -- pas-1     → review/shots/pas-1/*.png
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { launchBrowser, openTour, startSite, waitForCamera } from './lib/site.mjs'

const label = process.argv[2] ?? 'curent'
const outDir = path.join('review', 'shots', label)

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobil', width: 390, height: 844, scale: 2, mobile: true },
]

/** Poziții între două opriri, ca să se vadă și drumul camerei. */
const TRANSITS = [0.5, 1.5, 2.5, 4.5]

await mkdir(outDir, { recursive: true })
const site = await startSite()
const browser = await launchBrowser()
const problems = []

try {
  for (const viewport of VIEWPORTS) {
    const { context, page, errors } = await openTour(browser, site.url, viewport)
    const info = await page.evaluate(() => {
      const gl = document.querySelector('canvas')?.getContext('webgl2')
      const ext = gl?.getExtension('WEBGL_debug_renderer_info')
      return {
        anchors: window.__tour.anchors(),
        ids: [...document.querySelectorAll('main > section')].map((s) => s.id),
        renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'necunoscut',
      }
    })
    console.log(`${viewport.name}: ${info.ids.length} opriri, GPU: ${info.renderer}`)

    await page.evaluate(() => window.__tour.setSnap(false))
    for (let i = 0; i < info.anchors.length; i++) {
      await page.evaluate((y) => window.scrollTo(0, y), info.anchors[i])
      await waitForCamera(page)
      const file = `${viewport.name}-${i}-${info.ids[i]}.png`
      await page.screenshot({ path: path.join(outDir, file) })
      console.log(`  ${file}`)
    }

    if (!viewport.mobile) {
      for (const t of TRANSITS) {
        const i = Math.floor(t)
        if (i + 1 >= info.anchors.length) continue
        const y = info.anchors[i] + (info.anchors[i + 1] - info.anchors[i]) * (t - i)
        await page.evaluate((top) => window.scrollTo(0, top), y)
        await waitForCamera(page)
        const file = `${viewport.name}-tranzit-${String(t).replace('.', '_')}.png`
        await page.screenshot({ path: path.join(outDir, file) })
        console.log(`  ${file}`)
      }
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
      await waitForCamera(page)
      await page.screenshot({ path: path.join(outDir, `${viewport.name}-subsol.png`) })
    }

    for (const error of errors) problems.push(`${viewport.name}: ${error}`)
    await context.close()
  }
} finally {
  await browser.close()
  await site.close()
}

if (problems.length > 0) {
  console.error(`\nErori în consolă (${problems.length}):`)
  for (const problem of problems) console.error(`  ${problem}`)
  process.exit(1)
}
console.log(`\nCapturi salvate în ${outDir}, fără erori în consolă.`)
