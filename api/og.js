// Vercel Edge Function для OG тегов
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://rfppkhwqnlkpjemmoexg.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

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
    // Получаем пост из Supabase
    const supabase = createClient(supabaseUrl, supabaseKey)
    const { data: post, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', parseInt(postId))
      .eq('status', 'published')
      .single()

    if (error || !post) {
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
      if (post.featured_image) {
        if (post.featured_image.startsWith('http')) {
          return post.featured_image
        }
        return `${supabaseUrl}/storage/v1/object/public/${post.featured_image}`
      }
      if (post.og_image) {
        if (post.og_image.startsWith('http')) {
          return post.og_image
        }
        return `${supabaseUrl}/storage/v1/object/public/${post.og_image}`
      }
      return null
    }

    const title = getTitle(post.content)
    const description = getDescription(post.content)
    const imageUrl = getImageUrl(post)
    const postUrl = `https://izzatullaev.uz/post/${postId}`

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
