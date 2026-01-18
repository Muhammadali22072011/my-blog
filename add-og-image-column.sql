-- Добавляем колонку og_image в таблицу posts для хранения URL OG изображений
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS og_image TEXT;

-- Добавляем комментарий к колонке
COMMENT ON COLUMN posts.og_image IS 'URL изображения для Open Graph (превью в соцсетях)';

-- Проверяем результат
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'posts' AND column_name = 'og_image';
