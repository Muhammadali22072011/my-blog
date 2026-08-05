import { Link } from 'react-router-dom'
import { useState, useEffect, useRef, useMemo } from 'react'
import { useData } from '../context/DataContext'
import { BlogListSkeleton } from '../components/Skeleton'
import Newsletter from '../components/Newsletter'
import SEOHead from '../components/SEOHead'
import TrendingPosts from '../components/TrendingPosts'
import TagCloud from '../components/TagCloud'
import AuthorCard from '../components/AuthorCard'
import {
  getPostTitle,
  getExcerpt,
  getReadingTime,
  getPostCover,
  formatDateRu,
  monthNameRu,
  isDisplayablePost,
} from '../utils/postFormat'

const PER_PAGE = 10

/**
 * Указатель материалов.
 *
 * Два режима подачи:
 *   «указатель» — нумерованное оглавление с отточием, как в книге;
 *   «полосы»    — крупные развороты с обложкой.
 */
function Blogs() {
  const { posts, loading, error, dbInitialized } = useData()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [viewMode, setViewMode] = useState('index')
  const [displayedCount, setDisplayedCount] = useState(PER_PAGE)
  const loaderRef = useRef(null)

  const publishedPosts = useMemo(
    () => (posts || []).filter(isDisplayablePost),
    [posts]
  )

  const categories = useMemo(
    () => ['all', ...new Set(publishedPosts.map((p) => p.category).filter(Boolean))],
    [publishedPosts]
  )

  // Фильтрация и сортировка мемоизированы: раньше весь список
  // пересобирался и пересортировывался на каждый ре-рендер.
  const validPosts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return publishedPosts
      .filter((post) => {
        if (selectedCategory !== 'all' && post.category !== selectedCategory) return false
        if (!query) return true
        return (
          getPostTitle(post).toLowerCase().includes(query) ||
          post.content.toLowerCase().includes(query)
        )
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  }, [publishedPosts, searchQuery, selectedCategory])

  const displayedPosts = useMemo(
    () => validPosts.slice(0, displayedCount),
    [validPosts, displayedCount]
  )

  const hasMore = displayedCount < validPosts.length

  // Группировка по годам и месяцам без мутации исходных массивов
  const grouped = useMemo(() => {
    const byYear = new Map()
    for (const post of validPosts) {
      const date = new Date(post.created_at)
      const year = date.getFullYear()
      const month = date.getMonth()
      if (!byYear.has(year)) byYear.set(year, new Map())
      const byMonth = byYear.get(year)
      if (!byMonth.has(month)) byMonth.set(month, [])
      byMonth.get(month).push(post)
    }
    return [...byYear.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([year, months]) => [year, [...months.entries()].sort((a, b) => b[0] - a[0])])
  }, [validPosts])

  const handleSearchChange = (value) => {
    setSearchQuery(value)
    setDisplayedCount(PER_PAGE)
  }

  const handleCategoryChange = (category) => {
    setSelectedCategory(category)
    setDisplayedCount(PER_PAGE)
  }

  // Бесконечная лента
  useEffect(() => {
    if (viewMode !== 'feed' || !hasMore) return

    const node = loaderRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setDisplayedCount((prev) => prev + PER_PAGE)
      },
      { rootMargin: '400px' }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [hasMore, viewMode, displayedCount])

  if (loading || !dbInitialized) {
    return (
      <div className="mx-auto max-w-6xl px-5 pt-20 sm:px-8">
        <SEOHead title="Журнал" description="Материалы о разработке, ИИ и ремесле." />
        <h1 className="display text-[clamp(2.5rem,8vw,5rem)]">Указатель</h1>
        <div className="mt-16">
          <BlogListSkeleton count={4} />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-32 text-center sm:px-8">
        <p className="label text-terra">Ошибка загрузки</p>
        <h1 className="display mt-4 text-4xl">Указатель недоступен</h1>
        <p className="mt-4 text-ink-soft">{error}</p>
        <button onClick={() => window.location.reload()} className="btn-primary mt-8">
          Повторить
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-5 sm:px-8">
      <SEOHead
        title="Журнал"
        description="Указатель материалов о разработке, искусственном интеллекте и ремесле."
      />

      {/* ── Шапка раздела ─────────────────────────────────────────── */}
      <header className="pb-12 pt-16 sm:pt-24">
        <p className="label">
          {publishedPosts.length} материал{plural(publishedPosts.length)}
        </p>
        <h1 className="display mt-3 text-[clamp(2.5rem,9vw,6rem)]">Указатель</h1>

        {/* Поиск — голая строка с линейкой, без «пилюли» */}
        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <label htmlFor="post-search" className="label">
              Поиск по материалам
            </label>
            <div className="relative mt-2 flex items-center">
              <input
                id="post-search"
                type="search"
                placeholder="слово, тема, имя…"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full border-0 border-b border-ink/25 bg-transparent px-0 py-2.5 font-serif text-xl outline-none transition-colors placeholder:text-ink-faint focus:border-tile"
              />
              {searchQuery && (
                <button
                  onClick={() => handleSearchChange('')}
                  aria-label="Очистить поиск"
                  className="label absolute right-0 hover:text-tile"
                >
                  Сброс
                </button>
              )}
            </div>
          </div>

          {/* Режим подачи */}
          <div className="lg:col-span-5 lg:justify-self-end">
            <p className="label">Подача</p>
            <div className="mt-2 flex gap-5">
              <button
                onClick={() => setViewMode('index')}
                aria-pressed={viewMode === 'index'}
                className={`label link-wipe ${viewMode === 'index' ? 'text-tile' : ''}`}
              >
                Указатель
              </button>
              <button
                onClick={() => setViewMode('feed')}
                aria-pressed={viewMode === 'feed'}
                className={`label link-wipe ${viewMode === 'feed' ? 'text-tile' : ''}`}
              >
                Полосы
              </button>
              <button
                onClick={() => setViewMode('archive')}
                aria-pressed={viewMode === 'archive'}
                className={`label link-wipe ${viewMode === 'archive' ? 'text-tile' : ''}`}
              >
                Архив
              </button>
            </div>
          </div>
        </div>

        {/* Рубрики */}
        {categories.length > 1 && (
          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2">
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

        {(searchQuery || selectedCategory !== 'all') && (
          <p className="folio mt-6">
            Найдено: {validPosts.length}
            {searchQuery && ` · «${searchQuery}»`}
          </p>
        )}
      </header>

      <div className="grid grid-cols-1 gap-14 pb-24 lg:grid-cols-12">
        <div className="lg:col-span-8">
          {validPosts.length === 0 ? (
            <div className="rule-t py-24 text-center">
              <p className="display text-3xl text-ink-faint">Ничего не найдено</p>
              <p className="mt-3 text-ink-soft">
                Попробуйте изменить запрос или снять фильтр рубрики.
              </p>
            </div>
          ) : (
            <>
              {/* ── Режим «указатель» ──────────────────────────────── */}
              {viewMode === 'index' && (
                <div className="pl-5">
                  {validPosts.map((post, i) => (
                    <Link key={post.id} to={`/post/${post.id}`} className="index-row group">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:gap-5">
                        <span className="folio w-10 flex-shrink-0 pt-1">
                          {String(i + 1).padStart(3, '0')}
                        </span>
                        <h2 className="display text-2xl leading-tight transition-colors group-hover:text-tile sm:text-[1.7rem]">
                          {getPostTitle(post)}
                        </h2>
                        <span className="leader hidden sm:block" aria-hidden="true" />
                        <span className="label flex-shrink-0 whitespace-nowrap">
                          {formatDateRu(post.created_at)} · {getReadingTime(post.content)} мин
                        </span>
                      </div>
                    </Link>
                  ))}
                  <div className="rule-t" />
                </div>
              )}

              {/* ── Режим «полосы» ─────────────────────────────────── */}
              {viewMode === 'feed' && (
                <div>
                  {displayedPosts.map((post, i) => {
                    const cover = getPostCover(post)
                    return (
                      <article key={post.id} className="rule-t group py-10 first:border-t-0 first:pt-0">
                        <Link to={`/post/${post.id}`} className="block">
                          <div className="flex items-center gap-4">
                            <span className="folio">{String(i + 1).padStart(3, '0')}</span>
                            <span className="label">
                              {formatDateRu(post.created_at)}
                            </span>
                            {post.category && (
                              <span className="label label-tile">{post.category}</span>
                            )}
                          </div>

                          <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-12">
                            <div className={cover ? 'sm:col-span-8' : 'sm:col-span-12'}>
                              <h2 className="display text-[1.9rem] leading-[1.08] transition-colors group-hover:text-tile sm:text-[2.35rem]">
                                {getPostTitle(post)}
                              </h2>
                              <p className="mt-4 max-w-measure leading-relaxed text-ink-soft">
                                {getExcerpt(post.content, 190)}
                              </p>
                              <p className="label mt-5 transition-colors group-hover:text-tile">
                                Читать · {getReadingTime(post.content)} мин →
                              </p>
                            </div>

                            {cover && (
                              <div className="sm:col-span-4">
                                <div className="aspect-[4/3] overflow-hidden bg-paper-deep">
                                  <img
                                    src={cover}
                                    alt=""
                                    loading="lazy"
                                    className="h-full w-full object-cover grayscale transition-all duration-500 group-hover:grayscale-0"
                                    onError={(e) => {
                                      e.currentTarget.parentElement.style.display = 'none'
                                    }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </Link>
                      </article>
                    )
                  })}

                  {hasMore && (
                    <div ref={loaderRef} className="rule-t py-12 text-center">
                      <span className="label animate-pulse">Загрузка…</span>
                    </div>
                  )}

                  {!hasMore && displayedPosts.length > 0 && (
                    <div className="rule-t py-12 text-center">
                      <span className="label">Конец указателя · {validPosts.length}</span>
                    </div>
                  )}
                </div>
              )}

              {/* ── Режим «архив» ──────────────────────────────────── */}
              {viewMode === 'archive' && (
                <div className="space-y-14">
                  {grouped.map(([year, months]) => (
                    <section key={year}>
                      <h2 className="display sticky top-24 text-5xl text-ink-faint">{year}</h2>
                      <div className="mt-6 space-y-8">
                        {months.map(([month, monthPosts]) => (
                          <div key={month}>
                            <h3 className="label">{monthNameRu(month)}</h3>
                            <div className="mt-3">
                              {monthPosts.map((post) => (
                                <Link
                                  key={post.id}
                                  to={`/post/${post.id}`}
                                  className="rule-t group flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:gap-5"
                                >
                                  <span className="folio w-24 flex-shrink-0">
                                    {formatDateRu(post.created_at)}
                                  </span>
                                  <span className="font-serif text-lg transition-colors group-hover:text-tile">
                                    {getPostTitle(post)}
                                  </span>
                                </Link>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Поля страницы ───────────────────────────────────────── */}
        <aside className="lg:col-span-4">
          <div className="sticky top-28 space-y-10">
            <AuthorCard />
            <TrendingPosts limit={5} />
            <TagCloud />
            <Newsletter />
          </div>
        </aside>
      </div>
    </div>
  )
}

/** Русское окончание для слова «материал» */
function plural(n) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return ''
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'а'
  return 'ов'
}

export default Blogs
