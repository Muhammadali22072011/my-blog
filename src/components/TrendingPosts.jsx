import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../context/DataContext'

function TrendingPosts({ limit = 5 }) {
  const { posts } = useData()
  const [trending, setTrending] = useState([])

  useEffect(() => {
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const trendingPosts = posts
      .filter(p => p.status === 'published')
      .filter(p => new Date(p.created_at) >= weekAgo)
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, limit)

    setTrending(trendingPosts)
  }, [posts, limit])

  const getPostTitle = (post) => {
    if (post.content) {
      const lines = post.content.split('\n')
      for (const line of lines) {
        if (line.trim().startsWith('# ')) {
          return line.trim().substring(2)
        }
      }
    }
    return post.excerpt || 'Untitled'
  }

  if (trending.length === 0) return null

  return (
    <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-2xl p-6 shadow-lg border border-orange-200 dark:border-orange-800">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
        <svg className="w-6 h-6 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
        🔥 Trending This Week
      </h2>
      <div className="space-y-3">
        {trending.map((post, index) => (
          <Link
            key={post.id}
            to={`/post/${post.id}`}
            className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl hover:shadow-md transition-all group"
          >
            <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-800 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors line-clamp-2">
                {getPostTitle(post)}
              </h3>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {post.views || 0}
                </span>
                <span>•</span>
                <span>{new Date(post.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default TrendingPosts
