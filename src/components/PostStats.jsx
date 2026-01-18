import { useState, useEffect } from 'react'
import { supabase } from '../config/supabase'

function PostStats({ postId }) {
  const [stats, setStats] = useState({
    views: 0,
    comments: 0,
    reactions: 0,
    bookmarks: 0,
    shares: 0
  })

  useEffect(() => {
    loadStats()
  }, [postId])

  const loadStats = async () => {
    try {
      // Загружаем все статистики параллельно
      const [viewsData, commentsData, reactionsData] = await Promise.all([
        supabase.from('posts').select('views').eq('id', postId).single(),
        supabase.from('comments').select('id', { count: 'exact' }).eq('post_id', postId),
        supabase.from('reactions').select('id', { count: 'exact' }).eq('post_id', postId)
      ])

      // Получаем закладки из localStorage
      const bookmarksStr = localStorage.getItem('bookmarks')
      const bookmarks = bookmarksStr ? JSON.parse(bookmarksStr) : []
      const isBookmarked = bookmarks.some(b => b.postId === postId)

      setStats({
        views: viewsData.data?.views || 0,
        comments: commentsData.count || 0,
        reactions: reactionsData.count || 0,
        bookmarks: isBookmarked ? 1 : 0,
        shares: parseInt(localStorage.getItem(`shares_${postId}`) || '0')
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const incrementShares = () => {
    const current = parseInt(localStorage.getItem(`shares_${postId}`) || '0')
    localStorage.setItem(`shares_${postId}`, (current + 1).toString())
    setStats(prev => ({ ...prev, shares: current + 1 }))
  }

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Statistics</h3>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {formatNumber(stats.views)}
          </div>
          <div className="text-[10px] text-gray-600 dark:text-gray-400 mt-0.5 flex items-center justify-center gap-0.5">
            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="hidden sm:inline">Views</span>
          </div>
        </div>

        <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="text-lg font-bold text-green-600 dark:text-green-400">
            {formatNumber(stats.comments)}
          </div>
          <div className="text-[10px] text-gray-600 dark:text-gray-400 mt-0.5 flex items-center justify-center gap-0.5">
            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="hidden sm:inline">Comments</span>
          </div>
        </div>

        <div className="text-center p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
            {formatNumber(stats.reactions)}
          </div>
          <div className="text-[10px] text-gray-600 dark:text-gray-400 mt-0.5 flex items-center justify-center gap-0.5">
            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="hidden sm:inline">Reactions</span>
          </div>
        </div>

        <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
            {formatNumber(stats.bookmarks)}
          </div>
          <div className="text-[10px] text-gray-600 dark:text-gray-400 mt-0.5 flex items-center justify-center gap-0.5">
            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <span className="hidden sm:inline">Saved</span>
          </div>
        </div>

        <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <div className="text-lg font-bold text-red-600 dark:text-red-400">
            {formatNumber(stats.shares)}
          </div>
          <div className="text-[10px] text-gray-600 dark:text-gray-400 mt-0.5 flex items-center justify-center gap-0.5">
            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <span className="hidden sm:inline">Shares</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PostStats
export { PostStats }
