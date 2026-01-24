import { useState } from 'react'
import { extractKeywords, generateMetaDescription, analyzeSEO } from '../utils/seoKeywordExtractor'

function AutoSEO({ post, onUpdate }) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [seoData, setSeoData] = useState(null)
  const [showPreview, setShowPreview] = useState(false)

  // Автоматическая генерация SEO
  const handleAutoGenerate = async () => {
    setIsProcessing(true)
    
    try {
      // Извлекаем ключевые слова
      const keywords = extractKeywords(post.content, 10)
      
      // Генерируем мета-описание
      const metaDescription = generateMetaDescription(post.content, 160)
      
      // Создаем SEO заголовок (первые 60 символов заголовка)
      let seoTitle = post.title
      if (seoTitle.length > 60) {
        seoTitle = seoTitle.substring(0, 57) + '...'
      }
      
      // Добавляем ключевые слова для Узбекистана и IT
      const enhancedKeywords = [
        'Мухаммадали Иззатуллаев',
        'IT блог',
        'Навои Узбекистан',
        'программирование',
        ...keywords
      ]
      
      // Анализируем SEO качество
      const analysis = analyzeSEO(post)
      
      const generatedSEO = {
        seo_title: seoTitle,
        seo_description: metaDescription,
        seo_keywords: enhancedKeywords,
        canonical_url: `https://izzatullaev.uz/post/${post.id}`,
        analysis: analysis
      }
      
      setSeoData(generatedSEO)
      setShowPreview(true)
    } catch (error) {
      console.error('Ошибка генерации SEO:', error)
      alert('Ошибка при генерации SEO данных')
    } finally {
      setIsProcessing(false)
    }
  }

  // Применить SEO данные
  const handleApply = async () => {
    if (!seoData) return
    
    setIsProcessing(true)
    try {
      await onUpdate(post.id, {
        seo_title: seoData.seo_title,
        seo_description: seoData.seo_description,
        seo_keywords: seoData.seo_keywords,
        canonical_url: seoData.canonical_url
      })
      
      alert('✅ SEO оптимизация применена!')
      setShowPreview(false)
      setSeoData(null)
    } catch (error) {
      console.error('Ошибка применения SEO:', error)
      alert('Ошибка при применении SEO данных')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Кнопка автоматической генерации */}
      <button
        onClick={handleAutoGenerate}
        disabled={isProcessing}
        className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isProcessing ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            Генерация SEO...
          </>
        ) : (
          <>
            <span className="text-xl">🚀</span>
            Автоматическая SEO оптимизация
          </>
        )}
      </button>

      {/* Превью сгенерированных данных */}
      {showPreview && seoData && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border-2 border-blue-500 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              📊 Сгенерированные SEO данные
            </h3>
            <button
              onClick={() => setShowPreview(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>

          {/* SEO Score */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">SEO Оценка</span>
              <span className={`text-2xl font-bold ${
                seoData.analysis.score >= 80 ? 'text-green-600' :
                seoData.analysis.score >= 60 ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {seoData.analysis.score}/100
              </span>
            </div>
          </div>

          {/* SEO Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              SEO Заголовок ({seoData.seo_title.length}/60)
            </label>
            <input
              type="text"
              value={seoData.seo_title}
              onChange={(e) => setSeoData({...seoData, seo_title: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              maxLength={60}
            />
          </div>

          {/* SEO Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              SEO Описание ({seoData.seo_description.length}/160)
            </label>
            <textarea
              value={seoData.seo_description}
              onChange={(e) => setSeoData({...seoData, seo_description: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              rows={3}
              maxLength={160}
            />
          </div>

          {/* Keywords */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ключевые слова ({seoData.seo_keywords.length})
            </label>
            <div className="flex flex-wrap gap-2">
              {seoData.seo_keywords.map((keyword, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>

          {/* Issues & Suggestions */}
          {seoData.analysis.issues.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <h4 className="font-medium text-red-900 dark:text-red-200 mb-2">⚠️ Проблемы:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-red-800 dark:text-red-300">
                {seoData.analysis.issues.map((issue, index) => (
                  <li key={index}>{issue}</li>
                ))}
              </ul>
            </div>
          )}

          {seoData.analysis.suggestions.length > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 dark:text-yellow-200 mb-2">💡 Рекомендации:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800 dark:text-yellow-300">
                {seoData.analysis.suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Кнопки действий */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleApply}
              disabled={isProcessing}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ✅ Применить SEO
            </button>
            <button
              onClick={() => setShowPreview(false)}
              className="px-6 py-3 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors font-medium"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Информация */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2">ℹ️ Что делает автоматическая оптимизация?</h4>
        <ul className="list-disc list-inside space-y-1 text-sm text-blue-800 dark:text-blue-300">
          <li>Извлекает ключевые слова из контента</li>
          <li>Генерирует SEO заголовок (до 60 символов)</li>
          <li>Создает мета-описание (до 160 символов)</li>
          <li>Добавляет ключевые слова: "Мухаммадали Иззатуллаев", "IT Навои", "Узбекистан"</li>
          <li>Анализирует качество SEO (оценка 0-100)</li>
          <li>Дает рекомендации по улучшению</li>
        </ul>
      </div>
    </div>
  )
}

export default AutoSEO
