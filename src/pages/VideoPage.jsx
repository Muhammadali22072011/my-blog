import { useParams, Link } from 'react-router-dom'
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import CustomVideoPlayer from '../components/CustomVideoPlayer'
import SEOHead from '../components/SEOHead'
import SocialShare from '../components/SocialShare'
import Reactions from '../components/Reactions'
import VideoCard from '../components/videos/VideoCard'
import VideoOrderBlock from '../components/videos/VideoOrderBlock'
import { markViewedOnce } from '../components/videos/sessionViews'
import {
  getVideoBySlug,
  listCategories,
  listPublishedVideos,
  incrementVideoViews,
  getVideoReactions,
  setVideoReaction,
} from '../services/videoService'
import {
  SLUG_RE,
  formatDuration,
  formatViews,
  buildVideoJsonLd,
  jsonForScript,
} from '../utils/videoFormat'
import { formatDateRu } from '../utils/postFormat'

/** Описание для сниппета: первые ~160 знаков без переносов */
function metaDescription(text, fallback) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim()
  if (!clean) return fallback
  return clean.length > 160 ? `${clean.slice(0, 157).trimEnd()}…` : clean
}

/**
 * Страница одного видео. На телефоне сначала плеер во всю ширину
 * на чёрной полосе, ниже текст; на широком экране — две колонки.
 */
