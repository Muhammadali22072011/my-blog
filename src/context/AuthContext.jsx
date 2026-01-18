import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../config/supabase'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  // Admin email from environment variable
  const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'admin@example.com'

  useEffect(() => {
    // Check current session on mount
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setUser(session.user)
          setIsAuthenticated(true)
          // Check if user email matches admin email
          setIsAdmin(session.user.email === ADMIN_EMAIL)
        }
      } catch (error) {
        console.error('Error checking session:', error)
      } finally {
        setLoading(false)
      }
    }

    checkSession()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user)
          setIsAuthenticated(true)
          setIsAdmin(session.user.email === ADMIN_EMAIL)
        } else {
          setUser(null)
          setIsAuthenticated(false)
          setIsAdmin(false)
        }
        setLoading(false)
      }
    )

    return () => {
      subscription?.unsubscribe()
    }
  }, [ADMIN_EMAIL])

  const login = async (email, password) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        throw error
      }

      if (data.user) {
        setUser(data.user)
        setIsAuthenticated(true)
        setIsAdmin(data.user.email === ADMIN_EMAIL)
        return { success: true }
      }

      return { success: false, error: 'Login failed' }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      setUser(null)
      setIsAuthenticated(false)
      setIsAdmin(false)
      
      // Очищаем все сессии
      localStorage.removeItem('clock_session')
      localStorage.removeItem('clock_attempts')
      localStorage.removeItem('clock_lockout')
      localStorage.removeItem('multi_auth_token')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const value = {
    user,
    isAuthenticated,
    isAdmin,
    loading,
    login,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
