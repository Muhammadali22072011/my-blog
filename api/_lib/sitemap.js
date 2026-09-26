// Сборка sitemap.xml — общая для api/sitemap.js (на лету) и
// scripts/build-sitemap.mjs (локальная проверка).
//
// Видео идут с расширением Google video sitemap: обложка, название,
// описание, прямой адрес mp4, длительность, просмотры.

export const STATIC_ROUTES = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/blogs', priority: '0.9', changefreq: 'daily' },
  { path: '/videos', priority: '0.9', changefreq: 'daily' },
  { path: '/feed', priority: '0.8', changefreq: 'daily' },
  { path: '/news', priority: '0.7', changefreq: 'weekly' },
  { path: '/projects', priority: '0.6', changefreq: 'monthly' },
  { path: '/about', priority: '0.6', changefreq: 'monthly' },
]

export const POST_QUERY = 'posts?status=eq.published&select=id,updated_at,created_at&order=created_at.desc'

export const videoQuery = (nowIso) =>
  `videos?status=eq.published&published_at=lte.${encodeURIComponent(nowIso)}` +
  '&select=slug,title,description,poster_url,video_url,duration_sec,views,published_at,updated_at' +
  '&order=published_at.desc'

const escapeXml = (value) =>
  String(value ?? '').replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c])

const day = (value, fallback) => (value || fallback).slice(0, 10)

export function buildSitemap({ siteUrl, posts = [], videos = [], today = new Date().toISOString() }) {
  const base = siteUrl.replace(/\/+$/, '')
  const url = (loc, lastmod, changefreq, priority, extra = '') =>
    [
      '  <url>',
      `    <loc>${escapeXml(loc)}</loc>`,
      `    <lastmod>${lastmod}</lastmod>`,
      `    <changefreq>${changefreq}</changefreq>`,
      `    <priority>${priority}</priority>`,
      extra,
      '  </url>',
    ]
      .filter(Boolean)
      .join('\n')

  const entries = [
    ...STATIC_ROUTES.map((r) => url(`${base}${r.path}`, day(today), r.changefreq, r.priority)),
    ...posts.map((p) => url(`${base}/post/${p.id}`, day(p.updated_at || p.created_at, today), 'monthly', '0.8')),
    ...videos.map((v) => {
      const video =
        v.video_url && v.poster_url
          ? [
              '    <video:video>',
              `      <video:thumbnail_loc>${escapeXml(v.poster_url)}</video:thumbnail_loc>`,
              `      <video:title>${escapeXml(v.title)}</video:title>`,
              `      <video:description>${escapeXml(String(v.description || v.title).slice(0, 2000))}</video:description>`,
              `      <video:content_loc>${escapeXml(v.video_url)}</video:content_loc>`,
              v.duration_sec ? `      <video:duration>${Math.max(1, Math.round(v.duration_sec))}</video:duration>` : '',
              `      <video:view_count>${Number(v.views) || 0}</video:view_count>`,
              v.published_at ? `      <video:publication_date>${escapeXml(v.published_at)}</video:publication_date>` : '',
              '    </video:video>',
            ]
              .filter(Boolean)
              .join('\n')
          : ''
      return url(`${base}/videos/${v.slug}`, day(v.updated_at || v.published_at, today), 'weekly', '0.8', video)
    }),
  ]

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${entries.join('\n')}
</urlset>
`
}
