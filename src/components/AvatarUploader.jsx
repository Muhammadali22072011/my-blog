import { useState } from 'react'
import supabaseService from '../services/SupabaseService'
import { translations } from '../translations'

function AvatarUploader({ onAvatarUploaded, currentAvatarUrl, currentAvatarLetter = 'M' }) {
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarLetter, setAvatarLetter] = useState(currentAvatarLetter)
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(currentAvatarUrl)

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Проверяем тип файла
      if (!file.type.startsWith('image/')) {
        alert(translations.en.pleaseSelectImageFile)
        return
      }
      
      // Проверяем размер файла (максимум 2MB для аватарки)
      if (file.size > 2 * 1024 * 1024) {
        alert(translations.en.fileSizeExceeds2MB)
        return
      }
      
      setAvatarFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleLetterChange = (e) => {
    const letter = e.target.value.toUpperCase()
    setAvatarLetter(letter)
    if (!avatarFile && !currentAvatarUrl) {
      setPreviewUrl(null)
    }
  }

  const handleUpload = async () => {
    if (!avatarFile && !avatarLetter) {
      alert(translations.en.selectAvatarLetter)
      return
    }

    setIsUploading(true)
    
    try {
      let avatarUrl = null
      
      if (avatarFile) {
        const uploadResult = await supabaseService.uploadImage(avatarFile, 'avatars')
        avatarUrl = uploadResult.url
      }
      
      // Вызываем callback с новыми данными
      onAvatarUploaded({
        avatarUrl,
        avatarLetter: avatarLetter || 'M'
      })
      
      // Очищаем состояние
      setAvatarFile(null)
      setPreviewUrl(avatarUrl)
      
    } catch (error) {
      console.error('Ошибка загрузки аватарки:', error)
      alert(translations.en.errorUploadingAvatar + ': ' + error.message)
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveAvatar = () => {
    setAvatarFile(null)
    setPreviewUrl(null)
    onAvatarUploaded({
      avatarUrl: null,
      avatarLetter: avatarLetter || 'M'
    })
  }

  return (
    <div className="space-y-4">
      {/* Preview */}
      <div className="flex items-center space-x-4">
        <div className="profile-avatar w-24 h-24">
          {previewUrl ? (
            <img 
              src={previewUrl} 
              alt="Avatar preview" 
            />
          ) : (
            <span>
              {avatarLetter || 'M'}
            </span>
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-2">
            {avatarFile ? translations.en.newImageUploaded : 
             previewUrl ? translations.en.currentAvatar : 
             '🔤 Letter avatar'}
          </p>
          {previewUrl && (
            <button
              type="button"
              onClick={handleRemoveAvatar}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              🗑️ Remove avatar
            </button>
          )}
        </div>
      </div>

      {/* Upload Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="avatarLetter" className="block text-sm text-gray-600 mb-2">
            🔤 Letter for avatar
          </label>
          <input
            type="text"
            id="avatarLetter"
            value={avatarLetter}
            onChange={handleLetterChange}
            maxLength="1"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 text-center text-2xl font-bold"
            placeholder="M"
          />
          <p className="text-xs text-gray-500 mt-1">
            Used if no image is uploaded
          </p>
        </div>
        
        <div>
          <label htmlFor="avatarFile" className="block text-sm text-gray-600 mb-2">
            📷 Upload photo
          </label>
          <input
            type="file"
            id="avatarFile"
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <p className="text-xs text-gray-500 mt-1">
            Maximum 2MB. JPG, PNG, GIF
          </p>
        </div>
      </div>

      {/* Upload Button */}
      <div className="flex justify-end">
        <button
          onClick={handleUpload}
          disabled={isUploading || (!avatarFile && !avatarLetter)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
        >
          {isUploading ? '⏳ Uploading...' : '💾 Save avatar'}
        </button>
      </div>
    </div>
  )
}

export default AvatarUploader
