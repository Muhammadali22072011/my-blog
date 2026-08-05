// Vercel Edge Function: серверные OG-теги для ботов мессенджеров.
//
// vercel.json переписывает /post/:id на этот обработчик, если в User-Agent
// видно бота. Обычные читатели сюда не попадают.
//
// Что здесь исправлено:
//  1. Ключ Supabase и адрес проекта были захардкожены в файле публичного
//     репозитория. Теперь берутся из переменных окружения Vercel.
//  2. Заголовок и описание подставлялись в HTML без экранирования. Одна
//     двойная кавычка в заголовке поста разрывала мета-тег, и превью
//     ломалось; кавычка с угловыми скобками — это уже инъекция разметки.
//  3. Домен izzatullaev.uz был вписан в код константой. Сам адрес верный —
//     это и есть рабочий домен сайта, — но жёстко зашитый он ломается на
//     preview-сборках Vercel. Теперь берётся из заголовков запроса.
//  4. Отсутствие переменных окружения отдавало 500 — превью ломалось
//     полностью. Теперь функция отдаёт карточку сайта по умолчанию.

/*
 * Переменные читаются ВНУТРИ обработчика, а не на уровне модуля.
 * В edge-рантайме Vercel обращение к process.env на верхнем уровне
 * происходит на этапе сборки бандла, и значения нередко оказываются
 * пустыми — из-за этого функция уходила в запасную карточку и превью
 * поста показывало описание сайта вместо заголовка материала.
 */
const readConfig = () => ({
  url: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  key: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY,
})

const SITE_NAME = 'Muhammadali Izzatullaev'
const SITE_TAGLINE = 'Журнал о разработке, искусственном интеллекте и ремесле'

export const config = {
  runtime: 'edge',
}

/** Экранирование для подстановки в текст и в значения атрибутов */
const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

/** Домен берётся из запроса, а не из константы в коде */
function originOf(req) {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host')
  const proto = req.headers.get('x-forwarded-proto') || 'https'
  if (host) return `${proto}://${host}`
  return new URL(req.url).origin
}

function getTitle(content) {
  if (!content) return 'Материал без названия'
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (trimmed.startsWith('# ')) {
      const title = trimmed.slice(2).trim()
      if (title) return title
    }
  }
  return 'Материал без названия'
}

function getDescription(content) {
  if (!content) return SITE_TAGLINE
  const plain = content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/^#+ .*/gm, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/(\*\*|\+\+|__)(.*?)\1/g, '$2')
    .replace(/\*([^*\n]+)\*/g, '$1')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/^\s*>\s?/gm, ' ')
    .replace(/^\s*[-*+]\s+/gm, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (plain.length < 10) return SITE_TAGLINE
  return plain.length <= 160 ? plain : `${plain.slice(0, 160).trim()}…`
}

/** Абсолютный URL картинки из любого встречающегося в базе формата */
function getImageUrl(post, supabaseUrl) {
  const candidate = post.featured_image || post.og_image
  if (!candidate || typeof candidate !== 'string') return null

  const src = candidate.trim()
  if (/^https?:\/\//i.test(src)) return src
  if (!supabaseUrl) return null

  const clean = src.replace(/^\/+/, '')
  const root = `${supabaseUrl.replace(/\/+$/, '')}/storage/v1/object/public`

  if (clean.startsWith('storage/v1/object/public/')) {
    return `${supabaseUrl.replace(/\/+$/, '')}/${clean}`
  }
  // Путь уже содержит имя bucket'а
  if (/^[a-z0-9][a-z0-9._-]*\//i.test(clean)) return `${root}/${clean}`
  return `${root}/images/blog-images/${clean}`
}

function renderPage({ title, description, image, url, type }) {
  const t = escapeHtml(title)
  const d = escapeHtml(description)
  const u = escapeHtml(url)
  const img = image ? escapeHtml(image) : null

  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${t} — ${SITE_NAME}</title>

  <meta name="description" content="${d}">
  <meta name="author" content="${escapeHtml(SITE_NAME)}">

  <meta property="og:type" content="${escapeHtml(type)}">
  <meta property="og:url" content="${u}">
  <meta property="og:title" content="${t}">
  <meta property="og:description" content="${d}">
  <meta property="og:site_name" content="${escapeHtml(SITE_NAME)}">
  <meta property="og:locale" content="ru_RU">
${
  img
    ? `  <meta property="og:image" content="${img}">
  <meta property="og:image:secure_url" content="${img}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${t}">`
    : ''
}

  <meta name="twitter:card" content="${img ? 'summary_large_image' : 'summary'}">
  <meta name="twitter:url" content="${u}">
  <meta name="twitter:title" content="${t}">
  <meta name="twitter:description" content="${d}">
${img ? `  <meta name="twitter:image" content="${img}">` : ''}

  <link rel="canonical" href="${u}">
  <meta http-equiv="refresh" content="0;url=${u}">
</head>
<body>
  <h1>${t}</h1>
  <p>${d}</p>
  <p><a href="${u}">Открыть материал</a></p>
</body>
</html>`
}

export default async function handler(req) {
  const { url: supabaseUrl, key: supabaseKey } = readConfig()
  const origin = originOf(req)
  const url = new URL(req.url)
  const postId = url.searchParams.get('postId')

  // Запасная карточка: отдаётся вместо ошибки, чтобы ссылка в мессенджере
  // показывала хотя бы описание сайта, а не пустой прямоугольник
  const fallback = (status = 200) =>
    new Response(
      renderPage({
        title: SITE_NAME,
        description: SITE_TAGLINE,
        image: `${origin}/og-image.png`,
        url: postId && /^\d+$/.test(postId) ? `${origin}/post/${postId}` : origin,
        type: 'website',
      }),
      {
        status,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=300',
        },
      }
    )

  // Только целое число: строка вида `1 or 1=1` не должна попадать в запрос
  if (!postId || !/^\d+$/.test(postId)) return fallback(400)

  // Переменные окружения не заданы — карточка сайта вместо 500
  if (!supabaseUrl || !supabaseKey) return fallback()

  try {
    const response = await fetch(
      `${supabaseUrl.replace(/\/+$/, '')}/rest/v1/posts` +
        `?id=eq.${postId}&status=eq.published&select=content,featured_image,og_image,created_at,updated_at`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    )

    if (!response.ok) return fallback()

    const posts = await response.json()
    const post = Array.isArray(posts) ? posts[0] : null
    if (!post) return fallback(404)

    return new Response(
      renderPage({
        title: getTitle(post.content),
        description: getDescription(post.content),
        image: getImageUrl(post, supabaseUrl) || `${origin}/og-image.png`,
        url: `${origin}/post/${postId}`,
        type: 'article',
      }),
      {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        },
      }
    )
  } catch (error) {
    console.error('Ошибка формирования OG-карточки:', error)
    return fallback()
  }
}
