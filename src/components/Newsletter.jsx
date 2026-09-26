import { useState } from 'react'
import toast from 'react-hot-toast'
import { subscribeToNewsletter } from '../services/emailService'

/**
 * Подписка на рассылку.
 * Не карточка с градиентом, а строка с линейкой — как купон в журнале.
 */
function Newsletter() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle')

  const handleSubmit = async (e) => {
    e.preventDefault()

    const value = email.trim().toLowerCase()
    if (!value) return

    setStatus('loading')

    try {
      const result = await subscribeToNewsletter(value)

      if (result === 'already') {
        setStatus('idle')
        toast.error('Этот адрес уже подписан')
        return
      }

      setStatus('success')
      setEmail('')
      toast.success('Готово — проверьте почту')
    } catch (error) {
      console.error('Ошибка подписки:', error)
      setStatus('idle')
      toast.error('Не получилось. Попробуйте позже.')
    }
  }

  return (
    <section aria-labelledby="newsletter-heading">
      <h2 id="newsletter-heading" className="label rule-b pb-2">
        Рассылка
      </h2>

      {status === 'success' ? (
        <p className="mt-4 text-sm leading-relaxed">
          <span className="text-tile">Подписка оформлена.</span> Письмо с подтверждением уже
          в пути — загляните и в папку «Спам».
        </p>
      ) : (
        <>
          <p className="mt-4 text-sm leading-relaxed text-ink-soft">
            Письмо о каждом новом материале. Без спама, отписаться можно в один клик.
          </p>

          <form onSubmit={handleSubmit} className="mt-4">
            <label htmlFor="newsletter-email" className="sr-only">
              Электронная почта
            </label>
            <input
              id="newsletter-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full border-0 border-b border-ink/25 bg-transparent px-0 py-2 outline-none transition-colors placeholder:text-ink-faint focus:border-tile"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="btn-secondary mt-4 disabled:opacity-40"
            >
              {status === 'loading' ? 'Отправляю…' : 'Подписаться'}
            </button>
          </form>
        </>
      )}
    </section>
  )
}

export default Newsletter
