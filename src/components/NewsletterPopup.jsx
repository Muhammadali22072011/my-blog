import { useState, useEffect } from 'react'
import { supabase } from '../config/supabase'

function NewsletterPopup() {
  const [show, setShow] = useState(false)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    // Показываем попап через 30 секунд, если пользователь не подписан
    const hasSubscribed = localStorage.getItem('newsletter_subscribed')
    const hasDismissed = localStorage.getItem('newsletter_dismissed')
    
    if (!hasSubscribed && !hasDismissed) {
      const timer = setTimeout(() => {
        setShow(true)
      }, 30000) // 30 секунд

      return () => clearTimeout(timer)
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert([{ email: email.trim() }])

      if (error) throw error

      setSuccess(true)
      localStorage.setItem('newsletter_subscribed', 'true')
      setTimeout(() => {
        setShow(false)
      }, 2000)
    } catch (error) {
      console.error('Error subscribing:', error)
      alert('Failed to subscribe. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = () => {
    setShow(false)
    localStorage.setItem('newsletter_dismissed', 'true')
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded p-8 max-w-md w-full shadow-edge transform animate-slideUp">
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {success ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
              Welcome aboard!
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              You're now subscribed to our newsletter
            </p>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">📬</div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                Stay Updated!
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Get the latest posts delivered straight to your inbox
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-paper-deep text-white rounded font-medium hover: transition-all disabled:opacity-50"
              >
                {loading ? 'Subscribing...' : 'Subscribe Now'}
              </button>
            </form>

            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
              No spam, unsubscribe anytime
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export default NewsletterPopup
