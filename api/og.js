// Vercel Serverless Function для генерации OG мета-тегов
export default async function handler(req, res) {
  const { postId } = req.query;
  
  if (!postId) {
    return res.status(400).json({ error: 'postId is required' });
  }
  
  try {
    // Получаем данные поста из Supabase
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    
    const response = await fetch(`${supabaseUrl}/rest/v1/posts?id=eq.${postId}&select=*`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    
    const posts = await response.json();
    const post = posts[0];
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    // Извлекаем первое изображение из контента
    let ogImage = post.featured_image || post.og_image;
    
    if (!ogImage && post.content) {
      // Ищем HTML изображение
      const htmlImgMatch = post.content.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (htmlImgMatch) {
        ogImage = htmlImgMatch[1];
      } else {
        // Ищем markdown изображение
        const mdImgMatch = post.content.match(/!\[([^\]]*)\]\(([^)]+)\)/);
        if (mdImgMatch) {
          ogImage = mdImgMatch[2];
        }
      }
      
      // Если URL относительный, добавляем базовый URL
      if (ogImage && !ogImage.startsWith('http')) {
        ogImage = `${supabaseUrl}/storage/v1/object/public/${ogImage}`;
      }
    } else if (ogImage && !ogImage.startsWith('http')) {
      // Преобразуем featured_image в полный URL
      ogImage = `${supabaseUrl}/storage/v1/object/public/${ogImage}`;
    }
    
    // Извлекаем заголовок
    let title = 'Untitled Post';
    if (post.content) {
      const lines = post.content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('# ')) {
          title = trimmed.substring(2);
          break;
        }
      }
    }
    
    // Генерируем excerpt
    let description = post.excerpt || '';
    if (!description && post.content) {
      // Удаляем markdown форматирование
      const plainText = post.content
        .replace(/^#+ .*/gm, '')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/`(.*?)`/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/>\s.*/g, '')
        .replace(/- .*/g, '')
        .replace(/\n+/g, ' ')
        .trim();
      
      if (plainText && plainText.length >= 10) {
        description = plainText.length > 160 ? plainText.substring(0, 160) + '...' : plainText;
      } else {
        description = title + ' - Read more on Muhammadali Blog';
      }
    }
    
    if (!description) {
      description = title + ' - Read more on Muhammadali Blog';
    }
    
    // Генерируем HTML с OG мета-тегами
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} | Muhammadali Blog</title>
    
    <!-- Open Graph -->
    <meta property="og:type" content="article">
    <meta property="og:url" content="https://izzatullaev.uz/post/${postId}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    ${ogImage ? `<meta property="og:image" content="${ogImage}">` : ''}
    ${ogImage ? `<meta property="og:image:width" content="1200">` : ''}
    ${ogImage ? `<meta property="og:image:height" content="630">` : ''}
    <meta property="og:site_name" content="Muhammadali Blog">
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    ${ogImage ? `<meta name="twitter:image" content="${ogImage}">` : ''}
    
    <!-- Redirect to React app -->
    <meta http-equiv="refresh" content="0;url=https://izzatullaev.uz/post/${postId}">
    <script>window.location.href = 'https://izzatullaev.uz/post/${postId}';</script>
</head>
<body>
    <p>Redirecting to <a href="https://izzatullaev.uz/post/${postId}">${title}</a>...</p>
</body>
</html>`;
    
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
