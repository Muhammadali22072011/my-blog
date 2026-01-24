// Автоматическая генерация SEO данных для постов
import { extractKeywords, generateMetaDescription } from './seoKeywordExtractor'

/**
 * Автоматически генерирует SEO данные для поста
 * @param {Object} post - Объект поста с полями title, content, excerpt
 * @returns {Object} - Объект с SEO полями
 */
export const generateAutoSEO = (post) => {
  try {
    // Извлекаем БОЛЬШЕ ключевых слов из контента (50 вместо 10)
    const keywords = extractKeywords(post.content || '', 50)
    
    // Генерируем мета-описание
    const metaDescription = generateMetaDescription(
      post.content || post.excerpt || '', 
      160
    )
    
    // Создаем SEO заголовок (первые 60 символов заголовка)
    let seoTitle = post.title || 'Untitled'
    if (seoTitle.length > 60) {
      seoTitle = seoTitle.substring(0, 57) + '...'
    }
    
    // МАКСИМАЛЬНЫЙ список ключевых слов для SEO
    const enhancedKeywords = [
      // Основные ключевые слова
      'Мухаммадали Иззатуллаев',
      'Muhammadali Izzatullaev',
      'Muhammad Ali Izzatullaev',
      
      // Локация
      'IT блог Навои',
      'Навои Узбекистан',
      'Navoiy Uzbekistan',
      'IT Navoiy',
      'Навоий',
      'Zarafshan',
      'Зарафшан',
      
      // Программирование общее
      'программирование',
      'разработка',
      'coding',
      'programming',
      'software development',
      'веб-разработка',
      'web development',
      
      // Frontend
      'frontend',
      'фронтенд',
      'frontend developer',
      'фронтенд разработчик',
      'HTML',
      'CSS',
      'JavaScript',
      'TypeScript',
      'React',
      'React.js',
      'Vue',
      'Vue.js',
      'Angular',
      'Next.js',
      'Nuxt.js',
      'Svelte',
      
      // Backend
      'backend',
      'бэкенд',
      'Node.js',
      'Express',
      'Python',
      'Django',
      'Flask',
      'PHP',
      'Laravel',
      
      // Базы данных
      'database',
      'база данных',
      'SQL',
      'PostgreSQL',
      'MySQL',
      'MongoDB',
      'Supabase',
      'Firebase',
      
      // Инструменты
      'Git',
      'GitHub',
      'VS Code',
      'Docker',
      'API',
      'REST API',
      'GraphQL',
      
      // Темы
      'tutorial',
      'туториал',
      'обучение',
      'курс',
      'гайд',
      'guide',
      'how to',
      'как сделать',
      'tips',
      'советы',
      'best practices',
      'лучшие практики',
      
      // IT общее
      'IT специалист',
      'IT professional',
      'software engineer',
      'инженер программист',
      'developer',
      'разработчик',
      'programmer',
      'программист',
      
      // Узбекистан IT
      'IT Узбекистан',
      'IT Uzbekistan',
      'Uzbek developer',
      'узбекский программист',
      'Central Asia IT',
      'Центральная Азия IT',
      
      // Образование
      'IT образование',
      'IT education',
      'learn programming',
      'изучение программирования',
      'coding bootcamp',
      'онлайн курсы',
      'online courses',
      
      // Технологии
      'tech blog',
      'технологии',
      'technology',
      'innovation',
      'инновации',
      'AI',
      'machine learning',
      'искусственный интеллект',
      
      // Карьера
      'IT карьера',
      'IT career',
      'junior developer',
      'senior developer',
      'tech jobs',
      'вакансии IT',
      
      // Проекты
      'pet project',
      'portfolio',
      'портфолио',
      'open source',
      'GitHub projects',
      
      // Дополнительные из контента
      ...keywords
    ]
    
    // Убираем дубликаты и пустые значения
    const uniqueKeywords = [...new Set(enhancedKeywords.filter(k => k && k.trim()))]
    
    return {
      seo_title: seoTitle,
      seo_description: metaDescription,
      seo_keywords: uniqueKeywords,
      canonical_url: null // Будет установлен после создания поста с ID
    }
  } catch (error) {
    console.error('Ошибка генерации Auto-SEO:', error)
    
    // Возвращаем базовые SEO данные в случае ошибки
    return {
      seo_title: post.title || 'Untitled',
      seo_description: post.excerpt || 'Blog post',
      seo_keywords: [
        'Мухаммадали Иззатуллаев',
        'IT блог',
        'Навои Узбекистан',
        'программирование'
      ],
      canonical_url: null
    }
  }
}

/**
 * Обновляет canonical URL после создания поста
 * @param {string} postId - ID поста
 * @param {string} baseUrl - Базовый URL сайта (по умолчанию izzatullaev.uz)
 * @returns {string} - Canonical URL
 */
export const generateCanonicalUrl = (postId, baseUrl = 'https://izzatullaev.uz') => {
  return `${baseUrl}/post/${postId}`
}

/**
 * Проверяет нужно ли обновить SEO данные
 * @param {Object} post - Объект поста
 * @returns {boolean} - true если нужно обновить
 */
export const needsSEOUpdate = (post) => {
  // Проверяем есть ли уже SEO данные
  if (!post.seo_title || !post.seo_description || !post.seo_keywords) {
    return true
  }
  
  // Проверяем актуальность SEO данных
  // Если заголовок изменился, нужно обновить SEO
  if (post.seo_title && post.title && !post.seo_title.includes(post.title.substring(0, 20))) {
    return true
  }
  
  return false
}

export default {
  generateAutoSEO,
  generateCanonicalUrl,
  needsSEOUpdate
}
