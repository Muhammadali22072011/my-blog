import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect, lazy, Suspense } from 'react'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout'
import Home from './pages/Home'
import NotFound from './components/NotFound'
import { AuthProvider } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import { ThemeProvider } from './context/ThemeContext'
import { logPageView } from './services/SecurityLogger'

/*
 * Разделение по маршрутам. Раньше весь сайт собирался в один бандл
 * на 715 КБ — включая админ-панель на 2200 строк, которая грузилась
 * каждому случайному посетителю.
 */
const Blogs = lazy(() => import('./pages/Blogs'))
const BlogPost = lazy(() => import('./pages/BlogPost'))
const Feed = lazy(() => import('./pages/Feed'))
const Search = lazy(() => import('./pages/Search'))
const News = lazy(() => import('./pages/News'))
const AboutMe = lazy(() => import('./pages/AboutMe'))
const Projects = lazy(() => import('./pages/Projects'))
const MediaManager = lazy(() => import('./pages/MediaManager'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const ProtectedAdmin = lazy(() => import('./components/ProtectedAdmin'))

/** Заглушка на время подгрузки чанка маршрута */
function RouteFallback() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-32 sm:px-8">
      <div className="skeleton h-3 w-24" />
      <div className="skeleton mt-8 h-14 w-3/5" />
      <div className="mt-10 max-w-measure space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton h-4" style={{ width: `${92 - i * 8}%` }} />
        ))}
      </div>
    </div>
  )
}

function AppContent() {
  const location = useLocation()

  // Возврат к началу страницы при переходе: раньше переход из середины
  // списка открывал новую страницу «с середины».
  useEffect(() => {
    if (location.hash) return
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [location.pathname, location.hash])

  useEffect(() => {
    logPageView()
  }, [location])

  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="blogs" element={<Blogs />} />
          <Route path="feed" element={<Feed />} />
          <Route path="post/:id" element={<BlogPost />} />
          <Route path="search" element={<Search />} />
          <Route path="news" element={<News />} />
          <Route path="about" element={<AboutMe />} />
          <Route path="projects" element={<Projects />} />
          <Route path="media" element={<MediaManager />} />
          <Route path="admin" element={<ProtectedAdmin />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Полноэкранные страницы — без общего каркаса */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </Suspense>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: 'rgb(var(--ink))',
                color: 'rgb(var(--paper))',
                borderRadius: '2px',
                fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                fontSize: '0.8rem',
              },
              success: {
                iconTheme: { primary: 'rgb(var(--tile))', secondary: 'rgb(var(--paper))' },
              },
              error: {
                duration: 4000,
                iconTheme: { primary: 'rgb(var(--terra))', secondary: 'rgb(var(--paper))' },
              },
            }}
          />
          <AppContent />
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
