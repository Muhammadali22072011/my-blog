import { useData } from '../context/DataContext'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import supabaseService from '../services/SupabaseService'
import { BlogListSkeleton } from '../components/Skeleton'
import Newsletter from '../components/Newsletter'
import ViewCounter from '../components/ViewCounter'
import SEOHead from '../components/SEOHead'
import TrendingPosts from '../components/TrendingPosts'
import TagCloud from '../components/TagCloud'
import CategoryFilter from '../components/CategoryFilter'
import AuthorCard from '../components/AuthorCard'

function Blogs() {
  const { posts, loading, error, dbInitialized, addPost } = useData()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [isAddingPost, setIsAddingPost] = useState(false)
  const [viewMode, setViewMode] = useState('feed') // 'feed' or 'list'
  const [currentPage, setCurrentPage] = useState(1)
  const postsPerPage = 5

  // Function to add test post
  const handleAddTestPost = async () => {
    setIsAddingPost(true)
    try {
      const testPost = {
        title: 'Welcome to My Blog',
        content: `# Welcome to My Blog! 👋

This is my first blog post. I'm excited to share my thoughts and experiences with you.

## What I'll Write About

I plan to cover various topics including:

- **Web Development** - React, Node.js, and modern frameworks
- **Programming Tips** - Best practices and useful tricks
- **Technology News** - Latest trends in tech world

## Why I Started This Blog

I believe in sharing knowledge. Every developer has unique experiences and insights that can help others grow.

> "The best way to learn is to teach." - Richard Feynman

Thanks for reading! 🚀`,
        excerpt: 'Welcome to my blog! Sharing thoughts about web development and technology.',
        category: 'blog',
        status: 'published'
      }
      
      await supabaseService.createPost(testPost)
      alert('Test post added successfully! Refresh the page to see it.')
      window.location.reload()
    } catch (err) {
      console.error('Error adding test post:', err)
      alert('Error adding post: ' + err.message)
    } finally {
      setIsAddingPost(false)
    }
  }

  // Function to get post title from content or use excerpt
  const getPostTitle = (post) => {
    if (post.content) {
      const lines = post.content.split('\n')
      for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed.startsWith('# ')) {
          const title = trimmed.substring(2)
          if (title.length > 0) {
            // Truncate very long titles
            return title.length > 100 ? title.substring(0, 100) + '...' : title
          }
        }
      }
    }
    return post.excerpt || 'Untitled Post'
  }

  // Calculate reading time
  const getReadingTime = (content) => {
    if (!content) return 1
    const wordsPerMinute = 200
    const words = content.trim().split(/\s+/).length
    const time = Math.ceil(words / wordsPerMinute)
    return time < 1 ? 1 : time
  }

  // Get published posts
  const publishedPosts = posts.filter(post => post.status === 'published')

  // Get unique categories
  const categories = ['all', ...new Set(publishedPosts.map(post => post.category).filter(Boolean))]

  // Get excerpt from content
  const getExcerpt = (content, maxLength = 150) => {
    if (!content) return ''
    // Remove markdown formatting and HTML tags
    const plainText = content
      .replace(/<[^>]+>/g, '') // Remove HTML tags
      .replace(/^#+ .*/gm, '') // Remove headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/`(.*?)`/g, '$1') // Remove code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '') // Remove images
      .replace(/>\s.*/g, '') // Remove blockquotes
      .replace(/- .*/g, '') // Remove list items
      .replace(/\n+/g, ' ') // Replace newlines with spaces
      .trim()
    
    if (plainText.length <= maxLength) return plainText
    return plainText.substring(0, maxLength).trim() + '...'
  }



  // Filter and validate posts
  const validPosts = publishedPosts.filter(post => {
    // Check if post has required fields
    if (!post.content || !post.created_at) {
      return false
    }
    
    // Check if date is valid
    const date = new Date(post.created_at)
    if (isNaN(date.getTime())) {
      return false
    }
    
    // Check if post has a valid title
    const title = getPostTitle(post)
    if (!title || title === 'Untitled Post') {
      return false
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesTitle = title.toLowerCase().includes(query)
      const matchesContent = post.content.toLowerCase().includes(query)
      if (!matchesTitle && !matchesContent) {
        return false
      }
    }

    // Category filter
    if (selectedCategory !== 'all' && post.category !== selectedCategory) {
      return false
    }
    
    return true
  })

  // Group posts by years and months
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

  const groupedPosts = groupPostsByDate(validPosts)
  const sortedYears = Object.keys(groupedPosts).sort((a, b) => b - a)

  // Pagination for feed view
  const sortedPosts = [...validPosts].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  const totalPages = Math.ceil(sortedPosts.length / postsPerPage)
  const paginatedPosts = sortedPosts.slice((currentPage - 1) * postsPerPage, currentPage * postsPerPage)

  // Reset page when filters change
  const handleSearchChange = (value) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  const handleCategoryChange = (category) => {
    setSelectedCategory(category)
    setCurrentPage(1)
  }

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

  // Show loading state with skeleton
  if (loading || !dbInitialized) {
    return (
      <div className="max-w-6xl mx-auto px-4">
        <SEOHead title="Blog" description="Read my latest blog posts about web development, technology, and more." />
        <div className="text-center mb-16 pt-12">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white">BLOG</h1>
        </div>
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
            <BlogListSkeleton count={3} />
          </div>
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 animate-pulse h-48"></div>
          </div>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16 pt-12">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white">BLOG</h1>
        </div>
        <div className="flex justify-center items-center py-16">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Blog</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4">
      <SEOHead title="Blog" description="Read my latest blog posts about web development, technology, and more." />
      {/* Header */}
      <div className="text-center mb-8 pt-12">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-6">BLOG</h1>
        
        {/* Search and Filter */}
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full px-4 py-3 pl-12 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-800 dark:text-white shadow-sm"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          
          {/* Category Filter + View Mode Toggle */}
          <div className="flex flex-wrap items-center justify-center gap-2">
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
                {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
            
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-full p-1 ml-2">
              <button
                onClick={() => setViewMode('feed')}
                className={`p-2 rounded-full transition-all ${viewMode === 'feed' ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}
                title="Feed View"
              >
                <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-full transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}
                title="List View"
              >
                <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Results count */}
          {(searchQuery || selectedCategory !== 'all') && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Found {validPosts.length} post{validPosts.length !== 1 ? 's' : ''}
              {searchQuery && ` for "${searchQuery}"`}
              {selectedCategory !== 'all' && ` in ${selectedCategory}`}
            </p>
          )}
        </div>
        
        {publishedPosts.length > 0 && validPosts.length !== publishedPosts.length && !searchQuery && selectedCategory === 'all' && (
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg max-w-2xl mx-auto">
            <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
              ⚠️ Found {publishedPosts.length} posts, but {publishedPosts.length - validPosts.length} were filtered out due to invalid data.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              🔄 Refresh Page
            </button>
          </div>
        )}
      </div>

      {/* Subscription card - mobile (показывается только на мобильных) */}
      <div className="lg:hidden mb-8">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-3">Subscribe</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4">
            New articles, lectures and courses are available in my @muhammadaliaiblog telegram channel.
          </p>
          <a 
            href="https://t.me/muhammadaliaiblog" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm"
          >
            @muhammadaliaiblog
          </a>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main content - Blog posts */}
        <div className="flex-1 order-2 lg:order-1">
          {validPosts.length > 0 ? (
            <>
              {/* Feed View - Cards with pagination */}
              {viewMode === 'feed' && (
                <div className="space-y-6">
                  {paginatedPosts.map(post => (
                    <article 
                      key={post.id} 
                      className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300 group"
                    >
                      <Link to={`/post/${post.id}`} className="block p-6">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(post.created_at)}
                          </span>
                          <span className="text-gray-300 dark:text-gray-600">•</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {getReadingTime(post.content)} min read
                          </span>
                          {post.category && (
                            <>
                              <span className="text-gray-300 dark:text-gray-600">•</span>
                              <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs capitalize">
                                {post.category}
                              </span>
                            </>
                          )}
                        </div>
                        
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {getPostTitle(post)}
                        </h2>
                        
                        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4">
                          {getExcerpt(post.content)}
                        </p>
                        
                        <div className="flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium group-hover:translate-x-2 transition-transform">
                          Read more
                          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </Link>
                    </article>
                  ))}
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-8">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                            currentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* List View - Grouped by date */}
              {viewMode === 'list' && sortedYears.length > 0 && (
                <div className="space-y-8">
                  {sortedYears.map(year => (
                    <div key={year} className="space-y-6">
                      {/* Year pill */}
                      <div className="inline-block bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-full text-sm font-medium">
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
                            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white">{month}</h2>
                            
                            {/* Posts under month */}
                            <div className="space-y-3">
                              {monthPosts
                                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                                .map(post => (
                                  <div key={post.id} className="border-b border-gray-200 dark:border-gray-700 pb-3 group">
                                    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4">
                                      <span className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm sm:min-w-[120px]">
                                        {formatDate(post.created_at)}
                                      </span>
                                      <div className="flex-1">
                                        <Link 
                                          to={`/post/${post.id}`}
                                          className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium text-base sm:text-lg block mb-1 group-hover:translate-x-1 transform transition-transform"
                                        >
                                          {getPostTitle(post)}
                                        </Link>
                                        <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                                          <span className="flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            {getReadingTime(post.content)} min read
                                          </span>
                                          {post.category && (
                                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full capitalize">
                                              {post.category}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-medium text-gray-600 dark:text-gray-400 mb-2">
                {validPosts.length === 0 ? 'No posts found' : 'No valid posts to display'}
              </h3>
              <p className="text-gray-500 dark:text-gray-500 mb-6">
                {validPosts.length === 0 
                  ? 'Posts are being loaded or there are no posts yet.' 
                  : 'Some posts may have invalid data and were filtered out.'
                }
              </p>
              {validPosts.length === 0 && !searchQuery && selectedCategory === 'all' && (
                <button
                  onClick={handleAddTestPost}
                  disabled={isAddingPost}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {isAddingPost ? 'Adding...' : '➕ Add Test Post'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Subscription sidebar - desktop (скрывается на мобильных) */}
        <div className="hidden lg:block w-64 flex-shrink-0 order-1 lg:order-2">
          <div className="sticky top-24 space-y-6">
            <AuthorCard />
            <TrendingPosts limit={5} />
            <CategoryFilter 
              onFilterChange={handleCategoryChange} 
              selectedCategory={selectedCategory} 
            />
            <TagCloud />
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-3">Subscribe</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4">
                New articles, lectures and courses are available in my @muhammadaliaiblog telegram channel.
              </p>
              <a 
                href="https://t.me/muhammadaliaiblog" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm"
              >
                @muhammadaliaiblog
              </a>
            </div>
            <Newsletter />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Blogs
