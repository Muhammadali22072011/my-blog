import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
)

/*
 * Регистрация Service Worker.
 *
 * Файл public/sw.js существовал давно, но его никто не регистрировал —
 * ни здесь, ни в index.html. Офлайн-режим и установка приложения
 * не работали в принципе.
 *
 * В режиме разработки регистрация не нужна: кэш воркера мешает HMR.
 */
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.warn('Не удалось зарегистрировать Service Worker:', error)
    })
  })
}
