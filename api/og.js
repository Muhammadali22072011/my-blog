// Vercel Edge Function для OG тегов
const supabaseUrl = 'https://rfppkhwqnlkpjemmoexg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmcHBraHdxbmxrcGplbW1vZXhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MDAyNDcsImV4cCI6MjA3MTE3NjI0N30.KNDzI-PDysx7SJoFWtSqWyb5ZejTL1QVa5CwHw1IgFE'

export const config = {
  runtime: 'edge',
}

export default async function handler(req) {
  const url = new URL(req.url)
  const postId = url.searchParams.get('postId')

  if (!postId) {
    return new Response('Missing postId', { status: 400 })
  }

  try {
    // Получаем пост из Supabase через fetch
    const response = await fetch(
      `${supabaseUrl}/rest/v1/posts?id=eq.${postId}&status=eq.published&select=*`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      }
    )

    const posts = await response.json()
    const post = posts[0]

    if (!post) {
      return new Response('Post not found', { status: 404 })
    }

    // Извлекаем заголовок из контента
    const getTitle = (content) => {
      if (!content) return 'Untitled Post'
      const lines = content.split('\n')
      for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed.startsWith('# ')) {
          return trimmed.substring(2)
        }
      }
      return 'Untitled Post'
    }

    // Извлекаем описание
    const getDescription = (content) => {
      if (!content) return 'Read this blog post'
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
      return plainText.length <= 160 ? plainText : plainText.substring(0, 160) + '...'
    }

    // Формируем URL изображения
    const getImageUrl = (post) => {
      console.log('Post featured_image:', post.featured_image)
      console.log('Post og_image:', post.og_image)
      
      if (post.featured_image) {
        // Если уже полный URL
        if (post.featured_image.startsWith('http')) {
          return post.featured_image
        }
        // Если путь начинается с images/
        if (post.featured_image.startsWith('images/')) {
          return `${supabaseUrl}/storage/v1/object/public/${post.featured_image}`
        }
        // Если путь начинается со слэша
        if (post.featured_image.startsWith('/')) {
          return `${supabaseUrl}/storage/v1/object/public${post.featured_image}`
        }
        // Иначе добавляем полный путь
        return `${supabaseUrl}/storage/v1/object/public/images/blog-images/${post.featured_image}`
      }
      
      if (post.og_image) {
        if (post.og_image.startsWith('http')) {
          return post.og_image
        }
        if (post.og_image.startsWith('images/')) {
          return `${supabaseUrl}/storage/v1/object/public/${post.og_image}`
        }
        return `${supabaseUrl}/storage/v1/object/public/images/blog-images/${post.og_image}`
      }
      
      return null
    }

    const title = getTitle(post.content)
    const description = getDescription(post.content)
    const imageUrl = getImageUrl(post)
    const postUrl = `https://izzatullaev.uz/post/${postId}`
    
    console.log('Generated OG tags:', { title, description, imageUrl, postUrl })

    // Генерируем HTML с правильными OG тегами
    const html = `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | Muhammadali Blog</title>
  
  <!-- Basic Meta Tags -->
  <meta name="description" content="${description}">
  <meta name="author" content="Muhammadali">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="article">
  <meta property="og:url" content="${postUrl}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:site_name" content="Muhammadali Blog">
  <meta property="og:locale" content="ru_RU">
  ${imageUrl ? `
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:image:secure_url" content="${imageUrl}">
  <meta property="og:image:type" content="image/jpeg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${title}">
  ` : ''}
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${postUrl}">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  ${imageUrl ? `<meta name="twitter:image" content="${imageUrl}">` : ''}
  
  <!-- Redirect to actual page -->
  <meta http-equiv="refresh" content="0;url=${postUrl}">
  <script>window.location.href = "${postUrl}";</script>
</head>
<body>
  <h1>${title}</h1>
  <p>${description}</p>
  <p>Redirecting to <a href="${postUrl}">${postUrl}</a>...</p>
</body>
</html>
`

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    })
  } catch (error) {
    console.error('Error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
