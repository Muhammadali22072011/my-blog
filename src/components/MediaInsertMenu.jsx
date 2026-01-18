import { useState, useEffect } from 'react'
import supabaseService from '../services/SupabaseService'
import { translations } from '../translations'

function MediaInsertMenu({ onInsert, onClose }) {
  const [activeTab, setActiveTab] = useState('images')
  const [images, setImages] = useState([])
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadMedia()
  }, [activeTab])

  const loadMedia = async () => {
    try {
      setLoading(true)
      setError('')
      
      if (activeTab === 'images') {
        const imagesList = await supabaseService.getImages()
        setImages(imagesList)
      } else {
        const videosList = await supabaseService.getVideos()
        setVideos(videosList)
      }
    } catch (error) {
      console.error('MediaInsertMenu: Error loading media:', error)
      setError('Failed to load media files. Check your internet connection.')
    } finally {
      setLoading(false)
    }
  }

  const handleImageSelect = (image) => {
    // Создаем HTML для изображения с улучшенной обработкой ошибок
    const imageHtml = `<img src="${image.url}" alt="${image.name}" style="max-width: 100%; height: auto; margin: 10px 0;" onerror="this.style.display='none'; console.warn('Failed to load image:', '${image.url}');" onload="console.log('Image loaded successfully:', '${image.url}');" />`
    
    onInsert(imageHtml)
    onClose()
  }

  const handleVideoSelect = (video) => {
    // Создаем HTML для видео с улучшенной обработкой ошибок
    const videoHtml = `<video controls src="${video.url}" style="max-width: 100%; height: auto; margin: 10px 0;" onerror="this.style.display='none'; console.warn('Failed to load video:', '${video.url}');" onloadstart="console.log('Video loading started:', '${video.url}');" onloadedmetadata="console.log('Video loaded successfully:', '${video.url}');"></video>`
    
    onInsert(videoHtml)
    onClose()
  }

  const handleRefresh = () => {
    loadMedia()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Insert media file
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl transition-colors"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <nav className="flex space-x-8 px-4">
            <button
              onClick={() => setActiveTab('images')}
              className={`
                py-3 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === 'images'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              📷 Images ({images.length})
            </button>
            <button
              onClick={() => setActiveTab('videos')}
              className={`
                py-3 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === 'videos'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              🎥 Videos ({videos.length})
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Загружаем медиа файлы...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-500 text-4xl mb-4">⚠️</div>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Попробовать снова
              </button>
            </div>
          ) : activeTab === 'images' ? (
            <div>
              {images.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-4">🖼️</div>
                  <p className="text-gray-600 mb-2">Изображения не найдены</p>
                  <p className="text-gray-500 text-sm">
                    Загрузите изображения в Media Manager
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {images.map((image) => (
                    <div
                      key={image.path}
                      className="group cursor-pointer rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-300 transition-all duration-200"
                      onClick={() => handleImageSelect(image)}
                    >
                      <img
                        src={image.url}
                        alt={image.name}
                        className="w-full h-32 object-cover"
                        loading="lazy"
                        onError={(e) => {
                          console.warn('MediaInsertMenu: Error loading image:', image.url)
                          e.target.style.display = 'none'
                        }}
                      />
                      <div className="p-2 bg-white">
                        <p className="text-sm font-medium text-gray-900 truncate" title={image.name}>
                          {image.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(image.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              {videos.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-4">🎥</div>
                  <p className="text-gray-600 mb-2">No videos found</p>
                  <p className="text-gray-500 text-sm">
                    Upload videos in Media Manager
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {videos.map((video) => (
                    <div
                      key={video.path}
                      className="group cursor-pointer rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-300 transition-all duration-200"
                      onClick={() => handleVideoSelect(video)}
                    >
                      <div className="relative w-full h-48 bg-gray-100">
                        <video
                          src={video.url}
                          className="w-full h-full object-cover"
                          preload="metadata"
                          muted
                          onError={(e) => {
                            console.warn('MediaInsertMenu: Error loading video:', video.url)
                            e.target.style.display = 'none'
                          }}
                          onLoadStart={() => {
                            // Video loading started
                          }}
                          onLoadedMetadata={() => {
                            // Video loaded successfully
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-12 h-12 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                            <div className="w-0 h-0 border-l-[12px] border-l-white border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent ml-1"></div>
                          </div>
                        </div>
                      </div>
                      <div className="p-3 bg-white">
                        <p className="text-sm font-medium text-gray-900 truncate" title={video.name}>
                          {video.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(video.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <p className="text-xs text-gray-400">
                          {video.type || 'video/*'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            {activeTab === 'images' 
              ? `${translations.en.selectImageForInsert} (${images.length} ${translations.en.availableImages})`
              : `${translations.en.selectVideoForInsert} (${videos.length} ${translations.en.availableVideos})`
            }
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleRefresh}
              className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
            >
              Refresh
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MediaInsertMenu
