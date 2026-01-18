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
    let locationData = {
      ip_address: null,
      country: null,
      city: null,
      latitude: null,
      longitude: null
    }
    
    // Шаг 1: Пробуем получить точную геолокацию от браузера (требует разрешения)
    if (navigator.geolocation) {
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          })
        })
        
        console.log('📍 Точная геолокация от браузера:', position.coords)
        
        locationData.latitude = position.coords.latitude
        locationData.longitude = position.coords.longitude
        
        // Получаем город и страну по координатам через обратное геокодирование
        try {
          // Пробуем несколько API для обратного геокодирования
          
          // Вариант 1: BigDataCloud (более точный для Узбекистана)
          try {
            const geoResponse = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=ru`
            )
            const geoData = await geoResponse.json()
            
            console.log('🏙️ Обратное геокодирование от BigDataCloud:', geoData)
            
            if (geoData.city || geoData.locality) {
              locationData.city = geoData.city || geoData.locality
              locationData.country = geoData.countryName
              console.log('✅ Город определен:', locationData.city, locationData.country)
            }
          } catch (err) {
            console.warn('BigDataCloud failed, trying OpenStreetMap...', err)
            
            // Вариант 2: OpenStreetMap (запасной)
            const geoResponse = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}&accept-language=ru`
            )
            const geoData = await geoResponse.json()
            
            console.log('🏙️ Обратное геокодирование от OpenStreetMap:', geoData)
            
            if (geoData.address) {
              locationData.city = geoData.address.city || geoData.address.town || geoData.address.village || geoData.address.state
              locationData.country = geoData.address.country
              console.log('✅ Город определен:', locationData.city, locationData.country)
            }
          }
        } catch (err) {
          console.warn('Reverse geocoding failed:', err)
        }
      } catch (geoError) {
        console.log('⚠️ Пользователь отклонил доступ к геолокации или браузер не поддерживает:', geoError.message)
      }
    }
    
    // Шаг 2: Получаем IP адрес и дополняем данные если геолокация не сработала
    try {
      const response = await fetch('https://ipapi.co/json/')
      const data = await response.json()
      
      console.log('🌍 Геолокация от ipapi.co:', data)
      
      locationData.ip_address = data.ip
      
      // Используем данные от IP API только если браузер не дал точные координаты
      if (!locationData.latitude) {
        locationData.country = data.country_name
        locationData.city = data.city
        locationData.latitude = data.latitude
        locationData.longitude = data.longitude
      } else if (!locationData.country) {
        // Если браузер дал координаты, но не удалось получить город/страну
        locationData.country = data.country_name
        locationData.city = data.city
      }
      
      return locationData
    } catch (err) {
      console.warn('ipapi.co failed, trying alternative...', err)
    }
    
    // Шаг 3: Запасной API если ipapi.co не сработал
    try {
      const response = await fetch('http://ip-api.com/json/')
      const data = await response.json()
      
      console.log('🌍 Геолокация от ip-api.com:', data)
      
      if (data.status === 'success') {
        locationData.ip_address = data.query
        
        if (!locationData.latitude) {
          locationData.country = data.country
          locationData.city = data.city
          locationData.latitude = data.lat
          locationData.longitude = data.lon
        } else if (!locationData.country) {
          locationData.country = data.country
          locationData.city = data.city
        }
      }
      
      return locationData
    } catch (err) {
      console.warn('ip-api.com failed', err)
    }
    
    return locationData
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
