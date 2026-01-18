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
      <footer className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-8 transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            © {new Date().getFullYear()} {siteSettings?.site_name || 'Muhammadali Blog'}. All rights reserved.
          </p>
        </div>
      </footer>
      
      <NewPostNotification newPost={newPost} />
    </div>
  )
}

export default Layout
