import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/*
 * Отправка просмотров страниц в Google Analytics и Яндекс.Метрику.
 *
 * Раньше здесь стояло `window.ym(XXXXXXXX, 'hit', …)` — голый
 * идентификатор без кавычек. Это не заглушка, а ReferenceError:
 * стоило подключить счётчик Метрики, и код падал на каждом переходе.
 *
 * Теперь номера счётчиков берутся из переменных окружения; если они
 * не заданы, компонент молча ничего не делает.
 */
const GA_ID = import.meta.env.VITE_GA_ID
const YM_ID = import.meta.env.VITE_YM_ID

function Analytics() {
  const location = useLocation()

  useEffect(() => {
    const page = location.pathname + location.search

    if (GA_ID && typeof window.gtag === 'function') {
      window.gtag('config', GA_ID, { page_path: page })
    }

    const counter = Number(YM_ID)
    if (counter && typeof window.ym === 'function') {
      window.ym(counter, 'hit', page)
    }
  }, [location])

  return null
}

export default Analytics
