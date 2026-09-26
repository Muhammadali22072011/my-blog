// Клиент Supabase с service-role ключом — только для серверных функций.
// Ключ обходит RLS, поэтому в браузер он не попадает никогда.

import { createClient } from '@supabase/supabase-js'

let client

export function getDb() {
  if (!client) {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error('На сервере не заданы SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY')
    client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  }
  return client
}

/**
 * Пользователь из заголовка Authorization: Bearer <access token Supabase>,
 * если он админ (строка в site_admins). Иначе null.
 */
export async function adminFromRequest(req) {
  const header = req.headers.authorization || ''
  if (!header.toLowerCase().startsWith('bearer ')) return null
  const token = header.slice(7).trim()
  if (!token) return null

  const db = getDb()
  const { data, error } = await db.auth.getUser(token)
  if (error || !data?.user) return null

  const { data: row } = await db.from('site_admins').select('user_id').eq('user_id', data.user.id).maybeSingle()
  return row ? data.user : null
}
