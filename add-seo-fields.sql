-- Добавляем SEO поля в таблицу posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS seo_description TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS seo_keywords TEXT[];
ALTER TABLE posts ADD COLUMN IF NOT EXISTS canonical_url TEXT;

-- Обновляем существующие посты с базовыми SEO данными
UPDATE posts 
SET 
  seo_title = title,
  seo_description = COALESCE(description, LEFT(content, 160)),
  seo_keywords = ARRAY['Мухаммадали Иззатуллаев', 'IT блог', 'Навои', 'Узбекистан', 'программирование']
WHERE seo_title IS NULL;

-- Комментарий
COMMENT ON COLUMN posts.seo_title IS 'SEO заголовок (50-60 символов)';
COMMENT ON COLUMN posts.seo_description IS 'SEO описание (150-160 символов)';
COMMENT ON COLUMN posts.seo_keywords IS 'Массив ключевых слов для SEO';
COMMENT ON COLUMN posts.canonical_url IS 'Канонический URL страницы';
