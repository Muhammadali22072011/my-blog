/**
 * Единые правила разбора поста.
 *
 * Раньше эти функции были скопированы в Blogs.jsx, BlogPost.jsx, Feed.jsx
 * и api/og.js — причём с РАЗНЫМИ реализациями getFullImageUrl, из-за чего
 * одна и та же картинка на списке и на странице поста собиралась в разные
 * URL и часть изображений не открывалась. Теперь источник один.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''

/** Публичный корень Storage без завершающего слэша */
const storageRoot = () => `${SUPABASE_URL.replace(/\/+$/, '')}/storage/v1/object/public`

/**
 * Собирает абсолютный URL картинки из любого встречающегося в базе формата:
 *   https://…                       → как есть
 *   storage/v1/object/public/…      → к корню домена
 *   images/blog-images/file.png     → путь от bucket
 *   file.png                        → голое имя файла в images/blog-images
 */
export function getFullImageUrl(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string') return null

  const src = imageUrl.trim()
  if (!src) return null
  if (/^(https?:)?\/\//i.test(src) || src.startsWith('data:')) return src
  if (!SUPABASE_URL) return src

  const clean = src.replace(/^\/+/, '')

  if (clean.startsWith('storage/v1/object/public/')) {
    return `${SUPABASE_URL.replace(/\/+$/, '')}/${clean}`
  }

  // Путь уже содержит имя bucket'а
  if (/^[a-z0-9][a-z0-9._-]*\//i.test(clean)) {
    return `${storageRoot()}/${clean}`
  }

  // Голое имя файла — считаем, что это картинка поста
  return `${storageRoot()}/images/blog-images/${clean}`
}

/** Заголовок берётся из первого `# ` в теле, иначе — из excerpt */
export function getPostTitle(post, maxLength = 120) {
  if (!post) return 'Без названия'

  if (post.title && post.title.trim()) return post.title.trim()

  if (post.content) {
    for (const line of post.content.split('\n')) {
      const trimmed = line.trim()
      if (trimmed.startsWith('# ')) {
        const title = trimmed.slice(2).trim()
        if (title) {
          return title.length > maxLength ? `${title.slice(0, maxLength)}…` : title
        }
      }
    }
  }

  return post.excerpt || 'Без названия'
}

/** Убирает из тела первый заголовок — он уже выведен как <h1> страницы */
export function stripLeadingTitle(content) {
  if (!content) return ''
  const lines = content.split('\n')
  const idx = lines.findIndex((l) => l.trim().startsWith('# '))
  if (idx === -1) return content
  return [...lines.slice(0, idx), ...lines.slice(idx + 1)].join('\n')
}

/** Текст без разметки — для превью и мета-описаний */
export function toPlainText(content) {
  if (!content) return ''
  return content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/^#+ .*/gm, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/(\*\*|\+\+)(.*?)\1/g, '$2')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/^\s*>\s?/gm, ' ')
    .replace(/^\s*[-*+]\s+/gm, ' ')
    .replace(/^\s*\d+\.\s+/gm, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function getExcerpt(content, maxLength = 160, fallback = 'Читать материал') {
  const plain = toPlainText(content)
  if (plain.length >= 10) {
    return plain.length <= maxLength ? plain : `${plain.slice(0, maxLength).trim()}…`
  }
  const title = getPostTitle({ content }, maxLength)
  return title && title !== 'Без названия' ? title : fallback
}

/** Время чтения в минутах, минимум 1 */
export function getReadingTime(content, wordsPerMinute = 180) {
  if (!content) return 1
  const words = toPlainText(content).split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / wordsPerMinute))
}

const MONTHS_RU = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
]

const MONTHS_RU_NOM = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
]

export function formatDateRu(dateString) {
  if (!dateString) return '—'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return '—'
  return `${date.getDate()} ${MONTHS_RU[date.getMonth()]} ${date.getFullYear()}`
}

export function monthNameRu(monthIndex) {
  return MONTHS_RU_NOM[monthIndex] ?? ''
}

/**
 * Обложка поста: featured_image → og_image → первая картинка в теле.
 */
export function getPostCover(post) {
  if (!post) return null

  const explicit = getFullImageUrl(post.featured_image) || getFullImageUrl(post.og_image)
  if (explicit) return explicit

  const content = post.content || ''

  const html = content.match(/<img[^>]+src=["']([^"']+)["']/i)
  if (html) return getFullImageUrl(html[1])

  const md = content.match(/!\[[^\]]*\]\(([^)\s]+)/)
  if (md) return getFullImageUrl(md[1])

  return null
}

/** Пост пригоден к показу в списке */
export function isDisplayablePost(post) {
  if (!post || post.status !== 'published') return false
  if (!post.content || !post.created_at) return false
  if (Number.isNaN(new Date(post.created_at).getTime())) return false
  return getPostTitle(post) !== 'Без названия'
}
