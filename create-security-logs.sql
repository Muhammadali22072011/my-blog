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

-- RLS политики
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;

-- Только админы могут читать логи
CREATE POLICY "Admins can read security logs"
  ON security_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Система может записывать логи
CREATE POLICY "System can insert security logs"
  ON security_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Только админы могут удалять логи
CREATE POLICY "Admins can delete security logs"
  ON security_logs
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Функция для автоматической очистки старых логов (старше 90 дней)
CREATE OR REPLACE FUNCTION cleanup_old_security_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM security_logs
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Создаем несколько тестовых записей
INSERT INTO security_logs (event_type, severity, action, ip_address, user_agent, details) VALUES
  ('login_attempt', 'low', 'allowed', '192.168.1.1', 'Mozilla/5.0', '{"success": true}'::jsonb),
  ('failed_login', 'medium', 'warning', '192.168.1.2', 'Mozilla/5.0', '{"attempts": 3}'::jsonb),
  ('suspicious_activity', 'high', 'blocked', '192.168.1.3', 'curl/7.0', '{"reason": "bot_detected"}'::jsonb),
  ('brute_force_attempt', 'critical', 'blocked', '192.168.1.4', 'Python-requests', '{"attempts": 10}'::jsonb);

-- Проверяем результат
SELECT 
  COUNT(*) as total_logs,
  COUNT(DISTINCT ip_address) as unique_ips,
  COUNT(*) FILTER (WHERE action = 'blocked') as blocked_count,
  COUNT(*) FILTER (WHERE severity = 'critical') as critical_count
FROM security_logs;
