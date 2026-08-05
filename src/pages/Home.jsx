import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useData } from '../context/DataContext'
import { ProfileSkeleton } from '../components/Skeleton'
import SEOHead from '../components/SEOHead'
import { getPostTitle, getReadingTime, formatDateRu, telegramHandle } from '../utils/postFormat'

/**
 * Титульная полоса журнала.
 *
 * Композиция намеренно асимметрична: слева узкая колонка выходных данных
 * (моноширинный шрифт), справа — крупный набор имени, который «ломает» сетку.
 * Ниже — указатель последних материалов, набранный как оглавление книги.
 */
function Home() {
  const { profile, posts, loading, error } = useData()

  const latest = useMemo(
    () =>
      (posts || [])
        .filter((p) => p.status === 'published' && p.content && p.created_at)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5),
    [posts]
  )

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
        <ProfileSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-32 text-center sm:px-8">
        <p className="label text-terra">Ошибка загрузки</p>
        <h1 className="display mt-4 text-4xl">Не удалось получить данные</h1>
        <p className="mt-4 text-ink-soft">{error}</p>
        <button onClick={() => window.location.reload()} className="btn-primary mt-8">
          Повторить
        </button>
      </div>
    )
  }

  const name = profile?.name || 'Muhammadali Izzatullaev'
  const position = profile?.position || 'Разработчик'
  const bio =
    profile?.about_me ||
    profile?.aboutMe ||
    'Пишу о нетехническом в техническом мире.'
  const avatar = profile?.avatar_url || profile?.avatarUrl
  const channel = telegramHandle(profile?.telegram_channel)

  // Имя разбивается на строки вручную — так набор держит выбранный ритм
  const nameParts = name.split(' ')

  const links = [
    { label: 'Telegram', href: profile?.telegram },
    { label: 'GitHub', href: profile?.github },
    { label: 'YouTube', href: profile?.youtube },
    { label: 'LinkedIn', href: profile?.linkedin },
  ].filter((l) => l.href)

  return (
    <div className="mx-auto max-w-6xl px-5 sm:px-8">
      <SEOHead title="Главная" description={bio} type="website" />

      {/* ── Титул ─────────────────────────────────────────────────── */}
      <section className="grid grid-cols-12 gap-y-10 pb-20 pt-16 sm:pt-24">
        {/* Левая колонка выходных данных */}
        <div className="col-span-12 lg:col-span-3">
          <div className="slide-up space-y-6">
            <div>
              <p className="label">Выпуск</p>
              <p className="folio mt-1.5 text-sm">
                {new Date().getFullYear()} · {String(latest.length).padStart(3, '0')} материалов
              </p>
            </div>
            <div>
              <p className="label">Автор</p>
              <p className="mt-1.5 text-sm text-ink-soft">{position}</p>
            </div>
            {links.length > 0 && (
              <div>
                <p className="label">Связь</p>
                <ul className="mt-2 space-y-1.5">
                  {links.map((l) => (
                    <li key={l.label}>
                      <a
                        href={l.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link-wipe text-sm hover:text-tile"
                      >
                        {l.label} ↗
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Крупный набор имени */}
        <div className="col-span-12 lg:col-span-9">
          <h1 className="display text-[clamp(3rem,11vw,7.5rem)]">
            {nameParts.map((part, i) => (
              <span
                key={i}
                className={`slide-up block stagger-${Math.min(i + 1, 5)} ${
                  i % 2 === 1 ? 'text-tile lg:pl-[12%]' : ''
                }`}
              >
                {part}
              </span>
            ))}
          </h1>

          <div className="mt-12 grid grid-cols-12 items-start gap-8">
            {/* Портрет со смещённой изразцовой подложкой */}
            <div className="col-span-12 sm:col-span-4">
              <div className="scale-in relative w-40 sm:w-full sm:max-w-[13rem]">
                <div
                  className="absolute inset-0 translate-x-2.5 translate-y-2.5 bg-tile"
                  aria-hidden="true"
                />
                <div className="relative aspect-[4/5] overflow-hidden bg-paper-deep">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt={`${name} — портрет`}
                      className="h-full w-full object-cover grayscale transition-all duration-700 hover:grayscale-0"
                    />
                  ) : (
                    <span className="display flex h-full w-full items-center justify-center text-6xl text-tile">
                      {profile?.avatar_letter || name.charAt(0)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Аннотация */}
            <div className="col-span-12 sm:col-span-8">
              <p className="slide-up stagger-3 max-w-measure text-[1.35rem] leading-[1.55]">
                {bio}
              </p>

              <div className="slide-up stagger-4 mt-9 flex flex-wrap gap-4">
                <Link to="/blogs" className="btn-primary">
                  Читать журнал
                </Link>
                <Link to="/about" className="btn-secondary">
                  Об авторе
                </Link>
              </div>

              {channel && (
                <p className="mt-8 text-sm text-ink-soft">
                  Новые материалы —{' '}
                  <a
                    href={`https://t.me/${channel}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-wipe text-tile"
                  >
                    @{channel}
                  </a>
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Указатель последних материалов ────────────────────────── */}
      {latest.length > 0 && (
        <section className="pb-24">
          <div className="ornament mb-10">
            <span className="label label-tile">◆ ◆ ◆</span>
          </div>

          <div className="mb-8 flex items-baseline justify-between">
            <h2 className="display text-3xl sm:text-4xl">Последнее</h2>
            <Link to="/blogs" className="label link-wipe hover:text-tile">
              Весь указатель →
            </Link>
          </div>

          <div className="pl-5">
            {latest.map((post, i) => (
              <Link key={post.id} to={`/post/${post.id}`} className="index-row group">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:gap-5">
                  <span className="folio w-10 flex-shrink-0 pt-1">
                    {String(i + 1).padStart(3, '0')}
                  </span>

                  <h3 className="display text-2xl leading-tight transition-colors group-hover:text-tile sm:text-[1.75rem]">
                    {getPostTitle(post)}
                  </h3>

                  <span className="leader hidden sm:block" aria-hidden="true" />

                  <span className="label flex-shrink-0 whitespace-nowrap">
                    {formatDateRu(post.created_at)} · {getReadingTime(post.content)} мин
                  </span>
                </div>
              </Link>
            ))}
            <div className="rule-t" />
          </div>
        </section>
      )}
    </div>
  )
}

export default Home
