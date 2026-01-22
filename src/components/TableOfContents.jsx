import { useState, useEffect } from 'react'

function TableOfContents({ content }) {
  const [headings, setHeadings] = useState([])
  const [activeId, setActiveId] = useState('')
  const [readingProgress, setReadingProgress] = useState(0)

  useEffect(() => {
    // Извлекаем заголовки из Markdown контента
    if (!content) return
    
    const lines = content.split('\n')
    const headingsArray = []
    
    lines.forEach((line, index) => {
      const trimmed = line.trim()
      if (trimmed.startsWith('#')) {
        const level = trimmed.match(/^#+/)[0].length
        const text = trimmed.replace(/^#+\s*/, '').trim()
        
        if (text && level <= 3) { // Только h1, h2, h3
          const id = `heading-${text.toLowerCase().replace(/[^a-zа-я0-9]+/gi, '-')}`
          headingsArray.push({
            id,
            text,
            level
          })
        }
      }
    })
    
    setHeadings(headingsArray)
  }, [content])

  useEffect(() => {
    // Добавляем ID к заголовкам на странице
    headings.forEach(({ id, text }) => {
      const allHeadings = document.querySelectorAll('h1, h2, h3, h4, h5, h6')
      allHeadings.forEach(heading => {
        if (heading.textContent.trim() === text && !heading.id) {
          heading.id = id
        }
      })
    })
  }, [headings])

  useEffect(() => {
    // Отслеживание прогресса чтения
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0
      setReadingProgress(Math.round(progress))
      
      // Определяем активный заголовок
      let currentActive = ''
      headings.forEach(({ id }) => {
        const element = document.getElementById(id)
        if (element) {
          const rect = element.getBoundingClientRect()
          if (rect.top <= 150 && rect.top >= -100) {
            currentActive = id
          }
        }
      })
      
      if (currentActive) {
        setActiveId(currentActive)
      }
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // Вызываем сразу
    
    return () => window.removeEventListener('scroll', handleScroll)
  }, [headings])

  if (headings.length === 0) return null

  return (
    <nav className="sticky top-24 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 max-h-[calc(100vh-120px)] overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">
          Оглавление
        </h3>
        <div className="relative w-10 h-10 flex-shrink-0">
          <svg className="transform -rotate-90 w-10 h-10">
            <circle
              cx="20"
              cy="20"
              r="16"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
              className="text-gray-200 dark:text-gray-700"
            />
            <circle
              cx="20"
              cy="20"
              r="16"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 16}`}
              strokeDashoffset={`${2 * Math.PI * 16 * (1 - readingProgress / 100)}`}
              className="text-blue-600 dark:text-blue-400 transition-all duration-300"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] font-bold text-gray-900 dark:text-white">
              {readingProgress}%
            </span>
          </div>
        </div>
      </div>
      
      <ul className="space-y-1">
        {headings.map((heading) => (
          <li
            key={heading.id}
            style={{ paddingLeft: `${(heading.level - 1) * 12}px` }}
          >
            <a
              href={`#${heading.id}`}
              className={`block text-xs py-1.5 px-2 rounded transition-all ${
                activeId === heading.id
                  ? 'text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
              onClick={(e) => {
                e.preventDefault()
                const element = document.getElementById(heading.id)
                if (element) {
                  const yOffset = -100
                  const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset
                  window.scrollTo({ top: y, behavior: 'smooth' })
                }
              }}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default TableOfContents
