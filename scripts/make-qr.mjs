// Scrie codul QR al adresei publice, de pus în prezentare.
//   node scripts/make-qr.mjs [adresă]   → public/qr.svg
import { writeFile } from 'node:fs/promises'
import QRCode from 'qrcode'

const url = process.argv[2] ?? 'https://stevenenson.github.io/Palatul-Parlamentului-/'

// Corecție de erori „Q”: codul se citește și proiectat pe un ecran, de la distanță.
const svg = await QRCode.toString(url, {
  type: 'svg',
  errorCorrectionLevel: 'Q',
  margin: 4,
  color: { dark: '#17191d', light: '#ffffff' },
})

await writeFile(new URL('../public/qr.svg', import.meta.url), svg)
console.log(`public/qr.svg → ${url}`)
