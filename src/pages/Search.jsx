import { useState, useMemo, useDeferredValue } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../context/DataContext'
import SEOHead from '../components/SEOHead'
import {
  getPostTitle,
  getExcerpt,
  toPlainText,
  formatDateRu,
  isDisplayablePost,
} from '../utils/postFormat'

/**
 * Поиск по материалам, профилю и странице «Об авторе».
 *
 * Ввод обёрнут в useDeferredValue: перебор всех текстов на каждое
 * нажатие клавиши подтормаживал поле ввода.
 */
function Search() {
  const { posts, profile, aboutMePage } = useData()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [sortBy, setSortBy] = useState('relevance')

  const deferredQuery = useDeferredValue(query)

  const categories = useMemo(
    () => [
      'all',
      ...new Set((posts || []).filter(isDisplayablePost).map((p) => p.category).filter(Boolean)),
    ],
    [posts]
  )

  const results = useMemo(() => {
    const needle = deferredQuery.trim().toLowerCase()
    if (!needle) return []

    const found = []

    if (profile) {
      const text = `${profile.name || ''} ${profile.position || ''} ${
        profile.about_me || profile.aboutMe || ''
      }`.toLowerCase()
      if (text.includes(needle)) {
        found.push({
          id: 'home',
          kind: 'Страница',
          title: profile.name || 'Главная',
          excerpt: profile.about_me || profile.aboutMe || '',
          url: '/',
          category: 'page',
          date: null,
          score: 5,
        })
      }
    }

    if (aboutMePage) {
      const text = `${aboutMePage.title || ''} ${aboutMePage.content || ''} ${
        aboutMePage.skills?.join(' ') || ''
      }`.toLowerCase()
      if (text.includes(needle)) {
        found.push({
          id: 'about',
          kind: 'Страница',
          title: aboutMePage.title || 'Об авторе',
          excerpt: toPlainText(aboutMePage.content).slice(0, 160),
          url: '/about',
          category: 'page',
          date: null,
          score: 5,
        })
      }
    }

    for (const post of (posts || []).filter(isDisplayablePost)) {
      const title = getPostTitle(post)
      const inTitle = title.toLowerCase().includes(needle)
      const inBody = post.content.toLowerCase().includes(needle)
      const inCategory = (post.category || '').toLowerCase().includes(needle)
      if (!inTitle && !inBody && !inCategory) continue

      found.push({
        id: post.id,
        kind: 'Материал',
        title,
        excerpt: getExcerpt(post.content, 170),
        url: `/post/${post.id}`,
        category: post.category,
        date: post.created_at,
        views: post.views || 0,
        // Совпадение в заголовке важнее совпадения в теле
        score: (inTitle ? 10 : 0) + (inCategory ? 3 : 0) + (inBody ? 1 : 0),
      })
    }

    const filtered = category === 'all' ? found : found.filter((r) => r.category === category)

    return [...filtered].sort((a, b) => {
      if (sortBy === 'date') return new Date(b.date || 0) - new Date(a.date || 0)
      if (sortBy === 'views') return (b.views || 0) - (a.views || 0)
      return b.score - a.score
    })
  }, [deferredQuery, category, sortBy, posts, profile, aboutMePage])

  const stale = query !== deferredQuery

  return (
    <div className="mx-auto max-w-4xl px-5 sm:px-8">
      <SEOHead title="Поиск" description="Поиск по материалам блога." />

      <header className="pb-10 pt-16 sm:pt-24">
        <p className="label">По материалам, профилю и странице об авторе</p>
        <h1 className="display mt-3 text-[clamp(2.5rem,9vw,6rem)]">Поиск</h1>

        <div className="mt-12">
          <label htmlFor="q" className="label">
            Запрос
          </label>
          <input
            id="q"
            type="search"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="слово, тема, имя…"
            className="mt-2 w-full border-0 border-b border-ink/25 bg-transparent px-0 py-3 text-2xl outline-none transition-colors placeholder:text-ink-faint focus:border-tile"
          />
        </div>

        {query.trim() && (
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <span className="label text-ink-faint">
              Найдено: {results.length}
              {stale && ' …'}
            </span>

            {categories.length > 1 && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="label text-ink-faint">Рубрика:</span>
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    aria-pressed={category === c}
                    className={`label link-wipe ${category === c ? 'text-tile' : ''}`}
                  >
                    {c === 'all' ? 'все' : c}
                  </button>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="label text-ink-faint">Порядок:</span>
              {[
                ['relevance', 'по совпадению'],
                ['date', 'по дате'],
                ['views', 'по просмотрам'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setSortBy(value)}
                  aria-pressed={sortBy === value}
                  className={`label link-wipe ${sortBy === value ? 'text-tile' : ''}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      <div className="pb-24">
        {!query.trim() ? (
          <p className="rule-t py-16 text-center text-ink-soft">
            Начните вводить запрос — результаты появятся сразу.
          </p>
        ) : results.length === 0 ? (
          <div className="rule-t py-20 text-center">
            <p className="display text-3xl text-ink-faint">Ничего не найдено</p>
            <p className="mt-3 text-ink-soft">
              Попробуйте другое слово или загляните в{' '}
              <Link to="/blogs" className="link-wipe text-tile">
                указатель
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className={`pl-5 transition-opacity ${stale ? 'opacity-60' : ''}`}>
            {results.map((r, i) => (
              <Link key={`${r.kind}-${r.id}`} to={r.url} className="index-row group">
                <div className="flex items-baseline gap-5">
                  <span className="folio w-10 flex-shrink-0">
                    {String(i + 1).padStart(3, '0')}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span className="label label-tile">{r.kind}</span>
                      {r.date && <span className="label">{formatDateRu(r.date)}</span>}
                    </div>
                    <h2 className="display mt-1.5 text-xl leading-snug transition-colors group-hover:text-tile sm:text-2xl">
                      {r.title}
                    </h2>
                    {r.excerpt && (
                      <p className="mt-2 text-sm leading-relaxed text-ink-soft">{r.excerpt}</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
            <div className="rule-t" />
          </div>
        )}
      </div>
    </div>
  )
}

export default Search
