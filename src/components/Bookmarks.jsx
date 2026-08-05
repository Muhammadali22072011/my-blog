import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

export function BookmarkButton({ postId, postTitle }) {
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
      aria-pressed={isBookmarked}
      aria-label={isBookmarked ? 'Убрать из закладок' : 'В закладки'}
      title={isBookmarked ? 'Убрать из закладок' : 'В закладки'}
      className={`label border px-3 py-1.5 transition-all ${
        isBookmarked
          ? 'border-tile text-tile'
          : 'border-ink/25 text-ink-soft hover:border-ink hover:text-ink'
      } ${animating ? '-translate-y-0.5' : ''}`}
    >
      {isBookmarked ? '★ В закладках' : '☆ В закладки'}
    </button>
  )
}

/** Список сохранённых материалов */
export function BookmarksList() {
  const [bookmarks, setBookmarks] = useState([])

  useEffect(() => {
    try {
      setBookmarks(JSON.parse(localStorage.getItem('bookmarked_posts') || '[]'))
    } catch {
      setBookmarks([])
    }
  }, [])

  const remove = (id) => {
    const next = bookmarks.filter((b) => b.id !== id)
    setBookmarks(next)
    try {
      localStorage.setItem('bookmarked_posts', JSON.stringify(next))
    } catch {
      /* приватный режим */
    }
  }

  if (bookmarks.length === 0) {
    return (
      <div className="rule-t py-14 text-center">
        <p className="display text-2xl text-ink-faint">Закладок пока нет</p>
        <p className="mt-2 text-sm text-ink-soft">Сохраняйте материалы, чтобы вернуться позже.</p>
      </div>
    )
  }

  return (
    <ul className="pl-5">
      {bookmarks.map((b, i) => (
        <li key={b.id} className="index-row flex items-baseline gap-4">
          <span className="folio">{String(i + 1).padStart(2, '0')}</span>
          <Link
            to={`/post/${b.id}`}
            className="min-w-0 flex-1 truncate transition-colors hover:text-tile"
          >
            {b.title}
          </Link>
          <button
            onClick={() => remove(b.id)}
            className="label hover:text-terra"
            aria-label={`Убрать «${b.title}» из закладок`}
          >
            убрать
          </button>
        </li>
      ))}
      <div className="rule-t" />
    </ul>
  )
}

export default BookmarkButton
