-- ============================================================================
-- Закрытие доступа: писать может только админ, посетителям — только то,
-- что нужно сайту (читать, ставить реакции и оценки, комментировать,
-- считать просмотры, писать журнал безопасности).
--
-- Выполнять ПОСЛЕ 20260926_01_videos.sql (нужна функция is_admin())
-- и ПОСЛЕ того, как ваш пользователь добавлен в site_admins — иначе
-- админка сразу потеряет право записи.
--
-- Составлено по выгрузке правил рабочей базы от 26.09.2026. Что было:
--   posts, profile, about_me, site_settings — любой мог менять и удалять;
--   черновики постов читал любой;
--   почты подписчиков, журналы с IP и геолокацией — читал любой
--   (у security_audit_log RLS был выключен совсем);
--   admin_secrets/admin_sessions — любой мог читать и менять;
--   в бакеты images и videos любой мог загружать, а в videos — ещё
--   и перезаписывать и удалять файлы.
--
-- Старые правила снимаются целиком (их было по 5–9 на таблицу, часть
-- дублировала друг друга), вместо них ставится один понятный набор.
-- Файл можно выполнять повторно.
-- ============================================================================

do $$
begin
  if to_regprocedure('public.is_admin()') is null then
    raise exception 'Сначала выполните 20260926_01_videos.sql';
  end if;
  if not exists (select 1 from public.site_admins) then
    raise exception 'В site_admins нет ни одного админа — после этого файла писать в базу не сможет никто. Сначала добавьте себя (см. начало 20260926_01_videos.sql).';
  end if;
end $$;

-- Снимаем ВСЕ правила с перечисленных таблиц
do $$
declare
  r record;
begin
  for r in
    select schemaname, tablename, policyname
      from pg_policies
     where (schemaname = 'public' and tablename in (
              'posts', 'profile', 'about_me', 'site_settings', 'projects',
              'comments', 'reactions', 'post_ratings', 'post_views',
              'newsletter_subscribers', 'bookmarks', 'security_logs',
              'security_audit_log', 'admin_login_attempts', 'admin_secrets',
              'admin_sessions'))
        or (schemaname = 'storage' and tablename in ('objects', 'buckets'))
  loop
    execute format('drop policy %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

alter table public.security_audit_log enable row level security;


-- ─── Содержимое сайта: читают все, пишет админ ─────────────────────────────

-- Посты: посетитель видит только опубликованные
create policy "posts: читают опубликованное" on public.posts
  for select to anon, authenticated
  using (status = 'published' or public.is_admin());
create policy "posts: пишет админ" on public.posts
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "profile: читают все" on public.profile
  for select to anon, authenticated using (true);
create policy "profile: пишет админ" on public.profile
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "about_me: читают все" on public.about_me
  for select to anon, authenticated using (true);
create policy "about_me: пишет админ" on public.about_me
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Здесь же ники для кнопок заказа: подменить их теперь может только админ
create policy "site_settings: читают все" on public.site_settings
  for select to anon, authenticated using (true);
create policy "site_settings: пишет админ" on public.site_settings
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "projects: читают все" on public.projects
  for select to anon, authenticated using (true);
create policy "projects: пишет админ" on public.projects
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());


-- ─── Что делают посетители ─────────────────────────────────────────────────

-- Комментарии: читать и писать могут все, менять и удалять — админ
create policy "comments: читают все" on public.comments
  for select to anon, authenticated using (true);
create policy "comments: пишут все" on public.comments
  for insert to anon, authenticated
  with check (length(content) between 1 and 5000 and length(author_name) between 1 and 80);
create policy "comments: правит админ" on public.comments
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "comments: удаляет админ" on public.comments
  for delete to authenticated
  using (public.is_admin());

-- Реакции на посты: как было (компонент ставит и снимает их сам).
-- У видео реакции устроены строже — через функции, см. файл 01.
create policy "reactions: читают все" on public.reactions
  for select to anon, authenticated using (true);
