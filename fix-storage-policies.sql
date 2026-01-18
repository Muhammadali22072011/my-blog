-- ============================================================================
-- ИСПРАВЛЕНИЕ ПОЛИТИК STORAGE ДЛЯ ЗАГРУЗКИ ФАЙЛОВ
-- ============================================================================
-- Выполните этот скрипт в Supabase SQL Editor
-- ============================================================================

-- 1. Удаляем старые политики для bucket 'images'
DROP POLICY IF EXISTS "Public can read images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete images" ON storage.objects;

-- 2. Создаем новые политики для bucket 'images'

-- Разрешаем всем читать изображения
CREATE POLICY "Public can read images"
ON storage.objects FOR SELECT
USING (bucket_id = 'images');

-- Разрешаем всем загружать изображения
CREATE POLICY "Anyone can upload images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'images');

-- Разрешаем всем обновлять изображения
CREATE POLICY "Anyone can update images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'images')
WITH CHECK (bucket_id = 'images');

-- Разрешаем всем удалять изображения
CREATE POLICY "Anyone can delete images"
ON storage.objects FOR DELETE
USING (bucket_id = 'images');

-- 3. Политики для bucket 'avatars'
DROP POLICY IF EXISTS "Public can read avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete avatars" ON storage.objects;

CREATE POLICY "Public can read avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Anyone can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Anyone can update avatars"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Anyone can delete avatars"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars');

-- 4. Политики для bucket 'videos'
DROP POLICY IF EXISTS "Public can read videos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload videos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update videos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete videos" ON storage.objects;

CREATE POLICY "Public can read videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'videos');

CREATE POLICY "Anyone can upload videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'videos');

CREATE POLICY "Anyone can update videos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'videos')
WITH CHECK (bucket_id = 'videos');

CREATE POLICY "Anyone can delete videos"
ON storage.objects FOR DELETE
USING (bucket_id = 'videos');

-- ============================================================================
-- ГОТОВО! Теперь загрузка файлов должна работать
-- ============================================================================

-- ПРИМЕЧАНИЕ: Если вы хотите более строгие политики (только для аутентифицированных),
-- замените условия на:
-- USING (bucket_id = 'images' AND auth.role() = 'authenticated')
