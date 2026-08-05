import { Link } from 'react-router-dom'
import { useState, useEffect, useRef, useMemo } from 'react'
import { useData } from '../context/DataContext'
import { renderMarkdown } from '../utils/markdownRenderer.jsx'
import SEOHead from '../components/SEOHead'
import {
  getPostTitle,
  getReadingTime,
  getPostCover,
  stripLeadingTitle,
  formatDateRu,
  isDisplayablePost,
} from '../utils/postFormat'

const PER_PAGE = 10

/**
 * Лента: материалы целиком, один за другим, без карточек.
 * Разделитель между полосами — линейка и колонцифра, как в подшивке.
 */
function Feed() {
  const { posts, loading } = useData()
  const [displayedCount, setDisplayedCount] = useState(PER_PAGE)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const loaderRef = useRef(null)

  const publishedPosts = useMemo(() => (posts || []).filter(isDisplayablePost), [posts])

  const categories = useMemo(
    () => ['all', ...new Set(publishedPosts.map((p) => p.category).filter(Boolean))],
    [publishedPosts]
  )

  const sortedPosts = useMemo(
    () =>
      publishedPosts
        .filter((p) => selectedCategory === 'all' || p.category === selectedCategory)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    [publishedPosts, selectedCategory]
  )

  const displayedPosts = useMemo(
    () => sortedPosts.slice(0, displayedCount),
    [sortedPosts, displayedCount]
  )

  const hasMore = displayedCount < sortedPosts.length

  const handleCategoryChange = (category) => {
    setSelectedCategory(category)
    setDisplayedCount(PER_PAGE)
  }

  useEffect(() => {
    if (!hasMore) return
    const node = loaderRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setDisplayedCount((prev) => prev + PER_PAGE)
      },
      { rootMargin: '600px' }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [hasMore, displayedCount])

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-5 pt-20 sm:px-8">
        <div className="skeleton h-3 w-24" />
        <div className="skeleton mt-6 h-14 w-2/5" />
        <div className="mt-12 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton h-4" style={{ width: `${95 - i * 7}%` }} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-5 sm:px-8">
      <SEOHead
        title="Лента"
        description="Все материалы блога подряд — полными текстами, с бесконечной прокруткой."
      />

      <header className="pb-10 pt-16 sm:pt-24">
        <p className="label">Полными текстами, подряд</p>
        <h1 className="display mt-3 text-[clamp(2.5rem,9vw,5.5rem)]">Лента</h1>

        {categories.length > 1 && (
          <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-2">
            <span className="label text-ink-faint">Рубрики:</span>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                aria-pressed={selectedCategory === category}
                className={`label link-wipe ${
                  selectedCategory === category ? 'text-tile' : 'hover:text-ink'
                }`}
              >
                {category === 'all' ? 'Все' : category}
              </button>
            ))}
          </div>
        )}

        <p className="folio mt-6">
          {displayedPosts.length} из {sortedPosts.length}
        </p>
      </header>

      <div>
        {displayedPosts.map((post, i) => {
          const title = getPostTitle(post)
          const cover = getPostCover(post)

          return (
            <article key={post.id} className="rule-t py-14 first:border-t-0 first:pt-0">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                <span className="folio">{String(i + 1).padStart(3, '0')}</span>
                <span className="label">{formatDateRu(post.created_at)}</span>
                <span className="label">{getReadingTime(post.content)} мин</span>
                {post.category && <span className="label label-tile">{post.category}</span>}
              </div>

              <h2 className="mt-4">
                <Link
                  to={`/post/${post.id}`}
                  className="display block text-[clamp(1.75rem,4.5vw,2.6rem)] leading-[1.06] transition-colors hover:text-tile"
                >
                  {title}
                </Link>
              </h2>

              {cover && (
                <Link to={`/post/${post.id}`} className="mt-8 block">
                  <img
                    src={cover}
                    alt={title}
                    loading="lazy"
                    className="max-h-[460px] w-full object-cover grayscale transition-all duration-500 hover:grayscale-0"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </Link>
              )}

              <div className="article-body mt-8">
                {renderMarkdown(stripLeadingTitle(post.content))}
              </div>

              <Link
                to={`/post/${post.id}`}
                className="label link-wipe mt-10 inline-block hover:text-tile"
              >
                Обсуждение и реакции →
              </Link>
            </article>
          )
        })}
      </div>

      {hasMore && (
        <div ref={loaderRef} className="rule-t py-14 text-center">
          <span className="label animate-pulse">Загрузка…</span>
        </div>
      )}

      {!hasMore && displayedPosts.length > 0 && (
        <div className="rule-t py-14 text-center">
          <span className="label">Конец ленты · {sortedPosts.length}</span>
        </div>
      )}

      {displayedPosts.length === 0 && (
        <div className="rule-t py-24 text-center">
          <p className="display text-3xl text-ink-faint">Пока пусто</p>
          <p className="mt-3 text-ink-soft">Здесь появятся материалы, как только выйдут.</p>
        </div>
      )}
    </div>
  )
}

export default Feed
