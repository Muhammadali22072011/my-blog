import { supabase } from '../config/supabase'

// Получение информации о браузере и устройстве
const getBrowserInfo = () => {
  const ua = navigator.userAgent
  let browser = 'Unknown'
  let os = 'Unknown'
  let device = 'Desktop'

  // Определение браузера
  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome'
  else if (ua.includes('Firefox')) browser = 'Firefox'
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari'
  else if (ua.includes('Edg')) browser = 'Edge'
  else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera'

  // Определение ОС
  if (ua.includes('Windows')) os = 'Windows'
  else if (ua.includes('Mac')) os = 'macOS'
  else if (ua.includes('Linux')) os = 'Linux'
  else if (ua.includes('Android')) os = 'Android'
  else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS'

  // Определение устройства
  if (ua.includes('Mobile') || ua.includes('Android') || ua.includes('iPhone')) device = 'Mobile'
  else if (ua.includes('Tablet') || ua.includes('iPad')) device = 'Tablet'

  return { browser, os, device, userAgent: ua }
}

// Получение IP адреса и геолокации
const getLocationInfo = async () => {
  try {
    // Пробуем несколько API для получения более точных данных
    
    // Вариант 1: ipapi.co (основной)
    try {
      const response = await fetch('https://ipapi.co/json/')
      const data = await response.json()
      
      console.log('🌍 Геолокация от ipapi.co:', data)
      
      if (data.ip) {
        return {
          ip_address: data.ip,
          country: data.country_name,
          city: data.city,
          latitude: data.latitude,
          longitude: data.longitude
        }
      }
    } catch (err) {
      console.warn('ipapi.co failed, trying alternative...', err)
    }
    
    // Вариант 2: ip-api.com (запасной)
    try {
      const response = await fetch('http://ip-api.com/json/')
      const data = await response.json()
      
      console.log('🌍 Геолокация от ip-api.com:', data)
      
      if (data.status === 'success') {
        return {
          ip_address: data.query,
          country: data.country,
          city: data.city,
          latitude: data.lat,
          longitude: data.lon
        }
      }
    } catch (err) {
      console.warn('ip-api.com failed', err)
    }
    
    // Если все API не сработали
    return {
      ip_address: null,
      country: null,
      city: null,
      latitude: null,
      longitude: null
    }
  } catch (error) {
    console.error('Error getting location:', error)
    return {
      ip_address: null,
      country: null,
      city: null,
      latitude: null,
      longitude: null
    }
  }
}

// Генерация session ID
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('security_session_id')
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    sessionStorage.setItem('security_session_id', sessionId)
  }
  return sessionId
}

// Логирование события
export const logSecurityEvent = async (eventType, additionalData = {}) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    const browserInfo = getBrowserInfo()
    const locationInfo = await getLocationInfo()
    const sessionId = getSessionId()

    const logData = {
      user_id: user?.id || null,
      event_type: eventType,
      ip_address: locationInfo.ip_address,
      user_agent: browserInfo.userAgent,
      browser: browserInfo.browser,
      os: browserInfo.os,
      device: browserInfo.device,
      country: locationInfo.country,
      city: locationInfo.city,
      latitude: locationInfo.latitude,
      longitude: locationInfo.longitude,
      page_url: window.location.href,
      page_title: document.title,
      referrer: document.referrer || null,
      session_id: sessionId,
      ...additionalData
    }

    console.log('📊 Logging security event:', eventType, logData)
    
    const { data, error } = await supabase
      .from('security_audit_log')
      .insert([logData])
      .select()

    if (error) {
      console.error('❌ Error logging security event:', error)
    } else {
      console.log('✅ Security event logged successfully:', data)
    }
  } catch (error) {
    console.error('Error in logSecurityEvent:', error)
  }
}

// Логирование входа
export const logLogin = async () => {
  await logSecurityEvent('login')
}

// Логирование выхода
export const logLogout = async () => {
  await logSecurityEvent('logout')
}

// Логирование просмотра страницы
export const logPageView = async () => {
  await logSecurityEvent('page_view')
}

// Логирование доступа к админке
export const logAdminAccess = async () => {
  await logSecurityEvent('admin_access')
}

// Автоматическое логирование просмотров страниц
export const initPageViewTracking = () => {
  // Логируем первый просмотр
  logPageView()

  // Логируем при изменении URL (для SPA)
  let lastUrl = window.location.href
  const observer = new MutationObserver(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href
      logPageView()
    }
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true
  })

  return observer
}
