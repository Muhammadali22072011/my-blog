import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Компонент для интеграции Google Analytics и Yandex Metrika
function Analytics() {
  const location = useLocation()

  useEffect(() => {
    // Google Analytics - отслеживание просмотров страниц
    if (window.gtag) {
      window.gtag('config', 'G-XXXXXXXXXX', {
        page_path: location.pathname + location.search
      })
    }

    // Yandex Metrika - отслеживание просмотров страниц
    if (window.ym) {
      window.ym(XXXXXXXX, 'hit', location.pathname + location.search)
    }
  }, [location])

  return null
}

export default Analytics
