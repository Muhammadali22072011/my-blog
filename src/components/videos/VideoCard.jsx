import { Link } from 'react-router-dom'
import { formatDuration, formatViews } from '../../utils/videoFormat'

/**
 * Карточка видео для сеток. Это настоящая ссылка на страницу видео —
 * открывается в новой вкладке и работает без JS. Если передан onOpen,
 * обычный клик вместо перехода открывает полноэкранную ленту.
 *
 * В карточке только постер: <video> в сетке — это десятки мегабайт
 * на телефоне ещё до того, как человек что-то выбрал.
 */
function VideoCard({ video, categoryName, onOpen, className = '' }) {
  const handleClick = (e) => {
    if (!onOpen) return
    // Ctrl/Cmd/Shift/средняя кнопка — человек хочет новую вкладку, не мешаем
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    onOpen()
  }

  const meta = [categoryName, `${formatViews(video.views)} просм.`].filter(Boolean).join(' · ')

  return (
    <Link
      to={`/videos/${video.slug}`}
      onClick={handleClick}
      className={`group block focus-visible:outline-none ${className}`}
    >
      <div className="relative aspect-[9/16] overflow-hidden bg-ink/10 transition-[transform,box-shadow] duration-200 group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 group-hover:shadow-[4px_4px_0_0_rgb(var(--tile))] group-focus-visible:outline group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-tile motion-reduce:transition-none motion-reduce:group-hover:translate-x-0 motion-reduce:group-hover:translate-y-0">
        {video.poster_url && (
          <img
            src={video.poster_url}
            alt=""
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        )}

        {video.pinned && (
          <span
            className="label absolute left-1.5 top-1.5 bg-black/60 px-1.5 py-0.5 text-white"
            title="Закреплено"
          >
            ◆<span className="sr-only"> Закреплено</span>
          </span>
        )}

        {video.duration_sec > 0 && (
          <span className="label numeric absolute bottom-1.5 right-1.5 bg-black/60 px-1.5 py-0.5 text-white">
            {formatDuration(video.duration_sec)}
          </span>
        )}
      </div>

      <h3 className="display mt-2.5 line-clamp-2 text-base leading-tight transition-colors group-hover:text-tile sm:mt-3 sm:text-lg">
        {video.title}
      </h3>
      <p className="label mt-1.5 truncate">{meta}</p>
    </Link>
  )
}

export default VideoCard
