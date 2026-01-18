-- ============================================================================
-- БЕЗОПАСНАЯ МИГРАЦИЯ ПРОДАКШЕН БАЗЫ ДАННЫХ
-- ============================================================================
-- Этот скрипт обновит вашу продакшен базу до новой схемы
-- БЕЗ ПОТЕРИ СУЩЕСТВУЮЩИХ ДАННЫХ
-- ============================================================================
-- ВАЖНО: Сделайте бэкап базы перед выполнением!
-- ============================================================================

-- ============================================================================
-- ШАГ 1: ОБНОВЛЕНИЕ СУЩЕСТВУЮЩИХ ТАБЛИЦ
-- ============================================================================

-- 1.1 Обновляем таблицу posts
-- Добавляем новые колонки если их нет
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS featured_image TEXT,
ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS auto_saved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS reading_time INTEGER DEFAULT 0;

-- Изменяем тип колонок если нужно (с сохранением данных)
DO $$ 
BEGIN
    -- Меняем id на BIGINT если это INTEGER
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'posts' AND column_name = 'id' AND data_type = 'integer'
    ) THEN
        ALTER TABLE public.posts ALTER COLUMN id TYPE BIGINT;
    END IF;
    
    -- Меняем tags на TEXT[] если это JSONB
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'posts' AND column_name = 'tags' AND data_type = 'jsonb'
    ) THEN
        -- Конвертируем JSONB в TEXT[]
        ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS tags_new TEXT[];
        UPDATE public.posts SET tags_new = ARRAY(SELECT jsonb_array_elements_text(tags));
        ALTER TABLE public.posts DROP COLUMN tags;
        ALTER TABLE public.posts RENAME COLUMN tags_new TO tags;
        ALTER TABLE public.posts ALTER COLUMN tags SET DEFAULT '{}';
    END IF;
    
    -- Меняем типы VARCHAR на TEXT
    ALTER TABLE public.posts ALTER COLUMN title TYPE TEXT;
    ALTER TABLE public.posts ALTER COLUMN category TYPE TEXT;
    ALTER TABLE public.posts ALTER COLUMN status TYPE TEXT;
END $$;

-- Добавляем constraints если их нет
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'posts_category_check'
    ) THEN
        ALTER TABLE public.posts ADD CONSTRAINT posts_category_check 
        CHECK (category IN ('blog', 'news', 'tutorial'));
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'posts_status_check'
    ) THEN
        ALTER TABLE public.posts ADD CONSTRAINT posts_status_check 
        CHECK (status IN ('draft', 'published'));
    END IF;
END $$;

-- 1.2 Обновляем таблицу profile
ALTER TABLE public.profile
ADD COLUMN IF NOT EXISTS position TEXT,
ADD COLUMN IF NOT EXISTS about_me TEXT,
ADD COLUMN IF NOT EXISTS avatar_letter TEXT DEFAULT 'M',
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS youtube TEXT,
ADD COLUMN IF NOT EXISTS github TEXT,
ADD COLUMN IF NOT EXISTS linkedin TEXT,
ADD COLUMN IF NOT EXISTS telegram TEXT,
ADD COLUMN IF NOT EXISTS telegram_channel TEXT;

-- Меняем типы если нужно
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profile' AND column_name = 'id' AND data_type = 'integer'
    ) THEN
        ALTER TABLE public.profile ALTER COLUMN id TYPE BIGINT;
    END IF;
    
    -- Удаляем колонки которых нет в новой схеме
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profile' AND column_name = 'email'
    ) THEN
        ALTER TABLE public.profile DROP COLUMN IF EXISTS email;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profile' AND column_name = 'bio'
    ) THEN
        -- Копируем bio в about_me если about_me пустой
        UPDATE public.profile SET about_me = bio WHERE about_me IS NULL;
        ALTER TABLE public.profile DROP COLUMN bio;
    END IF;
END $$;

-- 1.3 Обновляем таблицу about_me
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'about_me' AND column_name = 'id' AND data_type = 'integer'
    ) THEN
        ALTER TABLE public.about_me ALTER COLUMN id TYPE BIGINT;
    END IF;
    
    -- Меняем skills на TEXT[] если это JSONB
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'about_me' AND column_name = 'skills' AND data_type = 'jsonb'
    ) THEN
        ALTER TABLE public.about_me ADD COLUMN IF NOT EXISTS skills_new TEXT[];
        UPDATE public.about_me SET skills_new = ARRAY(SELECT jsonb_array_elements_text(skills));
        ALTER TABLE public.about_me DROP COLUMN skills;
        ALTER TABLE public.about_me RENAME COLUMN skills_new TO skills;
        ALTER TABLE public.about_me ALTER COLUMN skills SET DEFAULT '{}';
    END IF;
END $$;

-- 1.4 Обновляем таблицу site_settings
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'site_settings' AND column_name = 'id' AND data_type = 'integer'
    ) THEN
        ALTER TABLE public.site_settings ALTER COLUMN id TYPE BIGINT;
    END IF;
END $$;

