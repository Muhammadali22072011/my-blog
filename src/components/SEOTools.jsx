import { useState } from 'react'
import { downloadSitemap, downloadRobotsTxt } from '../utils/sitemapGenerator'
import toast from 'react-hot-toast'

function SEOTools({ posts }) {
  const [showTools, setShowTools] = useState(false)

  const handleDownloadSitemap = () => {
    try {
      downloadSitemap(posts)
      toast.success('sitemap.xml скачан!')
    } catch (error) {
      toast.error('Ошибка при создании sitemap')
    }
  }

  const handleDownloadRobots = () => {
    try {
      downloadRobotsTxt()
      toast.success('robots.txt скачан!')
    } catch (error) {
      toast.error('Ошибка при создании robots.txt')
    }
  }

  const publishedPosts = posts.filter(p => p.status === 'published')
  const totalWords = publishedPosts.reduce((sum, post) => {
    return sum + (post.content ? post.content.split(/\s+/).length : 0)
  }, 0)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          SEO Инструменты
        </h3>
        <button
          onClick={() => setShowTools(!showTools)}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          {showTools ? 'Скрыть' : 'Показать'}
        </button>
      </div>

      {showTools && (
        <div className="space-y-4">
          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {publishedPosts.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Опубликовано
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {totalWords.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Всего слов
              </div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {Math.round(totalWords / Math.max(publishedPosts.length, 1))}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Средняя длина
              </div>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {posts.filter(p => p.og_image).length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                С OG Image
              </div>
            </div>
          </div>

          {/* Tools */}
          <div className="space-y-2">
            <button
              onClick={handleDownloadSitemap}
              className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Скачать sitemap.xml
            </button>

            <button
              onClick={handleDownloadRobots}
              className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Скачать robots.txt
            </button>
          </div>

          {/* Tips */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-400 mb-2 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Совет:
            </h4>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              После скачивания разместите sitemap.xml и robots.txt в корне вашего сайта. 
              Затем добавьте sitemap в Google Search Console и Yandex Webmaster.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default SEOTools
