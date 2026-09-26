/**
 * Просмотр засчитывается один раз за сессию браузера: лента и страница
 * видео делят один ключ, иначе пролистывание туда-обратно накручивало бы
 * счётчик. Хранилище может быть недоступно (приватный режим, запрет
 * cookies) — тогда просто считаем в памяти вкладки.
 */
const KEY = 'viewed_videos'
const memory = new Set()

function readIds() {
  try {
    const list = JSON.parse(sessionStorage.getItem(KEY) || '[]')
    return Array.isArray(list) ? list.map(String) : []
  } catch {
    return []
  }
}

/** true — видео в этой сессии ещё не засчитано (и теперь отмечено) */
export function markViewedOnce(videoId) {
  const id = String(videoId)
  const ids = readIds()
  if (memory.has(id) || ids.includes(id)) return false
  memory.add(id)
  try {
    // Хвост ограничен, чтобы ключ не рос бесконечно за долгую сессию
    sessionStorage.setItem(KEY, JSON.stringify([...ids, id].slice(-500)))
  } catch {
    /* без хранилища остаётся учёт в памяти */
  }
  return true
}
