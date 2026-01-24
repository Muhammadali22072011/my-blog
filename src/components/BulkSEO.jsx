import { useState } from 'react'
import { extractKeywords, generateMetaDescription, analyzeSEO } from '../utils/seoKeywordExtractor'

function BulkSEO({ posts, onUpdatePost }) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState([])
  const [showResults, setShowResults] = useState(false)

  // Массовая автоматическая оптимизация всех постов
  const handleBulkOptimize = async () => {
    if (!window.confirm(`Применить автоматическую SEO оптимизацию ко всем ${posts.length} постам?`)) {
      return
    }

    setIsProcessing(true)
    setProgress(0)
    setResults([])
    setShowResults(true)

    const optimizationResults = []

    for (let i = 0; i < posts.length; i++) {
      const post = posts[i]
      
      try {
        // Извлекаем БОЛЬШЕ ключевых слов (50 вместо 10)
        const keywords = extractKeywords(post.content, 50)
        
        // Генерируем мета-описание
        const metaDescription = generateMetaDescription(post.content, 160)
        
        // Создаем SEO заголовок
        let seoTitle = post.title
        if (seoTitle.length > 60) {
          seoTitle = seoTitle.substring(0, 57) + '...'
        }
        
        // Добавляем МАКСИМУМ ключевых слов
        const enhancedKeywords = [
          'Мухаммадали Иззатуллаев',
          'Muhammadali Izzatullaev',
          'IT блог',
          'Навои Узбекистан',
          'Navoiy Uzbekistan',
          'программирование',
          'разработка',
          'frontend',
          'backend',
          'JavaScript',
          'React',
          'Node.js',
          'веб-разработка',
          'web development',
          'coding',
          'IT Узбекистан',
          'developer',
          'программист',
          ...keywords
        ]
        
        // Анализируем SEO
        const analysis = analyzeSEO(post)
        
        // Обновляем пост
        await onUpdatePost(post.id, {
          seo_title: seoTitle,
          seo_description: metaDescription,
          seo_keywords: enhancedKeywords,
          canonical_url: `https://izzatullaev.uz/post/${post.id}`
        })
        
        optimizationResults.push({
          id: post.id,
          title: post.title,
          status: 'success',
          score: analysis.score,
          keywords: enhancedKeywords.length
        })
      } catch (error) {
        console.error(`Ошибка оптимизации поста ${post.id}:`, error)
        optimizationResults.push({
          id: post.id,
          title: post.title,
          status: 'error',
          error: error.message
        })
      }
      
      // Обновляем прогресс
      setProgress(Math.round(((i + 1) / posts.length) * 100))
      setResults([...optimizationResults])
      
      // Небольшая задержка чтобы не перегружать сервер
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    setIsProcessing(false)
    alert(`✅ Оптимизация завершена! Обработано ${posts.length} постов`)
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">⚡ Массовая SEO оптимизация</h2>
        <p className="text-purple-100">Автоматическая оптимизация всех постов одной кнопкой</p>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{posts.length}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Всего постов</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <div className="text-3xl font-bold text-green-600 dark:text-green-400">
            {posts.filter(p => p.seo_title).length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">С SEO</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
            {posts.filter(p => !p.seo_title).length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Без SEO</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
            {posts.filter(p => p.status === 'published').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Опубликовано</div>
        </div>
      </div>

      {/* Кнопка запуска */}
      <button
        onClick={handleBulkOptimize}
        disabled={isProcessing || posts.length === 0}
        className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 font-bold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
      >
        {isProcessing ? (
          <>
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            Оптимизация... {progress}%
          </>
        ) : (
          <>
            <span className="text-2xl">🚀</span>
            Оптимизировать все посты автоматически
          </>
        )}
      </button>

      {/* Прогресс бар */}
      {isProcessing && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Обработка постов...
            </span>
            <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
              {progress}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-600 to-pink-600 h-4 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Результаты */}
      {showResults && results.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              📊 Результаты оптимизации
            </h3>
            <button
              onClick={() => setShowResults(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  result.status === 'success'
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {result.title}
                    </div>
                    {result.status === 'success' && (
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        SEO Score: {result.score}/100 | Ключевых слов: {result.keywords}
                      </div>
                    )}
                    {result.status === 'error' && (
                      <div className="text-sm text-red-600 dark:text-red-400 mt-1">
                        Ошибка: {result.error}
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    {result.status === 'success' ? (
                      <span className="text-2xl">✅</span>
                    ) : (
                      <span className="text-2xl">❌</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Итоговая статистика */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {results.filter(r => r.status === 'success').length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Успешно</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {results.filter(r => r.status === 'error').length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Ошибок</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Информация */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-3">ℹ️ Что будет сделано:</h4>
        <ul className="list-disc list-inside space-y-2 text-sm text-blue-800 dark:text-blue-300">
          <li>Автоматическое извлечение ключевых слов из каждого поста</li>
          <li>Генерация SEO заголовков (до 60 символов)</li>
          <li>Создание мета-описаний (до 160 символов)</li>
          <li>Добавление ключевых слов: "Мухаммадали Иззатуллаев", "IT Навои", "Узбекистан"</li>
          <li>Создание канонических URL для каждого поста</li>
          <li>Анализ SEO качества каждого поста</li>
        </ul>
      </div>
    </div>
  )
}

export default BulkSEO
