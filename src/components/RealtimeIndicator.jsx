import { useState, useEffect } from 'react'

function RealtimeIndicator({ isActive, message = "Live updates" }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (isActive) {
      setVisible(true)
      const timer = setTimeout(() => setVisible(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [isActive])

  if (!visible) {
    return null
  }

  return (
    <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
      <span>{message}</span>
    </div>
  )
}

export default RealtimeIndicator
