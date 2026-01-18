-- Проверка подписчиков на рассылку
SELECT 
  id,
  email,
  subscribed_at
FROM newsletter_subscribers
ORDER BY subscribed_at DESC
LIMIT 10;

-- Если таблица не существует, создайте её:
-- CREATE TABLE IF NOT EXISTS newsletter_subscribers (
--   id BIGSERIAL PRIMARY KEY,
--   email TEXT UNIQUE NOT NULL,
--   subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );
