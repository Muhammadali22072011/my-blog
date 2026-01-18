-- ============================================================================
-- SQL СКРИПТ ДЛЯ ОБНОВЛЕНИЯ ДАННЫХ ПРОФИЛЯ
-- ============================================================================
-- Выполните этот скрипт в Supabase SQL Editor (Database -> SQL Editor)
-- Замените данные на свои!
-- ============================================================================

-- Обновляем профиль
UPDATE public.profile SET
    name = 'Muhammadali Izzatullayev',
    position = 'Full-Stack Developer',
    about_me = 'I write about non-technical stuff in the technical world. Passionate about creating innovative solutions and sharing knowledge.',
    avatar_letter = 'M',
    youtube = 'https://youtube.com/@muhammadali',
    github = 'https://github.com/muhammadali',
    linkedin = 'https://linkedin.com/in/muhammadali',
    telegram = 'https://t.me/muhammadali',
    telegram_channel = '@muhammadaliaiblog',
    updated_at = NOW()
WHERE id = 1;

-- Если профиль не существует, создаём новый
INSERT INTO public.profile (name, position, about_me, avatar_letter, youtube, github, linkedin, telegram, telegram_channel)
SELECT 
    'Muhammadali Izzatullayev',
    'Full-Stack Developer',
    'I write about non-technical stuff in the technical world. Passionate about creating innovative solutions and sharing knowledge.',
    'M',
    'https://youtube.com/@muhammadali',
    'https://github.com/muhammadali',
    'https://linkedin.com/in/muhammadali',
    'https://t.me/muhammadali',
    '@muhammadaliaiblog'
WHERE NOT EXISTS (SELECT 1 FROM public.profile WHERE id = 1);

-- Обновляем страницу "Обо мне"
UPDATE public.about_me SET
    title = 'About Me',
    content = '## Hello! 👋

I am a Full-Stack developer passionate about creating innovative web applications and sharing knowledge with the community.

### What I Do

I specialize in building modern web applications using React, Node.js, and various cloud technologies. I love solving complex problems and creating elegant solutions.

### My Journey

Started coding at a young age and never stopped. Every day is a new opportunity to learn something new and improve my skills.',
    location = 'Uzbekistan',
    telegram_channel = '@muhammadaliaiblog',
    skills = ARRAY['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'PostgreSQL', 'Supabase', 'Tailwind CSS', 'Git', 'Docker'],
    experience = 'Several years of experience in web development, working on various projects from small startups to large enterprise applications.',
    education = 'Self-taught developer with continuous learning through online courses, documentation, and hands-on projects.',
    interests = 'Technology, Open Source, Reading, Gaming, Learning new programming languages and frameworks.',
    updated_at = NOW()
WHERE id = 1;

-- Если страница "Обо мне" не существует, создаём новую
INSERT INTO public.about_me (title, content, location, telegram_channel, skills, experience, education, interests)
SELECT 
    'About Me',
    '## Hello! 👋

I am a Full-Stack developer passionate about creating innovative web applications and sharing knowledge with the community.',
    'Uzbekistan',
    '@muhammadaliaiblog',
    ARRAY['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'PostgreSQL'],
    'Several years of experience in web development.',
    'Self-taught developer with continuous learning.',
    'Technology, Open Source, Reading, Gaming'
WHERE NOT EXISTS (SELECT 1 FROM public.about_me WHERE id = 1);

-- Обновляем настройки сайта
UPDATE public.site_settings SET
    site_name = 'Muhammadali Blog',
    site_description = 'Personal blog about technology, programming, and life. Sharing knowledge and experiences.',
    allow_comments = true,
    moderate_comments = true,
    meta_keywords = 'blog, programming, web development, javascript, react, technology',
    updated_at = NOW()
WHERE id = 1;

-- Если настройки не существуют, создаём новые
INSERT INTO public.site_settings (site_name, site_description, allow_comments, moderate_comments, meta_keywords)
SELECT 
    'Muhammadali Blog',
    'Personal blog about technology, programming, and life.',
    true,
    true,
    'blog, programming, web development, javascript, react'
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings WHERE id = 1);

-- ============================================================================
-- ГОТОВО! Данные обновлены.
-- ============================================================================
