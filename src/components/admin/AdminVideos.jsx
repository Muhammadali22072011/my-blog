/**
 * Вкладка «Видео» в админке: список всех роликов (включая черновики и
 * отложенные), быстрые действия и форма добавления/правки.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import VideoEditor from './VideoEditor'
import VideoCategoriesManager from './VideoCategoriesManager'
import {
  deleteMediaFiles,
  deleteVideoRow,
  listAllVideos,
  listCategories,
  updateVideo,
} from '../../services/videoService'
import { formatViews } from '../../utils/videoFormat'

const pad = (n) => String(n).padStart(2, '0')
// Время показываем в поясе телефона админа — он и планирует в нём же
const shortDate = (d) => `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`
const dayTime = (d) => `${pad(d.getDate())}.${pad(d.getMonth() + 1)} в ${pad(d.getHours())}:${pad(d.getMinutes())}`

function videoState(video, now) {
  if (video.status !== 'published') return 'draft'
  if (video.published_at && new Date(video.published_at).getTime() > now) return 'scheduled'
  return 'published'
}

const FILTERS = [
  ['all', 'Все'],
  ['draft', 'Черновики'],
  ['published', 'Опубликованные'],
  ['scheduled', 'Запланированные'],
]

function StatusLabel({ state, video }) {
  if (state === 'draft') return <span className="label">Черновик</span>
  if (state === 'scheduled') {
    return <span className="label text-ink">◷ Выйдет {dayTime(new Date(video.published_at))}</span>
  }
  return <span className="label label-tile">Опубликовано</span>
}

function VideoRow({ video, state, categoryName, busy, onEdit, onTogglePublish, onDelete }) {
  const date = new Date(video.published_at || video.created_at)
  return (
    <li className="rule-b py-4">
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onEdit}
          className="aspect-[9/16] w-12 shrink-0 overflow-hidden bg-paper-deep"
          aria-label={`Изменить «${video.title}»`}
        >
          {video.poster_url ? (
            <img src={video.poster_url} alt="" loading="lazy" className="h-full w-full object-cover" />
          ) : (
            <span className="folio flex h-full items-center justify-center">—</span>
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            {video.pinned && (
              <span className="text-tile" title="Закреплено" aria-label="Закреплено">
                ◆
              </span>
            )}
            <button
              type="button"
              onClick={onEdit}
              className="min-w-0 text-left font-medium leading-snug text-ink hover:text-tile"
            >
              <span className="line-clamp-2 break-words">{video.title}</span>
            </button>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            <StatusLabel state={state} video={video} />
            {categoryName && <span className="label">{categoryName}</span>}
            <span className="folio numeric">{formatViews(video.views)} просм.</span>
            <span className="folio numeric">{Number.isNaN(date.getTime()) ? '' : shortDate(date)}</span>
          </div>

          <div className="-ml-3 mt-1 flex flex-wrap">
            <button type="button" className="btn-ghost" onClick={onEdit} disabled={busy}>
              Изменить
            </button>
            {state === 'published' && (
              <a
                href={`/videos/${video.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost"
              >
                Открыть ↗
              </a>
            )}
            <button type="button" className="btn-ghost" onClick={onTogglePublish} disabled={busy}>
              {state === 'draft' ? 'Опубликовать' : 'Снять'}
            </button>
            <button type="button" className="btn-ghost hover:!text-terra" onClick={onDelete} disabled={busy}>
              Удалить
            </button>
          </div>
        </div>
      </div>
    </li>
  )
}

function AdminVideos() {
  const [videos, setVideos] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  // null — список; 'new' — новое видео; объект — правка
  const [editing, setEditing] = useState(null)
  const [showCategories, setShowCategories] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [now, setNow] = useState(() => Date.now())
  const aliveRef = useRef(false)
  const topRef = useRef(null)

  const loadCategories = useCallback(async () => {
    try {
      const list = await listCategories()
      if (aliveRef.current) setCategories(list)
    } catch (err) {
      if (aliveRef.current) setError(err.message || 'Не удалось обновить категории')
    }
  }, [])

  const load = useCallback(async () => {
    setError('')
    try {
      const [v, c] = await Promise.all([listAllVideos(), listCategories()])
      if (!aliveRef.current) return
      setVideos(v)
      setCategories(c)
      setNow(Date.now())
    } catch (err) {
      if (aliveRef.current) setError(err.message || 'Не удалось загрузить видео')
    } finally {
      if (aliveRef.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    aliveRef.current = true
    load()
    // Раз в минуту пересчитываем «Выйдет …» → «Опубликовано»
    const timer = setInterval(() => setNow(Date.now()), 60000)
    return () => {
      aliveRef.current = false
      clearInterval(timer)
    }
  }, [load])

  const categoryNames = useMemo(() => new Map(categories.map((c) => [String(c.id), c.name])), [categories])

  const withState = useMemo(() => videos.map((v) => ({ video: v, state: videoState(v, now) })), [videos, now])
  const counts = useMemo(() => {
    const c = { all: withState.length, draft: 0, published: 0, scheduled: 0 }
    withState.forEach(({ state }) => {
      c[state] += 1
    })
    return c
  }, [withState])
  const shown = filter === 'all' ? withState : withState.filter((x) => x.state === filter)

  const openEditor = (value) => {
    setEditing(value)
    // На телефоне форма иначе откроется где-то в середине страницы
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  const handleSaved = () => {
    setEditing(null)
    load()
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ block: 'start' }))
  }

  const togglePublish = async (video, state) => {
    setBusyId(video.id)
    setError('')
    try {
      const changes =
        state === 'draft'
          ? { status: 'published', published_at: new Date().toISOString() }
          : { status: 'draft' }
      const saved = await updateVideo(video.id, changes)
      if (aliveRef.current) {
        setVideos((list) => list.map((v) => (v.id === saved.id ? saved : v)))
        setNow(Date.now())
      }
    } catch (err) {
      if (aliveRef.current) setError(err.message)
    } finally {
      if (aliveRef.current) setBusyId(null)
    }
  }

  const remove = async (video) => {
    if (!window.confirm(`Удалить видео «${video.title}»? Файлы тоже удалятся, вернуть не получится.`)) return
    setBusyId(video.id)
    setError('')
    try {
      await deleteVideoRow(video.id)
      if (aliveRef.current) setVideos((list) => list.filter((v) => v.id !== video.id))
      // Файлы — после строки: если база откажет, видео останется целым
      deleteMediaFiles([video.video_key, video.poster_key]).catch((err) =>
        console.warn('Файлы видео не удалены из хранилища:', err)
      )
    } catch (err) {
      if (aliveRef.current) setError(err.message)
    } finally {
      if (aliveRef.current) setBusyId(null)
    }
  }

  const handleCategoryDeleted = (id) => {
    // В базе category_id станет null (on delete set null) — отражаем это сразу
    setVideos((list) => list.map((v) => (String(v.category_id) === String(id) ? { ...v, category_id: null } : v)))
  }

  return (
    <div ref={topRef} className="scroll-mt-24 bg-paper px-4 py-6 text-ink sm:px-8">
      {editing ? (
        <VideoEditor
          key={editing === 'new' ? 'new' : editing.id}
          video={editing === 'new' ? null : editing}
          categories={categories}
          onSaved={handleSaved}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="label label-tile mb-2">Портфолио</p>
              <h2 className="display text-3xl">Видео</h2>
            </div>
            <button type="button" className="btn-primary w-full justify-center sm:w-auto" onClick={() => openEditor('new')}>
              + Добавить видео
            </button>
          </div>

          <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" role="tablist">
            {FILTERS.map(([value, text]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={filter === value}
                onClick={() => setFilter(value)}
                className={`shrink-0 border px-3 py-2 font-mono text-xs uppercase tracking-wider transition-colors ${
                  filter === value
                    ? 'border-ink bg-ink text-paper'
                    : 'border-ink/25 text-ink-soft hover:border-ink hover:text-ink'
                }`}
              >
                {text} <span className="numeric opacity-70">{counts[value]}</span>
              </button>
            ))}
          </div>

          {error && (
            <p role="alert" className="mb-4 text-sm text-terra">
              {error}
            </p>
          )}

          {loading ? (
            <ul className="rule-t" aria-busy="true">
              {[0, 1, 2].map((i) => (
                <li key={i} className="rule-b flex gap-3 py-4">
                  <div className="skeleton aspect-[9/16] w-12" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 w-3/4" />
                    <div className="skeleton h-3 w-1/2" />
                  </div>
                </li>
              ))}
            </ul>
          ) : shown.length === 0 ? (
            <p className="rule-t py-8 text-ink-soft">
              {videos.length === 0 ? 'Видео пока нет — добавьте первое.' : 'В этом разделе пусто.'}
            </p>
          ) : (
            <ul className="rule-t">
              {shown.map(({ video, state }) => (
                <VideoRow
                  key={video.id}
                  video={video}
                  state={state}
                  categoryName={video.category_id != null ? categoryNames.get(String(video.category_id)) : null}
                  busy={busyId === video.id}
                  onEdit={() => openEditor(video)}
                  onTogglePublish={() => togglePublish(video, state)}
                  onDelete={() => remove(video)}
                />
              ))}
            </ul>
          )}

          <div className="mt-8">
            <button
              type="button"
              className="btn-ghost -ml-3"
              aria-expanded={showCategories}
              onClick={() => setShowCategories((v) => !v)}
            >
              {showCategories ? '▾' : '▸'} Категории · {categories.length}
            </button>
            {showCategories && (
              <div className="mt-3 max-w-xl">
                <VideoCategoriesManager
                  categories={categories}
                  onChange={loadCategories}
                  onDeleted={handleCategoryDeleted}
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default AdminVideos
