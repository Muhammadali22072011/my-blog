import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import ImageUploader from '../components/ImageUploader'
import VideoUploader from '../components/VideoUploader'
import ImageGallery from '../components/ImageGallery'
import VideoGallery from '../components/VideoGallery'

function MediaManager() {
  const { isAdmin } = useAuth()
  const [activeTab, setActiveTab] = useState('images')
  const [selectedImage, setSelectedImage] = useState(null)
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [hasAdminAccess, setHasAdminAccess] = useState(false)

  // Проверяем наличие токена multi_auth_token
  useEffect(() => {
    const checkAdminAccess = () => {
      const token = localStorage.getItem('multi_auth_token')
      if (token) {
        try {
          const { expires } = JSON.parse(token)
          setHasAdminAccess(Date.now() < expires)
        } catch {
          setHasAdminAccess(false)
        }
      } else {
        setHasAdminAccess(false)
      }
    }

    checkAdminAccess()
  }, [])

  if (!hasAdminAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="text-red-500 text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-4">
            You do not have permission to access this page.
            Only administrators can manage media files.
          </p>
          <a
            href="/"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Home
          </a>
        </div>
      </div>
    )
  }

  const handleImageUploaded = (imageData) => {
    // You can add logic to refresh the gallery here
  }

  const handleVideoUploaded = (videoData) => {
    // You can add logic to refresh the gallery here
  }

  const handleImageSelect = (image) => {
    setSelectedImage(image)
  }

  const handleVideoSelect = (video) => {
    setSelectedVideo(video)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Media Manager
          </h1>
          <p className="text-gray-600">
            Upload and manage images and videos for your blog
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('images')}
                className={`
                  py-2 px-1 border-b-2 font-medium text-sm
                  ${activeTab === 'images'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                📷 Images
              </button>
              <button
                onClick={() => setActiveTab('videos')}
                className={`
                  py-2 px-1 border-b-2 font-medium text-sm
                  ${activeTab === 'videos'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                🎥 Videos
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          {activeTab === 'images' && (
            <div className="space-y-8">
              {/* Image Upload */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Upload Images
                </h2>
                <ImageUploader onImageUploaded={handleImageUploaded} />
              </div>

              {/* Image Gallery */}
              <div className="bg-white rounded-lg shadow p-6">
                <ImageGallery onImageSelect={handleImageSelect} />
              </div>
            </div>
          )}

          {activeTab === 'videos' && (
            <div className="space-y-8">
              {/* Video Upload */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Upload Videos
                </h2>
                <VideoUploader onVideoUploaded={handleVideoUploaded} />
              </div>

              {/* Video Gallery */}
              <div className="bg-white rounded-lg shadow p-6">
                <VideoGallery onVideoSelect={handleVideoSelect} />
              </div>
            </div>
          )}
        </div>

        {/* Selected Files Info */}
        {(selectedImage || selectedVideo) && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Selected Files
            </h3>
            
            <div className="space-y-4">
              {selectedImage && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Image:</h4>
                  <div className="flex items-center space-x-4">
                    <img
                      src={selectedImage.url}
                      alt={selectedImage.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-800">{selectedImage.name}</p>
                      <p className="text-xs text-blue-600">
                        Size: {(selectedImage.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <p className="text-xs text-blue-600">URL: {selectedImage.url}</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedVideo && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Video:</h4>
                  <div className="flex items-center space-x-4">
                    <div className="relative w-24 h-16 bg-gray-100 rounded-lg overflow-hidden">
                      <video
                        src={selectedVideo.url}
                        className="w-full h-full object-cover"
                        preload="metadata"
                        muted
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-6 h-6 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                          <div className="w-0 h-0 border-l-[6px] border-l-white border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent ml-0.5"></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-800">{selectedVideo.name}</p>
                      <p className="text-xs text-green-600">
                        Size: {(selectedVideo.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <p className="text-xs text-green-600">URL: {selectedVideo.url}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            📋 Usage Instructions
          </h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-blue-800 mb-2">📷 Images:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Supported formats: JPG, PNG, GIF, WebP</li>
                <li>• Max size: 5MB</li>
                <li>• Drag & Drop or click to select a file</li>
                <li>• Automatically uploaded to Supabase Storage</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-blue-800 mb-2">🎥 Videos:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Supported formats: MP4, WebM, AVI, MOV</li>
                <li>• Max size: 50MB</li>
                <li>• Drag & Drop or click to select a file</li>
                <li>• Automatically uploaded to Supabase Storage</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-100 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>💡 Tip:</strong> After uploading files, you can use their URLs in your posts or other parts of the application.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MediaManager
