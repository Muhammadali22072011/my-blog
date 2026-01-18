import { useState, useEffect } from 'react'

function QuoteShare() {
  const [selectedText, setSelectedText] = useState('')
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [show, setShow] = useState(false)

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection()
      const text = selection.toString().trim()

      if (text.length > 0) {
        const range = selection.getRangeAt(0)
        const rect = range.getBoundingClientRect()
        
        setSelectedText(text)
        setPosition({
          x: rect.left + rect.width / 2,
          y: rect.top - 50
        })
        setShow(true)
      } else {
        setShow(false)
      }
    }

    document.addEventListener('mouseup', handleSelection)
    return () => document.removeEventListener('mouseup', handleSelection)
  }, [])

  const handleShare = (platform) => {
    const url = window.location.href
    const quote = `"${selectedText}" - ${url}`

    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(quote)}`, '_blank')
        break
      case 'telegram':
        window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(selectedText)}`, '_blank')
        break
      case 'copy':
        navigator.clipboard.writeText(quote)
        alert('Quote copied!')
        break
    }
    setShow(false)
  }

  if (!show) return null

  return (
    <div
      className="fixed z-50 animate-in fade-in slide-in-from-bottom-2"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translateX(-50%)'
      }}
    >
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-2xl p-1 flex gap-1">
        <button
          onClick={() => handleShare('twitter')}
          className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-all"
          title="Share on Twitter"
        >
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        </button>
        <button
          onClick={() => handleShare('telegram')}
          className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-all"
          title="Share on Telegram"
        >
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
          </svg>
        </button>
        <button
          onClick={() => handleShare('copy')}
          className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-all"
          title="Copy quote"
        >
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default QuoteShare
