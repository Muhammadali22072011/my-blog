# 🔒 Шпаргалка по безопасности

## Быстрые команды

### Установка и деплой
```bash
# Установка CLI
npm install -g supabase

# Логин
supabase login

# Деплой (автоматически)
./deploy-security.sh

# Деплой (вручную)
supabase functions deploy admin-auth
supabase functions deploy admin-validate
```

### Мониторинг
```bash
# Логи в реальном времени
supabase functions logs admin-auth --tail

# Список функций
supabase functions list

# Статус проекта
supabase status
```

### Тестирование
```bash
# Автоматический тест
node test-security.js

# Ручной тест
curl -X POST https://your-project.supabase.co/functions/v1/admin-auth \
  -H "Content-Type: application/json" \
  -d '{"step": 1, "clockTime": "12:00"}'
```

## SQL запросы

### Просмотр попыток входа
```sql
-- Последние 50 попыток
SELECT * FROM admin_login_attempts 
ORDER BY attempted_at DESC 
LIMIT 50;

-- Неудачные попытки за последний час
SELECT * FROM admin_login_attempts 
WHERE success = false 
  AND attempted_at > NOW() - INTERVAL '1 hour';

-- Статистика по IP
SELECT 
  ip_address,
  COUNT(*) as total,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful
FROM admin_login_attempts
GROUP BY ip_address
ORDER BY total DESC;
```

### Управление сессиями
```sql
-- Активные сессии
SELECT * FROM admin_sessions 
WHERE is_active = true 
  AND expires_at > NOW();

-- Завершить все сессии
UPDATE admin_sessions SET is_active = false;

-- Завершить конкретную сессию
UPDATE admin_sessions 
SET is_active = false 
WHERE session_token = 'your-token';

-- Удалить старые сессии
DELETE FROM admin_sessions 
WHERE expires_at < NOW();
```

### Очистка данных
```sql
-- Очистить попытки входа
DELETE FROM admin_login_attempts 
WHERE attempted_at < NOW() - INTERVAL '24 hours';

-- Очистить попытки для конкретного IP
DELETE FROM admin_login_attempts 
WHERE ip_address = '123.456.789.0';

-- Полная очистка (осторожно!)
TRUNCATE admin_login_attempts;
TRUNCATE admin_sessions;
```

### Rate limiting
```sql
-- Проверить лимит для IP
SELECT check_rate_limit('123.456.789.0', '15 minutes'::interval, 10);

-- Попытки за последние 15 минут
SELECT COUNT(*) FROM admin_login_attempts 
WHERE ip_address = '123.456.789.0' 
  AND attempted_at > NOW() - INTERVAL '15 minutes';
```

## JavaScript код

### Использование SecureAuthService
```javascript
import secureAuthService from './services/SecureAuthService'

// Проверка активной сессии
const hasAccess = secureAuthService.hasActiveSession()

// Валидация шага
const result = await secureAuthService.validateStep(1, '12:00', {
  clockTime: '12:00'
})

// Валидация сессии на сервере
const isValid = await secureAuthService.validateSession()

// Выход
await secureAuthService.logout()

// Получить токен
const token = secureAuthService.getSessionToken()
```

### Проверка в компонентах
```javascript
// В Navbar.jsx
const [hasAdminAccess, setHasAdminAccess] = useState(false)

useEffect(() => {
  const checkAccess = () => {
    setHasAdminAccess(secureAuthService.hasActiveSession())
  }
  checkAccess()
  const interval = setInterval(checkAccess, 10000)
  return () => clearInterval(interval)
}, [])

// В MediaManager.jsx
useEffect(() => {
  const checkSession = async () => {
    const isValid = await secureAuthService.validateSession()
    setHasAdminAccess(isValid)
  }
  checkSession()
}, [])
```

## Переменные окружения

### Supabase Dashboard
```
Settings → Edge Functions → Environment Variables

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Локальная разработка (.env.local)
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Troubleshooting

### Edge Function не работает
```bash
# 1. Проверить логи
supabase functions logs admin-auth

# 2. Проверить статус
supabase functions list

# 3. Передеплоить
supabase functions deploy admin-auth --no-verify-jwt

# 4. Проверить переменные окружения
supabase secrets list
```

### Rate limiting блокирует
```sql
-- Очистить попытки для вашего IP
DELETE FROM admin_login_attempts 
WHERE ip_address = 'ваш_ip';

