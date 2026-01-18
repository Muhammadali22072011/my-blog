import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { logSecurityEvent, detectSuspiciousActivity } from '../utils/securityLogger'

function SecureLogin() {
  const { login, isAuthenticated, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [lockoutTime, setLockoutTime] = useState(null)
  const [showPassword, setShowPassword] = useState(false)

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      navigate('/admin')
    }
  }, [isAuthenticated, isAdmin, navigate])

  // Check lockout
  useEffect(() => {
    const lockout = localStorage.getItem('admin_lockout')
    if (lockout) {
      const lockoutEnd = parseInt(lockout)
      if (Date.now() < lockoutEnd) {
        setLockoutTime(lockoutEnd)
      } else {
        localStorage.removeItem('admin_lockout')
        localStorage.removeItem('login_attempts')
      }
    }

    // Check for suspicious activity
    const suspicious = detectSuspiciousActivity()
    if (suspicious.suspicious) {
      logSecurityEvent('suspicious_activity_detected', suspicious)
    }
  }, [])

  // Countdown timer
  useEffect(() => {
    if (lockoutTime) {
      const timer = setInterval(() => {
        if (Date.now() >= lockoutTime) {
          setLockoutTime(null)
          setAttempts(0)
          localStorage.removeItem('admin_lockout')
          localStorage.removeItem('login_attempts')
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Check lockout
    if (lockoutTime && Date.now() < lockoutTime) {
      setError(`Too many attempts. Try again in ${getRemainingTime()}`)
      logSecurityEvent('login_attempt_during_lockout', { email })
      return
    }

    setError('')
    setLoading(true)

    try {
      logSecurityEvent('login_attempt', { email })
      const result = await login(email, password)
      
      if (result.success) {
        // Clear attempts on success
        localStorage.removeItem('login_attempts')
        setAttempts(0)
        logSecurityEvent('login_success', { email })
        // Will redirect via useEffect
      } else {
        // Track failed attempts
        const newAttempts = attempts + 1
        setAttempts(newAttempts)
        localStorage.setItem('login_attempts', newAttempts.toString())
        logSecurityEvent('login_failed', { email, attempts: newAttempts })
        
        // Lockout after 5 failed attempts
        if (newAttempts >= 5) {
          const lockout = Date.now() + (15 * 60 * 1000) // 15 minutes
          localStorage.setItem('admin_lockout', lockout.toString())
          setLockoutTime(lockout)
          setError('Too many failed attempts. Locked for 15 minutes.')
          logSecurityEvent('account_locked', { email, duration: '15 minutes' })
        } else {
          setError(`Invalid credentials. ${5 - newAttempts} attempts remaining.`)
        }
      }
    } catch (err) {
      setError('Login failed. Please try again.')
      logSecurityEvent('login_error', { email, error: err.message })
    } finally {
      setLoading(false)
    }
  }

  const isLocked = lockoutTime && Date.now() < lockoutTime

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Admin Login</h1>
          <p className="text-gray-400">Secure access to admin panel</p>
        </div>

        {/* Login Form */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLocked}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="admin@example.com"
                required
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLocked}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed pr-12"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Lockout Timer */}
            {isLocked && (
              <div className="flex items-center gap-2 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-xl text-yellow-200 text-sm">
                <svg className="w-5 h-5 flex-shrink-0 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Account locked. Try again in {getRemainingTime()}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || isLocked}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Logging in...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Security Info */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="flex items-start gap-2 text-xs text-gray-400">
              <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>
                This is a secure admin area. After 5 failed login attempts, your access will be locked for 15 minutes.
              </p>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <a href="/" className="text-gray-400 hover:text-white transition-colors text-sm">
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  )
}

export default SecureLogin
