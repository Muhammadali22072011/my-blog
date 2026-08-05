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
    '| anon key:',
    supabaseAnonKey ? 'задан' : '— не задан —'
  )
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Не заданы VITE_SUPABASE_URL и/или VITE_SUPABASE_ANON_KEY. ' +
      'Скопируйте .env.example в .env.local и заполните значения.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