create policy "reactions: ставят все" on public.reactions
  for insert to anon, authenticated with check (true);
create policy "reactions: снимают все" on public.reactions
  for delete to anon, authenticated using (true);

-- Оценки: ставят и меняют все (компонент делает upsert)
create policy "post_ratings: читают все" on public.post_ratings
  for select to anon, authenticated using (true);
create policy "post_ratings: ставят все" on public.post_ratings
  for insert to anon, authenticated with check (rating between 1 and 5);
create policy "post_ratings: меняют все" on public.post_ratings
  for update to anon, authenticated using (true) with check (rating between 1 and 5);

-- Детальные просмотры: записывают все, читает админ
create policy "post_views: пишут все" on public.post_views
  for insert to anon, authenticated with check (true);
create policy "post_views: читает админ" on public.post_views
  for select to authenticated using (public.is_admin());

-- Журналы безопасности: записывают все (логгер на сайте), читает админ.
-- Там IP-адреса и геолокация посетителей.
create policy "security_logs: пишут все" on public.security_logs
  for insert to anon, authenticated with check (true);
create policy "security_logs: читает админ" on public.security_logs
  for select to authenticated using (public.is_admin());

create policy "security_audit_log: пишут все" on public.security_audit_log
  for insert to anon, authenticated with check (true);
create policy "security_audit_log: читает админ" on public.security_audit_log
  for select to authenticated using (public.is_admin());


-- ─── Только админ ───────────────────────────────────────────────────────────
-- Подписка идёт через сервер (api/newsletter.js), поэтому посетителю
-- таблица подписчиков не нужна вовсе — почты больше никто не прочитает.

create policy "newsletter_subscribers: админ" on public.newsletter_subscribers
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Закладки на сайте хранятся в браузере; таблица не используется
create policy "bookmarks: админ" on public.bookmarks
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Остатки старой системы входа: код их не использует, но admin_secrets
-- с хешами и admin_sessions были открыты всем
create policy "admin_login_attempts: админ" on public.admin_login_attempts
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin_secrets: админ" on public.admin_secrets
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin_sessions: админ" on public.admin_sessions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());


-- ─── Счётчик просмотров постов ──────────────────────────────────────────────
-- Функция в базе выполнялась с правами посетителя и работала только
-- потому, что посты мог менять любой. Теперь она с правами владельца
-- и трогает только счётчик опубликованных постов. Имя аргумента
-- post_id_param сохранено: по нему функцию ищет сайт.

create or replace function public.increment_post_views(post_id_param bigint)
returns void
language sql
security definer
set search_path = public
as $$
  update public.posts
     set views = coalesce(views, 0) + 1
   where id = post_id_param
     and status = 'published';
$$;

revoke all on function public.increment_post_views(bigint) from public;
grant execute on function public.increment_post_views(bigint) to anon, authenticated;


-- ─── Хранилище Supabase (картинки постов, аватар, старые видео) ─────────────
-- Бакеты публичные: файлы по прямой ссылке открываются без правил.
-- Правило на чтение нужно для списка файлов в медиатеке.

create policy "storage: читают все" on storage.objects
  for select to anon, authenticated
  using (bucket_id in ('images', 'videos', 'avatars'));
create policy "storage: загружает админ" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('images', 'videos', 'avatars') and public.is_admin());
create policy "storage: меняет админ" on storage.objects
  for update to authenticated
  using (bucket_id in ('images', 'videos', 'avatars') and public.is_admin())
  with check (bucket_id in ('images', 'videos', 'avatars') and public.is_admin());
create policy "storage: удаляет админ" on storage.objects
  for delete to authenticated
  using (bucket_id in ('images', 'videos', 'avatars') and public.is_admin());

create policy "buckets: читают все" on storage.buckets
  for select to anon, authenticated using (true);
create policy "buckets: управляет админ" on storage.buckets
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
