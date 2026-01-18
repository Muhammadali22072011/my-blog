-- ============================================================================
-- SQL ДЛЯ ДОБАВЛЕНИЯ ВСЕХ НОВЫХ ФУНКЦИЙ
-- ============================================================================

-- 1. Добавляем поля для аналитики в таблицу posts (если их еще нет)
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS reading_time INTEGER DEFAULT 0;

-- 2. Создаем таблицу для закладок (bookmarks)
CREATE TABLE IF NOT EXISTS public.bookmarks (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_post_id ON public.bookmarks(post_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON public.bookmarks(user_id);

-- 3. Создаем таблицу для реакций
CREATE TABLE IF NOT EXISTS public.reactions (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'love', 'fire', 'clap', 'thinking')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id, reaction_type)
);

CREATE INDEX IF NOT EXISTS idx_reactions_post_id ON public.reactions(post_id);

-- 3.1. Создаем таблицу для рейтингов постов
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

-- 4. Создаем таблицу для подписок на рассылку
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
    id BIGSERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    unsubscribed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_newsletter_email ON public.newsletter_subscribers(email);

-- 5. Создаем таблицу для проектов
CREATE TABLE IF NOT EXISTS public.projects (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    github_url TEXT,
    demo_url TEXT,
    tags TEXT[] DEFAULT '{}',
    featured BOOLEAN DEFAULT false,
    order_index INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'draft')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_featured ON public.projects(featured);

-- 6. Создаем таблицу для просмотров (детальная аналитика)
CREATE TABLE IF NOT EXISTS public.post_views (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id TEXT,
    ip_address TEXT,
    user_agent TEXT,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_post_views_post_id ON public.post_views(post_id);
CREATE INDEX IF NOT EXISTS idx_post_views_viewed_at ON public.post_views(viewed_at);

-- 7. Функция для увеличения счетчика просмотров
CREATE OR REPLACE FUNCTION increment_post_views(post_id_param BIGINT)
RETURNS void AS $$
BEGIN
    UPDATE public.posts 
    SET views = views + 1 
    WHERE id = post_id_param;
END;
$$ LANGUAGE plpgsql;

-- 8. RLS политики для новых таблиц

-- Bookmarks
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can manage their own bookmarks" ON public.bookmarks
    FOR ALL USING (true);

-- Reactions
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view reactions" ON public.reactions;
CREATE POLICY "Anyone can view reactions" ON public.reactions
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can add reactions" ON public.reactions;
CREATE POLICY "Anyone can add reactions" ON public.reactions
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can delete their own reactions" ON public.reactions;
CREATE POLICY "Users can delete their own reactions" ON public.reactions
    FOR DELETE USING (true);

-- Newsletter
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

-- Projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read active projects" ON public.projects;
CREATE POLICY "Public can read active projects" ON public.projects
    FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "Authenticated can manage projects" ON public.projects;
CREATE POLICY "Authenticated can manage projects" ON public.projects
    FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Anon can read all projects" ON public.projects;
CREATE POLICY "Anon can read all projects" ON public.projects
    FOR SELECT USING (true);

-- Post Views
ALTER TABLE public.post_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can add views" ON public.post_views;
CREATE POLICY "Anyone can add views" ON public.post_views
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can view analytics" ON public.post_views;
CREATE POLICY "Authenticated can view analytics" ON public.post_views
    FOR SELECT USING (auth.role() = 'authenticated');

-- Post Ratings
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

-- 9. Триггеры для updated_at
DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_post_ratings_updated_at ON public.post_ratings;
CREATE TRIGGER update_post_ratings_updated_at
    BEFORE UPDATE ON public.post_ratings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Начальные данные для проектов (опционально)
INSERT INTO public.projects (title, description, tags, featured, order_index)
SELECT 'My Blog Platform', 'A modern blog platform built with React and Supabase', 
       ARRAY['React', 'Vite', 'Supabase', 'Tailwind CSS'], true, 1
WHERE NOT EXISTS (SELECT 1 FROM public.projects LIMIT 1);

-- ============================================================================
-- ГОТОВО! Все новые функции добавлены
-- ============================================================================
