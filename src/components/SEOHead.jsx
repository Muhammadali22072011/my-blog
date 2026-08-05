import { useEffect } from 'react'

const SITE_NAME = 'Muhammadali Izzatullaev'

/** Убирает разметку из текста, который пойдёт в meta description */
function stripHtml(html) {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function absoluteUrl(value) {
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) return value
  return `${window.location.origin}${value.startsWith('/') ? '' : '/'}${value}`
}

/**
 * Управление мета-тегами страницы.
 *
 * Два исправления против прежней версии:
 *  1. Зависимость эффекта — строка из тегов, а не сам массив. Раньше в
 *     BlogPost передавался литерал `post.tags || [post.category]`, то есть
 *     новый массив на каждый рендер: эффект перезаписывал весь <head>
 *     на каждом рендере страницы.
 *  2. Добавленные теги снимаются при размонтировании. Раньше `article:*`
 *     от прошлого поста оставались в <head> после ухода со страницы.
 *
 * Важно понимать ограничение: это клиентская подстановка. Боты Telegram,
 * Twitter и Facebook читают исходный HTML и её НЕ видят — для них нужен
 * серверный рендер мета-тегов (см. api/og.js).
 */
function SEOHead({
  title,
  description,
  image,
  url,
  type = 'article',
  author = SITE_NAME,
  publishedTime,
  modifiedTime,
  tags,
}) {
  // Примитив вместо массива — стабильная зависимость эффекта
  const tagsKey = Array.isArray(tags) ? tags.filter(Boolean).join(',') : ''

  useEffect(() => {
    const tagList = tagsKey ? tagsKey.split(',') : []
    const createdNodes = []

    document.title = title ? `${title} — ${SITE_NAME}` : SITE_NAME

    const cleanDescription = stripHtml(description)
    const pageUrl = url || window.location.href
    const imageUrl = image ? absoluteUrl(image) : ''

    const setMeta = (name, content, useProperty = false) => {
      if (!content) return
      const attr = useProperty ? 'property' : 'name'
      let meta = document.head.querySelector(`meta[${attr}="${CSS.escape(name)}"]`)
      if (!meta) {
        meta = document.createElement('meta')
        meta.setAttribute(attr, name)
        document.head.appendChild(meta)
        createdNodes.push(meta)
      }
      meta.setAttribute('content', content)
    }

    setMeta('description', cleanDescription)
    setMeta('author', author)
    if (tagList.length) setMeta('keywords', tagList.join(', '))

    setMeta('og:title', title, true)
    setMeta('og:description', cleanDescription, true)
    setMeta('og:type', type, true)
    setMeta('og:url', pageUrl, true)
    setMeta('og:site_name', SITE_NAME, true)
    setMeta('og:locale', 'ru_RU', true)

    if (imageUrl) {
      setMeta('og:image', imageUrl, true)
      setMeta('og:image:secure_url', imageUrl, true)
      setMeta('og:image:width', '1200', true)
      setMeta('og:image:height', '630', true)
      setMeta('og:image:alt', title, true)
    }

    setMeta('twitter:card', imageUrl ? 'summary_large_image' : 'summary')
    setMeta('twitter:title', title)
    setMeta('twitter:description', cleanDescription)
    if (imageUrl) {
      setMeta('twitter:image', imageUrl)
      setMeta('twitter:image:alt', title)
    }

    if (type === 'article') {
      if (publishedTime) setMeta('article:published_time', publishedTime, true)
      if (modifiedTime) setMeta('article:modified_time', modifiedTime, true)
      setMeta('article:author', author, true)
      tagList.forEach((tag, i) => setMeta(`article:tag:${i}`, tag, true))
    }

    let canonical = document.head.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
      createdNodes.push(canonical)
    }
    canonical.setAttribute('href', pageUrl)

    return () => {
      // Снимаем только то, что добавили сами: базовые теги из index.html остаются
      for (const node of createdNodes) node.remove()
    }
  }, [title, description, image, url, type, author, publishedTime, modifiedTime, tagsKey])

  return null
}

export default SEOHead
