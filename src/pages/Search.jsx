import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../context/DataContext'

function Search() {
  const { posts, profile, aboutMePage } = useData()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [category, setCategory] = useState('all')
  const [sortBy, setSortBy] = useState('relevance')

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const searchQuery = query.toLowerCase()
    let allResults = []

    // Поиск в постах
    const postResults = posts
      .filter(post => post.status === 'published')
      .filter(post => {
        const title = getPostTitle(post).toLowerCase()
        const content = post.content.toLowerCase()
        const cat = post.category?.toLowerCase() || ''
        return title.includes(searchQuery) || content.includes(searchQuery) || cat.includes(searchQuery)
      })
      .map(post => ({
        type: 'post',
        id: post.id,
        title: getPostTitle(post),
        content: post.content,
        category: post.category,
        url: `/post/${post.id}`,
        date: post.created_at,
        views: post.views || 0
      }))

    // Поиск в профиле
    if (profile) {
      const profileText = `${profile.name} ${profile.position} ${profile.about_me || profile.aboutMe || ''}`.toLowerCase()
      if (profileText.includes(searchQuery)) {
        allResults.push({
          type: 'page',
          id: 'home',
          title: 'Home - ' + (profile.name || 'Profile'),
          content: profile.about_me || profile.aboutMe || '',
          category: 'page',
          url: '/',
          date: new Date().toISOString(),
          views: 0
        })
      }
    }

    // Поиск в About Me
    if (aboutMePage) {
      const aboutText = `${aboutMePage.title || ''} ${aboutMePage.content || ''} ${aboutMePage.skills?.join(' ') || ''}`.toLowerCase()
      if (aboutText.includes(searchQuery)) {
        allResults.push({
          type: 'page',
          id: 'about',
          title: 'About Me',
          content: aboutMePage.content || '',
          category: 'page',
          url: '/about',
          date: new Date().toISOString(),
          views: 0
        })
      }
    }

    // Добавляем посты
    allResults = [...allResults, ...postResults]

    // Фильтр по категории
    if (category !== 'all') {
      allResults = allResults.filter(r => r.category === category)
    }

    // Сортировка
    if (sortBy === 'date') {
      allResults.sort((a, b) => new Date(b.date) - new Date(a.date))
    } else if (sortBy === 'views') {
      allResults.sort((a, b) => b.views - a.views)
    }

    setResults(allResults)
  }, [query, posts, profile, aboutMePage, category, sortBy])

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

  const highlightText = (text, query) => {
    if (!query) return text
    const parts = text.split(new RegExp(`(${query})`, 'gi'))
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <mark key={i} className="bg-gradient-to-r from-yellow-200 to-yellow-300 dark:from-yellow-600 dark:to-yellow-700 px-1 rounded">{part}</mark>
        : part
    )
  }

  const categories = ['all', 'page', ...new Set(posts.map(p => p.category).filter(Boolean))]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Search
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Find what you're looking for</p>
        </div>

        {/* Search Box */}
        <div className="relative mb-8">
          <div className="relative group">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type to search..."
              className="w-full px-6 py-4 pl-14 text-lg bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-lg"
              autoFocus
            />
            <svg className="w-6 h-6 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div className="flex gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  category === cat
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {cat === 'all' ? 'All' : cat === 'page' ? 'Pages' : cat}
              </button>
            ))}
          </div>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-sm"
          >
            <option value="relevance">Relevance</option>
            <option value="date">Latest</option>
            <option value="views">Most Viewed</option>
          </select>
        </div>

        {/* Results */}
        {query && (
          <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            Found {results.length} result{results.length !== 1 ? 's' : ''}
          </div>
        )}

        <div className="space-y-4">
          {results.map((result, index) => (
            <Link
              key={`${result.type}-${result.id}-${index}`}
              to={result.url}
              className="block bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border border-gray-100 dark:border-gray-700"
            >
              <div className="flex items-start justify-between mb-2">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex-1">
                  {highlightText(result.title, query)}
                </h2>
                <span className={`ml-4 px-3 py-1 rounded-full text-xs font-medium ${
                  result.type === 'page'
                    ? 'bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-400'
                    : 'bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-700 dark:text-blue-400'
                }`}>
                  {result.type === 'page' ? '📄 Page' : result.category}
                </span>
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                {highlightText(result.content.substring(0, 200), query)}...
              </p>
              
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-500">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date(result.date).toLocaleDateString()}
                </span>
                {result.views > 0 && (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {result.views} views
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>

        {query && results.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-medium text-gray-600 dark:text-gray-400 mb-2">No results found</h3>
            <p className="text-gray-500 dark:text-gray-500">Try different keywords</p>
          </div>
        )}

        {!query && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">✨</div>
            <h3 className="text-xl font-medium text-gray-600 dark:text-gray-400 mb-2">Start searching</h3>
            <p className="text-gray-500 dark:text-gray-500">Type something to find posts and pages</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Search
