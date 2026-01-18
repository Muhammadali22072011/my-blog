import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout'
import Home from './pages/Home'
import Blogs from './pages/Blogs'
import BlogPost from './pages/BlogPost'
import Feed from './pages/Feed'
import Search from './pages/Search'
import ProtectedAdmin from './components/ProtectedAdmin'
import News from './pages/News'
import AboutMe from './pages/AboutMe'
import Projects from './pages/Projects'
import MediaManager from './pages/MediaManager'
import NotFound from './components/NotFound'
import { AuthProvider } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import { ThemeProvider } from './context/ThemeContext'
import { logPageView } from './services/SecurityLogger'

function AppContent() {
  const location = useLocation()

  // Логируем просмотр страницы при каждом изменении URL
  useEffect(() => {
    logPageView()
  }, [location])

  return (
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
    </Routes>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
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
