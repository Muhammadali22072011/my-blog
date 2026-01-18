-- ============================================================================
-- СОЗДАНИЕ ТАБЛИЦЫ SECURITY_LOGS (УПРОЩЕННАЯ ВЕРСИЯ)
-- ============================================================================
-- Выполните этот скрипт в Supabase SQL Editor
-- ============================================================================

-- Создание таблицы для логов безопасности
CREATE TABLE IF NOT EXISTS security_logs (
  id BIGSERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  action TEXT NOT NULL CHECK (action IN ('allowed', 'blocked', 'warning')),
  ip_address TEXT,
  user_agent TEXT,
  user_id UUID REFERENCES auth.users(id),
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON security_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_logs_severity ON security_logs(severity);
CREATE INDEX IF NOT EXISTS idx_security_logs_action ON security_logs(action);
CREATE INDEX IF NOT EXISTS idx_security_logs_ip ON security_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON security_logs(user_id);

-- Комментарии
COMMENT ON TABLE security_logs IS 'Логи безопасности системы';
COMMENT ON COLUMN security_logs.event_type IS 'Тип события (login_attempt, failed_login, suspicious_activity, etc.)';
COMMENT ON COLUMN security_logs.severity IS 'Уровень серьезности: low, medium, high, critical';
COMMENT ON COLUMN security_logs.action IS 'Действие системы: allowed, blocked, warning';
COMMENT ON COLUMN security_logs.ip_address IS 'IP адрес пользователя';
COMMENT ON COLUMN security_logs.user_agent IS 'User Agent браузера';
COMMENT ON COLUMN security_logs.details IS 'Дополнительные детали в JSON формате';

-- ============================================================================
-- RLS ПОЛИТИКИ (УПРОЩЕННЫЕ - БЕЗ ПРОВЕРКИ НА АДМИНА)
-- ============================================================================

ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;

-- Все аутентифицированные пользователи могут читать логи
CREATE POLICY "Authenticated users can read security logs"
  ON security_logs
  FOR SELECT
  TO authenticated
  USING (true);

-- Анонимные пользователи тоже могут читать (для админ-панели без авторизации)
CREATE POLICY "Anon can read security logs"
  ON security_logs
  FOR SELECT
  TO anon
  USING (true);

-- Все могут записывать логи
CREATE POLICY "Anyone can insert security logs"
  ON security_logs
  FOR INSERT
  WITH CHECK (true);

-- Аутентифицированные могут удалять логи
CREATE POLICY "Authenticated can delete security logs"
  ON security_logs
  FOR DELETE
  TO authenticated
  USING (true);

-- Анонимные могут удалять логи (для админ-панели)
CREATE POLICY "Anon can delete security logs"
  ON security_logs
  FOR DELETE
  TO anon
  USING (true);

-- ============================================================================
-- ФУНКЦИЯ ДЛЯ АВТОМАТИЧЕСКОЙ ОЧИСТКИ СТАРЫХ ЛОГОВ
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_old_security_logs()
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM security_logs
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$;

-- ============================================================================
-- ТЕСТОВЫЕ ДАННЫЕ
-- ============================================================================

INSERT INTO security_logs (event_type, severity, action, ip_address, user_agent, details) VALUES
  ('login_attempt', 'low', 'allowed', '192.168.1.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '{"success": true, "username": "admin"}'::jsonb),
  ('failed_login', 'medium', 'warning', '192.168.1.2', 'Mozilla/5.0 (Macintosh; Intel Mac OS X)', '{"attempts": 3, "username": "test"}'::jsonb),
  ('suspicious_activity', 'high', 'blocked', '192.168.1.3', 'curl/7.68.0', '{"reason": "bot_detected", "endpoint": "/api/posts"}'::jsonb),
  ('brute_force_attempt', 'critical', 'blocked', '192.168.1.4', 'Python-requests/2.28.0', '{"attempts": 10, "timeframe": "5 minutes"}'::jsonb),
  ('sql_injection_attempt', 'critical', 'blocked', '192.168.1.5', 'Mozilla/5.0', '{"query": "SELECT * FROM users WHERE id=1 OR 1=1", "blocked": true}'::jsonb),
  ('xss_attempt', 'high', 'blocked', '192.168.1.6', 'Chrome/120.0', '{"payload": "<script>alert(1)</script>", "field": "comment"}'::jsonb),
  ('rate_limit_exceeded', 'medium', 'warning', '192.168.1.7', 'PostmanRuntime/7.32.0', '{"requests": 150, "limit": 100, "timeframe": "1 minute"}'::jsonb),
  ('unauthorized_access', 'high', 'blocked', '192.168.1.8', 'Mozilla/5.0', '{"endpoint": "/admin", "authenticated": false}'::jsonb);

-- ============================================================================
-- ПРОВЕРКА РЕЗУЛЬТАТА
-- ============================================================================

SELECT 
  COUNT(*) as total_logs,
  COUNT(DISTINCT ip_address) as unique_ips,
  COUNT(*) FILTER (WHERE action = 'blocked') as blocked_count,
  COUNT(*) FILTER (WHERE severity = 'critical') as critical_count,
  COUNT(*) FILTER (WHERE severity = 'high') as high_count,
  COUNT(*) FILTER (WHERE severity = 'medium') as medium_count,
  COUNT(*) FILTER (WHERE severity = 'low') as low_count
FROM security_logs;

-- ============================================================================
-- ГОТОВО! ✅
-- ============================================================================
-- 
-- Теперь:
-- 1. Обновите страницу админ-панели (F5)
-- 2. Перейдите на таб "🛡️ Безопасность"
-- 3. Увидите 8 тестовых событий с разными уровнями серьезности
-- 
-- ============================================================================
