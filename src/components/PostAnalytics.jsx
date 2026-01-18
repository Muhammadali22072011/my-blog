import { useState, useEffect } from 'react'
import { supabase } from '../config/supabase'

function PostAnalytics({ posts }) {
  const [analytics, setAnalytics] = useState({
    totalViews: 0,
    totalReactions: 0,
    totalComments: 0,
    topPosts: [],
    recentActivity: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [posts])

  const loadAnalytics = async () => {
    try {
      // Calculate total views
      const totalViews = posts.reduce((sum, post) => sum + (post.views || 0), 0)

      // Get reactions count
      const { count: reactionsCount } = await supabase
        .from('reactions')
        .select('*', { count: 'exact', head: true })

      // Get comments count
      const { count: commentsCount } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })

      // Top posts by views
      const topPosts = [...posts]
        .filter(p => p.status === 'published')
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 5)

      setAnalytics({
        totalViews,
        totalReactions: reactionsCount || 0,
        totalComments: commentsCount || 0,
        topPosts
      })
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

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

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Views</p>
              <p className="text-3xl font-bold">{analytics.totalViews.toLocaleString()}</p>
            </div>
            <svg className="w-12 h-12 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
        </div>

        <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-pink-100 text-sm">Total Reactions</p>
              <p className="text-3xl font-bold">{analytics.totalReactions.toLocaleString()}</p>
            </div>
            <svg className="w-12 h-12 text-pink-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Total Comments</p>
              <p className="text-3xl font-bold">{analytics.totalComments.toLocaleString()}</p>
            </div>
            <svg className="w-12 h-12 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Top Posts */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          Top Posts
        </h3>
        
        {analytics.topPosts.length > 0 ? (
          <div className="space-y-3">
            {analytics.topPosts.map((post, index) => (
              <div 
                key={post.id}
                className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  index === 0 ? 'bg-yellow-100 text-yellow-700' :
                  index === 1 ? 'bg-gray-200 text-gray-700' :
                  index === 2 ? 'bg-orange-100 text-orange-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 dark:text-white truncate">
                    {getPostTitle(post)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {post.category}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-800 dark:text-white">
                    {(post.views || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">views</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">No posts yet</p>
        )}
      </div>
    </div>
  )
}

export default PostAnalytics
