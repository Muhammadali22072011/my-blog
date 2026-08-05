/*
 * Генерация растровых ассетов из исходников в public/.
 *
 * Зачем: index.html и manifest.json ссылались на og-image.png,
 * apple-touch-icon.png, favicon-*.png и восемь icon-*.png, которых
 * в репозитории не было ни одного. Из-за этого не работали превью
 * в мессенджерах, а установка PWA падала на отсутствующих иконках.
 *
 *   node scripts/build-assets.mjs
 *
 * Требуется Chromium; путь берётся из CHROME_BIN или PLAYWRIGHT_BROWSERS_PATH.
 */

import { execFileSync } from 'node:child_process'
import { mkdtempSync, existsSync, readdirSync, copyFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = join(root, 'public')

function findChromium() {
  if (process.env.CHROME_BIN && existsSync(process.env.CHROME_BIN)) {
    return process.env.CHROME_BIN
  }

  const base = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers'
  if (existsSync(base)) {
    for (const entry of readdirSync(base)) {
      if (!entry.startsWith('chromium-')) continue
      const candidate = join(base, entry, 'chrome-linux', 'chrome')
      if (existsSync(candidate)) return candidate
    }
  }

  for (const candidate of ['/usr/bin/chromium', '/usr/bin/google-chrome']) {
    if (existsSync(candidate)) return candidate
  }

  throw new Error('Chromium не найден. Задайте CHROME_BIN.')
}

const chrome = findChromium()

function shot({ url, out, width, height }) {
  const profile = mkdtempSync(join(tmpdir(), 'shot-'))
  try {
    execFileSync(
      chrome,
      [
        '--headless',
        '--no-sandbox',
        '--disable-gpu',
        '--hide-scrollbars',
        '--default-background-color=00000000',
        `--user-data-dir=${profile}`,
        `--window-size=${width},${height}`,
        `--screenshot=${out}`,
        '--virtual-time-budget=6000',
        url,
      ],
      { stdio: 'pipe' }
    )
    console.log(`✓ ${out.replace(root + '/', '')}  ${width}×${height}`)
  } finally {
    rmSync(profile, { recursive: true, force: true })
  }
}

// Социальная карточка
shot({
  url: `file://${join(publicDir, 'og-image.html')}`,
  out: join(publicDir, 'og-image.png'),
  width: 1200,
  height: 630,
})

// Иконки приложения — из того же SVG-знака
const ICON_SIZES = [16, 32, 72, 96, 128, 144, 152, 180, 192, 384, 512]
const logoUrl = `file://${join(publicDir, 'logo.svg')}`

for (const size of ICON_SIZES) {
  shot({
    url: logoUrl,
    out: join(publicDir, `icon-${size}x${size}.png`),
    width: size,
    height: size,
  })
}

// Имена, на которые ссылаются index.html и manifest.json
const aliases = [
  ['icon-180x180.png', 'apple-touch-icon.png'],
  ['icon-32x32.png', 'favicon-32x32.png'],
  ['icon-16x16.png', 'favicon-16x16.png'],
]

for (const [from, to] of aliases) {
  copyFileSync(join(publicDir, from), join(publicDir, to))
  console.log(`✓ ${to} ← ${from}`)
}

console.log('\nГотово.')
