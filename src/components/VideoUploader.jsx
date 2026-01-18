import { useState, useRef } from 'react'
import supabaseService from '../services/SupabaseService'
import { translations } from '../translations'

function VideoUploader({ onVideoUploaded, className = '' }) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)

  const validateVideoFile = (file) => {
    // Проверяем тип файла
    if (!file.type.startsWith('video/')) {
      throw new Error(translations.en.pleaseSelectVideoFile)
    }

    // Проверяем размер файла (максимум 50MB)
    if (file.size > 50 * 1024 * 1024) {
      throw new Error(translations.en.fileSizeExceedsLimit)
    }

    // Проверяем расширение файла
    const allowedExtensions = ['mp4', 'webm', 'avi', 'mov', 'mkv', 'm4v']
    const fileExtension = file.name.split('.').pop().toLowerCase()
    
    if (!allowedExtensions.includes(fileExtension)) {
      throw new Error(translations.en.unsupportedVideoFormat)
    }

    return true
  }

  const handleFileSelect = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    await uploadVideo(file)
  }

  const uploadVideo = async (file) => {
    // Сброс состояний
    setError('')
    setSuccess('')
    setUploadProgress(0)

    try {
      // Валидация файла
      validateVideoFile(file)
      
      setIsUploading(true)
      setUploadProgress(10)
      
      // Загружаем видео через Supabase Service
      const result = await supabaseService.uploadVideo(file)
      
      setUploadProgress(100)
      setSuccess(translations.en.videoUploadedSuccessfully)
      
      // Вызываем callback с результатом загрузки
      if (onVideoUploaded) {
        onVideoUploaded(result)
      }
      
      // Очищаем input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
    } catch (error) {
      console.error('Ошибка загрузки видео:', error)
      setError(error.message || translations.en.errorUploadingVideo)
    } finally {
      setIsUploading(false)
      // Сбрасываем прогресс через 3 секунды
      setTimeout(() => setUploadProgress(0), 3000)
    }
  }

  const handleDragOver = (event) => {
    event.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (event) => {
    event.preventDefault()
    setDragActive(false)
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setDragActive(false)
    
    const files = event.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      uploadVideo(file)
    }
  }

  const openFileDialog = () => {
    if (!isUploading) {
      fileInputRef.current?.click()
    }
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Скрытый input для файлов */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,.mp4,.webm,.avi,.mov,.mkv,.m4v"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Drag & Drop зона */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200
          ${isUploading 
            ? 'border-gray-300 bg-gray-50 cursor-not-allowed' 
            : dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={!isUploading ? openFileDialog : undefined}
      >
        {isUploading ? (
          <div className="space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600">{translations.en.uploadingVideo}</p>
            {uploadProgress > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            )}
            <p className="text-xs text-gray-500">
              {translations.en.progress}: {uploadProgress}%
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-4xl text-gray-400">🎥</div>
            <div>
              <p className="text-lg font-medium text-gray-700">
                {translations.en.dragVideoHere}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {translations.en.supportedFormats}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error and success messages */}
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <div className="text-red-500 mr-2">⚠️</div>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <div className="text-green-500 mr-2">✅</div>
            <p className="text-green-700 text-sm">{success}</p>
          </div>
        </div>
      )}

      {/* Кнопка выбора файла (альтернатива) */}
      {!isUploading && (
        <button
          type="button"
          onClick={openFileDialog}
          className="mt-3 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isUploading}
        >
          {translations.en.selectVideo}
        </button>
      )}
    </div>
  )
}

export default VideoUploader
