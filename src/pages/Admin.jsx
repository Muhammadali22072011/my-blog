// ============================================================================
// IMPORTS
// ============================================================================
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { translations } from '../translations'
import supabaseService from '../services/SupabaseService'

// Components
import AdminMCEditor from '../components/AdminMCEditor'
import AdminProjects from '../components/AdminProjects'
import OGImagePreview from '../components/OGImagePreview'
import SEOAnalyzer from '../components/SEOAnalyzer'
import SEOTools from '../components/SEOTools'
import SecurityDashboard from '../components/SecurityDashboard'


// ============================================================================
// MAIN COMPONENT
// ============================================================================
function Admin() {
  // ============================================================================
  // CONTEXT & HOOKS
  // ============================================================================
  const navigate = useNavigate()
  const { logout } = useAuth()
  const dataContext = useData()

  // ALL HOOKS MUST BE HERE, BEFORE ANY CONDITIONAL RETURNS

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  // Profile Form State
  const [profileData, setProfileData] = useState({
    name: '',
    position: '',
    aboutMe: '',
    avatarLetter: '',
    avatarUrl: null,
    avatarFile: null,
    youtube: '',
    github: '',
    linkedin: '',
    telegram: '',
    telegramChannel: ''
  })

  // About Me Form State
  const [aboutMeData, setAboutMeData] = useState({
    title: '',
    content: '',
    image_url: '',
    birth_date: '',
    location: '',
    telegram_channel: '',
    skills: [''],
    experience: '',
    education: '',
    interests: ''
  })

  // Site Settings Form State
  const [settingsData, setSettingsData] = useState({
    site_name: '',
    site_description: '',
    allow_comments: true,
    moderate_comments: true,
    meta_keywords: '',
    google_analytics: ''
  })

  // Search and Filtering State
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [postsPerPage] = useState(10)

  // Modal and Notification State
  const [showViewModal, setShowViewModal] = useState(false)
  const [viewingPost, setViewingPost] = useState(null)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')


  // Tab Navigation State
  const [activeTab, setActiveTab] = useState('posts')

  // Post Management State
  const [postData, setPostData] = useState({
    title: '',
    content: '',
    excerpt: '',
    category: 'blog',
    status: 'draft'
  })

  const [editingPost, setEditingPost] = useState({
    title: '',
    content: '',
    excerpt: '',
    category: 'blog',
    status: 'draft'
  })

  const [isPreview, setIsPreview] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // MCE Editor State
  const [mceContent, setMceContent] = useState('')

  // ============================================================================
  // TRANSLATIONS & CONTEXT DATA
  // ============================================================================

  // Get translations
  const t = translations.en

  // Extract context data
  const {
    posts,
    addPost,
    updatePost,
    deletePost,
    profile,
    updateProfile,
    aboutMePage,
    updateAboutMePage,
    siteSettings,
    updateSiteSettings,
    clearAllData,
    loading,
    dbInitialized,
    error
  } = dataContext || {}

  // ============================================================================
  // EFFECTS & VALIDATION
  // ============================================================================

  // Check if context is properly loaded
  useEffect(() => {
    if (typeof addPost !== 'function') {
      console.error('Context not properly loaded - addPost is not a function')
      console.error('addPost value:', addPost)
      console.error('Context loading state:', loading)
      console.error('Context dbInitialized:', dbInitialized)
    }

    if (typeof clearAllData !== 'function') {
      console.error('Context not properly loaded - clearAllData is not a function')
      console.error('clearAllData value:', clearAllData)
    }
  }, [addPost, clearAllData, loading, dbInitialized])

  // Update local state when profile and settings change
  useEffect(() => {
    setProfileData(prev => ({
      ...prev,
      name: profile?.name || '',
      position: profile?.position || '',
      aboutMe: profile?.about_me || profile?.aboutMe || '',
      avatarLetter: profile?.avatar_letter || profile?.avatarLetter || '',
      avatarUrl: profile?.avatar_url || profile?.avatarUrl || null,
      youtube: profile?.youtube || '',
      github: profile?.github || '',
      linkedin: profile?.linkedin || '',
      telegram: profile?.telegram || '',
      telegramChannel: profile?.telegram_channel || profile?.telegramChannel || ''
    }))
  }, [profile])

  useEffect(() => {
    setAboutMeData(prev => ({
      ...prev,
      title: aboutMePage?.title || '',
      content: aboutMePage?.content || '',
      image_url: aboutMePage?.image_url || '',
      birth_date: aboutMePage?.birth_date || '',
      location: aboutMePage?.location || '',
      telegram_channel: aboutMePage?.telegram_channel || '',
      skills: aboutMePage?.skills || [''],
      experience: aboutMePage?.experience || '',
      education: aboutMePage?.education || '',
      interests: aboutMePage?.interests || ''
    }))
  }, [aboutMePage])

  useEffect(() => {
    setSettingsData(prev => ({
      ...prev,
      site_name: siteSettings?.site_name || '',
      site_description: siteSettings?.site_description || '',
      allow_comments: siteSettings?.allow_comments || true,
      moderate_comments: siteSettings?.moderate_comments || true,
      meta_keywords: siteSettings?.meta_keywords || '',
      google_analytics: siteSettings?.google_analytics || ''
    }))
  }, [siteSettings])

  // Handle context loading error
  if (!dataContext) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center px-4 py-8">
        <div className="max-w-lg mx-auto bg-white rounded-xl shadow-sm border border-red-200 p-8 text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-red-900 mb-2">Data Context Error</h1>
          <p className="text-red-700 mb-4">Failed to load data context.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    )
  }

  // Check for critical errors after all hooks
  if (!addPost || typeof addPost !== 'function') {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center px-4 py-8">
        <div className="max-w-lg mx-auto bg-white rounded-xl shadow-sm border border-red-200 p-8 text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h1 className="text-xl font-bold text-red-900 mb-2">Critical Error</h1>
          <p className="text-red-700 mb-4">addPost function is not available. Context may not be properly initialized.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    )
  }

  // Now we can do conditional returns
  if (loading) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center px-4 py-8">
        <div className="max-w-lg mx-auto bg-white rounded-xl shadow-sm border border-blue-200 p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h1 className="text-xl font-bold text-blue-900 mb-2">Loading Admin Panel...</h1>
          <p className="text-blue-700">Please wait while we initialize the database connection.</p>
          <div className="mt-4 text-sm text-blue-600">
            Database Status: {dbInitialized ? '✅ Connected' : '⏳ Connecting...'}
          </div>
        </div>
      </div>
    )
  }

  if (!dbInitialized) {
    return (
      <div className="min-h-screen bg-yellow-50 flex items-center justify-center px-4 py-8">
        <div className="max-w-lg mx-auto bg-white rounded-xl shadow-sm border border-yellow-200 p-8 text-center">
          <div className="text-yellow-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-yellow-900 mb-2">Database Not Initialized</h1>
          <p className="text-yellow-700 mb-4">The database connection is not ready yet. Please wait or check the console for errors.</p>
          <div className="mt-4 text-sm text-yellow-600">
            <div>Loading: {loading ? 'Yes' : 'No'}</div>
            <div>Error: {error ? 'Yes' : 'No'}</div>
            {error && <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700">{error}</div>}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  // Logout Handler
  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  // About Me Form Handlers
  const handleAboutMeChange = (e) => {
    const { name, value } = e.target
    setAboutMeData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Skills Management Handlers
  const handleSkillsChange = (index, value) => {
    setAboutMeData(prev => {
      const newSkills = [...prev.skills]
      newSkills[index] = value
      return {
        ...prev,
        skills: newSkills
      }
    })
  }

  const addSkill = () => {
    setAboutMeData(prev => {
      // Check that the last skill is not empty
      if (prev.skills.length > 0 && prev.skills[prev.skills.length - 1].trim() === '') {
        return prev // Don't add new skill if the last one is empty
      }
      return {
        ...prev,
        skills: [...prev.skills, '']
      }
    })
  }

  const removeSkill = (index) => {
    setAboutMeData(prev => {
      // Don't delete if it's the last skill
      if (prev.skills.length <= 1) {
        return prev
      }
      return {
        ...prev,
        skills: prev.skills.filter((_, i) => i !== index)
      }
    })
  }

  // Post Management Handlers
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!postData.content.trim()) {
      alert(t.pleaseFillContent)
      return
    }

    // Check if addPost function exists
    if (typeof addPost !== 'function') {
      alert('Error: addPost function is not available. Please refresh the page.')
      return
    }

    // Extract title and excerpt from Markdown
    const lines = postData.content.split('\n')
    let title = ''
    let excerpt = ''

    // Look for H1 header (first line starting with #)
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('# ')) {
        title = lines[i].substring(2).trim()
        // Look for excerpt in the following lines (up to 3 lines)
        let excerptLines = []
        for (let j = i + 1; j < lines.length && excerptLines.length < 3; j++) {
          const line = lines[j].trim()
          if (line && !line.startsWith('#')) {
            // Remove markdown formatting for excerpt
            const cleanLine = line
              .replace(/\+\+(.*?)\+\+/g, '$1') // Remove bold ++
              .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold **
              .replace(/\*(.*?)\*/g, '$1') // Remove italic *
              .replace(/`(.*?)`/g, '$1') // Remove code `
              .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
            excerptLines.push(cleanLine)
          } else if (line.startsWith('#')) {
            // Stop at next header
            break
          }
        }
        excerpt = excerptLines.join(' ').trim()
        break
      }
    }

    // Create new post
    const newPost = {
      ...postData,
      title: title || t.noTitle,
      excerpt: excerpt || t.noDescription,
      status: 'published'
    }

    try {
      // Add post through context
      const result = await addPost(newPost)

      // Clear form
      setPostData({
        title: '',
        content: '',
        excerpt: '',
        category: 'blog',
        status: 'published'
      })

      // Show notification
      setSuccessMessage(t.postCreatedSuccessfully)
      setShowSuccessMessage(true)
      setTimeout(() => setShowSuccessMessage(false), 3000)
    } catch (error) {
      alert('Error adding post: ' + error.message)
    }
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      let avatarUrl = profileData.avatarUrl

      // Если есть новый файл аватарки, загружаем его
      if (profileData.avatarFile) {
        try {
          const uploadResult = await supabaseService.uploadImage(profileData.avatarFile, 'avatars')
          avatarUrl = uploadResult.url
        } catch (uploadError) {
          console.error('Ошибка загрузки аватарки:', uploadError)
          alert('Ошибка загрузки аватарки: ' + uploadError.message)
          setIsSaving(false)
          return
        }
      }

      // Prepare profile data for Supabase
      const profileDataForSupabase = {
        name: profileData.name,
        position: profileData.position,
        about_me: profileData.aboutMe,
        avatar_letter: profileData.avatarLetter,
        avatar_url: avatarUrl,
        youtube: profileData.youtube,
        github: profileData.github,
        linkedin: profileData.linkedin,
        telegram: profileData.telegram,
        telegram_channel: profileData.telegramChannel
      }

      await updateProfile(profileDataForSupabase)

      // Очищаем файл аватарки после успешной загрузки
      setProfileData(prev => ({
        ...prev,
        avatarFile: null,
        avatarUrl: avatarUrl
      }))

      setSuccessMessage(t.profileUpdatedSuccessfully || 'Profile updated successfully!')
      setShowSuccessMessage(true)
      setTimeout(() => setShowSuccessMessage(false), 3000)
    } catch (error) {
      alert(t.errorUpdatingProfile || 'Error updating profile: ' + error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSettingsSubmit = async (e) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      // Prepare settings data for Supabase
      const settingsDataForSupabase = {
        site_name: settingsData.site_name,
        site_description: settingsData.site_description,
        allow_comments: settingsData.allow_comments,
        moderate_comments: settingsData.moderate_comments,
        meta_keywords: settingsData.meta_keywords,
        google_analytics: settingsData.google_analytics
      }

      await updateSiteSettings(settingsDataForSupabase)

      setSuccessMessage(t.settingsUpdatedSuccessfully || 'Settings updated successfully!')
      setShowSuccessMessage(true)
      setTimeout(() => setShowSuccessMessage(false), 3000)
    } catch (error) {
      alert(t.errorUpdatingSettings || 'Error updating settings: ' + error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleAboutMeSubmit = async (e) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      // Prepare about me data for Supabase
      const aboutMeDataForSupabase = {
        title: aboutMeData.title,
        content: aboutMeData.content,
        image_url: aboutMeData.image_url,
        birth_date: aboutMeData.birth_date || null, // Преобразуем пустую строку в null
        location: aboutMeData.location,
        telegram_channel: aboutMeData.telegram_channel,
        skills: aboutMeData.skills.filter(skill => skill.trim()),
        experience: aboutMeData.experience,
        education: aboutMeData.education,
        interests: aboutMeData.interests
      }

      await updateAboutMePage(aboutMeDataForSupabase)

      setSuccessMessage(t.aboutMeUpdatedSuccessfully || 'About Me page updated successfully!')
      setShowSuccessMessage(true)
      setTimeout(() => setShowSuccessMessage(false), 3000)
    } catch (error) {
      alert(t.errorUpdatingAboutMe || 'Error updating About Me page: ' + error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleChange = (e) => {
    setPostData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleProfileChange = (e) => {
    setProfileData(prev => {
      const newData = {
        ...prev,
        [e.target.name]: e.target.value
      }

      return newData
    })
  }

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files[0]
    if (file) {
      try {
        // Проверяем тип файла
        if (!file.type.startsWith('image/')) {
          alert('Пожалуйста, выберите файл изображения')
          return
        }

        // Проверяем размер файла (максимум 2MB для аватарки)
        if (file.size > 2 * 1024 * 1024) {
          alert('Размер файла не должен превышать 2MB')
          return
        }

        setProfileData(prev => ({
          ...prev,
          avatarFile: file
        }))
      } catch (error) {
        console.error('Ошибка при выборе файла аватарки:', error)
        alert('Ошибка при выборе файла: ' + error.message)
      }
    }
  }

  const handleSettingsChange = (e) => {
    const { name, value, type, checked } = e.target
    setSettingsData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleEditChange = (e) => {
    const { name, value } = e.target
    setEditingPost(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const togglePreview = () => {
    setIsPreview(!isPreview)
  }



  const handleUpdatePost = async (e) => {
    e.preventDefault()

    if (!editingPost.content.trim()) {
      alert('Please fill in the post content')
      return
    }

    try {
      // Extract title and excerpt from Markdown
      const lines = editingPost.content.split('\n')
      let title = ''
      let excerpt = ''

      // Look for H1 header (first line starting with #)
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('# ')) {
          title = lines[i].substring(2).trim()
          // Look for excerpt in the following lines
          for (let j = i + 1; j < lines.length; j++) {
            if (lines[j].trim() && !lines[j].startsWith('#')) {
              excerpt = lines[j].trim()
              break
            }
          }
          break
        }
      }

      // Update post through context
      await updatePost(editingPost.id, {
        title: title || 'No Title',
        content: editingPost.content,
        excerpt: excerpt || 'No Description',
        category: editingPost.category,
        status: editingPost.status
      })

      // Close modal
      setShowEditModal(false)
      setEditingPost(null)

      // Clear form
      setPostData({
        title: '',
        content: '',
        excerpt: '',
        category: 'blog',
        status: 'published'
      })

      // Show notification
      setSuccessMessage('Post updated successfully!')
      setShowSuccessMessage(true)
      setTimeout(() => setShowSuccessMessage(false), 3000)
    } catch (error) {
      alert('Error updating post: ' + error.message)
    }
  }

  const handleDeletePost = async (id) => {
    if (window.confirm(t.confirmDeletePost)) {
      try {
        await deletePost(id)
        setSuccessMessage('Post deleted successfully!')
        setShowSuccessMessage(true)
        setTimeout(() => setShowSuccessMessage(false), 3000)
      } catch (error) {
        alert('Error deleting post: ' + error.message)
      }
    }
  }

  const handlePublishPost = async (id) => {
    try {
      await updatePost(id, { status: 'published' })
      setSuccessMessage('Post published!')
      setShowSuccessMessage(true)
      setTimeout(() => setShowSuccessMessage(false), 3000)
    } catch (error) {
      alert('Error publishing post: ' + error.message)
    }
  }

  const handleUnpublishPost = async (id) => {
    try {
      await updatePost(id, { status: 'draft' })
      setSuccessMessage('Post unpublished!')
      setShowSuccessMessage(true)
      setTimeout(() => setShowSuccessMessage(false), 3000)
    } catch (error) {
      alert('Error unpublishing post: ' + error.message)
    }
  }

  const handleViewPost = (post) => {
    setViewingPost(post)
    setShowViewModal(true)
  }

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  // Filtering and Pagination
  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !selectedCategory || post.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const indexOfLastPost = currentPage * postsPerPage
  const indexOfFirstPost = indexOfLastPost - postsPerPage
  const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost)
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage)

  const paginate = (pageNumber) => setCurrentPage(pageNumber)

  // Label Helpers
  const getCategoryLabel = (category) => {
    switch (category) {
      case 'blog': return t.blog
      case 'news': return t.news
      case 'tutorial': return t.tutorial
      default: return category
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'published': return t.published
      case 'draft': return t.draft
      default: return status
    }
  }

  // Date Formatting
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    });
  };

  // Markdown Processing
  const processMarkdown = (content) => {
    if (!content) return '';

    return content
      // Headers
      .replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold text-gray-900 mb-4">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-bold text-gray-800 mb-3">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-xl font-bold text-gray-700 mb-2">$1</h3>')
      .replace(/^#### (.*$)/gm, '<h4 class="text-lg font-bold text-gray-700 mb-2">$1</h4>')

      // Bold with ++ syntax (process first to avoid conflicts)
      .replace(/\+\+(.*?)\+\+/g, '<strong class="font-bold">$1</strong>')

      // Italic with * syntax (only if not part of bold)
      .replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, '<em class="italic">$1</em>')

      // Code
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800">$1</code>')

      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">$1</a>')

      // Blockquotes
      .replace(/^> (.*$)/gm, '<blockquote class="border-l-4 border-gray-300 pl-4 py-2 my-4 bg-gray-50 italic text-gray-700">$1</blockquote>')

      // Lists
      .replace(/^- (.*$)/gm, '<li class="text-700">$1</li>')
      .replace(/^(\d+)\. (.*$)/gm, '<li class="text-gray-700">$2</li>')

      // Line breaks and paragraphs
      .replace(/\n\n/g, '</p><p class="mb-2 text-gray-700">')
      .replace(/^/, '<p class="mb-2 text-gray-700">')
      .replace(/$/, '</p>');
  };

  // Function to deduplicate content
  const deduplicateContent = (content) => {
    if (!content) return content

    // Split content into lines
    const lines = content.split('\n')
    const uniqueLines = []
    const seenLines = new Set()

    for (const line of lines) {
      const trimmedLine = line.trim()
      if (trimmedLine && !seenLines.has(trimmedLine)) {
        uniqueLines.push(line)
        seenLines.add(trimmedLine)
      }
    }

    return uniqueLines.join('\n')
  }

  const handleClearAllPosts = async () => {
    if (window.confirm('Are you sure you want to delete ALL posts? This action cannot be undone!')) {
      try {
        await clearAllData()
        setSuccessMessage('All posts deleted successfully!')
        setShowSuccessMessage(true)
        setTimeout(() => setShowSuccessMessage(false), 3000)
      } catch (error) {
        alert('Error deleting all posts: ' + error.message)
      }
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="max-w-6xl mx-auto px-4">
      {/* Success Notifications */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
          {successMessage}
        </div>
      )}



      {/* Header Section */}
      <div className="flex justify-between items-center mb-8 pt-12">
        <div className="text-center flex-1">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">{t.adminPanel}</h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">{t.adminSubtitle}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleLogout}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium shadow-sm"
          >
            {t.logout}
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg mb-8 shadow-sm">
        <button
          onClick={() => setActiveTab('posts')}
          className={`flex-1 py-3 px-4 rounded-md font-medium transition-all duration-200 ${activeTab === 'posts'
            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm transform scale-105'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
        >
          📝 {t.blog}
        </button>
        <button
          onClick={() => setActiveTab('projects')}
          className={`flex-1 py-3 px-4 rounded-md font-medium transition-all duration-200 ${activeTab === 'projects'
            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm transform scale-105'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
        >
          🚀 Projects
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex-1 py-3 px-4 rounded-md font-medium transition-all duration-200 ${activeTab === 'profile'
            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm transform scale-105'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
        >
          👤 {t.profileSettings}
        </button>
        <button
          onClick={() => setActiveTab('mce')}
          className={`flex-1 py-3 px-4 rounded-md font-medium transition-all duration-200 ${activeTab === 'mce'
            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm transform scale-105'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
        >
          ✏️ {t.mceEditor}
        </button>
        <button
          onClick={() => setActiveTab('about-me')}
          className={`flex-1 py-3 px-4 rounded-md font-medium transition-all duration-200 ${activeTab === 'about-me'
            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm transform scale-105'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
        >
          ℹ️ {t.aboutMePage}
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 py-3 px-4 rounded-md font-medium transition-all duration-200 ${activeTab === 'settings'
            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm transform scale-105'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
        >
          ⚙️ {t.siteSettings}
        </button>
        <button
          onClick={() => setActiveTab('manage-posts')}
          className={`flex-1 py-3 px-4 rounded-md font-medium transition-all duration-200 ${activeTab === 'manage-posts'
            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm transform scale-105'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
        >
          📋 {t.managePosts}
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`flex-1 py-3 px-4 rounded-md font-medium transition-all duration-200 ${activeTab === 'security'
            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm transform scale-105'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
        >
          🛡️ Безопасность
        </button>

      </div>

      {/* Posts Tab */}
      {activeTab === 'posts' && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 shadow-sm">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">📝 Create New Post</h2>
            <p className="text-gray-600 dark:text-gray-400">Write and publish your content</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t.category}
              </label>
              <select
                id="category"
                name="category"
                value={postData.category}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
              >
                <option value="blog">Blog</option>
                <option value="news">News</option>
                <option value="tutorial">Tutorial</option>
              </select>
            </div>

            {/* Control buttons */}
            <div className="space-y-4">
              {/* Status indicator */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status:</span>
                <span className={`px-3 py-1 text-xs rounded-full font-medium shadow-sm ${postData.status === 'published'
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                  }`}>
                  {postData.status === 'published' ? '✅ Published' : '📝 Draft'}
                </span>
              </div>

              <div className="flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={togglePreview}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 font-medium shadow-sm"
                >
                  👁️ {isPreview ? t.edit : t.preview}
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium shadow-sm"
                >
                  📤 {t.publish}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPostData({
                      ...postData,
                      status: postData.status === 'published' ? 'draft' : 'published'
                    })
                  }}
                  className={`px-6 py-3 rounded-lg transition-all duration-200 font-medium shadow-sm ${postData.status === 'published'
                    ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                    : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                >
                  {postData.status === 'published' ? '📝 ' + (t.makeDraft || 'Make Draft') : '📤 ' + t.publish}
                </button>
              </div>
            </div>
          </form>

          {/* Editor/Preview */}
          <div className="mt-8">
            <div className="flex space-x-4 mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
                {isPreview ? '👁️ ' + t.preview : '✏️ ' + t.markdownEditor}
              </h3>
            </div>

            {isPreview ? (
              /* Preview */
              <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                {postData.content ? (
                  <div className="prose prose-lg max-w-none">
                    <div dangerouslySetInnerHTML={{
                      __html: processMarkdown(postData.content)
                    }} />
                  </div>
                ) : (
                  <p className="text-gray-400">{t.noContentToPreview}</p>
                )}
              </div>
            ) : (
              /* Enhanced MCE editor */
              <AdminMCEditor
                value={postData.content}
                onChange={(value) => setPostData({ ...postData, content: value })}
                placeholder={t.enhancedMarkdownPlaceholderText}
                className="w-full"
              />
            )}
          </div>
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 shadow-sm">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">👤 {t.profileSettings || 'Profile Settings'}</h2>
            <p className="text-gray-600 dark:text-gray-400">{t.profileSettingsSubtitle || 'Configure your profile information'}</p>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-6">
            {/* Basic information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.profileName}
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={profileData.name}
                  onChange={handleProfileChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label htmlFor="position" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.profilePosition}
                </label>
                <input
                  type="text"
                  id="position"
                  name="position"
                  value={profileData.position}
                  onChange={handleProfileChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
            </div>

            {/* About me */}
            <div>
              <label htmlFor="aboutMe" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t.profileAbout}
              </label>
              <textarea
                id="aboutMe"
                name="aboutMe"
                value={profileData.aboutMe}
                onChange={handleProfileChange}
                rows="3"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            {/* Avatar */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t.profileAvatar || 'Profile Avatar'}
              </label>

              {/* Current Avatar Preview */}
              <div className="mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg overflow-hidden">
                    {profileData.avatarFile ? (
                      <img
                        src={URL.createObjectURL(profileData.avatarFile)}
                        alt="Avatar preview"
                        className="w-full h-full object-cover"
                      />
                    ) : profileData.avatarUrl ? (
                      <img
                        src={profileData.avatarUrl}
                        alt="Current avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      profileData.avatarLetter || 'M'
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {profileData.avatarFile ? '🆕 Новое изображение загружено' :
                        profileData.avatarUrl ? '📷 Текущая аватарка' :
                          '🔤 Текущая буква аватарки'}
                    </p>
                    {profileData.avatarUrl && !profileData.avatarFile && (
                      <button
                        type="button"
                        onClick={() => {
                          setProfileData(prev => ({
                            ...prev,
                            avatarUrl: null
                          }))
                        }}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        🗑️ Удалить аватарку
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Avatar Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="avatarLetter" className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                    🔤 Буква для аватарки
                  </label>
                  <input
                    type="text"
                    id="avatarLetter"
                    name="avatarLetter"
                    value={profileData.avatarLetter}
                    onChange={handleProfileChange}
                    maxLength="1"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 text-center text-2xl font-bold bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="M"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Используется, если нет загруженного изображения
                  </p>
                </div>

                <div>
                  <label htmlFor="avatarFile" className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                    📷 Загрузить фото
                  </label>
                  <input
                    type="file"
                    id="avatarFile"
                    accept="image/*"
                    onChange={handleAvatarFileChange}
                    className="block w-full text-sm text-gray-900 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900/30 file:text-blue-700 dark:file:text-blue-400 hover:file:bg-blue-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Максимум 2MB. JPG, PNG, GIF
                  </p>
                </div>
              </div>
            </div>

            {/* Social media */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4">{t.profileSocial}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="youtube" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t.profileYouTube}
                  </label>
                  <input
                    type="url"
                    id="youtube"
                    name="youtube"
                    value={profileData.youtube}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                  />
                </div>

                <div>
                  <label htmlFor="github" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t.profileGitHub}
                  </label>
                  <input
                    type="url"
                    id="github"
                    name="github"
                    value={profileData.github}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                  />
                </div>

                <div>
                  <label htmlFor="linkedin" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t.profileLinkedIn}
                  </label>
                  <input
                    type="url"
                    id="linkedin"
                    name="linkedin"
                    value={profileData.linkedin}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                  />
                </div>

                <div>
                  <label htmlFor="telegram" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t.profileTelegram}
                  </label>
                  <input
                    type="url"
                    id="telegram"
                    name="telegram"
                    value={profileData.telegram}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                  />
                </div>
              </div>
            </div>

            {/* Telegram channel */}
            <div>
              <label htmlFor="telegramChannel" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t.profileTelegramChannel}
              </label>
              <input
                type="text"
                id="telegramChannel"
                name="telegramChannel"
                value={profileData.telegramChannel}
                onChange={handleProfileChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="@username"
              />
            </div>

            {/* Save button */}
            <div className="pt-4">
              <button
                type="submit"
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium"
              >
                {t.saveProfile}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Projects Tab */}
      {activeTab === 'projects' && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8">
          <AdminProjects />
        </div>
      )}

      {/* MCE Editor Tab */}
      {activeTab === 'mce' && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{t.enhancedMarkdownEditor || 'Enhanced Markdown Editor'}</h2>
            <p className="text-gray-600 dark:text-gray-400">{t.enhancedMarkdownEditorSubtitle || 'Create beautiful documents with enhanced Markdown support'}</p>
          </div>

          <AdminMCEditor
            value={mceContent}
            onChange={setMceContent}
            placeholder={t.enhancedMarkdownPlaceholder}
            className="w-full"
          />

          {/* Statistics */}
          <div className="mt-6 bg-gray-50 dark:bg-gray-900 rounded-lg p-4 leading-relaxed">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{mceContent.length}</div>
                <div className="text-gray-600 dark:text-gray-400">Characters</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{mceContent.split('\n').length}</div>
                <div className="text-gray-600 dark:text-gray-400">Lines</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{mceContent.split(' ').filter(word => word.trim()).length}</div>
                <div className="text-gray-600 dark:text-gray-400">Words</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* About Me Tab */}
      {activeTab === 'about-me' && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8">
          <div className="mb-6">

            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{t.aboutMePage || 'About Me Page'}</h2>
            <p className="text-gray-600 dark:text-gray-400">{t.aboutMePageSubtitle || 'Configure your information for the About Me page'}</p>
          </div>

          <form onSubmit={handleAboutMeSubmit} className="space-y-6">
            {/* Basic information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="aboutMeTitle" className="block text-sm font-medium text-gray-700 mb-2">
                  {t.aboutMeTitle}
                </label>
                <input
                  type="text"
                  id="aboutMeTitle"
                  name="title"
                  value={aboutMeData.title}
                  onChange={handleAboutMeChange}
                  placeholder={t.enterPageTitle}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                  required
                />
              </div>

              <div>
                <label htmlFor="aboutMeImage" className="block text-sm font-medium text-gray-700 mb-2">
                  {t.aboutMeImage}
                </label>
                <input
                  type="url"
                  id="aboutMeImage"
                  name="image_url"
                  value={aboutMeData.image_url}
                  onChange={handleAboutMeChange}
                  placeholder={t.enterImageUrl}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                />
              </div>
            </div>

            {/* Personal Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="aboutMeBirthDate" className="block text-sm font-medium text-gray-700 mb-2">
                  {t.aboutMeBirthDate}
                </label>
                <input
                  type="date"
                  id="aboutMeBirthDate"
                  name="birth_date"
                  value={aboutMeData.birth_date}
                  onChange={handleAboutMeChange}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                />
              </div>

              <div>
                <label htmlFor="aboutMeLocation" className="block text-sm font-medium text-gray-700 mb-2">
                  {t.aboutMeLocation}
                </label>
                <input
                  type="text"
                  id="aboutMeLocation"
                  name="location"
                  value={aboutMeData.location}
                  onChange={handleAboutMeChange}
                  placeholder={t.enterLocation}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                />
              </div>
            </div>

            {/* Telegram Channel */}
            <div>
              <label htmlFor="aboutMeInterests" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t.profileTelegramChannel}
              </label>
              <input
                type="text"
                id="aboutMeTelegram"
                name="telegram_channel"
                value={aboutMeData.telegram_channel}
                onChange={handleAboutMeChange}
                placeholder={t.enterUsername}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
              />
            </div>

            {/* Page content */}
            <div>
              <label htmlFor="aboutMeContent" className="block text-sm font-medium text-gray-700 mb-2">
                {t.aboutMeContent}
              </label>
              <textarea
                id="aboutMeContent"
                name="content"
                value={aboutMeData.content}
                onChange={handleAboutMeChange}
                placeholder={t.writeAboutYourself}
                rows="8"
                className="w-full px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                {t.markdownSyntaxHint}
              </p>
            </div>

            {/* Skills */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t.aboutMeSkills}
              </label>
              <p className="text-sm text-gray-500 mb-3">{t.skillsWillBeSaved}</p>
              <div className="space-y-2">
                {aboutMeData.skills.map((skill, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={skill}
                      onChange={(e) => handleSkillsChange(index, e.target.value)}
                      placeholder={t.enterSkill}
                      className="flex-1 px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeSkill(index)}
                      className="px-3 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                      disabled={aboutMeData.skills.length <= 1}
                    >
                      🗑️
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addSkill}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 text-sm"
                >
                  {t.addSkill}
                </button>
              </div>
            </div>

            {/* Work Experience */}
            <div>
              <label htmlFor="aboutMeExperience" className="block text-sm font-medium text-gray-700 mb-2">
                {t.aboutMeExperience}
              </label>
              <textarea
                id="aboutMeExperience"
                name="experience"
                value={aboutMeData.experience}
                onChange={handleAboutMeChange}
                rows="4"
                placeholder={t.describeWorkExperience}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
              />
            </div>

            {/* Education */}
            <div>
              <label htmlFor="aboutMeEducation" className="block text-sm font-medium text-gray-700 mb-2">
                {t.aboutMeEducation}
              </label>
              <textarea
                id="aboutMeEducation"
                name="education"
                value={aboutMeData.education}
                onChange={handleAboutMeChange}
                rows="4"
                placeholder={t.describeEducation}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
              />
            </div>

            {/* Interests */}
            <div>
              <label htmlFor="aboutMeInterests" className="block text-sm font-medium text-gray-700 mb-2">
                {t.aboutMeInterests}
              </label>
              <textarea
                id="aboutMeInterests"
                name="interests"
                value={aboutMeData.interests}
                onChange={handleAboutMeChange}
                rows="4"
                placeholder={t.describeInterests}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
              />
            </div>

            {/* Save button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSaving}
                className={`w-full px-6 py-3 rounded-lg transition-colors duration-200 font-medium ${isSaving
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
                  } text-white`}
              >
                {isSaving ? t.saving : t.saveAboutMePage}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{t.siteSettings || 'Site Settings'}</h2>
            <p className="text-gray-600 dark:text-gray-400">{t.siteSettingsSubtitle || 'Configure the main parameters of your site'}</p>
          </div>

          <form onSubmit={handleSettingsSubmit} className="space-y-6">
            {/* Basic settings */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">{t.basicSettings}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t.siteName}
                  </label>
                  <input
                    type="text"
                    name="site_name"
                    value={settingsData.site_name}
                    onChange={handleSettingsChange}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t.siteDescription}
                  </label>
                  <input
                    type="text"
                    name="site_description"
                    value={settingsData.site_description}
                    onChange={handleSettingsChange}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                  />
                </div>
              </div>
            </div>

            {/* Comment settings */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">{t.comments}</h3>
              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="allow_comments"
                    checked={settingsData.allow_comments}
                    onChange={handleSettingsChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">{t.allowComments || 'Allow Comments'}</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="moderate_comments"
                    checked={settingsData.moderate_comments}
                    onChange={handleSettingsChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">{t.moderateComments || 'Moderate Comments'}</span>
                </label>
              </div>
            </div>

            {/* SEO settings */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">{t.seoSettings}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t.metaKeywords || 'Meta Keywords'}
                  </label>
                  <input
                    type="text"
                    name="meta_keywords"
                    value={settingsData.meta_keywords}
                    onChange={handleSettingsChange}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t.googleAnalytics || 'Google Analytics'}
                  </label>
                  <input
                    type="text"
                    name="google_analytics"
                    value={settingsData.google_analytics}
                    onChange={handleSettingsChange}
                    placeholder="G-XXXXXXXXXX"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                  />
                </div>
              </div>
            </div>

            {/* Save button */}
            <div className="pt-4">
              <button
                type="submit"
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
              >
                {t.saveSettings || 'Save Settings'}
              </button>
            </div>
          </form>

          {/* SEO Tools */}
          <div className="mt-8">
            <SEOTools posts={posts} />
          </div>
        </div>
      )}

      {/* Manage Posts Tab */}
      {activeTab === 'manage-posts' && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 shadow-sm">
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">📋 {t.managePosts || 'Manage Posts'}</h2>
                <p className="text-gray-600 dark:text-gray-400">{t.managePostsSubtitle || 'View and manage all your posts'}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    🔴 Live Updates
                  </span>
                  <span className="text-xs text-gray-500">Changes sync automatically</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{filteredPosts.length}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{t.totalPosts || 'Total Posts'}</div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                placeholder={t.searchByTitle || 'Search by title...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm"
              />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">{t.allCategories}</option>
                <option value="blog">Blog</option>
                <option value="news">News</option>
                <option value="tutorial">Tutorial</option>
              </select>
              <button
                onClick={() => {
                  setSearchTerm('')
                  setSelectedCategory('')
                  setCurrentPage(1)
                }}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200 font-medium shadow-sm"
              >
                🗑️ {t.clearFilters}
              </button>
            </div>

            {/* Clear All Posts Button */}
            {filteredPosts.length > 0 && (
              <div className="flex justify-end space-x-4">
                {/* Fix all duplicated content button */}
                {filteredPosts.some(post => post.content && deduplicateContent(post.content).length < post.content.length) && (
                  <button
                    onClick={async () => {
                      const postsWithDuplicates = filteredPosts.filter(post =>
                        post.content && deduplicateContent(post.content).length < post.content.length
                      )

                      if (window.confirm(`This will fix duplicated content in ${postsWithDuplicates.length} posts. Continue?`)) {
                        try {
                          for (const post of postsWithDuplicates) {
                            const cleanContent = deduplicateContent(post.content)
                            await updatePost(post.id, { content: cleanContent })
                          }
                          alert(`Successfully fixed ${postsWithDuplicates.length} posts!`)
                        } catch (error) {
                          alert('Error fixing posts: ' + error.message)
                        }
                      }
                    }}
                    className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-all duration-200 font-medium shadow-sm"
                  >
                    🔧 Fix All Duplicated Content
                  </button>
                )}
                <button
                  onClick={() => {
                    if (window.confirm(t.confirmDeleteAllPosts || 'Are you sure you want to delete ALL posts? This action cannot be undone!')) {
                      handleClearAllPosts()
                    }
                  }}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 font-medium shadow-sm"
                >
                  🗑️ {t.clearAllPosts} ({filteredPosts.length})
                </button>
              </div>
            )}

            {/* Posts Cards - Beautiful Layout */}
            {currentPosts.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-medium text-gray-600 dark:text-gray-300 mb-2">
                  {filteredPosts.length === 0 ? t.noPostsFound || 'No posts found' : t.noPostsOnThisPage || 'No posts on this page'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400">Create your first post to get started!</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {currentPosts.map(post => {
                  // Extract title from content
                  const getPostTitle = () => {
                    if (post.content) {
                      const lines = post.content.split('\n')
                      for (const line of lines) {
                        const trimmed = line.trim()
                        if (trimmed.startsWith('# ')) {
                          return trimmed.substring(2)
                        }
                      }
                    }
                    return post.excerpt || 'Untitled Post'
                  }

                  const title = getPostTitle()

                  return (
                    <div
                      key={post.id}
                      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:border-blue-300 dark:hover:border-blue-500"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                        {/* Post Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-3 mb-3">
                            {/* Status indicator */}
                            <div className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${post.status === 'published' ? 'bg-green-500' : 'bg-yellow-500'
                              }`} />

                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 truncate">
                                {title.length > 80 ? title.substring(0, 80) + '...' : title}
                              </h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                                {post.excerpt || 'No description'}
                              </p>
                            </div>
                          </div>

                          {/* Meta info */}
                          <div className="flex flex-wrap items-center gap-3 text-sm">
                            <span className="text-gray-500 dark:text-gray-400">
                              📅 {post.created_at ? formatDate(post.created_at) : 'No Date'}
                            </span>

                            <select
                              value={post.category || 'blog'}
                              onChange={async (e) => {
                                try {
                                  await updatePost(post.id, { category: e.target.value })
                                } catch (error) {
                                  alert('Error updating post category: ' + error.message)
                                }
                              }}
                              className={`px-3 py-1 text-xs rounded-full border-0 cursor-pointer font-medium ${post.category === 'blog' ? 'bg-blue-100 text-blue-800' :
                                post.category === 'news' ? 'bg-green-100 text-green-800' :
                                  'bg-purple-100 text-purple-800'
                                }`}
                            >
                              <option value="blog">📘 Blog</option>
                              <option value="news">📰 News</option>
                              <option value="tutorial">📚 Tutorial</option>
                            </select>

                            <select
                              value={post.status || 'draft'}
                              onChange={async (e) => {
                                try {
                                  await updatePost(post.id, { status: e.target.value })
                                } catch (error) {
                                  alert('Error updating post status: ' + error.message)
                                }
                              }}
                              className={`px-3 py-1 text-xs rounded-full border-0 cursor-pointer font-medium ${post.status === 'published' ? 'bg-green-100 text-green-800' :
                                'bg-yellow-100 text-yellow-800'
                                }`}
                            >
                              <option value="draft">📝 Draft</option>
                              <option value="published">✅ Published</option>
                            </select>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2 lg:flex-shrink-0">
                          <button
                            onClick={() => handleViewPost(post)}
                            className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 font-medium"
                            title="View"
                          >
                            👁️ View
                          </button>
                          <button
                            onClick={() => {
                              setEditingPost(post)
                              setShowEditModal(true)
                            }}
                            className="px-4 py-2 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-all duration-200 font-medium"
                            title="Edit"
                          >
                            ✏️ Edit
                          </button>
                          {post.content && deduplicateContent(post.content).length < post.content.length && (
                            <button
                              onClick={async () => {
                                if (window.confirm('This will fix duplicated content in this post. Continue?')) {
                                  try {
                                    const cleanContent = deduplicateContent(post.content)
                                    await updatePost(post.id, { content: cleanContent })
                                    setSuccessMessage('Content fixed successfully!')
                                    setShowSuccessMessage(true)
                                    setTimeout(() => setShowSuccessMessage(false), 3000)
                                  } catch (error) {
                                    alert('Error fixing content: ' + error.message)
                                  }
                                }
                              }}
                              className="px-4 py-2 text-sm bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-all duration-200 font-medium"
                              title="Fix Duplicated Content"
                            >
                              🔧 Fix
                            </button>
                          )}
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="px-4 py-2 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-all duration-200 font-medium"
                            title="Delete"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>

                      {/* Content Preview */}
                      {post.content && (
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                          <div
                            className="prose prose-sm max-w-none text-gray-600 line-clamp-3"
                            dangerouslySetInnerHTML={{
                              __html: processMarkdown(post.content.substring(0, 300) + (post.content.length > 300 ? '...' : ''))
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-6">
                <nav className="flex space-x-2">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                  >
                    ← {t.previous || 'Previous'}
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => paginate(page)}
                      className={`px-4 py-2 rounded-lg transition-all duration-200 shadow-sm ${currentPage === page
                        ? 'bg-blue-600 text-white transform scale-105'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                        }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                  >
                    {t.next || 'Next'} →
                  </button>
                </nav>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit post modal */}
      {showEditModal && editingPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{t.editPost || 'Edit Post'}</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingPost(null)
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleUpdatePost} className="space-y-6">
                <div>
                  <label htmlFor="edit-excerpt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t.postExcerpt || 'Excerpt'}
                  </label>
                  <textarea
                    id="edit-excerpt"
                    name="excerpt"
                    value={editingPost.excerpt || ''}
                    onChange={handleEditChange}
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="edit-content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t.postContent || 'Content'}
                  </label>
                  <textarea
                    id="edit-content"
                    name="content"
                    value={editingPost.content || ''}
                    onChange={handleEditChange}
                    rows="10"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="edit-category" className="block text-sm font-medium text-gray-700 mb-2">
                      {t.postCategory || 'Category'}
                    </label>
                    <select
                      name="category"
                      value={editingPost.category || 'blog'}
                      onChange={handleEditChange}
                      className="w-full px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="blog">{t.blog || 'Blog'}</option>
                      <option value="news">{t.news || 'News'}</option>
                      <option value="tutorial">{t.tutorial || 'Tutorial'}</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="edit-status" className="block text-sm font-medium text-gray-700 mb-2">
                      {t.postStatus || 'Status'}
                    </label>
                    <select
                      id="edit-status"
                      name="status"
                      value={editingPost.status || 'draft'}
                      onChange={handleEditChange}
                      className="w-full px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="draft">{t.draft || 'Draft'}</option>
                      <option value="published">{t.published || 'Published'}</option>
                    </select>
                  </div>
                </div>

                {/* OG Image Preview */}
                <OGImagePreview 
                  title={(() => {
                    if (editingPost.content) {
                      const lines = editingPost.content.split('\n')
                      for (const line of lines) {
                        const trimmed = line.trim()
                        if (trimmed.startsWith('# ')) {
                          return trimmed.substring(2)
                        }
                      }
                    }
                    return editingPost.excerpt || 'Untitled Post'
                  })()}
                  category={editingPost.category || 'blog'}
                  postId={editingPost.id}
                />

                {/* SEO Analyzer */}
                <SEOAnalyzer 
                  post={editingPost}
                  onKeywordsUpdate={(keywords) => {
                    console.log('Extracted keywords:', keywords)
                  }}
                />

                <div className="flex justify-end space-x-4 pt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false)
                      setEditingPost(null)
                    }}
                    className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {t.cancel || 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {t.saveChanges || 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}



      {/* View post modal */}
      {showViewModal && viewingPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{t.viewPostTitle || 'View Post'}</h3>
                <button
                  onClick={() => {
                    setShowViewModal(false)
                    setViewingPost(null)
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">{viewingPost.content ? (viewingPost.content.length > 50 ? viewingPost.content.substring(0, 50) + '...' : viewingPost.content) : 'No content'}</h4>
                  <p className="text-gray-600 dark:text-gray-400">{viewingPost.excerpt}</p>
                  <div className="flex space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                    <span>{t.postCategoryLabel || 'Category'}: {getCategoryLabel(viewingPost.category)}</span>
                    <span>{t.postStatusLabel || 'Status'}: {getStatusLabel(viewingPost.status)}</span>
                    <span>{t.postDate || 'Date'}: {viewingPost.created_at ? formatDate(viewingPost.created_at) : 'No Date'}</span>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h5 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3">Content:</h5>
                  <div className="prose dark:prose-invert prose-lg max-w-none">
                    <div dangerouslySetInnerHTML={{
                      __html: processMarkdown(viewingPost.content)
                    }} />
                  </div>
                </div>

                <div className="flex justify-end pt-6">
                  <button
                    onClick={() => {
                      setShowViewModal(false)
                      setViewingPost(null)
                      setEditingPost(viewingPost)
                      setShowEditModal(true)
                    }}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {t.editThisPost || 'Edit This Post'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8">
          <SecurityDashboard />
        </div>
      )}
    </div>
  )
}

export default Admin
