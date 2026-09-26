/**
 * Всё, что страницы и админка делают с видео.
 *
 * Чтение идёт анонимным клиентом: правила RLS сами отдают посетителю
 * только опубликованное. Запись идёт тем же клиентом, но под сессией
 * админа — без неё база запись отклонит.
 */
import { supabase } from '../config/supabase'
import { VIDEO_CARD_COLUMNS } from '../utils/videoFormat'

const must = ({ data, error }) => {
  if (error) throw new Error(error.message)
  return data
}

// ─── Посетитель ─────────────────────────────────────────────────────────────

/** Опубликованные видео для сетки: закреплённые сверху, дальше новые */
export async function listPublishedVideos({ categoryId, limit = 200 } = {}) {
  let q = supabase
    .from('videos')
    .select(VIDEO_CARD_COLUMNS)
    .order('pinned', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(limit)
  if (categoryId) q = q.eq('category_id', categoryId)
  return must(await q) || []
}

/** Последние по дате — для главной */
export async function listLatestVideos(limit = 6) {
  return (
    must(
      await supabase
        .from('videos')
        .select(VIDEO_CARD_COLUMNS)
        .order('published_at', { ascending: false })
        .limit(limit)
    ) || []
  )
}

export async function getVideoBySlug(slug) {
  return must(await supabase.from('videos').select('*').eq('slug', slug).maybeSingle())
}

export async function listCategories() {
  return must(await supabase.from('video_categories').select('*').order('order_index').order('name')) || []
}

/** +1 просмотр. Возвращает новое число или null */
export async function incrementVideoViews(videoId) {
  const { data, error } = await supabase.rpc('increment_video_views', { video_id_param: videoId })
  if (error) return null
  return typeof data === 'number' ? data : null
}

export async function getVideoReactions(videoId, userId) {
  const data = must(await supabase.rpc('get_video_reactions', { p_video_id: videoId, p_user_id: userId }))
  return { counts: data?.counts || {}, mine: data?.mine || null }
}

export async function setVideoReaction(videoId, userId, reaction) {
  const data = must(
    await supabase.rpc('set_video_reaction', { p_video_id: videoId, p_user_id: userId, p_reaction: reaction })
  )
  return { counts: data?.counts || {}, mine: data?.mine || null }
}

// ─── Админ ──────────────────────────────────────────────────────────────────

export async function isCurrentUserAdmin() {
  const { data, error } = await supabase.rpc('is_admin')
  return !error && data === true
}

/** Все видео, включая черновики и отложенные (RLS пускает только админа) */
export async function listAllVideos() {
  return must(await supabase.from('videos').select('*').order('created_at', { ascending: false })) || []
}

export async function createVideo(row) {
  return must(await supabase.from('videos').insert([row]).select().single())
}

export async function updateVideo(id, changes) {
  return must(await supabase.from('videos').update(changes).eq('id', id).select().single())
}

export async function deleteVideoRow(id) {
  must(await supabase.from('videos').delete().eq('id', id))
}

/** Свободен ли адрес (id — исключить само редактируемое видео) */
export async function isSlugFree(slug, id) {
  let q = supabase.from('videos').select('id').eq('slug', slug)
  if (id) q = q.neq('id', id)
  return (must(await q) || []).length === 0
}

export async function saveCategory({ id, name, slug, order_index }) {
  const row = { name, slug, order_index }
  return id
    ? must(await supabase.from('video_categories').update(row).eq('id', id).select().single())
    : must(await supabase.from('video_categories').insert([row]).select().single())
}

export async function deleteCategory(id) {
  must(await supabase.from('video_categories').delete().eq('id', id))
}

// ─── Файлы в R2 ─────────────────────────────────────────────────────────────

async function uploadApi(body) {
  const { data } = await supabase.auth.getSession()
  const token = data?.session?.access_token
  if (!token) throw new Error('Сессия админа истекла — войдите заново')

  const res = await fetch('/api/video-upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || `Ошибка сервера ${res.status}`)
  return json
}

/** PUT файла прямо в R2 с настоящим прогрессом */
function putWithProgress(url, file, headers, onProgress, signal) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url)
    Object.entries(headers || {}).forEach(([k, v]) => xhr.setRequestHeader(k, v))
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(e.loaded / e.total)
    }
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Хранилище ответило ${xhr.status}`))
    xhr.onerror = () => reject(new Error('Сеть оборвалась или хранилище не пускает сайт (проверьте CORS бакета)'))
    xhr.onabort = () => reject(new Error('Загрузка отменена'))
    if (signal) {
      // Отмена могла случиться, пока ждали подпись ссылки — тогда не отправляем вовсе
      if (signal.aborted) return reject(new Error('Загрузка отменена'))
      signal.addEventListener('abort', () => xhr.abort(), { once: true })
    }
    xhr.send(file)
  })
}

/**
 * Загрузка файла: sign → PUT → complete.
 * kind: 'video' (mp4) или 'poster' (jpg/png/webp). Возвращает { key, publicUrl, size }.
 */
export async function uploadMediaFile(file, kind, { onProgress, signal } = {}) {
  const signed = await uploadApi({
    action: 'sign',
    kind,
    filename: file.name || `${kind}.${kind === 'video' ? 'mp4' : 'jpg'}`,
    contentType: file.type,
    size: file.size,
  })
  await putWithProgress(signed.uploadUrl, file, signed.headers, onProgress, signal)
  return uploadApi({ action: 'complete', kind, key: signed.key })
}

export async function deleteMediaFiles(keys) {
  const list = keys.filter(Boolean)
  if (!list.length) return
  await uploadApi({ action: 'delete', keys: list })
}

/**
 * То же, что isCurrentUserAdmin, но отличает «не админ» от сбоя сети:
 * иначе при плохом интернете админ увидел бы «этот аккаунт не админ».
 * Возвращает 'admin' | 'not-admin' | 'error'.
 */
export async function getAdminStatus() {
  try {
    const { data, error } = await supabase.rpc('is_admin')
    if (error) return 'error'
    return data === true ? 'admin' : 'not-admin'
  } catch {
    return 'error'
  }
}
