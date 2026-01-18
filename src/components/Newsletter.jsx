import { useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../config/supabase'
import { sendWelcomeEmail } from '../services/emailService'

function Newsletter() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) return

    setStatus('loading')
    
    try {
      const { data: existing } = await supabase
        .from('newsletter_subscribers')
        .select('id, subscribed_at')
        .eq('email', email.toLowerCase())
        .maybeSingle()

      if (existing && existing.subscribed_at) {
        setStatus('error')
        toast.error('This email is already subscribed!')
        setTimeout(() => setStatus('idle'), 2000)
        return
      }

      const { error } = await supabase
        .from('newsletter_subscribers')
        .upsert([{ 
          email: email.toLowerCase()
        }], {
          onConflict: 'email'
        })

      if (error) throw error

      // Отправляем приветственное письмо
      const emailResult = await sendWelcomeEmail(email.toLowerCase())
      
      if (emailResult.success) {
        setStatus('success')
        toast.success('🎉 Successfully subscribed! Check your email.')
        console.log('📧 Welcome email sent to:', email)
        
        setTimeout(() => {
          toast('📬 Check your inbox (and spam folder) for confirmation email', {
            duration: 5000,
            icon: '✉️'
          })
        }, 1000)
      } else {
        // Даже если письмо не отправилось, подписка сохранена
        setStatus('success')
        toast.success('🎉 Successfully subscribed!')
        console.warn('Email sending failed:', emailResult.error)
      }
      
      setEmail('')
      
    } catch (error) {
      console.error('Newsletter error:', error)
      setStatus('error')
      toast.error('Something went wrong. Please try again.')
      setTimeout(() => setStatus('idle'), 2000)
    }
  }

  return (
    <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl p-6 text-white">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-white/20 rounded-lg">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold">Newsletter</h3>
      </div>
      
      <p className="text-white/80 text-sm mb-4">
        Get notified about new posts. No spam, unsubscribe anytime.
      </p>

      {status === 'success' ? (
        <div className="flex items-center gap-2 p-3 bg-green-500/20 rounded-xl border border-green-400/30">
          <svg className="w-5 h-5 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm">Successfully subscribed! 🎉</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
            required
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full py-2.5 bg-white text-blue-600 font-semibold rounded-xl hover:bg-white/90 transition-colors disabled:opacity-50"
          >
            {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
          </button>
        </form>
      )}
      
      <p className="text-white/60 text-xs mt-3 text-center">
        By subscribing, you agree to receive email updates
      </p>
    </div>
  )
}

export default Newsletter