function VideoPage() {
  const { slug } = useParams()

  const [video, setVideo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [categories, setCategories] = useState([])
  const [more, setMore] = useState([])
  const [views, setViews] = useState(0)
  const aliveRef = useRef(true)

  useEffect(() => {
    aliveRef.current = true
    return () => {
      aliveRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!SLUG_RE.test(String(slug ?? ''))) {
      setVideo(null)
      setError('Неверный адрес видео')
      setLoading(false)
      return
    }

    let cancelled = false
    setVideo(null)
    setError(null)
    setLoading(true)
    setMore([])

    ;(async () => {
      try {
        const [row, cats] = await Promise.all([getVideoBySlug(slug), listCategories().catch(() => [])])
        if (cancelled) return
        if (!row) {
          setError('Видео не найдено')
          return
        }
        setVideo(row)
        setViews(Number(row.views) || 0)
        setCategories(cats)

        // «Ещё видео»: сначала из той же рубрики, затем остальные.
        // Ошибка здесь не должна ломать страницу — блок просто не появится
        try {
          const list = await listPublishedVideos({ limit: 40 })
          if (cancelled) return
          const others = list.filter((v) => v.id !== row.id)
          const same = others.filter((v) => row.category_id && v.category_id === row.category_id)
          const rest = others.filter((v) => !same.includes(v))
          setMore([...same, ...rest].slice(0, 4))
        } catch {
          /* без блока «Ещё видео» */
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Не удалось загрузить видео')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [slug])

  const canonical = `${window.location.origin}/videos/${slug}`
  const description = useMemo(
    () => (video ? metaDescription(video.description, video.title) : ''),
    [video]
  )
  const paragraphs = useMemo(
    () =>
      String(video?.description || '')
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean),
    [video]
  )
  const categoryNames = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.name])),
    [categories]
  )
  const categoryName = video ? categoryNames[video.category_id] : null

  // Адаптер стабилен в пределах одного видео — Reactions не перечитывает счётчики
  const videoId = video?.id
  const reactionsAdapter = useMemo(
    () =>
      videoId == null
        ? null
        : {
            load: (userId) => getVideoReactions(videoId, userId),
            set: (userId, reaction) => setVideoReaction(videoId, userId, reaction),
          },
    [videoId]
  )

  const handleWatched = useCallback(() => {
    if (videoId == null || !markViewedOnce(videoId)) return
    incrementVideoViews(videoId).then((count) => {
      if (count !== null && aliveRef.current) setViews(count)
    })
  }, [videoId])

  // Разметка VideoObject для поисковиков. Удаляем ровно свой узел,
  // не трогая чужие ld+json на странице
  useEffect(() => {
    if (!video) return
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.dataset.seo = 'video'
    script.textContent = jsonForScript(buildVideoJsonLd(video, canonical))
    document.head.appendChild(script)
    return () => script.remove()
  }, [video, canonical])

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-5 pt-6 sm:px-8 sm:pt-12">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-5">
            <div className="skeleton mx-auto aspect-[9/16] w-full max-w-sm" />
          </div>
          <div className="lg:col-span-7">
            <div className="skeleton h-3 w-24" />
            <div className="skeleton mt-6 h-12 w-4/5" />
            <div className="skeleton mt-3 h-12 w-3/5" />
            <div className="mt-8 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="skeleton h-4" style={{ width: `${95 - i * 8}%` }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !video) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-32 text-center sm:px-8">
        <p className="label text-terra">Ошибка</p>
        <h1 className="display mt-4 text-4xl">{error || 'Видео не найдено'}</h1>
        <Link to="/videos" className="btn-primary mt-8">
          Все видео
        </Link>
      </div>
    )
  }

  const wide = video.aspect === '16:9'

  return (
    <div>
      <SEOHead
        title={video.title}
        description={description}
        image={video.poster_url}
        imageWidth={video.width ? String(video.width) : undefined}
        imageHeight={video.height ? String(video.height) : undefined}
        url={canonical}
        type="video.other"
        publishedTime={video.published_at}
        modifiedTime={video.updated_at}
        tags={video.tags}
        video={{ url: video.video_url, type: 'video/mp4', width: video.width, height: video.height }}
      />

      <div className="mx-auto max-w-6xl px-5 pt-0 sm:px-8 sm:pt-12">
        <div className={`grid grid-cols-1 gap-8 lg:grid-cols-12 ${wide ? 'lg:gap-y-10' : 'lg:gap-14'}`}>
          {/* ── Плеер ─────────────────────────────────────────────── */}
          <div className={wide ? 'lg:col-span-12' : 'lg:col-span-5'}>
            {/* На телефоне — чёрная полоса от края до края */}
            <div className={`-mx-5 bg-black sm:mx-0 ${wide ? '' : 'lg:sticky lg:top-28'}`}>
              {wide ? (
                <div className="aspect-video w-full">
                  <CustomVideoPlayer
                    src={video.video_url}
                    poster={video.poster_url}
                    title={video.title}
                    preload="metadata"
                    fit="contain"
                    onWatched={handleWatched}
                    className="h-full w-full"
                  />
                </div>
              ) : (
                <div
                  className="mx-auto aspect-[9/16] max-h-[80dvh]"
                  style={{ width: 'min(100%, calc(80dvh * 9 / 16))' }}
                >
                  <CustomVideoPlayer
                    src={video.video_url}
                    poster={video.poster_url}
                    title={video.title}
                    preload="metadata"
                    fit="contain"
                    onWatched={handleWatched}
                    className="h-full w-full"
                  />
                </div>
              )}
            </div>
          </div>

          {/* ── Текст ─────────────────────────────────────────────── */}
          <div className={wide ? 'lg:col-span-8' : 'lg:col-span-7'}>
            <Link to="/videos" className="label link-wipe hover:text-tile">
              ← Все видео
            </Link>

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2">
              <span className="label">{formatDateRu(video.published_at)}</span>
              <span className="label numeric">{formatViews(views)} просм.</span>
              {video.duration_sec > 0 && (
                <span className="label numeric">{formatDuration(video.duration_sec)}</span>
              )}
              {categoryName && (
                <Link
                  to={`/videos?c=${encodeURIComponent(categories.find((c) => c.id === video.category_id)?.slug || '')}`}
                  className="label label-tile link-wipe"
                >
                  {categoryName}
                </Link>
              )}
            </div>

            <h1 className="display mt-5 text-[clamp(2rem,6vw,3.75rem)]">{video.title}</h1>

            {paragraphs.length > 0 && (
              <div className="mt-6 max-w-measure space-y-4 text-[1.05rem] leading-[1.7] text-ink/90 sm:text-lg">
                {paragraphs.map((p, i) => (
                  <p key={i} className="whitespace-pre-line">
                    {p}
                  </p>
                ))}
              </div>
            )}

            {video.tags?.length > 0 && (
              <ul className="mt-6 flex flex-wrap gap-2" aria-label="Теги">
                {video.tags.map((tag) => (
                  <li key={tag} className="label border border-ink/20 px-2.5 py-1">
                    #{tag}
                  </li>
                ))}
              </ul>
            )}

            {(video.instagram_url || video.youtube_url) && (
              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
                {video.instagram_url && (
                  <a
                    href={video.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="label link-wipe hover:text-tile"
                  >
                    Оригинал в Instagram ↗
                  </a>
                )}
                {video.youtube_url && (
                  <a
                    href={video.youtube_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="label link-wipe hover:text-tile"
                  >
                    YouTube ↗
                  </a>
                )}
              </div>
            )}

            <div className="rule-t rule-b my-10 py-8">
              <Reactions adapter={reactionsAdapter} prompt="Как вам видео?" />
            </div>

            <SocialShare url={canonical} title={video.title} description={description} />

            <VideoOrderBlock variant="full" className="-mx-5 mt-12 sm:mx-0" />
          </div>
        </div>

        {/* ── Ещё видео ──────────────────────────────────────────── */}
        {more.length > 0 && (
          <section className="mt-20">
            <div className="ornament mb-10">
              <span className="label label-tile">◆</span>
            </div>
            <div className="mb-8 flex items-baseline justify-between gap-4">
              <h2 className="display text-3xl sm:text-4xl">Ещё видео</h2>
              <Link to="/videos" className="label link-wipe hover:text-tile">
                Все видео →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-4 sm:gap-x-5">
              {more.map((v) => (
                <VideoCard key={v.id} video={v} categoryName={categoryNames[v.category_id]} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

export default VideoPage
