// RSS Feed Generator
export function generateRSSFeed(posts, siteUrl = window.location.origin) {
  const getPostTitle = (post) => {
    if (post.content) {
      const lines = post.content.split('\n')
      for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed.startsWith('# ')) {
          return trimmed.substring(2)
        }
      }
    }
    return post.excerpt || 'Untitled Post'
  }

  const getExcerpt = (content, maxLength = 200) => {
    if (!content) return ''
    const plainText = content
      .replace(/^#+ .*/gm, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/>\s.*/g, '')
      .replace(/- .*/g, '')
      .replace(/\n+/g, ' ')
      .trim()
    return plainText.length <= maxLength ? plainText : plainText.substring(0, maxLength).trim() + '...'
  }

  const escapeXml = (str) => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }

  const publishedPosts = posts
    .filter(p => p.status === 'published')
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 20) // Last 20 posts

  const items = publishedPosts.map(post => {
    const title = escapeXml(getPostTitle(post))
    const description = escapeXml(getExcerpt(post.content))
    const link = `${siteUrl}/post/${post.id}`
    const pubDate = new Date(post.created_at).toUTCString()
    const category = post.category ? `<category>${escapeXml(post.category)}</category>` : ''

    return `
    <item>
      <title>${title}</title>
      <link>${link}</link>
      <description>${description}</description>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="true">${link}</guid>
      ${category}
    </item>`
  }).join('')

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Muhammadali Blog</title>
    <link>${siteUrl}</link>
    <description>Personal blog about web development, technology, and more.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`

  return rss
}

// Download RSS as file
export function downloadRSS(posts) {
  const rss = generateRSSFeed(posts)
  const blob = new Blob([rss], { type: 'application/rss+xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'rss.xml'
  a.click()
  URL.revokeObjectURL(url)
}
