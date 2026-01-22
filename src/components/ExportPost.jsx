import { useState } from 'react'
import { renderMarkdown } from '../utils/markdownRenderer'
import { renderToStaticMarkup } from 'react-dom/server'

function ExportPost({ post, title }) {
  const [isOpen, setIsOpen] = useState(false)
  
  // Функция для получения полного URL изображения
  const getFullImageUrl = (url) => {
    if (!url) return ''
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url
    }
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rfppkhwqnlkpjemmoexg.supabase.co'
    return `${supabaseUrl}/storage/v1/object/public/images/blog-images/${url}`
  }
  
  // Функция для замены относительных путей изображений на полные URL
  const processContentWithFullUrls = (content) => {
    if (!content) return content
    
    // Заменяем Markdown изображения
    let processed = content.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, url) => {
      const fullUrl = getFullImageUrl(url)
      return `![${alt}](${fullUrl})`
    })
    
    // Заменяем HTML изображения
    processed = processed.replace(/<img[^>]+src=["']([^"']+)["']/gi, (match, url) => {
      const fullUrl = getFullImageUrl(url)
      return match.replace(url, fullUrl)
    })
    
    return processed
  }

  const exportMarkdown = () => {
    const processedContent = processContentWithFullUrls(post.content)
    const markdown = `# ${title}\n\n${processedContent}`
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`
    a.click()
    URL.revokeObjectURL(url)
    setIsOpen(false)
  }

  const exportPDF = () => {
    // Обрабатываем контент с полными URL изображений
    const processedContent = processContentWithFullUrls(post.content)
    const markdownContent = renderToStaticMarkup(
      <div>{renderMarkdown(processedContent)}</div>
    )
    
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('Пожалуйста, разрешите всплывающие окна для экспорта PDF')
      return
    }
    
    printWindow.document.write(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      max-width: 800px; 
      margin: 40px auto; 
      padding: 20px; 
      line-height: 1.6;
      color: #000;
      background: #fff;
    }
    h1 { 
      font-size: 2.5em; 
      margin-bottom: 0.5em;
      color: #000;
      font-weight: 700;
      page-break-after: avoid;
    }
    h2 { 
      font-size: 1.8em; 
      margin-top: 1.5em;
      margin-bottom: 0.5em;
      color: #000;
      font-weight: 600;
      page-break-after: avoid;
    }
    h3 { 
      font-size: 1.4em; 
      margin-top: 1.2em;
      margin-bottom: 0.5em;
      color: #000;
      font-weight: 600;
      page-break-after: avoid;
    }
    p { 
      margin-bottom: 1em;
      line-height: 1.7;
      orphans: 3;
      widows: 3;
    }
    a {
      color: #2563eb;
      text-decoration: underline;
    }
    code { 
      background: #f3f4f6; 
      padding: 2px 6px; 
      border-radius: 4px;
      font-family: 'Courier New', Courier, monospace;
      font-size: 0.9em;
      color: #e11d48;
      white-space: pre-wrap;
      word-break: break-word;
    }
    pre { 
      background: #f8f9fa; 
      border: 1px solid #e5e7eb;
      color: #1e293b;
      padding: 16px; 
      border-radius: 8px; 
      overflow-x: auto;
      margin: 1.5em 0;
      line-height: 1.5;
      page-break-inside: avoid;
    }
    pre code {
      background: transparent;
      color: inherit;
      padding: 0;
    }
    ul, ol {
      margin-left: 2em;
      margin-bottom: 1em;
    }
    li {
      margin-bottom: 0.5em;
    }
    blockquote {
      border-left: 4px solid #e5e7eb;
      padding-left: 1em;
      margin: 1.5em 0;
      color: #6b7280;
      font-style: italic;
      page-break-inside: avoid;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.5em 0;
      page-break-inside: avoid;
    }
    th, td {
      border: 1px solid #e5e7eb;
      padding: 8px 12px;
      text-align: left;
    }
    th {
      background: #f9fafb;
      font-weight: 600;
    }
    img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      margin: 1.5em 0;
      page-break-inside: avoid;
    }
    hr {
      border: none;
      border-top: 2px solid #e5e7eb;
      margin: 2em 0;
    }
    @media print {
      body { 
        margin: 0; 
        padding: 20px;
        max-width: 100%;
      }
      @page {
        margin: 2cm;
        size: A4;
      }
    }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <div class="content">
    ${markdownContent}
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
        setTimeout(function() {
          window.close();
        }, 100);
      }, 500);
    }
  </script>
</body>
</html>`)
    
    printWindow.document.close()
    setIsOpen(false)
  }

  const exportHTML = () => {
    // Обрабатываем контент с полными URL изображений
    const processedContent = processContentWithFullUrls(post.content)
    const markdownContent = renderToStaticMarkup(
      <div>{renderMarkdown(processedContent)}</div>
    )
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      max-width: 800px; 
      margin: 40px auto; 
      padding: 20px; 
      line-height: 1.6;
      color: #333;
      background: #fff;
    }
    h1 { 
      font-size: 2.5em; 
      margin-bottom: 0.5em;
      color: #1a1a1a;
      font-weight: 700;
    }
    h2 { 
      font-size: 1.8em; 
      margin-top: 1.5em;
      margin-bottom: 0.5em;
      color: #2a2a2a;
      font-weight: 600;
    }
    h3 { 
      font-size: 1.4em; 
      margin-top: 1.2em;
      margin-bottom: 0.5em;
      color: #3a3a3a;
      font-weight: 600;
    }
    p { 
      margin-bottom: 1em;
      line-height: 1.7;
    }
    a {
      color: #2563eb;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    code { 
      background: #f3f4f6; 
      padding: 2px 6px; 
      border-radius: 4px;
      font-family: 'Courier New', Courier, monospace;
      font-size: 0.9em;
      color: #e11d48;
    }
    pre { 
      background: #1e293b; 
      color: #e2e8f0;
      padding: 16px; 
      border-radius: 8px; 
      overflow-x: auto;
      margin: 1.5em 0;
      line-height: 1.5;
    }
    pre code {
      background: transparent;
      color: inherit;
      padding: 0;
    }
    ul, ol {
      margin-left: 2em;
      margin-bottom: 1em;
    }
    li {
      margin-bottom: 0.5em;
    }
    blockquote {
      border-left: 4px solid #e5e7eb;
      padding-left: 1em;
      margin: 1.5em 0;
      color: #6b7280;
      font-style: italic;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.5em 0;
    }
    th, td {
      border: 1px solid #e5e7eb;
      padding: 8px 12px;
      text-align: left;
    }
    th {
      background: #f9fafb;
      font-weight: 600;
    }
    img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      margin: 1.5em 0;
    }
    hr {
      border: none;
      border-top: 2px solid #e5e7eb;
      margin: 2em 0;
    }
    @media print {
      body { margin: 0; padding: 20px; }
    }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <div class="content">
    ${markdownContent}
  </div>
</body>
</html>`
    
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.html`
    a.click()
    URL.revokeObjectURL(url)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 sm:p-3 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all touch-manipulation active:scale-95"
        title="Export post"
        aria-label="Export post"
      >
        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-44 sm:w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
            <button
              onClick={exportMarkdown}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 sm:gap-3 touch-manipulation active:bg-gray-100 dark:active:bg-gray-600"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200">Markdown</span>
            </button>
            
            <button
              onClick={exportPDF}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 sm:gap-3 touch-manipulation active:bg-gray-100 dark:active:bg-gray-600"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200">PDF (Print)</span>
            </button>
            
            <button
              onClick={exportHTML}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 sm:gap-3 touch-manipulation active:bg-gray-100 dark:active:bg-gray-600"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200">HTML</span>
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default ExportPost
