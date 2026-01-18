import { useState, useRef } from 'react'
import supabaseService from '../services/SupabaseService'
import { translations } from '../translations'

function ImageUploader({ onImageUploaded, className = '' }) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const fileInputRef = useRef(null)

  const handleFileSelect = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    // Сброс состояний
    setError('')
    setSuccess('')
    setUploadProgress(0)

    try {
      setIsUploading(true)
      
      // Загружаем изображение через Supabase Service
      const result = await supabaseService.uploadImage(file)
      
      setSuccess(translations.en.imageUploadedSuccessfully)
      setUploadProgress(100)
      
      // Вызываем callback с результатом загрузки
      if (onImageUploaded) {
        onImageUploaded(result)
      }
      
      // Очищаем input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
    } catch (error) {
      console.error('Ошибка загрузки изображения:', error)
      setError(error.message || translations.en.errorUploadingImage)
    } finally {
      setIsUploading(false)
      // Сбрасываем прогресс через 2 секунды
      setTimeout(() => setUploadProgress(0), 2000)
    }
  }

  const handleDragOver = (event) => {
    event.preventDefault()
    event.currentTarget.classList.add('border-blue-500', 'bg-blue-50')
  }

  const handleDragLeave = (event) => {
    event.preventDefault()
    event.currentTarget.classList.remove('border-blue-500', 'bg-blue-50')
  }

  const handleDrop = (event) => {
    event.preventDefault()
    event.currentTarget.classList.remove('border-blue-500', 'bg-blue-50')
    
    const files = event.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (file.type.startsWith('image/')) {
        // Создаем событие для input
        const inputEvent = new Event('change', { bubbles: true })
        fileInputRef.current.files = files
        fileInputRef.current.dispatchEvent(inputEvent)
      } else {
        setError(translations.en.pleaseSelectImageFile)
      }
    }
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Скрытый input для файлов */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Drag & Drop зона */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200
          ${isUploading 
            ? 'border-gray-300 bg-gray-50 cursor-not-allowed' 
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
            <p className="text-gray-600">{translations.en.uploadingImage}</p>
            {uploadProgress > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-4xl text-gray-400">📷</div>
            <div>
              <p className="text-lg font-medium text-gray-700">
                {translations.en.dragImageHere}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {translations.en.supportedImageFormats}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error and success messages */}
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700 text-sm">{success}</p>
        </div>
      )}

      {/* Кнопка выбора файла (альтернатива) */}
      {!isUploading && (
        <button
          type="button"
          onClick={openFileDialog}
          className="mt-3 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {translations.en.selectImage}
        </button>
      )}
    </div>
  )
}

export default ImageUploader
