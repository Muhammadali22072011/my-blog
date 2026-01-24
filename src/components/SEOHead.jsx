import { useEffect } from 'react'

function SEOHead({ 
  title, 
  description, 
  image, 
  url, 
  type = 'article',
  author = 'Muhammadali',
  publishedTime,
  modifiedTime,
  tags = []
}) {
  // Функция для очистки HTML тегов из текста
  const stripHtml = (html) => {
    if (!html) return ''
    // Убираем все HTML теги
    return html.replace(/<[^>]*>/g, '')
  }

  useEffect(() => {
    // Update document title
    document.title = title ? `${title} | Muhammadali Blog` : 'Muhammadali Blog'

    // Очищаем description от HTML тегов для превью
    const cleanDescription = stripHtml(description)

    // Helper to update or create meta tag
    const setMeta = (name, content, property = false) => {
      if (!content) return
      const attr = property ? 'property' : 'name'
      let meta = document.querySelector(`meta[${attr}="${name}"]`)
      if (!meta) {
        meta = document.createElement('meta')
        meta.setAttribute(attr, name)
        document.head.appendChild(meta)
      }
      meta.setAttribute('content', content)
    }

    // Basic meta tags (используем очищенное описание)
    setMeta('description', cleanDescription)
    setMeta('author', author)
    if (tags.length > 0) {
      setMeta('keywords', tags.join(', '))
    }

    // Open Graph tags (используем очищенное описание)
    setMeta('og:title', title, true)
    setMeta('og:description', cleanDescription, true)
    setMeta('og:type', type, true)
    setMeta('og:url', url || window.location.href, true)
    setMeta('og:site_name', 'Muhammadali Blog', true)
    setMeta('og:locale', 'ru_RU', true)
    
    // OG Image - КРИТИЧНО для Telegram
    if (image) {
      // Убедимся что URL абсолютный и правильный
      let absoluteImageUrl = image
      if (!image.startsWith('http')) {
        absoluteImageUrl = `${window.location.origin}${image}`
      }
      
      // Telegram требует эти теги в правильном порядке
      setMeta('og:image', absoluteImageUrl, true)
      setMeta('og:image:secure_url', absoluteImageUrl, true)
      setMeta('og:image:type', 'image/jpeg', true)
      setMeta('og:image:width', '1200', true)
      setMeta('og:image:height', '630', true)
      setMeta('og:image:alt', title, true)
      
      console.log('🖼️ OG Image set for Telegram:', absoluteImageUrl)
    } else {
      console.warn('⚠️ No OG image provided - Telegram preview will not show image')
    }

    // Twitter Card tags (используем очищенное описание)
    setMeta('twitter:card', image ? 'summary_large_image' : 'summary')
    setMeta('twitter:title', title)
    setMeta('twitter:description', cleanDescription)
    if (image) {
      const absoluteImageUrl = image.startsWith('http') ? image : `${window.location.origin}${image}`
      setMeta('twitter:image', absoluteImageUrl)
      setMeta('twitter:image:alt', title)
    }
    setMeta('twitter:site', '@muhammadali')
    setMeta('twitter:creator', '@muhammadali')

    // Article specific tags
    if (type === 'article') {
      if (publishedTime) {
        setMeta('article:published_time', publishedTime, true)
      }
      if (modifiedTime) {
        setMeta('article:modified_time', modifiedTime, true)
      }
      setMeta('article:author', author, true)
      tags.forEach((tag, i) => {
        setMeta(`article:tag:${i}`, tag, true)
      })
    }

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
    }
    canonical.setAttribute('href', url || window.location.href)

  }, [title, description, image, url, type, author, publishedTime, modifiedTime, tags])

  return null // This component doesn't render anything
}

export default SEOHead
