-- Добавляем SEO поля в таблицу posts
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS keywords TEXT[],
ADD COLUMN IF NOT EXISTS meta_description TEXT,
ADD COLUMN IF NOT EXISTS slug TEXT;

-- Добавляем комментарии
COMMENT ON COLUMN posts.keywords IS 'Массив ключевых слов для SEO';
COMMENT ON COLUMN posts.meta_description IS 'Мета-описание для поисковиков (до 160 символов)';
COMMENT ON COLUMN posts.slug IS 'SEO-дружественный URL (например: kak-uluchshit-seo)';

-- Создаем индекс для быстрого поиска по ключевым словам
CREATE INDEX IF NOT EXISTS idx_posts_keywords ON posts USING GIN (keywords);

-- Создаем индекс для slug
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts (slug);

-- Проверяем результат
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'posts' 
AND column_name IN ('keywords', 'meta_description', 'slug', 'og_image');
