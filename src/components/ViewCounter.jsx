import { useState, useEffect } from 'react'
import { supabase } from '../config/supabase'

function ViewCounter({ postId, showIcon = true }) {
  const [views, setViews] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!postId) return
    
    const trackView = async () => {
      try {
        // Get current views
        const { data: post, error: fetchError } = await supabase
          .from('posts')
          .select('views')
          .eq('id', postId)
          .single()

        if (fetchError) throw fetchError

        const currentViews = post?.views || 0
        setViews(currentViews)

        // Check if already viewed in this session
        const viewedPosts = JSON.parse(sessionStorage.getItem('viewed_posts') || '[]')
        
        if (!viewedPosts.includes(postId)) {
          // Increment view count
          const { error: updateError } = await supabase
            .from('posts')
            .update({ views: currentViews + 1 })
            .eq('id', postId)

          if (!updateError) {
            setViews(currentViews + 1)
            viewedPosts.push(postId)
            sessionStorage.setItem('viewed_posts', JSON.stringify(viewedPosts))
          }
        }
      } catch (error) {
        console.error('Error tracking view:', error)
      } finally {
        setLoading(false)
      }
    }

    trackView()
  }, [postId])

  const formatViews = (count) => {
    if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M'
    if (count >= 1000) return (count / 1000).toFixed(1) + 'K'
    return count.toString()
  }

  if (loading) {
    return (
      <span className="flex items-center gap-1 text-gray-400 text-xs sm:text-sm">
        {showIcon && (
          <svg className="w-3 h-3 sm:w-4 sm:h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        )}
        <span className="w-6 sm:w-8 h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></span>
      </span>
    )
  }

  return (
    <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-xs sm:text-sm whitespace-nowrap">
      {showIcon && (
        <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      )}
      <span className="font-medium">{formatViews(views)}</span>
    </span>
  )
}

export default ViewCounter
