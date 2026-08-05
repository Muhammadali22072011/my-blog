import { useState, useRef, useCallback, useEffect } from 'react'
import { translations } from '../translations'
import supabaseService from '../services/SupabaseService'
import MediaInsertMenu from './MediaInsertMenu'
import ColorPicker from './ColorPicker'
import { renderMarkdown } from '../utils/markdownRenderer.jsx'

function AdminMCEditor({ value, onChange, placeholder, className = "" }) {
  const t = translations.en
  const [isPreview, setIsPreview] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [showTableModal, setShowTableModal] = useState(false)
  const [showMediaMenu, setShowMediaMenu] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [linkText, setLinkText] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [tableRows, setTableRows] = useState(3)
  const [tableCols, setTableCols] = useState(3)
  const [imageFile, setImageFile] = useState(null)
  const [videoFile, setVideoFile] = useState(null)
  const [imageMode, setImageMode] = useState('url')
  const [videoMode, setVideoMode] = useState('url')
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState(new Map())
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)

  // Initialize Supabase service
  useEffect(() => {
    const initSupabase = async () => {
      try {
        await supabaseService.initialize()
      } catch (error) {
        console.error('Failed to initialize Supabase service:', error)
      }
    }
    initSupabase()
  }, [])

  // Handle file uploads
  const handleFileUpload = useCallback(async (files) => {
    const newFiles = new Map(uploadedFiles)
    
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        try {
          const uploadResult = await supabaseService.uploadImage(file)
          const fileId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          newFiles.set(fileId, {
            id: fileId,
            file,
            url: uploadResult.url,
            type: 'image',
            name: file.name,
            size: file.size
          })
          
          const imageHtml = `<img src="${uploadResult.url}" alt="${file.name}" style="max-width: 100%; height: auto; margin: 10px 0;" />`
          insertText(imageHtml + '\n')
        } catch (error) {
          alert('Error uploading image to Supabase: ' + error.message)
        }
      } else if (file.type.startsWith('video/')) {
        try {
          const uploadResult = await supabaseService.uploadVideo(file)
          const fileId = `vid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          newFiles.set(fileId, {
            id: fileId,
            file,
            url: uploadResult.url,
            type: 'video',
            name: file.name,
            size: file.size
          })
          
          const videoHtml = `<video controls style="max-width: 100%; height: auto; margin: 10px 0;">
  <source src="${uploadResult.url}" type="video/mp4">
  Your browser does not support video.
</video>`
          insertText(videoHtml + '\n')
        } catch (error) {
          alert('Error uploading video to Supabase: ' + error.message)
        }
      }
    }
    
    setUploadedFiles(newFiles)
  }, [uploadedFiles])

  // Drag and drop handlers
  const handleDragOver = useCallback((e) => {
    if (e.cancelable !== false) {
      e.preventDefault()
    }
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    if (e.cancelable !== false) {
      e.preventDefault()
    }
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragging(false)
    }
  }, [])

  const handleDrop = useCallback((e) => {
    if (e.cancelable !== false) {
      e.preventDefault()
    }
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/') || file.type.startsWith('video/')
    )
    
    if (files.length > 0) {
      handleFileUpload(files)
    }
  }, [handleFileUpload])

  const insertText = (text) => {
    const textarea = textareaRef.current
    if (!textarea) return
    
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    
    let insertText = text
    if (start === 0 && text.includes('Post Title')) {
      insertText = text + '\n'
    }
    
    const newContent = value.substring(0, start) + insertText + value.substring(end)
    onChange(newContent)
    
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + insertText.length, start + insertText.length)
    }, 0)
  }

  // Smart formatting functions
  const formatBold = () => {
    const textarea = textareaRef.current
    if (!textarea) return
    
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    
    let newText
    if (selectedText) {
      newText = `++${selectedText}++`
    } else {
      newText = '++bold text++'
    }
    
    const newContent = value.substring(0, start) + newText + value.substring(end)
    onChange(newContent)
    
    setTimeout(() => {
      textarea.focus()
      if (selectedText) {
        textarea.setSelectionRange(start + newText.length, start + newText.length)
      } else {
        textarea.setSelectionRange(start + 2, start + 10)
      }
    }, 0)
  }

  const formatItalic = () => {
    const textarea = textareaRef.current
    if (!textarea) return
    
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    
    let newText
    if (selectedText) {
      newText = `*${selectedText}*`
    } else {
      newText = '*italic*'
    }
    
    const newContent = value.substring(0, start) + newText + value.substring(end)
    onChange(newContent)
    
    setTimeout(() => {
      textarea.focus()
      if (selectedText) {
        textarea.setSelectionRange(start + newText.length, start + newText.length)
      } else {
        textarea.setSelectionRange(start + 1, start + 7)
      }
    }, 0)
  }

  const formatCode = () => {
    const textarea = textareaRef.current
    if (!textarea) return
    
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    
    let newText
    if (selectedText) {
      newText = `\`${selectedText}\``
    } else {
      newText = '`code`'
    }
    
    const newContent = value.substring(0, start) + newText + value.substring(end)
    onChange(newContent)
    
    setTimeout(() => {
      textarea.focus()
      if (selectedText) {
        textarea.setSelectionRange(start + newText.length, start + newText.length)
      } else {
        textarea.setSelectionRange(start + 1, start + 5)
      }
    }, 0)
  }

  // Keyboard shortcuts
  const handleKeyDown = (e) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault()
          formatBold()
          break
        case 'i':
          e.preventDefault()
          formatItalic()
          break
        case 'k':
          e.preventDefault()
          formatCode()
          break
      }
    }
  }

  const handleImageFileUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      setImageUrl('')
    }
  }

  const handleVideoFileUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      setVideoFile(file)
      setVideoUrl('')
    }
  }

  const insertImage = async () => {
    if ((imageMode === 'url' && imageUrl.trim()) || (imageMode === 'file' && imageFile)) {
      let imageSrc
      if (imageMode === 'file' && imageFile) {
        if (imageFile.size > 5 * 1024 * 1024) {
          alert('File size should not exceed 5MB')
          return
        }
        if (!imageFile.type.startsWith('image/')) {
          alert('Please select an image file')
          return
        }
        
        try {
          const uploadResult = await supabaseService.uploadImage(imageFile)
          imageSrc = uploadResult.url
        } catch (error) {
          alert('Error uploading image to Supabase: ' + error.message)
          return
        }
      } else {
        try {
          new URL(imageUrl)
        } catch {
          alert('Please enter a valid image URL')
          return
        }
        imageSrc = imageUrl
      }
      
      const imageHtml = `<img src="${imageSrc}" alt="Image" style="max-width: 100%; height: auto; margin: 10px 0;" />`
      insertText(imageHtml)
      setImageUrl('')
      setImageFile(null)
      setShowImageModal(false)
    }
  }

  const insertVideo = async () => {
    if ((videoMode === 'url' && videoUrl.trim()) || (videoMode === 'file' && videoFile)) {
      let videoSrc
      if (videoMode === 'file' && videoFile) {
        if (videoFile.size > 50 * 1024 * 1024) {
          alert('File size should not exceed 50MB')
          return
        }
        if (!videoFile.type.startsWith('video/')) {
          alert('Please select a video file')
          return
        }
        
        try {
          const uploadResult = await supabaseService.uploadVideo(videoFile)
          videoSrc = uploadResult.url
        } catch (error) {
          alert('Error uploading video to Supabase: ' + error.message)
          return
        }
      } else {
        try {
          new URL(videoUrl)
        } catch {
          alert('Please enter a valid video URL')
          return
        }
        videoSrc = videoUrl
      }
      
      const videoHtml = `<video controls style="max-width: 100%; height: auto; margin: 10px 0;">
  <source src="${videoSrc}" type="video/mp4">
  Your browser does not support video.
</video>`
      insertText(videoHtml)
      setVideoUrl('')
      setVideoFile(null)
      setShowVideoModal(false)
    }
  }

  const insertLink = () => {
    if (linkText.trim() && linkUrl.trim()) {
      const linkMarkdown = `[${linkText}](${linkUrl})`
      insertText(linkMarkdown)
      setLinkText('')
      setLinkUrl('')
      setShowLinkModal(false)
    }
  }

  const insertTable = () => {
    let tableMarkdown = '\n'
    
    // Table header
    tableMarkdown += '| '
    for (let i = 1; i <= tableCols; i++) {
      tableMarkdown += `Header ${i} | `
    }
    tableMarkdown += '\n| '
    
    // Separator
    for (let i = 1; i <= tableCols; i++) {
      tableMarkdown += '--- | '
    }
    tableMarkdown += '\n'
    
    // Table rows
    for (let i = 1; i <= tableRows; i++) {
      tableMarkdown += '| '
      for (let j = 1; j <= tableCols; j++) {
        tableMarkdown += `Cell ${i}-${j} | `
      }
      tableMarkdown += '\n'
    }
    
    tableMarkdown += '\n'
    
    insertText(tableMarkdown)
    setShowTableModal(false)
  }

  const handleMediaInsert = (html) => {
    insertText(html)
  }

  const handleImageUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file!')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size should not exceed 5MB!')
      return
    }

    try {
      const result = await supabaseService.uploadImage(file)
      const imageHtml = `<img src="${result.url}" alt="${file.name}" style="max-width: 100%; height: auto; margin: 10px 0;" />`
      insertText(imageHtml)
      event.target.value = ''
    } catch (error) {
      console.error('Upload error:', error)
      alert('Error uploading image: ' + error.message)
    }
  }

  return (
    <div className={className}>
      {/* Enhanced toolbar */}
      <div className="bg-gray-50 rounded-t-lg border border-gray-300 border-b-0 p-3">
        <div className="flex flex-wrap gap-2">
          {/* Quick templates */}
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => insertText('# Post Title\n\nPost excerpt...\n\n')}
              className="px-3 py-1 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded text-sm font-medium border border-orange-300"
              title={t.insertTitleAndDescription}
            >
              📝 {t.template}
            </button>
          </div>

          {/* Headers */}
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => insertText('# ')}
              className="px-2 py-1 bg-white hover:bg-gray-100 text-gray-700 rounded text-sm font-medium border border-gray-300"
              title="Header 1"
            >
              H1
            </button>
            <button
              type="button"
              onClick={() => insertText('## ')}
              className="px-2 py-1 bg-white hover:bg-gray-100 text-gray-700 rounded text-sm font-medium border border-gray-300"
              title="Header 2"
            >
              H2
            </button>
            <button
              type="button"
              onClick={() => insertText('### ')}
              className="px-2 py-1 bg-white hover:bg-gray-100 text-gray-700 rounded text-sm font-medium border border-gray-300"
              title="Header 3"
            >
              H3
            </button>
          </div>

          {/* Formatting */}
          <div className="flex gap-1">
            <button
              type="button"
              onClick={formatBold}
              className="px-3 py-2 bg-white hover:bg-gray-100 text-gray-700 rounded text-sm font-bold border border-gray-300 transition-all duration-200 shadow-sm"
              title={t.boldText || 'Bold Text (Ctrl+B)'}
            >
              <strong>B</strong>
            </button>
            <button
              type="button"
              onClick={formatItalic}
              className="px-3 py-2 bg-white hover:bg-gray-100 text-gray-700 rounded text-sm italic border border-gray-300 transition-all duration-200 shadow-sm"
              title={t.italic || 'Italic Text (Ctrl+I)'}
            >
              <em>I</em>
            </button>
            <button
              type="button"
              onClick={formatCode}
              className="px-3 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded text-sm border border-gray-700 transition-all duration-200 shadow-sm"
              title={t.code || 'Inline Code (Ctrl+K)'}
            >
              &lt;/&gt;
            </button>
            <button
              type="button"
              onClick={() => insertText('```\ncode block\n```')}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded text-sm border border-gray-600 transition-all duration-200 shadow-sm"
              title="Code Block"
            >
              📄
            </button>
            
            {/* Color Picker */}
            <ColorPicker onInsert={insertText} />
          </div>

          {/* Lists */}
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => insertText('- list item')}
              className="px-2 py-1 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 rounded text-sm border border-yellow-300"
              title={t.listItem}
            >
              📝
            </button>
            <button
              type="button"
              onClick={() => insertText('1. list item')}
              className="px-2 py-1 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 rounded text-sm border border-yellow-300"
              title={t.numberedListItem}
            >
              1️⃣
            </button>
          </div>

          {/* Media */}
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setShowMediaMenu(true)}
              className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-sm border border-blue-300"
              title="Insert media from library"
            >
              📁 Media
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-sm border border-indigo-300"
              title={t.uploadFile}
            >
              📎
            </button>
            <button
              type="button"
              onClick={() => document.getElementById('imageUploadInput')?.click()}
              className="px-2 py-1 bg-pink-50 hover:bg-pink-100 text-pink-700 rounded text-sm border border-pink-300"
              title="Upload image"
            >
              📷
            </button>
            <button
              type="button"
              onClick={() => setShowImageModal(true)}
              className="px-2 py-1 bg-green-50 hover:bg-green-100 text-green-700 rounded text-sm border border-green-300"
              title={t.insertImageByUrl}
            >
              🖼️
            </button>
            <button
              type="button"
              onClick={() => setShowVideoModal(true)}
              className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded text-sm border border-purple-300"
              title={t.insertVideoByUrl}
            >
              🎥
            </button>
          </div>

          {/* Links and Tables */}
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setShowLinkModal(true)}
              className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-sm border border-blue-300"
              title={t.insertLink}
            >
              🔗
            </button>
            <button
              type="button"
              onClick={() => setShowTableModal(true)}
              className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-sm border border-blue-300"
              title={t.insertTable}
            >
              📊
            </button>
            <button
              type="button"
              onClick={() => insertText('> quote text')}
              className="px-2 py-1 bg-green-50 hover:bg-green-100 text-green-700 rounded text-sm border border-green-300"
              title="Blockquote"
            >
              💬
            </button>
            <button
              type="button"
              onClick={() => insertText('\n---\n')}
              className="px-2 py-1 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded text-sm border border-gray-300"
              title={t.insertDivider}
            >
              ➖
            </button>

            {/* Instructions */}
            <button
              type="button"
              onClick={() => setShowInstructions(true)}
              className="px-3 py-1 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded text-sm font-medium border border-orange-300"
              title="Usage instructions"
            >
              📖 Instructions
            </button>
          </div>

          {/* Mode toggle */}
          <button
            type="button"
            onClick={() => setIsPreview(!isPreview)}
            className={`px-3 py-1 rounded text-sm font-medium ml-auto border ${
              isPreview 
                ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700' 
                : 'bg-gray-600 text-white border-gray-600 hover:bg-gray-700'
            }`}
          >
            {isPreview ? t.edit : t.preview}
          </button>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFileUpload(Array.from(e.target.files || []))}
        accept="image/*,video/*"
        multiple
        className="hidden"
      />

      {/* Editing area */}
      <div 
        className={`border border-gray-300 rounded-b-lg relative ${
          isDragging ? 'border-blue-500 bg-blue-50' : ''
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center bg-blue-100 bg-opacity-90 z-10 rounded-b-lg">
            <div className="text-center">
              <div className="text-4xl mb-2">📎</div>
              <div className="text-blue-700 font-medium">{t.dragImagesHere}</div>
            </div>
          </div>
        )}
        
        {isPreview ? (
          <div className="p-4 bg-white min-h-[200px]">
            {value ? renderMarkdown(value, { emptyText: t.noContentToPreview }) : <p className="text-gray-400">{t.noContentToPreview}</p>}
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || t.startWritingHere}
            className="w-full p-4 border-0 focus:ring-0 focus:outline-none resize-none font-mono text-gray-700 min-h-[200px]"
          />
        )}
      </div>

      {/* Image modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 w-96">
            <h3 className="text-xl font-bold mb-4">{t.insertImage}</h3>
            
            {/* Toggle between URL and file */}
            <div className="mb-4">
              <div className="flex space-x-2 mb-4">
                <button
                  onClick={() => {
                    setImageMode('url')
                    setImageFile(null)
                    setImageUrl('')
                  }}
                  className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                    imageMode === 'url' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  URL
                </button>
                <button
                  onClick={() => {
                    setImageMode('file')
                    setImageUrl('')
                    setImageFile(null)
                  }}
                  className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                    imageMode === 'file' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {t.file}
                </button>
              </div>
            </div>

            {/* URL input */}
            {imageMode === 'url' && (
              <input
                type="url"
                placeholder={t.imageUrl}
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500"
              />
            )}

            {/* File upload */}
            {imageMode === 'file' && (
              <input
                type="file"
                accept="image/*"
                onChange={handleImageFileUpload}
                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 mb-4"
              />
            )}

            <div className="flex gap-2">
              <button
                onClick={insertImage}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!((imageMode === 'url' && imageUrl.trim()) || (imageMode === 'file' && imageFile))}
              >
                {t.insert}
              </button>
              <button
                onClick={() => {
                  setShowImageModal(false)
                  setImageUrl('')
                  setImageFile(null)
                  setImageMode('url')
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video modal */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 w-96">
            <h3 className="text-xl font-bold mb-4">{t.insertVideo}</h3>
            
            {/* Toggle between URL and file */}
            <div className="mb-4">
              <div className="flex space-x-2 mb-4">
                <button
                  onClick={() => {
                    setVideoMode('url')
                    setVideoFile(null)
                    setVideoUrl('')
                  }}
                  className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                    videoMode === 'url' ? 'bg-tile text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  URL
                </button>
                <button
                  onClick={() => {
                    setVideoMode('file')
                    setVideoUrl('')
                    setVideoFile(null)
                  }}
                  className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                    videoMode === 'file' ? 'bg-tile text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {t.file}
                </button>
              </div>
            </div>

            {/* URL input */}
            {videoMode === 'url' && (
              <input
                type="url"
                placeholder={t.videoUrl}
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500"
              />
            )}

            {/* File upload */}
            {videoMode === 'file' && (
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoFileUpload}
                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 mb-4"
              />
            )}

            <div className="flex gap-2">
              <button
                onClick={insertVideo}
                className="px-4 py-2 bg-tile text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!((videoMode === 'url' && videoUrl.trim()) || (videoMode === 'file' && videoFile))}
              >
                {t.insert}
              </button>
              <button
                onClick={() => {
                  setShowVideoModal(false)
                  setVideoUrl('')
                  setVideoFile(null)
                  setVideoMode('url')
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Link modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 w-96">
            <h3 className="text-xl font-bold mb-4">{t.insertLink}</h3>
            <input
              type="text"
              placeholder={t.linkTextPlaceholder}
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="url"
              placeholder={t.linkUrlPlaceholder}
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2">
              <button
                onClick={insertLink}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {t.insert}
              </button>
              <button
                onClick={() => setShowLinkModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table modal */}
      {showTableModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 w-96">
            <h3 className="text-xl font-bold mb-4">{t.createTable}</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t.numberOfRows}</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={tableRows}
                  onChange={(e) => setTableRows(parseInt(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t.numberOfColumns}</label>
                <input
                  type="number"
                  min="1"
                  max="8"
                  value={tableCols}
                  onChange={(e) => setTableCols(parseInt(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={insertTable}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                {t.createTable}
              </button>
              <button
                onClick={() => setShowTableModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input for image upload */}
      <input
        id="imageUploadInput"
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* Media Insert Menu */}
      {showMediaMenu && (
        <MediaInsertMenu
          onInsert={handleMediaInsert}
          onClose={() => setShowMediaMenu(false)}
        />
      )}

      {/* Instructions Modal */}
      {showInstructions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 w-[900px] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">📖 Справочник по использованию Markdown редактора</h3>
              <button
                onClick={() => setShowInstructions(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6 text-gray-700">
              {/* Основные принципы */}
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-3">🎯 Основные принципы</h4>
                <ul className="list-disc ml-6 space-y-2">
                  <li><strong>Режим редактирования:</strong> Пишите текст в текстовом поле</li>
                  <li><strong>Режим предпросмотра:</strong> Нажмите "Preview" чтобы увидеть результат</li>
                  <li><strong>Кнопки панели инструментов:</strong> Быстро вставляйте готовые шаблоны</li>
                  <li><strong>Синтаксис Markdown:</strong> Используйте специальные символы для форматирования</li>
                  <li><strong>Горячие клавиши:</strong> Ctrl+B (жирный), Ctrl+I (курсив), Ctrl+K (код)</li>
                </ul>
              </div>

              {/* Форматирование текста */}
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-3">✨ Форматирование текста</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-bold mb-2">Жирный текст:</p>
                      <code className="block bg-white p-2 rounded border">++жирный текст++</code>
                      <p className="text-sm text-gray-600">Результат: <strong>жирный текст</strong></p>
                    </div>
                    <div>
                      <p className="font-bold mb-2">Курсив:</p>
                      <code className="block bg-white p-2 rounded border">*курсив*</code>
                      <p className="text-sm text-gray-600">Результат: <em>курсив</em></p>
                    </div>
                    <div>
                      <p className="font-bold mb-2">Встроенный код:</p>
                      <code className="block bg-white p-2 rounded border">`код`</code>
                      <p className="text-sm text-gray-600">Результат: <code className="bg-gray-100 px-1 rounded">код</code></p>
                    </div>
                    <div>
                      <p className="font-bold mb-2">Блок кода:</p>
                      <code className="block bg-white p-2 rounded border">```<br/>код<br/>```</code>
                      <p className="text-sm text-gray-600">Многострочный блок кода</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Заголовки */}
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-3">📝 Заголовки</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="font-bold mb-2">H1:</p>
                      <code className="block bg-white p-2 rounded border"># Заголовок 1</code>
                    </div>
                    <div>
                      <p className="font-bold mb-2">H2:</p>
                      <code className="block bg-white p-2 rounded border">## Заголовок 2</code>
                    </div>
                    <div>
                      <p className="font-bold mb-2">H3:</p>
                      <code className="block bg-white p-2 rounded border">### Заголовок 3</code>
                    </div>
                  </div>
                </div>
              </div>

              {/* Списки */}
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-3">📋 Списки</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-bold mb-2">Маркированный список:</p>
                      <code className="block bg-white p-2 rounded border">- элемент 1<br/>- элемент 2<br/>- элемент 3</code>
                    </div>
                    <div>
                      <p className="font-bold mb-2">Нумерованный список:</p>
                      <code className="block bg-white p-2 rounded border">1. элемент 1<br/>2. элемент 2<br/>3. элемент 3</code>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ссылки и изображения */}
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-3">🔗 Ссылки и медиа</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-bold mb-2">Ссылка:</p>
                      <code className="block bg-white p-2 rounded border">[текст ссылки](URL)</code>
                      <p className="text-sm text-gray-600">Пример: [Google](https://google.com)</p>
                    </div>
                    <div>
                      <p className="font-bold mb-2">Изображение:</p>
                      <code className="block bg-white p-2 rounded border">![alt текст](URL изображения)</code>
                    </div>
                  </div>
                </div>
              </div>

              {/* Таблицы */}
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-3">📊 Таблицы</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <code className="block bg-white p-2 rounded border">
                    | Заголовок 1 | Заголовок 2 | Заголовок 3 |<br/>
                    | --- | --- | --- |<br/>
                    | Ячейка 1 | Ячейка 2 | Ячейка 3 |<br/>
                    | Ячейка 4 | Ячейка 5 | Ячейка 6 |
                  </code>
                  <p className="text-sm text-gray-600 mt-2">Используйте кнопку "📊" для быстрого создания таблицы</p>
                </div>
              </div>

              {/* Цитаты и разделители */}
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-3">💬 Цитаты и разделители</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-bold mb-2">Цитата:</p>
                      <code className="block bg-white p-2 rounded border">&gt; Текст цитаты</code>
                      <p className="text-sm text-gray-600">Результат: <blockquote className="border-l-4 border-gray-300 pl-4 italic">Текст цитаты</blockquote></p>
                    </div>
                    <div>
                      <p className="text-lg font-bold mb-2">Разделитель:</p>
                      <code className="block bg-white p-2 rounded border">---</code>
                      <p className="text-sm text-gray-600">Горизонтальная линия</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Цветной текст */}
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-3">🎨 Цветной текст</h4>
                <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                  <div>
                    <p className="font-bold mb-2">Использование кнопки 🎨 Цвет:</p>
                    <ol className="list-decimal ml-6 space-y-1 text-sm">
                      <li>Нажмите кнопку "🎨 Цвет" в панели инструментов</li>
                      <li>Выберите готовый цвет или введите свой (HEX/RGB)</li>
                      <li>Вставится код: <code className="bg-white px-2 py-1 rounded">&lt;span style="color: #ff0000"&gt;текст&lt;/span&gt;</code></li>
                      <li>Замените "текст" на ваш текст</li>
                    </ol>
                  </div>
                  
                  <div>
                    <p className="font-bold mb-2">Примеры:</p>
                    <div className="space-y-2">
                      <div>
                        <code className="block bg-white p-2 rounded border text-sm">
                          &lt;span style="color: #ef4444"&gt;красный текст&lt;/span&gt;
                        </code>
                        <p className="text-sm mt-1">Результат: <span style={{color: '#ef4444'}}>красный текст</span></p>
                      </div>
                      <div>
                        <code className="block bg-white p-2 rounded border text-sm">
                          &lt;span style="background: #fef08a; padding: 2px 4px"&gt;желтый фон&lt;/span&gt;
                        </code>
                        <p className="text-sm mt-1">Результат: <span style={{background: '#fef08a', padding: '2px 4px'}}>желтый фон</span></p>
                      </div>
                      <div>
                        <code className="block bg-white p-2 rounded border text-sm">
                          &lt;span style="color: rgb(59, 130, 246)"&gt;синий RGB&lt;/span&gt;
                        </code>
                        <p className="text-sm mt-1">Результат: <span style={{color: 'rgb(59, 130, 246)'}}>синий RGB</span></p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="font-bold mb-2">Форматы цветов:</p>
                    <ul className="list-disc ml-6 space-y-1 text-sm">
                      <li><strong>HEX:</strong> #ff0000, #00ff00, #0000ff</li>
                      <li><strong>RGB:</strong> rgb(255, 0, 0)</li>
                      <li><strong>RGBA:</strong> rgba(255, 0, 0, 0.5) - с прозрачностью</li>
                      <li><strong>Названия:</strong> red, blue, green, orange</li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 p-3 rounded border border-blue-200">
                    <p className="text-sm text-blue-800">
                      <strong>💡 Совет:</strong> Цветной текст отображается везде: в постах, ленте, поиске и превью!
                    </p>
                  </div>
                </div>
              </div>

              {/* Работа с файлами */}
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-3">📁 Работа с файлами</h4>
                <ul className="list-disc ml-6 space-y-2">
                  <li><strong>Загрузка изображений:</strong> Перетащите файл или нажмите 📷</li>
                  <li><strong>Загрузка видео:</strong> Перетащите файл или нажмите 🎥</li>
                  <li><strong>Медиа библиотека:</strong> Нажмите "📁 Media" для выбора из загруженных файлов</li>
                  <li><strong>Поддерживаемые форматы:</strong> JPG, PNG, GIF, MP4, WebM</li>
                  <li><strong>Размер файлов:</strong> Изображения до 5MB, видео до 50MB</li>
                </ul>
              </div>

              {/* Горячие клавиши */}
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-3">⌨️ Горячие клавиши</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p><strong>Ctrl+B:</strong> Жирный текст</p>
                      <p><strong>Ctrl+I:</strong> Курсив</p>
                      <p><strong>Ctrl+K:</strong> Встроенный код</p>
                    </div>
                    <div>
                      <p><strong>Ctrl+Z:</strong> Отменить</p>
                      <p><strong>Ctrl+Y:</strong> Повторить</p>
                      <p><strong>Ctrl+A:</strong> Выбрать всё</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Советы */}
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-3">💡 Полезные советы</h4>
                <ul className="list-disc ml-6 space-y-2">
                  <li>Используйте режим предпросмотра для проверки результата</li>
                  <li>Перетаскивайте файлы прямо в редактор</li>
                  <li>Используйте готовые шаблоны для быстрого старта</li>
                  <li>Сохраняйте черновики регулярно</li>
                  <li>Проверяйте размер загружаемых файлов</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminMCEditor