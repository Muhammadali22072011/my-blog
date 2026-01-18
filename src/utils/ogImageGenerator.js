// OG Image Generator - создает превью для соцсетей

// Polyfill для roundRect (для старых браузеров)
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, width, height, radius) {
    if (width < 2 * radius) radius = width / 2
    if (height < 2 * radius) radius = height / 2
    this.beginPath()
    this.moveTo(x + radius, y)
    this.arcTo(x + width, y, x + width, y + height, radius)
    this.arcTo(x + width, y + height, x, y + height, radius)
    this.arcTo(x, y + height, x, y, radius)
    this.arcTo(x, y, x + width, y, radius)
    this.closePath()
    return this
  }
}

export const generateOGImage = (title, category = 'Blog') => {
  const canvas = document.createElement('canvas')
  canvas.width = 1200
  canvas.height = 630
  const ctx = canvas.getContext('2d')

  // Градиентный фон
  const gradient = ctx.createLinearGradient(0, 0, 1200, 630)
  gradient.addColorStop(0, '#667eea')
  gradient.addColorStop(0.5, '#764ba2')
  gradient.addColorStop(1, '#f093fb')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 1200, 630)

  // Добавляем паттерн
  ctx.globalAlpha = 0.1
  for (let i = 0; i < 20; i++) {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(Math.random() * 1200, Math.random() * 630, 100, 100)
  }
  ctx.globalAlpha = 1

  // Белый контейнер
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
  ctx.roundRect(60, 80, 1080, 470, 20)
  ctx.fill()

  // Категория
  ctx.fillStyle = '#667eea'
  ctx.font = 'bold 32px Arial, sans-serif'
  ctx.fillText(category.toUpperCase(), 100, 150)

  // Заголовок поста
  ctx.fillStyle = '#1a202c'
  ctx.font = 'bold 56px Arial, sans-serif'
  
  // Разбиваем длинный заголовок на строки
  const maxWidth = 1000
  const words = title.split(' ')
  const lines = []
  let currentLine = words[0]

  for (let i = 1; i < words.length; i++) {
    const testLine = currentLine + ' ' + words[i]
    const metrics = ctx.measureText(testLine)
    if (metrics.width > maxWidth && i > 0) {
      lines.push(currentLine)
      currentLine = words[i]
    } else {
      currentLine = testLine
    }
  }
  lines.push(currentLine)

  // Ограничиваем до 3 строк
  const displayLines = lines.slice(0, 3)
  if (lines.length > 3) {
    displayLines[2] = displayLines[2].substring(0, 40) + '...'
  }

  // Рисуем текст
  let yPosition = 240
  displayLines.forEach((line, index) => {
    ctx.fillText(line, 100, yPosition + (index * 70))
  })

  // Нижняя информация
  ctx.fillStyle = '#718096'
  ctx.font = '28px Arial, sans-serif'
  ctx.fillText('Muhammadali Blog', 100, 500)

  // Иконка
  ctx.fillStyle = '#667eea'
  ctx.beginPath()
  ctx.arc(1050, 500, 30, 0, Math.PI * 2)
  ctx.fill()

  return canvas.toDataURL('image/png')
}

// Сохранить изображение
export const downloadOGImage = (dataUrl, filename = 'og-image.png') => {
  const link = document.createElement('a')
  link.download = filename
  link.href = dataUrl
  link.click()
}

// Загрузить в Supabase Storage
export const uploadOGImageToSupabase = async (supabase, dataUrl, postId) => {
  try {
    // Конвертируем base64 в blob
    const response = await fetch(dataUrl)
    const blob = await response.blob()
    
    const filename = `og-images/post-${postId}.png`
    
    // Загружаем в Supabase Storage
    const { data, error } = await supabase.storage
      .from('blog-images')
      .upload(filename, blob, {
        contentType: 'image/png',
        upsert: true
      })

    if (error) throw error

    // Получаем публичный URL
    const { data: { publicUrl } } = supabase.storage
      .from('blog-images')
      .getPublicUrl(filename)

    return publicUrl
  } catch (error) {
    console.error('Error uploading OG image:', error)
    return null
  }
}
