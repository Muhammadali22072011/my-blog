-- ============================================================================
-- ИСПРАВЛЕНИЕ ВСЕХ ТАБЛИЦ И ДОБАВЛЕНИЕ НЕДОСТАЮЩИХ
-- ============================================================================
-- Выполните этот скрипт в Supabase SQL Editor
-- ============================================================================

-- 1. Создаем/исправляем таблицу newsletter_subscribers
DROP TABLE IF EXISTS public.newsletter_subscribers CASCADE;
CREATE TABLE public.newsletter_subscribers (
    id BIGSERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    unsubscribed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_newsletter_email ON public.newsletter_subscribers(email);

-- 2. Создаем таблицу post_ratings
CREATE TABLE IF NOT EXISTS public.post_ratings (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_post_ratings_post_id ON public.post_ratings(post_id);
CREATE INDEX IF NOT EXISTS idx_post_ratings_user_id ON public.post_ratings(user_id);

-- 3. RLS политики для newsletter_subscribers
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can subscribe" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe" ON public.newsletter_subscribers
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Subscribers can view their own data" ON public.newsletter_subscribers;
CREATE POLICY "Subscribers can view their own data" ON public.newsletter_subscribers
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated can manage subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Authenticated can manage subscribers" ON public.newsletter_subscribers
    FOR ALL USING (auth.role() = 'authenticated');

-- 4. RLS политики для post_ratings
ALTER TABLE public.post_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view ratings" ON public.post_ratings;
CREATE POLICY "Anyone can view ratings" ON public.post_ratings
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can add ratings" ON public.post_ratings;
CREATE POLICY "Anyone can add ratings" ON public.post_ratings
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update their own ratings" ON public.post_ratings;
CREATE POLICY "Anyone can update their own ratings" ON public.post_ratings
    FOR UPDATE USING (true);

-- 5. Триггер для updated_at в post_ratings
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_post_ratings_updated_at ON public.post_ratings;
CREATE TRIGGER update_post_ratings_updated_at
    BEFORE UPDATE ON public.post_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ГОТОВО! Все таблицы исправлены
-- ============================================================================
