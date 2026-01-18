import { useState } from 'react'

function ExportPost({ post, title }) {
  const [isOpen, setIsOpen] = useState(false)

  const exportMarkdown = () => {
    const markdown = `# ${title}\n\n${post.content}`
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
    window.print()
    setIsOpen(false)
  }

  const exportHTML = () => {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: system-ui; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; }
    h1 { font-size: 2em; margin-bottom: 20px; }
    code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
    pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <div>${post.content.replace(/\n/g, '<br>')}</div>
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
