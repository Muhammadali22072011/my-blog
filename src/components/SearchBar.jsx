import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../context/DataContext'

function SearchBar() {
  const { posts } = useData()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const searchRef = useRef(null)

  // Закрытие при клике вне
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Поиск
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const searchQuery = query.toLowerCase()
    const filtered = posts
      .filter(post => post.status === 'published')
      .filter(post => {
        const title = getPostTitle(post).toLowerCase()
        const content = post.content.toLowerCase()
        const category = post.category?.toLowerCase() || ''
        return title.includes(searchQuery) || content.includes(searchQuery) || category.includes(searchQuery)
      })
      .slice(0, 5)

    setResults(filtered)
    setIsOpen(filtered.length > 0)
  }, [query, posts])

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
        ? <mark key={i} className="bg-yellow-200 dark:bg-yellow-600">{part}</mark>
        : part
    )
  }

  const getExcerpt = (content, query) => {
    const index = content.toLowerCase().indexOf(query.toLowerCase())
    if (index === -1) return content.substring(0, 100) + '...'
    const start = Math.max(0, index - 50)
    const end = Math.min(content.length, index + 100)
    return '...' + content.substring(start, end) + '...'
  }

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search posts..."
          className="w-full px-4 py-2 pl-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Results */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-96 overflow-y-auto z-50">
          {results.map(post => (
            <Link
              key={post.id}
              to={`/post/${post.id}`}
              onClick={() => {
                setIsOpen(false)
                setQuery('')
              }}
              className="block p-4 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0"
            >
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                {highlightText(getPostTitle(post), query)}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {highlightText(getExcerpt(post.content, query), query)}
              </p>
              <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                {post.category && (
                  <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
                    {post.category}
                  </span>
                )}
                <span>{new Date(post.created_at).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default SearchBar
