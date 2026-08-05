import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useData } from '../context/DataContext'
import SEOHead from '../components/SEOHead'
import {
  getPostTitle,
  getExcerpt,
  getReadingTime,
  formatDateRu,
  monthNameRu,
  isDisplayablePost,
} from '../utils/postFormat'

/**
 * Новости: хроника по месяцам. Год — крупной колонцифрой на полях,
 * записи — строками с датой слева.
 */
function News() {
  const { posts, loading, error } = useData()

  const newsPosts = useMemo(
    () =>
      (posts || [])
        .filter((p) => isDisplayablePost(p) && p.category === 'news')
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    [posts]
  )

  // Группировка без мутации исходных массивов
  const grouped = useMemo(() => {
    const byYear = new Map()
    for (const post of newsPosts) {
      const date = new Date(post.created_at)
      const year = date.getFullYear()
      const month = date.getMonth()
      if (!byYear.has(year)) byYear.set(year, new Map())
      const months = byYear.get(year)
      if (!months.has(month)) months.set(month, [])
      months.get(month).push(post)
    }
    return [...byYear.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([year, months]) => [year, [...months.entries()].sort((a, b) => b[0] - a[0])])
  }, [newsPosts])

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-5 pt-20 sm:px-8">
        <div className="skeleton h-3 w-24" />
        <div className="skeleton mt-6 h-14 w-2/5" />
        <div className="mt-14 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton h-5" style={{ width: `${90 - i * 8}%` }} />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-32 text-center sm:px-8">
        <p className="label text-terra">Ошибка загрузки</p>
        <h1 className="display mt-4 text-4xl">Новости недоступны</h1>
        <p className="mt-4 text-ink-soft">{error}</p>
        <button onClick={() => window.location.reload()} className="btn-primary mt-8">
          Повторить
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-5 sm:px-8">
      <SEOHead title="Новости" description="Хроника блога: короткие заметки и объявления." />

      <header className="pb-12 pt-16 sm:pt-24">
        <p className="label">
          {newsPosts.length} {newsPosts.length === 1 ? 'запись' : 'записей'}
        </p>
        <h1 className="display mt-3 text-[clamp(2.5rem,9vw,6rem)]">Новости</h1>
      </header>

      {newsPosts.length === 0 ? (
        <div className="rule-t py-24 text-center">
          <p className="display text-3xl text-ink-faint">Пока тихо</p>
          <p className="mt-3 text-ink-soft">
            Материалы этой рубрики появятся здесь. Загляните в{' '}
            <Link to="/blogs" className="link-wipe text-tile">
              указатель
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="space-y-16 pb-24">
          {grouped.map(([year, months]) => (
            <section key={year} className="grid grid-cols-12 gap-6">
              <div className="col-span-12 lg:col-span-2">
                <h2 className="display sticky top-28 text-5xl text-ink-faint">{year}</h2>
              </div>

              <div className="col-span-12 lg:col-span-10">
                {months.map(([month, monthPosts]) => (
                  <div key={month} className="mb-10">
                    <h3 className="label rule-b pb-2">{monthNameRu(month)}</h3>

                    <div className="pl-5">
                      {monthPosts.map((post) => (
                        <Link key={post.id} to={`/post/${post.id}`} className="index-row group">
                          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-baseline sm:gap-5">
                            <span className="folio w-28 flex-shrink-0">
                              {formatDateRu(post.created_at)}
                            </span>
                            <div className="min-w-0 flex-1">
                              <h4 className="display text-xl leading-snug transition-colors group-hover:text-tile">
                                {getPostTitle(post)}
                              </h4>
                              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                                {getExcerpt(post.content, 140)}
                              </p>
                            </div>
                            <span className="label flex-shrink-0 whitespace-nowrap">
                              {getReadingTime(post.content)} мин
                            </span>
                          </div>
                        </Link>
                      ))}
                      <div className="rule-t" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

export default News
