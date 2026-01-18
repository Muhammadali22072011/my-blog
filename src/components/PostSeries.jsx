import { Link } from 'react-router-dom'

function PostSeries({ currentPostId, posts, seriesTag }) {
  // Find posts in the same series (by tag)
  const seriesPosts = posts
    .filter(p => 
      p.status === 'published' && 
      p.tags?.includes(seriesTag)
    )
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))

  if (seriesPosts.length < 2) return null

  const currentIndex = seriesPosts.findIndex(p => p.id === currentPostId)

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
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl p-6 my-8 border border-purple-200 dark:border-purple-800">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <h3 className="font-bold text-gray-800 dark:text-white">
          Series: {seriesTag}
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          ({seriesPosts.length} parts)
        </span>
      </div>

      <div className="space-y-2">
        {seriesPosts.map((post, index) => {
          const isCurrent = post.id === currentPostId
          return (
            <Link
              key={post.id}
              to={`/post/${post.id}`}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                isCurrent 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-white dark:bg-gray-800 hover:bg-purple-100 dark:hover:bg-purple-900/30'
              }`}
            >
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                isCurrent 
                  ? 'bg-white/20' 
                  : 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400'
              }`}>
                {index + 1}
              </span>
              <span className={`flex-1 font-medium truncate ${
                isCurrent ? '' : 'text-gray-800 dark:text-white'
              }`}>
                {getPostTitle(post)}
              </span>
              {isCurrent && (
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                  Current
                </span>
              )}
            </Link>
          )
        })}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-4 pt-4 border-t border-purple-200 dark:border-purple-800">
        {currentIndex > 0 ? (
          <Link
            to={`/post/${seriesPosts[currentIndex - 1].id}`}
            className="flex items-center gap-1 text-sm text-purple-600 dark:text-purple-400 hover:underline"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </Link>
        ) : <div />}
        
        {currentIndex < seriesPosts.length - 1 ? (
          <Link
            to={`/post/${seriesPosts[currentIndex + 1].id}`}
            className="flex items-center gap-1 text-sm text-purple-600 dark:text-purple-400 hover:underline"
          >
            Next
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ) : <div />}
      </div>
    </div>
  )
}

export default PostSeries
