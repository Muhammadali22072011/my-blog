// Генератор sitemap.xml для SEO

export const generateSitemap = (posts, baseUrl = 'https://izzatullaev.uz') => {
  const now = new Date().toISOString()
  
  // Главная страница
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/feed</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/search</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`

  // Добавляем все посты
  posts.forEach(post => {
    const postUrl = `${baseUrl}/post/${post.id}`
    const lastmod = post.updated_at || post.created_at || now
    
    sitemap += `  <url>
    <loc>${postUrl}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`
  })

  sitemap += `</urlset>`
  
  return sitemap
}

// Генератор robots.txt
export const generateRobotsTxt = (baseUrl = 'https://izzatullaev.uz') => {
  return `# Robots.txt для ${baseUrl}
User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml

# Основные поисковики
User-agent: Googlebot
Allow: /

User-agent: Yandex
Allow: /

User-agent: Bingbot
Allow: /
`
}
