-- Удаляем все старые политики
DROP POLICY IF EXISTS "Users can view own audit logs" ON security_audit_log;
DROP POLICY IF EXISTS "Admins can view all audit logs" ON security_audit_log;
DROP POLICY IF EXISTS "Anyone can create audit logs" ON security_audit_log;

-- Отключаем RLS временно чтобы проверить что таблица работает
ALTER TABLE security_audit_log DISABLE ROW LEVEL SECURITY;

-- Или если хочешь оставить RLS, создаем правильные политики:
-- ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

-- Политика 1: Любой может создавать логи (даже анонимные пользователи)
-- CREATE POLICY "Allow anonymous insert"
--   ON security_audit_log
--   FOR INSERT
--   TO anon, authenticated
--   WITH CHECK (true);

-- Политика 2: Админы могут читать все логи
-- CREATE POLICY "Admins can read all"
--   ON security_audit_log
--   FOR SELECT
--   TO authenticated
--   USING (
--     auth.jwt() ->> 'email' = 'muhammadali22072011@gmail.com'
--   );

-- Проверяем что RLS отключен
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'security_audit_log';
