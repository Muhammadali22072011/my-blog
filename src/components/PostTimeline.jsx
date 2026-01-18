import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../context/DataContext'

function PostTimeline({ limit = 10 }) {
  const { posts } = useData()
  const [timeline, setTimeline] = useState([])

  useEffect(() => {
    const sortedPosts = posts
      .filter(p => p.status === 'published')
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, limit)

    // Группируем по месяцам
    const grouped = {}
    sortedPosts.forEach(post => {
      const date = new Date(post.created_at)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (!grouped[key]) {
        grouped[key] = {
          year: date.getFullYear(),
          month: date.toLocaleDateString('en-US', { month: 'long' }),
          posts: []
        }
      }
      grouped[key].posts.push(post)
    })

    setTimeline(Object.values(grouped))
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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Timeline
      </h2>
      <div className="space-y-8">
        {timeline.map((group, groupIndex) => (
          <div key={`${group.year}-${group.month}`} className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full font-bold text-sm">
                {group.month} {group.year}
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent dark:from-gray-700"></div>
            </div>
            <div className="space-y-3 ml-4 border-l-2 border-gray-200 dark:border-gray-700 pl-6">
              {group.posts.map((post, postIndex) => (
                <Link
                  key={post.id}
                  to={`/post/${post.id}`}
                  className="block group relative"
                >
                  <div className="absolute -left-[29px] top-2 w-4 h-4 bg-blue-600 rounded-full border-4 border-white dark:border-gray-800 group-hover:scale-125 transition-transform"></div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all">
                    <h3 className="font-medium text-gray-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                      {getPostTitle(post)}
                    </h3>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>{new Date(post.created_at).toLocaleDateString()}</span>
                      {post.category && (
                        <>
                          <span>•</span>
                          <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
                            {post.category}
                          </span>
                        </>
                      )}
                      {post.views > 0 && (
                        <>
                          <span>•</span>
                          <span>{post.views} views</span>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default PostTimeline
