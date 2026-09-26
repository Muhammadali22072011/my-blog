/*
 * Проверка sitemap.xml локально.
 *
 * На сайте карта собирается на лету функцией api/sitemap.js (vercel.json
 * переписывает туда /sitemap.xml). Этот скрипт печатает ту же карту в
 * консоль — чтобы посмотреть, что увидят поисковики:
 *
 *   SITE_URL=https://izzatullaev.uz \
 *   VITE_SUPABASE_URL=… VITE_SUPABASE_ANON_KEY=… \
 *   npm run sitemap
 *
 * В public/ файл больше не пишется: статический sitemap.xml перекрыл бы
 * функцию, и новые посты и видео снова перестали бы попадать в карту.
 */

import { buildSitemap, POST_QUERY, videoQuery } from '../api/_lib/sitemap.js'

const SITE_URL = process.env.SITE_URL || 'https://izzatullaev.uz'
const SUPABASE_URL = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').replace(/\/+$/, '')
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

async function load(query) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return []
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${query}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  })
  if (!res.ok) {
    console.warn(`⚠ Supabase ответил ${res.status} на ${query.split('?')[0]}`)
    return []
  }
  return res.json()
}

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠ Переменные Supabase не заданы — в карте будут только разделы.')
}

const [posts, videos] = await Promise.all([load(POST_QUERY), load(videoQuery(new Date().toISOString()))])
process.stdout.write(buildSitemap({ siteUrl: SITE_URL, posts, videos }))
