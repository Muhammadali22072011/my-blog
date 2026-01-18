-- ============================================================================
-- SECURE ADMIN AUTHENTICATION SETUP
-- ============================================================================

-- 1. Создаем таблицу для админских сессий
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token TEXT UNIQUE NOT NULL,
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true
);

-- 2. Создаем таблицу для логирования попыток входа
CREATE TABLE IF NOT EXISTS admin_login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  step_number INTEGER NOT NULL,
  success BOOLEAN DEFAULT false,
  attempted_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Создаем таблицу для хранения админских настроек (секреты)
CREATE TABLE IF NOT EXISTS admin_secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  secret_type TEXT NOT NULL, -- 'pattern', 'sequence', 'question'
  secret_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Добавляем индексы для производительности
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_admin_login_attempts_ip ON admin_login_attempts(ip_address, attempted_at);

-- 5. Функция для очистки старых сессий
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM admin_sessions 
  WHERE expires_at < NOW() OR is_active = false;
  
  -- Удаляем старые попытки входа (старше 24 часов)
  DELETE FROM admin_login_attempts 
  WHERE attempted_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Функция для проверки rate limiting
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_ip_address TEXT,
  p_time_window INTERVAL DEFAULT '15 minutes',
  p_max_attempts INTEGER DEFAULT 10
)
RETURNS BOOLEAN AS $$
DECLARE
  attempt_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO attempt_count
  FROM admin_login_attempts
  WHERE ip_address = p_ip_address
    AND attempted_at > NOW() - p_time_window;
  
  RETURN attempt_count < p_max_attempts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Функция для логирования попыток
CREATE OR REPLACE FUNCTION log_login_attempt(
  p_ip_address TEXT,
  p_user_agent TEXT,
  p_step_number INTEGER,
  p_success BOOLEAN
)
RETURNS void AS $$
BEGIN
  INSERT INTO admin_login_attempts (ip_address, user_agent, step_number, success)
  VALUES (p_ip_address, p_user_agent, p_step_number, p_success);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Функция для создания сессии
CREATE OR REPLACE FUNCTION create_admin_session(
  p_session_token TEXT,
  p_user_agent TEXT,
  p_ip_address TEXT,
  p_expires_in_hours INTEGER DEFAULT 1
)
RETURNS UUID AS $$
DECLARE
  session_id UUID;
BEGIN
  INSERT INTO admin_sessions (session_token, user_agent, ip_address, expires_at)
  VALUES (
    p_session_token,
    p_user_agent,
    p_ip_address,
    NOW() + (p_expires_in_hours || ' hours')::INTERVAL
  )
  RETURNING id INTO session_id;
  
  RETURN session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Функция для валидации сессии
CREATE OR REPLACE FUNCTION validate_admin_session(p_session_token TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  is_valid BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM admin_sessions
    WHERE session_token = p_session_token
      AND expires_at > NOW()
      AND is_active = true
  ) INTO is_valid;
  
  RETURN is_valid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Функция для инвалидации сессии (logout)
CREATE OR REPLACE FUNCTION invalidate_admin_session(p_session_token TEXT)
RETURNS void AS $$
BEGIN
  UPDATE admin_sessions
  SET is_active = false
  WHERE session_token = p_session_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. RLS политики для админских таблиц
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_secrets ENABLE ROW LEVEL SECURITY;

-- Только сервисная роль может работать с этими таблицами
CREATE POLICY "Service role only" ON admin_sessions FOR ALL USING (false);
CREATE POLICY "Service role only" ON admin_login_attempts FOR ALL USING (false);
CREATE POLICY "Service role only" ON admin_secrets FOR ALL USING (false);

-- 12. Вставляем хеши секретов (используем SHA-256)
-- Паттерн: [1, 2, 5, 8, 9] -> хеш
-- Последовательность: [1, 1, 2, 3, 5, 8] -> хеш
INSERT INTO admin_secrets (secret_type, secret_hash) VALUES
  ('pattern', encode(digest('[1,2,5,8,9]', 'sha256'), 'hex')),
  ('sequence', encode(digest('[1,1,2,3,5,8]', 'sha256'), 'hex'))
ON CONFLICT DO NOTHING;

-- 13. Создаем scheduled job для очистки (если поддерживается)
-- Это нужно настроить в Supabase Dashboard -> Database -> Cron Jobs
-- SELECT cron.schedule('cleanup-expired-sessions', '0 * * * *', 'SELECT cleanup_expired_sessions()');

-- 14. Гранты для функций (чтобы Edge Functions могли их вызывать)
GRANT EXECUTE ON FUNCTION cleanup_expired_sessions() TO service_role;
GRANT EXECUTE ON FUNCTION check_rate_limit(TEXT, INTERVAL, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION log_login_attempt(TEXT, TEXT, INTEGER, BOOLEAN) TO service_role;
GRANT EXECUTE ON FUNCTION create_admin_session(TEXT, TEXT, TEXT, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION validate_admin_session(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION invalidate_admin_session(TEXT) TO service_role;

-- ============================================================================
-- ИНФОРМАЦИЯ
-- ============================================================================
-- После выполнения этого скрипта:
-- 1. Создайте Edge Function для валидации (см. supabase/functions/admin-auth/)
-- 2. Обновите клиентский код для работы с новым API
-- 3. Настройте переменные окружения для секретов
-- 4. Протестируйте rate limiting
-- ============================================================================

SELECT 'Secure admin setup completed successfully!' AS status;