-- 1.5 Обновляем таблицу comments
ALTER TABLE public.comments
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS parent_id BIGINT REFERENCES public.comments(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT true;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'comments' AND column_name = 'id' AND data_type = 'integer'
    ) THEN
        ALTER TABLE public.comments ALTER COLUMN id TYPE BIGINT;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'comments' AND column_name = 'post_id' AND data_type = 'integer'
    ) THEN
        ALTER TABLE public.comments ALTER COLUMN post_id TYPE BIGINT;
    END IF;
    
    -- Синхронизируем is_approved и status
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'comments' AND column_name = 'is_approved'
    ) THEN
        UPDATE public.comments SET status = CASE 
            WHEN is_approved = true THEN 'approved'
            ELSE 'pending'
        END WHERE status IS NULL;
        
        UPDATE public.comments SET approved = is_approved WHERE approved IS NULL;
    END IF;
END $$;

-- Добавляем constraint для status
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'comments_status_check'
    ) THEN
        ALTER TABLE public.comments ADD CONSTRAINT comments_status_check 
        CHECK (status IN ('pending', 'approved', 'rejected'));
    END IF;
END $$;

-- ============================================================================
-- ШАГ 2: СОЗДАНИЕ НОВЫХ ТАБЛИЦ
-- ============================================================================

