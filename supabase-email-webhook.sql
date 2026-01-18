-- ============================================================================
-- НАСТРОЙКА EMAIL РАССЫЛКИ ЧЕРЕЗ SUPABASE
-- ============================================================================
-- Этот скрипт настраивает автоматическую отправку email при подписке
-- ============================================================================

-- 1. Включаем расширение для HTTP запросов
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- 2. Создаем функцию для отправки welcome email через Resend API
CREATE OR REPLACE FUNCTION send_welcome_email()
RETURNS TRIGGER AS $$
DECLARE
  resend_api_key TEXT := 're_FrKiarb5_JcEn936WA2ZMPjtLBdTmdamL'; -- Ваш Resend API ключ
  response extensions.http_response;
BEGIN
  -- Отправляем HTTP POST запрос к Resend API
  SELECT * INTO response
  FROM extensions.http_post(
    'https://api.resend.com/emails',
    json_build_object(
      'from', 'Muhammadali Blog <onboarding@resend.dev>',
      'to', ARRAY[NEW.email],
      'subject', 'Welcome to Muhammadali Blog Newsletter! 🎉',
      'html', 
        '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">' ||
        '<h1 style="color: #2563eb;">Welcome to My Blog!</h1>' ||
        '<p>Hi there! 👋</p>' ||
        '<p>Thanks for subscribing to my newsletter. You''ll receive updates about:</p>' ||
        '<ul>' ||
        '<li>New blog posts</li>' ||
        '<li>Tech tutorials</li>' ||
        '<li>Project updates</li>' ||
        '</ul>' ||
        '<p>Stay tuned for great content!</p>' ||
        '<hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">' ||
        '<p style="color: #6b7280; font-size: 12px;">You can unsubscribe anytime by clicking <a href="https://yourblog.com/unsubscribe">here</a></p>' ||
        '</div>'
    )::text,
    'application/json',
    ARRAY[
      extensions.http_header('Authorization', 'Bearer ' || resend_api_key),
      extensions.http_header('Content-Type', 'application/json')
    ]
  );

  -- Логируем результат
  RAISE NOTICE 'Email sent to %: Status %', NEW.email, response.status;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Если ошибка, логируем но не прерываем транзакцию
    RAISE WARNING 'Failed to send email to %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Создаем триггер на вставку нового подписчика
DROP TRIGGER IF EXISTS on_newsletter_subscribe ON public.newsletter_subscribers;
CREATE TRIGGER on_newsletter_subscribe
  AFTER INSERT ON public.newsletter_subscribers
  FOR EACH ROW
  EXECUTE FUNCTION send_welcome_email();

-- ============================================================================
-- ИНСТРУКЦИЯ ПО НАСТРОЙКЕ:
-- ============================================================================
-- 
-- 1. Зарегистрируйтесь на https://resend.com (бесплатно)
-- 2. Получите API ключ в Dashboard
-- 3. Замените 'YOUR_RESEND_API_KEY_HERE' на ваш ключ в строке 12
-- 4. Выполните этот SQL скрипт в Supabase SQL Editor
-- 5. Готово! Теперь при подписке автоматически отправляется email
--
-- ВАЖНО: Для production используйте Supabase Secrets вместо хардкода ключа:
-- 1. Создайте secret: supabase secrets set RESEND_API_KEY=your_key
-- 2. Используйте: current_setting('app.settings.resend_api_key')
--
-- ============================================================================

-- Альтернатива: Используйте Supabase Edge Function (более безопасно)
-- Создайте функцию через CLI:
-- supabase functions new send-newsletter-email
-- И вызывайте её из триггера через pg_net
