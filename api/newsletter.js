// Vercel Function: подписка на рассылку и приветственное письмо.
//
// Раньше письмо отправлялось прямо из браузера с ключом VITE_RESEND_API_KEY.
// Всё, что начинается с VITE_, Vite вшивает в код сайта — ключ Resend видел
// любой посетитель. К тому же Resend не принимает запросы из браузера (CORS),
// так что письма и не уходили. Теперь ключ живёт только здесь, на сервере.
//
// Список подписчиков закрыт от посетителей правилами RLS, поэтому проверка
// «уже подписан» и запись идут через service-role клиент.
//
// Переменные окружения: RESEND_API_KEY (без VITE_!), RESEND_FROM (необязательно,
// например «Muhammadali <hello@izzatullaev.uz>» после подтверждения домена в Resend),
// SITE_URL.

import { getDb } from './_lib/supabase.js'

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/

const escapeHtml = (v) =>
  String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

function welcomeHtml(siteUrl) {
  const url = escapeHtml(siteUrl)
  return `<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#F5EFE4;color:#14110E">
  <div style="height:3px;background:#0F6E76;margin-bottom:28px"></div>
  <p style="font-family:monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#4E453A;margin:0">Рассылка</p>
  <h1 style="font-size:30px;line-height:1.1;margin:10px 0 18px">Спасибо за подписку</h1>
  <p style="font-size:16px;line-height:1.7;margin:0 0 24px">Теперь новые материалы и видео будут приходить на этот адрес. Без спама — отписаться можно в любой момент.</p>
  <a href="${url}" style="display:inline-block;background:#14110E;color:#F5EFE4;padding:12px 22px;font-family:monospace;font-size:12px;letter-spacing:.12em;text-transform:uppercase;text-decoration:none">Открыть сайт →</a>
  <p style="font-size:12px;color:#8A7C68;margin-top:32px">Вы получили это письмо, потому что подписались на ${url}</p>
</div>`
}

async function sendWelcome(email, siteUrl) {
  const key = process.env.RESEND_API_KEY
  if (!key) return false
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || 'Muhammadali Izzatullaev <onboarding@resend.dev>',
      to: email,
      subject: 'Спасибо за подписку',
      html: welcomeHtml(siteUrl),
    }),
  })
  if (!res.ok) console.error('Resend ответил', res.status, (await res.text()).slice(0, 200))
  return res.ok
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Только POST' })
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
  const email = String(body.email || '').trim().toLowerCase()
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Неверный адрес почты' })

  try {
    const db = getDb()
    const { data: existing, error: readError } = await db
      .from('newsletter_subscribers')
      .select('id, unsubscribed_at')
      .eq('email', email)
      .maybeSingle()
    if (readError) throw readError

    if (existing && !existing.unsubscribed_at) return res.status(200).json({ status: 'already' })

    const { error } = existing
      ? await db.from('newsletter_subscribers').update({ unsubscribed_at: null, subscribed_at: new Date().toISOString() }).eq('id', existing.id)
      : await db.from('newsletter_subscribers').insert([{ email }])
    if (error) throw error

    const siteUrl = (process.env.SITE_URL || `https://${req.headers.host}`).replace(/\/+$/, '')
    const mailed = await sendWelcome(email, siteUrl).catch(() => false)
    return res.status(200).json({ status: 'subscribed', mailed })
  } catch (err) {
    console.error('Ошибка подписки:', err)
    return res.status(500).json({ error: 'Не получилось подписаться' })
  }
}
