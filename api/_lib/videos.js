// Загрузка файлов видео в R2: одна логика для админки (api/video-upload.js)
// и для MCP (api/_mcp/tools.js).
//
// Схема всегда одна: sign → клиент сам кладёт файл PUT-ом по ссылке →
// complete. На шаге complete сервер смотрит, что реально легло в бакет
// (размер, тип), и удаляет объект, если он не подходит: подписанная
// ссылка сама размер не ограничивает.

import { presign, publicUrl, headObject, deleteObject, putObject } from './r2.js'
import { slugify } from '../../src/utils/videoFormat.js'

export const KINDS = {
  video: {
    prefix: 'videos/',
    types: { 'video/mp4': 'mp4' },
    maxBytes: 200 * 1024 * 1024,
  },
  poster: {
    prefix: 'posters/',
    types: { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' },
    maxBytes: 5 * 1024 * 1024,
  },
}

const UPLOAD_TTL = 2 * 60 * 60

const mb = (bytes) => `${Math.round(bytes / 1024 / 1024)} МБ`

function kindOf(kind) {
  const spec = KINDS[kind]
  if (!spec) throw new Error('kind должен быть video или poster')
  return spec
}

function checkKey(key, spec) {
  if (typeof key !== 'string' || !key.startsWith(spec.prefix) || key.includes('..') || key.length > 300) {
    throw new Error('Неверный ключ файла')
  }
}

function makeKey(spec, filename, ext) {
  const now = new Date()
  const ym = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}`
  const base = slugify(String(filename || '').replace(/\.[^.]+$/, '')).slice(0, 50) || 'file'
  const rand = Math.random().toString(36).slice(2, 8)
  return `${spec.prefix}${ym}/${Date.now()}-${rand}-${base}.${ext}`
}

/** Шаг 1: подписанная ссылка на загрузку */
export function signUpload({ kind, filename, contentType, size }) {
  const spec = kindOf(kind)
  const ext = spec.types[contentType]
  if (!ext) {
    throw new Error(`Тип ${contentType || '(не указан)'} не подходит. Можно: ${Object.keys(spec.types).join(', ')}`)
  }
  if (size != null && Number(size) > spec.maxBytes) {
    throw new Error(`Файл больше ${mb(spec.maxBytes)}`)
  }
  const key = makeKey(spec, filename, ext)
  return {
    key,
    uploadUrl: presign('PUT', key, { expiresIn: UPLOAD_TTL, headers: { 'content-type': contentType } }),
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    publicUrl: publicUrl(key),
    expiresIn: UPLOAD_TTL,
    maxBytes: spec.maxBytes,
  }
}

/** Шаг 3: проверка загруженного файла */
export async function completeUpload({ kind, key }) {
  const spec = kindOf(kind)
  checkKey(key, spec)
  const meta = await headObject(key)
  if (!meta) throw new Error('Файл не найден в хранилище — загрузка не завершилась')

  const problem =
    !spec.types[meta.contentType] ? `неподходящий тип ${meta.contentType}` :
    meta.size > spec.maxBytes ? `размер больше ${mb(spec.maxBytes)}` :
    meta.size === 0 ? 'пустой файл' : null

  if (problem) {
    await deleteObject(key).catch(() => {})
    throw new Error(`Файл отклонён и удалён: ${problem}`)
  }
  return { key, publicUrl: publicUrl(key), size: meta.size, contentType: meta.contentType }
}

/** Удаление файлов видео и обложки */
export async function deleteKeys(keys) {
  const list = (keys || []).filter(Boolean)
  for (const key of list) {
    if (!Object.values(KINDS).some((s) => key.startsWith(s.prefix)) || key.includes('..')) {
      throw new Error(`Неверный ключ файла: ${key}`)
    }
  }
  await Promise.all(list.map(deleteObject))
  return { deleted: list }
}

// Импорт по ссылке нужен для MCP: из чата claude.ai файл с телефона
// PUT-ом не отправить, а ссылку на готовый ролик (Higgsfield, Google Drive,
// прямой mp4) — можно. Файл проходит через функцию, поэтому лимит меньше.
const IMPORT_MAX = 100 * 1024 * 1024

const isPrivateHost = (host) =>
  /^(localhost|0\.0\.0\.0|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|\[?::1\]?|\[?f[cd])/i.test(host) ||
  host.endsWith('.internal') || host.endsWith('.local')

export async function importFromUrl({ kind, url, filename }) {
  const spec = kindOf(kind)
  let parsed
  try {
    parsed = new URL(url)
  } catch {
    throw new Error('Неверная ссылка')
  }
  if (parsed.protocol !== 'https:' || isPrivateHost(parsed.hostname)) {
    throw new Error('Нужна публичная ссылка https://')
  }

  const res = await fetch(parsed, { redirect: 'follow' })
  if (!res.ok) throw new Error(`Не удалось скачать: HTTP ${res.status}`)

  const contentType = (res.headers.get('content-type') || '').split(';')[0].trim()
  const ext = spec.types[contentType]
  if (!ext) throw new Error(`По ссылке лежит ${contentType || 'неизвестный тип'}, а нужен ${Object.keys(spec.types).join(' или ')}`)

  const limit = Math.min(spec.maxBytes, IMPORT_MAX)
  const declared = Number(res.headers.get('content-length') || 0)
  if (declared > limit) throw new Error(`Файл больше ${mb(limit)}`)

  // Читаем с проверкой размера по ходу: content-length может врать или отсутствовать
  const chunks = []
  let total = 0
  for await (const chunk of res.body) {
    total += chunk.length
    if (total > limit) throw new Error(`Файл больше ${mb(limit)}`)
    chunks.push(chunk)
  }
  const body = Buffer.concat(chunks)

  const key = makeKey(spec, filename || parsed.pathname.split('/').pop(), ext)
  await putObject(key, body, contentType)
  return { key, publicUrl: publicUrl(key), size: body.length, contentType }
}
