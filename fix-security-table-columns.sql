-- Добавляем недостающие колонки в таблицу security_audit_log
ALTER TABLE security_audit_log 
ADD COLUMN IF NOT EXISTS page_title TEXT,
ADD COLUMN IF NOT EXISTS session_id TEXT;

-- Создаем индекс для session_id
CREATE INDEX IF NOT EXISTS idx_security_audit_session_id ON security_audit_log(session_id);

-- Проверяем структуру таблицы
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'security_audit_log'
ORDER BY ordinal_position;
