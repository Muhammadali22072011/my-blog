// Vercel Function: загрузка видео и обложек в R2 из админки.
//
// Только для админа: браузер присылает access token своей сессии Supabase
// (Authorization: Bearer …), сервер проверяет его и строку в site_admins.
//
//   POST { action: 'sign',     kind: 'video'|'poster', filename, contentType, size }
//   POST { action: 'complete', kind, key }
//   POST { action: 'delete',   keys: [...] }

import { adminFromRequest } from './_lib/supabase.js'
import { signUpload, completeUpload, deleteKeys } from './_lib/videos.js'

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Только POST' })
  }

  let admin
  try {
    admin = await adminFromRequest(req)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
  if (!admin) return res.status(401).json({ error: 'Нужен вход админа' })

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}

  try {
    switch (body.action) {
      case 'sign':
        return res.status(200).json(signUpload(body))
      case 'complete':
        return res.status(200).json(await completeUpload(body))
      case 'delete':
        return res.status(200).json(await deleteKeys(body.keys))
      default:
        return res.status(400).json({ error: 'action: sign, complete или delete' })
    }
  } catch (err) {
    return res.status(400).json({ error: err.message })
  }
}
