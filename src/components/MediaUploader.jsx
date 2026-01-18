// ============================================================================
// MEDIA UPLOADER COMPONENT
// Компонент для загрузки изображений и видео
// ============================================================================
import { useState } from 'react'
import supabaseService from '../services/SupabaseService'

function MediaUploader({ onMediaUploaded, type = 'both' }) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState(null)

  const handleFileSelect = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)
    setError(null)
    setUploadProgress(0)

    try {
      let result
      
      // Определяем тип файла
      if (file.type.startsWith('image/')) {
        // Загружаем изображение
        result = await supabaseService.uploadImage(file, 'blog-images')
      } else if (file.type.startsWith('video/')) {
        // Загружаем видео
        result = await supabaseService.uploadVideo(file, 'blog-videos')
      } else {
        throw new Error('Неподдерживаемый тип файла')
      }

      setUploadProgress(100)
      
      // Передаем результат родительскому компоненту
      if (onMediaUploaded) {
        onMediaUploaded(result)
      }

      // Очищаем input
      e.target.value = ''
      
      setTimeout(() => {
        setUploading(false)
        setUploadProgress(0)
      }, 1000)

    } catch (err) {
      console.error('Ошибка загрузки:', err)
      setError(err.message)
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const getAcceptTypes = () => {
    if (type === 'image') return 'image/*'
    if (type === 'video') return 'video/*'
    return 'image/*,video/*'
  }

  const getButtonText = () => {
    if (type === 'image') return '📷 Загрузить изображение'
    if (type === 'video') return '🎬 Загрузить видео'
    return '📁 Загрузить медиа'
  }

  return (
    <div className="media-uploader">
      <label className="cursor-pointer inline-block">
        <input
          type="file"
          accept={getAcceptTypes()}
          onChange={handleFileSelect}
          disabled={uploading}
          className="hidden"
        />
        <div className={`px-4 py-2 rounded-lg font-medium transition-all ${
          uploading 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}>
          {uploading ? '⏳ Загрузка...' : getButtonText()}
        </div>
      </label>

      {uploading && (
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          ❌ {error}
        </div>
      )}
    </div>
  )
}

export default MediaUploader
