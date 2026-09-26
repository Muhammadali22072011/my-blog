-- ============================================================================
-- РУЧНАЯ ТЕСТОВАЯ ОТПРАВКА EMAIL
-- ============================================================================
-- Этот скрипт отправит тестовое письмо прямо сейчас
-- ============================================================================

DO $$
DECLARE
  resend_api_key TEXT := 'ВСТАВЬТЕ_КЛЮЧ_RESEND';
  test_email TEXT := 'demoakkaunt00001@gmail.com';
  request_id INTEGER;
  response RECORD;
BEGIN
  -- Отправляем тестовое письмо через http_request
  SELECT * INTO response FROM extensions.http((
    'POST',
    'https://api.resend.com/emails',
    ARRAY[
      extensions.http_header('Authorization', 'Bearer ' || resend_api_key),
      extensions.http_header('Content-Type', 'application/json')
    ],
    'application/json',
    json_build_object(
      'from', 'onboarding@resend.dev',
      'to', ARRAY[test_email],
      'subject', 'Test Email from Supabase',
      'html', '<h1>It works! 🎉</h1><p>Your email trigger is working correctly.</p>'
    )::text
  ));

  -- Показываем результат
  RAISE NOTICE 'Response Status: %', response.status;
  RAISE NOTICE 'Response Body: %', response.content;
  
  IF response.status = 200 THEN
    RAISE NOTICE '✅ SUCCESS! Email sent to %', test_email;
  ELSE
    RAISE WARNING '❌ FAILED! Status: %, Body: %', response.status, response.content;
  END IF;
END $$;
