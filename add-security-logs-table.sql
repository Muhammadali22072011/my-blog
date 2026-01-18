-- ============================================================================
-- ДОБАВЛЕНИЕ ТАБЛИЦЫ SECURITY_LOGS В СУЩЕСТВУЮЩУЮ БАЗУ
-- ============================================================================
-- Выполните этот скрипт в Supabase SQL Editor
-- ============================================================================

-- Создание таблицы для логов безопасности
CREATE TABLE IF NOT EXISTS public.security_logs (
  id BIGSERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  action TEXT NOT NULL CHECK (action IN ('allowed', 'blocked', 'warning')),
  ip_address TEXT,
  user_agent TEXT,
  user_id TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON public.security_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_logs_severity ON public.security_logs(severity);
CREATE INDEX IF NOT EXISTS idx_security_logs_action ON public.security_logs(action);
CREATE INDEX IF NOT EXISTS idx_security_logs_ip ON public.security_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON public.security_logs(event_type);

-- Комментарии
COMMENT ON TABLE public.security_logs IS 'Логи безопасности системы';
COMMENT ON COLUMN public.security_logs.event_type IS 'Тип события (login_attempt, failed_login, suspicious_activity, etc.)';
COMMENT ON COLUMN public.security_logs.severity IS 'Уровень серьезности: low, medium, high, critical';
COMMENT ON COLUMN public.security_logs.action IS 'Действие системы: allowed, blocked, warning';

-- ============================================================================
-- RLS ПОЛИТИКИ (ОТКРЫТЫЕ ДЛЯ ВСЕХ)
-- ============================================================================

ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- Все могут читать логи
CREATE POLICY "Anyone can read security logs"
  ON public.security_logs
  FOR SELECT
  USING (true);

-- Все могут записывать логи
CREATE POLICY "Anyone can insert security logs"
  ON public.security_logs
  FOR INSERT
  WITH CHECK (true);

-- Все могут удалять логи (для очистки)
CREATE POLICY "Anyone can delete security logs"
  ON public.security_logs
  FOR DELETE
  USING (true);

-- ============================================================================
-- ТЕСТОВЫЕ ДАННЫЕ (8 СОБЫТИЙ)
-- ============================================================================

INSERT INTO public.security_logs (event_type, severity, action, ip_address, user_agent, details) VALUES
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
  COUNT(*) FILTER (WHERE severity = 'critical') as critical_count
FROM public.security_logs;

-- ============================================================================
-- ГОТОВО! ✅
-- ============================================================================