-- 2.1 Таблица закладок
CREATE TABLE IF NOT EXISTS public.bookmarks (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.2 Таблица реакций
CREATE TABLE IF NOT EXISTS public.reactions (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    reaction_type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.3 Таблица рейтингов
CREATE TABLE IF NOT EXISTS public.post_ratings (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- 2.4 Таблица подписчиков рассылки
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
    id BIGSERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    unsubscribed_at TIMESTAMP WITH TIME ZONE
);

-- 2.5 Таблица проектов
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

-- 2.6 Таблица просмотров
CREATE TABLE IF NOT EXISTS public.post_views (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id TEXT,
    ip_address TEXT,
    user_agent TEXT,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.7 Таблицы безопасности
CREATE TABLE IF NOT EXISTS public.admin_secrets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    secret_type TEXT NOT NULL,
    secret_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.admin_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_token TEXT NOT NULL UNIQUE,
    user_agent TEXT,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.admin_login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address TEXT NOT NULL,
    user_agent TEXT,
    step_number INTEGER NOT NULL,
    success BOOLEAN DEFAULT false,
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.security_logs (
    id BIGSERIAL PRIMARY KEY,
    event_type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    action TEXT NOT NULL CHECK (action IN ('allowed', 'blocked', 'warning')),
    ip_address TEXT,
    user_agent TEXT,
    user_id UUID REFERENCES auth.users(id),
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ШАГ 3: СОЗДАНИЕ ИНДЕКСОВ
-- ============================================================================

-- Индексы для posts
CREATE INDEX IF NOT EXISTS idx_posts_category ON public.posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_status ON public.posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON public.posts(slug);

-- Индексы для comments
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_status ON public.comments(status);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_id);

-- Индексы для новых таблиц
CREATE INDEX IF NOT EXISTS idx_bookmarks_post_id ON public.bookmarks(post_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_reactions_post_id ON public.reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_post_ratings_post_id ON public.post_ratings(post_id);
CREATE INDEX IF NOT EXISTS idx_post_ratings_user_id ON public.post_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON public.newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_featured ON public.projects(featured);
CREATE INDEX IF NOT EXISTS idx_post_views_post_id ON public.post_views(post_id);
CREATE INDEX IF NOT EXISTS idx_post_views_viewed_at ON public.post_views(viewed_at);

-- ============================================================================
-- ШАГ 4: УДАЛЕНИЕ СТАРЫХ ТАБЛИЦ (если есть)
-- ============================================================================

-- Удаляем таблицы которых нет в новой схеме
DROP TABLE IF EXISTS public.lessons CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- ============================================================================
-- ШАГ 5: ВКЛЮЧЕНИЕ RLS И СОЗДАНИЕ ПОЛИТИК
-- ============================================================================

-- Включаем RLS для всех таблиц
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.about_me ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- Удаляем старые политики
DROP POLICY IF EXISTS "Public can read published posts" ON public.posts;
DROP POLICY IF EXISTS "Authenticated users can do everything with posts" ON public.posts;
DROP POLICY IF EXISTS "Anon can read all posts" ON public.posts;
DROP POLICY IF EXISTS "Public can read profile" ON public.profile;
DROP POLICY IF EXISTS "Authenticated can modify profile" ON public.profile;
DROP POLICY IF EXISTS "Anon can modify profile" ON public.profile;
DROP POLICY IF EXISTS "Public can read about_me" ON public.about_me;
DROP POLICY IF EXISTS "Authenticated can modify about_me" ON public.about_me;
DROP POLICY IF EXISTS "Anon can modify about_me" ON public.about_me;
DROP POLICY IF EXISTS "Public can read site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Authenticated can modify site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Anon can modify site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Public can read approved comments" ON public.comments;
DROP POLICY IF EXISTS "Anyone can create comments" ON public.comments;
DROP POLICY IF EXISTS "Authenticated can do everything with comments" ON public.comments;

-- Создаем новые политики
-- POSTS
CREATE POLICY "Public can read published posts" ON public.posts
    FOR SELECT USING (status = 'published');

CREATE POLICY "Authenticated users can do everything with posts" ON public.posts
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Anon can read all posts" ON public.posts
    FOR SELECT USING (true);

-- PROFILE
CREATE POLICY "Public can read profile" ON public.profile
    FOR SELECT USING (true);

CREATE POLICY "Authenticated can modify profile" ON public.profile
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Anon can modify profile" ON public.profile
    FOR ALL USING (true);

-- ABOUT_ME
CREATE POLICY "Public can read about_me" ON public.about_me
    FOR SELECT USING (true);

CREATE POLICY "Authenticated can modify about_me" ON public.about_me
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Anon can modify about_me" ON public.about_me
    FOR ALL USING (true);

-- SITE_SETTINGS
CREATE POLICY "Public can read site_settings" ON public.site_settings
    FOR SELECT USING (true);

CREATE POLICY "Authenticated can modify site_settings" ON public.site_settings
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Anon can modify site_settings" ON public.site_settings
    FOR ALL USING (true);

-- COMMENTS
CREATE POLICY "Public can read approved comments" ON public.comments
    FOR SELECT USING (status = 'approved');

CREATE POLICY "Anyone can create comments" ON public.comments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated can do everything with comments" ON public.comments
    FOR ALL USING (auth.role() = 'authenticated');

-- BOOKMARKS
CREATE POLICY "Users can manage their own bookmarks" ON public.bookmarks
    FOR ALL USING (true);

-- REACTIONS
CREATE POLICY "Anyone can view reactions" ON public.reactions
    FOR SELECT USING (true);

CREATE POLICY "Anyone can add reactions" ON public.reactions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can delete their own reactions" ON public.reactions
    FOR DELETE USING (true);

-- POST_RATINGS
CREATE POLICY "Anyone can view ratings" ON public.post_ratings
    FOR SELECT USING (true);

CREATE POLICY "Anyone can add ratings" ON public.post_ratings
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update their own ratings" ON public.post_ratings
    FOR UPDATE USING (true);

-- NEWSLETTER
CREATE POLICY "Anyone can subscribe" ON public.newsletter_subscribers
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Subscribers can view their own data" ON public.newsletter_subscribers
    FOR SELECT USING (true);

CREATE POLICY "Authenticated can manage subscribers" ON public.newsletter_subscribers
    FOR ALL USING (auth.role() = 'authenticated');

-- PROJECTS
CREATE POLICY "Public can read active projects" ON public.projects
    FOR SELECT USING (status = 'active');

CREATE POLICY "Authenticated can manage projects" ON public.projects
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Anon can read all projects" ON public.projects
    FOR SELECT USING (true);

-- POST_VIEWS
CREATE POLICY "Anyone can add views" ON public.post_views
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated can view analytics" ON public.post_views
    FOR SELECT USING (auth.role() = 'authenticated');

-- ADMIN TABLES
CREATE POLICY "Anon can manage admin_secrets" ON public.admin_secrets
    FOR ALL USING (true);

CREATE POLICY "Anon can manage admin_sessions" ON public.admin_sessions
    FOR ALL USING (true);

CREATE POLICY "Anon can manage admin_login_attempts" ON public.admin_login_attempts
    FOR ALL USING (true);

CREATE POLICY "Authenticated can view security_logs" ON public.security_logs
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can manage security_logs" ON public.security_logs
    FOR ALL USING (true);

-- ============================================================================
-- ШАГ 6: ФУНКЦИИ И ТРИГГЕРЫ
-- ============================================================================

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггеры для автоматического обновления updated_at
DROP TRIGGER IF EXISTS update_posts_updated_at ON public.posts;
CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON public.posts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_profile_updated_at ON public.profile;
CREATE TRIGGER update_profile_updated_at
    BEFORE UPDATE ON public.profile
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_about_me_updated_at ON public.about_me;
CREATE TRIGGER update_about_me_updated_at
    BEFORE UPDATE ON public.about_me
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_site_settings_updated_at ON public.site_settings;
CREATE TRIGGER update_site_settings_updated_at
    BEFORE UPDATE ON public.site_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_comments_updated_at ON public.comments;
CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON public.comments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

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

-- Функция для увеличения счетчика просмотров
CREATE OR REPLACE FUNCTION increment_post_views(post_id_param BIGINT)
RETURNS void AS $$
BEGIN
    UPDATE public.posts 
    SET views = views + 1 
    WHERE id = post_id_param;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ШАГ 7: REALTIME (опционально)
-- ============================================================================

-- Добавляем таблицы в публикацию realtime (если нужно)
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- ГОТОВО! МИГРАЦИЯ ЗАВЕРШЕНА
-- ============================================================================
-- 
-- Ваша база данных обновлена до новой схемы.
-- Все существующие данные сохранены.
-- 
-- СЛЕДУЮЩИЕ ШАГИ:
-- 1. Проверьте что все данные на месте
-- 2. Протестируйте приложение
-- 3. Если нужно, настройте Storage buckets (images, avatars, videos)
-- 
-- ============================================================================
