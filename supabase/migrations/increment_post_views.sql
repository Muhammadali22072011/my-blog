-- Атомарный инкремент просмотров.
--
-- ВАЖНО: функция с таким именем в базе УЖЕ ЕСТЬ, и её аргумент называется
-- post_id_param. Выполнять этот файл нужно только если вы хотите заменить
-- существующую реализацию — например, чтобы добавить проверку статуса.
--
-- Имя аргумента менять нельзя: PostgREST ищет функцию по именам аргументов,
-- и вызов с post_id вместо post_id_param возвращает 404 PGRST202.
-- Именно поэтому здесь сначала DROP: create or replace не умеет менять
-- ни имя аргумента, ни тип возвращаемого значения.
--
-- Применение: Supabase Dashboard → SQL Editor.

drop function if exists public.increment_post_views(bigint);
drop function if exists public.increment_post_views(integer);

create function public.increment_post_views(post_id_param bigint)
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

-- Право вызова у анонимных читателей: функция может увеличить счётчик,
-- но не даёт доступа к остальным колонкам и таблицам.
grant execute on function public.increment_post_views(bigint) to anon, authenticated;
