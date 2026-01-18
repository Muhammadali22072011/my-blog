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
  useEffect(() => {
    // Update document title
    document.title = title ? `${title} | Muhammadali Blog` : 'Muhammadali Blog'

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

    // Basic meta tags
    setMeta('description', description)
    setMeta('author', author)
    if (tags.length > 0) {
      setMeta('keywords', tags.join(', '))
    }

    // Open Graph tags
    setMeta('og:title', title, true)
    setMeta('og:description', description, true)
    setMeta('og:type', type, true)
    setMeta('og:url', url || window.location.href, true)
    if (image) {
      // Убедимся что URL абсолютный
      const absoluteImageUrl = image.startsWith('http') ? image : `${window.location.origin}${image}`
      setMeta('og:image', absoluteImageUrl, true)
      setMeta('og:image:secure_url', absoluteImageUrl, true)
      setMeta('og:image:width', '1200', true)
      setMeta('og:image:height', '630', true)
      setMeta('og:image:type', 'image/png', true)
      setMeta('og:image:alt', title, true)
    }
    setMeta('og:site_name', 'Muhammadali Blog', true)
    setMeta('og:locale', 'ru_RU', true)

    // Twitter Card tags
    setMeta('twitter:card', image ? 'summary_large_image' : 'summary')
    setMeta('twitter:title', title)
    setMeta('twitter:description', description)
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
