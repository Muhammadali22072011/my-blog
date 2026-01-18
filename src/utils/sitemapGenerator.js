// Генератор sitemap.xml для лучшей индексации поисковиками

export const generateSitemap = (posts, baseUrl = window.location.origin) => {
  const urls = []

  // Главная страница
  urls.push({
    loc: baseUrl,
    changefreq: 'daily',
    priority: '1.0',
    lastmod: new Date().toISOString().split('T')[0]
  })

  // Страница About
  urls.push({
    loc: `${baseUrl}/about`,
    changefreq: 'monthly',
    priority: '0.8',
    lastmod: new Date().toISOString().split('T')[0]
  })

  // Страница Blogs
  urls.push({
    loc: `${baseUrl}/blogs`,
    changefreq: 'daily',
    priority: '0.9',
    lastmod: new Date().toISOString().split('T')[0]
  })

  // Все опубликованные посты
  posts
    .filter(post => post.status === 'published')
    .forEach(post => {
      urls.push({
        loc: `${baseUrl}/post/${post.id}`,
        changefreq: 'weekly',
        priority: '0.7',
        lastmod: post.updated_at || post.created_at
      })
    })

  // Генерируем XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`

  return xml
}

// Скачать sitemap.xml
export const downloadSitemap = (posts) => {
  const xml = generateSitemap(posts)
  const blob = new Blob([xml], { type: 'application/xml' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'sitemap.xml'
  link.click()
  URL.revokeObjectURL(url)
}

// Генератор robots.txt
export const generateRobotsTxt = (baseUrl = window.location.origin) => {
  return `User-agent: *
Allow: /
Disallow: /admin
Disallow: /login

Sitemap: ${baseUrl}/sitemap.xml`
}

// Скачать robots.txt
export const downloadRobotsTxt = () => {
  const txt = generateRobotsTxt()
  const blob = new Blob([txt], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'robots.txt'
  link.click()
  URL.revokeObjectURL(url)
}
