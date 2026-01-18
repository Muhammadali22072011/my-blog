# 🛡️ Настройка системы безопасности

## Шаг 1: Создать таблицу в Supabase

1. Зайди в Supabase Dashboard: https://supabase.com/dashboard
2. Выбери свой проект
3. Слева выбери **SQL Editor**
4. Нажми **New Query**
5. Скопируй и вставь этот SQL код:

```sql
-- Таблица для логирования входов и активности пользователей
CREATE TABLE IF NOT EXISTS security_audit_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID,
  user_email TEXT,
  event_type TEXT NOT NULL,
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
```

6. Нажми **Run** (или Ctrl+Enter)
7. Должно появиться сообщение "Success. No rows returned"

## Шаг 2: Проверить что таблица создана

Зайди в **Table Editor** → найди таблицу `security_audit_log`

## Шаг 3: Протестировать

1. Открой свой сайт в браузере
2. Походи по разным страницам (главная, блог, посты)
3. Зайди в админку → вкладка "🛡️ Безопасность"
4. Увидишь логи всех просмотров!

## Что будет логироваться:

✅ **Каждый просмотр страницы** - автоматически при переходе на любую страницу
✅ **IP адрес** - откуда зашел пользователь
✅ **Геолокация** - страна, город, координаты
✅ **Браузер и ОС** - Chrome/Firefox/Safari, Windows/Mac/Linux
✅ **Устройство** - Desktop/Mobile/Tablet
✅ **URL страницы** - какую страницу смотрел
✅ **Заголовок страницы** - название страницы
✅ **Referrer** - откуда пришел (Google, прямая ссылка и т.д.)
✅ **Session ID** - уникальный ID сессии пользователя
✅ **Время** - точное время просмотра

## Типы событий:

- `page_view` - просмотр страницы
- `login` - вход в систему
- `logout` - выход из системы
- `admin_access` - доступ к админ панели

## Фильтры в админке:

- 🔍 Поиск по IP адресу
- 📊 Фильтр по типу события
- 📅 Сортировка по дате
- 📈 Статистика: входы, просмотры, уникальные IP

Готово! Теперь все действия пользователей логируются автоматически! 🎉
