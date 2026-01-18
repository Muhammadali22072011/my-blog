-- Добавляем поле featured_image в таблицу posts
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS featured_image TEXT;

-- Комментарий к полю
COMMENT ON COLUMN posts.featured_image IS 'URL главного изображения поста для превью';
