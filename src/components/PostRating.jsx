import { useState, useEffect } from 'react'
import { supabase } from '../config/supabase'

function PostRating({ postId }) {
  const [rating, setRating] = useState(0)
  const [userRating, setUserRating] = useState(0)
  const [totalRatings, setTotalRatings] = useState(0)
  const [hoveredStar, setHoveredStar] = useState(0)

  useEffect(() => {
    loadRating()
    loadUserRating()
  }, [postId])

  const loadRating = async () => {
    try {
      const { data, error } = await supabase
        .from('post_ratings')
        .select('rating')
        .eq('post_id', postId)

      if (error) throw error

      if (data && data.length > 0) {
        const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length
        setRating(avg)
        setTotalRatings(data.length)
      }
    } catch (error) {
      console.error('Error loading rating:', error)
    }
  }

  const loadUserRating = () => {
    const saved = localStorage.getItem(`rating_${postId}`)
    if (saved) {
      setUserRating(parseInt(saved))
    }
  }

  const handleRate = async (stars) => {
    try {
      const userId = localStorage.getItem('userId') || `anon_${Date.now()}`
      localStorage.setItem('userId', userId)

      const { error } = await supabase
        .from('post_ratings')
        .upsert({
          post_id: postId,
          user_id: userId,
          rating: stars
        }, {
          onConflict: 'post_id,user_id'
        })

      if (error) throw error

      setUserRating(stars)
      localStorage.setItem(`rating_${postId}`, stars.toString())
      loadRating()
    } catch (error) {
      console.error('Error rating post:', error)
    }
  }

  return (
    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg p-3 text-center border border-yellow-200 dark:border-yellow-800">
      <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-2">Rate this post</h3>
      <div className="flex justify-center gap-1 mb-2">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            onClick={() => handleRate(star)}
            onMouseEnter={() => setHoveredStar(star)}
            onMouseLeave={() => setHoveredStar(0)}
            className="transition-transform hover:scale-110 active:scale-95 touch-manipulation"
            aria-label={`Rate ${star} stars`}
          >
            <svg
              className={`w-5 h-5 ${
                star <= (hoveredStar || userRating || rating)
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300 dark:text-gray-600'
              }`}
              fill={star <= (hoveredStar || userRating) ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </button>
        ))}
      </div>
      <div className="text-xs text-gray-600 dark:text-gray-400">
        {rating > 0 ? (
          <>
            <span className="font-bold text-yellow-600 dark:text-yellow-400">{rating.toFixed(1)}</span>
            {' '}/ 5 ({totalRatings} {totalRatings === 1 ? 'rating' : 'ratings'})
          </>
        ) : (
          'Be the first to rate!'
        )}
      </div>
    </div>
  )
}

export default PostRating
