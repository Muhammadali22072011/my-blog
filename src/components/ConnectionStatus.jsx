import { useState, useEffect } from 'react'

function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOnline) {
    return null // Не показываем индикатор когда онлайн
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 border border-terra bg-paper px-4 py-2">
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-terra"></div>
        <span className="label text-terra">Нет соединения</span>
      </div>
    </div>
  )
}

export default ConnectionStatus
