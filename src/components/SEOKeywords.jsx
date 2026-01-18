import { useEffect } from 'react'

// Компонент для управления SEO ключевыми словами и структурированными данными
function SEOKeywords({ 
  keywords = [],
  post = null,
  type = 'website'
}) {
  useEffect(() => {
    // Добавляем ключевые слова
    if (keywords.length > 0) {
      let metaKeywords = document.querySelector('meta[name="keywords"]')
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta')
        metaKeywords.setAttribute('name', 'keywords')
        document.head.appendChild(metaKeywords)
      }
      metaKeywords.setAttribute('content', keywords.join(', '))
    }

    // Добавляем структурированные данные (JSON-LD) для Google
    if (post && type === 'article') {
      const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.description,
        image: post.image || window.location.origin + '/logo.svg',
        datePublished: post.publishedTime,
        dateModified: post.modifiedTime || post.publishedTime,
        author: {
          '@type': 'Person',
          name: post.author || 'Muhammadali',
          url: window.location.origin
        },
        publisher: {
          '@type': 'Organization',
          name: 'Muhammadali Blog',
          logo: {
            '@type': 'ImageObject',
            url: window.location.origin + '/logo.svg'
          }
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': window.location.href
        },
        keywords: keywords.join(', '),
        articleSection: post.category,
        wordCount: post.content ? post.content.split(/\s+/).length : 0
      }

      // Удаляем старый script если есть
      const oldScript = document.querySelector('script[type="application/ld+json"]')
      if (oldScript) {
        oldScript.remove()
      }

      // Добавляем новый
      const script = document.createElement('script')
      script.type = 'application/ld+json'
      script.text = JSON.stringify(structuredData)
      document.head.appendChild(script)

      return () => {
        const scriptToRemove = document.querySelector('script[type="application/ld+json"]')
        if (scriptToRemove) {
          scriptToRemove.remove()
        }
      }
    }
  }, [keywords, post, type])

  return null
}

export default SEOKeywords
