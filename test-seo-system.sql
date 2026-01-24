-- Тест 1: Проверить что SEO поля добавлены
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'posts' 
AND column_name IN ('seo_title', 'seo_description', 'seo_keywords', 'canonical_url');

-- Должно показать 4 строки ✅

-- Тест 2: Проверить текущие посты
SELECT 
  id,
  title,
  seo_title,
  LEFT(seo_description, 50) as description_preview,
  array_length(seo_keywords, 1) as keywords_count,
  canonical_url
FROM posts
ORDER BY created_at DESC
LIMIT 5;

-- Тест 3: Добавить тестовые SEO данные к одному посту
UPDATE posts
SET 
  seo_title = 'Мухаммадали Иззатуллаев - IT блог Навои',
  seo_description = 'Блог о программировании, веб-разработке и IT технологиях от Мухаммадали Иззатуллаева из Навои, Узбекистан',
  seo_keywords = ARRAY['Мухаммадали Иззатуллаев', 'IT блог', 'Навои', 'Узбекистан', 'программирование', 'веб-разработка'],
  canonical_url = 'https://izzatullaev.uz/post/' || id::text
WHERE id = (SELECT id FROM posts ORDER BY created_at DESC LIMIT 1);

-- Тест 4: Проверить результат
SELECT 
  id,
  title,
  seo_title,
  seo_description,
  seo_keywords,
  canonical_url
FROM posts
WHERE seo_title IS NOT NULL
LIMIT 1;

-- Должно показать заполненные SEO данные ✅

-- Тест 5: Статистика
SELECT 
  COUNT(*) as total_posts,
  COUNT(seo_title) as posts_with_seo,
  COUNT(*) - COUNT(seo_title) as posts_without_seo
FROM posts;

-- Показывает сколько постов с SEO и без ✅
