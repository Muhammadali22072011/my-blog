import { Link, useLocation } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useState, useEffect } from 'react'

/**
 * Шапка-«колонтитул»: узкая изразцовая полоса, вордмарк и моноширинная
 * навигация. Никаких карточек и теней — только волосяные линии.
 */
function Navbar() {
  const { isDark, toggleTheme } = useTheme()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [hasAdminAccess, setHasAdminAccess] = useState(false)

  const navItems = [
    { path: '/blogs', label: 'Журнал' },
    { path: '/feed', label: 'Лента' },
    { path: '/news', label: 'Новости' },
    { path: '/projects', label: 'Проекты' },
    { path: '/search', label: 'Поиск' },
    { path: '/about', label: 'Об авторе' },
  ]

  const isActive = (path) => location.pathname === path

  // Признак разблокированной админки. Это ТОЛЬКО подсказка для интерфейса:
  // реальный доступ к данным обязан ограничиваться политиками RLS в Supabase.
  useEffect(() => {
    const readToken = () => {
      const token = localStorage.getItem('multi_auth_token')
      if (!token) return setHasAdminAccess(false)
      try {
        const { expires } = JSON.parse(token)
        setHasAdminAccess(Date.now() < expires)
      } catch {
        setHasAdminAccess(false)
      }
    }

    readToken()
    // Событие storage вместо опроса по таймеру каждые 10 секунд
    window.addEventListener('storage', readToken)
    return () => window.removeEventListener('storage', readToken)
  }, [location.pathname])

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  return (
    <header className="sticky top-0 z-40 bg-paper">
      {/* Изразцовая полоса — фирменная деталь, повторяется на всех страницах */}
      <div className="h-[3px] bg-tile" aria-hidden="true" />

      <nav aria-label="Основная навигация" className="rule-b">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between gap-6 px-5 sm:px-8">
          {/* Вордмарк */}
          <Link to="/" className="group flex-shrink-0" aria-label="На главную">
            <span className="display block text-[1.35rem] leading-none text-ink sm:text-[1.6rem]">
              Muhammadali
            </span>
            <span className="label mt-1 block text-[0.6rem] transition-colors group-hover:text-tile">
              Izzatullaev · журнал
            </span>
          </Link>

          {/* Навигация — десктоп */}
          <div className="hidden items-center gap-7 lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                aria-current={isActive(item.path) ? 'page' : undefined}
                className={`label link-wipe transition-colors ${
                  isActive(item.path) ? 'text-tile' : 'hover:text-ink'
                }`}
              >
                {item.label}
              </Link>
            ))}

            <button
              onClick={toggleTheme}
              aria-label={isDark ? 'Включить светлую тему' : 'Включить тёмную тему'}
              className="label ml-1 border border-ink/25 px-2.5 py-1.5 transition-colors hover:border-tile hover:text-tile"
            >
              {isDark ? 'День' : 'Ночь'}
            </button>

            {hasAdminAccess && (
              <Link
                to="/admin"
                className="label bg-tile px-3 py-1.5 transition-transform hover:-translate-y-0.5"
                style={{ color: 'rgb(var(--paper))' }}
              >
                Админ
              </Link>
            )}
          </div>

          {/* Кнопка мобильного меню */}
          <button
            onClick={() => setIsMobileMenuOpen((v) => !v)}
            aria-label="Открыть меню"
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-nav"
            className="label border border-ink/25 px-3 py-2 lg:hidden"
          >
            {isMobileMenuOpen ? 'Закрыть' : 'Меню'}
          </button>
        </div>

        {/* Навигация — мобильная */}
        <div id="mobile-nav" hidden={!isMobileMenuOpen} className="rule-t lg:hidden">
          <div className="mx-auto max-w-6xl px-5 py-3 sm:px-8">
            {navItems.map((item, i) => (
              <Link
                key={item.path}
                to={item.path}
                aria-current={isActive(item.path) ? 'page' : undefined}
                className={`flex items-baseline gap-4 border-b border-ink/10 py-3.5 ${
                  isActive(item.path) ? 'text-tile' : ''
                }`}
              >
                <span className="folio">{String(i + 1).padStart(2, '0')}</span>
                <span className="display text-2xl">{item.label}</span>
              </Link>
            ))}

            <button
              onClick={toggleTheme}
              className="label py-4"
              aria-label={isDark ? 'Включить светлую тему' : 'Включить тёмную тему'}
            >
              {isDark ? '→ Светлая тема' : '→ Тёмная тема'}
            </button>

            {hasAdminAccess && (
              <Link to="/admin" className="label block py-2 text-tile">
                → Админ-панель
              </Link>
            )}
          </div>
        </div>
      </nav>
    </header>
  )
}

export default Navbar
