// Cloudflare R2 через S3 API: подписанные ссылки (SigV4, подпись в адресе).
//
// Зависимостей нет — подпись собирается на node:crypto. Одна функция
// presign() даёт ссылку на любой метод: PUT отдаётся браузеру или MCP для
// прямой загрузки, HEAD и DELETE сервер вызывает сам. Байты видео через
// функции Vercel не проходят никогда (лимит тела запроса там 4,5 МБ).
//
// Переменные окружения (только сервер, без префикса VITE_):
//   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET,
//   R2_PUBLIC_BASE_URL — публичный адрес бакета, например https://media.izzatullaev.uz
//   R2_ENDPOINT — необязательно: другой адрес S3 API (локальная проверка,
//                 другое S3-совместимое хранилище). По умолчанию —
//                 https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com

import { createHash, createHmac } from 'node:crypto'

const REGION = 'auto'
const SERVICE = 's3'

export function r2Config() {
  const cfg = {
    accountId: process.env.R2_ACCOUNT_ID,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucket: process.env.R2_BUCKET,
    publicBase: (process.env.R2_PUBLIC_BASE_URL || '').replace(/\/+$/, ''),
  }
  const missing = Object.entries(cfg).filter(([, v]) => !v).map(([k]) => k)
  cfg.endpoint = (process.env.R2_ENDPOINT || `https://${cfg.accountId}.r2.cloudflarestorage.com`).replace(/\/+$/, '')
  if (missing.length) {
    throw new Error(`Хранилище R2 не настроено: не заданы ${missing.join(', ')}`)
  }
  return cfg
}

const sha256hex = (data) => createHash('sha256').update(data).digest('hex')
const hmac = (key, data) => createHmac('sha256', key).update(data).digest()

/** RFC 3986: всё, кроме A-Z a-z 0-9 - _ . ~, кодируется как %XX */
const encodeRfc3986 = (value) =>
  encodeURIComponent(value).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)

const encodeKey = (key) => key.split('/').map(encodeRfc3986).join('/')

/** Публичный адрес объекта для <video src> и <img src> */
export function publicUrl(key, cfg = r2Config()) {
  return `${cfg.publicBase}/${encodeKey(key)}`
}

/**
 * Подписанная ссылка.
 * headers — заголовки, которые клиент обязан прислать ровно такими
 * (например content-type): они входят в подпись, и R2 отклонит запрос,
 * если значение отличается.
 */
export function presign(method, key, { expiresIn = 3600, headers = {}, now = new Date(), cfg = r2Config() } = {}) {
  const endpoint = new URL(cfg.endpoint || `https://${cfg.accountId}.r2.cloudflarestorage.com`)
  const host = endpoint.host
  const path = `/${encodeRfc3986(cfg.bucket)}/${encodeKey(key)}`

  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '')
  const day = amzDate.slice(0, 8)
  const scope = `${day}/${REGION}/${SERVICE}/aws4_request`

  const signed = { host, ...Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), String(v).trim()])) }
  const signedNames = Object.keys(signed).sort()
  const signedHeaders = signedNames.join(';')

  const query = {
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Content-Sha256': 'UNSIGNED-PAYLOAD',
    'X-Amz-Credential': `${cfg.accessKeyId}/${scope}`,
    'X-Amz-Date': amzDate,
    'X-Amz-Expires': String(expiresIn),
    'X-Amz-SignedHeaders': signedHeaders,
  }
  const canonicalQuery = Object.keys(query)
    .sort()
    .map((k) => `${encodeRfc3986(k)}=${encodeRfc3986(query[k])}`)
    .join('&')

  const canonicalRequest = [
    method,
    path,
    canonicalQuery,
    signedNames.map((n) => `${n}:${signed[n]}\n`).join(''),
    signedHeaders,
    'UNSIGNED-PAYLOAD',
  ].join('\n')

  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, scope, sha256hex(canonicalRequest)].join('\n')

  const kDate = hmac(`AWS4${cfg.secretAccessKey}`, day)
  const kSigning = hmac(hmac(hmac(kDate, REGION), SERVICE), 'aws4_request')
  const signature = createHmac('sha256', kSigning).update(stringToSign).digest('hex')

  return `${endpoint.protocol}//${host}${path}?${canonicalQuery}&X-Amz-Signature=${signature}`
}

/** Метаданные объекта: размер и тип, или null, если его нет */
export async function headObject(key) {
  const res = await fetch(presign('HEAD', key, { expiresIn: 60 }), { method: 'HEAD' })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`R2 HEAD ${res.status}`)
  return {
    size: Number(res.headers.get('content-length') || 0),
    contentType: res.headers.get('content-type') || '',
  }
}

export async function deleteObject(key) {
  const res = await fetch(presign('DELETE', key, { expiresIn: 60 }), { method: 'DELETE' })
  // 204 — удалён, 404 — уже нет; и то и другое — нужный итог
  if (!res.ok && res.status !== 404) throw new Error(`R2 DELETE ${res.status}`)
}

/** Загрузка с сервера (для импорта по ссылке) */
export async function putObject(key, body, contentType) {
  const url = presign('PUT', key, { expiresIn: 600, headers: { 'content-type': contentType } })
  const res = await fetch(url, { method: 'PUT', body, headers: { 'Content-Type': contentType } })
  if (!res.ok) throw new Error(`R2 PUT ${res.status}: ${(await res.text()).slice(0, 200)}`)
}
