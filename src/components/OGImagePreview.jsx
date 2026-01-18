import { useState, useEffect } from 'react'
import { generateOGImage, downloadOGImage, uploadOGImageToSupabase } from '../utils/ogImageGenerator'
import { supabase } from '../config/supabase'
import toast from 'react-hot-toast'

function OGImagePreview({ title, category, postId }) {
  const [imageUrl, setImageUrl] = useState(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (title) {
      const url = generateOGImage(title, category)
      setImageUrl(url)
    }
  }, [title, category])

  const handleDownload = () => {
    if (imageUrl) {
      downloadOGImage(imageUrl, `og-image-post-${postId}.png`)
      toast.success('Изображение скачано!')
    }
  }

  const handleUpload = async () => {
    if (!imageUrl || !postId) return
    
    setUploading(true)
    try {
      const publicUrl = await uploadOGImageToSupabase(supabase, imageUrl, postId)
      
      if (publicUrl) {
        // Обновляем пост с новым OG image URL
        const { error } = await supabase
          .from('posts')
          .update({ og_image: publicUrl })
          .eq('id', postId)

        if (error) throw error
        
        toast.success('OG изображение загружено!')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Ошибка загрузки')
    } finally {
      setUploading(false)
    }
  }

  const handleCopyUrl = () => {
    if (imageUrl) {
      navigator.clipboard.writeText(imageUrl)
      toast.success('URL скопирован!')
    }
  }

  if (!imageUrl) return null

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
        Превью для соцсетей (OG Image)
      </h3>
      
      <div className="mb-4 rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700">
        <img 
          src={imageUrl} 
          alt="OG Preview" 
          className="w-full h-auto"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleDownload}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Скачать
        </button>

        <button
          onClick={handleUpload}
          disabled={uploading}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Загрузка...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Загрузить в Supabase
            </>
          )}
        </button>

        <button
          onClick={handleCopyUrl}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Копировать URL
        </button>
      </div>

      <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        💡 Это изображение будет показываться при публикации в Telegram, Twitter, Facebook и других соцсетях
      </p>
    </div>
  )
}

export default OGImagePreview
