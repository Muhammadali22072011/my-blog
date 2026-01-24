import React from 'react'
import CustomVideoPlayer from '../components/CustomVideoPlayer'

/**
 * Вспомогательная функция для формирования полного URL изображения
 */
const getFullImageUrl = (url) => {
  if (!url) return ''
  // Если URL уже полный (начинается с http/https), возвращаем как есть
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  // Если это относительный путь, добавляем базовый URL Supabase storage
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rfppkhwqnlkpjemmoexg.supabase.co'
  return `${supabaseUrl}/storage/v1/object/public/images/blog-images/${url}`
}

/**
 * Улучшенный рендерер Markdown для React
 * Поддерживает все основные элементы Markdown с правильной обработкой
 */

export const renderMarkdown = (text, options = {}) => {
  if (!text || typeof text !== 'string') {
    return options.emptyText ? <p className="text-gray-400">{options.emptyText}</p> : null
  }

  // Нормализация строк и удаление дублирующихся пустых строк
  let normalizedText = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
  
  // Если текст не содержит переносов строк (слитый текст), добавляем их автоматически
  if (!normalizedText.includes('\n') && normalizedText.length > 100) {
    // Разбиваем по точкам с пробелом (конец предложения)
    normalizedText = normalizedText.replace(/\.\s+/g, '.\n\n')
    // Разбиваем по восклицательным и вопросительным знакам
    normalizedText = normalizedText.replace(/([!?])\s+/g, '$1\n\n')
  }
  
  const lines = normalizedText
    .split('\n')
    .filter((line, index, arr) => {
      // Убираем дублирующиеся пустые строки
      if (line.trim() === '') {
        return index === 0 || arr[index - 1].trim() !== ''
      }
      return true
    })
  
  const elements = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const trimmedLine = line.trim()

    // Пропускаем пустые строки
    if (!trimmedLine) {
      i++
      continue
    }

    // Блоки кода
    if (trimmedLine.startsWith('```')) {
      const codeContent = []
      i++ // Пропускаем открывающий ```
      
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeContent.push(lines[i])
        i++
      }
      i++ // Пропускаем закрывающий ```
      
      if (codeContent.length > 0) {
        elements.push(
          <pre key={`code-${elements.length}`} className="bg-gray-100 p-6 rounded-lg overflow-x-auto my-6 border border-gray-200 shadow-sm">
            <code className="text-sm font-mono text-gray-800 whitespace-pre-wrap leading-relaxed">
              {codeContent.join('\n')}
            </code>
          </pre>
        )
      }
      continue
    }

    // Заголовки
    if (trimmedLine.startsWith('#')) {
      const level = trimmedLine.match(/^#+/)[0].length
      const headerText = trimmedLine.replace(/^#+\s*/, '')
      const HeaderTag = `h${Math.min(level, 6)}`
      
      const className = {
        1: "text-4xl font-bold text-gray-900 mb-6 mt-8",
        2: "text-3xl font-bold text-gray-800 mb-4 mt-6", 
        3: "text-2xl font-bold text-gray-700 mb-3 mt-5",
        4: "text-xl font-bold text-gray-700 mb-3 mt-4",
        5: "text-lg font-bold text-gray-700 mb-2 mt-3",
        6: "text-base font-bold text-gray-700 mb-2 mt-2"
      }[level] || "text-base font-bold text-gray-700 mb-2 mt-2"
      
      elements.push(
        <HeaderTag key={`h${level}-${elements.length}`} className={className}>
          {processInlineMarkdown(headerText)}
        </HeaderTag>
      )
      i++
      continue
    }

    // Цитаты
    if (trimmedLine.startsWith('>')) {
      const quoteLines = []
      let currentLine = i
      
      // Собираем все последовательные строки цитат
      while (currentLine < lines.length && lines[currentLine].trim().startsWith('>')) {
        const quoteContent = lines[currentLine].replace(/^>\s*/, '')
        quoteLines.push(quoteContent)
        currentLine++
      }
      
      const quoteContent = quoteLines.join(' ')
      elements.push(
        <blockquote key={`quote-${elements.length}`} className="border-l-4 border-gray-300 pl-6 py-4 my-6 bg-gray-50 italic text-gray-700 rounded-r-lg">
          {processInlineMarkdown(quoteContent)}
        </blockquote>
      )
      
      i = currentLine
      continue
    }

    // Горизонтальные линии
    if (trimmedLine === '---' || trimmedLine === '***' || trimmedLine === '___') {
      elements.push(<hr key={`hr-${elements.length}`} className="my-6 border-gray-300" />)
      i++
      continue
    }

    // Списки
    if (trimmedLine.match(/^[-*]\s/) || trimmedLine.match(/^\d+\.\s/)) {
      const listItems = []
      const isOrdered = trimmedLine.match(/^\d+\.\s/)
      
      while (i < lines.length && (lines[i].trim().match(/^[-*]\s/) || lines[i].trim().match(/^\d+\.\s/))) {
        const listLine = lines[i].trim()
        const content = listLine.replace(/^([-*]|\d+\.)\s/, '')
        
        listItems.push(
          <li key={`li-${i}`} className="text-gray-700 mb-2 leading-relaxed">
            {processInlineMarkdown(content)}
          </li>
        )
        i++
      }
      
      const ListComponent = isOrdered ? 'ol' : 'ul'
      const listClass = isOrdered ? 'list-decimal ml-6 space-y-2' : 'list-disc ml-6 space-y-2'
      
      elements.push(
        <ListComponent key={`list-${elements.length}`} className={`${listClass} mb-6`}>
          {listItems}
        </ListComponent>
      )
      continue
    }

    // Таблицы
    if (trimmedLine.includes('|')) {
      const tableRows = []
      
      while (i < lines.length && lines[i].includes('|')) {
        const tableLine = lines[i].trim()
        if (tableLine && !tableLine.match(/^[\|\s\-:]+$/)) { // Пропускаем разделительные строки
          const cells = tableLine.split('|').map(cell => cell.trim()).filter(cell => cell)
          if (cells.length > 0) {
            tableRows.push(cells)
          }
        }
        i++
      }
      
      if (tableRows.length > 0) {
        const hasHeader = tableRows.length > 1
        elements.push(
          <div key={`table-${elements.length}`} className="my-6 overflow-x-auto">
            <table className="min-w-full border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm">
              {hasHeader && (
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    {tableRows[0].map((cell, index) => (
                      <th key={index} className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-300 dark:border-gray-700">
                        {processInlineMarkdown(cell)}
                      </th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody>
                {(hasHeader ? tableRows.slice(1) : tableRows).map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {processInlineMarkdown(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
      continue
    }

    // Изображения
    if (trimmedLine.match(/^!\[.*?\]\(.*?\)$/)) {
      const imageMatch = trimmedLine.match(/!\[([^\]]*)\]\(([^)]+)\)/)
      if (imageMatch) {
        const [, alt, url] = imageMatch
        const fullUrl = getFullImageUrl(url)
        
        console.log('🖼️ [renderMarkdown] Обрабатываем изображение:', {
          original: url,
          fullUrl: fullUrl,
          alt: alt
        })
        
        elements.push(
          <div key={`img-${elements.length}`} className="my-4">
            <img
              src={fullUrl}
              alt={alt || 'Изображение'}
              style={{ 
                width: '100%', 
                height: 'auto',
                display: 'block',
                maxWidth: '100%'
              }}
              onError={(e) => {
                console.error('❌ [renderMarkdown] Ошибка загрузки изображения:', fullUrl)
                e.target.style.display = 'none'
              }}
              onLoad={() => {
                console.log('✅ [renderMarkdown] Изображение загружено:', fullUrl)
              }}
            />
            {alt && alt !== 'Изображение' && (
              <p className="text-center text-sm text-gray-500 mt-2 italic">{alt}</p>
            )}
          </div>
        )
      }
      i++
      continue
    }

    // Видео с кастомным плеером
    if (trimmedLine.match(/\[🎥 Video\]\(.*?\)/)) {
      const videoMatch = trimmedLine.match(/\[🎥 Video(?:\s*:\s*([^\]]+))?\]\(([^)]+)\)/)
      if (videoMatch) {
        const [, title, url] = videoMatch
        elements.push(
          <div key={`video-${elements.length}`} className="my-6">
            <CustomVideoPlayer 
              src={url} 
              title={title || 'Video'}
            />
          </div>
        )
      }
      i++
      continue
    }

    // HTML элементы (могут быть многострочными)
    if (trimmedLine.includes('<img') || trimmedLine.includes('<video')) {
      // Собираем весь HTML тег (может быть многострочным)
      let htmlContent = trimmedLine
      let currentLine = i
      
      // Если тег не закрыт, собираем следующие строки
      while (currentLine < lines.length && !htmlContent.includes('>')) {
        currentLine++
        if (currentLine < lines.length) {
          htmlContent += ' ' + lines[currentLine].trim()
        }
      }
      
      // Обработка изображений
      if (htmlContent.includes('<img')) {
        const imgMatch = htmlContent.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i)
        if (imgMatch) {
          const src = imgMatch[1]
          const fullSrc = getFullImageUrl(src)
          
          console.log('🖼️ [renderMarkdown] Обрабатываем HTML изображение:', {
            original: src,
            fullSrc: fullSrc,
            htmlContent: htmlContent
          })
          
          const altMatch = htmlContent.match(/alt=["']([^"']*)["']/i)
          const alt = altMatch ? altMatch[1] : 'Изображение'
          
          elements.push(
            <div key={`img-${elements.length}`} className="my-4">
              <img
                src={fullSrc}
                alt={alt}
                style={{ 
                  width: '100%', 
                  height: 'auto',
                  display: 'block',
                  maxWidth: '100%'
                }}
                onError={(e) => {
                  console.error('❌ [renderMarkdown] Ошибка загрузки HTML изображения:', fullSrc)
                  e.target.style.display = 'none'
                }}
                onLoad={() => {
                  console.log('✅ [renderMarkdown] HTML изображение загружено:', fullSrc)
                }}
              />
              {alt && alt !== 'Изображение' && (
                <p className="text-center text-sm text-gray-500 mt-2 italic">{alt}</p>
              )}
            </div>
          )
        }
        i = currentLine + 1
        continue
      }
      
      // Обработка видео с кастомным плеером
      if (htmlContent.includes('<video')) {
        const videoMatch = htmlContent.match(/<video[^>]+src=["']([^"']+)["'][^>]*>/i)
        if (videoMatch) {
          const src = videoMatch[1]
          const titleMatch = htmlContent.match(/title=["']([^"']*)["']/i)
          const title = titleMatch ? titleMatch[1] : 'Video'
          
          elements.push(
            <div key={`video-${elements.length}`} className="my-6">
              <CustomVideoPlayer 
                src={src}
                title={title}
              />
            </div>
          )
        }
        i = currentLine + 1
        continue
      }
      
      i = currentLine + 1
      continue
    }

    // Обычные параграфы
    elements.push(
      <p key={`p-${elements.length}`} className="mb-6 text-gray-700 leading-relaxed">
        {processInlineMarkdown(trimmedLine)}
      </p>
    )
    i++
  }

  return elements
}

/**
 * Улучшенная обработка inline Markdown элементов
 */
export const processInlineMarkdown = (text) => {
  // Безопасная проверка и конвертация в строку
  if (!text) return ''
  if (typeof text !== 'string') {
    text = String(text)
  }

  const elements = []
  let lastIndex = 0
  const patterns = []

  // Жирный текст с ++ синтаксисом
  const boldRegex = /\+\+(.*?)\+\+/g
  let match
  while ((match = boldRegex.exec(text)) !== null) {
    patterns.push({
      type: 'bold',
      start: match.index,
      end: match.index + match[0].length,
      content: match[1]
    })
  }

  // Курсив с * синтаксисом (только если не часть жирного)
  const italicRegex = /\*(.*?)\*/g
  while ((match = italicRegex.exec(text)) !== null) {
    const isPartOfBold = patterns.some(p => 
      p.type === 'bold' && p.start <= match.index && p.end >= match.index + match[0].length
    )
    if (!isPartOfBold) {
      patterns.push({
        type: 'italic',
        start: match.index,
        end: match.index + match[0].length,
        content: match[1]
      })
    }
  }

  // Ссылки
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
  while ((match = linkRegex.exec(text)) !== null) {
    patterns.push({
      type: 'link',
      start: match.index,
      end: match.index + match[0].length,
      content: match[1],
      url: match[2]
    })
  }

  // Inline код
  const codeRegex = /`([^`]+)`/g
  while ((match = codeRegex.exec(text)) !== null) {
    patterns.push({
      type: 'code',
      start: match.index,
      end: match.index + match[0].length,
      content: match[1]
    })
  }

  // HTML span теги (для цветного текста)
  // Улучшенный regex который ловит span с любым содержимым
  const spanRegex = /<span\s+style="([^"]+)">(.+?)<\/span>/gs
  while ((match = spanRegex.exec(text)) !== null) {
    patterns.push({
      type: 'span',
      start: match.index,
      end: match.index + match[0].length,
      style: match[1],
      content: match[2]
    })
  }

  // Сортируем по позиции
  patterns.sort((a, b) => a.start - b.start)

  // Строим результат
  patterns.forEach((pattern, index) => {
    // Добавляем текст перед паттерном
    if (pattern.start > lastIndex) {
      elements.push(text.substring(lastIndex, pattern.start))
    }

    // Добавляем отформатированный элемент
    switch (pattern.type) {
      case 'bold':
        elements.push(<strong key={`bold-${index}`} className="font-bold text-gray-900">{pattern.content}</strong>)
        break
      case 'italic':
        elements.push(<em key={`italic-${index}`} className="italic text-gray-800">{pattern.content}</em>)
        break
      case 'link':
        elements.push(
          <a key={`link-${index}`} href={pattern.url} target="_blank" rel="noopener noreferrer" 
             className="text-blue-600 hover:text-blue-800 underline">
            {pattern.content}
          </a>
        )
        break
      case 'code':
        elements.push(
          <code key={`code-${index}`} className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800">
            {pattern.content}
          </code>
        )
        break
      case 'span':
        // Парсим style строку в объект
        const styleObj = {}
        pattern.style.split(';').forEach(rule => {
          const [prop, value] = rule.split(':').map(s => s.trim())
          if (prop && value) {
            // Конвертируем CSS свойства в camelCase для React
            const camelProp = prop.replace(/-([a-z])/g, (g) => g[1].toUpperCase())
            styleObj[camelProp] = value
          }
        })
        elements.push(
          <span key={`span-${index}`} style={styleObj}>
            {pattern.content}
          </span>
        )
        break
    }

    lastIndex = pattern.end
  })

  // Добавляем оставшийся текст
  if (lastIndex < text.length) {
    elements.push(text.substring(lastIndex))
  }

  return elements.length > 0 ? <>{elements}</> : text
}

/**
 * Быстрое преобразование Markdown в HTML (для простых случаев)
 */
export const markdownToHtml = (markdown) => {
  // Безопасная проверка
  if (!markdown) return ''
  if (typeof markdown !== 'string') {
    markdown = String(markdown)
  }
  
  return markdown
    // Заголовки
    .replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold text-gray-900 mb-4">$1</h1>')
    .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-bold text-gray-800 mb-3">$1</h2>')
    .replace(/^### (.*$)/gm, '<h3 class="text-xl font-bold text-gray-700 mb-2">$1</h3>')
    
    // Жирный текст
    .replace(/\+\+(.*?)\+\+/g, '<strong class="font-bold">$1</strong>')
    
    // Курсив
    .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
    
    // Код
    .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-2 py-1 rounded text-sm font-mono">$1</code>')
    
    // Ссылки
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">$1</a>')
    
    // Изображения
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full h-auto rounded-lg shadow-lg my-4" />')
    
    // Цитаты
    .replace(/^> (.*$)/gm, '<blockquote class="border-l-4 border-gray-300 pl-4 py-2 my-4 bg-gray-50 italic text-gray-700">$1</blockquote>')
    
    // Списки
    .replace(/^- (.*$)/gm, '<li class="text-gray-700">$1</li>')
    .replace(/^(\d+)\. (.*$)/gm, '<li class="text-gray-700">$2</li>')
    
    // Параграфы
    .replace(/\n\n/g, '</p><p class="mb-4 text-gray-700 leading-relaxed">')
    .replace(/^/, '<p class="mb-4 text-gray-700 leading-relaxed">')
    .replace(/$/, '</p>')
}
