import { useState, useEffect } from 'react'
import { logSecurityEvent } from '../utils/securityLogger'

// Список валидных кодов доступа (можно хранить в .env или базе данных)
const VALID_CODES = [
  'ADMIN2024',
  'SECURE123',
  'BLOG2024',
  'ACCESS777',
  'MASTER999'
]

function AccessCodeAuth({ onSuccess }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [lockoutTime, setLockoutTime] = useState(null)
  const [loading, setLoading] = useState(false)

  // Check lockout on mount
  useEffect(() => {
    const lockout = localStorage.getItem('code_lockout')
    if (lockout) {
      const lockoutEnd = parseInt(lockout)
      if (Date.now() < lockoutEnd) {
        setLockoutTime(lockoutEnd)
      } else {
        localStorage.removeItem('code_lockout')
        localStorage.removeItem('code_attempts')
      }
    }

    const savedAttempts = localStorage.getItem('code_attempts')
    if (savedAttempts) {
      setAttempts(parseInt(savedAttempts))
    }
  }, [])

  // Countdown timer
  useEffect(() => {
    if (lockoutTime) {
      const timer = setInterval(() => {
        if (Date.now() >= lockoutTime) {
          setLockoutTime(null)
          setAttempts(0)
          localStorage.removeItem('code_lockout')
          localStorage.removeItem('code_attempts')
        }
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [lockoutTime])

  const getRemainingTime = () => {
    if (!lockoutTime) return ''
    const remaining = Math.ceil((lockoutTime - Date.now()) / 1000)
    const minutes = Math.floor(remaining / 60)
    const seconds = remaining % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    // Check lockout
    if (lockoutTime && Date.now() < lockoutTime) {
      setError(`Too many attempts. Try again in ${getRemainingTime()}`)
      logSecurityEvent('code_attempt_during_lockout')
      return
    }

    setLoading(true)
    setError('')

    // Simulate delay for security
    setTimeout(() => {
      const trimmedCode = code.trim().toUpperCase()

      if (VALID_CODES.includes(trimmedCode)) {
        // Success
        logSecurityEvent('code_access_granted', { code: trimmedCode })
        localStorage.removeItem('code_attempts')
        localStorage.setItem('admin_access_token', Date.now().toString())
        onSuccess()
      } else {
        // Failed attempt
        const newAttempts = attempts + 1
        setAttempts(newAttempts)
        localStorage.setItem('code_attempts', newAttempts.toString())
        logSecurityEvent('code_access_denied', { attempts: newAttempts })

        // Lockout after 5 failed attempts
        if (newAttempts >= 5) {
          const lockout = Date.now() + (30 * 60 * 1000) // 30 minutes
          localStorage.setItem('code_lockout', lockout.toString())
          setLockoutTime(lockout)
          setError('Too many failed attempts. Locked for 30 minutes.')
          logSecurityEvent('code_account_locked', { duration: '30 minutes' })
        } else {
          setError(`Invalid access code. ${5 - newAttempts} attempts remaining.`)
        }
      }

      setLoading(false)
      setCode('')
    }, 500)
  }

  const isLocked = lockoutTime && Date.now() < lockoutTime

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-lg rounded-3xl mb-6 border border-white/20">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Access Code Required</h1>
          <p className="text-purple-200">Enter your multi-use access code</p>
        </div>

        {/* Form */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Code Input */}
            <div>
              <label className="block text-sm font-medium text-purple-100 mb-3">
                Access Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                disabled={isLocked}
                placeholder="ENTER-CODE-HERE"
                className="w-full px-6 py-4 bg-white/10 border-2 border-white/20 rounded-2xl text-white text-center text-xl font-mono tracking-widest placeholder-purple-300/50 focus:outline-none focus:ring-4 focus:ring-purple-500/50 focus:border-purple-400 disabled:opacity-50 disabled:cursor-not-allowed uppercase"
                maxLength={20}
                required
                autoComplete="off"
                autoFocus
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-500/20 border-2 border-red-400/50 rounded-2xl text-red-100">
                <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="font-medium">{error}</span>
              </div>
            )}

            {/* Lockout Timer */}
            {isLocked && (
              <div className="flex items-center gap-3 p-4 bg-yellow-500/20 border-2 border-yellow-400/50 rounded-2xl text-yellow-100">
                <svg className="w-6 h-6 flex-shrink-0 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <div>
                  <p className="font-semibold">Account Locked</p>
                  <p className="text-sm">Retry in {getRemainingTime()}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || isLocked || !code.trim()}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-lg rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
            >
              {loading ? (
                <>
                  <svg className="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Verifying...
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </svg>
                  Unlock Access
                </>
              )}
            </button>
          </form>

          {/* Info */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="flex items-start gap-3 text-sm text-purple-200">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-medium mb-1">Security Notice</p>
                <p className="text-xs text-purple-300">
                  Access codes are reusable but limited. After 5 failed attempts, access will be locked for 30 minutes.
                </p>
              </div>
            </div>
          </div>

          {/* Attempts Counter */}
          {attempts > 0 && !isLocked && (
            <div className="mt-4 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/20 rounded-full text-orange-200 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {attempts} failed attempt{attempts !== 1 ? 's' : ''}
              </div>
            </div>
          )}
        </div>

        {/* Back Link */}
        <div className="text-center mt-8">
          <a 
            href="/" 
            className="inline-flex items-center gap-2 text-purple-200 hover:text-white transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </a>
        </div>
      </div>
    </div>
  )
}

export default AccessCodeAuth
