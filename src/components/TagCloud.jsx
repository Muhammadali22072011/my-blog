import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { isDisplayablePost } from '../utils/postFormat'

/**
 * Метки.
 *
 * Вместо радужных «пилюль» — перечень с частотой, набранный
 * моноширинным. Вес метки показан числом, а не размером кегля:
 * шесть градаций цвета и восемь размеров читались как шум.
 */
function TagCloud({ limit = 20 }) {
  const { posts } = useData()

  const tags = useMemo(() => {
    const counts = new Map()

    for (const post of (posts || []).filter(isDisplayablePost)) {
      for (const tag of post.tags || []) {
        const key = String(tag).trim()
        if (!key) continue
        counts.set(key, (counts.get(key) || 0) + 1)
      }
    }

    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .slice(0, limit)
  }, [posts, limit])

  if (tags.length === 0) return null

  return (
    <section aria-labelledby="tags-heading">
      <h2 id="tags-heading" className="label rule-b pb-2">
        Метки
      </h2>

      <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
        {tags.map((tag) => (
          <li key={tag.name}>
            <Link
              to={`/blogs?tag=${encodeURIComponent(tag.name)}`}
              className="link-wipe inline-flex items-baseline gap-1.5 text-sm hover:text-tile"
            >
              <span>{tag.name}</span>
              <span className="folio">{tag.count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default TagCloud
