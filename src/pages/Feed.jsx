import { useData } from '../context/DataContext'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { renderMarkdown } from '../utils/markdownRenderer.jsx'

function Feed() {
  const { posts, loading, error } = useData()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const containerRef = useRef(null)

  // Get published posts sorted by date
  const publishedPosts = posts
    .filter(post => post.status === 'published' && post.content)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  const currentPost = publishedPosts[currentIndex]
  const hasNext = currentIndex < publishedPosts.length - 1
  const hasPrev = currentIndex > 0

  // Navigate to next/previous post
  const goToNext = useCallback(() => {
    if (hasNext && !isTransitioning) {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1)
        setIsTransitioning(false)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }, 300)
    }
  }, [hasNext, isTransitioning])

  const goToPrev = useCallback(() => {
    if (hasPrev && !isTransitioning) {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentIndex(prev => prev - 1)
        setIsTransitioning(false)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }, 300)
    }
  }, [hasPrev, isTransitioning])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        goToNext()
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        goToPrev()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goToNext, goToPrev])

  // Get post title
  const getPostTitle = (post) => {
    if (!post?.content) return 'Untitled'
    const lines = post.content.split('\n')
    for (const line of lines) {
      if (line.trim().startsWith('# ')) {
        return line.trim().substring(2)
      }
    }
    return post.excerpt || 'Untitled'
  }

  // Get content without title
  const getContentWithoutTitle = (content) => {
    if (!content) return ''
    const lines = content.split('\n')
    let foundTitle = false
    const filtered = []
    for (const line of lines) {
      if (line.trim().startsWith('# ') && !foundTitle) {
        foundTitle = true
        continue
      }
      filtered.push(line)
    }
    return filtered.join('\n')
  }

  // Calculate reading time
  const getReadingTime = (content) => {
    if (!content) return 1
    const words = content.trim().split(/\s+/).length
    return Math.max(1, Math.ceil(words / 200))
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading feed...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Error</h2>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    )
  }

  if (publishedPosts.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📭</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No posts yet</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">The feed is empty</p>
          <Link to="/blogs" className="text-blue-600 hover:text-blue-700">
            Go to Blogs →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" ref={containerRef}>
      {/* Progress indicator */}
      <div className="fixed top-16 left-0 right-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {currentIndex + 1} / {publishedPosts.length}
          </span>
          <div className="flex-1 mx-4 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / publishedPosts.length) * 100}%` }}
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span>Use</span>
            <kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">←</kbd>
            <kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">→</kbd>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={`max-w-4xl mx-auto px-4 pt-28 pb-32 transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
        {currentPost && (
          <>
            {/* Post header */}
            <header className="mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-white mb-4">
                {getPostTitle(currentPost)}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                <span>{formatDate(currentPost.created_at)}</span>
                <span>•</span>
                <span>{getReadingTime(currentPost.content)} min read</span>
                {currentPost.category && (
                  <>
                    <span>•</span>
                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full capitalize">
                      {currentPost.category}
                    </span>
                  </>
                )}
                <Link 
                  to={`/post/${currentPost.id}`}
                  className="ml-auto text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Open full page →
                </Link>
              </div>
            </header>

            {/* Post content */}
            <article className="prose prose-lg dark:prose-invert max-w-none">
              <div className="text-gray-800 dark:text-gray-200 leading-relaxed bg-white dark:bg-gray-800 rounded-xl p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-gray-700">
                {renderMarkdown(getContentWithoutTitle(currentPost.content), { emptyText: 'No content' })}
              </div>
            </article>
          </>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Previous button */}
            <button
              onClick={goToPrev}
              disabled={!hasPrev || isTransitioning}
              className={`flex-1 flex items-center gap-3 p-4 rounded-xl transition-all ${
                hasPrev 
                  ? 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer' 
                  : 'bg-gray-50 dark:bg-gray-800/50 opacity-50 cursor-not-allowed'
              }`}
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <div className="text-left flex-1 min-w-0">
                <div className="text-xs text-gray-500 dark:text-gray-400">Previous</div>
                <div className="text-sm font-medium text-gray-800 dark:text-white truncate">
                  {hasPrev ? getPostTitle(publishedPosts[currentIndex - 1]) : 'No more posts'}
                </div>
              </div>
            </button>

            {/* Counter */}
            <div className="flex flex-col items-center px-4">
              <div className="text-2xl font-bold text-gray-800 dark:text-white">
                {currentIndex + 1}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                of {publishedPosts.length}
              </div>
            </div>

            {/* Next button */}
            <button
              onClick={goToNext}
              disabled={!hasNext || isTransitioning}
              className={`flex-1 flex items-center gap-3 p-4 rounded-xl transition-all ${
                hasNext 
                  ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer' 
                  : 'bg-gray-50 dark:bg-gray-800/50 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="text-right flex-1 min-w-0">
                <div className={`text-xs ${hasNext ? 'text-blue-200' : 'text-gray-500 dark:text-gray-400'}`}>Next</div>
                <div className={`text-sm font-medium truncate ${hasNext ? 'text-white' : 'text-gray-800 dark:text-white'}`}>
                  {hasNext ? getPostTitle(publishedPosts[currentIndex + 1]) : 'End of feed'}
                </div>
              </div>
              <svg className={`w-5 h-5 ${hasNext ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Feed
