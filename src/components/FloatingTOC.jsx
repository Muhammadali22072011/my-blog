import { useState, useEffect } from 'react'

function FloatingTOC({ content }) {
  const [headings, setHeadings] = useState([])
  const [activeId, setActiveId] = useState('')
  const [progress, setProgress] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!content) return

    const lines = content.split('\n')
    const parsed = []
    
    lines.forEach((line, index) => {
      const match = line.match(/^(#{1,3})\s+(.+)$/)
      if (match) {
        const level = match[1].length
        const text = match[2].trim()
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        parsed.push({ id, text, level, index })
      }
    })

    setHeadings(parsed)
  }, [content])

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 300)
      
      // Progress
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0
      setProgress(Math.min(scrollPercent, 100))

      // Active heading
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveId(entry.target.id)
            }
          })
        },
        { rootMargin: '-100px 0px -66%' }
      )

      headings.forEach(({ id }) => {
        const element = document.getElementById(id)
        if (element) observer.observe(element)
      })

      return () => observer.disconnect()
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [headings])

  const scrollToHeading = (id) => {
    const element = document.getElementById(id)
    if (element) {
      const offset = 100
      const top = element.getBoundingClientRect().top + window.scrollY - offset
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }

  if (headings.length < 2 || !isVisible) return null

  return (
    <div className="fixed right-8 top-1/2 -translate-y-1/2 z-40 hidden xl:block">
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-gray-200 dark:border-gray-700 max-w-xs">
        {/* Progress Circle */}
        <div className="flex items-center justify-center mb-4">
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                className="text-gray-200 dark:text-gray-700"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 28}`}
                strokeDashoffset={`${2 * Math.PI * 28 * (1 - progress / 100)}`}
                className="text-blue-600 transition-all duration-300"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                {Math.round(progress)}%
              </span>
            </div>
          </div>
        </div>

        {/* Headings */}
        <nav className="space-y-1 max-h-96 overflow-y-auto">
          {headings.map(({ id, text, level }) => (
            <button
              key={id}
              onClick={() => scrollToHeading(id)}
              className={`
                block w-full text-left text-xs py-1.5 px-2 rounded-lg transition-all
                ${level === 2 ? 'ml-2' : level === 3 ? 'ml-4' : ''}
                ${activeId === id 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium shadow-lg scale-105' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                }
              `}
            >
              {text}
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}

export default FloatingTOC
