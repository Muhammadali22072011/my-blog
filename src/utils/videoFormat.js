/**
 * Общие правила для видео — чистый модуль без import.meta и window,
 * поэтому его импортируют и страницы, и серверные функции (api/og.js,
 * api/_lib/videos.js, MCP).
 */

const CYRILLIC = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z', и: 'i',
  й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't',
  у: 'u', ф: 'f', х: 'x', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sh', ъ: '', ы: 'i', ь: '',
  э: 'e', ю: 'yu', я: 'ya', ў: 'o', қ: 'q', ғ: 'g', ҳ: 'h',
}

/** Адрес из названия: «Bobo va Eshak — 3-qism» → bobo-va-eshak-3-qism */
export function slugify(text) {
  const latin = String(text || '')
    .toLowerCase()
    // узбекские oʻ gʻ и апострофы просто выпадают: o‘zbek → ozbek
    .replace(/[ʻʼ‘’'`]/g, '')
    .replace(/[а-яёўқғҳ]/g, (ch) => CYRILLIC[ch] ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
  return latin
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '')
}

export const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/

/** Секунды → «0:42» / «12:05» */
export function formatDuration(seconds) {
  const s = Math.max(0, Math.round(Number(seconds) || 0))
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}

/** Секунды → ISO 8601 для VideoObject: PT1M5S */
export function isoDuration(seconds) {
  const s = Math.max(0, Math.round(Number(seconds) || 0))
  const m = Math.floor(s / 60)
  return `PT${m ? `${m}M` : ''}${s % 60}S`
}

/** 1234 → «1,2 тыс.» — коротко для карточек */
export function formatViews(count) {
  const n = Number(count) || 0
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.', ',')} млн`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace('.', ',')} тыс.`
  return String(n)
}

/** Ник из любого формата: @nick, nick, https://instagram.com/nick/, t.me/nick */
export function cleanHandle(value) {
  if (!value || typeof value !== 'string') return null
  const handle = value
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^(www\.)?(instagram\.com|t\.me|telegram\.me|ig\.me\/m)\//i, '')
    .replace(/^@/, '')
    .replace(/[/?#].*$/, '')
  return /^[A-Za-z0-9._]{1,64}$/.test(handle) ? handle : null
}

export const orderLinks = (settings) => {
  const instagram = cleanHandle(settings?.instagram_username)
  const telegram = cleanHandle(settings?.telegram_username)
  return {
    instagram: instagram ? `https://ig.me/m/${instagram}` : null,
    telegram: telegram ? `https://t.me/${telegram}` : null,
  }
}

/** Данные для <script type="application/ld+json"> — VideoObject */
export function buildVideoJsonLd(video, pageUrl) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: video.title,
    description: video.description || video.title,
    thumbnailUrl: video.poster_url ? [video.poster_url] : undefined,
    uploadDate: video.published_at || video.created_at,
    duration: video.duration_sec ? isoDuration(video.duration_sec) : undefined,
    contentUrl: video.video_url || undefined,
    url: pageUrl,
    width: video.width || undefined,
    height: video.height || undefined,
    keywords: video.tags?.length ? video.tags.join(', ') : undefined,
    interactionStatistic: {
      '@type': 'InteractionCounter',
      interactionType: { '@type': 'WatchAction' },
      userInteractionCount: Number(video.views) || 0,
    },
  }
  return JSON.parse(JSON.stringify(data))
}

/** JSON для вставки внутрь <script>: закрывающий тег не должен прорваться */
export const jsonForScript = (value) => JSON.stringify(value).replace(/</g, '\\u003c')

export const VIDEO_CARD_COLUMNS =
  'id,slug,title,category_id,poster_url,video_url,aspect,duration_sec,width,height,views,pinned,published_at'
