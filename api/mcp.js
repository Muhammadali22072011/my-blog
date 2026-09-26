// Vercel Function: MCP-сервер для управления блогом из Claude.
//
// Протокол — MCP Streamable HTTP без состояния: каждый POST несёт один
// JSON-RPC запрос (или пакет), ответ приходит обычным JSON. Сессии и SSE
// не нужны — инструменты короткие и ничего не шлют по своей инициативе.
//
// Доступ — по секретному ключу MCP_TOKEN: в заголовке
// `Authorization: Bearer <ключ>` или в адресе: /mcp/<ключ> (для коннекторов
// claude.ai, где заголовок задать нельзя) либо /mcp?key=<ключ>.
// Без ключа сервер не отвечает вообще: он работает с service-role ключом
// Supabase, то есть мимо RLS, и может удалять посты.
//
// Переменные окружения (панель Vercel → Settings → Environment Variables):
//   MCP_TOKEN                  — длинная случайная строка, придумываете сами
//   SUPABASE_SERVICE_ROLE_KEY  — Supabase → Project Settings → API → service_role
//   SUPABASE_URL               — уже задан для api/og.js
//   SITE_URL                   — необязательно, по умолчанию https://izzatullaev.uz

import { timingSafeEqual } from 'node:crypto'
import { TOOLS } from './_mcp/tools.js'
import { getDb } from './_lib/supabase.js'

const SUPPORTED_VERSIONS = ['2025-06-18', '2025-03-26', '2024-11-05']
const SERVER_INFO = { name: 'muhammadali-blog', title: 'Muhammadali Blog', version: '1.0.0' }
const INSTRUCTIONS = [
  'Управление блогом Muhammadali Izzatullaev: посты, комментарии, профиль, страница «Обо мне»,',
  'настройки сайта, проекты, раздел «Видео», медиафайлы, подписчики и статистика.',
  'Видео: create_video → файл (request_video_upload + PUT + complete_video_upload, либо',
  'import_video_from_url) → set_video_status. Новые видео — черновики.',
  'Начинайте с site_overview. Новые посты по умолчанию создаются черновиками —',
  'публикуйте только когда владелец просит. Текст постов — Markdown.',
  'Изменения видны на сайте сразу, пересборка не нужна.',
].join(' ')

const toolsByName = new Map(TOOLS.map((t) => [t.name, t]))

const safeEqual = (a, b) => {
  const x = Buffer.from(String(a))
  const y = Buffer.from(String(b))
  return x.length === y.length && timingSafeEqual(x, y)
}

// Ключ принимается тремя способами:
//   /mcp/<ключ>             — основной для claude.ai: коннектор может
//                             отбрасывать ?query из адреса, и тогда сервер
//                             отвечал 401, а коннектор уходил искать OAuth
//   /mcp?key=<ключ>         — прежний вариант, оставлен для совместимости
//   Authorization: Bearer   — для Claude Code и скриптов
const readToken = (req) => {
  const header = req.headers.authorization || ''
  if (header.toLowerCase().startsWith('bearer ')) return header.slice(7).trim()
  const url = new URL(req.url, 'http://localhost')
  const fromPath = /^\/(?:api\/)?mcp\/([A-Za-z0-9_-]+)\/?$/.exec(url.pathname)?.[1]
  return fromPath || url.searchParams.get('key') || req.query?.key || ''
}

const rpcError = (id, code, message) => ({ jsonrpc: '2.0', id: id ?? null, error: { code, message } })
const rpcResult = (id, result) => ({ jsonrpc: '2.0', id, result })

async function handleMessage(msg) {
  if (!msg || msg.jsonrpc !== '2.0' || typeof msg.method !== 'string') {
    return rpcError(msg?.id, -32600, 'Invalid Request')
  }
  const isNotification = msg.id === undefined || msg.id === null
  if (isNotification) return null

  switch (msg.method) {
    case 'initialize': {
      const requested = msg.params?.protocolVersion
      return rpcResult(msg.id, {
        protocolVersion: SUPPORTED_VERSIONS.includes(requested) ? requested : SUPPORTED_VERSIONS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions: INSTRUCTIONS,
      })
    }
    case 'ping':
      return rpcResult(msg.id, {})
    case 'tools/list':
      return rpcResult(msg.id, {
        tools: TOOLS.map(({ name, description, inputSchema, annotations }) => ({
          name, description, inputSchema, annotations,
        })),
      })
    case 'tools/call': {
      const tool = toolsByName.get(msg.params?.name)
      if (!tool) return rpcError(msg.id, -32602, `Unknown tool: ${msg.params?.name}`)
      try {
        const output = await tool.run(getDb(), msg.params.arguments || {})
        return rpcResult(msg.id, {
          content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
        })
      } catch (err) {
        // Ошибка инструмента — это результат, а не сбой протокола:
        // модель должна её увидеть и поправить аргументы.
        return rpcResult(msg.id, {
          content: [{ type: 'text', text: `Ошибка: ${err.message}` }],
          isError: true,
        })
      }
    }
    case 'resources/list':
      return rpcResult(msg.id, { resources: [] })
    case 'prompts/list':
      return rpcResult(msg.id, { prompts: [] })
    default:
      return rpcError(msg.id, -32601, `Method not found: ${msg.method}`)
  }
}

const readBody = async (req) => {
  if (req.body !== undefined && req.body !== null && req.body !== '') {
    return typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  }
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const raw = Buffer.concat(chunks).toString('utf8')
  return raw ? JSON.parse(raw) : null
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')

  const expected = process.env.MCP_TOKEN
  if (!expected || expected.length < 16) {
    return res.status(503).json(rpcError(null, -32000, 'MCP_TOKEN не задан (нужно не короче 16 символов)'))
  }
  if (!safeEqual(readToken(req), expected)) {
    return res.status(401).json(rpcError(null, -32001, 'Unauthorized'))
  }

  if (req.method === 'GET' || req.method === 'DELETE') {
    // Потока SSE и сессий у сервера нет
    res.setHeader('Allow', 'POST')
    return res.status(405).end()
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).end()
  }

  let body
  try {
    body = await readBody(req)
  } catch {
    return res.status(400).json(rpcError(null, -32700, 'Parse error'))
  }

  if (Array.isArray(body)) {
    const replies = (await Promise.all(body.map(handleMessage))).filter(Boolean)
    return replies.length ? res.status(200).json(replies) : res.status(202).end()
  }
  const reply = await handleMessage(body)
  return reply ? res.status(200).json(reply) : res.status(202).end()
}

export const config = { maxDuration: 60 }
