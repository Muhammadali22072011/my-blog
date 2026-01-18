-- ============================================================================
-- ИСПРАВЛЕНИЕ ОШИБОК SUPABASE
-- Выполни этот скрипт в Supabase SQL Editor
-- ============================================================================

-- 1. УДАЛЯЕМ СТАРЫЕ ПОЛИТИКИ (если есть конфликты)
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

-- 2. СОЗДАЁМ ПРОСТЫЕ ПОЛИТИКИ (разрешаем всё для anon)

-- POSTS
CREATE POLICY "Allow all for posts" ON public.posts FOR ALL USING (true) WITH CHECK (true);

-- PROFILE  
CREATE POLICY "Allow all for profile" ON public.profile FOR ALL USING (true) WITH CHECK (true);

-- ABOUT_ME
CREATE POLICY "Allow all for about_me" ON public.about_me FOR ALL USING (true) WITH CHECK (true);

-- SITE_SETTINGS
CREATE POLICY "Allow all for site_settings" ON public.site_settings FOR ALL USING (true) WITH CHECK (true);

-- COMMENTS
DROP POLICY IF EXISTS "Public can read approved comments" ON public.comments;
DROP POLICY IF EXISTS "Anyone can create comments" ON public.comments;
DROP POLICY IF EXISTS "Authenticated can do everything with comments" ON public.comments;
CREATE POLICY "Allow all for comments" ON public.comments FOR ALL USING (true) WITH CHECK (true);

-- 3. ПРОВЕРЯЕМ ЧТО ЕСТЬ НАЧАЛЬНЫЕ ДАННЫЕ

-- Создаём профиль если нет
INSERT INTO public.profile (id, name, position, about_me, avatar_letter)
SELECT 1, 'Your Name', 'Your Position', 'Tell about yourself...', 'Y'
WHERE NOT EXISTS (SELECT 1 FROM public.profile WHERE id = 1);

-- Создаём настройки если нет
INSERT INTO public.site_settings (id, site_name, site_description)
SELECT 1, 'My Blog', 'Welcome to my blog'
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings WHERE id = 1);

-- Создаём about_me если нет
INSERT INTO public.about_me (id, title, content, skills)
SELECT 1, 'About Me', 'Write about yourself...', ARRAY['Skill 1']
WHERE NOT EXISTS (SELECT 1 FROM public.about_me WHERE id = 1);

-- ============================================================================
-- ГОТОВО!
-- ============================================================================
-- 
-- ТЕПЕРЬ СОЗДАЙ STORAGE BUCKETS ВРУЧНУЮ:
-- 
-- 1. Иди в Supabase Dashboard → Storage
-- 2. Нажми "New bucket"
-- 3. Создай 3 bucket'а:
--    - images (public: ON)
--    - avatars (public: ON)  
--    - videos (public: ON)
--
-- 4. Для каждого bucket'а добавь политику:
--    - Нажми на bucket → Policies → New Policy
--    - Выбери "For full customization"
--    - Policy name: "Allow all"
--    - Allowed operations: SELECT, INSERT, UPDATE, DELETE (все)
--    - Policy definition: true
--    - Сохрани
--
-- ============================================================================
