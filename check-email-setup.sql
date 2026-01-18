-- Проверка настройки email рассылки
-- Выполните этот скрипт в Supabase SQL Editor

-- 1. Проверяем, установлено ли расширение http
SELECT * FROM pg_extension WHERE extname = 'http';

-- 2. Проверяем, существует ли функция send_welcome_email
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'send_welcome_email';

-- 3. Проверяем, существует ли триггер on_newsletter_subscribe
SELECT tgname, tgrelid::regclass, tgfoid::regproc
FROM pg_trigger 
WHERE tgname = 'on_newsletter_subscribe';

-- 4. Проверяем таблицу newsletter_subscribers
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'newsletter_subscribers';

-- 5. Тестовая отправка (раскомментируйте и замените email)
-- INSERT INTO public.newsletter_subscribers (email, name) 
-- VALUES ('test@example.com', 'Test User');
