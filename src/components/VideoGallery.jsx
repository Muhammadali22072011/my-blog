import { useState, useEffect } from 'react'
import supabaseService from '../services/SupabaseService'

function VideoGallery({ onVideoSelect, className = '' }) {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadVideos()
  }, [])

  const loadVideos = async () => {
    try {
      setLoading(true)
      setError('')
      
      const videosList = await supabaseService.getVideos()
      
      setVideos(videosList)
    } catch (error) {
      console.error('VideoGallery: Ошибка загрузки видео:', error)
      setError('Не удалось загрузить видео. Проверьте подключение к интернету.')
    } finally {
      setLoading(false)
    }
  }

  const handleVideoClick = (video) => {
    setSelectedVideo(video)
    if (onVideoSelect) {
      onVideoSelect(video)
    }
  }

  const handleDeleteVideo = async (video) => {
    if (!confirm('Вы уверены, что хотите удалить это видео?')) {
      return
    }

    try {
      await supabaseService.deleteVideo(video.path)
      
      // Обновляем список видео
      setVideos(prev => prev.filter(vid => vid.path !== video.path))
      
      // Если удаляем выбранное видео, сбрасываем выбор
      if (selectedVideo && selectedVideo.path === video.path) {
        setSelectedVideo(null)
        if (onVideoSelect) {
          onVideoSelect(null)
        }
      }
    } catch (error) {
      console.error('VideoGallery: Ошибка удаления видео:', error)
      alert('Не удалось удалить видео. Попробуйте еще раз.')
    }
  }

  const refreshVideos = async () => {
    try {
      setRefreshing(true)
      await loadVideos()
    } finally {
      setRefreshing(false)
    }
  }

  if (loading) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Загружаем видео...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-red-500 text-4xl mb-4">⚠️</div>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={refreshVideos}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          disabled={refreshing}
        >
          {refreshing ? 'Обновляем...' : 'Попробовать снова'}
        </button>
      </div>
    )
  }

  if (videos.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-gray-400 text-4xl mb-4">🎥</div>
        <p className="text-gray-600 mb-2">Видео не найдены</p>
        <p className="text-gray-500 text-sm mb-4">Загрузите первое видео, чтобы начать</p>
        <button
          onClick={refreshVideos}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          disabled={refreshing}
        >
          {refreshing ? 'Обновляем...' : 'Обновить'}
        </button>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Заголовок и кнопка обновления */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          Галерея видео ({videos.length})
        </h3>
        <button
          onClick={refreshVideos}
          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          disabled={refreshing}
        >
          {refreshing ? 'Обновляем...' : 'Обновить'}
        </button>
      </div>

      {/* Сетка видео */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {videos.map((video) => (
          <div
            key={video.path}
            className={`
              relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-200
              ${selectedVideo?.path === video.path 
                ? 'border-blue-500 ring-2 ring-blue-200' 
                : 'border-gray-200 hover:border-blue-300'
              }
            `}
            onClick={() => handleVideoClick(video)}
          >
            {/* Видео превью */}
            <div className="relative w-full h-48 bg-gray-100">
              <video
                src={video.url}
                className="w-full h-full object-cover"
                preload="metadata"
                muted
                onError={(e) => {
                  console.warn('VideoGallery: Ошибка загрузки видео:', video.url)
                  e.target.style.display = 'none'
                }}
                onLoadStart={() => {
                  // Video loading started
                }}
                onLoadedMetadata={() => {
                  // Video loaded successfully
                }}
              />
              
              {/* Play button overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                  <div className="w-0 h-0 border-l-[12px] border-l-white border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent ml-1"></div>
                </div>
              </div>
            </div>
            
            {/* Overlay с информацией */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 pointer-events-none">
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="text-white text-center">
                  <p className="text-sm font-medium truncate px-2">
                    {video.name}
                  </p>
                  <p className="text-xs opacity-75">
                    {(video.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            </div>

            {/* Кнопка удаления */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleDeleteVideo(video)
              }}
              className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600 flex items-center justify-center"
              title="Удалить видео"
            >
              ×
            </button>

            {/* Индикатор выбора */}
            {selectedVideo?.path === video.path && (
              <div className="absolute top-2 left-2 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center">
                ✓
              </div>
            )}

            {/* Информация о видео */}
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

      {/* Информация о выбранном видео */}
      {selectedVideo && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Выбранное видео:</h4>
          <div className="flex items-center space-x-4">
            <div className="relative w-24 h-16 bg-gray-100 rounded-lg overflow-hidden">
              <video
                src={selectedVideo.url}
                className="w-full h-full object-cover"
                preload="metadata"
                muted
                onError={(e) => {
                  console.warn('VideoGallery: Ошибка загрузки превью:', selectedVideo.url)
                  e.target.style.display = 'none'
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-6 h-6 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                  <div className="w-0 h-0 border-l-[6px] border-l-white border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent ml-0.5"></div>
                </div>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-800">{selectedVideo.name}</p>
              <p className="text-xs text-blue-600">
                Размер: {(selectedVideo.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <p className="text-xs text-blue-600">
                Тип: {selectedVideo.type || 'video/*'}
              </p>
              <p className="text-xs text-blue-500 break-all">
                URL: {selectedVideo.url}
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedVideo(null)
                if (onVideoSelect) {
                  onVideoSelect(null)
                }
              }}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Отменить выбор
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default VideoGallery
