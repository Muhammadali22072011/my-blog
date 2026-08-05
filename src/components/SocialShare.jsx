import { useState } from 'react'

function SocialShare({ url, title, description }) {
  const [copied, setCopied] = useState(false)

  const shareLinks = {
    telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`,
    reddit: `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
    email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(description + '\n\n' + url)}`
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: description, url })
      } catch {
        /* пользователь закрыл системное окно — это не ошибка */
      }
    }
  }

  const targets = [
    { key: 'telegram', label: 'Telegram' },
    { key: 'twitter', label: 'Twitter' },
    { key: 'linkedin', label: 'LinkedIn' },
    { key: 'facebook', label: 'Facebook' },
    { key: 'whatsapp', label: 'WhatsApp' },
    { key: 'reddit', label: 'Reddit' },
    { key: 'email', label: 'Почтой' },
  ]

  return (
    <div className="rule-t flex flex-wrap items-baseline gap-x-6 gap-y-3 pt-5">
      <p className="label">Поделиться</p>

      {targets.map(({ key, label }) => (
        <a
          key={key}
          href={shareLinks[key]}
          target={key === 'email' ? undefined : '_blank'}
          rel="noopener noreferrer"
          className="label link-wipe hover:text-tile"
        >
          {label}
        </a>
      ))}

      <button onClick={handleCopy} className="label link-wipe hover:text-tile">
        {copied ? 'Ссылка скопирована' : 'Копировать ссылку'}
      </button>

      {typeof navigator !== 'undefined' && navigator.share && (
        <button onClick={handleNativeShare} className="label link-wipe hover:text-tile">
          Ещё…
        </button>
      )}
    </div>
  )
}

export default SocialShare
