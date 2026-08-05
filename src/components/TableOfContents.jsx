import { useState, useEffect, useMemo } from 'react'
import { slugify } from '../utils/markdownRenderer.jsx'

/**
 * Оглавление материала.
 *
 * Что исправлено:
 *
 *  1. Якоря считались по собственной схеме (`heading-…`) и не совпадали
 *     с теми, что ставит рендерер, — ссылки в оглавлении не работали.
 *     Обе стороны теперь зовут одну функцию slugify.
 *  2. Идентификаторы дописывались в DOM через setTimeout(500) и полный
 *     перебор всех h1–h6 со сравнением текста. Костыль убран целиком:
 *     заголовки приходят с id прямо из рендерера.
 *  3. Активный пункт определялся слушателем прокрутки, который на каждое
 *     событие обходил все заголовки с getBoundingClientRect. Заменено на
 *     IntersectionObserver.
 *  4. Убраны console.log на каждый найденный заголовок.
 */
function TableOfContents({ content }) {
  const [activeId, setActiveId] = useState('')
  const [progress, setProgress] = useState(0)

  const headings = useMemo(() => {
    if (!content) return []

    const found = []
    for (const line of content.split('\n')) {
      const match = line.trim().match(/^(#{1,3})\s+(.+)$/)
      if (!match) continue

      const text = match[2].trim()
      if (!text) continue

      found.push({ id: slugify(text), text, level: match[1].length })
    }

    // Первый заголовок — название материала, оно уже выведено как h1 страницы
    return found.length > 1 && found[0].level === 1 ? found.slice(1) : found
  }, [content])

  useEffect(() => {
    if (headings.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActiveId(visible[0].target.id)
      },
      { rootMargin: '-96px 0px -70% 0px', threshold: 0 }
    )

    // Заголовки появляются вместе с текстом — ждём кадр отрисовки
    const frame = requestAnimationFrame(() => {
      for (const { id } of headings) {
        const el = document.getElementById(id)
        if (el) observer.observe(el)
      }
    })

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [headings])

  useEffect(() => {
    let frame = null

    const onScroll = () => {
      if (frame !== null) return
      frame = requestAnimationFrame(() => {
        frame = null
        const docHeight = document.documentElement.scrollHeight - window.innerHeight
        setProgress(
          docHeight > 0 ? Math.round(Math.min((window.scrollY / docHeight) * 100, 100)) : 0
        )
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame !== null) cancelAnimationFrame(frame)
    }
  }, [])

  if (headings.length === 0) return null

  return (
    <nav aria-labelledby="toc-heading" className="max-h-[calc(100vh-9rem)] overflow-y-auto">
      <div className="rule-b flex items-baseline justify-between pb-2">
        <h2 id="toc-heading" className="label">
          Оглавление
        </h2>
        <span className="folio numeric">{progress}%</span>
      </div>

      <ol className="mt-4 space-y-2.5">
        {headings.map((heading, i) => (
          <li key={`${heading.id}-${i}`} style={{ paddingLeft: `${(heading.level - 1) * 14}px` }}>
            <a
              href={`#${heading.id}`}
              aria-current={activeId === heading.id ? 'true' : undefined}
              className={`block text-sm leading-snug transition-colors ${
                activeId === heading.id ? 'text-tile' : 'text-ink-soft hover:text-ink'
              }`}
              onClick={(e) => {
                const el = document.getElementById(heading.id)
                if (!el) return
                e.preventDefault()
                const y = el.getBoundingClientRect().top + window.scrollY - 96
                window.scrollTo({ top: y, behavior: 'smooth' })
                history.replaceState(null, '', `#${heading.id}`)
              }}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}

export default TableOfContents
