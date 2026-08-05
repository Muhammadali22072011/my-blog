import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/*
 * Прежде здесь стоял console.log, печатавший весь объект import.meta.env.
 * Он попадал в продакшен-бандл (drop console в vite.config не работал,
 * см. комментарий там) и выводил в консоль каждому посетителю все
 * переменные окружения сборки. Диагностика оставлена только для dev.
 */
if (import.meta.env.DEV) {
  console.info(
    '[supabase] url:',
    supabaseUrl || '— не задан —',
    '| ключ:',
    supabaseAnonKey ? 'задан' : '— не задан —'
  )
}

/**
 * Причина неработающей конфигурации — или null, если всё на месте.
 *
 * Раньше при отсутствии переменных окружения createClient бросал
 * исключение прямо при импорте модуля, то есть ДО того, как React успевал
 * что-либо отрисовать. Посетитель видел абсолютно белую страницу без
 * единого слова, а в консоли — только "supabaseKey is required".
 * Теперь клиент создаётся с заглушкой, импорт проходит, а приложение
 * показывает внятный экран с описанием проблемы.
 */
export const supabaseConfigError = (() => {
  const missing = []
  if (!supabaseUrl) missing.push('VITE_SUPABASE_URL')
  if (!supabaseAnonKey) missing.push('VITE_SUPABASE_ANON_KEY')
  if (missing.length === 0) return null
  return `Не заданы переменные окружения: ${missing.join(', ')}. ` +
    'Локально — скопируйте .env.example в .env.local; на Vercel — задайте их в настройках проекта.'
})()

if (supabaseConfigError) {
  console.error(supabaseConfigError)
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)
