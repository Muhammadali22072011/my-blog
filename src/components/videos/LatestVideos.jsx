import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import VideoCard from './VideoCard'
import { listLatestVideos, listCategories } from '../../services/videoService'

/**
 * «Последние видео» на главной. Грузится сам, отдельно от DataContext:
 * главная не ждёт видео, а при ошибке или пустом разделе блока просто нет.
 *
 * На телефоне — лента с горизонтальной прокруткой (две карточки и край
 * третьей подсказывают, что можно листать), шире — обычная сетка.
 */
function LatestVideos() {
  const [videos, setVideos] = useState([])
  const [categories, setCategories] = useState([])

  useEffect(() => {
    let cancelled = false
    Promise.all([listLatestVideos(6), listCategories().catch(() => [])])
      .then(([list, cats]) => {
        if (cancelled) return
        setVideos(list)
        setCategories(cats)
      })
      .catch(() => {
        /* раздел недоступен — на главной его просто не будет */
      })
    return () => {
      cancelled = true
    }
  }, [])

  const categoryNames = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.name])),
    [categories]
  )

  if (!videos.length) return null

  return (
    <section className="pb-24">
      <div className="ornament mb-10">
        <span className="label label-tile">◆ ◆ ◆</span>
      </div>

      <div className="mb-8 flex items-baseline justify-between gap-4">
        <h2 className="display text-3xl sm:text-4xl">Последние видео</h2>
        <Link to="/videos" className="label link-wipe flex-shrink-0 hover:text-tile">
          Все видео →
        </Link>
      </div>

      <div className="-mx-5 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-6 [&::-webkit-scrollbar]:hidden">
        {videos.map((video) => (
          <div key={video.id} className="w-[42vw] flex-shrink-0 snap-start sm:w-auto">
            <VideoCard video={video} categoryName={categoryNames[video.category_id]} />
          </div>
        ))}
      </div>
    </section>
  )
}

export default LatestVideos
