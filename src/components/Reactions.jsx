import { useState, useEffect, useRef } from 'react'
import { supabase } from '../config/supabase'

const REACTIONS = [
  { emoji: '👍', name: 'like', title: 'Полезно' },
  { emoji: '❤️', name: 'love', title: 'Отлично' },
  { emoji: '🔥', name: 'fire', title: 'Огонь' },
  { emoji: '👏', name: 'clap', title: 'Спасибо' },
  { emoji: '🤔', name: 'think', title: 'Задумался' },
  { emoji: '🚀', name: 'rocket', title: 'Вдохновляет' },
]

function PostReactions({ postId, prompt }) {
  const [reactions, setReactions] = useState({})
  const [userReaction, setUserReaction] = useState(null)
  const [loading, setLoading] = useState(true)
  const [animating, setAnimating] = useState(null)

  // Get user ID from localStorage or generate new one
  const getUserId = () => {
    let id = localStorage.getItem('user_reaction_id')
    if (!id) {
      id = 'user_' + Math.random().toString(36).slice(2, 11)
      localStorage.setItem('user_reaction_id', id)
    }
    return id
  }

  useEffect(() => {
    loadReactions()
  }, [postId])

  const loadReactions = async () => {
    try {
      const { data, error } = await supabase
        .from('reactions')
        .select('reaction_type, user_id')
        .eq('post_id', postId)

      if (error) throw error

      // Count reactions
      const counts = {}
      REACTIONS.forEach(r => { counts[r.name] = 0 })
      
      const userId = getUserId()
      data?.forEach(r => {
        counts[r.reaction_type] = (counts[r.reaction_type] || 0) + 1
        if (r.user_id === userId) {
          setUserReaction(r.reaction_type)
        }
      })
      
      setReactions(counts)
    } catch (error) {
      console.error('Error loading reactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReaction = async (reactionType) => {
    const userId = getUserId()
    setAnimating(reactionType)
    
    try {
      if (userReaction === reactionType) {
        // Remove reaction
        await supabase
          .from('reactions')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId)
        
        setUserReaction(null)
        setReactions(prev => ({
          ...prev,
          [reactionType]: Math.max(0, (prev[reactionType] || 0) - 1)
        }))
      } else {
        // Remove old reaction if exists
        if (userReaction) {
          await supabase
            .from('reactions')
            .delete()
            .eq('post_id', postId)
            .eq('user_id', userId)
          
          setReactions(prev => ({
            ...prev,
            [userReaction]: Math.max(0, (prev[userReaction] || 0) - 1)
          }))
        }
        
        // Add new reaction
        await supabase
          .from('reactions')
          .insert([{
            post_id: postId,
            user_id: userId,
            reaction_type: reactionType
          }])
        
        setUserReaction(reactionType)
        setReactions(prev => ({
          ...prev,
          [reactionType]: (prev[reactionType] || 0) + 1
        }))
      }
    } catch (error) {
      console.error('Error updating reaction:', error)
    } finally {
      setTimeout(() => setAnimating(null), 300)
    }
  }

  return (
    <ReactionsView
      loading={loading}
      reactions={reactions}
      userReaction={userReaction}
      animating={animating}
      onReact={handleReaction}
      prompt={prompt}
    />
  )
}

function ReactionsView({ loading, reactions, userReaction, animating, onReact, prompt }) {
  const totalReactions = Object.values(reactions).reduce((a, b) => a + b, 0)

  if (loading) {
    return (
      <div className="flex flex-wrap gap-3" aria-hidden="true">
        {REACTIONS.map((r) => (
          <span key={r.name} className="skeleton h-8 w-16" />
        ))}
      </div>
    )
  }

  return (
    <div>
      <p className="label">
        {totalReactions > 0 ? `Отклики · ${totalReactions}` : prompt}
      </p>

      <div className="mt-4 flex flex-wrap gap-2.5">
        {REACTIONS.map(({ emoji, name, title }) => {
          const active = userReaction === name
          return (
            <button
              key={name}
              onClick={() => onReact(name)}
              aria-pressed={active}
              aria-label={title}
              title={title}
              className={`flex items-center gap-2 border px-3 py-1.5 transition-all ${
                active
                  ? 'border-tile text-tile'
                  : 'border-ink/20 text-ink-soft hover:border-ink/50 hover:text-ink'
              } ${animating === name ? 'translate-y-[-2px]' : ''}`}
            >
              <span className="text-base leading-none">{emoji}</span>
              <span className="folio numeric">{reactions[name] || 0}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

const USER_ID_RE = /^user_[a-z0-9]{6,32}$/
let memoryUserId = null

/**
 * Тот же анонимный id, что и у реакций на посты. Сервер видео проверяет
 * формат, поэтому старый id неверного вида (редкий случай — короткая
 * строка из Math.random) заменяется новым. Без localStorage живём с id
 * в памяти вкладки.
 */
function getStableUserId() {
  try {
    const saved = localStorage.getItem('user_reaction_id')
    if (saved && USER_ID_RE.test(saved)) return saved
    const id = makeUserId()
    localStorage.setItem('user_reaction_id', id)
    return id
  } catch {
    memoryUserId = memoryUserId || makeUserId()
    return memoryUserId
  }
}

function makeUserId() {
  const bytes = new Uint32Array(2)
  crypto.getRandomValues(bytes)
  return 'user_' + Array.from(bytes, (n) => n.toString(36)).join('').slice(0, 16).padEnd(8, '0')
}

/** Счётчики с нулями для всех реакций — чтобы кнопки не прыгали */
const withZeros = (counts) => {
  const full = {}
  REACTIONS.forEach((r) => {
    full[r.name] = Number(counts?.[r.name]) || 0
  })
  return full
}

/**
 * Реакции через внешний адаптер (видео). Нажатие отражается сразу,
 * затем счётчики сверяются с ответом сервера; при ошибке — откат.
 */
function AdapterReactions({ adapter, prompt }) {
  const [reactions, setReactions] = useState({})
  const [userReaction, setUserReaction] = useState(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [animating, setAnimating] = useState(null)
  const aliveRef = useRef(true)
  const busyRef = useRef(false)
  const animTimerRef = useRef(null)

  useEffect(() => {
    aliveRef.current = true
    return () => {
      aliveRef.current = false
      clearTimeout(animTimerRef.current)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setFailed(false)
    adapter
      .load(getStableUserId())
      .then(({ counts, mine }) => {
        if (cancelled) return
        setReactions(withZeros(counts))
        setUserReaction(mine || null)
      })
      .catch((error) => {
        console.error('Не удалось загрузить реакции:', error)
        if (!cancelled) setFailed(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [adapter])

  const handleReaction = async (name) => {
    // Пока летит прошлый запрос, новые нажатия не принимаем — иначе ответы
    // могут прийти в обратном порядке и «откатить» свежий выбор
    if (busyRef.current) return
    busyRef.current = true

    const prevCounts = reactions
    const prevMine = userReaction
    const next = prevMine === name ? null : name

    const optimistic = { ...prevCounts }
    if (prevMine) optimistic[prevMine] = Math.max(0, (optimistic[prevMine] || 0) - 1)
    if (next) optimistic[next] = (optimistic[next] || 0) + 1
    setReactions(optimistic)
    setUserReaction(next)
    setAnimating(name)

    try {
      const { counts, mine } = await adapter.set(getStableUserId(), next)
      if (!aliveRef.current) return
      setReactions(withZeros(counts))
      setUserReaction(mine || null)
    } catch (error) {
      console.error('Не удалось сохранить реакцию:', error)
      if (!aliveRef.current) return
      setReactions(prevCounts)
      setUserReaction(prevMine)
    } finally {
      busyRef.current = false
      clearTimeout(animTimerRef.current)
      animTimerRef.current = setTimeout(() => {
        if (aliveRef.current) setAnimating(null)
      }, 300)
    }
  }

  // Сервер недоступен — лучше ничего, чем ряд кнопок, которые не работают
  if (failed) return null

  return (
    <ReactionsView
      loading={loading}
      reactions={reactions}
      userReaction={userReaction}
      animating={animating}
      onReact={handleReaction}
      prompt={prompt}
    />
  )
}

/**
 * Без adapter — прежнее поведение для постов (таблица reactions).
 * С adapter = { load(userId), set(userId, reaction|null) } → { counts, mine }
 * компонент работает с любым источником, например с видео.
 * Адаптер должен быть стабильным (useMemo), иначе реакции перечитаются.
 */
function Reactions({ postId, adapter, prompt = 'Как вам материал?' }) {
  return adapter ? (
    <AdapterReactions adapter={adapter} prompt={prompt} />
  ) : (
    <PostReactions postId={postId} prompt={prompt} />
  )
}

export default Reactions
