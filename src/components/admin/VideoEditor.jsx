/**
 * Форма видео: создание и правка.
 *
 * Порядок сохранения: проверка → mp4 в R2 (с прогрессом и отменой) →
 * обложка в R2 → строка в базе. Если база отказала, только что залитые
 * файлы удаляются, чтобы в бакете не копились сироты. Старые файлы при
 * замене удаляются только ПОСЛЕ успешной записи в базу.
 */
import { useEffect, useRef, useState } from 'react'
import CustomVideoPlayer from '../CustomVideoPlayer'
import PosterPicker from './PosterPicker'
import { createVideo, deleteMediaFiles, isSlugFree, updateVideo, uploadMediaFile } from '../../services/videoService'
import { formatDuration, SLUG_RE, slugify } from '../../utils/videoFormat'
import { probeVideoFile } from '../../utils/videoProbe'

const MAX_VIDEO_BYTES = 200 * 1024 * 1024
const INPUT =
  'w-full border border-ink/25 bg-paper px-3 py-2.5 text-base text-ink focus:border-tile focus:outline-none'
const SITE_HOST = 'izzatullaev.uz'

const pad = (n) => String(n).padStart(2, '0')
const mb = (bytes) => {
  const v = (Number(bytes) || 0) / 1024 / 1024
  return v >= 10 ? Math.round(v).toString() : v.toFixed(1).replace('.', ',')
}

/** ISO → значение для datetime-local в часовом поясе телефона */
function toLocalInput(value) {
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** datetime-local → Date. Разбираем вручную: строку без зоны браузеры читают по-разному */
function fromLocalInput(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value || '')
  if (!m) return null
  const d = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5])
  return Number.isNaN(d.getTime()) ? null : d
}

function defaultScheduleDate() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(20, 0, 0, 0)
  return d
}

