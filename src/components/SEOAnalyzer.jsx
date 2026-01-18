import { useState, useEffect } from 'react'
import { analyzeSEO, extractKeywords, generateMetaDescription } from '../utils/seoKeywordExtractor'

function SEOAnalyzer({ post, onKeywordsUpdate }) {
  const [analysis, setAnalysis] = useState(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    if (post && post.content) {
      const result = analyzeSEO({
        title: getTitle(post),
        description: post.excerpt || generateMetaDescription(post.content),
        content: post.content,
        image: post.og_image
      })
      setAnalysis(result)

      // Автоматически обновляем ключевые слова
      if (onKeywordsUpdate && result.keywords) {
        onKeywordsUpdate(result.keywords)
      }
    }
  }, [post, onKeywordsUpdate])

  const getTitle = (post) => {
    if (post.content) {
      const lines = post.content.split('\n')
      for (const line of lines) {
        if (line.trim().startsWith('# ')) {
          return line.trim().substring(2)
        }
      }
    }
    return post.excerpt || 'Без названия'
  }

  if (!analysis) return null

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400'
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getScoreBg = (score) => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-900/30'
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900/30'
    return 'bg-red-100 dark:bg-red-900/30'
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          SEO Анализ
        </h3>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          {showDetails ? 'Скрыть' : 'Подробнее'}
        </button>
      </div>

      {/* SEO Score */}
      <div className={`${getScoreBg(analysis.score)} rounded-lg p-4 mb-4`}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            SEO Оценка
          </span>
          <span className={`text-3xl font-bold ${getScoreColor(analysis.score)}`}>
            {analysis.score}/100
          </span>
        </div>
        <div className="mt-2 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              analysis.score >= 80 ? 'bg-green-600' :
              analysis.score >= 60 ? 'bg-yellow-600' : 'bg-red-600'
            }`}
            style={{ width: `${analysis.score}%` }}
          />
        </div>
      </div>

      {/* Keywords */}
      {analysis.keywords && analysis.keywords.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            🔑 Ключевые слова:
          </h4>
          <div className="flex flex-wrap gap-2">
            {analysis.keywords.map((keyword, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      {showDetails && (
        <>
          {/* Issues */}
          {analysis.issues && analysis.issues.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-red-700 dark:text-red-400 mb-2 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Проблемы:
              </h4>
              <ul className="space-y-1">
                {analysis.issues.map((issue, index) => (
                  <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                    <span className="text-red-500">•</span>
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggestions */}
          {analysis.suggestions && analysis.suggestions.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-yellow-700 dark:text-yellow-400 mb-2 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Рекомендации:
              </h4>
              <ul className="space-y-1">
                {analysis.suggestions.map((suggestion, index) => (
                  <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                    <span className="text-yellow-500">•</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {/* Perfect Score */}
      {analysis.score === 100 && (
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Отлично! SEO оптимизация на высшем уровне! 🎉
          </p>
        </div>
      )}
    </div>
  )
}

export default SEOAnalyzer
