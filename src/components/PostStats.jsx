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

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  const items = [
    { label: 'просмотры', value: stats.views },
    { label: 'комментарии', value: stats.comments },
    { label: 'отклики', value: stats.reactions },
    { label: 'поделились', value: stats.shares },
  ]

  return (
    <dl className="rule-t flex flex-wrap gap-x-10 gap-y-4 pt-5">
      {items.map((item) => (
        <div key={item.label}>
          <dd className="display numeric text-2xl leading-none">{formatNumber(item.value)}</dd>
          <dt className="label mt-1.5">{item.label}</dt>
        </div>
      ))}
    </dl>
  )
}

export default PostStats
