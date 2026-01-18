import { useState, useEffect } from 'react'

// Simple syntax highlighting without external dependencies
const highlightCode = (code, language) => {
  if (!code) return ''
  
  // Keywords for different languages
  const keywords = {
    javascript: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'import', 'export', 'from', 'default', 'async', 'await', 'try', 'catch', 'throw', 'new', 'this', 'true', 'false', 'null', 'undefined', 'typeof', 'instanceof'],
    python: ['def', 'class', 'return', 'if', 'elif', 'else', 'for', 'while', 'import', 'from', 'as', 'try', 'except', 'raise', 'with', 'True', 'False', 'None', 'and', 'or', 'not', 'in', 'is', 'lambda', 'yield', 'async', 'await'],
    css: ['@import', '@media', '@keyframes', '@font-face', 'important'],
    html: ['DOCTYPE', 'html', 'head', 'body', 'div', 'span', 'p', 'a', 'img', 'script', 'style', 'link', 'meta', 'title'],
    sql: ['SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'TABLE', 'INDEX', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'ON', 'AND', 'OR', 'NOT', 'NULL', 'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES']
  }

  const lang = language?.toLowerCase() || 'javascript'
  const langKeywords = keywords[lang] || keywords.javascript

  let highlighted = code
    // Escape HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Strings
    .replace(/(["'`])(?:(?!\1)[^\\]|\\.)*?\1/g, '<span class="text-green-400">$&</span>')
    // Comments
    .replace(/(\/\/.*$|\/\*[\s\S]*?\*\/|#.*$)/gm, '<span class="text-gray-500 italic">$&</span>')
    // Numbers
    .replace(/\b(\d+\.?\d*)\b/g, '<span class="text-orange-400">$1</span>')

  // Keywords
  langKeywords.forEach(keyword => {
    const regex = new RegExp(`\\b(${keyword})\\b`, 'g')
    highlighted = highlighted.replace(regex, '<span class="text-purple-400 font-semibold">$1</span>')
  })

  return highlighted
}

function CodeBlock({ code, language, filename }) {
  const [copied, setCopied] = useState(false)
  const [highlighted, setHighlighted] = useState('')

  useEffect(() => {
    setHighlighted(highlightCode(code, language))
  }, [code, language])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const lines = code?.split('\n') || []

  return (
    <div className="rounded-xl overflow-hidden bg-gray-900 my-4 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          {filename && (
            <span className="text-gray-400 text-sm ml-2">{filename}</span>
          )}
          {language && !filename && (
            <span className="text-gray-400 text-sm ml-2">{language}</span>
          )}
        </div>
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all ${
            copied 
              ? 'bg-green-600 text-white' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>
      
      {/* Code */}
      <div className="overflow-x-auto">
        <pre className="p-4 text-sm font-mono leading-relaxed">
          <code>
            {lines.map((line, i) => (
              <div key={i} className="flex">
                <span className="select-none text-gray-600 w-8 text-right pr-4 flex-shrink-0">
                  {i + 1}
                </span>
                <span 
                  className="text-gray-100 flex-1"
                  dangerouslySetInnerHTML={{ __html: highlightCode(line, language) || '&nbsp;' }}
                />
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  )
}

export default CodeBlock
