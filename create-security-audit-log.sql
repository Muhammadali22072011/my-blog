-- Таблица для логирования входов и активности пользователей
CREATE TABLE IF NOT EXISTS security_audit_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'login', 'logout', 'page_view', 'admin_access'
  ip_address TEXT,
  user_agent TEXT,
  browser TEXT,
  os TEXT,
  device TEXT,
  country TEXT,
  city TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  page_url TEXT,
  page_title TEXT,
  referrer TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_security_audit_user_id ON security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_event_type ON security_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_security_audit_created_at ON security_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_audit_ip ON security_audit_log(ip_address);

-- RLS политики
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

-- Только админы могут читать логи
CREATE POLICY "Admins can view all audit logs"
  ON security_audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Все могут создавать логи (для трекинга)
CREATE POLICY "Anyone can create audit logs"
  ON security_audit_log
  FOR INSERT
  WITH CHECK (true);

-- Функция для автоматического логирования входов
CREATE OR REPLACE FUNCTION log_user_login()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO security_audit_log (
    user_id,
    event_type,
    session_id
  ) VALUES (
    NEW.id,
    'login',
    NEW.id::TEXT
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Триггер на вход пользователя
DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;
CREATE TRIGGER on_auth_user_login
  AFTER UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
  EXECUTE FUNCTION log_user_login();

COMMENT ON TABLE security_audit_log IS 'Логи безопасности: входы, просмотры страниц, действия пользователей';
