-- Удаляем старую таблицу если существует
DROP TABLE IF EXISTS security_audit_log CASCADE;

-- Создаем таблицу заново
CREATE TABLE security_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL, -- 'login', 'logout', 'page_view', 'admin_access'
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address TEXT,
  user_agent TEXT,
  browser TEXT,
  os TEXT,
  device TEXT,
  country TEXT,
  city TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  page_url TEXT,
  referrer TEXT,
  session_duration INTEGER, -- в секундах
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы для быстрого поиска
CREATE INDEX idx_security_audit_event_type ON security_audit_log(event_type);
CREATE INDEX idx_security_audit_user_id ON security_audit_log(user_id);
CREATE INDEX idx_security_audit_ip ON security_audit_log(ip_address);
CREATE INDEX idx_security_audit_created_at ON security_audit_log(created_at DESC);

-- RLS политики
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

-- Админы могут видеть все логи
CREATE POLICY "Admins can view all audit logs"
  ON security_audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'muhammadali22072011@gmail.com'
    )
  );

-- Любой может создавать логи (для анонимных посетителей)
CREATE POLICY "Anyone can create audit logs"
  ON security_audit_log
  FOR INSERT
  WITH CHECK (true);

-- Комментарий к таблице
COMMENT ON TABLE security_audit_log IS 'Логи безопасности: входы, просмотры страниц, действия пользователей';
