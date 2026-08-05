import { useState, useEffect } from 'react'
import { supabase } from '../config/supabase'

const SESSION_KEY = 'viewed_posts'

function readViewed() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function markViewed(postId) {
  try {
    const viewed = readViewed()
    if (!viewed.includes(postId)) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify([...viewed, postId]))
    }
  } catch {
    /* приватный режим — счётчик просто не запомнит просмотр */
  }
}

function formatViews(count) {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`
  return String(count)
}

/**
 * Счётчик просмотров.
 *
 * Инкремент делает процедура increment_post_views в базе — она уже
 * существует, и её аргумент называется post_id_param. Имя важно:
 * PostgREST ищет функцию по имени аргумента и на post_id отвечает
 * 404 PGRST202.
 *
 * Прежняя схема «прочитать views → записать views + 1» на клиенте
 * теряла просмотры: при одновременном заходе двух читателей оба
 * получали одно число и записывали одно и то же значение.
 *
 * Если процедуры в базе не окажется, происходит откат на старую схему,
 * чтобы счётчик не пропал совсем.
 */
function ViewCounter({ postId, showIcon = true }) {
  const [views, setViews] = useState(null)

  useEffect(() => {
    if (!postId) return

    let cancelled = false

    const readCurrent = async () => {
      const { data } = await supabase
        .from('posts')
        .select('views')
        .eq('id', postId)
        .maybeSingle()
      return data?.views ?? 0
    }

    const run = async () => {
      try {
        if (readViewed().includes(postId)) {
          const current = await readCurrent()
          if (!cancelled) setViews(current)
          return
        }

        const { error } = await supabase.rpc('increment_post_views', {
          post_id_param: postId,
        })

        if (!error) {
          markViewed(postId)
          // Процедура ничего не возвращает — читаем итог отдельным запросом
          const current = await readCurrent()
          if (!cancelled) setViews(current)
          return
        }

        // Запасной путь без процедуры: гонка возможна, но счётчик живёт
        const current = await readCurrent()
        if (!cancelled) setViews(current)

        const { error: updateError } = await supabase
          .from('posts')
          .update({ views: current + 1 })
          .eq('id', postId)

        if (!updateError) {
          markViewed(postId)
          if (!cancelled) setViews(current + 1)
        }
      } catch (error) {
        console.error('Ошибка счётчика просмотров:', error)
        if (!cancelled) setViews(0)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [postId])

  if (views === null) {
    return <span className="skeleton inline-block h-3 w-10 align-middle" aria-hidden="true" />
  }

  return (
    <span className="label numeric whitespace-nowrap">
      {showIcon && '◉ '}
      {formatViews(views)}
    </span>
  )
}

export default ViewCounter