/** «a, b, #c, a» → ['a', 'b', 'c'] */
function parseTags(text) {
  const seen = new Set()
  const out = []
  for (const raw of String(text || '').split(/[,，\n]/)) {
    const tag = raw.trim().replace(/^#+/, '').trim()
    const key = tag.toLowerCase()
    if (!tag || seen.has(key)) continue
    seen.add(key)
    out.push(tag)
  }
  return out
}

function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

function saveErrorText(err) {
  const m = String(err?.message || '')
  if (/отменена|abort/i.test(m)) return 'Загрузка отменена'
  if (/row-level security|permission denied/i.test(m)) return 'Нет прав на запись — войдите как админ заново'
  return m || 'Не удалось сохранить'
}

function isLive(video) {
  return (
    video?.status === 'published' && (!video.published_at || new Date(video.published_at) <= new Date())
  )
}

function initialPublication(video) {
  if (!video || video.status !== 'published') return 'draft'
  return isLive(video) ? 'now' : 'schedule'
}

function Field({ label, htmlFor, hint, error, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="label mb-1.5 block">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-sm text-ink-soft">{hint}</p>}
      {error && <p className="mt-1 text-sm text-terra">{error}</p>}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section className="rule-t space-y-4 py-6">
      <h3 className="label label-tile">{title}</h3>
      {children}
    </section>
  )
}

function VideoEditor({ video, categories, onSaved, onCancel }) {
  const isEdit = Boolean(video?.id)
  const wasLive = isLive(video)

  // Файл
  const [file, setFile] = useState(null)
  const [fileMeta, setFileMeta] = useState(null)
  const [fileUrl, setFileUrl] = useState(null)
  const [fileError, setFileError] = useState('')
  const [probing, setProbing] = useState(false)
  const [poster, setPoster] = useState(null)
  const [fileVersion, setFileVersion] = useState(0)

  // Поля
  const [title, setTitle] = useState(video?.title || '')
  const [slug, setSlug] = useState(video?.slug || '')
  // В правке адрес не следует за названием: у опубликованного видео он уже в ссылках
  const [slugTouched, setSlugTouched] = useState(isEdit)
  const [description, setDescription] = useState(video?.description || '')
  const [categoryId, setCategoryId] = useState(video?.category_id != null ? String(video.category_id) : '')
  const [tagsText, setTagsText] = useState((video?.tags || []).join(', '))
  const [aspect, setAspect] = useState(video?.aspect || '9:16')
  const [publication, setPublication] = useState(() => initialPublication(video))
  const [scheduleAt, setScheduleAt] = useState(() =>
    toLocalInput(
      video?.published_at && initialPublication(video) === 'schedule' ? video.published_at : defaultScheduleDate()
    )
  )
  const [pinned, setPinned] = useState(Boolean(video?.pinned))
  const [instagramUrl, setInstagramUrl] = useState(video?.instagram_url || '')
  const [youtubeUrl, setYoutubeUrl] = useState(video?.youtube_url || '')

  // Сохранение
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [phase, setPhase] = useState(null) // check | video | poster | save
  const [progress, setProgress] = useState(0)

  const aliveRef = useRef(false)
  const abortRef = useRef(null)
  const probeSeqRef = useRef(0)
  const savingRef = useRef(false)

  useEffect(() => {
    aliveRef.current = true
    return () => {
      aliveRef.current = false
      probeSeqRef.current += 1
      // Ушли со страницы посреди загрузки — не тянем 200 МБ впустую
      abortRef.current?.abort()
    }
  }, [])

  // Предпросмотр выбранного файла
  useEffect(() => {
    if (!file) {
      setFileUrl(null)
      return undefined
    }
    const url = URL.createObjectURL(file)
    setFileUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const handleTitle = (e) => {
    setTitle(e.target.value)
    if (!slugTouched) setSlug(slugify(e.target.value))
  }

  const handleSlug = (e) => {
    setSlugTouched(true)
    setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))
  }

  const handleFile = async (e) => {
    const picked = e.target.files?.[0]
    e.target.value = ''
    if (!picked) return
    let f = picked
    // Некоторые Android-галереи отдают mp4 без типа — сервер же ждёт ровно video/mp4
    if (!f.type && /\.mp4$/i.test(f.name)) f = new File([f], f.name, { type: 'video/mp4' })
    if (f.type !== 'video/mp4') {
      setFileError(
        f.type === 'video/quicktime'
          ? 'Это .mov. Сохраните ролик как MP4 (H.264) и выберите снова'
          : 'Нужен файл MP4'
      )
      return
    }
    if (f.size > MAX_VIDEO_BYTES) {
      setFileError(`Файл ${mb(f.size)} МБ — больше 200 МБ. Сожмите его перед загрузкой`)
      return
    }
    const seq = ++probeSeqRef.current
    setProbing(true)
    setFileError('')
    try {
      const meta = await probeVideoFile(f)
      if (!aliveRef.current || seq !== probeSeqRef.current) return
      setFile(f)
      setFileMeta(meta)
      setAspect(meta.height > meta.width ? '9:16' : '16:9')
      setPoster(null)
      setFileVersion((v) => v + 1)
      setErrors((prev) => ({ ...prev, file: undefined }))
    } catch (err) {
      if (aliveRef.current && seq === probeSeqRef.current) setFileError(err.message)
    } finally {
      if (aliveRef.current && seq === probeSeqRef.current) setProbing(false)
    }
  }

  const validate = () => {
    const errs = {}
    if (!isEdit && !file) errs.file = 'Выберите видео'
    const t = title.trim()
    if (!t) errs.title = 'Нужно название'
    else if (t.length > 200) errs.title = 'Не длиннее 200 знаков'
    if (!slug) errs.slug = 'Нужен адрес'
    else if (!SLUG_RE.test(slug)) errs.slug = 'Только латиница, цифры и дефисы между словами'
    if (publication === 'schedule') {
      const d = fromLocalInput(scheduleAt)
      if (!d) errs.scheduleAt = 'Укажите дату и время'
      else if (d <= new Date()) errs.scheduleAt = 'Дата должна быть в будущем'
    }
    if (instagramUrl.trim() && !isHttpsUrl(instagramUrl.trim())) errs.instagramUrl = 'Ссылка должна начинаться с https://'
    if (youtubeUrl.trim() && !isHttpsUrl(youtubeUrl.trim())) errs.youtubeUrl = 'Ссылка должна начинаться с https://'
    return errs
  }

  const publicationFields = () => {
    if (publication === 'draft') return { status: 'draft', published_at: null }
    if (publication === 'schedule') {
      return { status: 'published', published_at: fromLocalInput(scheduleAt).toISOString() }
    }
    // Уже вышедшему видео дату не сдвигаем — иначе оно «переедет» наверх ленты
    return {
      status: 'published',
      published_at: wasLive && video.published_at ? video.published_at : new Date().toISOString(),
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (savingRef.current || probing) return
    const errs = validate()
    setErrors(errs)
    setFormError('')
    if (Object.keys(errs).length) {
      setFormError('Исправьте отмеченные поля')
      return
    }

    savingRef.current = true
    setSaving(true)
    const controller = new AbortController()
    abortRef.current = controller
    const { signal } = controller
    const uploaded = []
    const throwIfAborted = () => {
      if (signal.aborted) throw new Error('Загрузка отменена')
    }

    try {
      setPhase('check')
      if (!(await isSlugFree(slug, video?.id))) {
        if (aliveRef.current) {
          setErrors({ slug: 'Этот адрес уже занят' })
          setFormError('Исправьте отмеченные поля')
        }
        return
      }
      throwIfAborted()

      const media = {}
      if (file) {
        setPhase('video')
        setProgress(0)
        const res = await uploadMediaFile(file, 'video', {
          signal,
          onProgress: (p) => aliveRef.current && setProgress(p),
        })
        uploaded.push(res.key)
        throwIfAborted()
        Object.assign(media, {
          video_url: res.publicUrl,
          video_key: res.key,
          size_bytes: res.size || file.size,
          duration_sec: fileMeta ? Math.round(fileMeta.duration * 100) / 100 : null,
          width: fileMeta?.width || null,
          height: fileMeta?.height || null,
        })
      }

      if (poster) {
        setPhase('poster')
        const posterFile = poster.file || new File([poster.blob], 'poster.jpg', { type: 'image/jpeg' })
        const res = await uploadMediaFile(posterFile, 'poster', { signal })
        uploaded.push(res.key)
        throwIfAborted()
        Object.assign(media, { poster_url: res.publicUrl, poster_key: res.key })
      }

      setPhase('save')
      const category = categories.find((c) => String(c.id) === categoryId)
      const row = {
        title: title.trim(),
        slug,
        description: description.trim() || null,
        category_id: category ? category.id : null,
        tags: parseTags(tagsText),
        aspect,
        pinned,
        instagram_url: instagramUrl.trim() || null,
        youtube_url: youtubeUrl.trim() || null,
        ...publicationFields(),
        ...media,
      }

      let saved
      try {
        saved = isEdit ? await updateVideo(video.id, row) : await createVideo(row)
      } catch (err) {
        if (/duplicate key|unique/i.test(err.message) && /slug/i.test(err.message)) {
          err.message = 'Этот адрес уже занят'
          if (aliveRef.current) setErrors({ slug: err.message })
        }
        throw err
      }
      uploaded.length = 0 // файлы теперь принадлежат строке в базе

      if (isEdit) {
        const replaced = []
        if (media.video_key && video.video_key && video.video_key !== media.video_key) replaced.push(video.video_key)
        if (media.poster_key && video.poster_key && video.poster_key !== media.poster_key) replaced.push(video.poster_key)
        if (replaced.length) deleteMediaFiles(replaced).catch((err) => console.warn('Старые файлы не удалены:', err))
      }

      onSaved(saved)
    } catch (err) {
      if (uploaded.length) {
        deleteMediaFiles([...uploaded]).catch((e2) => console.warn('Не удалось убрать загруженные файлы:', e2))
      }
      if (aliveRef.current) setFormError(saveErrorText(err))
    } finally {
      savingRef.current = false
      if (abortRef.current === controller) abortRef.current = null
      if (aliveRef.current) {
        setSaving(false)
        setPhase(null)
      }
    }
  }

  const cancelUpload = () => abortRef.current?.abort()

  // Что показывать в плеере предпросмотра
  const previewSrc = fileUrl || video?.video_url || null
  const previewPoster = poster?.previewUrl || (file ? undefined : video?.poster_url) || undefined
  const previewRatio = fileMeta
    ? `${fileMeta.width} / ${fileMeta.height}`
    : video?.width && video?.height
      ? `${video.width} / ${video.height}`
      : aspect === '16:9'
        ? '16 / 9'
        : '9 / 16'
  const shownMeta = fileMeta
    ? { duration: fileMeta.duration, width: fileMeta.width, height: fileMeta.height, size: file.size }
    : video?.video_url
      ? { duration: video.duration_sec, width: video.width, height: video.height, size: video.size_bytes }
      : null

  const slugChangedOnLive = isEdit && wasLive && slug !== video.slug
  const loadedBytes = file ? progress * file.size : 0

  return (
    <form onSubmit={handleSubmit} noValidate className="text-ink">
      <div className="mb-2 flex items-baseline justify-between gap-4">
        <h2 className="display text-2xl sm:text-3xl">{isEdit ? 'Правка видео' : 'Новое видео'}</h2>
        <button type="button" className="btn-ghost -mr-3 shrink-0" onClick={onCancel} disabled={saving}>
          ← К списку
        </button>
      </div>

      <Section title="Файл">
        {previewSrc && (
          <div
            className={`w-full bg-black ${aspect === '9:16' ? 'max-w-[260px]' : 'max-w-xl'}`}
            style={{ aspectRatio: previewRatio }}
          >
            <CustomVideoPlayer
              key={previewSrc}
              src={previewSrc}
              poster={previewPoster}
              title={title}
              preload="metadata"
              fit="contain"
              className="h-full w-full"
            />
          </div>
        )}

        {shownMeta && (
          <p className="label numeric">
            {formatDuration(shownMeta.duration)}
            {shownMeta.width && shownMeta.height ? ` · ${shownMeta.width}×${shownMeta.height}` : ''}
            {shownMeta.size ? ` · ${mb(shownMeta.size)} МБ` : ''}
            {file ? ' · новый файл' : ''}
          </p>
        )}

        <label
          className={
            previewSrc
              ? 'btn-secondary cursor-pointer'
              : 'flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-2 border border-dashed border-ink/35 bg-paper-deep px-4 py-8 text-center'
          }
        >
          {previewSrc ? (
            probing ? 'Читаем файл…' : 'Заменить файл'
          ) : (
            <>
              <span className="display text-xl">{probing ? 'Читаем файл…' : 'Выбрать MP4'}</span>
              <span className="label">до 200 МБ · H.264</span>
            </>
          )}
          <input
            type="file"
            accept="video/mp4"
            className="sr-only"
            onChange={handleFile}
            disabled={saving || probing}
          />
        </label>
        {(fileError || errors.file) && <p className="text-sm text-terra">{fileError || errors.file}</p>}
      </Section>

      {previewSrc && (
        <Section title="Обложка">
          <PosterPicker
            // Новый файл — новый выбор кадра с чистого листа
            key={fileVersion}
            file={file}
            videoUrl={file ? null : video?.video_url}
            initialPosterUrl={file ? null : video?.poster_url}
            onChange={setPoster}
          />
        </Section>
      )}

      <Section title="Описание">
        <Field label="Название" htmlFor="v-title" error={errors.title}>
          <input id="v-title" value={title} onChange={handleTitle} maxLength={200} className={INPUT} />
        </Field>

        <Field
          label="Адрес"
          htmlFor="v-slug"
          error={errors.slug}
          hint={
            slugChangedOnLive
              ? 'Видео уже опубликовано — старая ссылка перестанет работать'
              : undefined
          }
        >
          <input
            id="v-slug"
            value={slug}
            onChange={handleSlug}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className={`${INPUT} font-mono text-sm`}
          />
          <p className="folio mt-1 break-all">
            {SITE_HOST}/videos/{slug || '…'}
          </p>
        </Field>

        <Field label="Текст под видео" htmlFor="v-desc">
          <textarea
            id="v-desc"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`${INPUT} resize-y`}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Категория" htmlFor="v-cat">
            <select
              id="v-cat"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={INPUT}
            >
              <option value="">Без категории</option>
              {categories.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Теги через запятую" htmlFor="v-tags">
            <input
              id="v-tags"
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              placeholder="bobo, eshak, reklama"
              autoCapitalize="none"
              className={INPUT}
            />
          </Field>
        </div>

        <fieldset>
          <legend className="label mb-2">Формат</legend>
          <div className="flex gap-6">
            {['9:16', '16:9'].map((a) => (
              <label key={a} className="flex min-h-[44px] cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="aspect"
                  value={a}
                  checked={aspect === a}
                  onChange={() => setAspect(a)}
                  className="h-4 w-4 accent-tile"
                />
                <span className="font-mono">{a}</span>
                <span className="text-sm text-ink-soft">{a === '9:16' ? 'вертикальное' : 'горизонтальное'}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </Section>

      <Section title="Публикация">
        <fieldset className="space-y-1">
          <legend className="sr-only">Статус</legend>
          {[
            ['draft', 'Черновик', 'видно только в админке'],
            ['now', wasLive ? 'Опубликовано' : 'Опубликовать сейчас', wasLive ? 'дата выхода не меняется' : null],
            ['schedule', 'Запланировать', 'выйдет само в указанное время'],
          ].map(([value, text, hint]) => (
            <label key={value} className="flex min-h-[44px] cursor-pointer items-center gap-3">
              <input
                type="radio"
                name="publication"
                value={value}
                checked={publication === value}
                onChange={() => setPublication(value)}
                className="h-4 w-4 accent-tile"
              />
              <span>{text}</span>
              {hint && <span className="text-sm text-ink-soft">— {hint}</span>}
            </label>
          ))}
        </fieldset>

        {publication === 'schedule' && (
          <Field label="Дата и время выхода" htmlFor="v-when" error={errors.scheduleAt}>
            <input
              id="v-when"
              type="datetime-local"
              value={scheduleAt}
              min={toLocalInput(new Date())}
              onChange={(e) => setScheduleAt(e.target.value)}
              className={INPUT}
            />
          </Field>
        )}

        <label className="flex min-h-[44px] cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={pinned}
            onChange={(e) => setPinned(e.target.checked)}
            className="h-4 w-4 accent-tile"
          />
          <span>Закрепить</span>
          <span className="text-sm text-ink-soft">— первым в ленте</span>
        </label>
      </Section>

      <Section title="Ссылки на оригинал">
        <Field label="Instagram" htmlFor="v-ig" error={errors.instagramUrl}>
          <input
            id="v-ig"
            type="url"
            inputMode="url"
            value={instagramUrl}
            onChange={(e) => setInstagramUrl(e.target.value)}
            placeholder="https://www.instagram.com/reel/…"
            autoCapitalize="none"
            className={INPUT}
          />
        </Field>
        <Field label="YouTube" htmlFor="v-yt" error={errors.youtubeUrl}>
          <input
            id="v-yt"
            type="url"
            inputMode="url"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder="https://youtube.com/shorts/…"
            autoCapitalize="none"
            className={INPUT}
          />
        </Field>
      </Section>

      {/* Панель сохранения прилипает к низу экрана — на телефоне не надо листать до конца */}
      <div className="sticky bottom-0 z-10 -mx-4 border-t border-ink/20 bg-paper px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:mx-0 sm:px-0">
        {saving && phase === 'video' && file && (
          <div className="mb-3">
            <div className="mb-1 flex items-baseline justify-between gap-3">
              <span className="label numeric">
                Видео · {Math.floor(progress * 100)}% · {mb(loadedBytes)} из {mb(file.size)} МБ
              </span>
              <button type="button" className="btn-ghost -mr-3 text-terra" onClick={cancelUpload}>
                Отменить
              </button>
            </div>
            <div className="h-1.5 w-full bg-ink/10" role="progressbar" aria-valuenow={Math.floor(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full bg-tile transition-[width] duration-200" style={{ width: `${progress * 100}%` }} />
            </div>
          </div>
        )}
        {saving && phase && phase !== 'video' && (
          <p className="label mb-2">
            {phase === 'check' ? 'Проверяем адрес…' : phase === 'poster' ? 'Загружаем обложку…' : 'Сохраняем…'}
          </p>
        )}
        {formError && (
          <p role="alert" className="mb-2 text-sm text-terra">
            {formError}
          </p>
        )}
        <div className="flex gap-3">
          <button type="submit" className="btn-primary flex-1 justify-center" disabled={saving || probing}>
            {saving ? 'Сохраняем…' : isEdit ? 'Сохранить' : 'Добавить видео'}
          </button>
          <button type="button" className="btn-secondary px-4" onClick={onCancel} disabled={saving}>
            Отмена
          </button>
        </div>
      </div>
    </form>
  )
}

export default VideoEditor
