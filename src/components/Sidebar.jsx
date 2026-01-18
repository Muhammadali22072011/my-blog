import { Link, useLocation } from 'react-router-dom'
import { translations } from '../translations'

function Sidebar() {
  const location = useLocation()
  const t = translations.en

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/blogs', label: t.blogs },
    { path: '/news', label: t.news },
    { path: '/register', label: t.register },
    { path: '/admin', label: t.admin }
  ]

  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen p-6">
      {/* Logo */}
      <div className="mb-12">
        <h1 className="text-2xl font-bold text-black">{t.muhammadaliBlog}</h1>
      </div>

      {/* Navigation */}
      <nav className="space-y-1 mb-12">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`block px-4 py-3 text-sm transition-colors duration-200 ${
              location.pathname === item.path
                ? 'text-black border-l-2 border-black'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Contacts */}
      <div className="absolute bottom-8 left-6 right-6">
        <div className="border-t border-gray-200 pt-4">
          <div className="text-xs text-gray-500 mb-2">{t.myChannel}</div>
          <a 
            href="https://t.me/muhammadaliaiblog" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-black hover:text-gray-600 transition-colors"
          >
            @muhammadaliaiblog
          </a>
          <div className="text-xs text-gray-500 mt-3 mb-1">{t.myContact}</div>
          <a 
            href="https://t.me/zimdevuz" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-black hover:text-gray-600 transition-colors"
          >
            @zimdevuz
          </a>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
