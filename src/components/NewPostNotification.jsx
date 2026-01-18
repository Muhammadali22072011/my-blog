import { useState, useEffect } from 'react'

function NewPostNotification({ newPost }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (newPost) {
      setVisible(true)
      const timer = setTimeout(() => setVisible(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [newPost])

  if (!visible || !newPost) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 bg-blue-500 text-white px-4 py-3 rounded-lg shadow-lg z-50 max-w-sm">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-sm">New Post Available</h4>
          <p className="text-xs text-blue-100 mt-1">
            {newPost.content ? (newPost.content.length > 50 ? newPost.content.substring(0, 50) + '...' : newPost.content) : 'A new post has been published'}
          </p>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="text-blue-200 hover:text-white text-lg font-bold"
        >
          ×
        </button>
      </div>
    </div>
  )
}

export default NewPostNotification
