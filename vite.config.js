import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Оптимизация для продакшена
    minify: 'esbuild', // Используем встроенный esbuild (быстрее и не требует дополнительных зависимостей)
    // Удаляем console.log через esbuild
    esbuild: {
      drop: ['console', 'debugger']
    },
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
