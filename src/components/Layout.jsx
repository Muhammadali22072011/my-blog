import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import { useData } from '../context/DataContext'
import NewPostNotification from './NewPostNotification'

function Layout() {
  const { newPost, siteSettings } = useData()

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col transition-colors duration-300">
      <Navbar />
      <main className="flex-1 pb-16">
        <Outlet />
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-12 transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* О блоге */}
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                {siteSettings?.site_name || 'Muhammadali Blog'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                Профессиональный блог о технологиях, программировании и инновациях. 
                Делюсь опытом и знаниями с сообществом.
              </p>
              <div className="flex space-x-4">
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                  <span className="text-2xl">💻</span>
                </a>
                <a href="https://telegram.org" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                  <span className="text-2xl">✈️</span>
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                  <span className="text-2xl">🐦</span>
                </a>
              </div>
            </div>

            {/* Навигация */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
                Навигация
              </h3>
              <ul className="space-y-2">
                <li>
                  <a href="/" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm transition-colors">
                    Главная
                  </a>
                </li>
                <li>
                  <a href="/blogs" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm transition-colors">
                    Блог
                  </a>
                </li>
                <li>
                  <a href="/feed" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm transition-colors">
                    Лента
                  </a>
                </li>
                <li>
                  <a href="/about" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm transition-colors">
                    О нас
                  </a>
                </li>
              </ul>
            </div>

            {/* Аккаунт */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
                Аккаунт
              </h3>
              <ul className="space-y-2">
                <li>
                  <a href="/admin" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm transition-colors flex items-center gap-2">
                    <span>⚙️</span> Админ панель
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Разделитель */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
            <div className="flex justify-center items-center">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                © {new Date().getFullYear()} {siteSettings?.site_name || 'My Blog'}. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
      
      {/* Уведомление о новых постах отключено */}
      {/* <NewPostNotification newPost={newPost} /> */}
    </div>
  )
}

export default Layout
