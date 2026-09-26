import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import CustomVideoPlayer from '../CustomVideoPlayer'
import VideoOrderBlock from './VideoOrderBlock'
import { markViewedOnce } from './sessionViews'
import { incrementVideoViews } from '../../services/videoService'
import { formatViews } from '../../utils/videoFormat'

const SITE_NAME = 'Muhammadali Izzatullaev'

// Кнопки поверх ленты: нажатие не должно долетать до слоя с видео
const stop = (e) => e.stopPropagation()

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/**
 * Полноэкранная лента в духе Reels.
 *
 * Прокрутка — нативная (scroll-snap), без JS-жестов: так работают инерция,
 * «резинка» на iPhone и доступность. Активный слайд определяет один
 * IntersectionObserver. Плееры есть только у активного и соседних слайдов,
 * остальные — постеры: больше трёх <video> телефон держит плохо.
 *
 * Адрес меняется через history.pushState/replaceState, а не navigate:
 * роутер не узнаёт о смене адреса, поэтому страница /videos под лентой
 * не перемонтируется и не теряет прокрутку.
 */
function ReelsViewer({ videos, startIndex = 0, categoryNames = {}, onClose, onViewed }) {
  const navigate = useNavigate()
  const containerRef = useRef(null)
  const closeBtnRef = useRef(null)
  const pushedRef = useRef(false)
  const baseRef = useRef(null)
  const watchedHandlers = useRef(new Map())
  const copiedTimerRef = useRef(null)

  const [activeIndex, setActiveIndex] = useState(() =>
    Math.min(Math.max(0, startIndex), Math.max(0, videos.length - 1))
  )
  const [muted, setMuted] = useState(true)
  const [views, setViews] = useState({})
  const [copiedId, setCopiedId] = useState(null)

  const active = videos[activeIndex]

  // ── Каркас: блокировка прокрутки страницы, фокус, заголовок вкладки ─────
  useEffect(() => {
    const { body } = document
    const prevOverflow = body.style.overflow
    const prevTitle = document.title
    const prevFocus = document.activeElement
    body.style.overflow = 'hidden'
    closeBtnRef.current?.focus({ preventScroll: true })

    return () => {
      body.style.overflow = prevOverflow
      document.title = prevTitle
      clearTimeout(copiedTimerRef.current)
      // Возвращаем фокус на карточку, с которой открыли ленту
      if (prevFocus && typeof prevFocus.focus === 'function') prevFocus.focus({ preventScroll: true })
    }
  }, [])

  useEffect(() => {
    if (active?.title) document.title = `${active.title} — ${SITE_NAME}`
  }, [active?.title])

  // ── История браузера ─────────────────────────────────────────────────────
  // Ref-флаг переживает двойной запуск эффектов в StrictMode:
  // запись в историю добавляется один раз
  useEffect(() => {
    if (pushedRef.current || !active) return
    baseRef.current = {
      url: window.location.pathname + window.location.search + window.location.hash,
      state: window.history.state,
    }
    try {
      const state = window.history.state || {}
      // idx + 1 — чтобы у роутера не сбился счёт записей, если потом
      // он сам заменит эту запись (переход «Подробнее»)
      window.history.pushState(
        { ...state, idx: (Number(state.idx) || 0) + 1, reels: true },
        '',
        `/videos/${active.slug}`
      )
      pushedRef.current = true
    } catch {
      /* без истории лента просто не меняет адрес */
    }
    // Эффект только для открытия; дальше адрес ведёт эффект ниже
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!pushedRef.current || !active) return
    try {
      window.history.replaceState(window.history.state, '', `/videos/${active.slug}`)
    } catch {
      /* Safari ограничивает частоту replaceState — адрес догонит следующий слайд */
    }
  }, [active])

  // Кнопка «Назад» в браузере или жест — закрываем ленту
  useEffect(() => {
    const onPop = () => {
      pushedRef.current = false
      onClose()
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [onClose])

  const close = useCallback(() => {
    if (pushedRef.current) {
      pushedRef.current = false
      // Возврат на /videos?… — ту самую запись, с которой открыли
      window.history.back()
    } else if (baseRef.current) {
      try {
        window.history.replaceState(baseRef.current.state, '', baseRef.current.url)
      } catch {
        /* адрес останется прежним — не страшно */
      }
    }
    onClose()
  }, [onClose])

  /** «Подробнее»: закрыть ленту и уйти на страницу видео обычным переходом */
  const openDetails = (e, slug) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    const wasPushed = pushedRef.current
    pushedRef.current = false
    onClose()
    // Наша запись в истории заменяется страницей видео: «Назад» с неё
    // вернёт на /videos, а не в закрытую ленту
    navigate(`/videos/${slug}`, { replace: wasPushed })
  }

  // ── Прокрутка ────────────────────────────────────────────────────────────
  // До первой отрисовки, без анимации: лента открывается сразу на нужном видео
  useLayoutEffect(() => {
    const container = containerRef.current
    const slide = container?.children[activeIndex]
    if (slide) container.scrollTop = slide.offsetTop
    // Только при открытии
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            setActiveIndex(Number(entry.target.dataset.index))
          }
        }
      },
      { root: container, threshold: 0.6 }
    )
    Array.from(container.children).forEach((slide) => observer.observe(slide))
    return () => observer.disconnect()
  }, [videos])

  const goTo = useCallback(
    (index) => {
      const container = containerRef.current
      if (!container || index < 0 || index >= videos.length) return
      container.children[index]?.scrollIntoView({
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
        block: 'start',
      })
    },
    [videos.length]
  )

  useEffect(() => {
    const onKey = (e) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return
      const tag = e.target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable) return

      if (e.key === 'Escape') {
        e.preventDefault()
        close()
      } else if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault()
        goTo(activeIndex + 1)
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault()
        goTo(activeIndex - 1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activeIndex, close, goTo])

  // ── Просмотры ────────────────────────────────────────────────────────────
  // Стабильный обработчик на каждое видео: плеер не переподписывает
  // события при каждой смене активного слайда
  const watchedFor = (id) => {
    const cache = watchedHandlers.current
    if (!cache.has(id)) {
      cache.set(id, () => {
        if (!markViewedOnce(id)) return
        incrementVideoViews(id).then((count) => {
          if (count === null) return
          setViews((prev) => ({ ...prev, [id]: count }))
          onViewed?.(id, count)
        })
      })
    }
    return cache.get(id)
  }

  // ── Поделиться ───────────────────────────────────────────────────────────
  const share = async (video) => {
    const url = `${window.location.origin}/videos/${video.slug}`
    if (navigator.share) {
      try {
        await navigator.share({ title: video.title, url })
      } catch {
        /* окно закрыли — это не ошибка */
      }
      return
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(video.id)
      clearTimeout(copiedTimerRef.current)
      copiedTimerRef.current = setTimeout(() => setCopiedId(null), 1600)
    } catch {
      /* буфер обмена недоступен — молча */
    }
  }

  if (!videos.length) return null

  const column = { width: 'min(100vw, calc(100dvh * 9 / 16))' }

  return createPortal(
    <div
      className="fixed inset-0 z-[60] bg-black text-white"
      role="dialog"
      aria-modal="true"
      aria-label="Просмотр видео"
    >
      <div
        ref={containerRef}
        className="h-[100dvh] snap-y snap-mandatory overflow-y-scroll overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {videos.map((video, i) => {
          const near = Math.abs(i - activeIndex) <= 1
          const isActive = i === activeIndex
          const category = categoryNames[video.category_id]
          const viewCount = views[video.id] ?? video.views
          return (
            <section
              key={video.id}
              data-index={i}
              aria-label={video.title}
              aria-hidden={!isActive || undefined}
              className="relative flex h-[100dvh] snap-start snap-always justify-center"
            >
              <div className="relative h-full" style={column}>
                {near ? (
                  <CustomVideoPlayer
                    src={video.video_url}
                    poster={video.poster_url}
                    title={video.title}
                    variant="reel"
                    loop
                    fit="contain"
                    active={isActive}
                    preload={isActive ? 'auto' : 'metadata'}
                    muted={muted}
                    onMutedChange={setMuted}
                    onWatched={watchedFor(video.id)}
                    className="h-full w-full"
                  />
                ) : (
                  video.poster_url && (
                    <img
                      src={video.poster_url}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-contain"
                    />
                  )
                )}

                {/* Нижняя подпись. Сам слой прозрачен для касаний — тап
                    по видео по-прежнему переключает звук */}
                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-4 pt-24"
                  style={{ paddingBottom: 'max(1.25rem, calc(env(safe-area-inset-bottom) + 0.75rem))' }}
                >
                  <h2 className="display line-clamp-2 text-xl leading-tight text-white sm:text-2xl">
                    {video.title}
                  </h2>
                  <p className="label mt-2 text-white/75">
                    {[category, `${formatViews(viewCount)} просм.`].filter(Boolean).join(' · ')}
                  </p>

                  <div
                    className="pointer-events-auto mt-4 flex flex-wrap items-center gap-x-4 gap-y-3"
                    onPointerDown={stop}
                    onPointerUp={stop}
                  >
                    <Link
                      to={`/videos/${video.slug}`}
                      onClick={(e) => openDetails(e, video.slug)}
                      tabIndex={isActive ? undefined : -1}
                      className="label link-wipe text-white hover:text-tile focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    >
                      Подробнее →
                    </Link>
                    <button
                      type="button"
                      onClick={() => share(video)}
                      tabIndex={isActive ? undefined : -1}
                      aria-label="Поделиться видео"
                      className="label text-white/90 hover:text-tile focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    >
                      {copiedId === video.id ? 'Скопировано' : 'Поделиться'}
                    </button>
                    {isActive && <VideoOrderBlock variant="compact" className="ml-auto" />}
                  </div>
                </div>
              </div>
            </section>
          )
        })}
      </div>

      {/* Верхняя панель — одна на всю ленту, поверх слайдов */}
      <div
        className="pointer-events-none fixed left-1/2 top-0 flex -translate-x-1/2 items-start px-3"
        style={{ ...column, paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <button
          ref={closeBtnRef}
          type="button"
          onClick={close}
          onPointerDown={stop}
          onPointerUp={stop}
          aria-label="Закрыть просмотр"
          className="pointer-events-auto flex h-10 w-10 items-center justify-center bg-black/45 text-lg leading-none text-white transition-colors hover:bg-tile focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
        >
          ✕
        </button>
        <span className="label numeric ml-3 mt-3 text-white/70" aria-live="polite">
          {activeIndex + 1} / {videos.length}
        </span>
      </div>

      {/* Листание кнопками — там, где есть место справа от колонки */}
      <div className="fixed right-5 top-1/2 hidden -translate-y-1/2 flex-col gap-2 sm:flex">
        <button
          type="button"
          onClick={() => goTo(activeIndex - 1)}
          disabled={activeIndex === 0}
          aria-label="Предыдущее видео"
          className="flex h-11 w-11 items-center justify-center border border-white/30 text-white transition-colors hover:border-tile hover:text-tile focus-visible:outline focus-visible:outline-2 focus-visible:outline-white disabled:pointer-events-none disabled:opacity-30"
        >
          ▲
        </button>
        <button
          type="button"
          onClick={() => goTo(activeIndex + 1)}
          disabled={activeIndex >= videos.length - 1}
          aria-label="Следующее видео"
          className="flex h-11 w-11 items-center justify-center border border-white/30 text-white transition-colors hover:border-tile hover:text-tile focus-visible:outline focus-visible:outline-2 focus-visible:outline-white disabled:pointer-events-none disabled:opacity-30"
        >
          ▼
        </button>
      </div>
    </div>,
    document.body
  )
}

export default ReelsViewer
