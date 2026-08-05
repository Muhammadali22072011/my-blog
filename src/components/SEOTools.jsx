import { useState } from 'react'
import { generateSitemap, generateRobotsTxt } from '../utils/sitemapGenerator'

function SEOTools({ posts }) {
  const [siteUrl, setSiteUrl] = useState('https://izzatullaev.uz')
  const [showSitemap, setShowSitemap] = useState(false)
  const [showRobots, setShowRobots] = useState(false)

  const handleGenerateSitemap = () => {
    const sitemap = generateSitemap(posts, siteUrl)
    
    // Создаем blob и скачиваем файл
    const blob = new Blob([sitemap], { type: 'application/xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sitemap.xml'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    setShowSitemap(true)
  }

  const handleGenerateRobots = () => {
    const robots = generateRobotsTxt(siteUrl)
    
    // Создаем blob и скачиваем файл
    const blob = new Blob([robots], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'robots.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    setShowRobots(true)
  }

  const handleCopyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text)
    alert(`${type} скопирован в буфер обмена!`)
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="bg-paper-deep rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">🚀 SEO Инструменты</h2>
        <p className="text-blue-100">Генерация sitemap.xml и robots.txt для поисковых систем</p>
      </div>

      {/* URL сайта */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          URL вашего сайта
        </label>
        <input
          type="url"
          value={siteUrl}
          onChange={(e) => setSiteUrl(e.target.value)}
          placeholder="https://izzatullaev.uz"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        />
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Укажите полный URL вашего сайта (с https://)
        </p>
      </div>

      {/* Кнопки генерации */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sitemap */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center mb-4">
            <div className="text-4xl mr-4">🗺️</div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Sitemap.xml</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Карта сайта для Google/Yandex</p>
            </div>
          </div>
          <button
            onClick={handleGenerateSitemap}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Скачать sitemap.xml
          </button>
          {showSitemap && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-800 dark:text-green-200">
                ✅ Sitemap сгенерирован! Загрузите файл в корень сайта.
              </p>
            </div>
          )}
        </div>

        {/* Robots.txt */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center mb-4">
            <div className="text-4xl mr-4">🤖</div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Robots.txt</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Правила для поисковых роботов</p>
            </div>
          </div>
          <button
            onClick={handleGenerateRobots}
            className="w-full px-4 py-2 bg-tile text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            Скачать robots.txt
          </button>
          {showRobots && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-800 dark:text-green-200">
                ✅ Robots.txt сгенерирован! Загрузите файл в корень сайта.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Инструкция */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-yellow-900 dark:text-yellow-200 mb-3">📋 Инструкция</h3>
        <ol className="space-y-2 text-sm text-yellow-800 dark:text-yellow-300">
          <li>1. Скачайте sitemap.xml и robots.txt</li>
          <li>2. Загрузите их в корневую папку вашего сайта (public/)</li>
          <li>3. Проверьте доступность: {siteUrl}/sitemap.xml</li>
          <li>4. Зарегистрируйте сайт в Google Search Console</li>
          <li>5. Добавьте sitemap в Search Console</li>
          <li>6. Зарегистрируйте сайт в Yandex Webmaster</li>
          <li>7. Добавьте sitemap в Yandex Webmaster</li>
        </ol>
      </div>

      {/* Статистика */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">📊 Статистика</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{posts.length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Всего постов</div>
          </div>
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {posts.filter(p => p.status === 'published').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Опубликовано</div>
          </div>
          <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="text-3xl font-bold text-tile dark:text-purple-400">
              {new Set(posts.map(p => p.category)).size}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Категорий</div>
          </div>
          <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
              {posts.reduce((sum, p) => sum + (p.views || 0), 0)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Просмотров</div>
          </div>
        </div>
      </div>

      {/* Ключевые слова для SEO */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">🔑 Рекомендуемые ключевые слова</h3>
        <div className="flex flex-wrap gap-2">
          {[
            'Мухаммадали Иззатуллаев',
            'IT блог Навои',
            'Программирование Узбекистан',
            'Frontend разработка',
            'React JavaScript',
            'Веб-разработка',
            'IT обучение',
            'Навои Узбекистан',
            'Разработчик',
            'Coding tutorial'
          ].map((keyword, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium"
            >
              {keyword}
            </span>
          ))}
        </div>
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          Используйте эти ключевые слова в заголовках и описаниях ваших постов
        </p>
      </div>
    </div>
  )
}

export default SEOTools
