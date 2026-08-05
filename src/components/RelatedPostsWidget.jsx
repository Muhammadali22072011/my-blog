import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { getPostTitle, getExcerpt, formatDateRu } from '../utils/postFormat'

/**
 * Похожие материалы.
 *
 * Здесь было две поломки:
 *
 *  1. Результат держался в useState и пересчитывался эффектом, в
 *     зависимостях которого стоял массив tags. С родительской страницы
 *     приходило `post.tags || []` — новый массив на каждый рендер, поэтому
 *     эффект срабатывал всегда, звал setRelated с новым массивом, вызывал
 *     ре-рендер и запускал себя снова. Бесконечный цикл, который грел
 *     процессор всё время, пока открыт пост. Теперь это useMemo со
 *     строковым ключом вместо массива.
 *
 *  2. Анонс собирался как `content.replace(/[*`]/g, '')` — HTML-теги
 *     не трогались, и в блоке светился сырой `<span style="color: #ef4444…`.
 *     Теперь используется общий toPlainText из postFormat.
 */
function RelatedPostsWidget({ currentPostId, category, tags }) {
  const { posts } = useData()

  // Строка вместо массива — стабильная зависимость
  const tagsKey = Array.isArray(tags) ? tags.filter(Boolean).join(',') : ''

  const related = useMemo(() => {
    const tagList = tagsKey ? tagsKey.split(',') : []

    const relevance = (post) => {
      let score = post.category === category ? 3 : 0
      if (Array.isArray(post.tags)) {
        score += post.tags.filter((t) => tagList.includes(t)).length * 2
      }
      return score
    }

    return (posts || [])
      .filter((p) => p.id !== currentPostId && p.status === 'published')
      .map((p) => ({ post: p, score: relevance(p) }))
      .filter((p) => p.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map((p) => p.post)
  }, [posts, currentPostId, category, tagsKey])

  if (related.length === 0) return null

  return (
    <section aria-labelledby="related-heading">
      <h2 id="related-heading" className="label rule-b pb-2">
        Похожее
      </h2>

      <div className="mt-1">
        {related.map((post, i) => (
          <Link key={post.id} to={`/post/${post.id}`} className="index-row group py-4">
            <div className="flex items-baseline gap-3">
              <span className="folio">{String(i + 1).padStart(2, '0')}</span>
              <div className="min-w-0">
                <h3 className="display text-lg leading-snug transition-colors group-hover:text-tile">
                  {getPostTitle(post, 70)}
                </h3>
                <p className="mt-1.5 line-clamp-2 text-sm leading-snug text-ink-soft">
                  {getExcerpt(post.content, 90)}
                </p>
                <p className="label mt-2">{formatDateRu(post.created_at)}</p>
              </div>
            </div>
          </Link>
        ))}
        <div className="rule-t" />
      </div>
    </section>
  )
}

export default RelatedPostsWidget
