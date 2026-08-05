import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

/*
 * Первичное значение темы обязано совпадать с загрузочным скриптом в
 * index.html — иначе страница на мгновение отрисуется в светлой теме
 * и только потом переключится (эффект «вспышки»).
 * localStorage обёрнут в try: в приватном режиме Safari обращение к нему
 * бросает исключение и роняло всё приложение.
 */
const readStoredTheme = () => {
  try {
    return localStorage.getItem('theme')
  } catch {
    return null
  }
}

const writeStoredTheme = (value) => {
  try {
    localStorage.setItem('theme', value)
  } catch {
    /* приватный режим — просто не сохраняем выбор */
  }
}

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    const saved = readStoredTheme()
    if (saved) return saved === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])

  // Реакция на смену системной темы — только пока пользователь не выбрал сам
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e) => {
      if (!readStoredTheme()) setIsDark(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  /*
   * Запись в localStorage делается ТОЛЬКО при явном переключении.
   * Раньше значение сохранялось эффектом при каждом монтировании, поэтому
   * ключ `theme` существовал всегда — и слушатель системной темы выше
   * не срабатывал никогда.
   */
  const toggleTheme = () =>
    setIsDark((prev) => {
      const next = !prev
      writeStoredTheme(next ? 'dark' : 'light')
      return next
    })

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
