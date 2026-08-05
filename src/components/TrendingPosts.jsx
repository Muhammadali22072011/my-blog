import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { getPostTitle, isDisplayablePost } from '../utils/postFormat'

const WEEK = 7 * 24 * 60 * 60 * 1000

/**
 * Самое читаемое за неделю.
 *
 * Раньше список лежал в useState и пересчитывался эффектом. Здесь это
 * чистая производная от posts — useMemo, без лишнего рендера.
 * Если за неделю ничего не набралось, берём просто самое просматриваемое,
 * иначе виджет исчезал на спокойных неделях.
 */
function TrendingPosts({ limit = 5 }) {
  const { posts } = useData()

  const trending = useMemo(() => {
    const published = (posts || []).filter(isDisplayablePost)
    const since = Date.now() - WEEK

    const byViews = (a, b) => (b.views || 0) - (a.views || 0)
    const recent = published.filter((p) => new Date(p.created_at).getTime() >= since)
    const pool = recent.length > 0 ? recent : published

    return [...pool].sort(byViews).slice(0, limit)
  }, [posts, limit])

  if (trending.length === 0) return null

  return (
    <section aria-labelledby="trending-heading">
      <h2 id="trending-heading" className="label rule-b pb-2">
        Читают чаще всего
      </h2>

      <ol className="mt-1">
        {trending.map((post, i) => (
          <li key={post.id}>
            <Link to={`/post/${post.id}`} className="index-row group py-3.5">
              <div className="flex items-baseline gap-3">
                <span className="folio">{String(i + 1).padStart(2, '0')}</span>
                <div className="min-w-0">
                  <h3 className="line-clamp-2 leading-snug transition-colors group-hover:text-tile">
                    {getPostTitle(post, 80)}
                  </h3>
                  <p className="label numeric mt-1">{post.views || 0} просмотров</p>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ol>
      <div className="rule-t" />
    </section>
  )
}

export default TrendingPosts
