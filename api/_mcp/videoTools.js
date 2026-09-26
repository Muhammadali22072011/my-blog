// Инструменты MCP для раздела «Видео».
//
// Файл видео через MCP не передаётся: большие файлы идут прямо в R2.
//   1. request_video_upload — сервер выдаёт подписанную ссылку (2 часа);
//   2. клиент кладёт файл PUT-ом по ссылке (curl из Claude Code, скрипт);
//   3. complete_video_upload — сервер проверяет файл и привязывает к видео.
// Из чата claude.ai PUT сделать нельзя — для него import_video_from_url:
// сервер сам скачивает ролик по публичной ссылке (до 100 МБ).

import { signUpload, completeUpload, deleteKeys, importFromUrl } from '../_lib/videos.js'
import { slugify, SLUG_RE } from '../../src/utils/videoFormat.js'

const SITE_URL = () => (process.env.SITE_URL || 'https://izzatullaev.uz').replace(/\/$/, '')

const must = ({ data, error }) => {
  if (error) throw new Error(error.message || String(error))
  return data
}

const str = { type: 'string' }

const VIDEO_FIELDS = ['title', 'description', 'tags', 'aspect', 'pinned', 'instagram_url', 'youtube_url']

const videoProps = {
  title: { type: 'string', description: 'Название' },
  slug: { type: 'string', description: 'Адрес /videos/<slug>: латиница, цифры, дефисы. По умолчанию — из названия' },
  description: { type: 'string', description: 'Описание, абзацы через пустую строку' },
  category: { type: 'string', description: 'Категория: название, slug или id (см. list_video_categories)' },
  tags: { type: 'array', items: str },
  aspect: { type: 'string', enum: ['9:16', '16:9'] },
  pinned: { type: 'boolean', description: 'Закрепить вверху сетки' },
  instagram_url: { type: 'string', description: 'Ссылка на оригинал в Instagram' },
  youtube_url: { type: 'string', description: 'Ссылка на оригинал на YouTube' },
}

const stateOf = (v) =>
  v.status !== 'published' ? 'draft' : new Date(v.published_at) > new Date() ? 'scheduled' : 'live'

const summarize = (v) => ({
  id: v.id,
  slug: v.slug,
  title: v.title,
  state: stateOf(v),
  published_at: v.published_at,
  pinned: v.pinned,
  views: v.views,
  has_video: Boolean(v.video_url),
  has_poster: Boolean(v.poster_url),
  url: `${SITE_URL()}/videos/${v.slug}`,
})

async function resolveCategory(db, value) {
  if (value === undefined) return undefined
  if (value === null || value === '') return null
  const all = must(await db.from('video_categories').select('id, name, slug'))
  const needle = String(value).trim().toLowerCase()
  const hit = all.find((c) => String(c.id) === needle || c.slug === needle || c.name.toLowerCase() === needle)
  if (!hit) throw new Error(`Нет категории «${value}». Есть: ${all.map((c) => c.name).join(', ')}`)
  return hit.id
}

async function uniqueSlug(db, wanted, exceptId) {
  const base = wanted || 'video'
  if (!SLUG_RE.test(base)) throw new Error('slug: только латиница, цифры и дефисы')
  for (let i = 1; i < 50; i++) {
    const candidate = i === 1 ? base : `${base}-${i}`
    let q = db.from('videos').select('id').eq('slug', candidate)
    if (exceptId) q = q.neq('id', exceptId)
    if (!must(await q).length) return candidate
  }
  throw new Error('Не удалось подобрать свободный адрес')
}

