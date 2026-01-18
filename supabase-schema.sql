-- ============================================================================
-- ПОЛНЫЙ SQL СКРИПТ ДЛЯ СОЗДАНИЯ БАЗЫ ДАННЫХ БЛОГА В SUPABASE
-- ============================================================================
-- Выполните этот скрипт в Supabase SQL Editor (Database -> SQL Editor)
-- ============================================================================

-- ============================================================================
-- 1. ТАБЛИЦА POSTS (Посты блога)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.posts (
    id BIGSERIAL PRIMARY KEY,
    title TEXT,
    content TEXT,
    excerpt TEXT,
    slug TEXT UNIQUE,
    category TEXT DEFAULT 'blog' CHECK (category IN ('blog', 'news', 'tutorial')),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    tags TEXT[] DEFAULT '{}',
    featured_image TEXT,
    views INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для posts
CREATE INDEX IF NOT EXISTS idx_posts_category ON public.posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_status ON public.posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON public.posts(slug);

-- Комментарий к таблице
COMMENT ON TABLE public.posts IS 'Таблица для хранения постов блога';

-- ============================================================================
-- 2. ТАБЛИЦА PROFILE (Профиль пользователя)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profile (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    position TEXT,
    about_me TEXT,
    avatar_letter TEXT DEFAULT 'M',
    avatar_url TEXT,
    youtube TEXT,
    github TEXT,
    linkedin TEXT,
    telegram TEXT,
    telegram_channel TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.profile IS 'Профиль владельца блога';

-- ============================================================================
-- 3. ТАБЛИЦА ABOUT_ME (Страница "Обо мне")
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.about_me (
    id BIGSERIAL PRIMARY KEY,
    title TEXT,
    content TEXT,
    image_url TEXT,
    birth_date DATE,
    location TEXT,
    telegram_channel TEXT,
    skills TEXT[] DEFAULT '{}',
    experience TEXT,
    education TEXT,
    interests TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.about_me IS 'Информация для страницы "Обо мне"';

-- ============================================================================
-- 4. ТАБЛИЦА SITE_SETTINGS (Настройки сайта)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.site_settings (
    id BIGSERIAL PRIMARY KEY,
    site_name TEXT DEFAULT 'My Blog',
    site_description TEXT,
    allow_comments BOOLEAN DEFAULT true,
    moderate_comments BOOLEAN DEFAULT true,
    meta_keywords TEXT,
    google_analytics TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.site_settings IS 'Общие настройки сайта';

-- ============================================================================
-- 5. ТАБЛИЦА COMMENTS (Комментарии к постам)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.comments (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT REFERENCES public.posts(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    author_email TEXT,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    parent_id BIGINT REFERENCES public.comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для comments
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_status ON public.comments(status);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_id);

COMMENT ON TABLE public.comments IS 'Комментарии к постам блога';

-- ============================================================================
-- 6. ВКЛЮЧЕНИЕ ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Включаем RLS для всех таблиц
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.about_me ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 7. ПОЛИТИКИ БЕЗОПАСНОСТИ (RLS Policies)
-- ============================================================================

-- POSTS: Все могут читать опубликованные посты
CREATE POLICY "Public can read published posts" ON public.posts
    FOR SELECT USING (status = 'published');

-- POSTS: Аутентифицированные пользователи могут всё
CREATE POLICY "Authenticated users can do everything with posts" ON public.posts
    FOR ALL USING (auth.role() = 'authenticated');

-- POSTS: Анонимные пользователи могут читать все посты (для админки)
CREATE POLICY "Anon can read all posts" ON public.posts
    FOR SELECT USING (true);

-- PROFILE: Все могут читать профиль
CREATE POLICY "Public can read profile" ON public.profile
    FOR SELECT USING (true);

-- PROFILE: Аутентифицированные могут изменять
CREATE POLICY "Authenticated can modify profile" ON public.profile
    FOR ALL USING (auth.role() = 'authenticated');

-- PROFILE: Анонимные могут изменять (для простоты, в продакшене лучше ограничить)
CREATE POLICY "Anon can modify profile" ON public.profile
    FOR ALL USING (true);

-- ABOUT_ME: Все могут читать
CREATE POLICY "Public can read about_me" ON public.about_me
    FOR SELECT USING (true);

-- ABOUT_ME: Аутентифицированные могут изменять
CREATE POLICY "Authenticated can modify about_me" ON public.about_me
    FOR ALL USING (auth.role() = 'authenticated');

-- ABOUT_ME: Анонимные могут изменять
CREATE POLICY "Anon can modify about_me" ON public.about_me
    FOR ALL USING (true);

-- SITE_SETTINGS: Все могут читать
CREATE POLICY "Public can read site_settings" ON public.site_settings
    FOR SELECT USING (true);

-- SITE_SETTINGS: Аутентифицированные могут изменять
CREATE POLICY "Authenticated can modify site_settings" ON public.site_settings
    FOR ALL USING (auth.role() = 'authenticated');

-- SITE_SETTINGS: Анонимные могут изменять
CREATE POLICY "Anon can modify site_settings" ON public.site_settings
    FOR ALL USING (true);

-- COMMENTS: Все могут читать одобренные комментарии
CREATE POLICY "Public can read approved comments" ON public.comments
    FOR SELECT USING (status = 'approved');

-- COMMENTS: Все могут создавать комментарии
CREATE POLICY "Anyone can create comments" ON public.comments
    FOR INSERT WITH CHECK (true);

-- COMMENTS: Аутентифицированные могут всё
CREATE POLICY "Authenticated can do everything with comments" ON public.comments
    FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================================
-- 8. ВКЛЮЧЕНИЕ REALTIME ДЛЯ ТАБЛИЦ
-- ============================================================================

-- Добавляем таблицы в публикацию realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profile;
ALTER PUBLICATION supabase_realtime ADD TABLE public.about_me;
ALTER PUBLICATION supabase_realtime ADD TABLE public.site_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;

-- ============================================================================
-- 9. ФУНКЦИИ И ТРИГГЕРЫ
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

-- ============================================================================
-- 10. НАЧАЛЬНЫЕ ДАННЫЕ (ОПЦИОНАЛЬНО)
-- ============================================================================

-- Создаём начальный профиль (если таблица пуста)
INSERT INTO public.profile (name, position, about_me, avatar_letter)
SELECT 'Your Name', 'Your Position', 'Tell about yourself...', 'Y'
WHERE NOT EXISTS (SELECT 1 FROM public.profile LIMIT 1);

-- Создаём начальные настройки сайта (если таблица пуста)
INSERT INTO public.site_settings (site_name, site_description, allow_comments, moderate_comments)
SELECT 'My Blog', 'Welcome to my personal blog', true, true
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings LIMIT 1);

-- Создаём начальную страницу "Обо мне" (если таблица пуста)
INSERT INTO public.about_me (title, content, skills)
SELECT 'About Me', 'Write something about yourself...', ARRAY['Skill 1', 'Skill 2']
WHERE NOT EXISTS (SELECT 1 FROM public.about_me LIMIT 1);

-- ============================================================================
-- ГОТОВО! База данных создана.
-- ============================================================================
-- 
-- СЛЕДУЮЩИЕ ШАГИ:
-- 
-- 1. Создайте Storage Buckets в Supabase Dashboard:
--    - Storage -> New Bucket -> "images" (Public)
--    - Storage -> New Bucket -> "avatars" (Public)
--    - Storage -> New Bucket -> "videos" (Public)
--
-- 2. Настройте Storage Policies для каждого bucket:
--    - Разрешите публичное чтение (SELECT)
--    - Разрешите загрузку для всех (INSERT)
--    - Разрешите удаление для аутентифицированных (DELETE)
--
-- 3. Скопируйте URL и anon key из Settings -> API в .env.local:
--    VITE_SUPABASE_URL=your_supabase_url
--    VITE_SUPABASE_ANON_KEY=your_anon_key
--
-- ============================================================================
