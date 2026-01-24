// ============================================
// ПРИМЕР ИНТЕГРАЦИИ AUTO-SEO В DataContext
// ============================================

// Найди функцию addPost в src/context/DataContext.jsx
// И замени её на эту версию:

const addPost = async (postData) => {
  try {
    console.log('📝 Создание нового поста...')
    
    // ✨ АВТОМАТИЧЕСКАЯ ГЕНЕРАЦИЯ SEO
    const { generateAutoSEO, generateCanonicalUrl } = await import('../utils/autoSEO')
    const seoData = generateAutoSEO(postData)
    
    console.log('🚀 Auto-SEO данные сгенерированы:', {
      seo_title: seoData.seo_title,
      seo_description: seoData.seo_description?.substring(0, 50) + '...',
      keywords_count: seoData.seo_keywords?.length
    })
    
    // Объединяем пост с SEO данными
    const postWithSEO = {
      ...postData,
      ...seoData
    }
    
    // Создаем пост в базе данных
    const newPost = await supabaseService.createPost(postWithSEO)
    
    if (!newPost) {
      throw new Error('Failed to create post')
    }
    
    console.log('✅ Пост создан с ID:', newPost.id)
    
    // Обновляем canonical URL после создания (теперь есть ID)
    if (newPost.id) {
      const canonicalUrl = generateCanonicalUrl(newPost.id)
      await supabaseService.updatePost(newPost.id, { 
        canonical_url: canonicalUrl 
      })
      console.log('🔗 Canonical URL обновлен:', canonicalUrl)
    }
    
    // Обновляем локальное состояние
    setPosts(prevPosts => [newPost, ...prevPosts])
    
    return newPost
  } catch (error) {
    console.error('❌ Ошибка создания поста:', error)
    throw error
  }
}

// ============================================
// ПРИМЕР ИНТЕГРАЦИИ AUTO-SEO В Admin.jsx
// ============================================

// Найди функцию handleSubmit в src/pages/Admin.jsx
// И добавь эти строки:

const handleSubmit = async (e) => {
  e.preventDefault()

  if (!postData.content.trim()) {
    alert(t.pleaseFillContent)
    return
  }

  // Извлекаем title и excerpt из Markdown
  const lines = postData.content.split('\n')
  let title = ''
  let excerpt = ''

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('# ')) {
      title = lines[i].substring(2).trim()
      let excerptLines = []
      for (let j = i + 1; j < lines.length && excerptLines.length < 3; j++) {
        const line = lines[j].trim()
        if (line && !line.startsWith('#')) {
          const cleanLine = line
            .replace(/\+\+(.*?)\+\+/g, '$1')
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1')
            .replace(/`(.*?)`/g, '$1')
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
          excerptLines.push(cleanLine)
        } else if (line.startsWith('#')) {
          break
        }
      }
      excerpt = excerptLines.join(' ').trim()
      break
    }
  }

  // ✨ АВТОМАТИЧЕСКАЯ ГЕНЕРАЦИЯ SEO
  const { generateAutoSEO, generateCanonicalUrl } = await import('../utils/autoSEO')
  const seoData = generateAutoSEO({
    title: title || t.noTitle,
    content: postData.content,
    excerpt: excerpt || t.noDescription,
    category: postData.category
  })

  console.log('🚀 Auto-SEO данные:', seoData)

  // Создаем пост с SEO данными
  const newPost = {
    ...postData,
    ...seoData,  // ← Добавляем SEO данные
    title: title || t.noTitle,
    excerpt: excerpt || t.noDescription,
    status: 'published'
  }

  try {
    // Создаем пост
    const result = await addPost(newPost)

    // Обновляем canonical URL
    if (result && result.id) {
      const canonicalUrl = generateCanonicalUrl(result.id)
      await updatePost(result.id, { canonical_url: canonicalUrl })
      console.log('🔗 Canonical URL:', canonicalUrl)
    }

    // Очищаем форму
    setPostData({
      title: '',
      content: '',
      excerpt: '',
      category: 'blog',
      status: 'published'
    })

    // Показываем уведомление
    setSuccessMessage('✅ Пост создан с Auto-SEO!')
    setShowSuccessMessage(true)
    setTimeout(() => setShowSuccessMessage(false), 3000)
  } catch (error) {
    alert('Error adding post: ' + error.message)
  }
}

// ============================================
// ГОТОВО! 🎉
// ============================================

// Теперь при создании каждого поста автоматически генерируется:
// ✅ SEO заголовок
// ✅ SEO описание
// ✅ Ключевые слова (включая "Мухаммадали Иззатуллаев", "IT Навои", "Узбекистан")
// ✅ Canonical URL

// Проверь в консоли браузера (F12) сообщения:
// 🚀 Auto-SEO данные сгенерированы
// ✅ Пост создан с ID: ...
// 🔗 Canonical URL обновлен: ...
