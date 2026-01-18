import { createContext, useContext, useState, useEffect } from 'react'
import supabaseService from '../services/SupabaseService'
import { supabase } from '../config/supabase'

const DataContext = createContext()

export const useData = () => {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}

export const DataProvider = ({ children }) => {
  const [posts, setPosts] = useState([])
  const [profile, setProfile] = useState(null)
  const [aboutMePage, setAboutMePage] = useState(null)
  const [siteSettings, setSiteSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dbInitialized, setDbInitialized] = useState(false)
  const [newPost, setNewPost] = useState(null)

  // Инициализация базы данных
  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        setLoading(true)
        setError(null)
        
        await supabaseService.initialize()
        setDbInitialized(true)
        
        // Загружаем все данные
        await loadAllData()
        
        // Настраиваем realtime подписки
        setupRealtimeSubscriptions()
        
      } catch (error) {
        console.error('Ошибка инициализации Supabase:', error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    initializeDatabase()

    // Очистка подписок при размонтировании
    return () => {
      cleanupRealtimeSubscriptions()
    }
  }, [])

  // Настройка realtime подписок
  const setupRealtimeSubscriptions = () => {

    // Подписка на изменения в таблице posts
    const postsSubscription = supabase
      .channel('posts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts'
        },
        (payload) => {
          handlePostsChange(payload)
        }
      )
      .subscribe()

    // Подписка на изменения в таблице profile
    const profileSubscription = supabase
      .channel('profile_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profile'
        },
        (payload) => {
          handleProfileChange(payload)
        }
      )
      .subscribe()

    // Подписка на изменения в таблице about_me
    const aboutMeSubscription = supabase
      .channel('about_me_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'about_me'
        },
        (payload) => {
          handleAboutMeChange(payload)
        }
      )
      .subscribe()

    // Подписка на изменения в таблице site_settings
    const settingsSubscription = supabase
      .channel('site_settings_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'site_settings'
        },
        (payload) => {
          handleSettingsChange(payload)
        }
      )
      .subscribe()

    // Сохраняем ссылки на подписки для очистки
    window.realtimeSubscriptions = {
      posts: postsSubscription,
      profile: profileSubscription,
      aboutMe: aboutMeSubscription,
      settings: settingsSubscription
    }
  }

  // Очистка realtime подписок
  const cleanupRealtimeSubscriptions = () => {
    if (window.realtimeSubscriptions) {
      Object.values(window.realtimeSubscriptions).forEach(subscription => {
        if (subscription) {
          supabase.removeChannel(subscription)
        }
      })
      window.realtimeSubscriptions = null
    }
  }

  // Обработчики изменений в реальном времени
  const handlePostsChange = (payload) => {
    const { eventType, new: newRecord, old: oldRecord } = payload

    switch (eventType) {
      case 'INSERT':
        // Проверяем, нет ли уже такого поста в состоянии
        setPosts(prev => {
          const existingPost = prev.find(post => post.id === newRecord.id)
          if (existingPost) {
            console.log('Пост уже существует в состоянии, пропускаем дублирование:', newRecord.id)
            return prev
          }
          return [newRecord, ...prev]
        })
        
        // Показываем уведомление о новом посте, если он опубликован
        if (newRecord.status === 'published') {
          setNewPost(newRecord)
          // Очищаем уведомление через 5 секунд
          setTimeout(() => setNewPost(null), 5000)
        }
        break
      case 'UPDATE':
        setPosts(prev => prev.map(post => post.id === newRecord.id ? newRecord : post))
        
        // Показываем уведомление, если пост был опубликован
        if (newRecord.status === 'published' && oldRecord?.status !== 'published') {
          setNewPost(newRecord)
          setTimeout(() => setNewPost(null), 5000)
        }
        break
      case 'DELETE':
        setPosts(prev => prev.filter(post => post.id !== oldRecord.id))
        break
      default:
        break
    }
  }

  const handleProfileChange = (payload) => {
    const { eventType, new: newRecord } = payload

    switch (eventType) {
      case 'INSERT':
      case 'UPDATE':
        setProfile(newRecord)
        break
      case 'DELETE':
        setProfile(null)
        break
      default:
        break
    }
  }

  const handleAboutMeChange = (payload) => {
    const { eventType, new: newRecord } = payload

    switch (eventType) {
      case 'INSERT':
      case 'UPDATE':
        setAboutMePage(newRecord)
        break
      case 'DELETE':
        setAboutMePage(null)
        break
      default:
        break
    }
  }

  const handleSettingsChange = (payload) => {
    const { eventType, new: newRecord } = payload

    switch (eventType) {
      case 'INSERT':
      case 'UPDATE':
        setSiteSettings(newRecord)
        break
      case 'DELETE':
        setSiteSettings(null)
        break
      default:
        break
    }
  }

  // Загрузка всех данных
  const loadAllData = async () => {
    try {
      const [postsData, profileData, aboutMeData, settingsData] = await Promise.all([
        supabaseService.getAllPosts(),
        supabaseService.getProfile(),
        supabaseService.getAboutMe(),
        supabaseService.getSiteSettings()
      ])

      setPosts(postsData || [])
      setProfile(profileData || {})
      setAboutMePage(aboutMeData || {})
      setSiteSettings(settingsData || {})
    } catch (error) {
      console.error('Ошибка загрузки данных:', error)
      setError(error.message)
    }
  }

  // Функции для работы с постами
  const createPost = async (postData) => {
    try {
      const newPost = await supabaseService.createPost(postData)
      
      // Добавляем пост вручную только если realtime подписка не сработала
      // Это защита от случаев, когда realtime не работает
      setTimeout(() => {
        setPosts(prev => {
          const existingPost = prev.find(post => post.id === newPost.id)
          if (!existingPost) {
            console.log('Добавляем пост вручную, так как realtime не сработал:', newPost.id)
            return [newPost, ...prev]
          }
          return prev
        })
      }, 1000) // Ждем 1 секунду, чтобы realtime успел сработать
      
      return newPost
    } catch (error) {
      console.error('Ошибка создания поста:', error)
      throw error
    }
  }

  // Alias for createPost to maintain backward compatibility
  const addPost = createPost

  const updatePost = async (id, postData) => {
    try {
      const updatedPost = await supabaseService.updatePost(id, postData)
      
      // Обновляем пост вручную только если realtime подписка не сработала
      setTimeout(() => {
        setPosts(prev => {
          const existingPost = prev.find(post => post.id === id)
          if (existingPost && existingPost.updated_at !== updatedPost.updated_at) {
            console.log('Обновляем пост вручную, так как realtime не сработал:', id)
            return prev.map(post => post.id === id ? updatedPost : post)
          }
          return prev
        })
      }, 1000) // Ждем 1 секунду, чтобы realtime успел сработать
      
      return updatedPost
    } catch (error) {
      console.error('Ошибка обновления поста:', error)
      throw error
    }
  }

  const deletePost = async (id) => {
    try {
      await supabaseService.deletePost(id)
      
      // Удаляем пост вручную только если realtime подписка не сработала
      setTimeout(() => {
        setPosts(prev => {
          const existingPost = prev.find(post => post.id === id)
          if (existingPost) {
            console.log('Удаляем пост вручную, так как realtime не сработал:', id)
            return prev.filter(post => post.id !== id)
          }
          return prev
        })
      }, 1000) // Ждем 1 секунду, чтобы realtime успел сработать
      
    } catch (error) {
      console.error('Ошибка удаления поста:', error)
      throw error
    }
  }

  const clearAllPosts = async () => {
    try {
      await supabaseService.clearAllPosts()
      
      // Очищаем посты вручную только если realtime подписка не сработала
      setTimeout(() => {
        setPosts(prev => {
          if (prev.length > 0) {
            console.log('Очищаем посты вручную, так как realtime не сработал')
            return []
          }
          return prev
        })
      }, 1000) // Ждем 1 секунду, чтобы realtime успел сработать
      
    } catch (error) {
      console.error('Ошибка удаления всех постов:', error)
      throw error
    }
  }

  const publishPost = async (id) => {
    try {
      const updatedPost = await supabaseService.updatePost(id, { status: 'published' })
      
      // Обновляем пост вручную только если realtime подписка не сработала
      setTimeout(() => {
        setPosts(prev => {
          const existingPost = prev.find(post => post.id === id)
          if (existingPost && existingPost.status !== 'published') {
            console.log('Обновляем статус поста вручную, так как realtime не сработал:', id)
            return prev.map(post => post.id === id ? updatedPost : post)
          }
          return prev
        })
      }, 1000) // Ждем 1 секунду, чтобы realtime успел сработать
      
      return updatedPost
    } catch (error) {
      console.error('Ошибка публикации поста:', error)
      throw error
    }
  }

  const unpublishPost = async (id) => {
    try {
      const updatedPost = await supabaseService.updatePost(id, { status: 'draft' })
      
      // Обновляем пост вручную только если realtime подписка не сработала
      setTimeout(() => {
        setPosts(prev => {
          const existingPost = prev.find(post => post.id === id)
          if (existingPost && existingPost.status !== 'draft') {
            console.log('Обновляем статус поста вручную, так как realtime не сработал:', id)
            return prev.map(post => post.id === id ? updatedPost : post)
          }
          return prev
        })
      }, 1000) // Ждем 1 секунду, чтобы realtime успел сработать
      
      return updatedPost
    } catch (error) {
      console.error('Ошибка снятия с публикации поста:', error)
      throw error
    }
  }

  // Функции для работы с профилем
  const updateProfile = async (profileData) => {
    try {
      const updatedProfile = await supabaseService.updateProfile(profileData)
      // Realtime подписка автоматически обновит state
      // Но на случай если realtime не сработает, обновляем через таймаут
      setTimeout(() => {
        setProfile(prev => {
          if (prev && prev.updated_at !== updatedProfile.updated_at) {
            console.log('Обновляем профиль вручную, так как realtime не сработал')
            return updatedProfile
          }
          return prev
        })
      }, 1000)
      return updatedProfile
    } catch (error) {
      console.error('Ошибка обновления профиля:', error)
      throw error
    }
  }

  // Функции для работы с About Me
  const updateAboutMePage = async (aboutMeData) => {
    try {
      const updatedAboutMe = await supabaseService.updateAboutMe(aboutMeData)
      // Realtime подписка автоматически обновит state
      setTimeout(() => {
        setAboutMePage(prev => {
          if (prev && prev.updated_at !== updatedAboutMe.updated_at) {
            console.log('Обновляем About Me вручную, так как realtime не сработал')
            return updatedAboutMe
          }
          return prev
        })
      }, 1000)
      return updatedAboutMe
    } catch (error) {
      console.error('Ошибка обновления About Me:', error)
      throw error
    }
  }

  // Функции для работы с настройками сайта
  const updateSiteSettings = async (settingsData) => {
    try {
      const updatedSettings = await supabaseService.updateSiteSettings(settingsData)
      // Realtime подписка автоматически обновит state
      setTimeout(() => {
        setSiteSettings(prev => {
          if (prev && prev.updated_at !== updatedSettings.updated_at) {
            console.log('Обновляем настройки вручную, так как realtime не сработал')
            return updatedSettings
          }
          return prev
        })
      }, 1000)
      return updatedSettings
    } catch (error) {
      console.error('Ошибка обновления настроек сайта:', error)
      throw error
    }
  }

  // Дополнительные функции для работы с Supabase
  const searchPosts = async (query, category = null) => {
    try {
      const results = await supabaseService.searchPosts(query, category)
      return results.map(post => ({
        ...post,
        tags: post.tags || []
      }))
    } catch (error) {
      console.error('Ошибка поиска постов:', error)
      return []
    }
  }

  const getPostsByCategory = async (category) => {
    try {
      const results = await supabaseService.getPostsByCategory(category)
      return results.map(post => ({
        ...post,
        tags: post.tags || []
      }))
    } catch (error) {
      console.error('Ошибка получения постов по категории:', error)
      return []
    }
  }

  const getPostsWithPagination = async (page = 1, limit = 10) => {
    try {
      return await supabaseService.getPostsWithPagination(page, limit)
    } catch (error) {
      console.error('Ошибка получения постов с пагинацией:', error)
      return { posts: [], totalCount: 0, currentPage: page, totalPages: 0 }
    }
  }

  // Функции для экспорта/импорта
  const exportData = async () => {
    try {
      return await supabaseService.exportData()
    } catch (error) {
      console.error('Ошибка экспорта данных:', error)
      throw error
    }
  }

  const importData = async (data) => {
    try {
      await supabaseService.importData(data)
      // Перезагружаем данные после импорта
      await loadAllData()
      return true
    } catch (error) {
      console.error('Ошибка импорта данных:', error)
      throw error
    }
  }

  // Функция для очистки данных
  const clearAllData = async () => {
    try {
      await supabaseService.clearAllData()
      setPosts([])
      setProfile(null)
      setAboutMePage(null)
      setSiteSettings(null)
      return true
    } catch (error) {
      console.error('Ошибка очистки данных:', error)
      throw error
    }
  }

  // Функция для перезагрузки данных
  const reloadData = async () => {
    try {
      setLoading(true)
      await loadAllData()
    } catch (error) {
      console.error('Ошибка перезагрузки данных:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const value = {
    // Состояние
    posts,
    profile,
    aboutMePage,
    siteSettings,
    loading,
    error,
    dbInitialized,
    newPost,
    
    // Функции для постов
    createPost,
    addPost,
    updatePost,
    deletePost,
    clearAllPosts,
    publishPost,
    unpublishPost,
    
    // Функции для профиля
    updateProfile,
    
    // Функции для About Me
    updateAboutMePage,
    
    // Функции для настроек сайта
    updateSiteSettings,
    
    // Дополнительные функции
    searchPosts,
    getPostsByCategory,
    getPostsWithPagination,
    
    // Функции для экспорта/импорта
    exportData,
    importData,
    
    // Утилиты
    clearAllData,
    reloadData
  }

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  )
}
