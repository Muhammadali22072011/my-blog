// Автоматическая генерация SEO данных для постов
import { extractKeywords, generateMetaDescription } from './seoKeywordExtractor'

/**
 * Автоматически генерирует SEO данные для поста
 * @param {Object} post - Объект поста с полями title, content, excerpt
 * @returns {Object} - Объект с SEO полями
 */
export const generateAutoSEO = (post) => {
  try {
    // Извлекаем ключевые слова из контента
    const keywords = extractKeywords(post.content || '', 10)
    
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
    
    // Добавляем важные ключевые слова для Узбекистана и IT
    const enhancedKeywords = [
      'Мухаммадали Иззатуллаев',
      'IT блог',
      'Навои Узбекистан',
      'программирование',
      ...keywords
    ]
    
    // Убираем дубликаты
    const uniqueKeywords = [...new Set(enhancedKeywords)]
    
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
