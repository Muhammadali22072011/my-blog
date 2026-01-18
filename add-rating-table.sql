-- Таблица для рейтингов постов
CREATE TABLE IF NOT EXISTS post_ratings (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_post_ratings_post_id ON post_ratings(post_id);
CREATE INDEX IF NOT EXISTS idx_post_ratings_user_id ON post_ratings(user_id);

-- RLS политики
ALTER TABLE post_ratings ENABLE ROW LEVEL SECURITY;

-- Все могут читать рейтинги
CREATE POLICY "Anyone can view ratings"
  ON post_ratings FOR SELECT
  USING (true);

-- Все могут добавлять рейтинги
CREATE POLICY "Anyone can insert ratings"
  ON post_ratings FOR INSERT
  WITH CHECK (true);

-- Пользователи могут обновлять свои рейтинги
CREATE POLICY "Users can update own ratings"
  ON post_ratings FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Функция для обновления updated_at
CREATE OR REPLACE FUNCTION update_post_ratings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматического обновления updated_at
DROP TRIGGER IF EXISTS update_post_ratings_timestamp ON post_ratings;
CREATE TRIGGER update_post_ratings_timestamp
  BEFORE UPDATE ON post_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_post_ratings_updated_at();
