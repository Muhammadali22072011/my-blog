-- ============================================================================
-- Раздел «Видео»: таблицы, правила доступа, реакции и просмотры.
--
-- Применение: Supabase → SQL Editor → вставить файл целиком → Run.
-- Файл можно выполнять повторно: всё создаётся через IF NOT EXISTS
-- или пересоздаётся.
--
-- После выполнения один раз назначьте себя админом (почту подставьте свою):
--
--   insert into public.site_admins (user_id)
--   select id from auth.users where email = 'ваша@почта'
--   on conflict do nothing;
--
-- Почта нигде в коде не хранится: админ определяется по строке
-- в site_admins, а не по адресу, зашитому в сборку.
-- ============================================================================


-- ─── Админы ─────────────────────────────────────────────────────────────────

create table if not exists public.site_admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Таблица закрыта целиком: ни читать, ни писать её через API нельзя.
-- Проверка идёт только через is_admin(), которая выполняется с правами
-- владельца функции.
alter table public.site_admins enable row level security;
revoke all on public.site_admins from anon, authenticated;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.site_admins where user_id = auth.uid());
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;


-- ─── Общая функция updated_at ───────────────────────────────────────────────
-- В базе она уже может быть (supabase-schema.sql), create or replace безопасен.

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ─── Категории ──────────────────────────────────────────────────────────────

create table if not exists public.video_categories (
  id          bigserial primary key,
  name        text not null unique,
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  order_index integer not null default 0,
  created_at  timestamptz not null default now()
);

insert into public.video_categories (name, slug, order_index) values
  ('Комедия',    'komediya',   10),
  ('Car edit',   'car-edit',   20),
  ('AI-реклама', 'ai-reklama', 30),
  ('Латифа',     'latifa',     40),
  ('Другое',     'drugoe',     90)
on conflict do nothing;

alter table public.video_categories enable row level security;

drop policy if exists "video_categories: читают все" on public.video_categories;
create policy "video_categories: читают все"
  on public.video_categories for select
  to anon, authenticated
  using (true);

drop policy if exists "video_categories: пишет админ" on public.video_categories;
create policy "video_categories: пишет админ"
  on public.video_categories for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());


-- ─── Видео ──────────────────────────────────────────────────────────────────

create table if not exists public.videos (
  id            bigserial primary key,
  slug          text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title         text not null check (length(title) between 1 and 200),
  description   text,
  category_id   bigint references public.video_categories (id) on delete set null,
  tags          text[] not null default '{}',
  aspect        text not null default '9:16' check (aspect in ('9:16', '16:9')),
  status        text not null default 'draft' check (status in ('draft', 'published')),
  -- Момент, с которого опубликованное видео видно посетителям.
  -- Дата в будущем = отложенная публикация, без всяких таймеров.
  published_at  timestamptz,
  pinned        boolean not null default false,
  video_url     text,
  video_key     text,
  poster_url    text,
  poster_key    text,
  duration_sec  numeric(8, 2),
  width         integer,
  height        integer,
  size_bytes    bigint,
  instagram_url text,
  youtube_url   text,
  views         integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists videos_feed_idx on public.videos (status, published_at desc);
create index if not exists videos_category_idx on public.videos (category_id);

drop trigger if exists update_videos_updated_at on public.videos;
create trigger update_videos_updated_at
  before update on public.videos
  for each row execute function public.update_updated_at_column();

-- Публикация без даты — значит «сейчас»
create or replace function public.videos_default_published_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'published' and new.published_at is null then
    new.published_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists videos_default_published_at on public.videos;
create trigger videos_default_published_at
  before insert or update on public.videos
  for each row execute function public.videos_default_published_at();

alter table public.videos enable row level security;

-- Посетители видят только опубликованное и только после даты публикации.
-- Черновики и отложенные видео отсекает база, а не код страницы.
drop policy if exists "videos: читают опубликованное" on public.videos;
create policy "videos: читают опубликованное"
  on public.videos for select
  to anon, authenticated
  using (status = 'published' and published_at is not null and published_at <= now());

drop policy if exists "videos: админ всё" on public.videos;
create policy "videos: админ всё"
  on public.videos for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());


-- ─── Просмотры ──────────────────────────────────────────────────────────────

create or replace function public.increment_video_views(video_id_param bigint)
returns integer
language sql
security definer
set search_path = public
as $$
  update public.videos
     set views = views + 1
   where id = video_id_param
     and status = 'published'
     and published_at <= now()
  returning views;
$$;

revoke all on function public.increment_video_views(bigint) from public;
grant execute on function public.increment_video_views(bigint) to anon, authenticated;


-- ─── Реакции ────────────────────────────────────────────────────────────────
-- Таблица закрыта от прямого доступа: посетитель работает только через
-- две функции. Так чужие идентификаторы не видны, и удалить чужую
-- реакцию нельзя (у постов сейчас можно — там политика USING (true)).

create table if not exists public.video_reactions (
  id            bigserial primary key,
  video_id      bigint not null references public.videos (id) on delete cascade,
  user_id       text not null,
  reaction_type text not null check (reaction_type in ('like', 'love', 'fire', 'clap', 'think', 'rocket')),
  created_at    timestamptz not null default now(),
  unique (video_id, user_id)
);

create index if not exists video_reactions_video_idx on public.video_reactions (video_id);

alter table public.video_reactions enable row level security;
revoke all on public.video_reactions from anon, authenticated;

drop policy if exists "video_reactions: админ читает" on public.video_reactions;
create policy "video_reactions: админ читает"
  on public.video_reactions for select
  to authenticated
  using (public.is_admin());
grant select on public.video_reactions to authenticated;

create or replace function public.get_video_reactions(p_video_id bigint, p_user_id text default null)
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object(
    'counts', coalesce(
      (select json_object_agg(reaction_type, n)
         from (select reaction_type, count(*) as n
                 from public.video_reactions
                where video_id = p_video_id
                group by reaction_type) c),
      '{}'::json),
    'mine', (select reaction_type from public.video_reactions
              where video_id = p_video_id and user_id = p_user_id)
  );
$$;

create or replace function public.set_video_reaction(p_video_id bigint, p_user_id text, p_reaction text)
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user_id is null or p_user_id !~ '^user_[a-z0-9]{6,32}$' then
    raise exception 'bad user id';
  end if;
  if p_reaction is not null
     and p_reaction not in ('like', 'love', 'fire', 'clap', 'think', 'rocket') then
    raise exception 'bad reaction';
  end if;
  if not exists (select 1 from public.videos
                  where id = p_video_id and status = 'published' and published_at <= now()) then
    raise exception 'video not found';
  end if;

  delete from public.video_reactions where video_id = p_video_id and user_id = p_user_id;
  if p_reaction is not null then
    insert into public.video_reactions (video_id, user_id, reaction_type)
    values (p_video_id, p_user_id, p_reaction);
  end if;

  return public.get_video_reactions(p_video_id, p_user_id);
end;
$$;

revoke all on function public.get_video_reactions(bigint, text) from public;
revoke all on function public.set_video_reaction(bigint, text, text) from public;
grant execute on function public.get_video_reactions(bigint, text) to anon, authenticated;
grant execute on function public.set_video_reaction(bigint, text, text) to anon, authenticated;


-- ─── Ники для блока заказа ──────────────────────────────────────────────────

alter table public.site_settings
  add column if not exists instagram_username text,
  add column if not exists telegram_username text;
