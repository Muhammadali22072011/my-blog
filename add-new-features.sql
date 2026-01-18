-- =====================================================
-- SQL для добавления новых фич в блог
-- Выполните этот скрипт в Supabase SQL Editor
-- =====================================================

-- 1. Добавляем колонку views в posts (если не существует)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;

-- 2. Таблица для реакций на посты
CREATE TABLE IF NOT EXISTS reactions (
  id SERIAL PRIMARY KEY,
  post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  reaction_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Индекс для быстрого поиска реакций
CREATE INDEX IF NOT EXISTS idx_reactions_post_id ON reactions(post_id);

-- 3. Таблица для комментариев
CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
  parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  content TEXT NOT NULL,
  approved BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для комментариев
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);

-- 4. Таблица для подписчиков newsletter
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);

-- Индекс для email
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);

-- 5. Добавляем колонку tags в posts (если не существует)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- 6. Добавляем колонку scheduled_at для планирования публикаций
ALTER TABLE posts ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP WITH TIME ZONE;

-- 7. Добавляем колонку для автосохранения черновиков
ALTER TABLE posts ADD COLUMN IF NOT EXISTS auto_saved_at TIMESTAMP WITH TIME ZONE;

-- =====================================================
-- RLS (Row Level Security) политики
-- =====================================================

-- Включаем RLS для новых таблиц
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Политики для reactions (все могут читать и добавлять)
DROP POLICY IF EXISTS "Anyone can read reactions" ON reactions;
CREATE POLICY "Anyone can read reactions" ON reactions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert reactions" ON reactions;
CREATE POLICY "Anyone can insert reactions" ON reactions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can delete own reactions" ON reactions;
CREATE POLICY "Anyone can delete own reactions" ON reactions FOR DELETE USING (true);

-- Политики для comments
DROP POLICY IF EXISTS "Anyone can read approved comments" ON comments;
CREATE POLICY "Anyone can read approved comments" ON comments FOR SELECT USING (approved = true);

DROP POLICY IF EXISTS "Anyone can insert comments" ON comments;
CREATE POLICY "Anyone can insert comments" ON comments FOR INSERT WITH CHECK (true);

-- Политики для newsletter_subscribers
DROP POLICY IF EXISTS "Anyone can subscribe" ON newsletter_subscribers;
CREATE POLICY "Anyone can subscribe" ON newsletter_subscribers FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can check subscription" ON newsletter_subscribers;
CREATE POLICY "Anyone can check subscription" ON newsletter_subscribers FOR SELECT USING (true);

-- =====================================================
-- Realtime подписки
-- =====================================================

-- Включаем realtime для комментариев (если еще не включено)
DO $$
BEGIN
  -- Проверяем, есть ли уже таблица в публикации
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'comments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE comments;
  END IF;
END $$;

-- =====================================================
-- Готово! Все таблицы и политики созданы
-- =====================================================
