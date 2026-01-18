-- Таблица для логирования входов и активности пользователей
CREATE TABLE IF NOT EXISTS security_audit_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID, -- Убрали foreign key для гибкости
  user_email TEXT,
  event_type TEXT NOT NULL, -- 'login', 'logout', 'page_view', 'admin_access', 'post_create', 'post_edit'
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
CREATE INDEX IF NOT EXISTS idx_security_audit_session ON security_audit_log(session_id);

-- RLS политики
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

-- Пользователи могут читать свои логи
CREATE POLICY "Users can view own audit logs"
  ON security_audit_log
  FOR SELECT
  USING (auth.uid() = user_id);

-- Все могут создавать логи (для трекинга)
CREATE POLICY "Anyone can create audit logs"
  ON security_audit_log
  FOR INSERT
  WITH CHECK (true);

COMMENT ON TABLE security_audit_log IS 'Логи безопасности: входы, просмотры страниц, действия пользователей';
