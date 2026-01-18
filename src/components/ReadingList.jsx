import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

function ReadingList() {
  const [readingList, setReadingList] = useState([])
  const [filter, setFilter] = useState('all') // all, unread, completed

  useEffect(() => {
    const saved = localStorage.getItem('readingList')
    if (saved) {
      setReadingList(JSON.parse(saved))
    }
  }, [])

  const addToList = (postId, title, progress = 0) => {
    const newItem = {
      postId,
      title,
      progress,
      addedAt: new Date().toISOString(),
      completed: false
    }
    const updated = [...readingList, newItem]
    setReadingList(updated)
    localStorage.setItem('readingList', JSON.stringify(updated))
  }

  const updateProgress = (postId, progress) => {
    const updated = readingList.map(item =>
      item.postId === postId
        ? { ...item, progress, completed: progress >= 100 }
        : item
    )
    setReadingList(updated)
    localStorage.setItem('readingList', JSON.stringify(updated))
  }

  const removeFromList = (postId) => {
    const updated = readingList.filter(item => item.postId !== postId)
    setReadingList(updated)
    localStorage.setItem('readingList', JSON.stringify(updated))
  }

  const filteredList = readingList.filter(item => {
    if (filter === 'unread') return !item.completed
    if (filter === 'completed') return item.completed
    return true
  })

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          Reading List
        </h2>
        <div className="flex gap-2">
          {['all', 'unread', 'completed'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filteredList.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <div className="text-4xl mb-2">📚</div>
          <p>No posts in your reading list</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredList.map(item => (
            <div key={item.postId} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
              <div className="flex items-start justify-between mb-2">
                <Link
                  to={`/post/${item.postId}`}
                  className="font-medium text-gray-800 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 flex-1"
                >
                  {item.title}
                </Link>
                <button
                  onClick={() => removeFromList(item.postId)}
                  className="text-red-500 hover:text-red-600 ml-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  {Math.round(item.progress)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ReadingList
export { ReadingList }
