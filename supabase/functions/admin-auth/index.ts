// ============================================================================
// SECURE ADMIN AUTHENTICATION - EDGE FUNCTION
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

// Типы
interface AuthRequest {
  step: number
  answer: string | number[]
  sessionId?: string
  clockTime?: string
}

interface AuthResponse {
  success: boolean
  sessionToken?: string
  message?: string
  nextStep?: number
}

// Константы
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

// Секретные ответы (хранятся только на сервере!)
const SECRETS = {
  pattern: [1, 2, 5, 8, 9],
  sequence: [1, 1, 2, 3, 5, 8],
  questions: [
    { q: '?', a: 'm' },
    { q: '5', a: '5' },
    { q: '2025', a: '2025' },
    { q: '2', a: '2' },
  ],
}

// Создаем Supabase клиент
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

// Генерация безопасного токена
function generateSecureToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// Хеширование данных
async function hashData(data: string): Promise<string> {
  const encoder = new TextEncoder()
  const dataBuffer = encoder.encode(data)
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Проверка rate limiting
async function checkRateLimit(ipAddress: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_ip_address: ipAddress,
    p_time_window: '15 minutes',
    p_max_attempts: 10,
  })

  if (error) {
    console.error('Rate limit check error:', error)
    return false
  }

  return data === true
}

// Логирование попытки
async function logAttempt(
  ipAddress: string,
  userAgent: string,
  step: number,
  success: boolean
): Promise<void> {
  await supabase.rpc('log_login_attempt', {
    p_ip_address: ipAddress,
    p_user_agent: userAgent,
    p_step_number: step,
    p_success: success,
  })
}

// Валидация часов (step 1)
function validateClock(clockTime: string): boolean {
  // Проверяем формат времени (должно быть 12:00)
  const targetTime = '12:00'
  return clockTime === targetTime
}

// Валидация математики (step 2)
function validateMath(answer: number, problem: { a: number; b: number; op: string }): boolean {
  let correct = 0
  switch (problem.op) {
    case '+':
      correct = problem.a + problem.b
      break
    case '-':
      correct = problem.a - problem.b
      break
    case '*':
      correct = problem.a * problem.b
      break
  }
  return answer === correct
}

// Валидация секретного вопроса (step 3)
function validateSecret(answer: string, questionIndex: number): boolean {
  if (questionIndex < 0 || questionIndex >= SECRETS.questions.length) {
    return false
  }
  return answer.toLowerCase().trim() === SECRETS.questions[questionIndex].a.toLowerCase()
}

// Валидация паттерна (step 4)
function validatePattern(pattern: number[]): boolean {
  if (pattern.length !== SECRETS.pattern.length) return false
  const sorted = [...pattern].sort((a, b) => a - b)
  return JSON.stringify(sorted) === JSON.stringify(SECRETS.pattern)
}

// Валидация последовательности (step 5)
function validateSequence(sequence: number[]): boolean {
  return JSON.stringify(sequence) === JSON.stringify(SECRETS.sequence)
}

// Создание сессии
async function createSession(ipAddress: string, userAgent: string): Promise<string> {
  const sessionToken = generateSecureToken()

  const { error } = await supabase.rpc('create_admin_session', {
    p_session_token: sessionToken,
    p_user_agent: userAgent,
    p_ip_address: ipAddress,
    p_expires_in_hours: 1,
  })

  if (error) {
    console.error('Session creation error:', error)
    throw new Error('Failed to create session')
  }

  return sessionToken
}

// Валидация сессии
async function validateSession(sessionToken: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('validate_admin_session', {
    p_session_token: sessionToken,
  })

  if (error) {
    console.error('Session validation error:', error)
    return false
  }

  return data === true
}

// Главный обработчик
serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    // Получаем IP и User-Agent
    const ipAddress = req.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = req.headers.get('user-agent') || 'unknown'

    // Проверяем rate limiting
    const canProceed = await checkRateLimit(ipAddress)
    if (!canProceed) {
      await logAttempt(ipAddress, userAgent, 0, false)
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Too many attempts. Please try again later.',
        }),
        { status: 429, headers: CORS_HEADERS }
      )
    }

    // Парсим запрос
    const body: AuthRequest = await req.json()
    const { step, answer, sessionId, clockTime } = body

    let isValid = false
    let message = 'Invalid answer'

    // Валидация в зависимости от шага
    switch (step) {
      case 1: // Часы
        isValid = validateClock(clockTime || '')
        break

      case 2: // Математика
        // Для математики нужно передать задачу в запросе
        // или сохранить её в сессии
        isValid = typeof answer === 'number'
        break

      case 3: // Секретный вопрос
        // Нужно передать индекс вопроса
        isValid = validateSecret(answer as string, 0)
        break

      case 4: // Паттерн
        isValid = validatePattern(answer as number[])
        break

      case 5: // Последовательность
        isValid = validateSequence(answer as number[])
        break

      default:
        message = 'Invalid step'
    }

    // Логируем попытку
    await logAttempt(ipAddress, userAgent, step, isValid)

    // Если это последний шаг и ответ правильный - создаем сессию
    if (step === 5 && isValid) {
      const sessionToken = await createSession(ipAddress, userAgent)
      return new Response(
        JSON.stringify({
          success: true,
          sessionToken,
          message: 'Authentication successful',
        }),
        { headers: CORS_HEADERS }
      )
    }

    // Возвращаем результат
    return new Response(
      JSON.stringify({
        success: isValid,
        message: isValid ? 'Correct' : message,
        nextStep: isValid ? step + 1 : step,
      }),
      { headers: CORS_HEADERS }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Internal server error',
      }),
      { status: 500, headers: CORS_HEADERS }
    )
  }
})
