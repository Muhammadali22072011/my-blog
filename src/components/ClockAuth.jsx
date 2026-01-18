import { useState, useEffect, useRef } from 'react'

/**
 * ClockAuth - Графическая авторизация через часы
 * 
 * КАК РАЗБЛОКИРОВАТЬ:
 * 1. Смотришь на часы - видишь где часовая и минутная стрелки
 * 2. Кликаешь СНАЧАЛА на зону где часовая стрелка (короткая)
 * 3. Потом кликаешь на зону где минутная стрелка (длинная)
 * 4. Если правильно - открывается админка
 * 
 * Пароль меняется каждую минуту автоматически!
 * Посторонний человек видит просто часы и не понимает что это вход.
 */

function ClockAuth({ onSuccess }) {
  const canvasRef = useRef(null)
  const [clicks, setClicks] = useState([])
  const [time, setTime] = useState(new Date())
  const [error, setError] = useState(false)
  const [hint, setHint] = useState('')

  // Обновляем время каждую секунду
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Рисуем часы
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const size = canvas.width
    const center = size / 2
    const radius = size / 2 - 20

    // Очищаем
    ctx.clearRect(0, 0, size, size)

    // Фон часов
    ctx.beginPath()
    ctx.arc(center, center, radius, 0, 2 * Math.PI)
    ctx.fillStyle = '#f8fafc'
    ctx.fill()
    ctx.strokeStyle = '#e2e8f0'
    ctx.lineWidth = 3
    ctx.stroke()

    // Рисуем 12 зон (невидимые, но кликабельные)
    // Подсвечиваем выбранные зоны
    clicks.forEach((zone, index) => {
      const angle = (zone - 3) * (Math.PI / 6)
      ctx.beginPath()
      ctx.moveTo(center, center)
      ctx.arc(center, center, radius - 5, angle - Math.PI / 12, angle + Math.PI / 12)
      ctx.closePath()
      ctx.fillStyle = index === 0 ? 'rgba(59, 130, 246, 0.3)' : 'rgba(16, 185, 129, 0.3)'
      ctx.fill()
    })

    // Цифры на циферблате
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

    // Маленькие деления
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

    // Часовая стрелка (короткая, толстая)
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

    // Минутная стрелка (длинная, тонкая)
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

    // Секундная стрелка (красная, очень тонкая)
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

    // Центральная точка
    ctx.beginPath()
    ctx.arc(center, center, 8, 0, 2 * Math.PI)
    ctx.fillStyle = '#1f2937'
    ctx.fill()

  }, [time, clicks])

  // Определяем зону по клику
  const getZoneFromClick = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left - canvas.width / 2
    const y = e.clientY - rect.top - canvas.height / 2

    // Вычисляем угол
    let angle = Math.atan2(y, x)
    // Конвертируем в часы (0-12)
    let zone = Math.round((angle / (Math.PI / 6)) + 3)
    if (zone <= 0) zone += 12
    if (zone > 12) zone -= 12

    return zone
  }

  // Получаем правильные зоны на основе текущего времени
  const getCorrectZones = () => {
    const hours = time.getHours() % 12 || 12
    const minutes = time.getMinutes()
    
    // Часовая стрелка - округляем до ближайшего часа
    const hourZone = hours
    
    // Минутная стрелка - конвертируем минуты в зону (0-59 -> 1-12)
    // 0-4 мин = 12, 5-9 = 1, 10-14 = 2, и т.д.
    let minuteZone = Math.round(minutes / 5)
    if (minuteZone === 0) minuteZone = 12
    if (minuteZone > 12) minuteZone = 12

    return { hourZone, minuteZone }
  }

  // Обработка клика
  const handleClick = (e) => {
    const zone = getZoneFromClick(e)
    const newClicks = [...clicks, zone]
    setClicks(newClicks)
    setError(false)

    if (newClicks.length === 1) {
      setHint('Теперь кликни на минутную стрелку...')
    }

    if (newClicks.length === 2) {
      const { hourZone, minuteZone } = getCorrectZones()
      
      // Проверяем: первый клик = часовая, второй = минутная
      // Допускаем погрешность ±1 зона
      const hourMatch = Math.abs(newClicks[0] - hourZone) <= 1 || 
                        Math.abs(newClicks[0] - hourZone) === 11
      const minuteMatch = Math.abs(newClicks[1] - minuteZone) <= 1 ||
                          Math.abs(newClicks[1] - minuteZone) === 11

      if (hourMatch && minuteMatch) {
        setHint('✓ Доступ разрешён!')
        setTimeout(() => {
          onSuccess()
        }, 500)
      } else {
        setError(true)
        setHint('Неверно. Попробуй ещё раз.')
        setTimeout(() => {
          setClicks([])
          setError(false)
          setHint('')
        }, 1500)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center px-4">
      <div className="text-center">
        {/* Заголовок как будто это просто виджет часов */}
        <h1 className="text-2xl font-light text-slate-400 mb-8">
          {time.toLocaleDateString('ru-RU', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long' 
          })}
        </h1>

        {/* Часы */}
        <div className={`relative inline-block ${error ? 'animate-shake' : ''}`}>
          <canvas
            ref={canvasRef}
            width={300}
            height={300}
            onClick={handleClick}
            className="cursor-pointer rounded-full shadow-2xl"
            style={{ 
              background: 'linear-gradient(145deg, #ffffff, #f0f0f0)',
              boxShadow: '20px 20px 60px #1e293b, -20px -20px 60px #334155'
            }}
          />
        </div>

        {/* Цифровое время */}
        <div className="mt-6 text-5xl font-mono text-slate-300 tracking-wider">
          {time.toLocaleTimeString('ru-RU', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
          })}
        </div>

        {/* Подсказка (появляется только при взаимодействии) */}
        {hint && (
          <div className={`mt-4 text-sm ${error ? 'text-red-400' : 'text-slate-500'}`}>
            {hint}
          </div>
        )}

        {/* Индикатор кликов */}
        <div className="mt-4 flex justify-center gap-2">
          <div className={`w-3 h-3 rounded-full transition-colors ${
            clicks.length >= 1 ? 'bg-blue-500' : 'bg-slate-600'
          }`} />
          <div className={`w-3 h-3 rounded-full transition-colors ${
            clicks.length >= 2 ? 'bg-green-500' : 'bg-slate-600'
          }`} />
        </div>
      </div>

      {/* CSS для анимации тряски */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  )
}

export default ClockAuth
