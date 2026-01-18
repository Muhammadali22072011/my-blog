// ============================================================================
// SECURE AUTHENTICATION SERVICE
// ============================================================================

import { supabase } from '../config/supabase'

class SecureAuthService {
  constructor() {
    this.sessionToken = null
    this.loadSession()
  }

  // Загрузка сессии из localStorage
  loadSession() {
    try {
      const stored = localStorage.getItem('secure_admin_session')
      if (stored) {
        const session = JSON.parse(stored)
        if (Date.now() < session.expires) {
          this.sessionToken = session.token
        } else {
          this.clearSession()
        }
      }
    } catch (error) {
      console.error('Error loading session:', error)
      this.clearSession()
    }
  }

  // Сохранение сессии
  saveSession(token, expiresInHours = 1) {
    const session = {
      token,
      expires: Date.now() + expiresInHours * 60 * 60 * 1000,
      timestamp: Date.now(),
    }
    localStorage.setItem('secure_admin_session', JSON.stringify(session))
    this.sessionToken = token
  }

  // Очистка сессии
  clearSession() {
    localStorage.removeItem('secure_admin_session')
    this.sessionToken = null
  }

  // Проверка наличия активной сессии
  hasActiveSession() {
    this.loadSession()
    return this.sessionToken !== null
  }

  // Получение токена
  getSessionToken() {
    return this.sessionToken
  }

  // Валидация шага авторизации через Edge Function
  async validateStep(step, answer, additionalData = {}) {
    try {
      const { data, error } = await supabase.functions.invoke('admin-auth', {
        body: {
          step,
          answer,
          ...additionalData,
        },
      })

      if (error) {
        console.error('Validation error:', error)
        return { success: false, message: error.message }
      }

      // Если это последний шаг и успешно - сохраняем токен
      if (data.sessionToken) {
        this.saveSession(data.sessionToken)
      }

      return data
    } catch (error) {
      console.error('Network error:', error)
      return { success: false, message: 'Network error. Please try again.' }
    }
  }

  // Валидация текущей сессии на сервере
  async validateSession() {
    if (!this.sessionToken) {
      return false
    }

    try {
      const { data, error } = await supabase.functions.invoke('admin-validate', {
        body: {
          sessionToken: this.sessionToken,
        },
      })

      if (error || !data?.valid) {
        this.clearSession()
        return false
      }

      return true
    } catch (error) {
      console.error('Session validation error:', error)
      this.clearSession()
      return false
    }
  }

  // Выход (инвалидация сессии)
  async logout() {
    if (this.sessionToken) {
      try {
        // Можно добавить Edge Function для инвалидации на сервере
        await supabase.functions.invoke('admin-logout', {
          body: {
            sessionToken: this.sessionToken,
          },
        })
      } catch (error) {
        console.error('Logout error:', error)
      }
    }
    this.clearSession()
  }

  // Проверка rate limiting (клиентская сторона)
  checkLocalRateLimit() {
    const attempts = this.getRecentAttempts()
    const maxAttempts = 10
    const timeWindow = 15 * 60 * 1000 // 15 минут

    const recentAttempts = attempts.filter(
      (timestamp) => Date.now() - timestamp < timeWindow
    )

    if (recentAttempts.length >= maxAttempts) {
      const oldestAttempt = Math.min(...recentAttempts)
      const waitTime = Math.ceil((timeWindow - (Date.now() - oldestAttempt)) / 1000 / 60)
      return {
        allowed: false,
        message: `Too many attempts. Please wait ${waitTime} minutes.`,
      }
    }

    return { allowed: true }
  }

  // Логирование попытки (клиентская сторона)
  logAttempt() {
    const attempts = this.getRecentAttempts()
    attempts.push(Date.now())
    localStorage.setItem('auth_attempts', JSON.stringify(attempts))
  }

  // Получение недавних попыток
  getRecentAttempts() {
    try {
      const stored = localStorage.getItem('auth_attempts')
      if (stored) {
        const attempts = JSON.parse(stored)
        // Очищаем старые попытки (старше 24 часов)
        const dayAgo = Date.now() - 24 * 60 * 60 * 1000
        return attempts.filter((timestamp) => timestamp > dayAgo)
      }
    } catch (error) {
      console.error('Error reading attempts:', error)
    }
    return []
  }

  // Очистка попыток
  clearAttempts() {
    localStorage.removeItem('auth_attempts')
  }
}

// Экспортируем singleton
export const secureAuthService = new SecureAuthService()
export default secureAuthService
