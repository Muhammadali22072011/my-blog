import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  /*
   * ВАЖНО: `esbuild` — опция ВЕРХНЕГО уровня. Раньше она лежала внутри
   * `build`, где Vite её просто игнорирует, поэтому drop не срабатывал
   * и все console.log (включая дамп import.meta.env) уезжали в продакшен.
   * Проверено: в собранном бандле оставалось 9 вызовов console.
   */
  esbuild: {
    drop: ['debugger'],
    // console.error/warn нужны для диагностики в проде, остальное вырезаем
    pure: ['console.log', 'console.info', 'console.debug', 'console.trace'],
  },

  build: {
    minify: 'esbuild',
    // Разделение кода для лучшей производительности
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'supabase-vendor': ['@supabase/supabase-js'],
          'ui-vendor': ['framer-motion', 'react-hot-toast']
        }
      }
    },
    // Увеличиваем лимит для предупреждений о размере чанков
    chunkSizeWarningLimit: 1000,
    // Оптимизация ассетов
    assetsInlineLimit: 4096,
    // Source maps для продакшена (можно отключить для меньшего размера)
    sourcemap: false
  },
  // Оптимизация зависимостей
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@supabase/supabase-js']
  },
  // Настройки сервера для preview
  preview: {
    port: 4173,
    strictPort: true
  }
})
