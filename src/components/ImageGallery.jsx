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
        <div className="text-red-500 text-4xl mb-4">⚠️</div>
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
              className={`
                relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-200
                ${selectedImage?.path === image.path 
                  ? 'border-blue-500 ring-2 ring-blue-200' 
                  : 'border-gray-200 hover:border-blue-300'
                }
              `}
              style={{ minHeight: '128px', backgroundColor: '#f3f4f6' }}
              onClick={() => handleImageClick(image)}
            >
              {/* Изображение */}
              <img
                src={image.url}
                alt={image.name}
                className="w-full h-32 object-cover"
                loading="lazy"
                style={{ display: 'block', minHeight: '128px' }}
                onLoad={(e) => {
                  console.log('✅ [ImageGallery] Изображение загружено:', image.name)
                  console.log('📐 [ImageGallery] Размеры:', {
                    width: e.target.naturalWidth,
                    height: e.target.naturalHeight,
                    displayWidth: e.target.width,
                    displayHeight: e.target.height
                  })
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
            
            {/* Overlay с информацией */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200">
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="text-white text-center">
                  <p className="text-sm font-medium truncate px-2">
                    {image.name}
                  </p>
                  <p className="text-xs opacity-75">
                    {(image.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            </div>

            {/* Кнопка удаления */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleDeleteImage(image)
              }}
              className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
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
