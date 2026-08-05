import { useData } from '../context/DataContext'
import { renderMarkdown } from '../utils/markdownRenderer.jsx'
import SEOHead from '../components/SEOHead'
import { formatDateRu, telegramHandle } from '../utils/postFormat'

/** Возраст по дате рождения */
function calculateAge(birthDate) {
  if (!birthDate) return null
  const birth = new Date(birthDate)
  if (Number.isNaN(birth.getTime())) return null

  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--
  return age
}

/** Русское склонение слова «год» */
function yearsWord(n) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'год'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'года'
  return 'лет'
}

/** Раздел страницы: заголовок на полях, содержимое в широкой колонке */
function Section({ label, title, children }) {
  if (!children) return null
  return (
    <section className="rule-t grid grid-cols-12 gap-6 py-12">
      <div className="col-span-12 lg:col-span-3">
        <p className="label">{label}</p>
        {title && <h2 className="display mt-2 text-2xl leading-tight">{title}</h2>}
      </div>
      <div className="col-span-12 lg:col-span-9">{children}</div>
    </section>
  )
}

/**
 * Об авторе.
 *
 * Прежняя версия собирала HTML строковыми заменами и вставляла его через
 * dangerouslySetInnerHTML — без экранирования. Теперь текст идёт через
 * общий рендерер Markdown, который возвращает React-узлы.
 */
function AboutMe() {
  const { aboutMePage, profile, loading, error } = useData()

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-5 pt-20 sm:px-8">
        <div className="skeleton h-3 w-24" />
        <div className="skeleton mt-6 h-14 w-3/5" />
        <div className="mt-14 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton h-4" style={{ width: `${94 - i * 7}%` }} />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-32 text-center sm:px-8">
        <p className="label text-terra">Ошибка загрузки</p>
        <h1 className="display mt-4 text-4xl">Страница недоступна</h1>
        <p className="mt-4 text-ink-soft">{error}</p>
        <button onClick={() => window.location.reload()} className="btn-primary mt-8">
          Повторить
        </button>
      </div>
    )
  }

  if (!aboutMePage && !profile) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-32 text-center sm:px-8">
        <p className="label">Пусто</p>
        <h1 className="display mt-4 text-4xl">Страница ещё не заполнена</h1>
      </div>
    )
  }

  const page = aboutMePage || {}
  const person = profile || {}

  const name = person.name || 'Muhammadali Izzatullaev'
  const avatar = person.avatar_url || person.avatarUrl || page.image_url
  const age = calculateAge(page.birth_date)
  const channel = telegramHandle(page.telegram_channel || person.telegram_channel)
  const skills = (page.skills || []).filter((s) => s && s.trim())

  const links = [
    { label: 'Telegram', href: person.telegram },
    { label: 'GitHub', href: person.github },
    { label: 'YouTube', href: person.youtube },
    { label: 'LinkedIn', href: person.linkedin },
  ].filter((l) => l.href)

  return (
    <div className="mx-auto max-w-5xl px-5 sm:px-8">
      <SEOHead
        title={page.title || 'Об авторе'}
        description={person.about_me || person.aboutMe || 'Об авторе журнала.'}
        type="profile"
      />

      {/* ── Титул ───────────────────────────────────────────────── */}
      <header className="pb-14 pt-16 sm:pt-24">
        <p className="label">{person.position || 'Разработчик'}</p>
        <h1 className="display mt-3 text-[clamp(2.5rem,9vw,6rem)]">
          {page.title || 'Об авторе'}
        </h1>

        <div className="mt-12 grid grid-cols-12 items-start gap-8">
          <div className="col-span-12 sm:col-span-4">
            <div className="relative w-40 sm:w-full sm:max-w-[13rem]">
              <div
                className="absolute inset-0 translate-x-2.5 translate-y-2.5 bg-tile"
                aria-hidden="true"
              />
              <div className="relative aspect-[4/5] overflow-hidden bg-paper-deep">
                {avatar ? (
                  <img
                    src={avatar}
                    alt={name}
                    className="h-full w-full object-cover grayscale transition-all duration-700 hover:grayscale-0"
                  />
                ) : (
                  <span className="display flex h-full w-full items-center justify-center text-6xl text-tile">
                    {person.avatar_letter || name.charAt(0)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="col-span-12 sm:col-span-8">
            <h2 className="display text-3xl leading-tight">{name}</h2>

            {(person.about_me || person.aboutMe) && (
              <p className="mt-4 max-w-measure text-lg leading-relaxed">
                {person.about_me || person.aboutMe}
              </p>
            )}

            <dl className="mt-8 grid grid-cols-1 gap-x-10 gap-y-4 sm:grid-cols-2">
              {page.birth_date && (
                <div>
                  <dt className="label">Дата рождения</dt>
                  <dd className="mt-1">
                    {formatDateRu(page.birth_date)}
                    {age !== null && (
                      <span className="text-ink-soft">
                        {' '}
                        · {age} {yearsWord(age)}
                      </span>
                    )}
                  </dd>
                </div>
              )}
              {page.location && (
                <div>
                  <dt className="label">Город</dt>
                  <dd className="mt-1">{page.location}</dd>
                </div>
              )}
            </dl>

            {links.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
                {links.map((l) => (
                  <a
                    key={l.label}
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="label link-wipe hover:text-tile"
                  >
                    {l.label} ↗
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="pb-24">
        <Section label="Подробно">
          {page.content ? <div className="article-body">{renderMarkdown(page.content)}</div> : null}
        </Section>

        <Section label="Навыки" title="Чем владею">
          {skills.length > 0 ? (
            <ul className="flex flex-wrap gap-x-6 gap-y-3">
              {skills.map((skill, i) => (
                <li key={i} className="flex items-baseline gap-2">
                  <span className="folio">{String(i + 1).padStart(2, '0')}</span>
                  <span>{skill}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </Section>

        <Section label="Опыт" title="Работа">
          {page.experience ? (
            <div className="article-body">{renderMarkdown(page.experience)}</div>
          ) : null}
        </Section>

        <Section label="Образование">
          {page.education ? (
            <div className="article-body">{renderMarkdown(page.education)}</div>
          ) : null}
        </Section>

        <Section label="Интересы">
          {page.interests ? (
            <div className="article-body">{renderMarkdown(page.interests)}</div>
          ) : null}
        </Section>

        {channel && (
          <Section label="Связь" title="Телеграм">
            <>
              <p className="max-w-measure leading-relaxed text-ink-soft">
                Новые материалы выходят первыми в канале.
              </p>
              <a
                href={`https://t.me/${channel}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary mt-5"
              >
                @{channel}
              </a>
            </>
          </Section>
        )}

        <div className="rule-t" />
      </div>
    </div>
  )
}

export default AboutMe
