/*
 * Генерация sitemap.xml из базы.
 *
 * Раньше public/sitemap.xml был статическим файлом с датой 2024-12-19
 * и не содержал ни одного адреса поста — поисковики видели только
 * четыре раздела. Здесь карта собирается из реальных опубликованных
 * материалов.
 *
 *   SITE_URL=https://example.com \
 *   VITE_SUPABASE_URL=… VITE_SUPABASE_ANON_KEY=… \
 *   node scripts/build-sitemap.mjs
 *
 * Без переменных окружения скрипт выпишет только статические разделы
 * и завершится успешно — сборка из-за него падать не должна.
 */

import { writeFileSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const SITE_URL = (process.env.SITE_URL || 'https://muhammadali-blog.vercel.app').replace(/\/+$/, '')
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

const STATIC_ROUTES = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/blogs', priority: '0.9', changefreq: 'daily' },
  { path: '/feed', priority: '0.8', changefreq: 'daily' },
  { path: '/news', priority: '0.7', changefreq: 'weekly' },
  { path: '/projects', priority: '0.6', changefreq: 'monthly' },
  { path: '/about', priority: '0.6', changefreq: 'monthly' },
]

const today = new Date().toISOString().slice(0, 10)

async function fetchPosts() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn('⚠ Переменные Supabase не заданы — посты в карту не попадут.')
    return []
  }

  const endpoint =
    `${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/posts` +
    `?status=eq.published&select=id,updated_at,created_at&order=created_at.desc`

  const response = await fetch(endpoint, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  })

  if (!response.ok) {
    console.warn(`⚠ Supabase ответил ${response.status} — посты пропущены.`)
    return []
  }

  return response.json()
}

const escapeXml = (value) =>
  String(value).replace(/[<>&'"]/g, (c) => `&${{ '<': 'lt', '>': 'gt', '&': 'amp', "'": 'apos', '"': 'quot' }[c]};`)

const urlEntry = ({ loc, lastmod, changefreq, priority }) =>
  [
    '  <url>',
    `    <loc>${escapeXml(loc)}</loc>`,
    `    <lastmod>${lastmod}</lastmod>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    '  </url>',
  ].join('\n')

const posts = await fetchPosts()

const entries = [
  ...STATIC_ROUTES.map((route) =>
    urlEntry({
      loc: `${SITE_URL}${route.path}`,
      lastmod: today,
      changefreq: route.changefreq,
      priority: route.priority,
    })
  ),
  ...posts.map((post) =>
    urlEntry({
      loc: `${SITE_URL}/post/${post.id}`,
      lastmod: (post.updated_at || post.created_at || today).slice(0, 10),
      changefreq: 'monthly',
      priority: '0.8',
    })
  ),
]

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>
`

writeFileSync(join(root, 'public', 'sitemap.xml'), xml)
console.log(`✓ public/sitemap.xml — разделов: ${STATIC_ROUTES.length}, постов: ${posts.length}`)
