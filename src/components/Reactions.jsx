import { useState, useEffect } from 'react'
import { supabase } from '../config/supabase'

const REACTIONS = [
  { emoji: '👍', name: 'like', title: 'Полезно' },
  { emoji: '❤️', name: 'love', title: 'Отлично' },
  { emoji: '🔥', name: 'fire', title: 'Огонь' },
  { emoji: '👏', name: 'clap', title: 'Спасибо' },
  { emoji: '🤔', name: 'think', title: 'Задумался' },
  { emoji: '🚀', name: 'rocket', title: 'Вдохновляет' },
]

function Reactions({ postId }) {
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
        {totalReactions > 0 ? `Отклики · ${totalReactions}` : 'Как вам материал?'}
      </p>

      <div className="mt-4 flex flex-wrap gap-2.5">
        {REACTIONS.map(({ emoji, name, title }) => {
          const active = userReaction === name
          return (
            <button
              key={name}
              onClick={() => handleReaction(name)}
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

export default Reactions
