-- ============================================================================
-- ДИАГНОСТИКА EMAIL ТРИГГЕРА
-- ============================================================================
-- Выполните этот скрипт чтобы проверить, что не работает
-- ============================================================================

-- 1. Проверяем, установлено ли расширение http
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'http') 
    THEN '✅ HTTP расширение установлено'
    ELSE '❌ HTTP расширение НЕ установлено'
  END as http_status;

-- 2. Проверяем, существует ли функция send_welcome_email
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'send_welcome_email') 
    THEN '✅ Функция send_welcome_email существует'
    ELSE '❌ Функция send_welcome_email НЕ существует'
  END as function_status;

-- 3. Проверяем, существует ли триггер
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_newsletter_subscribe') 
    THEN '✅ Триггер on_newsletter_subscribe установлен'
    ELSE '❌ Триггер on_newsletter_subscribe НЕ установлен'
  END as trigger_status;

-- 4. Смотрим последние подписки
SELECT 
  id,
  email,
  name,
  subscribed_at,
  '(проверьте, есть ли ваш email)' as note
FROM public.newsletter_subscribers
ORDER BY subscribed_at DESC
LIMIT 5;

-- 5. ТЕСТОВАЯ ОТПРАВКА EMAIL
-- Раскомментируйте строки ниже и замените email на ваш:
-- 
-- DELETE FROM public.newsletter_subscribers WHERE email = 'test@example.com';
-- INSERT INTO public.newsletter_subscribers (email, name) 
-- VALUES ('test@example.com', 'Test User');
--
-- После выполнения проверьте почту test@example.com

-- 6. Проверяем логи (если есть ошибки, они будут здесь)
-- Перейдите в Supabase Dashboard → Database → Logs
-- Или выполните:
-- SELECT * FROM pg_stat_statements WHERE query LIKE '%send_welcome_email%' LIMIT 10;
