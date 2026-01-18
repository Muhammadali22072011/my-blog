import { useData } from '../context/DataContext'
import { Link } from 'react-router-dom'
import { translations } from '../translations'
import { useState, useEffect } from 'react'

function News() {
  const t = translations.en
  const { posts, loading: dataLoading, error } = useData()
  const [newsPosts, setNewsPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNewsPosts = async () => {
      try {
        setLoading(true)
        // Фильтруем посты по категории 'news' и статусу 'published'
        const filteredPosts = posts.filter(post => 
          post.category === 'news' && post.status === 'published'
        )
        setNewsPosts(filteredPosts || [])
      } catch (error) {
        console.error('Error fetching news posts:', error)
        setNewsPosts([])
      } finally {
        setLoading(false)
      }
    }

    fetchNewsPosts()
  }, [posts])

  // Group news by years and months
  const groupPostsByDate = (posts) => {
    const grouped = {}
    
    posts.forEach(post => {
      const date = new Date(post.created_at)
      const year = date.getFullYear()
      const month = date.toLocaleDateString('en-US', { month: 'long' })
      
      if (!grouped[year]) {
        grouped[year] = {}
      }
      if (!grouped[year][month]) {
        grouped[year][month] = []
      }
      
      grouped[year][month].push(post)
    })
    
    return grouped
  }

  const groupedPosts = groupPostsByDate(newsPosts)
  const sortedYears = Object.keys(groupedPosts).sort((a, b) => b - a)

  const formatDate = (dateString) => {
    if (!dateString) return 'No Date'
    
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Invalid Date'
    
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  if (dataLoading || loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 pt-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading news...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 pt-12">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading News</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4">
      {/* Header */}
      <div className="text-center mb-16 pt-12">
        <h1 className="text-4xl font-bold text-gray-800">NEWS</h1>
      </div>

      {/* Subscription card - mobile (показывается только на мобильных) */}
      <div className="lg:hidden mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-medium text-gray-800 mb-3">Subscribe</h3>
          <p className="text-gray-600 text-sm leading-relaxed mb-4">
            New articles, lectures and courses are available in my @muhammadaliaiblog telegram channel.
          </p>
          <a 
            href="https://t.me/muhammadaliaiblog" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            @muhammadaliaiblog
          </a>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main content - News posts */}
        <div className="flex-1 order-2 lg:order-1">
          {newsPosts.length > 0 ? (
            <div className="space-y-8">
              {sortedYears.map(year => (
                <div key={year} className="space-y-6">
                  {/* Year pill */}
                  <div className="inline-block bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm font-medium">
                    {year}
                  </div>
                  
                  {/* Months and posts */}
                  {Object.entries(groupedPosts[year])
                    .sort((a, b) => {
                      const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                                    'July', 'August', 'September', 'October', 'November', 'December']
                      return months.indexOf(b[0]) - months.indexOf(a[0])
                    })
                    .map(([month, monthPosts]) => (
                      <div key={month} className="ml-4 sm:ml-6 space-y-4">
                        {/* Month */}
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-800">{month}</h2>
                        
                        {/* Posts under month */}
                        <div className="space-y-3">
                          {monthPosts
                            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                            .map(post => {
                              // Получаем заголовок из контента
                              const getPostTitle = (content) => {
                                if (!content) return 'No title'
                                const lines = content.split('\n')
                                for (const line of lines) {
                                  const trimmed = line.trim()
                                  if (trimmed.startsWith('# ')) {
                                    return trimmed.substring(2)
                                  }
                                }
                                return content.length > 60 ? content.substring(0, 60) + '...' : content
                              }
                              
                              return (
                                <div key={post.id} className="border-b border-gray-200 pb-3">
                                  <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4">
                                    <span className="text-gray-500 text-xs sm:text-sm sm:min-w-[120px]">
                                      {formatDate(post.created_at)}
                                    </span>
                                    <Link 
                                      to={`/post/${post.slug || post.id}`}
                                      className="text-gray-700 hover:text-gray-900 transition-colors flex-1 text-sm sm:text-base"
                                    >
                                      {getPostTitle(post.content)}
                                    </Link>
                                  </div>
                                </div>
                              )
                            })}
                        </div>
                      </div>
                    ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📰</div>
              <h3 className="text-xl font-medium text-gray-600 mb-2">{t.noNewsYet || 'No news yet'}</h3>
              <p className="text-gray-500">{t.createFirstNews || 'Create your first news post to get started'}</p>
            </div>
          )}
        </div>

        {/* Subscription sidebar - desktop (скрывается на мобильных) */}
        <div className="hidden lg:block w-64 flex-shrink-0 order-1 lg:order-2">
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm sticky top-24">
            <h3 className="text-lg font-medium text-gray-800 mb-3">Subscribe</h3>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">
              New articles, lectures and courses are available in my @muhammadaliaiblog telegram channel.
            </p>
            <a 
              href="https://t.me/muhammadaliaiblog" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              @muhammadaliaiblog
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default News
