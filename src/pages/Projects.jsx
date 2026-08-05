import { useState, useEffect } from 'react'
import SEOHead from '../components/SEOHead'
import supabaseService from '../services/SupabaseService'

/**
 * Проекты: нумерованный перечень вместо сетки карточек.
 * Обложка ложится на изразцовую подложку со смещением.
 */
function Projects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const data = await supabaseService.getActiveProjects()
        if (!cancelled) setProjects(data || [])
      } catch (error) {
        console.error('Не удалось загрузить проекты:', error)
        if (!cancelled) setProjects([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-5 pt-20 sm:px-8">
        <div className="skeleton h-3 w-24" />
        <div className="skeleton mt-6 h-14 w-2/5" />
        <div className="mt-14 space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton h-28" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-5 sm:px-8">
      <SEOHead title="Проекты" description="Работы и проекты Мухаммадали Иззатуллаева." />

      <header className="pb-12 pt-16 sm:pt-24">
        <p className="label">
          {projects.length} {projects.length === 1 ? 'работа' : 'работ'}
        </p>
        <h1 className="display mt-3 text-[clamp(2.5rem,9vw,6rem)]">Проекты</h1>
      </header>

      {projects.length === 0 ? (
        <div className="rule-t py-24 text-center">
          <p className="display text-3xl text-ink-faint">Пока пусто</p>
          <p className="mt-3 text-ink-soft">Работы появятся здесь совсем скоро.</p>
        </div>
      ) : (
        <div className="pb-24">
          {projects.map((project, i) => (
            <article key={project.id} className="rule-t grid grid-cols-12 gap-8 py-12">
              <div className="col-span-12 sm:col-span-4 lg:col-span-3">
                {project.image_url ? (
                  <div className="relative">
                    <div
                      className="absolute inset-0 translate-x-2 translate-y-2 bg-tile"
                      aria-hidden="true"
                    />
                    <img
                      src={project.image_url}
                      alt={project.title}
                      loading="lazy"
                      className="relative aspect-[4/3] w-full object-cover grayscale transition-all duration-500 hover:grayscale-0"
                      onError={(e) => {
                        e.currentTarget.parentElement.style.display = 'none'
                      }}
                    />
                  </div>
                ) : (
                  <span className="folio">{String(i + 1).padStart(3, '0')}</span>
                )}
              </div>

              <div className="col-span-12 sm:col-span-8 lg:col-span-9">
                <div className="flex items-center gap-4">
                  <span className="folio">{String(i + 1).padStart(3, '0')}</span>
                  {project.featured && <span className="label text-saffron">Избранное</span>}
                </div>

                <h2 className="display mt-2 text-[1.75rem] leading-tight sm:text-[2.1rem]">
                  {project.title}
                </h2>

                {project.description && (
                  <p className="mt-4 max-w-measure leading-relaxed text-ink-soft">
                    {project.description}
                  </p>
                )}

                {project.tags?.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-x-4 gap-y-1">
                    {project.tags.map((tag, idx) => (
                      <span key={idx} className="label label-tile">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-7 flex flex-wrap gap-4">
                  {project.github_url && (
                    <a
                      href={project.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary"
                    >
                      Исходники ↗
                    </a>
                  )}
                  {project.demo_url && (
                    <a
                      href={project.demo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary"
                    >
                      Смотреть ↗
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))}
          <div className="rule-t" />
        </div>
      )}
    </div>
  )
}

export default Projects
