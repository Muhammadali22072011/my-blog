import { useState, useEffect, useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import SEOHead from '../components/SEOHead'
import VideoCard from '../components/videos/VideoCard'
import ReelsViewer from '../components/videos/ReelsViewer'
import VideoOrderBlock from '../components/videos/VideoOrderBlock'
import { listPublishedVideos, listCategories } from '../services/videoService'

/**
 * Раздел «Видео»: рубрики и сетка постеров. Клик по карточке открывает
 * полноэкранную ленту с текущей выборкой, а сама карточка остаётся
 * обычной ссылкой — для новой вкладки и поисковиков.
 *
 * Список грузится один раз целиком, рубрика фильтруется на клиенте:
 * переключение мгновенное, без мигания скелетона на каждом тапе.
 */
function Videos() {
  const [searchParams, setSearchParams] = useSearchParams()
  const categorySlug = searchParams.get('c') || ''

  const [videos, setVideos] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [attempt, setAttempt] = useState(0)
  // Снимок выборки на момент открытия: лента не должна меняться под пальцем
  const [viewer, setViewer] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    Promise.all([
      listPublishedVideos(),
      // Без рубрик раздел всё равно работает — просто без фильтра
      listCategories().catch(() => []),
    ])
      .then(([list, cats]) => {
        if (cancelled) return
        setVideos(list)
        setCategories(cats)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Не удалось загрузить видео')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [attempt])

  const categoryNames = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.name])),
    [categories]
  )

  // Показываем только рубрики, в которых что-то есть
  const usedCategories = useMemo(() => {
    const used = new Set(videos.map((v) => v.category_id))
    return categories.filter((c) => used.has(c.id))
  }, [categories, videos])

  const activeCategory = categories.find((c) => c.slug === categorySlug) || null

  const filtered = useMemo(
    () => (activeCategory ? videos.filter((v) => v.category_id === activeCategory.id) : videos),
    [videos, activeCategory]
  )

  const selectCategory = (slug) => {
    const next = new URLSearchParams(searchParams)
    if (slug) next.set('c', slug)
    else next.delete('c')
    // replace: рубрики не засоряют историю «Назад»
    setSearchParams(next, { replace: true, preventScrollReset: true })
  }

  const closeViewer = useCallback(() => setViewer(null), [])

  // Просмотр, засчитанный в ленте, сразу виден и в сетке
  const handleViewed = useCallback((id, count) => {
    setVideos((prev) => prev.map((v) => (v.id === id ? { ...v, views: count } : v)))
  }, [])

  return (
    <div className="mx-auto max-w-6xl px-5 sm:px-8">
      <SEOHead
        title="Видео"
        description="Короткие видео: ролики, съёмки и монтаж. Смотрите подряд в ленте или по одному."
        type="website"
      />

      <header className="pb-8 pt-12 sm:pb-10 sm:pt-20">
        <p className="label">
          {loading ? 'Раздел' : `${videos.length} видео`}
        </p>
        <h1 className="display mt-3 text-[clamp(2.5rem,9vw,6rem)]">Видео</h1>
        <p className="mt-4 max-w-measure text-[1.05rem] leading-relaxed text-ink-soft sm:text-lg">
          Ролики, которые я снимаю и монтирую. Нажмите на любой — лента откроется на весь экран.
        </p>
      </header>

      {/* Рубрики: на телефоне — одна строка с горизонтальной прокруткой */}
      {usedCategories.length > 0 && (
        <nav
          aria-label="Рубрики видео"
          className="-mx-5 mb-6 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:mx-0 sm:mb-8 sm:px-0 [&::-webkit-scrollbar]:hidden"
        >
          <Chip active={!activeCategory} onClick={() => selectCategory('')}>
            Все
          </Chip>
          {usedCategories.map((c) => (
            <Chip key={c.id} active={activeCategory?.id === c.id} onClick={() => selectCategory(c.slug)}>
              {c.name}
            </Chip>
          ))}
        </nav>
      )}

      {loading ? (
        <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-10 lg:grid-cols-4" aria-hidden="true">
          {[...Array(8)].map((_, i) => (
            <div key={i}>
              <div className="skeleton aspect-[9/16]" />
              <div className="skeleton mt-3 h-4 w-4/5" />
              <div className="skeleton mt-2 h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="py-24 text-center">
          <p className="label text-terra">Ошибка</p>
          <p className="display mt-4 text-3xl">Видео не загрузились</p>
          <p className="mt-3 text-ink-soft">{error}</p>
          <button type="button" onClick={() => setAttempt((n) => n + 1)} className="btn-primary mt-8">
            Повторить
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rule-t py-24 text-center">
          <p className="display text-3xl text-ink-faint">Пока пусто</p>
          <p className="mt-3 text-ink-soft">
            {activeCategory ? 'В этой рубрике видео ещё нет.' : 'Видео появятся здесь совсем скоро.'}
          </p>
          {activeCategory && (
            <button type="button" onClick={() => selectCategory('')} className="btn-secondary mt-8">
              Все видео
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-10 lg:grid-cols-4">
          {filtered.map((video, i) => (
            <VideoCard
              key={video.id}
              video={video}
              categoryName={categoryNames[video.category_id]}
              onOpen={() => setViewer({ list: filtered, index: i })}
            />
          ))}
        </div>
      )}

      <VideoOrderBlock variant="full" className="-mx-5 mt-16 sm:mx-0 sm:mt-24" />

      {viewer && (
        <ReelsViewer
          videos={viewer.list}
          startIndex={viewer.index}
          categoryNames={categoryNames}
          onClose={closeViewer}
          onViewed={handleViewed}
        />
      )}
    </div>
  )
}

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`label flex-shrink-0 whitespace-nowrap border px-3.5 py-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tile ${
        active
          ? 'border-ink bg-ink text-paper'
          : 'border-ink/20 hover:border-tile hover:text-tile'
      }`}
    >
      {children}
    </button>
  )
}

export default Videos
