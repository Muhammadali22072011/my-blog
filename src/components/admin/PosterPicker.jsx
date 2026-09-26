/**
 * Обложка видео: кадр из самого ролика (по умолчанию) или своя картинка.
 *
 * Кадр снимается со скрытого <video> через canvas. Для только что выбранного
 * файла это blob-адрес — никаких проблем с CORS. Для уже загруженного видео
 * (режим правки) ролик тянется из R2 с crossOrigin="anonymous": без
 * разрешённого GET в CORS бакета браузер не отдаст пиксели.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { captureFrame, probeImageFile, seekVideo } from '../../utils/videoProbe'

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const CORS_HINT =
  'Чтобы брать кадр из уже загруженного видео, разрешите GET в CORS бакета R2. Пока можно загрузить свою картинку.'

// ИИ-ролики часто начинаются с чёрного кадра — берём чуть дальше начала
const defaultFrameTime = (duration) => Math.min(1, duration * 0.1)

function PosterPicker({ file, videoUrl, initialPosterUrl, onChange }) {
  const videoRef = useRef(null)
  const previewUrlRef = useRef(null)
  const seqRef = useRef(0)
  const mountedRef = useRef(false)
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  })

  const [fileUrl, setFileUrl] = useState(null)
  const [remoteEnabled, setRemoteEnabled] = useState(false)
  const [duration, setDuration] = useState(0)
  const [time, setTime] = useState(0)
  const [pendingTime, setPendingTime] = useState(null)
  const [preview, setPreview] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [corsBlocked, setCorsBlocked] = useState(false)

  const isRemote = !file && Boolean(videoUrl)
  const src = file ? fileUrl : remoteEnabled ? videoUrl : null

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      seqRef.current += 1
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = null
    }
  }, [])

  // Свой blob-адрес для скрытого плеера; отпускаем при смене файла
  useEffect(() => {
    if (!file) {
      setFileUrl(null)
      return undefined
    }
    const url = URL.createObjectURL(file)
    setFileUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const showPreview = useCallback((url, width, height, source) => {
    if (previewUrlRef.current && previewUrlRef.current !== url) URL.revokeObjectURL(previewUrlRef.current)
    previewUrlRef.current = url
    setPreview(url ? { url, width, height, source } : null)
  }, [])

  const grabFrame = useCallback(
    async (t) => {
      const video = videoRef.current
      if (!video) return
      const seq = ++seqRef.current
      setBusy(true)
      setError('')
      try {
        await seekVideo(video, t)
        const blob = await captureFrame(video, 1080)
        if (!mountedRef.current || seq !== seqRef.current) return
        const url = URL.createObjectURL(blob)
        const scale = Math.min(1, 1080 / Math.max(video.videoWidth, video.videoHeight))
        const width = Math.round(video.videoWidth * scale)
        const height = Math.round(video.videoHeight * scale)
        showPreview(url, width, height, 'frame')
        onChangeRef.current?.({ blob, previewUrl: url, width, height })
      } catch (err) {
        if (!mountedRef.current || seq !== seqRef.current) return
        if (err?.name === 'SecurityError') setCorsBlocked(true)
        else setError(err?.message || 'Не удалось взять кадр')
      } finally {
        if (mountedRef.current && seq === seqRef.current) setBusy(false)
      }
    },
    [showPreview]
  )

  // Ползунок двигают часто — снимаем кадр, когда палец остановился
  useEffect(() => {
    if (pendingTime == null) return undefined
    const timer = setTimeout(() => {
      grabFrame(pendingTime)
      setPendingTime(null)
    }, 180)
    return () => clearTimeout(timer)
  }, [pendingTime, grabFrame])

  const handleMetadata = () => {
    const d = videoRef.current?.duration
    const safe = Number.isFinite(d) ? d : 0
    setDuration(safe)
    const t = defaultFrameTime(safe)
    setTime(t)
    // Новый файл — сразу предлагаем кадр; в правке старая обложка остаётся, пока не тронули ползунок
    if (file) setPendingTime(t)
  }

  const handleVideoError = () => {
    if (isRemote) setCorsBlocked(true)
    else setError('Видео не открылось для выбора кадра — загрузите свою картинку')
  }

  const handleSlider = (e) => {
    const t = Number(e.target.value)
    setTime(t)
    setPendingTime(t)
  }

  const handleCustomImage = async (e) => {
    const picked = e.target.files?.[0]
    e.target.value = ''
    if (!picked) return
    if (!IMAGE_TYPES.includes(picked.type)) {
      setError('Картинка должна быть JPG, PNG или WebP')
      return
    }
    if (picked.size > MAX_IMAGE_BYTES) {
      setError('Картинка больше 5 МБ')
      return
    }
    // Отменяем кадр, который мог ещё сниматься
    const seq = ++seqRef.current
    setBusy(false)
    setError('')
    try {
      const { width, height } = await probeImageFile(picked)
      if (!mountedRef.current || seq !== seqRef.current) return
      const url = URL.createObjectURL(picked)
      showPreview(url, width, height, 'custom')
      onChangeRef.current?.({ file: picked, previewUrl: url, width, height })
    } catch (err) {
      if (mountedRef.current) setError(err.message)
    }
  }

  const resetToInitial = () => {
    seqRef.current += 1
    setBusy(false)
    showPreview(null)
    onChangeRef.current?.(null)
  }

  const shownUrl = preview?.url || initialPosterUrl || null
  const ratio = preview ? `${preview.width} / ${preview.height}` : '9 / 16'
  const canPickFrame = Boolean(src) && !corsBlocked && duration > 0
  const step = duration > 0 ? Math.max(0.04, duration / 400) : 0.1

  return (
    <div className="relative space-y-3">
      {src && (
        <video
          key={src}
          ref={videoRef}
          src={src}
          crossOrigin={isRemote ? 'anonymous' : undefined}
          preload="auto"
          muted
          playsInline
          aria-hidden="true"
          tabIndex={-1}
          // Не display:none — некоторые браузеры тогда не декодируют кадры
          className="pointer-events-none absolute left-0 top-0 h-px w-px opacity-0"
          onLoadedMetadata={handleMetadata}
          onError={handleVideoError}
        />
      )}

      <div className="flex items-start gap-4">
        <div
          className="relative w-28 shrink-0 overflow-hidden border border-ink/15 bg-paper-deep sm:w-36"
          style={{ aspectRatio: ratio }}
        >
          {shownUrl ? (
            <img src={shownUrl} alt="Обложка" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center p-2 text-center">
              <span className="label">{busy ? 'Кадр…' : 'Нет обложки'}</span>
            </div>
          )}
          {busy && shownUrl && <div className="skeleton absolute inset-0 opacity-60" />}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <p className="label">
            {preview?.source === 'custom'
              ? 'Своя картинка'
              : preview?.source === 'frame'
                ? `Кадр на ${time.toFixed(1)} с`
                : initialPosterUrl
                  ? 'Текущая обложка'
                  : 'Кадр из видео'}
          </p>

          {isRemote && !remoteEnabled && !corsBlocked && (
            <button type="button" className="btn-ghost -ml-3" onClick={() => setRemoteEnabled(true)}>
              Выбрать кадр из видео
            </button>
          )}

          <label className="btn-ghost -ml-3 cursor-pointer">
            Загрузить свою картинку
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={handleCustomImage}
            />
          </label>

          {preview && initialPosterUrl && (
            <button type="button" className="btn-ghost -ml-3" onClick={resetToInitial}>
              Вернуть прежнюю
            </button>
          )}
        </div>
      </div>

      {canPickFrame && (
        <div>
          <label className="label mb-1 block" htmlFor="poster-frame">
            Кадр · {time.toFixed(1)} из {duration.toFixed(1)} с
          </label>
          <input
            id="poster-frame"
            type="range"
            min={0}
            max={duration}
            step={step}
            value={time}
            onChange={handleSlider}
            className="h-8 w-full accent-tile"
          />
        </div>
      )}

      {remoteEnabled && !canPickFrame && !corsBlocked && !error && (
        <div className="skeleton h-8 w-full" aria-label="Видео загружается" />
      )}

      {corsBlocked && <p className="text-sm text-terra">{CORS_HINT}</p>}
      {error && <p className="text-sm text-terra">{error}</p>}
    </div>
  )
}

export default PosterPicker
