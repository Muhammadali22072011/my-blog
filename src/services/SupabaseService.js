import { supabase } from '../config/supabase'

class SupabaseService {
  constructor() {
    this.isInitialized = false
    this.isInitializing = false
    this.bucketsInitialized = false
  }

  // Инициализация сервиса
  async initialize() {
    // Предотвращаем повторную инициализацию
    if (this.isInitialized) {
      console.log('SupabaseService: Уже инициализирован, пропускаем повторную инициализацию')
      return true
    }

    // Добавляем флаг для предотвращения одновременных инициализаций
    if (this.isInitializing) {
      console.log('SupabaseService: Инициализация уже в процессе, ждем завершения...')
      // Ждем завершения текущей инициализации
      while (this.isInitializing) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      return this.isInitialized
    }

    this.isInitializing = true

    try {
      console.log('SupabaseService: Начинаем инициализацию...')
      
      // Проверяем подключение
      const { error } = await supabase.from('posts').select('count').limit(1)
      
      if (error) {
        // Если таблицы не существуют, создаем их
        await this.createTables()
        await this.initializeData()
      } else {
        // Проверяем, есть ли данные, если нет - инициализируем
        const { count } = await this.getPostsCount()
        if (count === 0) {
          await this.initializeData()
        }
      }
      
      // Buckets создаются вручную в Supabase Dashboard
      // Storage -> New bucket -> images, avatars, videos (public: ON)
      this.bucketsInitialized = true
      
      this.isInitialized = true
      console.log('SupabaseService: Инициализация завершена успешно')
      return true
    } catch (error) {
      console.error('Ошибка инициализации Supabase:', error)
      this.isInitialized = false
      throw error
    } finally {
      this.isInitializing = false
    }
  }

  // Создание таблиц (выполняется вручную в Supabase SQL Editor)
  async createTables() {
    // Таблицы создаются вручную через SQL Editor в Supabase
    // Используйте SQL из config/supabase.js
  }

  // Инициализация начальных данных
  async initializeData() {
    try {
      console.log('📝 Начальные данные не будут созданы автоматически')
      console.log('💡 Используйте админ-панель для создания профиля, настроек и постов')
      
      // Проверяем итоговый результат
      const finalCheck = await this.checkAllTablesHaveData()
      if (finalCheck) {
        console.log('✅ База данных готова к использованию')
      } else {
        console.log('⚠️ Некоторые таблицы пусты - создайте данные через админ-панель')
      }
      
    } catch (error) {
      console.error('Ошибка инициализации данных:', error)
    }
  }