const checkUrls = (row) => {
  for (const f of ['instagram_url', 'youtube_url']) {
    if (row[f] && !/^https:\/\//i.test(row[f])) throw new Error(`${f}: нужна ссылка https://`)
  }
}

async function getVideo(db, id) {
  const video = must(await db.from('videos').select('*').eq('id', id).maybeSingle())
  if (!video) throw new Error('Видео не найдено')
  return video
}

/** Привязать загруженный файл к видео; старый файл удалить */
async function attachFile(db, videoId, kind, file, meta = {}) {
  const video = await getVideo(db, videoId)
  const changes =
    kind === 'video'
      ? {
          video_url: file.publicUrl,
          video_key: file.key,
          size_bytes: file.size,
          ...(meta.duration_sec ? { duration_sec: meta.duration_sec } : {}),
          ...(meta.width ? { width: meta.width } : {}),
          ...(meta.height ? { height: meta.height } : {}),
          ...(meta.width && meta.height ? { aspect: meta.height > meta.width ? '9:16' : '16:9' } : {}),
        }
      : { poster_url: file.publicUrl, poster_key: file.key }

  const updated = must(await db.from('videos').update(changes).eq('id', videoId).select().single())
  const oldKey = kind === 'video' ? video.video_key : video.poster_key
  if (oldKey && oldKey !== file.key) await deleteKeys([oldKey]).catch(() => {})
  return summarize(updated)
}

export const videoTools = [
  {
    name: 'list_videos',
    description: 'Видео из раздела «Видео»: все, черновики, опубликованные или запланированные.',
    inputSchema: {
      type: 'object',
      properties: {
        state: { type: 'string', enum: ['all', 'draft', 'live', 'scheduled'], default: 'all' },
        category: { type: 'string' },
        limit: { type: 'integer', minimum: 1, maximum: 200, default: 50 },
      },
    },
    annotations: { readOnlyHint: true },
    async run(db, a) {
      let q = db.from('videos').select('*').order('created_at', { ascending: false }).limit(a.limit ?? 50)
      const categoryId = await resolveCategory(db, a.category)
      if (categoryId) q = q.eq('category_id', categoryId)
      const rows = must(await q).map(summarize)
      return a.state && a.state !== 'all' ? rows.filter((v) => v.state === a.state) : rows
    },
  },
  {
    name: 'get_video',
    description: 'Одно видео со всеми полями, по id или slug.',
    inputSchema: { type: 'object', properties: { id: { type: 'integer' }, slug: str } },
    annotations: { readOnlyHint: true },
    async run(db, a) {
      if (a.id == null && !a.slug) throw new Error('Нужен id или slug')
      let q = db.from('videos').select('*')
      q = a.id != null ? q.eq('id', a.id) : q.eq('slug', a.slug)
      const video = must(await q.maybeSingle())
      if (!video) throw new Error('Видео не найдено')
      return { ...video, state: stateOf(video), url: `${SITE_URL()}/videos/${video.slug}` }
    },
  },
  {
    name: 'create_video',
    description: 'Создать видео-черновик (без файла). Дальше: request_video_upload или import_video_from_url, потом set_video_status.',
    inputSchema: { type: 'object', properties: videoProps, required: ['title'] },
    annotations: { readOnlyHint: false, destructiveHint: false },
    async run(db, a) {
      const row = Object.fromEntries(VIDEO_FIELDS.filter((f) => a[f] !== undefined).map((f) => [f, a[f]]))
      checkUrls(row)
      row.slug = await uniqueSlug(db, a.slug || slugify(a.title))
      row.status = 'draft'
      const categoryId = await resolveCategory(db, a.category)
      if (categoryId !== undefined) row.category_id = categoryId
      const video = must(await db.from('videos').insert([row]).select().single())
      return { created: true, ...summarize(video) }
    },
  },
  {
    name: 'update_video',
    description: 'Изменить поля видео: передайте id и только то, что меняется.',
    inputSchema: { type: 'object', properties: { id: { type: 'integer' }, ...videoProps }, required: ['id'] },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
    async run(db, a) {
      const changes = Object.fromEntries(VIDEO_FIELDS.filter((f) => a[f] !== undefined).map((f) => [f, a[f]]))
      checkUrls(changes)
      if (a.slug !== undefined) changes.slug = await uniqueSlug(db, a.slug, a.id)
      const categoryId = await resolveCategory(db, a.category)
      if (categoryId !== undefined) changes.category_id = categoryId
      if (!Object.keys(changes).length) throw new Error('Нечего менять')
      const video = must(await db.from('videos').update(changes).eq('id', a.id).select().maybeSingle())
      if (!video) throw new Error('Видео не найдено')
      return summarize(video)
    },
  },
  {
    name: 'set_video_status',
    description: 'Опубликовать видео (сейчас или в указанное время) или вернуть в черновики. Публиковать можно только с загруженным файлом.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        status: { type: 'string', enum: ['published', 'draft'] },
        publish_at: { type: 'string', description: 'Для отложенной публикации: ISO 8601 с часовым поясом, например 2026-10-01T20:00:00+05:00' },
      },
      required: ['id', 'status'],
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
    async run(db, a) {
      const video = await getVideo(db, a.id)
      let changes
      if (a.status === 'draft') {
        changes = { status: 'draft', published_at: null }
      } else {
        if (!video.video_url) throw new Error('Сначала загрузите файл: request_video_upload или import_video_from_url')
        let when = new Date()
        if (a.publish_at) {
          when = new Date(a.publish_at)
          if (Number.isNaN(when.getTime())) throw new Error('publish_at: неверная дата')
        }
        changes = { status: 'published', published_at: when.toISOString() }
      }
      const updated = must(await db.from('videos').update(changes).eq('id', a.id).select().single())
      return summarize(updated)
    },
  },
  {
    name: 'delete_video',
    description: 'Удалить видео навсегда вместе с файлами в хранилище и реакциями. Отменить нельзя — если сомневаетесь, лучше set_video_status: draft.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'integer' }, confirm: { type: 'boolean', description: 'Должно быть true' } },
      required: ['id', 'confirm'],
    },
    annotations: { readOnlyHint: false, destructiveHint: true },
    async run(db, a) {
      if (a.confirm !== true) throw new Error('Удаление не подтверждено: передайте confirm: true')
      const video = await getVideo(db, a.id)
      must(await db.from('videos').delete().eq('id', a.id))
      let filesNote = 'файлы удалены'
      try {
        await deleteKeys([video.video_key, video.poster_key])
      } catch (err) {
        filesNote = `запись удалена, но файлы остались: ${err.message}`
      }
      return { deleted: { id: video.id, title: video.title }, files: filesNote }
    },
  },
  {
    name: 'request_video_upload',
    description: 'Шаг 1 загрузки: подписанная ссылка для PUT файла прямо в хранилище (живёт 2 часа). Видео — только video/mp4 до 200 МБ, обложка — jpg/png/webp до 5 МБ. Заголовок Content-Type при PUT должен совпадать с content_type.',
    inputSchema: {
      type: 'object',
      properties: {
        kind: { type: 'string', enum: ['video', 'poster'] },
        filename: str,
        content_type: { type: 'string', description: 'video/mp4, image/jpeg, image/png или image/webp' },
        size: { type: 'integer', description: 'Размер в байтах, если известен' },
      },
      required: ['kind', 'content_type'],
    },
    annotations: { readOnlyHint: false, destructiveHint: false },
    async run(_db, a) {
      const signed = signUpload({ kind: a.kind, filename: a.filename, contentType: a.content_type, size: a.size })
      return {
        key: signed.key,
        upload_url: signed.uploadUrl,
        method: 'PUT',
        headers: signed.headers,
        expires_in_seconds: signed.expiresIn,
        curl: `curl -X PUT -H "Content-Type: ${a.content_type}" --upload-file "${a.filename || 'file'}" "${signed.uploadUrl}"`,
        next: 'После загрузки вызовите complete_video_upload с этим key и id видео',
      }
    },
  },
  {
    name: 'complete_video_upload',
    description: 'Шаг 3 загрузки: проверить загруженный файл и привязать его к видео (как файл ролика или как обложку). Неподходящий файл удаляется.',
    inputSchema: {
      type: 'object',
      properties: {
        video_id: { type: 'integer' },
        kind: { type: 'string', enum: ['video', 'poster'] },
        key: { type: 'string', description: 'key из request_video_upload' },
        duration_sec: { type: 'number' },
        width: { type: 'integer' },
        height: { type: 'integer' },
      },
      required: ['video_id', 'kind', 'key'],
    },
    annotations: { readOnlyHint: false, destructiveHint: false },
    async run(db, a) {
      await getVideo(db, a.video_id)
      const file = await completeUpload({ kind: a.kind, key: a.key })
      return attachFile(db, a.video_id, a.kind, file, a)
    },
  },
  {
    name: 'import_video_from_url',
    description: 'Скачать ролик или обложку по публичной https-ссылке (прямая ссылка на mp4/jpg, до 100 МБ) и привязать к видео. Для загрузки из чата, где PUT недоступен.',
    inputSchema: {
      type: 'object',
      properties: {
        video_id: { type: 'integer' },
        kind: { type: 'string', enum: ['video', 'poster'] },
        url: str,
        duration_sec: { type: 'number' },
        width: { type: 'integer' },
        height: { type: 'integer' },
      },
      required: ['video_id', 'kind', 'url'],
    },
    annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
    async run(db, a) {
      await getVideo(db, a.video_id)
      const file = await importFromUrl({ kind: a.kind, url: a.url })
      return attachFile(db, a.video_id, a.kind, file, a)
    },
  },
  {
    name: 'list_video_categories',
    description: 'Категории видео.',
    inputSchema: { type: 'object', properties: {} },
    annotations: { readOnlyHint: true },
    async run(db) {
      return must(await db.from('video_categories').select('*').order('order_index'))
    },
  },
  {
    name: 'save_video_category',
    description: 'Создать категорию (без id) или переименовать/переставить (с id).',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'integer' }, name: str, order_index: { type: 'integer' } },
    },
    annotations: { readOnlyHint: false, destructiveHint: false },
    async run(db, a) {
      const row = {}
      if (a.name !== undefined) {
        row.name = a.name.trim()
        row.slug = slugify(a.name) || `cat-${Date.now()}`
      }
      if (a.order_index !== undefined) row.order_index = a.order_index
      if (a.id != null) {
        const updated = must(await db.from('video_categories').update(row).eq('id', a.id).select().maybeSingle())
        if (!updated) throw new Error('Категория не найдена')
        return updated
      }
      if (!row.name) throw new Error('Для новой категории нужен name')
      return must(await db.from('video_categories').insert([row]).select().single())
    },
  },
]
