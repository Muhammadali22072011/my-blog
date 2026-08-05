import { useMemo } from 'react'
import { useData } from '../context/DataContext'
import { isDisplayablePost } from '../utils/postFormat'

/**
 * Фильтр по рубрикам.
 *
 * Раньше у каждой рубрики был свой эмодзи из зашитого словаря — набор
 * работал только для англоязычных названий, а всё остальное получало 📄.
 * Теперь просто перечень с числом материалов.
 */
function CategoryFilter({ onFilterChange, selectedCategory = 'all' }) {
  const { posts } = useData()

  const categories = useMemo(() => {
    const published = (posts || []).filter(isDisplayablePost)
    const counts = new Map()

    for (const post of published) {
      const key = post.category || 'без рубрики'
      counts.set(key, (counts.get(key) || 0) + 1)
    }

    return [
      { name: 'all', label: 'Все', count: published.length },
      ...[...counts.entries()]
        .map(([name, count]) => ({ name, label: name, count }))
        .sort((a, b) => b.count - a.count),
    ]
  }, [posts])

  if (categories.length <= 1) return null

  return (
    <section aria-labelledby="categories-heading">
      <h2 id="categories-heading" className="label rule-b pb-2">
        Рубрики
      </h2>

      <ul className="mt-3">
        {categories.map((category) => {
          const active = selectedCategory === category.name
          return (
            <li key={category.name}>
              <button
                onClick={() => onFilterChange(category.name)}
                aria-pressed={active}
                className={`flex w-full items-baseline justify-between border-b border-ink/10 py-2.5 text-left text-sm transition-colors ${
                  active ? 'text-tile' : 'hover:text-tile'
                }`}
              >
                <span className="flex items-baseline gap-2">
                  {active && (
                    <span className="text-tile" aria-hidden="true">
                      ▸
                    </span>
                  )}
                  {category.label}
                </span>
                <span className="folio">{category.count}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export default CategoryFilter
