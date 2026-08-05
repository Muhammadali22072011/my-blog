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
 * Инкремент делается процедурой increment_post_views (см.
 * supabase/migrations/increment_post_views.sql). Прежняя схема
 * «прочитать views → записать views + 1» теряла просмотры при
 * одновременном заходе нескольких читателей: оба читали одно и то же
 * число и записывали одно и то же значение.
 *
 * Если процедура ещё не создана, происходит откат на старую схему,
 * чтобы счётчик не пропал совсем.
 */
function ViewCounter({ postId, showIcon = true }) {
  const [views, setViews] = useState(null)

  useEffect(() => {
    if (!postId) return

    let cancelled = false

    const run = async () => {
      const alreadyViewed = readViewed().includes(postId)

      try {
        if (!alreadyViewed) {
          const { data, error } = await supabase.rpc('increment_post_views', {
            post_id: postId,
          })

          if (!error) {
            if (!cancelled) setViews(data ?? 0)
            markViewed(postId)
            return
          }
        }

        // Только чтение — либо просмотр уже засчитан, либо RPC недоступна
        const { data: post } = await supabase
          .from('posts')
          .select('views')
          .eq('id', postId)
          .maybeSingle()

        const current = post?.views ?? 0
        if (!cancelled) setViews(current)

        if (!alreadyViewed) {
          // Запасной путь без процедуры: гонка возможна, но счётчик живёт
          const { error: updateError } = await supabase
            .from('posts')
            .update({ views: current + 1 })
            .eq('id', postId)

          if (!updateError) {
            if (!cancelled) setViews(current + 1)
            markViewed(postId)
          }
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
