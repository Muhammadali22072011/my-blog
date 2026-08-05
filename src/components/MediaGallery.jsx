// ============================================================================
// MEDIA GALLERY COMPONENT
// Галерея загруженных медиа-файлов
// ============================================================================
import { useState, useEffect } from 'react'
import supabaseService from '../services/SupabaseService'
import CustomVideoPlayer from './CustomVideoPlayer'

function MediaGallery({ onSelectMedia }) {
  const [images, setImages] = useState([])
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('images')
  const [selectedItem, setSelectedItem] = useState(null)

  useEffect(() => {
    loadMedia()
  }, [])

  const loadMedia = async () => {
    setLoading(true)
    try {
      const [imagesData, videosData] = await Promise.all([
        supabaseService.getImages('blog-images'),
        supabaseService.getVideos('blog-videos')
      ])
      setImages(imagesData)
      setVideos(videosData)
    } catch (error) {
      console.error('Ошибка загрузки медиа:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectItem = (item) => {
    setSelectedItem(item)
    if (onSelectMedia) {
      onSelectMedia(item)
    }
  }

  const handleDelete = async (item, type) => {
    if (!window.confirm('Удалить этот файл?')) return

    try {
      if (type === 'image') {
        await supabaseService.deleteImage(item.path)
      } else {
        await supabaseService.deleteVideo(item.path)
      }
      await loadMedia()
    } catch (error) {
      console.error('Ошибка удаления:', error)
      alert('Ошибка удаления файла: ' + error.message)
    }
  }

  const copyToClipboard = (url) => {
    navigator.clipboard.writeText(url)
    alert('URL скопирован в буфер обмена!')
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="media-gallery">
      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('images')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'images'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          📷 Изображения ({images.length})
        </button>
        <button
          onClick={() => setActiveTab('videos')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'videos'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          🎬 Видео ({videos.length})
        </button>
      </div>

      {/* Images Grid */}
      {activeTab === 'images' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500">
              Нет загруженных изображений
            </div>
          ) : (
            images.map((image, index) => (
              <div
                key={index}
                className="relative group bg-gray-100 rounded-lg overflow-hidden aspect-square cursor-pointer"
                onClick={() => handleSelectItem(image)}
              >
                <img
                  src={image.url}
                  alt={image.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        copyToClipboard(image.url)
                      }}
                      className="p-2 bg-white rounded-full hover:bg-gray-100"
                      title="Копировать URL"
                    >
                      📋
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(image, 'image')
                      }}
                      className="p-2 bg-terra text-white rounded-full hover:bg-terra"
                      title="Удалить"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="truncate">{image.name}</div>
                  <div>{formatFileSize(image.size)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Videos Grid */}
      {activeTab === 'videos' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {videos.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500">
              Нет загруженных видео
            </div>
          ) : (
            videos.map((video, index) => (
              <div
                key={index}
                className="relative group bg-gray-100 rounded-lg overflow-hidden"
              >
                <CustomVideoPlayer src={video.url} title={video.name} />
                <div className="p-3 bg-white border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{video.name}</div>
                      <div className="text-sm text-gray-500">{formatFileSize(video.size)}</div>
                    </div>
                    <div className="flex gap-2 ml-2">
                      <button
                        onClick={() => copyToClipboard(video.url)}
                        className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                        title="Копировать URL"
                      >
                        📋
                      </button>
                      <button
                        onClick={() => handleDelete(video, 'video')}
                        className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
                        title="Удалить"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Selected Item Info */}
      {selectedItem && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-blue-900">Выбрано: {selectedItem.name}</div>
              <div className="text-sm text-blue-700 font-mono">{selectedItem.url}</div>
            </div>
            <button
              onClick={() => setSelectedItem(null)}
              className="text-blue-600 hover:text-blue-800"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default MediaGallery
