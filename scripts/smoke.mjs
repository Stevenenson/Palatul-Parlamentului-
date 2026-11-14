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

  await check('macheta se rotește cu drag și cu săgețile pe exterior', async () => {
    await page.evaluate(() => window.scrollTo(0, 0))
    await waitForCamera(page)
    const cameraX = () => page.evaluate(() => window.__tour.cameraX())
    const start = await cameraX()
    await page.mouse.move(900, 450)
    await page.mouse.down()
    await page.mouse.move(700, 450, { steps: 6 })
    const during = await page.evaluate(() => window.__tour.live.dragging)
    await page.mouse.up()
    expect(during, 'drag-ul nu a fost preluat de scenă')
    const afterDrag = await cameraX()
    expect(Math.abs(afterDrag - start) > 20, `camera s-a mutat doar ${Math.abs(afterDrag - start).toFixed(1)} m`)
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(120)
    expect(Math.abs((await cameraX()) - afterDrag) > 10, 'săgeata dreapta nu a rotit macheta')
    const hidden = await page.evaluate(() => document.querySelector('.hint')?.hasAttribute('data-done'))
    expect(hidden, 'indiciul de rotire a rămas pe ecran')
  })

  await check('o singură crestătură de rotiță trece la sala următoare', async () => {
    await page.evaluate(() => window.scrollTo(0, 0))
    await waitForCamera(page)
    await wheelAndSettle(page, 100)
    expect((await currentStop(page)) === 1, `s-a așezat pe oprirea ${await currentStop(page)}`)
  })

  await check('la scroll în sus, pagina se așază pe oprirea de dinainte', async () => {
    await wheelAndSettle(page, -100)
    expect((await currentStop(page)) === 0, `s-a așezat pe oprirea ${await currentStop(page)}`)
  })

  await check('săgețile sus/jos trec din oprire în oprire', async () => {
    await page.evaluate(() => window.scrollTo(0, 0))
    await waitForCamera(page)
    await page.keyboard.press('ArrowDown')
    await page.waitForFunction((y) => Math.abs(window.scrollY - y) < 2, anchors[1], { timeout: 8000 })
    await page.keyboard.press('ArrowDown')
    await page.waitForFunction((y) => Math.abs(window.scrollY - y) < 2, anchors[2], { timeout: 8000 })
    await page.keyboard.press('ArrowUp')
    await page.waitForFunction((y) => Math.abs(window.scrollY - y) < 2, anchors[1], { timeout: 8000 })
  })

  await check('Tab duce turul pe secțiunea elementului focusat', async () => {
    await page.evaluate(() => window.scrollTo(0, 0))
    await waitForCamera(page)
    await page.focus('.hero .btn:last-of-type')
    await page.keyboard.press('Tab')
    const focused = await page.evaluate(() => document.activeElement?.closest('main > section')?.id)
    expect(focused === 'galeria-de-onoare', `focusul e în ${focused}`)
    await page.waitForFunction((y) => Math.abs(window.scrollY - y) < 2, anchors[1], { timeout: 8000 })
    const visible = await page.evaluate(() => {
      const rect = document.activeElement.getBoundingClientRect()
      return rect.top >= 0 && rect.bottom <= window.innerHeight
    })
    expect(visible, 'linkul focusat nu e în fereastră')
  })

  await check('după Enter pe „Hartă”, Tab continuă din secțiunea hărții', async () => {
    await page.evaluate(() => window.scrollTo(0, 0))
    await waitForCamera(page)
    await page.focus('.topbar__nav a[href="#harta"]')
    await page.keyboard.press('Enter')
    await page.waitForFunction(() => window.__tour.live.flightTo === null, null, { timeout: 15000 })
    await waitForCamera(page)
    await page.keyboard.press('Tab')
    const focused = await page.evaluate(() => document.activeElement?.closest('main > section')?.id)
    expect(focused === 'harta', `focusul a ajuns în ${focused}`)
    expect((await currentStop(page)) === last, 'pagina a plecat de pe hartă')
  })

  await check('butonul Înapoi revine la oprirea de dinainte', async () => {
    await page.evaluate(() => window.scrollTo(0, 0))
    await waitForCamera(page)
    await page.click('.topbar__nav a[href="#harta"]')
    await page.waitForFunction(() => window.__tour.live.flightTo === null, null, { timeout: 15000 })
    await page.goBack()
    await page.waitForFunction(() => window.__tour.live.flightTo === null && window.scrollY < 2, null, {
      timeout: 15000,
    })
  })

  const count = (id) => page.evaluate((room) => document.querySelector(`#${room} .recording__count`).textContent.trim(), id)

  await check('filmările se schimbă din săgeți, din puncte, din tastatură și cu swipe', async () => {
    await page.evaluate((y) => window.scrollTo(0, y), anchors[1])
    await waitForCamera(page)
    const room = 'galeria-de-onoare'
    expect((await count(room)) === 'Filmarea 1 din 3', `pornește cu „${await count(room)}”`)
    await page.click(`#${room} .round[aria-label="Filmarea următoare"]`)
    expect((await count(room)) === 'Filmarea 2 din 3', 'săgeata nu a schimbat filmarea')
    await page.click(`#${room} .dots li:nth-child(3) .dot`)
    expect((await count(room)) === 'Filmarea 3 din 3', 'punctul nu a schimbat filmarea')
    await page.evaluate(() => document.activeElement.blur())
    await page.keyboard.press('ArrowRight')
    expect((await count(room)) === 'Filmarea 1 din 3', 'săgeata dreapta nu a trecut de la ultima la prima')
    await page.mouse.move(1050, 420)
    await page.mouse.down()
    await page.mouse.move(700, 425, { steps: 8 })
    const pulled = await page.evaluate(() => window.__tour.live.swipe)
    await page.mouse.up()
    expect(pulled > 0.5, `în timpul gestului, holograma a fost trasă doar ${pulled}`)
    expect((await count(room)) === 'Filmarea 2 din 3', `după swipe: „${await count(room)}”`)
    const y = await page.evaluate(() => window.scrollY)
    expect(Math.abs(y - anchors[1]) < 2, 'swipe-ul a mișcat pagina')
  })

  await check('filmarea video rulează doar cât sala e activă', async () => {
    await page.evaluate((y) => window.scrollTo(0, y), anchors[2])
    await waitForCamera(page)
    await page.waitForFunction(() => window.__tour.playing['sala-unirii']()[0] === true, null, { timeout: 8000 })
    const sound = await page.textContent('#sala-unirii .sound')
    expect(sound.trim() === 'Pornește sunetul', `butonul de sunet spune „${sound}”`)
    await page.click('#sala-unirii .round[aria-label="Filmarea următoare"]')
    await page.waitForFunction(() => window.__tour.playing['sala-unirii']()[0] === false, null, { timeout: 5000 })
    await page.click('#sala-unirii .round[aria-label="Filmarea anterioară"]')
    await page.waitForFunction(() => window.__tour.playing['sala-unirii']()[0] === true, null, { timeout: 5000 })
    await page.evaluate((y) => window.scrollTo(0, y), anchors[3])
    await waitForCamera(page)
    await page.waitForFunction(() => window.__tour.playing['sala-unirii']()[0] === false, null, { timeout: 5000 })
  })

  await check('fiecare pin de pe hartă duce în sala lui', async () => {
    const ids = await page.evaluate(() => [...document.querySelectorAll('.pin')].map((pin) => pin.getAttribute('href')))
    expect(ids.length === 4, `sunt ${ids.length} pinuri`)
    for (let i = 0; i < ids.length; i++) {
      await page.evaluate((y) => window.scrollTo(0, y), anchors[last])
      await waitForCamera(page)
      const label = page.locator(`.pin[href="${ids[i]}"] .pin__label`)
      await label.waitFor({ state: 'visible', timeout: 5000 })
      const box = await label.boundingBox()
      expect(box && box.x > 0 && box.x + box.width < 1280 && box.y > 64 && box.y + box.height < 800, `pinul ${ids[i]} iese din ecran`)
      await label.click()
      // De pe hartă, sala vecină se atinge prin derulare, celelalte prin zbor: așteptăm să ajungă pagina.
      await page.waitForFunction(
        (y) => window.__tour.live.flightTo === null && Math.abs(window.scrollY - y) < 2,
        anchors[i + 1],
        { timeout: 15000 },
      )
      await waitForCamera(page)
      expect((await currentStop(page)) === i + 1, `pinul ${ids[i]} a dus la oprirea ${await currentStop(page)}`)
      expect((await page.evaluate(() => location.hash)) === ids[i], 'adresa nu are ancora sălii')
    }
  })

  await check('pinurile se ascund în afara hărții', async () => {
    await page.evaluate((y) => window.scrollTo(0, y), anchors[2])
    await waitForCamera(page)
    const visible = await page.evaluate(() => [...document.querySelectorAll('.pin')].some((pin) => getComputedStyle(pin).visibility === 'visible'))
    expect(!visible, 'un pin a rămas vizibil într-o sală')
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

  const direct = await openTour(browser, site.url, { width: 1280, height: 800, hash: '#sala-unirii' })
  await check('un link direct către o sală pornește în sala aceea', async () => {
    await waitForCamera(direct.page)
    const state = await direct.page.evaluate(() => ({
      t: window.__tour.live.t,
      y: window.scrollY,
      anchor: window.__tour.anchors()[2],
      hash: location.hash,
    }))
    expect(Math.abs(state.t - 2) < 0.01, `turul e la t=${state.t}`)
    expect(Math.abs(state.y - state.anchor) < 2, `scroll la ${state.y}, ancora la ${state.anchor}`)
    expect(state.hash === '#sala-unirii', `ancora din adresă e „${state.hash}”`)
  })
  await direct.context.close()

  const low = await openTour(browser, site.url, { width: 1100, height: 520 })
  await check('o secțiune mai înaltă decât fereastra se poate citi până jos', async () => {
    const info = await low.page.evaluate(() => {
      const section = document.getElementById('galeria-de-onoare')
      return { top: window.__tour.anchors()[1], extra: section.offsetHeight - window.innerHeight }
    })
    expect(info.extra > 20, `secțiunea încape în fereastră (diferență ${info.extra} px); testul nu verifică nimic`)
    const target = info.top + info.extra - 4
    await low.page.evaluate((y) => window.scrollTo(0, y), target)
    await low.page.waitForTimeout(700)
    const state = await low.page.evaluate(() => ({ y: window.scrollY, t: window.__tour.live.tTarget }))
    expect(Math.abs(state.y - target) < 3, `pagina a fost mutată la ${state.y}`)
    expect(Math.abs(state.t - 1) < 0.01, `turul a plecat din sală (t=${state.t})`)
  })
  await low.context.close()

  const phone = await openTour(browser, site.url, { width: 390, height: 844, scale: 2, mobile: true })
  await check('pe telefon, un swipe în sus trece la sala următoare', async () => {
    const tops = await phone.page.evaluate(() => window.__tour.anchors())
    const session = await phone.context.newCDPSession(phone.page)
    await session.send('Input.synthesizeScrollGesture', { x: 195, y: 600, yDistance: -260, speed: 900 })
    await phone.page.waitForFunction((y) => Math.abs(window.scrollY - y) < 2, tops[1], { timeout: 10000 })
  })
  await check('pe telefon, un swipe orizontal pe hologramă schimbă filmarea', async () => {
    const session = await phone.context.newCDPSession(phone.page)
    const touch = (type, x, y) =>
      session.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] })
    await touch('touchStart', 300, 230)
    for (let x = 280; x >= 80; x -= 25) await touch('touchMove', x, 232)
    await touch('touchEnd', 80, 232)
    await phone.page.waitForFunction(
      () => document.querySelector('#galeria-de-onoare .recording__count').textContent.trim() === 'Filmarea 2 din 3',
      null,
      { timeout: 5000 },
    )
  })

  await check('pe telefon, nimic nu iese în lateral', async () => {
    const overflow = await phone.page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow <= 0, `pagina e cu ${overflow} px mai lată decât ecranul`)
  })
  await phone.context.close()

  const reduced = await openTour(browser, site.url, { width: 1280, height: 800, reducedMotion: true })
  await check('cu mișcare redusă, saltul la hartă e instantaneu', async () => {
    await reduced.page.click('.topbar__nav a[href="#harta"]')
    await reduced.page.waitForFunction(
      () => window.__tour.live.flightTo === null && Math.abs(window.__tour.live.t - 5) < 0.01,
      null,
      { timeout: 1500 },
    )
  })
  await check('cu mișcare redusă, pagina nu se așază singură', async () => {
    const tops = await reduced.page.evaluate(() => window.__tour.anchors())
    const y = tops[1] + (tops[2] - tops[1]) * 0.4
    await reduced.page.evaluate((top) => window.scrollTo(0, top), y)
    await reduced.page.waitForTimeout(600)
    const now = await reduced.page.evaluate(() => window.scrollY)
    expect(Math.abs(now - y) < 2, `pagina a fost mutată de la ${y} la ${now}`)
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