-- Или изменить лимит в функции
-- В setup-secure-admin.sql измените:
p_max_attempts INTEGER DEFAULT 20  -- вместо 10
```

### Сессия не создается
```sql
-- 1. Проверить таблицу
SELECT * FROM admin_sessions ORDER BY created_at DESC LIMIT 5;

-- 2. Проверить функцию
SELECT create_admin_session(
  'test-token',
  'test-agent',
  'test-ip',
  1
);

-- 3. Проверить RLS
SELECT * FROM pg_policies WHERE tablename = 'admin_sessions';
```

### Токен не валидируется
```sql
-- Проверить функцию
SELECT validate_admin_session('your-token');

-- Проверить сессию
SELECT * FROM admin_sessions 
WHERE session_token = 'your-token';
```

## Безопасные практики

### ✅ Делайте
- Регулярно проверяйте логи
- Мониторьте подозрительную активность
- Обновляйте зависимости
- Используйте HTTPS
- Настройте CORS правильно
- Делайте бэкапы БД

### ❌ Не делайте
- Не храните секреты в коде
- Не используйте `*` в CORS на production
- Не отключайте RLS
- Не игнорируйте логи безопасности
- Не используйте слабые пароли
- Не давайте service_role key клиенту

## Полезные ссылки

### Документация
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/security.html)

### Инструменты
- [Supabase Dashboard](https://supabase.com/dashboard)
- [SQL Editor](https://supabase.com/dashboard/project/_/sql)
- [Edge Functions Logs](https://supabase.com/dashboard/project/_/functions)

### Ваши файлы
- `QUICK-SECURITY-SETUP.md` - Быстрый старт
- `SECURE-ADMIN-SETUP.md` - Полная инструкция
- `SECURITY-ARCHITECTURE.md` - Архитектура
- `SECURITY-FILES-OVERVIEW.md` - Обзор файлов

## Метрики безопасности

### Что отслеживать
```sql
-- Попытки входа за день
SELECT COUNT(*) FROM admin_login_attempts 
WHERE attempted_at > NOW() - INTERVAL '24 hours';

-- Успешность входа
SELECT 
  ROUND(100.0 * SUM(CASE WHEN success THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM admin_login_attempts
WHERE attempted_at > NOW() - INTERVAL '24 hours';

-- Средняя длительность сессии
SELECT AVG(expires_at - created_at) as avg_duration
FROM admin_sessions
WHERE created_at > NOW() - INTERVAL '7 days';

-- Топ IP по активности
SELECT 
  ip_address,
  COUNT(*) as requests,
  MAX(attempted_at) as last_seen
FROM admin_login_attempts
WHERE attempted_at > NOW() - INTERVAL '7 days'
GROUP BY ip_address
ORDER BY requests DESC
LIMIT 10;
```

## Экстренные действия

### При подозрении на взлом
```sql
-- 1. Завершить все сессии
UPDATE admin_sessions SET is_active = false;

-- 2. Проверить подозрительные IP
SELECT * FROM admin_login_attempts 
WHERE attempted_at > NOW() - INTERVAL '1 hour'
ORDER BY attempted_at DESC;

-- 3. Заблокировать IP (добавить в blacklist)
-- Создайте таблицу ip_blacklist и проверяйте в Edge Function

-- 4. Изменить секреты
-- Обновите значения в admin_secrets
```

### При DDoS атаке
```bash
# 1. Проверить логи
supabase functions logs admin-auth --tail

# 2. Включить более строгий rate limiting
# В setup-secure-admin.sql:
p_max_attempts INTEGER DEFAULT 3
p_time_window INTERVAL DEFAULT '30 minutes'

# 3. Добавить CAPTCHA
# Интегрируйте Google reCAPTCHA
```

## Чеклист безопасности

### Перед production
- [ ] SQL скрипт выполнен
- [ ] Edge Functions задеплоены
- [ ] Переменные окружения настроены
- [ ] CORS настроен правильно
- [ ] HTTPS включен
- [ ] RLS политики активны
- [ ] Логирование работает
- [ ] Мониторинг настроен
- [ ] Бэкапы настроены
- [ ] Документация обновлена

### Регулярное обслуживание
- [ ] Проверка логов (ежедневно)
- [ ] Очистка старых данных (еженедельно)
- [ ] Обновление зависимостей (ежемесячно)
- [ ] Аудит безопасности (ежеквартально)
- [ ] Тестирование восстановления (ежегодно)

---

**Сохраните эту шпаргалку!** Она пригодится для быстрого решения проблем.
