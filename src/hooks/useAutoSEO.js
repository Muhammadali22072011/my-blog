import { useCallback } from 'react'
import { generateAutoSEO, generateCanonicalUrl } from '../utils/autoSEO'

/**
 * Хук для автоматической генерации SEO при создании/обновлении постов
 */
export const useAutoSEO = () => {
  
  /**
   * Добавляет SEO данные к посту перед сохранением
   * @param {Object} postData - Данные поста
   * @returns {Object} - Пост с SEO данными
   */
  const addAutoSEO = useCallback((postData) => {
    console.log('🚀 Auto-SEO: Генерация SEO данных для поста...')
    
    // Генерируем SEO данные
    const seoData = generateAutoSEO(postData)
    
    console.log('✅ Auto-SEO: SEO данные сгенерированы:', {
      title: seoData.seo_title,
      description: seoData.seo_description?.substring(0, 50) + '...',
      keywords: seoData.seo_keywords?.length
    })
    
    // Объединяем с исходными данными
    return {
      ...postData,
      ...seoData
    }
  }, [])
  
  /**
   * Обновляет canonical URL после создания поста
   * @param {string} postId - ID поста
   * @param {Function} updateFunction - Функция обновления поста
   */
  const updateCanonicalUrl = useCallback(async (postId, updateFunction) => {
    try {
      const canonicalUrl = generateCanonicalUrl(postId)
      
      console.log('🔗 Auto-SEO: Обновление canonical URL:', canonicalUrl)
      
      await updateFunction(postId, { canonical_url: canonicalUrl })
      
      console.log('✅ Auto-SEO: Canonical URL обновлен')
    } catch (error) {
      console.error('❌ Auto-SEO: Ошибка обновления canonical URL:', error)
    }
  }, [])
  
  return {
    addAutoSEO,
    updateCanonicalUrl
  }
}

export default useAutoSEO
