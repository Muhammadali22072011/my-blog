/**
 * Подписка на рассылку.
 *
 * Письма отправляет сервер (api/newsletter.js): ключ Resend в браузер
 * больше не попадает. Раньше он лежал здесь как VITE_RESEND_API_KEY,
 * то есть был виден в коде сайта любому посетителю.
 *
 * Возвращает 'subscribed' или 'already'; при ошибке бросает исключение.
 */
export async function subscribeToNewsletter(email) {
  const res = await fetch('/api/newsletter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || `Ошибка ${res.status}`)
  return json.status
}
