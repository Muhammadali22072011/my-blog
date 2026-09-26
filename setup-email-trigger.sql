-- ============================================================================
-- БЫСТРАЯ НАСТРОЙКА EMAIL ТРИГГЕРА
-- ============================================================================
-- Автоматическая отправка welcome email при подписке
-- ============================================================================

-- 1. Включаем расширение для HTTP запросов
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- 2. Создаем функцию для отправки email
CREATE OR REPLACE FUNCTION send_welcome_email()
RETURNS TRIGGER AS $$
DECLARE
  resend_api_key TEXT := 'ВСТАВЬТЕ_КЛЮЧ_RESEND';
  response RECORD;
BEGIN
  -- Отправляем HTTP POST запрос к Resend API
  SELECT * INTO response FROM extensions.http((
    'POST',
    'https://api.resend.com/emails',
    ARRAY[
      extensions.http_header('Authorization', 'Bearer ' || resend_api_key),
      extensions.http_header('Content-Type', 'application/json')
    ],
    'application/json',
    json_build_object(
      'from', 'Muhammadali Blog <onboarding@resend.dev>',
      'to', ARRAY[NEW.email],
      'subject', 'Welcome to Muhammadali Blog! 🎉',
      'html', 
        '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">' ||
        '<h1 style="color: #2563eb;">Welcome! 👋</h1>' ||
        '<p>Thanks for subscribing to my newsletter!</p>' ||
        '<p>You''ll receive updates about new posts and projects.</p>' ||
        '<p style="margin-top: 30px;">Best regards,<br>Muhammadali</p>' ||
        '</div>'
    )::text
  ));

  -- Логируем результат
  RAISE NOTICE 'Email sent to %: Status %', NEW.email, response.status;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Если ошибка, логируем но не прерываем
    RAISE WARNING 'Failed to send email to %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Удаляем старый триггер если есть
DROP TRIGGER IF EXISTS on_newsletter_subscribe ON public.newsletter_subscribers;

-- 4. Создаем новый триггер
CREATE TRIGGER on_newsletter_subscribe
  AFTER INSERT ON public.newsletter_subscribers
  FOR EACH ROW
  EXECUTE FUNCTION send_welcome_email();

-- ============================================================================
-- ГОТОВО! Теперь при подписке будет автоматически отправляться email
-- ============================================================================

-- Проверка установки:
SELECT 
  '✅ Триггер установлен!' as status,
  tgname as trigger_name,
  tgrelid::regclass as table_name
FROM pg_trigger 
WHERE tgname = 'on_newsletter_subscribe';
