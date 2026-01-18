import { useState, useEffect } from 'react'

function BookmarkButton({ postId, postTitle }) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    const bookmarks = JSON.parse(localStorage.getItem('bookmarked_posts') || '[]')
    setIsBookmarked(bookmarks.some(b => b.id === postId))
  }, [postId])

  const toggleBookmark = () => {
    setAnimating(true)
    const bookmarks = JSON.parse(localStorage.getItem('bookmarked_posts') || '[]')
    
    if (isBookmarked) {
      const filtered = bookmarks.filter(b => b.id !== postId)
      localStorage.setItem('bookmarked_posts', JSON.stringify(filtered))
      setIsBookmarked(false)
    } else {
      bookmarks.push({ id: postId, title: postTitle, savedAt: new Date().toISOString() })
      localStorage.setItem('bookmarked_posts', JSON.stringify(bookmarks))
      setIsBookmarked(true)
    }
    
    setTimeout(() => setAnimating(false), 300)
  }

  return (
    <button
      onClick={toggleBookmark}
      className={`p-2 sm:p-3 rounded-full transition-all duration-200 touch-manipulation ${
        isBookmarked 
          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' 
          : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95'
      } ${animating ? 'scale-110 sm:scale-125' : 'hover:scale-105 sm:hover:scale-110'}`}
      title={isBookmarked ? 'Remove bookmark' : 'Bookmark this post'}
      aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark this post'}
    >
      <svg 
        className={`w-4 h-4 sm:w-5 sm:h-5 ${animating ? 'animate-bounce' : ''}`} 
        fill={isBookmarked ? 'currentColor' : 'none'} 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
    </button>
  )
}

// Bookmarks list component
function BookmarksList() {
  const [bookmarks, setBookmarks] = useState([])

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('bookmarked_posts') || '[]')
    setBookmarks(saved)
  }, [])

  const removeBookmark = (id) => {
    const filtered = bookmarks.filter(b => b.id !== id)
    localStorage.setItem('bookmarked_posts', JSON.stringify(filtered))
    setBookmarks(filtered)
  }

  if (bookmarks.length === 0) {
    return (
      <div className="text-center py-8">
        <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
        <p className="text-gray-500 dark:text-gray-400">No bookmarks yet</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Save posts to read later</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {bookmarks.map(bookmark => (
        <div 
          key={bookmark.id}
          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl"
        >
          <a 
            href={`/post/${bookmark.id}`}
            className="flex-1 text-gray-800 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 font-medium truncate"
          >
            {bookmark.title}
          </a>
          <button
            onClick={() => removeBookmark(bookmark.id)}
            className="ml-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  )
}

export { BookmarkButton, BookmarksList }
export default BookmarkButton
