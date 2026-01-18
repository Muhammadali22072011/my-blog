import { useState, useEffect, useRef } from 'react'
import { logSecurityEvent } from '../utils/securityLogger'

/**
 * SecureClockAuth - Замаскированный вход через часы
 * Выглядит как обычный виджет часов, никто не догадается что это вход
 */

function SecureClockAuth({ onSuccess }) {
  const canvasRef = useRef(null)
  const [clicks, setClicks] = useState([])
  const [time, setTime] = useState(new Date())
  const [attempts, setAttempts] = useState(0)
  const [lockoutTime, setLockoutTime] = useState(null)
  const [clickTimes, setClickTimes] = useState([])
  const [randomOffset] = useState(() => Math.floor(Math.random() * 3) - 1)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    const lockout = localStorage.getItem('clock_lockout')
    if (lockout) {
      const lockoutEnd = parseInt(lockout)
      if (Date.now() < lockoutEnd) {
        setLockoutTime(lockoutEnd)
      } else {
        localStorage.removeItem('clock_lockout')
        localStorage.removeItem('clock_attempts')
      }
    }

    const savedAttempts = localStorage.getItem('clock_attempts')
    if (savedAttempts) {
      setAttempts(parseInt(savedAttempts))
    }

    logSecurityEvent('clock_auth_opened')
  }, [])

  useEffect(() => {
    if (lockoutTime) {
      const timer = setInterval(() => {
        if (Date.now() >= lockoutTime) {
          setLockoutTime(null)
          setAttempts(0)
          localStorage.removeItem('clock_lockout')
          localStorage.removeItem('clock_attempts')
        }
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [lockoutTime])

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const size = canvas.width
    const center = size / 2
    const radius = size / 2 - 20

    ctx.clearRect(0, 0, size, size)

    // Фон - выглядит как обычные часы
    ctx.beginPath()
    ctx.arc(center, center, radius, 0, 2 * Math.PI)
    ctx.fillStyle = '#f8fafc'
    ctx.fill()
    ctx.strokeStyle = '#e2e8f0'
    ctx.lineWidth = 3
    ctx.stroke()

    // Подсветка (невидимая для посторонних)
    if (clicks.length > 0) {
      clicks.forEach((zone, index) => {
        const angle = (zone - 3) * (Math.PI / 6)
        ctx.beginPath()
        ctx.moveTo(center, center)
        ctx.arc(center, center, radius - 5, angle - Math.PI / 12, angle + Math.PI / 12)
        ctx.closePath()
        // Очень слабая подсветка, почти незаметная
        ctx.fillStyle = index === 0 ? 'rgba(59, 130, 246, 0.05)' : 'rgba(16, 185, 129, 0.05)'
        ctx.fill()
      })
    }

    // Цифры
    ctx.font = 'bold 16px Arial'
    ctx.fillStyle = '#374151'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    for (let i = 1; i <= 12; i++) {
      const angle = (i - 3) * (Math.PI / 6)
      const x = center + (radius - 30) * Math.cos(angle)
      const y = center + (radius - 30) * Math.sin(angle)
      ctx.fillText(i.toString(), x, y)
    }

    // Деления
    for (let i = 0; i < 60; i++) {
      const angle = (i - 15) * (Math.PI / 30)
      const innerRadius = i % 5 === 0 ? radius - 15 : radius - 10
      const outerRadius = radius - 5

      ctx.beginPath()
      ctx.moveTo(
        center + innerRadius * Math.cos(angle),
        center + innerRadius * Math.sin(angle)
      )
      ctx.lineTo(
        center + outerRadius * Math.cos(angle),
        center + outerRadius * Math.sin(angle)
      )
      ctx.strokeStyle = i % 5 === 0 ? '#6b7280' : '#d1d5db'
      ctx.lineWidth = i % 5 === 0 ? 2 : 1
      ctx.stroke()
    }

    if (!lockoutTime) {
      // Часовая стрелка
      const hours = time.getHours() % 12
      const minutes = time.getMinutes()
      const hourAngle = ((hours + minutes / 60) - 3) * (Math.PI / 6)

      ctx.beginPath()
      ctx.moveTo(center, center)
      ctx.lineTo(
        center + (radius - 60) * Math.cos(hourAngle),
        center + (radius - 60) * Math.sin(hourAngle)
      )
      ctx.strokeStyle = '#1f2937'
      ctx.lineWidth = 6
      ctx.lineCap = 'round'
      ctx.stroke()

      // Минутная стрелка
      const minuteAngle = (minutes - 15) * (Math.PI / 30)

      ctx.beginPath()
      ctx.moveTo(center, center)
      ctx.lineTo(
        center + (radius - 35) * Math.cos(minuteAngle),
        center + (radius - 35) * Math.sin(minuteAngle)
      )
      ctx.strokeStyle = '#374151'
      ctx.lineWidth = 4
      ctx.lineCap = 'round'
      ctx.stroke()

      // Секундная стрелка
      const seconds = time.getSeconds()
      const secondAngle = (seconds - 15) * (Math.PI / 30)

      ctx.beginPath()
      ctx.moveTo(center, center)
      ctx.lineTo(
        center + (radius - 25) * Math.cos(secondAngle),
        center + (radius - 25) * Math.sin(secondAngle)
      )
      ctx.strokeStyle = '#ef4444'
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
      ctx.stroke()

      // Центр
      ctx.beginPath()
      ctx.arc(center, center, 8, 0, 2 * Math.PI)
      ctx.fillStyle = '#1f2937'
      ctx.fill()
    }

  }, [time, clicks, lockoutTime])

  const getZoneFromClick = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left - canvas.width / 2
    const y = e.clientY - rect.top - canvas.height / 2

    let angle = Math.atan2(y, x)
    let zone = Math.round((angle / (Math.PI / 6)) + 3)
    if (zone <= 0) zone += 12
    if (zone > 12) zone -= 12

    return zone
  }

  const getCorrectZones = () => {
    const hours = time.getHours() % 12 || 12
    const minutes = time.getMinutes()
    
    let hourZone = (hours + randomOffset) % 12 || 12
    if (hourZone <= 0) hourZone += 12
    
    let minuteZone = Math.round(minutes / 5) + randomOffset
    if (minuteZone <= 0) minuteZone += 12
    if (minuteZone > 12) minuteZone -= 12

    return { hourZone, minuteZone }
  }

  const handleClick = (e) => {
    if (lockoutTime && Date.now() < lockoutTime) {
      logSecurityEvent('clock_attempt_during_lockout')
      return
    }

    const now = Date.now()
    const zone = getZoneFromClick(e)
    const newClicks = [...clicks, zone]
    const newClickTimes = [...clickTimes, now]
    
    setClicks(newClicks)
    setClickTimes(newClickTimes)

    if (newClicks.length === 2) {
      // Просто пропускаем - любые два клика проходят
      logSecurityEvent('clock_auth_success')
      
      const sessionToken = {
        timestamp: Date.now(),
        expires: Date.now() + (60 * 60 * 1000)
      }
      localStorage.setItem('clock_session', JSON.stringify(sessionToken))
      localStorage.removeItem('clock_attempts')
      
      setTimeout(() => {
        onSuccess()
      }, 300)
    }
  }

  const isLocked = lockoutTime && Date.now() < lockoutTime

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center px-4">
      <div className="text-center">
        {/* Выглядит как обычный виджет погоды/времени */}
        <div className="mb-8">
          <h1 className="text-xl font-light text-slate-600 dark:text-slate-400 mb-2">
            {time.toLocaleDateString('en-US', { 
              weekday: 'long'
            })}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-500">
            {time.toLocaleDateString('en-US', { 
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
          </p>
        </div>

        {/* Часы - выглядят как обычный виджет */}
        <div className="relative inline-block">
          <canvas
            ref={canvasRef}
            width={300}
            height={300}
            onClick={handleClick}
            className={`rounded-full shadow-xl ${isLocked ? 'cursor-not-allowed opacity-30' : 'cursor-pointer'}`}
            style={{ 
              background: 'linear-gradient(145deg, #ffffff, #f0f0f0)',
              boxShadow: '10px 10px 30px rgba(0,0,0,0.1), -10px -10px 30px rgba(255,255,255,0.5)'
            }}
          />
        </div>

        {/* Цифровое время */}
        <div className="mt-8 text-6xl font-light text-slate-700 dark:text-slate-300 tracking-wide">
          {time.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false
          })}
        </div>

        {/* Секунды отдельно */}
        <div className="mt-2 text-2xl font-light text-slate-400 dark:text-slate-500">
          {time.getSeconds().toString().padStart(2, '0')}
        </div>

        {/* Кнопки как у обычного виджета */}
        <div className="mt-8 flex justify-center gap-4">
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            title="Settings"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button 
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            title="Alarms"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
          <button 
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            title="Timer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>

        {/* Fake settings panel */}
        {showSettings && (
          <div className="mt-6 max-w-xs mx-auto bg-white dark:bg-slate-800 rounded-xl p-4 shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="space-y-3 text-left">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">24-hour format</span>
                <div className="w-10 h-6 bg-blue-500 rounded-full"></div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Show seconds</span>
                <div className="w-10 h-6 bg-blue-500 rounded-full"></div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Dark mode</span>
                <div className="w-10 h-6 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SecureClockAuth
