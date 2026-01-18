# Настройка безопасной админ-панели

## Шаг 1: Установка Supabase CLI

```bash
# Установка через npm
npm install -g supabase

# Или через Homebrew (macOS)
brew install supabase/tap/supabase

# Проверка установки
supabase --version
```

## Шаг 2: Инициализация Supabase в проекте

```bash
# Перейдите в папку проекта
cd my-blog-main

# Инициализация (если еще не сделано)
supabase init

# Логин в Supabase
supabase login
```

## Шаг 3: Создание таблиц и функций

```bash
# Выполните SQL скрипт в Supabase Dashboard
# Или через CLI:
supabase db push
```

Или вручную в Supabase Dashboard:
1. Откройте https://supabase.com/dashboard
2. Выберите ваш проект
3. Перейдите в SQL Editor
4. Скопируйте содержимое `setup-secure-admin.sql`
5. Выполните скрипт

## Шаг 4: Деплой Edge Functions

```bash
# Деплой функции авторизации
supabase functions deploy admin-auth

# Деплой функции валидации
supabase functions deploy admin-validate

# Проверка статуса
supabase functions list
```

## Шаг 5: Настройка переменных окружения

В Supabase Dashboard -> Settings -> Edge Functions -> Environment Variables:

```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Шаг 6: Обновление клиентского кода

### 6.1 Установка зависимостей

```bash
npm install dompurify
```

### 6.2 Обновите ProtectedAdmin.jsx

Замените использование `MultiStepAuth` на новый `SecureMultiStepAuth` (будет создан далее).

### 6.3 Обновите Navbar.jsx

Замените проверку `localStorage.getItem('multi_auth_token')` на:

```javascript
import secureAuthService from '../services/SecureAuthService'

// В useEffect:
const hasAccess = secureAuthService.hasActiveSession()
```

## Шаг 7: Тестирование

### Локальное тестирование Edge Functions

```bash
# Запуск локального Supabase
supabase start

# Запуск Edge Functions локально
supabase functions serve admin-auth --env-file .env.local

# Тестирование
curl -X POST http://localhost:54321/functions/v1/admin-auth \
  -H "Content-Type: application/json" \
  -d '{"step": 1, "clockTime": "12:00"}'
```

### Тестирование в production

1. Пройдите все 5 шагов авторизации
2. Проверьте, что токен сохранился
3. Обновите страницу - доступ должен сохраниться
4. Проверьте rate limiting (10 попыток за 15 минут)

## Шаг 8: Мониторинг и логи

### Просмотр логов Edge Functions

```bash
supabase functions logs admin-auth
```

### Просмотр попыток входа

```sql
-- В SQL Editor
SELECT * FROM admin_login_attempts 
ORDER BY attempted_at DESC 
LIMIT 100;
```

### Просмотр активных сессий

```sql
SELECT * FROM admin_sessions 
WHERE is_active = true 
  AND expires_at > NOW();
```

## Шаг 9: Настройка автоматической очистки

В Supabase Dashboard -> Database -> Cron Jobs:

```sql
-- Очистка каждый час
SELECT cron.schedule(
  'cleanup-expired-sessions',
  '0 * * * *',
  'SELECT cleanup_expired_sessions()'
);
```

## Шаг 10: Дополнительная безопасность

### 10.1 Настройка CORS

В Supabase Dashboard -> Settings -> API:
- Добавьте только ваш домен в CORS origins
- Не используйте `*` в production

### 10.2 Настройка Rate Limiting

В `setup-secure-admin.sql` измените параметры:

```sql
-- Более строгие ограничения
p_max_attempts INTEGER DEFAULT 5  -- вместо 10
p_time_window INTERVAL DEFAULT '30 minutes'  -- вместо 15
```

### 10.3 Добавление CAPTCHA

Установите:
```bash
npm install react-google-recaptcha
```

Добавьте CAPTCHA после 3 неудачных попыток.

### 10.4 Двухфакторная аутентификация (опционально)

Можно добавить отправку кода на email через Resend API.

## Безопасность: До и После

### До (4/10):
- ❌ Секреты в клиентском коде
- ❌ Только клиентская проверка
- ❌ Легко обойти через DevTools
- ✅ Многоступенчатая авторизация

### После (8/10):
- ✅ Секреты только на сервере
- ✅ Серверная валидация через Edge Functions
- ✅ JWT-подобные токены с истечением
- ✅ Rate limiting на сервере
- ✅ Логирование всех попыток
- ✅ RLS политики для защиты данных
- ✅ Автоматическая очистка старых сессий

## Что еще можно улучшить (для 10/10):

1. **CAPTCHA** после нескольких неудачных попыток
2. **2FA** через email или SMS
3. **IP whitelist** для админов
4. **Webhook уведомления** о подозрительной активности
5. **Биометрическая аутентификация** (WebAuthn)
6. **Аудит логи** с детальной информацией
7. **Автоматическая блокировка** подозрительных IP

## Troubleshooting

### Edge Function не работает

```bash
# Проверьте логи
supabase functions logs admin-auth --tail

# Проверьте переменные окружения
supabase secrets list
```

### Rate limiting не работает

```sql
-- Проверьте функцию
SELECT check_rate_limit('test_ip', '15 minutes'::interval, 10);
```

### Сессия не сохраняется

1. Проверьте localStorage в DevTools
2. Проверьте CORS настройки
3. Проверьте, что Edge Function возвращает sessionToken

## Полезные команды

```bash
# Просмотр всех функций
supabase functions list

# Удаление функции
supabase functions delete admin-auth

# Обновление функции
supabase functions deploy admin-auth --no-verify-jwt

# Просмотр логов в реальном времени
supabase functions logs admin-auth --tail
```

## Контакты и поддержка

Если возникли проблемы:
1. Проверьте логи Edge Functions
2. Проверьте таблицу admin_login_attempts
3. Проверьте RLS политики
4. Откройте issue в репозитории
