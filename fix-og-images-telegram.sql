-- Проверяем текущие посты и их изображения
SELECT 
  id,
  SUBSTRING(content, 1, 50) as title_preview,
  featured_image,
  og_image,
  CASE 
    WHEN featured_image IS NOT NULL THEN '✅ Featured'
    WHEN og_image IS NOT NULL THEN '✅ OG'
    ELSE '❌ No Image'
  END as image_status
FROM posts
WHERE status = 'published'
ORDER BY created_at DESC;

-- Если у постов нет изображений, добавим дефолтное OG изображение
-- Раскомментируйте эту часть после проверки выше:

/*
UPDATE posts
SET og_image = 'images/blog-images/default-og-image.png'
WHERE status = 'published' 
  AND featured_image IS NULL 
  AND og_image IS NULL;
*/

-- Или установите конкретное изображение для конкретного поста:
/*
UPDATE posts
SET featured_image = 'images/blog-images/your-image.png'
WHERE id = 98;  -- ID вашего поста про кибербезопасность
*/
