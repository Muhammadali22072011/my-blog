-- Атомарный инкремент просмотров.
--
-- Заменяет схему «прочитать views → записать views + 1» на клиенте:
-- при одновременном заходе нескольких читателей оба читали одно и то же
-- значение и записывали одно и то же число, поэтому просмотры терялись.
--
-- Применение:
--   Supabase Dashboard → SQL Editor → выполнить этот файл.

create or replace function public.increment_post_views(post_id bigint)
returns bigint
language sql
security definer
set search_path = public
as $$
  update public.posts
     set views = coalesce(views, 0) + 1
   where id = post_id
     and status = 'published'
  returning views;
$$;

-- Право вызова у анонимных читателей: функция может увеличить счётчик,
-- но не даёт доступа к остальным колонкам и таблицам.
grant execute on function public.increment_post_views(bigint) to anon, authenticated;
