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
    <div className="fixed right-4 top-24 z-50 max-w-sm border border-ink/20 bg-paper px-4 py-3 shadow-edge">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="mt-2 h-1.5 w-1.5 animate-pulse rounded-full bg-tile"></div>
        </div>
        <div className="flex-1">
          <h4 className="label label-tile">Новый материал</h4>
          <p className="mt-1 text-sm text-ink-soft">
            {newPost.content ? (newPost.content.length > 50 ? newPost.content.substring(0, 50) + '...' : newPost.content) : 'A new post has been published'}
          </p>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="label hover:text-terra"
        >
          ×
        </button>
      </div>
    </div>
  )
}

export default NewPostNotification
