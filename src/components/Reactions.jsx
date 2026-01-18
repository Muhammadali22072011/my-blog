import { useState, useEffect } from 'react'
import { supabase } from '../config/supabase'

const REACTIONS = [
  { emoji: '👍', name: 'like' },
  { emoji: '❤️', name: 'love' },
  { emoji: '🔥', name: 'fire' },
  { emoji: '👏', name: 'clap' },
  { emoji: '🤔', name: 'think' },
  { emoji: '🚀', name: 'rocket' }
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
      <div className="flex gap-2 animate-pulse">
        {REACTIONS.map(r => (
          <div key={r.name} className="w-12 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3 sm:gap-4 w-full">
      <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 font-medium">
        {totalReactions > 0 ? `${totalReactions} reaction${totalReactions !== 1 ? 's' : ''}` : 'Be the first to react!'}
      </p>
      <div className="flex flex-wrap justify-center gap-2 w-full max-w-md">
        {REACTIONS.map(({ emoji, name }) => (
          <button
            key={name}
            onClick={() => handleReaction(name)}
            className={`
              flex items-center gap-1 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full transition-all duration-200 touch-manipulation
              ${userReaction === name 
                ? 'bg-blue-100 dark:bg-blue-900/50 border-2 border-blue-500 scale-105 sm:scale-110' 
                : 'bg-gray-100 dark:bg-gray-800 border-2 border-transparent hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95'
              }
              ${animating === name ? 'scale-110 sm:scale-125' : ''}
            `}
          >
            <span className={`text-lg sm:text-xl ${animating === name ? 'animate-bounce' : ''}`}>{emoji}</span>
            {reactions[name] > 0 && (
              <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[1rem] text-center">{reactions[name]}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

export default Reactions