  // Проверка наличия данных в таблице
  async checkTableHasData(tableName) {
    try {
      const { count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })
      
      if (error) {
        console.log(`Ошибка проверки таблицы ${tableName}:`, error)
        return false
      }
      
      return (count || 0) > 0
    } catch (error) {
      console.log(`Ошибка при проверке таблицы ${tableName}:`, error)
      return false
    }
  }

  // Проверка всех таблиц на наличие данных
  async checkAllTablesHaveData() {
    const [profile, aboutMe, settings] = await Promise.all([
      this.checkTableHasData('profile'),
      this.checkTableHasData('about_me'),
      this.checkTableHasData('site_settings')
      // Посты не проверяются, так как они создаются вручную
    ])
    
    return profile && aboutMe && settings
  }



  // Получение количества постов
  async getPostsCount() {
    try {
      const { count, error } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
      
      if (error) throw error
      return { count: count || 0 }
    } catch (error) {
      console.error('Ошибка получения количества постов:', error)
      return { count: 0 }
    }
  }

  // Получение всех постов
  async getAllPosts() {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('SupabaseService: Ошибка при загрузке постов:', error)
        throw error
      }
      
      return data || []
    } catch (error) {
      console.error('Ошибка получения постов:', error)
      return []
    }
  }

  // Получение поста по ID
  async getPostById(id) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) {
        console.error('SupabaseService: Ошибка при загрузке поста по ID:', id, error)
        throw error
      }
      
      return data
    } catch (error) {
      console.error('Ошибка получения поста:', error)
      return null
    }
  }

  // Получение поста по slug
  async getPostBySlug(slug) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('slug', slug)
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Ошибка получения поста по slug:', error)
      return null
    }
  }

  // Создание нового поста
  async createPost(postData) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .insert([postData])
        .select()
        .single()
      
      if (error) {
        console.error('SupabaseService: Error creating post:', error)
        throw error
      }
      
      return data
    } catch (error) {
      console.error('SupabaseService: Error creating post:', error)
      throw error
    }
  }

  // Обновление поста
  async updatePost(id, postData) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .update({ ...postData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Ошибка обновления поста:', error)
      throw error
    }
  }

  // Удаление поста
  async deletePost(id) {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      return true
    } catch (error) {
      console.error('Ошибка удаления поста:', error)
      throw error
    }
  }

  // Удаление всех постов
  async clearAllPosts() {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .neq('id', 0) // Удаляем все посты (id > 0)
      
      if (error) throw error
      return true
    } catch (error) {
      console.error('Ошибка удаления всех постов:', error)
      throw error
    }
  }

  // Получение постов по категории
  async getPostsByCategory(category) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('category', category)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Ошибка получения постов по категории:', error)
      return []
    }
  }

  // Поиск постов
  async searchPosts(query, category = null) {
    try {
      let queryBuilder = supabase
        .from('posts')
        .select('*')
        .or(`content.ilike.%${query}%,excerpt.ilike.%${query}%`)
        .order('created_at', { ascending: false })
      
      if (category) {
        queryBuilder = queryBuilder.eq('category', category)
      }
      
      const { data, error } = await queryBuilder
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Ошибка поиска постов:', error)
      return []
    }
  }

  // Получение постов с пагинацией
  async getPostsWithPagination(page = 1, limit = 10) {
    try {
      const from = (page - 1) * limit
      const to = from + limit - 1
      
      const { data, error, count } = await supabase
        .from('posts')
        .select('*', { count: 'exact' })
        .range(from, to)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      return {
        posts: data || [],
        totalCount: count || 0,
        currentPage: page,
        totalPages: Math.ceil((count || 0) / limit)
      }
    } catch (error) {
      console.error('Ошибка получения постов с пагинацией:', error)
      return { posts: [], totalCount: 0, currentPage: page, totalPages: 0 }
    }
  }

  // Получение профиля
  async getProfile() {
    try {
      const { data, error } = await supabase
        .from('profile')
        .select('*')
        .limit(1)
      
      if (error) throw error
      return data && data.length > 0 ? data[0] : null
    } catch (error) {
      console.error('Ошибка получения профиля:', error)
      return null
    }
  }

  // Обновление профиля
  async updateProfile(profileData) {
    try {
      // Сначала получаем существующий профиль чтобы узнать его id
      const existingProfile = await this.getProfile()
      
      if (existingProfile && existingProfile.id) {
        // Обновляем существующий профиль
        const { data, error } = await supabase
          .from('profile')
          .update({ ...profileData, updated_at: new Date().toISOString() })
          .eq('id', existingProfile.id)
          .select()
        
        if (error) throw error
        return data && data.length > 0 ? data[0] : null
      } else {
        // Создаём новый профиль если его нет
        const { data, error } = await supabase
          .from('profile')
          .insert([{ ...profileData, updated_at: new Date().toISOString() }])
          .select()
        
        if (error) throw error
        return data && data.length > 0 ? data[0] : null
      }
    } catch (error) {
      console.error('Ошибка обновления профиля:', error)
      throw error
    }
  }

  // Получение About Me
  async getAboutMe() {
    try {
      const { data, error } = await supabase
        .from('about_me')
        .select('*')
        .limit(1)
      
      if (error) throw error
      return data && data.length > 0 ? data[0] : null
    } catch (error) {
      console.error('Ошибка получения About Me:', error)
      return null
    }
  }

  // Обновление About Me
  async updateAboutMe(aboutMeData) {
    try {
      // Сначала получаем существующую запись чтобы узнать её id
      const existingAboutMe = await this.getAboutMe()
      
      if (existingAboutMe && existingAboutMe.id) {
        // Обновляем существующую запись
        const { data, error } = await supabase
          .from('about_me')
          .update({ ...aboutMeData, updated_at: new Date().toISOString() })
          .eq('id', existingAboutMe.id)
          .select()
        
        if (error) throw error
        return data && data.length > 0 ? data[0] : null
      } else {
        // Создаём новую запись если её нет
        const { data, error } = await supabase
          .from('about_me')
          .insert([{ ...aboutMeData, updated_at: new Date().toISOString() }])
          .select()
        
        if (error) throw error
        return data && data.length > 0 ? data[0] : null
      }
    } catch (error) {
      console.error('Ошибка обновления About Me:', error)
      throw error
    }
  }

  // Получение настроек сайта
  async getSiteSettings() {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .limit(1)
      
      if (error) throw error
      return data && data.length > 0 ? data[0] : null
    } catch (error) {
      console.error('Ошибка получения настроек сайта:', error)
      return null
    }
  }

  // Обновление настроек сайта
  async updateSiteSettings(settingsData) {
    try {
      // Сначала получаем существующие настройки чтобы узнать их id
      const existingSettings = await this.getSiteSettings()
      
      if (existingSettings && existingSettings.id) {
        // Обновляем существующие настройки
        const { data, error } = await supabase
          .from('site_settings')
          .update({ ...settingsData, updated_at: new Date().toISOString() })
          .eq('id', existingSettings.id)
          .select()
        
        if (error) throw error
        return data && data.length > 0 ? data[0] : null
      } else {
        // Создаём новые настройки если их нет
        const { data, error } = await supabase
          .from('site_settings')
          .insert([{ ...settingsData, updated_at: new Date().toISOString() }])
          .select()
        
        if (error) throw error
        return data && data.length > 0 ? data[0] : null
      }
    } catch (error) {
      console.error('Ошибка обновления настроек сайта:', error)
      throw error
    }
  }

  // Генерация slug для поста
  generateSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  // Экспорт данных
  async exportData() {
    try {
      const [profile, aboutMe, siteSettings, posts] = await Promise.all([
        this.getProfile(),
        this.getAboutMe(),
        this.getSiteSettings(),
        this.getAllPosts()
      ])
      
      return {
        profile,
        aboutMe,
        siteSettings,
        posts
      }
    } catch (error) {
      console.error('Ошибка экспорта данных:', error)
      throw error
    }
  }

  // Импорт данных
  async importData(data) {
    try {
      if (data.profile) {
        await this.updateProfile(data.profile)
      }
      
      if (data.aboutMe) {
        await this.updateAboutMe(data.aboutMe)
      }
      
      if (data.siteSettings) {
        await this.updateSiteSettings(data.siteSettings)
      }
      
      if (data.posts && Array.isArray(data.posts)) {
        for (const post of data.posts) {
          await this.createPost(post)
        }
      }
      
      console.log('Данные успешно импортированы')
      return true
    } catch (error) {
      console.error('Ошибка импорта данных:', error)
      throw error
    }
  }

  // ===== МЕТОДЫ ДЛЯ РАБОТЫ С ИЗОБРАЖЕНИЯМИ =====

  // Загрузка изображения в Supabase Storage
  async uploadImage(file, folder = 'blog-images') {
    try {
      // Проверяем тип файла
      if (!file.type.startsWith('image/')) {
        throw new Error('Файл должен быть изображением')
      }
      
      // Проверяем размер файла (максимум 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Размер файла не должен превышать 5MB')
      }
      
      // Генерируем уникальное имя файла
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${folder}/${fileName}`
      
      // Загружаем файл в Supabase Storage
      const { error } = await supabase.storage
        .from('images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })
      
      if (error) {
        console.error('SupabaseService: Ошибка загрузки изображения:', error)
        throw error
      }
      
      // Получаем публичную ссылку на изображение
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath)
      
      return {
        url: publicUrl,
        path: filePath,
        fileName: fileName,
        size: file.size,
        type: file.type
      }
    } catch (error) {
      console.error('SupabaseService: Ошибка загрузки изображения:', error)
      throw error
    }
  }

  // Загрузка видео в Supabase Storage
  async uploadVideo(file, folder = 'blog-videos') {
    try {
      // Проверяем тип файла
      if (!file.type.startsWith('video/')) {
        throw new Error('Файл должен быть видео')
      }
      
      // Проверяем размер файла (максимум 50MB)
      if (file.size > 50 * 1024 * 1024) {
        throw new Error('Размер файла не должен превышать 50MB')
      }
      
      // Проверяем расширение файла
      const allowedExtensions = ['mp4', 'webm', 'avi', 'mov', 'mkv', 'm4v']
      const fileExtension = file.name.split('.').pop().toLowerCase()
      
      if (!allowedExtensions.includes(fileExtension)) {
        throw new Error('Неподдерживаемый формат видео. Используйте: MP4, WebM, AVI, MOV, MKV, M4V')
      }
      
      // Генерируем уникальное имя файла
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`
      const filePath = `${folder}/${fileName}`
      
      // Загружаем файл в Supabase Storage
      const { error } = await supabase.storage
        .from('videos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })
      
      if (error) {
        console.error('SupabaseService: Ошибка загрузки видео:', error)
        
        // Проверяем специфические ошибки
        if (error.message && error.message.includes('bucket')) {
          throw new Error('Ошибка доступа к хранилищу видео. Проверьте настройки Supabase Storage.')
        } else if (error.message && error.message.includes('permission')) {
          throw new Error('Ошибка прав доступа. Проверьте настройки Storage.')
        } else {
          throw new Error(`Ошибка загрузки видео: ${error.message}`)
        }
      }
      
             // Получаем публичную ссылку на видео
       const { data: { publicUrl } } = supabase.storage
         .from('videos')
         .getPublicUrl(filePath)
      
      return {
        url: publicUrl,
        path: filePath,
        fileName: fileName,
        size: file.size,
        type: file.type,
        name: file.name
      }
    } catch (error) {
      console.error('SupabaseService: Ошибка загрузки видео:', error)
      throw error
    }
  }

  // Удаление изображения из Supabase Storage
  async deleteImage(filePath) {
    try {
      const { error } = await supabase.storage
        .from('images')
        .remove([filePath])
      
      if (error) {
        console.error('SupabaseService: Ошибка удаления изображения:', error)
        throw error
      }
      
      return true
    } catch (error) {
      console.error('SupabaseService: Ошибка удаления изображения:', error)
      throw error
    }
  }

  // Удаление видео из Supabase Storage
  async deleteVideo(filePath) {
    try {
      const { error } = await supabase.storage
        .from('videos')
        .remove([filePath])
      
      if (error) {
        console.error('SupabaseService: Ошибка удаления видео:', error)
        throw error
      }
      
      return true
    } catch (error) {
      console.error('SupabaseService: Ошибка удаления видео:', error)
      throw error
    }
  }

  // Получение списка изображений из папки
  async getImages(folder = 'blog-images') {
    try {
      const { data, error } = await supabase.storage
        .from('images')
        .list(folder, {
          limit: 100,
          offset: 0
        })
      
      if (error) {
        console.error('SupabaseService: Ошибка получения списка изображений:', error)
        throw error
      }
      
      // Формируем полные URL для каждого изображения
      const images = data.map(file => {
        const { data: { publicUrl } } = supabase.storage
          .from('images')
          .getPublicUrl(`${folder}/${file.name}`)
        
        return {
          name: file.name,
          url: publicUrl,
          path: `${folder}/${file.name}`,
          size: file.metadata?.size || 0,
          type: file.metadata?.mimetype || 'image/*',
          created_at: file.created_at
        }
      })
      
      return images
    } catch (error) {
      console.error('SupabaseService: Ошибка получения списка изображений:', error)
      return []
    }
  }

  // Получение списка видео из папки
  async getVideos(folder = 'blog-videos') {
    try {
      console.log('SupabaseService: Получаем список видео из папки:', folder)
      
      const { data, error } = await supabase.storage
        .from('videos')
        .list(folder, {
          limit: 100,
          offset: 0
        })
      
      if (error) {
        console.error('SupabaseService: Ошибка получения списка видео:', error)
        
        // Проверяем специфические ошибки
        if (error.message && error.message.includes('bucket')) {
          throw new Error('Ошибка доступа к хранилищу видео. Проверьте настройки Supabase Storage.')
        } else if (error.message && error.message.includes('permission')) {
          throw new Error('Ошибка прав доступа. Проверьте настройки Storage.')
        } else {
          throw error
        }
      }
      
      if (!data || data.length === 0) {
        console.log('SupabaseService: Видео не найдены в папке:', folder)
        return []
      }
      
      // Формируем полные URL для каждого видео
      const videos = data.map(file => {
        const { data: { publicUrl } } = supabase.storage
          .from('videos')
          .getPublicUrl(`${folder}/${file.name}`)
        
        return {
          name: file.name,
          url: publicUrl,
          path: `${folder}/${file.name}`,
          size: file.metadata?.size || 0,
          type: file.metadata?.mimetype || 'video/*',
          created_at: file.created_at
        }
      })
      
      console.log('SupabaseService: Получено видео:', videos.length)
      return videos
    } catch (error) {
      console.error('SupabaseService: Ошибка получения списка видео:', error)
      throw error
    }
  }

  // Создание bucket для изображений (если не существует)
  async createImagesBucket() {
    try {
      // Проверяем существование bucket
      const { data: buckets, error: listError } = await supabase.storage.listBuckets()
      
      if (listError) {
        console.warn('Не удалось проверить buckets:', listError.message)
        return false
      }
      
      const imagesBucket = buckets.find(bucket => bucket.name === 'images')
      
      if (!imagesBucket) {
        // Создаем bucket
        const { error: createError } = await supabase.storage.createBucket('images', {
          public: true,
          allowedMimeTypes: ['image/*'],
          fileSizeLimit: 5242880 // 5MB
        })
        
        if (createError) {
          console.warn('Не удалось создать bucket images:', createError.message)
          return false
        }
        
        console.log('✅ Bucket "images" создан')
      }
      
      return true
    } catch (error) {
      console.warn('Ошибка при создании bucket images:', error.message)
      return false
    }
  }

  // Создание bucket для аватарок (если не существует)
  async createAvatarsBucket() {
    try {
      // Проверяем существование bucket
      const { data: buckets, error: listError } = await supabase.storage.listBuckets()
      
      if (listError) {
        console.warn('Не удалось проверить buckets:', listError.message)
        return false
      }
      
      const avatarsBucket = buckets.find(bucket => bucket.name === 'avatars')
      
      if (!avatarsBucket) {
        // Создаем bucket
        const { error: createError } = await supabase.storage.createBucket('avatars', {
          public: true,
          allowedMimeTypes: ['image/*'],
          fileSizeLimit: 2097152 // 2MB для аватарок
        })
        
        if (createError) {
          console.warn('Не удалось создать bucket avatars:', createError.message)
          return false
        }
        
        console.log('✅ Bucket "avatars" создан')
      }
      
      return true
    } catch (error) {
      console.warn('Ошибка при создании bucket avatars:', error.message)
      return false
    }
  }

  // Создание bucket для видео (если не существует)
  async createVideosBucket() {
    try {
      // Проверяем существование bucket
      const { data: buckets, error: listError } = await supabase.storage.listBuckets()
      
      if (listError) {
        console.warn('Не удалось проверить buckets:', listError.message)
        return false
      }
      
      const videosBucket = buckets.find(bucket => bucket.name === 'videos')
      
      if (!videosBucket) {
        // Создаем bucket
        const { error: createError } = await supabase.storage.createBucket('videos', {
          public: true,
          allowedMimeTypes: ['video/*'],
          fileSizeLimit: 52428800 // 50MB
        })
        
        if (createError) {
          console.warn('Не удалось создать bucket videos:', createError.message)
          return false
        }
        
        console.log('✅ Bucket "videos" создан')
      }
      
      return true
    } catch (error) {
      console.warn('Ошибка при создании bucket videos:', error.message)
      return false
    }
  }

  // Очистка всех данных
  async clearAllData() {
    try {
      await supabase.from('comments').delete().neq('id', 0)
      await supabase.from('posts').delete().neq('id', 0)
      await supabase.from('about_me').delete().neq('id', 0)
      await supabase.from('site_settings').delete().neq('id', 0)
      await supabase.from('profile').delete().neq('id', 0)
      
      console.log('Все данные очищены')
      return true
    } catch (error) {
      console.error('Ошибка очистки данных:', error)
      throw error
    }
  }

  // ===== МЕТОДЫ ДЛЯ РАБОТЫ С ПРОЕКТАМИ =====

  // Получение всех проектов
  async getAllProjects() {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Ошибка получения проектов:', error)
      return []
    }
  }

  // Получение активных проектов
  async getActiveProjects() {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('status', 'active')
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Ошибка получения активных проектов:', error)
      return []
    }
  }

  // Получение проекта по ID
  async getProjectById(id) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Ошибка получения проекта:', error)
      return null
    }
  }

  // Создание проекта
  async createProject(projectData) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([projectData])
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Ошибка создания проекта:', error)
      throw error
    }
  }

  // Обновление проекта
  async updateProject(id, projectData) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .update({ ...projectData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Ошибка обновления проекта:', error)
      throw error
    }
  }

  // Удаление проекта
  async deleteProject(id) {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      return true
    } catch (error) {
      console.error('Ошибка удаления проекта:', error)
      throw error
    }
  }

  // Увеличение счетчика просмотров поста
  async incrementPostViews(postId) {
    try {
      const { error } = await supabase.rpc('increment_post_views', {
        post_id_param: postId
      })
      
      if (error) throw error
      return true
    } catch (error) {
      console.error('Ошибка увеличения просмотров:', error)
      return false
    }
  }

  // ==================== MEDIA FUNCTIONS ====================

  // Получить список изображений из storage
  async getImages() {
    try {
      const { data, error } = await supabase
        .storage
        .from('images')
        .list('blog-images', {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' }
        })

      if (error) throw error

      // Формируем полные URL для изображений
      const images = data.map(file => ({
        name: file.name,
        path: `blog-images/${file.name}`,
        url: `${supabase.storage.from('images').getPublicUrl(`blog-images/${file.name}`).data.publicUrl}`,
        size: file.metadata?.size || 0,
        type: file.metadata?.mimetype || 'image/*',
        created_at: file.created_at
      }))

      console.log('Image loaded successfully:', images[0]?.url)
      return images
    } catch (error) {
      console.error('Ошибка загрузки изображений:', error)
      throw error
    }
  }

  // Получить список видео из storage
  async getVideos() {
    try {
      const { data, error } = await supabase
        .storage
        .from('videos')
        .list('blog-videos', {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' }
        })

      if (error) throw error

      // Формируем полные URL для видео
      const videos = data.map(file => ({
        name: file.name,
        path: `blog-videos/${file.name}`,
        url: `${supabase.storage.from('videos').getPublicUrl(`blog-videos/${file.name}`).data.publicUrl}`,
        size: file.metadata?.size || 0,
        type: file.metadata?.mimetype || 'video/*',
        created_at: file.created_at
      }))

      return videos
    } catch (error) {
      console.error('Ошибка загрузки видео:', error)
      throw error
    }
  }

  // Загрузить изображение
  async uploadImage(file) {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `blog-images/${fileName}`

      const { data, error } = await supabase.storage
        .from('images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath)

      return {
        path: filePath,
        url: publicUrl,
        name: fileName,
        fullUrl: publicUrl
      }
    } catch (error) {
      console.error('Ошибка загрузки изображения:', error)
      throw error
    }
  }

  // Загрузить видео
  async uploadVideo(file) {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `blog-videos/${fileName}`

      const { data, error } = await supabase.storage
        .from('videos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(filePath)

      return {
        path: filePath,
        url: publicUrl,
        name: fileName,
        fullUrl: publicUrl
      }
    } catch (error) {
      console.error('Ошибка загрузки видео:', error)
      throw error
    }
  }

  // Удалить изображение
  async deleteImage(path) {
    try {
      const { error } = await supabase.storage
        .from('images')
        .remove([path])

      if (error) throw error
      return true
    } catch (error) {
      console.error('Ошибка удаления изображения:', error)
      throw error
    }
  }

  // Удалить видео
  async deleteVideo(path) {
    try {
      const { error } = await supabase.storage
        .from('videos')
        .remove([path])

      if (error) throw error
      return true
    } catch (error) {
      console.error('Ошибка удаления видео:', error)
      throw error
    }
  }
}

// Создаем единственный экземпляр сервиса
const supabaseService = new SupabaseService()

export default supabaseService