// ============================================================================
// CUSTOM VIDEO PLAYER
// Один плеер на весь сайт: видео в постах и лента раздела «Видео».
//
// Без новых пропсов ведёт себя как раньше (видео в тексте поста).
// Для ленты:
//   variant="reel"   — минимальный слой: тап включает/выключает звук,
//                      удержание ставит на паузу, внизу тонкая полоса
//   active           — если задан, играть/стоять решает родитель
//   muted + onMutedChange — общий звук на всю ленту
//   preload, loop, fit, className, onWatched (после watchedAfter секунд)
//
// Что исправлено в старом плеере:
//   - звук выключался через volume = 0, а на iPhone громкость только
//     для чтения — теперь video.muted;
//   - не было playsInline: iPhone открывал системный полноэкранный плеер;
//   - при preload="none" значок загрузки крутился вечно и прятал кнопку;
//   - состояние «играет» ставилось заранее и расходилось с видео, если
//     браузер запрещал автозапуск;
//   - панель была белым текстом на бежевом фоне в светлой теме.
// ============================================================================
import { useState, useRef, useEffect, useCallback } from 'react'

const LONG_PRESS_MS = 280

const formatTime = (seconds) => {
  if (!Number.isFinite(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function CustomVideoPlayer({
  src,
  poster,
  title,
  variant = 'default',
  active,
  muted: mutedProp,
  onMutedChange,
  preload = 'metadata',
  loop = false,
  fit,
  className = '',
  onWatched,
  watchedAfter = 3,
}) {
  const isReel = variant === 'reel'
  const videoRef = useRef(null)
  const containerRef = useRef(null)
  const controlsTimeoutRef = useRef(null)
  const pressTimerRef = useRef(null)
  const flashTimerRef = useRef(null)
  const longPressRef = useRef(false)
  const watchedRef = useRef({ fired: false, seconds: 0, last: null })

  const [isPlaying, setIsPlaying] = useState(false)
  const [isWaiting, setIsWaiting] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [mutedState, setMutedState] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [flash, setFlash] = useState(null)

  const isMutedControlled = mutedProp !== undefined
  const isMuted = isMutedControlled ? mutedProp : mutedState

  const setMuted = useCallback(
    (value) => {
      if (!isMutedControlled) setMutedState(value)
      onMutedChange?.(value)
    },
    [isMutedControlled, onMutedChange]
  )

  // Звук — через свойство элемента, а не атрибут: React не обновляет muted
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = isMuted
  }, [isMuted, src])

  // Новый файл — новое состояние
  useEffect(() => {
    setCurrentTime(0)
    setDuration(0)
    setIsPlaying(false)
    setIsWaiting(false)
    setHasError(false)
    watchedRef.current = { fired: false, seconds: 0, last: null }
  }, [src])

  /**
   * play() возвращает промис и может быть отклонён политикой автозапуска.
   * Со звуком не пустили — пробуем без звука: так видео всё равно идёт,
   * а звук включится тапом.
   */
  const safePlay = useCallback(async () => {
    const video = videoRef.current
    if (!video) return
    try {
      await video.play()
    } catch (err) {
      if (err?.name === 'NotAllowedError' && !video.muted) {
        video.muted = true
        setMuted(true)
        try {
          await video.play()
        } catch {
          /* и без звука нельзя — останется кнопка запуска */
        }
      }
    }
  }, [setMuted])

  // Внешнее управление: играет только активное видео
  useEffect(() => {
    const video = videoRef.current
    if (active === undefined || !video) return
    if (active) safePlay()
    else video.pause()
  }, [active, src, safePlay])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const onLoaded = () => setDuration(video.duration)
    const onTime = () => {
      setCurrentTime(video.currentTime)
      // Засчитываем просмотр по реально проигранному времени, а не по открытию
      const w = watchedRef.current
      if (!w.fired && onWatched) {
        const t = video.currentTime
        if (w.last !== null && t > w.last && t - w.last < 1.5) w.seconds += t - w.last
        w.last = t
        if (w.seconds >= watchedAfter) {
          w.fired = true
          onWatched()
        }
      }
    }
    const onPlay = () => {
      setIsPlaying(true)
      setHasError(false)
    }
    const onPause = () => setIsPlaying(false)
    const onWaiting = () => setIsWaiting(true)
    const onReady = () => setIsWaiting(false)
    const onError = () => {
      setHasError(true)
      setIsWaiting(false)
    }
    const onVolume = () => {
      if (!isMutedControlled) setMutedState(video.muted)
    }

    const events = {
      loadedmetadata: onLoaded,
      durationchange: onLoaded,
      timeupdate: onTime,
      play: onPlay,
      pause: onPause,
      ended: onPause,
      waiting: onWaiting,
      playing: onReady,
      canplay: onReady,
      error: onError,
      volumechange: onVolume,
    }
    Object.entries(events).forEach(([name, fn]) => video.addEventListener(name, fn))
    return () => Object.entries(events).forEach(([name, fn]) => video.removeEventListener(name, fn))
  }, [src, onWatched, watchedAfter, isMutedControlled])

  useEffect(() => {
    const onChange = () => {
      const el = document.fullscreenElement || document.webkitFullscreenElement
      setIsFullscreen(Boolean(el && el === containerRef.current))
    }
    document.addEventListener('fullscreenchange', onChange)
    document.addEventListener('webkitfullscreenchange', onChange)
    return () => {
      document.removeEventListener('fullscreenchange', onChange)
      document.removeEventListener('webkitfullscreenchange', onChange)
      clearTimeout(controlsTimeoutRef.current)
      clearTimeout(pressTimerRef.current)
      clearTimeout(flashTimerRef.current)
    }
  }, [])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) safePlay()
    else video.pause()
  }

  const toggleMute = () => {
    const video = videoRef.current
    const next = !isMuted
    if (video) {
      video.muted = next
      if (!next && video.volume === 0) {
        video.volume = volume || 0.5
      }
    }
    setMuted(next)
    if (isReel) {
      setFlash(next ? 'muted' : 'sound')
      clearTimeout(flashTimerRef.current)
      flashTimerRef.current = setTimeout(() => setFlash(null), 700)
    }
  }

  const handleVolumeChange = (e) => {
    const video = videoRef.current
    if (!video) return
    const newVolume = parseFloat(e.target.value)
    video.volume = newVolume
    setVolume(newVolume)
    const nextMuted = newVolume === 0
    video.muted = nextMuted
    setMuted(nextMuted)
  }

  const seekTo = (clientX, bar) => {
    const video = videoRef.current
    if (!video || !duration) return
    const rect = bar.getBoundingClientRect()
    const pos = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    video.currentTime = pos * duration
    setCurrentTime(pos * duration)
  }

  const onSeekPointerDown = (e) => {
    const bar = e.currentTarget
    bar.setPointerCapture?.(e.pointerId)
    seekTo(e.clientX, bar)
    const move = (ev) => seekTo(ev.clientX, bar)
    const up = () => {
      bar.removeEventListener('pointermove', move)
      bar.removeEventListener('pointerup', up)
      bar.removeEventListener('pointercancel', up)
    }
    bar.addEventListener('pointermove', move)
    bar.addEventListener('pointerup', up)
    bar.addEventListener('pointercancel', up)
  }

  const toggleFullscreen = () => {
    const container = containerRef.current
    const video = videoRef.current
    if (!container || !video) return

    if (document.fullscreenElement || document.webkitFullscreenElement) {
      ;(document.exitFullscreen || document.webkitExitFullscreen)?.call(document)
      return
    }
    if (container.requestFullscreen) container.requestFullscreen()
    else if (container.webkitRequestFullscreen) container.webkitRequestFullscreen()
    // iPhone: полноэкранным может быть только сам <video>
    else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen()
  }

  const revealControls = () => {
    setShowControls(true)
    clearTimeout(controlsTimeoutRef.current)
    if (!videoRef.current?.paused) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000)
    }
  }

  // ── Лента: тап — звук, удержание — пауза ──────────────────────────────────
  const onReelPointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return
    longPressRef.current = false
    clearTimeout(pressTimerRef.current)
    pressTimerRef.current = setTimeout(() => {
      longPressRef.current = true
      videoRef.current?.pause()
    }, LONG_PRESS_MS)
  }

  const onReelPointerUp = () => {
    clearTimeout(pressTimerRef.current)
    if (longPressRef.current) {
      longPressRef.current = false
      if (active !== false) safePlay()
      return
    }
    // Короткий тап. Если видео стоит (браузер не дал запустить) — запускаем,
    // иначе переключаем звук
    const video = videoRef.current
    if (video?.paused && active !== false) safePlay()
    else toggleMute()
  }

  const onReelPointerCancel = () => {
    clearTimeout(pressTimerRef.current)
    if (longPressRef.current) {
      longPressRef.current = false
      if (active !== false) safePlay()
    }
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0
  const objectFit = fit === 'cover' ? 'object-cover' : 'object-contain'
  const videoClass = isReel || fit ? `h-full w-full ${objectFit}` : 'block h-auto w-full'

  const video = (
    <video
      ref={videoRef}
      src={src}
      poster={poster}
      preload={preload}
      loop={loop}
      playsInline
      webkit-playsinline="true"
      className={videoClass}
      onClick={isReel ? undefined : togglePlay}
      aria-label={title || 'Видео'}
    />
  )

  if (isReel) {
    return (
      <div
        ref={containerRef}
        className={`custom-video-player relative select-none overflow-hidden bg-black ${className}`}
        style={{ WebkitTouchCallout: 'none' }}
        onPointerDown={onReelPointerDown}
        onPointerUp={onReelPointerUp}
        onPointerCancel={onReelPointerCancel}
        onPointerLeave={onReelPointerCancel}
        onContextMenu={(e) => e.preventDefault()}
      >
        {video}

        {isWaiting && isPlaying && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-2 border-white/25 border-t-white" />
          </div>
        )}

        {!isPlaying && !isWaiting && active !== false && !longPressRef.current && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/45 text-white">
              <svg className="ml-1 h-8 w-8" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
            </span>
          </div>
        )}

        {hasError && (
          <p className="label pointer-events-none absolute inset-x-0 top-1/2 text-center text-white/80">
            Видео не загрузилось
          </p>
        )}

        {/* Вспышка при переключении звука */}
        {flash && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="fade-in flex h-16 w-16 items-center justify-center rounded-full bg-black/55 text-white">
              <SpeakerIcon muted={flash === 'muted'} className="h-7 w-7" />
            </span>
          </div>
        )}

        {/* Постоянная подсказка, пока звук выключен */}
        {isMuted && (
          <span
            className="label pointer-events-none absolute right-3 top-3 flex items-center gap-1.5 bg-black/45 px-2 py-1 text-white"
            style={{ top: 'max(0.75rem, env(safe-area-inset-top))' }}
          >
            <SpeakerIcon muted className="h-3.5 w-3.5" />
            Тапните для звука
          </span>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] bg-white/20">
          <div className="h-full bg-tile transition-[width] duration-200 ease-linear" style={{ width: `${progress}%` }} />
        </div>
      </div>
    )
  }

  // ── Обычный плеер (видео в тексте, страница видео) ───────────────────────
  return (
    <div
      ref={containerRef}
      className={`custom-video-player group relative overflow-hidden bg-black ${className}`}
      onMouseMove={revealControls}
      onTouchStart={revealControls}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {video}

      {isWaiting && isPlaying && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="h-14 w-14 animate-spin rounded-full border-2 border-white/25 border-t-white" />
        </div>
      )}

      {hasError && (
        <p className="label pointer-events-none absolute inset-x-0 top-1/2 text-center text-white/80">
          Видео не загрузилось
        </p>
      )}

      {/* Кнопка запуска */}
      {!isPlaying && !hasError && (
        <button
          type="button"
          className="absolute inset-0 flex items-center justify-center bg-black/25 transition-colors hover:bg-black/35"
          onClick={togglePlay}
          aria-label="Смотреть"
        >
          <span className="flex h-20 w-20 items-center justify-center bg-paper text-ink transition-transform duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_rgb(var(--tile))]">
            <svg className="ml-1 h-9 w-9" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
          </span>
        </button>
      )}

      {/* Панель управления — на тёмной подложке-градиенте в обеих темах */}
      <div
        className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent px-4 pb-3 pt-10 text-white transition-opacity duration-300 ${
          showControls || !isPlaying ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <div
          className="group/progress relative mb-3 flex h-4 cursor-pointer items-center"
          onPointerDown={onSeekPointerDown}
          role="slider"
          aria-label="Перемотка"
          aria-valuemin={0}
          aria-valuemax={Math.round(duration) || 0}
          aria-valuenow={Math.round(currentTime)}
        >
          <div className="h-1 w-full bg-white/25">
            <div className="relative h-full bg-tile" style={{ width: `${progress}%` }}>
              <span className="absolute right-0 top-1/2 h-3 w-3 -translate-y-1/2 translate-x-1/2 bg-white opacity-0 transition-opacity group-hover/progress:opacity-100" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button type="button" onClick={togglePlay} className="transition-colors hover:text-tile" aria-label={isPlaying ? 'Пауза' : 'Смотреть'}>
              {isPlaying ? (
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              )}
            </button>

            <div className="flex items-center gap-2">
              <button type="button" onClick={toggleMute} className="transition-colors hover:text-tile" aria-label={isMuted ? 'Включить звук' : 'Выключить звук'}>
                <SpeakerIcon muted={isMuted || volume === 0} className="h-5 w-5" />
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                aria-label="Громкость"
                className="hidden h-1 w-20 cursor-pointer appearance-none bg-white/25 accent-[rgb(var(--tile))] sm:block"
              />
            </div>

            <span className="label numeric text-white/90">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <button type="button" onClick={toggleFullscreen} className="transition-colors hover:text-tile" aria-label={isFullscreen ? 'Свернуть' : 'На весь экран'}>
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {title && (showControls || !isPlaying) && (
        <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/70 to-transparent px-4 pb-8 pt-3">
          <h3 className="text-base font-medium text-white">{title}</h3>
        </div>
      )}
    </div>
  )
}

function SpeakerIcon({ muted, className }) {
  return muted ? (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  ) : (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
    </svg>
  )
}

export default CustomVideoPlayer
