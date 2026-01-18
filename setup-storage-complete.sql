-- ============================================================================
-- ПОЛНАЯ НАСТРОЙКА SUPABASE STORAGE ДЛЯ МЕДИА
-- ============================================================================
-- Этот скрипт настраивает все необходимое для загрузки видео и изображений
-- ============================================================================

-- ВАЖНО: Buckets создаются через Dashboard, а не через SQL!
-- Перейдите в Supabase Dashboard → Storage → New bucket
-- Создайте следующие buckets:
-- 1. images (Public: ON)
-- 2. videos (Public: ON)  
-- 3. avatars (Public: ON)

-- ============================================================================
-- ШАГИ ДЛЯ НАСТРОЙКИ:
-- ============================================================================
-- 1. Откройте Supabase Dashboard
-- 2. Перейдите в Storage
-- 3. Нажмите "New bucket"
-- 4. Создайте bucket "images":
--    - Name: images
--    - Public bucket: ✅ ON
--    - File size limit: 5242880 (5MB)
--    - Allowed MIME types: image/*
-- 5. Создайте bucket "videos":
--    - Name: videos
--    - Public bucket: ✅ ON
--    - File size limit: 52428800 (50MB)
--    - Allowed MIME types: video/*
-- 6. Создайте bucket "avatars":
--    - Name: avatars
--    - Public bucket: ✅ ON
--    - File size limit: 2097152 (2MB)
--    - Allowed MIME types: image/*
-- 7. Выполните этот SQL скрипт для настройки политик

-- ============================================================================
-- ПОЛИТИКИ ДОСТУПА ДЛЯ BUCKET: images
-- ============================================================================

-- Удаляем старые политики если есть
DROP POLICY IF EXISTS "Public can read images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete images" ON storage.objects;

-- Публичное чтение изображений
CREATE POLICY "Public can read images"
ON storage.objects FOR SELECT
USING (bucket_id = 'images');

-- Загрузка изображений (для всех или только для авторизованных)
-- Вариант 1: Для всех (раскомментируйте если нужно)
CREATE POLICY "Anyone can upload images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'images');

-- Вариант 2: Только для авторизованных (закомментируйте предыдущую политику)
-- CREATE POLICY "Authenticated can upload images"
-- ON storage.objects FOR INSERT
-- WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');

-- Обновление изображений
CREATE POLICY "Anyone can update images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'images')
WITH CHECK (bucket_id = 'images');

-- Удаление изображений
CREATE POLICY "Anyone can delete images"
ON storage.objects FOR DELETE
USING (bucket_id = 'images');

-- ============================================================================
-- ПОЛИТИКИ ДОСТУПА ДЛЯ BUCKET: videos
-- ============================================================================

-- Удаляем старые политики если есть
DROP POLICY IF EXISTS "Public can read videos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload videos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update videos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete videos" ON storage.objects;

-- Публичное чтение видео
CREATE POLICY "Public can read videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'videos');

-- Загрузка видео (для всех или только для авторизованных)
-- Вариант 1: Для всех (раскомментируйте если нужно)
CREATE POLICY "Anyone can upload videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'videos');

-- Вариант 2: Только для авторизованных (закомментируйте предыдущую политику)
-- CREATE POLICY "Authenticated can upload videos"
-- ON storage.objects FOR INSERT
-- WITH CHECK (bucket_id = 'videos' AND auth.role() = 'authenticated');

-- Обновление видео
CREATE POLICY "Anyone can update videos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'videos')
WITH CHECK (bucket_id = 'videos');

-- Удаление видео
CREATE POLICY "Anyone can delete videos"
ON storage.objects FOR DELETE
USING (bucket_id = 'videos');

-- ============================================================================
-- ПОЛИТИКИ ДОСТУПА ДЛЯ BUCKET: avatars
-- ============================================================================

-- Удаляем старые политики если есть
DROP POLICY IF EXISTS "Public can read avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete avatars" ON storage.objects;

-- Публичное чтение аватарок
CREATE POLICY "Public can read avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Загрузка аватарок
CREATE POLICY "Anyone can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars');

-- Обновление аватарок
CREATE POLICY "Anyone can update avatars"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

-- Удаление аватарок
CREATE POLICY "Anyone can delete avatars"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars');

-- ============================================================================
-- ПРОВЕРКА НАСТРОЕК
-- ============================================================================

-- Проверяем существующие buckets
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE name IN ('images', 'videos', 'avatars')
ORDER BY name;

-- Проверяем политики для images
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects' 
  AND policyname LIKE '%images%'
ORDER BY policyname;

-- Проверяем политики для videos
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects' 
  AND policyname LIKE '%videos%'
ORDER BY policyname;

-- Проверяем политики для avatars
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects' 
  AND policyname LIKE '%avatars%'
ORDER BY policyname;

-- ============================================================================
-- ГОТОВО!
-- ============================================================================

-- Теперь вы можете:
-- 1. Загружать изображения в bucket 'images'
-- 2. Загружать видео в bucket 'videos'
-- 3. Загружать аватарки в bucket 'avatars'
-- 4. Все файлы будут публично доступны для чтения
-- 5. Загрузка, обновление и удаление доступны всем (или только авторизованным)

-- Примеры URL после загрузки:
-- Изображение: https://your-project.supabase.co/storage/v1/object/public/images/blog-images/file.jpg
-- Видео: https://your-project.supabase.co/storage/v1/object/public/videos/blog-videos/file.mp4
-- Аватарка: https://your-project.supabase.co/storage/v1/object/public/avatars/user-avatar.jpg

-- ============================================================================
-- БЕЗОПАСНОСТЬ (ОПЦИОНАЛЬНО)
-- ============================================================================

-- Если хотите ограничить загрузку только для авторизованных пользователей,
-- замените политики "Anyone can upload" на "Authenticated can upload":

-- Для images:
-- DROP POLICY "Anyone can upload images" ON storage.objects;
-- CREATE POLICY "Authenticated can upload images"
-- ON storage.objects FOR INSERT
-- WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');

-- Для videos:
-- DROP POLICY "Anyone can upload videos" ON storage.objects;
-- CREATE POLICY "Authenticated can upload videos"
-- ON storage.objects FOR INSERT
-- WITH CHECK (bucket_id = 'videos' AND auth.role() = 'authenticated');

-- Для avatars:
-- DROP POLICY "Anyone can upload avatars" ON storage.objects;
-- CREATE POLICY "Authenticated can upload avatars"
-- ON storage.objects FOR INSERT
-- WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- ============================================================================
-- ТЕСТИРОВАНИЕ
-- ============================================================================

-- После настройки протестируйте загрузку через код:
-- 
-- import supabaseService from './services/SupabaseService'
-- 
-- // Тест загрузки изображения
-- const imageResult = await supabaseService.uploadImage(imageFile)
-- console.log('Image URL:', imageResult.url)
-- 
-- // Тест загрузки видео
-- const videoResult = await supabaseService.uploadVideo(videoFile)
-- console.log('Video URL:', videoResult.url)

-- ============================================================================
