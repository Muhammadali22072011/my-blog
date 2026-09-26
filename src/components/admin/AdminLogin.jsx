/**
 * Вход владельца в админку. Регистрации нет: аккаунт создаётся руками
 * в Supabase и добавляется в site_admins.
 */
import { useEffect, useRef, useState } from 'react'
import { supabase, supabaseConfigError } from '../../config/supabase'
import { logLogin } from '../../services/SecurityLogger'

const INPUT =
  'w-full border border-ink/25 bg-paper px-3 py-2.5 text-base text-ink focus:border-tile focus:outline-none'

function loginErrorText(error) {
  const message = String(error?.message || '')
  if (error?.status === 429 || /rate limit|too many/i.test(message)) return 'Слишком много попыток, подождите'
  if (/invalid login credentials|invalid.*(email|password)/i.test(message)) return 'Неверная почта или пароль'
  if (/email not confirmed/i.test(message)) return 'Почта не подтверждена — подтвердите её в Supabase'
  if (
    error?.name === 'AuthRetryableFetchError' ||
    /failed to fetch|network|load failed/i.test(message) ||
    (typeof navigator !== 'undefined' && navigator.onLine === false)
  ) {
    return 'Нет связи с сервером. Проверьте интернет'
  }
  return message ? `Не удалось войти: ${message}` : 'Не удалось войти'
}

function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const aliveRef = useRef(false)

  useEffect(() => {
    aliveRef.current = true
    return () => {
      aliveRef.current = false
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return
    if (!email.trim() || !password) {
      setError('Введите почту и пароль')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (authError) throw authError
      // Журнал входов — не критичен, его сбой не должен мешать входу
      Promise.resolve()
        .then(() => logLogin())
        .catch(() => {})
      // Дальше AdminGate сам увидит новую сессию и проверит права
    } catch (err) {
      if (aliveRef.current) setError(loginErrorText(err))
    } finally {
      if (aliveRef.current) setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div>
        <p className="label label-tile mb-3">Админка</p>
        <h1 className="display text-3xl">Вход</h1>
      </div>

      {supabaseConfigError && <p className="text-sm text-terra">{supabaseConfigError}</p>}

      <div>
        <label htmlFor="admin-email" className="label mb-1.5 block">
          Почта
        </label>
        <input
          id="admin-email"
          type="email"
          inputMode="email"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={INPUT}
          required
        />
      </div>

      <div>
        <label htmlFor="admin-password" className="label mb-1.5 block">
          Пароль
        </label>
        <div className="relative">
          <input
            id="admin-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${INPUT} pr-24`}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="btn-ghost absolute inset-y-0 right-0"
            aria-pressed={showPassword}
          >
            {showPassword ? 'Скрыть' : 'Показать'}
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm text-terra">
          {error}
        </p>
      )}

      <button type="submit" className="btn-primary w-full justify-center" disabled={submitting}>
        {submitting ? 'Входим…' : 'Войти'}
      </button>
    </form>
  )
}

export default AdminLogin
