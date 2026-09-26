// Vercel Edge Function: sitemap.xml на лету.
//
// Раньше карта была статическим файлом public/sitemap.xml: её надо было
// пересобирать руками, и в ней остался старый домен. Новые посты и видео
// в неё не попадали. Теперь /sitemap.xml переписывается сюда (vercel.json)
// и собирается из базы при запросе, с кешем на час.

import { buildSitemap, POST_QUERY, videoQuery } from './_lib/sitemap.js'

export const config = { runtime: 'edge' }

function originOf(req) {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host')
  const proto = req.headers.get('x-forwarded-proto') || 'https'
  return host ? `${proto}://${host}` : new URL(req.url).origin
}

export default async function handler(req) {
  const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '')
  const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
  const siteUrl = process.env.SITE_URL || originOf(req)

  const load = async (query) => {
    if (!supabaseUrl || !key) return []
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/${query}`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
      })
      return res.ok ? await res.json() : []
    } catch {
      return []
    }
  }

  // Упавший запрос даёт пустой список, а не 500: карта из разделов лучше, чем никакой
  const [posts, videos] = await Promise.all([load(POST_QUERY), load(videoQuery(new Date().toISOString()))])

  return new Response(buildSitemap({ siteUrl, posts, videos }), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
