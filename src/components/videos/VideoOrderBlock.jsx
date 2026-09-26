import { useData } from '../../context/DataContext'
import { orderLinks } from '../../utils/videoFormat'

/**
 * Призыв заказать такое же видео. Контакты берутся из настроек сайта:
 * нет ни одного ника — блок не рисуется вовсе, а не ведёт в пустоту.
 *
 * compact — маленькая «таблетка» поверх ленты; клики по ней не должны
 * долетать до плеера (там тап переключает звук).
 */
function VideoOrderBlock({ variant = 'full', className = '' }) {
  const { siteSettings } = useData()
  const { instagram, telegram } = orderLinks(siteSettings)

  if (!instagram && !telegram) return null

  if (variant === 'compact') {
    const href = instagram || telegram
    const stop = (e) => e.stopPropagation()
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onPointerDown={stop}
        onPointerUp={stop}
        className={`label inline-flex items-center gap-1.5 bg-tile px-3 py-2 text-white transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none ${className}`}
      >
        Хочу такое видео ↗
      </a>
    )
  }

  return (
    <section className={`rule-t rule-b bg-paper-deep px-5 py-8 sm:px-8 sm:py-10 ${className}`}>
      <p className="label label-tile">Заказ</p>
      <p className="display mt-3 text-[clamp(1.5rem,5vw,2.25rem)] leading-tight">
        O‘z yuzingiz bilan shunday video xohlaysizmi?
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        {instagram && (
          <a href={instagram} target="_blank" rel="noopener noreferrer" className="btn-primary">
            Direct'ga yozish
          </a>
        )}
        {telegram && (
          <a href={telegram} target="_blank" rel="noopener noreferrer" className="btn-secondary">
            Telegram
          </a>
        )}
      </div>
    </section>
  )
}

export default VideoOrderBlock
