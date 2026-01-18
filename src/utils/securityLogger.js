import { supabase } from '../config/supabase'

// Утилита для логирования событий безопасности

export const SecurityEventType = {
  LOGIN_ATTEMPT: 'login_attempt',
  FAILED_LOGIN: 'failed_login',
  SUCCESSFUL_LOGIN: 'successful_login',
  LOGOUT: 'logout',
  PASSWORD_CHANGE: 'password_change',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
  BRUTE_FORCE_ATTEMPT: 'brute_force_attempt',
  SQL_INJECTION_ATTEMPT: 'sql_injection_attempt',
  XSS_ATTEMPT: 'xss_attempt',
  UNAUTHORIZED_ACCESS: 'unauthorized_access',
  DATA_EXPORT: 'data_export',
  SETTINGS_CHANGE: 'settings_change',
  USER_CREATED: 'user_created',
  USER_DELETED: 'user_deleted',
  POST_CREATED: 'post_created',
  POST_DELETED: 'post_deleted'
}

export const SecuritySeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
}

export const SecurityAction = {
  ALLOWED: 'allowed',
  BLOCKED: 'blocked',
  WARNING: 'warning'
}

// Получение IP адреса пользователя
const getUserIP = async () => {
  try {
    const response = await fetch('https://api.ipify.org?format=json')
    const data = await response.json()
    return data.ip
  } catch (error) {
    return 'unknown'
  }
}

// Получение User Agent
const getUserAgent = () => {
  return navigator.userAgent || 'unknown'
}

// Логирование события безопасности
export const logSecurityEvent = async ({
  eventType,
  severity = SecuritySeverity.LOW,
  action = SecurityAction.ALLOWED,
  details = {}
}) => {
  try {
    const ipAddress = await getUserIP()
    const userAgent = getUserAgent()

    const { data: { user } } = await supabase.auth.getUser()

    const logEntry = {
      event_type: eventType,
      severity,
      action,
      ip_address: ipAddress,
      user_agent: userAgent,
      user_id: user?.id || null,
      details
    }

    const { error } = await supabase
      .from('security_logs')
      .insert([logEntry])

    if (error) {
      console.error('Error logging security event:', error)
    }

    // Если критическое событие - отправляем уведомление
    if (severity === SecuritySeverity.CRITICAL) {
      await sendSecurityAlert(logEntry)
    }

    return true
  } catch (error) {
    console.error('Error in logSecurityEvent:', error)
    return false
  }
}

// Отправка уведомления о критическом событии
const sendSecurityAlert = async (logEntry) => {
  try {
    // Здесь можно добавить отправку email, Telegram, SMS и т.д.
    console.warn('🚨 CRITICAL SECURITY EVENT:', logEntry)
    
    // Пример: отправка в Telegram (если настроен)
    // await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     chat_id: TELEGRAM_CHAT_ID,
    //     text: `🚨 CRITICAL SECURITY EVENT\n\nType: ${logEntry.event_type}\nIP: ${logEntry.ip_address}\nTime: ${new Date().toLocaleString()}`
    //   })
    // })
  } catch (error) {
    console.error('Error sending security alert:', error)
  }
}

// Проверка на подозрительную активность
export const detectSuspiciousActivity = (input) => {
  const suspiciousPatterns = [
    // SQL Injection
    /(\bSELECT\b|\bUNION\b|\bDROP\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b)/i,
    /['";]|--|\*|\/\*|\*\//,
    
    // XSS
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    
    // Path Traversal
    /\.\.\//g,
    /\.\.\\/g,
    
    // Command Injection
    /[|&;$()]/
  ]

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(input)) {
      return true
    }
  }

  return false
}

// Проверка силы пароля
export const checkPasswordStrength = (password) => {
  const strength = {
    score: 0,
    feedback: []
  }

  if (password.length < 8) {
    strength.feedback.push('Пароль должен быть минимум 8 символов')
  } else {
    strength.score += 1
  }

  if (password.length >= 12) {
    strength.score += 1
  }

  if (/[a-z]/.test(password)) {
    strength.score += 1
  } else {
    strength.feedback.push('Добавьте строчные буквы')
  }

  if (/[A-Z]/.test(password)) {
    strength.score += 1
  } else {
    strength.feedback.push('Добавьте заглавные буквы')
  }

  if (/[0-9]/.test(password)) {
    strength.score += 1
  } else {
    strength.feedback.push('Добавьте цифры')
  }

  if (/[^a-zA-Z0-9]/.test(password)) {
    strength.score += 1
  } else {
    strength.feedback.push('Добавьте специальные символы')
  }

  // Проверка на распространенные пароли
  const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein']
  if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
    strength.score = 0
    strength.feedback.push('Слишком простой пароль')
  }

  return {
    score: strength.score,
    level: strength.score >= 5 ? 'strong' : strength.score >= 3 ? 'medium' : 'weak',
    feedback: strength.feedback
  }
}

// Защита от брутфорса
const loginAttempts = new Map()

export const checkBruteForce = (identifier) => {
  const now = Date.now()
  const attempts = loginAttempts.get(identifier) || []
  
  // Удаляем попытки старше 15 минут
  const recentAttempts = attempts.filter(time => now - time < 15 * 60 * 1000)
  
  if (recentAttempts.length >= 5) {
    logSecurityEvent({
      eventType: SecurityEventType.BRUTE_FORCE_ATTEMPT,
      severity: SecuritySeverity.CRITICAL,
      action: SecurityAction.BLOCKED,
      details: { identifier, attempts: recentAttempts.length }
    })
    return false // Блокируем
  }
  
  recentAttempts.push(now)
  loginAttempts.set(identifier, recentAttempts)
  
  return true // Разрешаем
}

// Очистка старых попыток входа
setInterval(() => {
  const now = Date.now()
  for (const [identifier, attempts] of loginAttempts.entries()) {
    const recentAttempts = attempts.filter(time => now - time < 15 * 60 * 1000)
    if (recentAttempts.length === 0) {
      loginAttempts.delete(identifier)
    } else {
      loginAttempts.set(identifier, recentAttempts)
    }
  }
}, 5 * 60 * 1000) // Каждые 5 минут

// Санитизация ввода
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

// Валидация email
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Экспорт всех функций
export default {
  logSecurityEvent,
  detectSuspiciousActivity,
  checkPasswordStrength,
  checkBruteForce,
  sanitizeInput,
  isValidEmail,
  SecurityEventType,
  SecuritySeverity,
  SecurityAction
}
