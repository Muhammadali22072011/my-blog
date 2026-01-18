import { useData } from '../context/DataContext'
import { Link } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import SEOHead from '../components/SEOHead'

function Feed() {
  const { posts, loading } = useData()
  const [displayedCount, setDisplayedCount] = useState(10)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const loaderRef = useRef(null)
  const postsPerLoad = 10

  // Simple markdown formatter (fallback when react-markdown fails)
  const formatMarkdown = (text) => {
    if (!text) return ''
    
    return text
      // Headers
      .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-6 mb-3">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mt-8 mb-4">$1</h1>')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
      .replace(/__(.*?)__/g, '<strong class="font-bold">$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      .replace(/_(.*?)_/g, '<em class="italic">$1</em>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:underline" target="_blank" rel="noopener">$1</a>')
      // Code blocks
      .replace(/```([^`]+)```/g, '<pre class="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto my-4"><code>$1</code></pre>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">$1</code>')
      // Lists
      .replace(/^\* (.*$)/gim, '<li class="ml-4">• $1</li>')
      .replace(/^- (.*$)/gim, '<li class="ml-4">• $1</li>')
      // Line breaks
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/\n/g, '<br/>')
  }

  // Get published posts
  const publishedPosts = posts.filter(post => post.status === 'published')
  
  // Get unique categories
  const categories = ['all', ...new Set(publishedPosts.map(post => post.category).filter(Boolean))]

  // Filter by category
  const filteredPosts = selectedCategory === 'all' 
    ? publishedPosts 
    : publishedPosts.filter(post => post.category === selectedCategory)

  // Sort by date
  const sortedPosts = [...filteredPosts].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  
  // Display limited posts
  const displayedPosts = sortedPosts.slice(0, displayedCount)
  const hasMore = displayedCount < sortedPosts.length

  // Get post title
  const getPostTitle = (post) => {
    if (post.content) {
      const lines = post.content.split('\n')
      for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed.startsWith('# ')) {
          const title = trimmed.substring(2)
          if (title.length > 0) {
            return title.length > 100 ? title.substring(0, 100) + '...' : title
          }
        }
      }
    }
    return post.excerpt || 'Untitled Post'
  }

  // Get full content without title
  const getContentWithoutTitle = (content) => {
    if (!content) return ''
    const lines = content.split('\n')
    let foundTitle = false
    const filteredLines = []
    
    for (const line of lines) {
      if (!foundTitle && line.trim().startsWith('# ')) {
        foundTitle = true
        continue
      }
      filteredLines.push(line)
    }
    
    return filteredLines.join('\n')
  }

  // Get reading time
  const getReadingTime = (content) => {
    if (!content) return 1
    const wordsPerMinute = 200
    const words = content.trim().split(/\s+/).length
    const time = Math.ceil(words / wordsPerMinute)
    return time < 1 ? 1 : time
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'No Date'
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Invalid Date'
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  // Get full image URL
  const getFullImageUrl = (imageUrl) => {
    if (!imageUrl) return null
    if (imageUrl.startsWith('http')) return imageUrl
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rfppkhwqnlkpjemmoexg.supabase.co'
    return `${supabaseUrl}/storage/v1/object/public/${imageUrl}`
  }

  // Reset count when category changes
  const handleCategoryChange = (category) => {
    setSelectedCategory(category)
    setDisplayedCount(postsPerLoad)
  }

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0]
        if (first.isIntersecting && hasMore && !isLoadingMore) {
          setIsLoadingMore(true)
          setTimeout(() => {
            setDisplayedCount(prev => prev + postsPerLoad)
            setIsLoadingMore(false)
          }, 300)
        }
      },
      { threshold: 0.1 }
    )

    const currentLoader = loaderRef.current
    if (currentLoader) {
      observer.observe(currentLoader)
    }

    return () => {
      if (currentLoader) {
        observer.unobserve(currentLoader)
      }
    }
  }, [hasMore, isLoadingMore])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-200 dark:bg-gray-800 h-48 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <SEOHead title="Лента постов" description="Все посты блога в одной ленте с бесконечной прокруткой" />
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">Лента</h1>
        
        {/* Category filters */}
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => handleCategoryChange(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {category === 'all' ? 'Все подряд' : category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
        
        {/* Results count */}
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
          Показано {displayedPosts.length} из {sortedPosts.length} постов
        </p>
      </div>

      {/* Posts feed */}
      <div className="space-y-8">
        {displayedPosts.map(post => (
          <article 
            key={post.id} 
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300"
          >
            <div className="p-6">
              {/* Meta info */}
              <div className="flex items-center gap-3 mb-4 text-xs text-gray-500 dark:text-gray-400">
                <span>{formatDate(post.created_at)}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {getReadingTime(post.content)} мин
                </span>
                {post.category && (
                  <>
                    <span>•</span>
                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full capitalize">
                      {post.category}
                    </span>
                  </>
                )}
              </div>
              
              {/* Title */}
              <Link to={`/post/${post.id}`}>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  {getPostTitle(post)}
                </h2>
              </Link>
              
              {/* Featured image */}
              {(post.featured_image || post.og_image) && (
                <Link to={`/post/${post.id}`} className="block mb-4">
                  <div className="rounded-lg overflow-hidden">
                    <img 
                      src={getFullImageUrl(post.featured_image) || getFullImageUrl(post.og_image)}
                      alt={getPostTitle(post)}
                      className="w-full h-64 object-cover hover:scale-105 transition-transform duration-300"
                      onError={(e) => e.target.parentElement.parentElement.style.display = 'none'}
                    />
                  </div>
                </Link>
              )}
              
              {/* Full content with markdown */}
              <div className="prose prose-lg dark:prose-invert max-w-none mb-6">
                {typeof ReactMarkdown !== 'undefined' ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '')
                        return !inline && match ? (
                          <SyntaxHighlighter
                            style={vscDarkPlus}
                            language={match[1]}
                            PreTag="div"
                            {...props}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        )
                      },
                      img({ src, alt }) {
                        return (
                          <img 
                            src={getFullImageUrl(src)} 
                            alt={alt || ''} 
                            className="rounded-lg w-full"
                            loading="lazy"
                          />
                        )
                      }
                    }}
                  >
                    {getContentWithoutTitle(post.content)}
                  </ReactMarkdown>
                ) : (
                  <div 
                    className="formatted-content"
                    dangerouslySetInnerHTML={{ 
                      __html: '<p class="mb-4">' + formatMarkdown(getContentWithoutTitle(post.content)) + '</p>' 
                    }}
                  />
                )}
              </div>
              
              {/* Post footer */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <Link 
                  to={`/post/${post.id}`}
                  className="inline-flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium hover:translate-x-2 transition-transform"
                >
                  Комментарии и реакции
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Infinite scroll loader */}
      {hasMore && (
        <div ref={loaderRef} className="flex justify-center py-8">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm">Загрузка постов...</span>
          </div>
        </div>
      )}

      {/* End of posts */}
      {!hasMore && displayedPosts.length > 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            🎉 Вы просмотрели все посты
          </p>
        </div>
      )}

      {/* No posts */}
      {displayedPosts.length === 0 && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-medium text-gray-600 dark:text-gray-400 mb-2">
            Постов пока нет
          </h3>
          <p className="text-gray-500 dark:text-gray-500">
            Скоро здесь появятся интересные статьи
          </p>
        </div>
      )}
    </div>
  )
}

export default Feed
