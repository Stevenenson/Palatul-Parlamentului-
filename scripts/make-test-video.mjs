// Generează o filmare de test de câteva secunde, fără ffmpeg: desenează o animație
// pe un canvas în Chrome și o înregistrează cu MediaRecorder.
//   node scripts/make-test-video.mjs   → public/media/videos/filmare-test.mp4 (sau .webm)
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { launchBrowser } from './lib/site.mjs'

const outDir = path.join('public', 'media', 'videos')
await mkdir(outDir, { recursive: true })

const browser = await launchBrowser()
const page = await browser.newPage()
await page.setContent('<canvas id="c" width="960" height="540"></canvas>')

const result = await page.evaluate(async () => {
  const canvas = document.getElementById('c')
  const ctx = canvas.getContext('2d')
  const types = ['video/mp4;codecs=avc1.42E01E', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm']
  const type = types.find((t) => MediaRecorder.isTypeSupported(t))
  const seconds = 4
  const start = performance.now()

  const draw = (now) => {
    const t = (now - start) / 1000
    const g = ctx.createLinearGradient(0, 0, 0, 540)
    g.addColorStop(0, '#dfe6ea')
    g.addColorStop(1, '#aebcc4')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 960, 540)
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'
    ctx.lineWidth = 2
    for (let x = 0; x <= 960; x += 120) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, 540)
      ctx.stroke()
    }
    // O siluetă care se leagănă ușor, ca să se vadă că imaginea se mișcă.
    const sway = Math.sin(t * 2.2) * 26
    ctx.fillStyle = '#34464f'
    ctx.beginPath()
    ctx.arc(480 + sway, 210, 92, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(480 + sway * 0.5, 560, 250, 230, 0, Math.PI, 0)
    ctx.fill()
    // Bara de progres și cronometrul.
    ctx.fillStyle = 'rgba(255,255,255,0.55)'
    ctx.fillRect(60, 486, 840, 6)
    ctx.fillStyle = '#17191d'
    ctx.fillRect(60, 486, 840 * Math.min(1, t / seconds), 6)
    ctx.font = '600 30px system-ui, sans-serif'
    ctx.fillText('Filmare de test', 60, 70)
    ctx.font = '500 24px ui-monospace, monospace'
    ctx.fillText(`0:0${Math.min(seconds, Math.floor(t))}`, 840, 70)
    if (t < seconds + 0.2) requestAnimationFrame(draw)
  }
  requestAnimationFrame(draw)

  const recorder = new MediaRecorder(canvas.captureStream(30), { mimeType: type, videoBitsPerSecond: 900000 })
  const chunks = []
  recorder.ondataavailable = (event) => chunks.push(event.data)
  const done = new Promise((resolve) => (recorder.onstop = resolve))
  recorder.start()
  await new Promise((resolve) => setTimeout(resolve, seconds * 1000))
  recorder.stop()
  await done
  const buffer = await new Blob(chunks, { type }).arrayBuffer()
  let binary = ''
  for (const byte of new Uint8Array(buffer)) binary += String.fromCharCode(byte)
  return { type, base64: btoa(binary) }
})

await browser.close()

const extension = result.type.startsWith('video/mp4') ? 'mp4' : 'webm'
const file = path.join(outDir, `filmare-test.${extension}`)
const bytes = Buffer.from(result.base64, 'base64')
await writeFile(file, bytes)
console.log(`${file} (${result.type}, ${(bytes.length / 1024).toFixed(0)} kB)`)
