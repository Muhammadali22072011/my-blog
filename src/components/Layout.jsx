import { Outlet, Link } from 'react-router-dom'
import Navbar from './Navbar'
import { useData } from '../context/DataContext'
import { telegramHandle } from '../utils/postFormat'

/**
 * Каркас страницы: колонтитул сверху, полоса контента, выходные данные снизу.
 * Подвал построен как выходные данные журнала — три колонки и линейка.
 */
function Layout() {
  const { siteSettings, profile } = useData()

  const siteName = siteSettings?.site_name || 'Muhammadali Izzatullaev'
  const channel = telegramHandle(profile?.telegram_channel) || 'muhammadaliaiblog'

  // Ссылки берутся из профиля; отсутствующие просто не отрисовываются,
  // вместо прежних заглушек на github.com / twitter.com
  const social = [
    { label: 'Telegram', href: profile?.telegram },
    { label: 'GitHub', href: profile?.github },
    { label: 'YouTube', href: profile?.youtube },
    { label: 'LinkedIn', href: profile?.linkedin },
  ].filter((s) => s.href)

  const nav = [
    { to: '/blogs', label: 'Журнал' },
    { to: '/feed', label: 'Лента' },
    { to: '/news', label: 'Новости' },
    { to: '/projects', label: 'Проекты' },
    { to: '/about', label: 'Об авторе' },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      {/* Пропуск навигации — обязательный элемент доступности */}
      <a
        href="#main"
        className="label sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-tile focus:px-4 focus:py-2"
        style={{ color: 'rgb(var(--paper))' }}
      >
        Перейти к содержимому
      </a>

      <Navbar />

      <main id="main" className="above-grain flex-1">
        <Outlet />
      </main>

      {/* Выходные данные */}
      <footer className="above-grain rule-t mt-24 bg-paper-deep">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
            {/* Колофон */}
            <div className="md:col-span-5">
              <h2 className="display text-3xl leading-none">{siteName}</h2>
              <p className="mt-4 max-w-sm text-[0.95rem] leading-relaxed text-ink-soft">
                Личный журнал о разработке, искусственном интеллекте и ремесле.
                Длинные тексты, разборы и заметки на полях.
              </p>

              {social.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
                  {social.map((s) => (
                    <a
                      key={s.label}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="label link-wipe hover:text-tile"
                    >
                      {s.label} ↗
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Разделы */}
            <div className="md:col-span-3 md:col-start-7">
              <h3 className="label">Разделы</h3>
              <ul className="mt-5 space-y-2.5">
                {nav.map((item) => (
                  <li key={item.to}>
                    {/* Именно Link, а не <a> — иначе SPA перезагружается целиком */}
                    <Link to={item.to} className="link-wipe text-[0.95rem] hover:text-tile">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Подписка */}
            <div className="md:col-span-3">
              <h3 className="label">Подписка</h3>
              <p className="mt-5 text-[0.95rem] leading-relaxed text-ink-soft">
                Новые материалы выходят первыми в телеграм-канале.
              </p>
              <a
                href={`https://t.me/${channel}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary mt-5"
              >
                @{channel}
              </a>
            </div>
          </div>

          <div className="rule-t mt-14 flex flex-col gap-2 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="label">
              © {new Date().getFullYear()} {siteName}
            </p>
            <p className="label">Ташкент · Узбекистан</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Layout
