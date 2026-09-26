// Инструменты MCP-сервера блога.
//
// Каждый инструмент — { name, description, inputSchema, annotations, run }.
// run получает клиент Supabase с service-role ключом (обходит RLS) и
// аргументы, уже прошедшие через JSON. Возвращает любой JSON-объект —
// обработчик в api/mcp.js сам упакует его в ответ MCP.
//
// Файл лежит в папке с подчёркиванием, поэтому Vercel не делает из него
// отдельную функцию.

import { videoTools } from './videoTools.js'

const SITE_URL = () => (process.env.SITE_URL || 'https://izzatullaev.uz').replace(/\/$/, '')

const POST_FIELDS = [
  'title', 'content', 'excerpt', 'slug', 'category', 'status', 'tags',
  'featured_image', 'og_image', 'seo_title', 'seo_description',
  'seo_keywords', 'canonical_url', 'scheduled_at',
]
const PROFILE_FIELDS = [
  'name', 'position', 'about_me', 'avatar_letter', 'avatar_url',
  'youtube', 'github', 'linkedin', 'telegram', 'telegram_channel',
]
const ABOUT_FIELDS = [
  'title', 'content', 'image_url', 'birth_date', 'location',
  'telegram_channel', 'skills', 'experience', 'education', 'interests',
]
const SETTINGS_FIELDS = [
  'site_name', 'site_description', 'allow_comments', 'moderate_comments',
  'meta_keywords', 'google_analytics', 'instagram_username', 'telegram_username',
]
const PROJECT_FIELDS = [
  'title', 'description', 'image_url', 'github_url', 'demo_url', 'tags',
  'featured', 'order_index', 'status',
]

const pick = (source, fields) =>
  Object.fromEntries(fields.filter((f) => source[f] !== undefined).map((f) => [f, source[f]]))

const must = ({ data, error }) => {
  if (error) throw new Error(error.message || String(error))
  return data
}

const postUrl = (id) => `${SITE_URL()}/post/${id}`

