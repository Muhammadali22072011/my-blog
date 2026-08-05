import { useState, useEffect } from 'react'
import supabaseService from '../services/SupabaseService'

function ImageGallery({ onImageSelect, className = '' }) {
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedImage, setSelectedImage] = useState(null)

  useEffect(() => {
    loadImages()
  }, [])

  const loadImages = async () => {
    try {
      console.log('🎬 [ImageGallery] Начинаем загрузку изображений...')
      setLoading(true)
      setError('')
      
      const imagesList = await supabaseService.getImages()
      console.log('📸 [ImageGallery] Получено изображений:', imagesList?.length || 0)
      console.log('📋 [ImageGallery] Список изображений:', imagesList)
      
      setImages(imagesList)
      console.log('✅ [ImageGallery] Изображения установлены в state')
    } catch (error) {
      console.error('❌ [ImageGallery] Ошибка загрузки:', error)
      console.error('📍 [ImageGallery] Stack trace:', error.stack)
      setError('Не удалось загрузить изображения: ' + error.message)
    } finally {
      setLoading(false)
      console.log('🏁 [ImageGallery] Загрузка завершена')
    }
  }

  const handleImageClick = (image) => {
    setSelectedImage(image)
    if (onImageSelect) {
      onImageSelect(image)
    }
  }

  const handleDeleteImage = async (image) => {
    if (!confirm('Вы уверены, что хотите удалить это изображение?')) {
      return
    }

    try {
      await supabaseService.deleteImage(image.path)
      
      // Обновляем список изображений
      setImages(prev => prev.filter(img => img.path !== image.path))
      
      // Если удаляем выбранное изображение, сбрасываем выбор
      if (selectedImage && selectedImage.path === image.path) {
        setSelectedImage(null)
      }
    } catch (error) {
      console.error('Ошибка удаления изображения:', error)
      alert('Не удалось удалить изображение')
    }
  }

  const refreshImages = () => {
    loadImages()
  }

  if (loading) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Загружаем изображения...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-terra text-4xl mb-4">⚠️</div>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={refreshImages}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Попробовать снова
        </button>
      </div>
    )
  }

  if (images.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-gray-400 text-4xl mb-4">🖼️</div>
        <p className="text-gray-600 mb-2">Изображения не найдены</p>
        <p className="text-gray-500 text-sm">Загрузите первое изображение, чтобы начать</p>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Заголовок и кнопка обновления */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          Галерея изображений ({images.length})
        </h3>
        <button
          onClick={refreshImages}
          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Обновить
        </button>
      </div>

      {/* Сетка изображений */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image, index) => {
          console.log(`🖼️ [ImageGallery] Рендерим изображение ${index + 1}:`, {
            name: image.name,
            url: image.url,
            path: image.path,
            size: image.size,
            type: image.type
          })
          
          return (
            <div
              key={image.path}
              className="relative cursor-pointer rounded-lg border-2 border-gray-200 hover:border-blue-300 p-2 bg-white"
              style={{ minHeight: '150px' }}
              onClick={() => handleImageClick(image)}
            >
              {/* Copy URL Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  navigator.clipboard.writeText(image.url)
                  alert('✅ URL copied to clipboard!\n\nNow paste it in Featured Image field')
                }}
                className="absolute top-3 right-3 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-xs font-medium z-10 flex items-center gap-1"
                title="Copy URL"
              >
                📋 Copy URL
              </button>
              
              {/* Изображение */}
              <img
                src={image.url}
                alt={image.name}
                style={{ 
                  width: '100%', 
                  height: '120px',
                  objectFit: 'contain',
                  display: 'block'
                }}
                onLoad={(e) => {
                  console.log('✅ [ImageGallery] Изображение загружено:', image.name)
                  console.log('📐 [ImageGallery] Размеры:', {
                    naturalWidth: e.target.naturalWidth,
                    naturalHeight: e.target.naturalHeight,
                    displayWidth: e.target.width,
                    displayHeight: e.target.height,
                    complete: e.target.complete,
                    src: e.target.src
                  })
                  // Проверяем что изображение действительно видимо
                  if (e.target.naturalWidth === 0 || e.target.naturalHeight === 0) {
                    console.error('⚠️ [ImageGallery] Изображение загружено но имеет нулевые размеры!')
                  }
                }}
                onError={(e) => {
                  const errorDetails = {
                    name: image.name,
                    url: image.url,
                    path: image.path,
                    size: image.size,
                    type: image.type,
                    errorType: e.type,
                    errorTarget: e.target.src
                  }
                  console.error('❌ [ImageGallery] Ошибка загрузки изображения:', errorDetails)
                  console.error(`🔴 ПРОБЛЕМНОЕ ИЗОБРАЖЕНИЕ: ${image.name}`)
                  console.error(`🔗 URL: ${image.url}`)
                  console.error('💡 Попробуй открыть этот URL в браузере чтобы увидеть ошибку')
                }}
              />
            
            {/* Информация */}
            <div className="mt-2">
              <p className="text-xs text-gray-600 truncate">{image.name}</p>
              <p className="text-xs text-gray-400">{(image.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>

            {/* Кнопка удаления */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleDeleteImage(image)
              }}
              className="absolute top-2 right-2 w-6 h-6 bg-terra text-white rounded-full hover:bg-terra"
              title="Удалить изображение"
            >
              ×
            </button>

            {/* Индикатор выбора */}
            {selectedImage?.path === image.path && (
              <div className="absolute top-2 left-2 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center">
                ✓
              </div>
            )}
          </div>
        )})}
      </div>

      {/* Информация о выбранном изображении */}
      {selectedImage && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Выбранное изображение:</h4>
          <div className="flex items-center space-x-4">
            <img
              src={selectedImage.url}
              alt={selectedImage.name}
              className="w-16 h-16 object-cover rounded-lg"
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-800">{selectedImage.name}</p>
              <p className="text-xs text-blue-600">
                Размер: {(selectedImage.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <p className="text-xs text-blue-600">
                Тип: {selectedImage.type}
              </p>
            </div>
            <button
              onClick={() => setSelectedImage(null)}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Отменить выбор
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ImageGallery
