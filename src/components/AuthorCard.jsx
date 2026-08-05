import { Link } from 'react-router-dom'
import { useData } from '../context/DataContext'

/**
 * Врезка об авторе на полях страницы.
 * Портрет со смещённой изразцовой подложкой — тот же приём, что на титуле.
 */
function AuthorCard() {
  const { profile } = useData()

  if (!profile) return null

  const name = profile.name || 'Автор'
  const avatar = profile.avatar_url || profile.avatarUrl

  const links = [
    { label: 'Telegram', href: profile.telegram },
    { label: 'GitHub', href: profile.github },
    { label: 'LinkedIn', href: profile.linkedin },
    { label: 'YouTube', href: profile.youtube },
    { label: 'Почта', href: profile.email ? `mailto:${profile.email}` : null },
  ].filter((l) => l.href)

  return (
    <section aria-labelledby="author-heading">
      <h2 id="author-heading" className="label rule-b pb-2">
        Автор
      </h2>

      <div className="mt-5 flex items-start gap-4">
        <div className="relative w-20 flex-shrink-0">
          <div
            className="absolute inset-0 translate-x-1.5 translate-y-1.5 bg-tile"
            aria-hidden="true"
          />
          <div className="relative aspect-[4/5] overflow-hidden bg-paper-deep">
            {avatar ? (
              <img
                src={avatar}
                alt={name}
                loading="lazy"
                className="h-full w-full object-cover grayscale transition-all duration-500 hover:grayscale-0"
              />
            ) : (
              <span className="display flex h-full w-full items-center justify-center text-2xl text-tile">
                {name.charAt(0)}
              </span>
            )}
          </div>
        </div>

        <div className="min-w-0">
          <p className="display text-lg leading-tight">{name}</p>
          <p className="label mt-1">{profile.position || 'Разработчик'}</p>
        </div>
      </div>

      {(profile.about_me || profile.aboutMe) && (
        <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-ink-soft">
          {profile.about_me || profile.aboutMe}
        </p>
      )}

      {links.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              target={l.href.startsWith('mailto:') ? undefined : '_blank'}
              rel="noopener noreferrer"
              className="label link-wipe hover:text-tile"
            >
              {l.label}
            </a>
          ))}
        </div>
      )}

      <Link to="/about" className="label link-wipe mt-5 inline-block hover:text-tile">
        Подробнее об авторе →
      </Link>
    </section>
  )
}

export default AuthorCard