/** Первый абзац текста без разметки — так же, как делает админка */
const deriveExcerpt = (markdown = '') => {
  const paragraph = markdown
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .find((block) => block && !block.startsWith('#') && !block.startsWith('```') && !block.startsWith('!['))
  if (!paragraph) return ''
  const plain = paragraph
    .replace(/!\[[^\]]*]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/[*_`>#~]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return plain.length > 220 ? `${plain.slice(0, 217).trimEnd()}…` : plain
}

const summarizePost = (p) => ({
  id: p.id,
  title: p.title,
  status: p.status,
  category: p.category,
  tags: p.tags,
  views: p.views,
  created_at: p.created_at,
  updated_at: p.updated_at,
  scheduled_at: p.scheduled_at,
  url: postUrl(p.id),
})

// ─── Посты ────────────────────────────────────────────────────────────────

const postProps = {
  title: { type: 'string', description: 'Заголовок' },
  content: { type: 'string', description: 'Текст поста в Markdown' },
  excerpt: { type: 'string', description: 'Краткое описание. Если не задано при создании — берётся первый абзац' },
  slug: { type: 'string', description: 'Человекочитаемый адрес (необязательно, сайт открывает посты по id)' },
  category: { type: 'string', enum: ['blog', 'news', 'tutorial'] },
  status: { type: 'string', enum: ['draft', 'published'] },
  tags: { type: 'array', items: { type: 'string' } },
  featured_image: { type: 'string', description: 'URL обложки' },
  og_image: { type: 'string', description: 'URL картинки для превью в соцсетях и Telegram' },
  seo_title: { type: 'string' },
  seo_description: { type: 'string' },
  seo_keywords: { type: 'array', items: { type: 'string' } },
  canonical_url: { type: 'string' },
  scheduled_at: { type: 'string', description: 'Дата-время отложенной публикации, ISO 8601' },
}

const postTools = [
  {
    name: 'site_overview',
    description: 'Сводка по сайту: сколько постов, черновиков, комментариев на модерации, подписчиков, последние посты и самые читаемые.',
    inputSchema: { type: 'object', properties: {} },
    annotations: { readOnlyHint: true },
    async run(db) {
      const count = async (table, filter) => {
        let q = db.from(table).select('*', { count: 'exact', head: true })
        if (filter) q = filter(q)
        const { count: n, error } = await q
        return error ? null : n
      }
      const [published, drafts, comments, subscribers, recent, top] = await Promise.all([
        count('posts', (q) => q.eq('status', 'published')),
        count('posts', (q) => q.eq('status', 'draft')),
        count('comments'),
        count('newsletter_subscribers'),
        db.from('posts').select('*').order('created_at', { ascending: false }).limit(5),
        db.from('posts').select('*').eq('status', 'published').order('views', { ascending: false }).limit(5),
      ])
      return {
        site: SITE_URL(),
        posts: { published, drafts },
        comments_total: comments,
        newsletter_subscribers: subscribers,
        recent_posts: (must(recent) || []).map(summarizePost),
        most_viewed: (must(top) || []).map(summarizePost),
      }
    },
  },
  {
    name: 'list_posts',
    description: 'Список постов с фильтрами. Возвращает краткие карточки без полного текста.',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['draft', 'published', 'all'], default: 'all' },
        category: { type: 'string', enum: ['blog', 'news', 'tutorial'] },
        search: { type: 'string', description: 'Поиск по заголовку и тексту' },
        tag: { type: 'string' },
        order_by: { type: 'string', enum: ['created_at', 'updated_at', 'views'], default: 'created_at' },
        limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
        offset: { type: 'integer', minimum: 0, default: 0 },
      },
    },
    annotations: { readOnlyHint: true },
    async run(db, a) {
      const limit = Math.min(a.limit ?? 20, 100)
      const offset = a.offset ?? 0
      let q = db.from('posts').select('*', { count: 'exact' })
      if (a.status && a.status !== 'all') q = q.eq('status', a.status)
      if (a.category) q = q.eq('category', a.category)
      if (a.tag) q = q.contains('tags', [a.tag])
      if (a.search) {
        const s = a.search.replace(/[,()%]/g, ' ')
        q = q.or(`title.ilike.%${s}%,content.ilike.%${s}%`)
      }
      q = q.order(a.order_by || 'created_at', { ascending: false }).range(offset, offset + limit - 1)
      const { data, error, count } = await q
      if (error) throw new Error(error.message)
      return { total: count, offset, posts: data.map(summarizePost) }
    },
  },
  {
    name: 'get_post',
    description: 'Полный пост со всеми полями и текстом, по id или slug.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'integer' }, slug: { type: 'string' } },
    },
    annotations: { readOnlyHint: true },
    async run(db, a) {
      if (a.id == null && !a.slug) throw new Error('Нужен id или slug')
      let q = db.from('posts').select('*')
      q = a.id != null ? q.eq('id', a.id) : q.eq('slug', a.slug)
      const post = must(await q.maybeSingle())
      if (!post) throw new Error('Пост не найден')
      return { ...post, url: postUrl(post.id) }
    },
  },
  {
    name: 'create_post',
    description: 'Создать пост. По умолчанию — черновик; чтобы сразу опубликовать, передайте status: "published". Текст — Markdown, поддерживается всё, что умеет рендерер сайта (картинки, видео, цветные заголовки).',
    inputSchema: { type: 'object', properties: postProps, required: ['title', 'content'] },
    annotations: { readOnlyHint: false, destructiveHint: false },
    async run(db, a) {
      const row = pick(a, POST_FIELDS)
      row.status = row.status || 'draft'
      row.category = row.category || 'blog'
      if (!row.excerpt) row.excerpt = deriveExcerpt(row.content)
      const post = must(await db.from('posts').insert([row]).select().single())
      return { created: true, ...summarizePost(post) }
    },
  },
  {
    name: 'update_post',
    description: 'Изменить пост: передайте id и только те поля, которые меняются.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'integer' }, ...postProps },
      required: ['id'],
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
    async run(db, a) {
      const changes = pick(a, POST_FIELDS)
      if (!Object.keys(changes).length) throw new Error('Нечего менять: не передано ни одного поля')
      changes.updated_at = new Date().toISOString()
      const post = must(await db.from('posts').update(changes).eq('id', a.id).select().maybeSingle())
      if (!post) throw new Error('Пост не найден')
      return { updated: Object.keys(changes).filter((k) => k !== 'updated_at'), ...summarizePost(post) }
    },
  },
  {
    name: 'set_post_status',
    description: 'Опубликовать пост или снять его с публикации (вернуть в черновики).',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'integer' }, status: { type: 'string', enum: ['draft', 'published'] } },
      required: ['id', 'status'],
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
    async run(db, a) {
      const post = must(
        await db.from('posts')
          .update({ status: a.status, updated_at: new Date().toISOString() })
          .eq('id', a.id).select().maybeSingle(),
      )
      if (!post) throw new Error('Пост не найден')
      return summarizePost(post)
    },
  },
  {
    name: 'delete_post',
    description: 'Удалить пост навсегда вместе с его комментариями и реакциями. Отменить нельзя — если сомневаетесь, лучше set_post_status: draft.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        confirm: { type: 'boolean', description: 'Должно быть true — защита от случайного вызова' },
      },
      required: ['id', 'confirm'],
    },
    annotations: { readOnlyHint: false, destructiveHint: true },
    async run(db, a) {
      if (a.confirm !== true) throw new Error('Удаление не подтверждено: передайте confirm: true')
      const gone = must(await db.from('posts').delete().eq('id', a.id).select('id, title'))
      if (!gone.length) throw new Error('Пост не найден')
      return { deleted: gone[0] }
    },
  },
]

// ─── Комментарии ──────────────────────────────────────────────────────────

// В базе встречаются две схемы комментариев: со столбцом status
// (pending/approved/rejected) и со столбцом approved (boolean).
// Инструменты работают с обеими — смотрят, какой столбец есть у строки.
const commentState = (c) =>
  c.status ?? (c.approved === false ? 'pending' : 'approved')

const commentTools = [
  {
    name: 'list_comments',
    description: 'Комментарии — все или к одному посту, новые сверху.',
    inputSchema: {
      type: 'object',
      properties: {
        post_id: { type: 'integer' },
        state: { type: 'string', enum: ['pending', 'approved', 'rejected', 'all'], default: 'all' },
        limit: { type: 'integer', minimum: 1, maximum: 200, default: 50 },
      },
    },
    annotations: { readOnlyHint: true },
    async run(db, a) {
      let q = db.from('comments').select('*').order('created_at', { ascending: false }).limit(a.limit ?? 50)
      if (a.post_id != null) q = q.eq('post_id', a.post_id)
      const rows = must(await q)
      const filtered = a.state && a.state !== 'all' ? rows.filter((c) => commentState(c) === a.state) : rows
      return filtered.map((c) => ({ ...c, state: commentState(c) }))
    },
  },
  {
    name: 'moderate_comment',
    description: 'Одобрить, отклонить или вернуть на модерацию комментарий.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'integer' }, state: { type: 'string', enum: ['approved', 'rejected', 'pending'] } },
      required: ['id', 'state'],
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
    async run(db, a) {
      const current = must(await db.from('comments').select('*').eq('id', a.id).maybeSingle())
      if (!current) throw new Error('Комментарий не найден')
      const changes = 'status' in current ? { status: a.state } : { approved: a.state === 'approved' }
      if ('updated_at' in current) changes.updated_at = new Date().toISOString()
      const row = must(await db.from('comments').update(changes).eq('id', a.id).select().single())
      return { ...row, state: commentState(row) }
    },
  },
  {
    name: 'reply_to_comment',
    description: 'Ответить на комментарий от имени автора блога.',
    inputSchema: {
      type: 'object',
      properties: {
        comment_id: { type: 'integer' },
        content: { type: 'string' },
        author_name: { type: 'string', description: 'Имя в ответе. По умолчанию — имя из профиля' },
      },
      required: ['comment_id', 'content'],
    },
    annotations: { readOnlyHint: false, destructiveHint: false },
    async run(db, a) {
      const parent = must(await db.from('comments').select('*').eq('id', a.comment_id).maybeSingle())
      if (!parent) throw new Error('Комментарий не найден')
      let name = a.author_name
      if (!name) {
        const { data: profile } = await db.from('profile').select('name').limit(1).maybeSingle()
        name = profile?.name || 'Автор'
      }
      const row = { post_id: parent.post_id, parent_id: parent.id, author_name: name, content: a.content }
      if ('status' in parent) row.status = 'approved'
      if ('approved' in parent) row.approved = true
      return must(await db.from('comments').insert([row]).select().single())
    },
  },
  {
    name: 'delete_comment',
    description: 'Удалить комментарий (и ответы на него) навсегда.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'integer' }, confirm: { type: 'boolean' } },
      required: ['id', 'confirm'],
    },
    annotations: { readOnlyHint: false, destructiveHint: true },
    async run(db, a) {
      if (a.confirm !== true) throw new Error('Удаление не подтверждено: передайте confirm: true')
      const gone = must(await db.from('comments').delete().eq('id', a.id).select('id'))
      if (!gone.length) throw new Error('Комментарий не найден')
      return { deleted: a.id }
    },
  },
]

// ─── Профиль, «Обо мне», настройки — таблицы из одной строки ─────────────

const singleRowTools = (table, fields, label, props) => [
  {
    name: `get_${label}`,
    description: `Прочитать ${table}.`,
    inputSchema: { type: 'object', properties: {} },
    annotations: { readOnlyHint: true },
    async run(db) {
      return must(await db.from(table).select('*').order('id').limit(1).maybeSingle()) || {}
    },
  },
  {
    name: `update_${label}`,
    description: `Изменить ${table}: передайте только меняющиеся поля.`,
    inputSchema: { type: 'object', properties: props },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
    async run(db, a) {
      const changes = pick(a, fields)
      if (!Object.keys(changes).length) throw new Error('Нечего менять: не передано ни одного поля')
      changes.updated_at = new Date().toISOString()
      const existing = must(await db.from(table).select('id').order('id').limit(1).maybeSingle())
      const result = existing
        ? await db.from(table).update(changes).eq('id', existing.id).select().single()
        : await db.from(table).insert([changes]).select().single()
      return must(result)
    },
  },
]

const str = { type: 'string' }
const profileTools = [
  ...singleRowTools('profile', PROFILE_FIELDS, 'profile', {
    name: str, position: str, about_me: str, avatar_letter: str, avatar_url: str,
    youtube: str, github: str, linkedin: str, telegram: str,
    telegram_channel: { type: 'string', description: 'Полный URL канала, например https://t.me/channel' },
  }),
  ...singleRowTools('about_me', ABOUT_FIELDS, 'about_page', {
    title: str, content: { type: 'string', description: 'Markdown' }, image_url: str,
    birth_date: { type: 'string', description: 'YYYY-MM-DD' }, location: str, telegram_channel: str,
    skills: { type: 'array', items: str }, experience: str, education: str, interests: str,
  }),
  ...singleRowTools('site_settings', SETTINGS_FIELDS, 'site_settings', {
    site_name: str, site_description: str, allow_comments: { type: 'boolean' },
    moderate_comments: { type: 'boolean' }, meta_keywords: str, google_analytics: str,
    instagram_username: { type: 'string', description: 'Ник Instagram для кнопки «Direct\'ga yozish» под видео, без @' },
    telegram_username: { type: 'string', description: 'Ник Telegram для кнопки заказа под видео, без @' },
  }),
]

// ─── Проекты ──────────────────────────────────────────────────────────────

const projectProps = {
  title: str, description: str, image_url: str, github_url: str, demo_url: str,
  tags: { type: 'array', items: str }, featured: { type: 'boolean' },
  order_index: { type: 'integer', description: 'Порядок в списке, меньше — выше' },
  status: { type: 'string', enum: ['active', 'archived', 'draft'] },
}

const projectTools = [
  {
    name: 'list_projects',
    description: 'Проекты со страницы «Проекты».',
    inputSchema: { type: 'object', properties: {} },
    annotations: { readOnlyHint: true },
    async run(db) {
      return must(await db.from('projects').select('*').order('order_index').order('created_at', { ascending: false }))
    },
  },
  {
    name: 'save_project',
    description: 'Создать проект (без id) или изменить существующий (с id).',
    inputSchema: { type: 'object', properties: { id: { type: 'integer' }, ...projectProps } },
    annotations: { readOnlyHint: false, destructiveHint: false },
    async run(db, a) {
      const row = pick(a, PROJECT_FIELDS)
      if (a.id != null) {
        row.updated_at = new Date().toISOString()
        const updated = must(await db.from('projects').update(row).eq('id', a.id).select().maybeSingle())
        if (!updated) throw new Error('Проект не найден')
        return updated
      }
      if (!row.title) throw new Error('Для нового проекта нужен title')
      return must(await db.from('projects').insert([row]).select().single())
    },
  },
  {
    name: 'delete_project',
    description: 'Удалить проект навсегда.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'integer' }, confirm: { type: 'boolean' } },
      required: ['id', 'confirm'],
    },
    annotations: { readOnlyHint: false, destructiveHint: true },
    async run(db, a) {
      if (a.confirm !== true) throw new Error('Удаление не подтверждено: передайте confirm: true')
      const gone = must(await db.from('projects').delete().eq('id', a.id).select('id, title'))
      if (!gone.length) throw new Error('Проект не найден')
      return { deleted: gone[0] }
    },
  },
]

// ─── Медиа ────────────────────────────────────────────────────────────────

const MEDIA = {
  image: { bucket: 'images', folder: 'blog-images', maxMb: 10 },
  video: { bucket: 'videos', folder: 'blog-videos', maxMb: 50 },
}

const EXT_BY_TYPE = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif',
  'image/svg+xml': 'svg', 'image/avif': 'avif', 'video/mp4': 'mp4', 'video/webm': 'webm',
  'video/quicktime': 'mov',
}

const mediaTools = [
  {
    name: 'upload_media',
    description: 'Загрузить картинку или видео в хранилище сайта по ссылке (source_url) или из base64 (для небольших файлов). Возвращает публичный URL и готовый Markdown для вставки в пост.',
    inputSchema: {
      type: 'object',
      properties: {
        source_url: { type: 'string', description: 'Откуда скачать файл' },
        base64: { type: 'string', description: 'Содержимое файла в base64 (до ~3 МБ)' },
        content_type: { type: 'string', description: 'MIME-тип, например image/png. Для source_url берётся из ответа сервера' },
        filename: { type: 'string', description: 'Желаемое имя файла (необязательно)' },
        alt: { type: 'string', description: 'Подпись для Markdown' },
      },
    },
    annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
    async run(db, a) {
      let bytes
      let type = a.content_type
      if (a.source_url) {
        const res = await fetch(a.source_url)
        if (!res.ok) throw new Error(`Не удалось скачать файл: HTTP ${res.status}`)
        type = type || res.headers.get('content-type')?.split(';')[0]
        bytes = new Uint8Array(await res.arrayBuffer())
      } else if (a.base64) {
        bytes = Uint8Array.from(Buffer.from(a.base64.replace(/^data:[^,]+,/, ''), 'base64'))
      } else {
        throw new Error('Нужен source_url или base64')
      }
      const kind = type?.startsWith('video/') ? 'video' : type?.startsWith('image/') ? 'image' : null
      if (!kind) throw new Error(`Неподдерживаемый тип файла: ${type || 'неизвестен'}. Укажите content_type`)
      const { bucket, folder, maxMb } = MEDIA[kind]
      if (bytes.byteLength > maxMb * 1024 * 1024) throw new Error(`Файл больше ${maxMb} МБ`)

      const base = (a.filename || '').replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '')
      const ext = EXT_BY_TYPE[type] || type.split('/')[1]
      const path = `${folder}/${Date.now()}-${base || Math.random().toString(36).slice(2, 8)}.${ext}`
      must(await db.storage.from(bucket).upload(path, bytes, { contentType: type, cacheControl: '3600', upsert: false }))
      const { data: { publicUrl } } = db.storage.from(bucket).getPublicUrl(path)
      const alt = a.alt || ''
      return {
        url: publicUrl,
        bucket,
        path,
        size: bytes.byteLength,
        markdown: kind === 'image' ? `![${alt}](${publicUrl})` : `[🎥 Video: ${alt || 'Видео'}](${publicUrl})`,
      }
    },
  },
  {
    name: 'list_media',
    description: 'Файлы в хранилище сайта с публичными ссылками.',
    inputSchema: {
      type: 'object',
      properties: {
        kind: { type: 'string', enum: ['image', 'video'], default: 'image' },
        limit: { type: 'integer', minimum: 1, maximum: 500, default: 100 },
      },
    },
    annotations: { readOnlyHint: true },
    async run(db, a) {
      const { bucket, folder } = MEDIA[a.kind || 'image']
      const files = must(await db.storage.from(bucket).list(folder, {
        limit: a.limit ?? 100, sortBy: { column: 'created_at', order: 'desc' },
      }))
      return files.filter((f) => f.id).map((f) => ({
        path: `${folder}/${f.name}`,
        url: db.storage.from(bucket).getPublicUrl(`${folder}/${f.name}`).data.publicUrl,
        size: f.metadata?.size,
        type: f.metadata?.mimetype,
        created_at: f.created_at,
      }))
    },
  },
  {
    name: 'delete_media',
    description: 'Удалить файл из хранилища. Посты, которые на него ссылаются, останутся с битой картинкой.',
    inputSchema: {
      type: 'object',
      properties: {
        kind: { type: 'string', enum: ['image', 'video'] },
        path: { type: 'string', description: 'Путь из list_media, например blog-images/123.png' },
        confirm: { type: 'boolean' },
      },
      required: ['kind', 'path', 'confirm'],
    },
    annotations: { readOnlyHint: false, destructiveHint: true },
    async run(db, a) {
      if (a.confirm !== true) throw new Error('Удаление не подтверждено: передайте confirm: true')
      const removed = must(await db.storage.from(MEDIA[a.kind].bucket).remove([a.path]))
      if (!removed.length) throw new Error('Файл не найден')
      return { deleted: a.path }
    },
  },
]

// ─── Аудитория и статистика ───────────────────────────────────────────────

const audienceTools = [
  {
    name: 'list_subscribers',
    description: 'Подписчики рассылки.',
    inputSchema: {
      type: 'object',
      properties: { limit: { type: 'integer', minimum: 1, maximum: 1000, default: 200 } },
    },
    annotations: { readOnlyHint: true },
    async run(db, a) {
      const { data, error, count } = await db.from('newsletter_subscribers')
        .select('*', { count: 'exact' })
        .order('subscribed_at', { ascending: false })
        .limit(a.limit ?? 200)
      if (error) throw new Error(error.message)
      return { total: count, subscribers: data }
    },
  },
  {
    name: 'post_stats',
    description: 'Статистика поста: просмотры, реакции по типам, средняя оценка, число комментариев.',
    inputSchema: { type: 'object', properties: { id: { type: 'integer' } }, required: ['id'] },
    annotations: { readOnlyHint: true },
    async run(db, a) {
      const post = must(await db.from('posts').select('id, title, views, status').eq('id', a.id).maybeSingle())
      if (!post) throw new Error('Пост не найден')
      const [reactions, ratings, comments] = await Promise.all([
        db.from('reactions').select('reaction_type').eq('post_id', a.id),
        db.from('post_ratings').select('rating').eq('post_id', a.id),
        db.from('comments').select('*', { count: 'exact', head: true }).eq('post_id', a.id),
      ])
      const byType = {}
      for (const r of reactions.data || []) byType[r.reaction_type] = (byType[r.reaction_type] || 0) + 1
      const scores = (ratings.data || []).map((r) => r.rating)
      return {
        ...post,
        url: postUrl(post.id),
        reactions: byType,
        rating: scores.length
          ? { average: +(scores.reduce((s, x) => s + x, 0) / scores.length).toFixed(2), votes: scores.length }
          : null,
        comments: comments.count ?? null,
      }
    },
  },
]

export const TOOLS = [
  ...postTools,
  ...commentTools,
  ...profileTools,
  ...projectTools,
  ...mediaTools,
  ...audienceTools,
  ...videoTools,
]
