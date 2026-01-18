# 🚀 Настройка безопасности - СЕЙЧАС!

## Ошибка которую вы видите:

```
Could not find the table 'public.security_logs' in the schema cache
```

**Причина:** Таблица `security_logs` не создана в базе данных.

## Решение (2 минуты):

### Шаг 1: Откройте Supabase SQL Editor

1. Откройте [Supabase Dashboard](https://supabase.com/dashboard)
2. Выберите ваш проект
3. Нажмите на "SQL Editor" в левом меню

### Шаг 2: Скопируйте и выполните SQL

Откройте файл `create-security-logs.sql` и скопируйте весь его содержимый.

Или скопируйте отсюда:

\`\`\`sql
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

-- Создаем несколько тестовых записей
INSERT INTO security_logs (event_type, severity, action, ip_address, user_agent, details) VALUES
  ('login_attempt', 'low', 'allowed', '192.168.1.1', 'Mozilla/5.0', '{"success": true}'::jsonb),
  ('failed_login', 'medium', 'warning', '192.168.1.2', 'Mozilla/5.0', '{"attempts": 3}'::jsonb),
  ('suspicious_activity', 'high', 'blocked', '192.168.1.3', 'curl/7.0', '{"reason": "bot_detected"}'::jsonb),
  ('brute_force_attempt', 'critical', 'blocked', '192.168.1.4', 'Python-requests', '{"attempts": 10}'::jsonb);
\`\`\`

### Шаг 3: Нажмите "Run"

Нажмите кнопку "Run" или Ctrl+Enter для выполнения скрипта.

### Шаг 4: Проверьте результат

Вы должны увидеть сообщение об успешном выполнении и результат:

```
total_logs | unique_ips | blocked_count | critical_count
-----------+------------+---------------+---------------
    4      |     4      |       2       |       1
```

### Шаг 5: Обновите страницу

Вернитесь в админ-панель и обновите страницу (F5 или Ctrl+R).

## Готово! ✅

Теперь:
- ✅ Таблица `security_logs` создана
- ✅ Индексы настроены
- ✅ RLS политики активированы
- ✅ Тестовые данные добавлены
- ✅ Security Dashboard работает!

## Что вы увидите?

В табе "🛡️ Безопасность" появится:
- **Статистика:** 4 события, 4 уникальных IP, 2 заблокированных, 1 критическое
- **Логи:** 4 тестовых записи
- **Настройки:** Переключатели защиты

## Если не работает?

1. **Проверьте что вы админ:**
   ```sql
   SELECT role FROM profiles WHERE id = auth.uid();
   ```
   Должно вернуть `admin`

2. **Проверьте что таблица создана:**
   ```sql
   SELECT * FROM security_logs LIMIT 5;
   ```

3. **Очистите кэш браузера:** Ctrl+Shift+R

4. **Перезапустите dev сервер**

## Дополнительно

После настройки вы можете:
- Удалить тестовые данные
- Настроить уведомления
- Интегрировать логирование в другие части приложения

**Всё готово к использованию! 🎉**
