import { useData } from '../context/DataContext'

function AboutMe() {
  const { aboutMePage, profile, loading, error } = useData()

  // Показываем загрузку, если данные еще не загружены
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading About Me data...</p>
        </div>
      </div>
    )
  }

  // Показываем ошибку, если что-то пошло не так
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Error Loading About Me</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Проверяем, что данные существуют
  if (!aboutMePage || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 text-6xl mb-4">📄</div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">About Me Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400">About Me data is not available. Please check your database connection.</p>
        </div>
      </div>
    )
  }

  // Function to calculate age
  const calculateAge = (birthDate) => {
    if (!birthDate) return null
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  // Function to convert Markdown to HTML
  const markdownToHtml = (markdown) => {
    if (!markdown) return ''
    return markdown
      .replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold text-gray-900 mb-6">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-bold text-gray-800 mb-4 mt-8">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-xl font-bold text-gray-700 mb-3 mt-6">$1</h3>')
      .replace(/\+\+(.*?)\+\+/g, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-2 py-1 rounded text-sm font-mono">$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">$1</a>')
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full h-auto rounded-lg shadow-lg my-6" />')
      .replace(/\n\n/g, '</p><p class="mb-4 text-gray-700 leading-relaxed">')
      .replace(/^/, '<p class="mb-4 text-gray-700 leading-relaxed">')
      .replace(/$/, '</p>')
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white dark:bg-gray-800 shadow-sm transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight">
              {aboutMePage.title || 'About Me'}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Full-Stack developer creating innovative solutions and sharing knowledge
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Profile Card */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 p-8 mb-16 transition-colors duration-300">
          <div className="flex flex-col md:flex-row items-center space-y-8 md:space-y-0 md:space-x-12">
            <div className="flex-shrink-0">
              <div className="profile-avatar w-32 h-32">
                {profile.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt="Profile" 
                  />
                ) : aboutMePage.image_url ? (
                  <img 
                    src={aboutMePage.image_url} 
                    alt="Profile" 
                  />
                ) : (
                  <span>
                    {profile.avatar_letter || profile.avatarLetter || 'M'}
                  </span>
                )}
              </div>
            </div>
            <div className="text-center md:text-left flex-1">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                {profile.name || 'User'}
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-3">
                {profile.position || 'Developer'}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">
                {profile.about_me || profile.aboutMe || 'No description available'}
              </p>
              
              {/* Personal Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {aboutMePage.birth_date && (
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-500 dark:text-gray-400">🎂 Date of Birth:</span>
                    <span className="font-medium text-gray-700 dark:text-gray-200">
                      {new Date(aboutMePage.birth_date).toLocaleDateString('en-US')}
                      {calculateAge(aboutMePage.birth_date) && (
                        <span className="ml-2 text-blue-600 dark:text-blue-400">
                          ({calculateAge(aboutMePage.birth_date)} years old)
                        </span>
                      )}
                    </span>
                  </div>
                )}
                {aboutMePage.location && (
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-500 dark:text-gray-400">📍 Location:</span>
                    <span className="font-medium text-gray-700 dark:text-gray-200">{aboutMePage.location}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-16">
          {/* Markdown Content */}
          {aboutMePage.content && (
            <section className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 p-8 transition-colors duration-300">
              <div 
                className="prose prose-lg dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: markdownToHtml(aboutMePage.content) }}
              />
            </section>
          )}

          {/* Skills Section */}
          {aboutMePage.skills && aboutMePage.skills.length > 0 && (
            <section className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 p-8 transition-colors duration-300">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">Skills & Technologies</h2>
              <div className="flex flex-wrap justify-center gap-4">
                {aboutMePage.skills.filter(skill => skill.trim()).map((skill, index) => (
                  <span 
                    key={index}
                    className="px-6 py-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 text-gray-700 dark:text-gray-200 rounded-full text-sm font-medium hover:from-blue-100 hover:to-purple-100 dark:hover:from-blue-900/50 dark:hover:to-purple-900/50 transition-all duration-200 border border-blue-200 dark:border-blue-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Experience Section */}
          {aboutMePage.experience && (
            <section className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 p-8 transition-colors duration-300">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">Work Experience</h2>
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-700 dark:to-blue-900/30 p-8 rounded-2xl">
                <p className="text-gray-700 dark:text-gray-200 leading-relaxed text-lg text-center max-w-4xl mx-auto">
                  {aboutMePage.experience}
                </p>
              </div>
            </section>
          )}

          {/* Education Section */}
          {aboutMePage.education && (
            <section className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 p-8 transition-colors duration-300">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">Education</h2>
              <div className="bg-gradient-to-r from-gray-50 to-green-50 dark:from-gray-700 dark:to-green-900/30 p-8 rounded-2xl">
                <p className="text-gray-700 dark:text-gray-200 leading-relaxed text-lg text-center max-w-4xl mx-auto">
                  {aboutMePage.education}
                </p>
              </div>
            </section>
          )}

          {/* Interests Section */}
          {aboutMePage.interests && (
            <section className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 p-8 transition-colors duration-300">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">Interests & Hobbies</h2>
              <div className="bg-gradient-to-r from-gray-50 to-purple-50 dark:from-gray-700 dark:to-purple-900/30 p-8 rounded-2xl">
                <p className="text-gray-700 dark:text-gray-200 leading-relaxed text-lg text-center max-w-4xl mx-auto">
                  {aboutMePage.interests}
                </p>
              </div>
            </section>
          )}

          {/* Telegram Channel */}
          {aboutMePage.telegram_channel && (
            <section className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 p-8 transition-colors duration-300">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">Connect With Me</h2>
              <div className="text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-4">Follow me on Telegram for updates and new content</p>
                <a 
                  href={`https://t.me/${aboutMePage.telegram_channel.replace('@', '')}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-8 py-4 bg-blue-500 text-white rounded-full text-lg font-medium hover:bg-blue-600 transition-colors"
                >
                  <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                  {aboutMePage.telegram_channel}
                </a>
              </div>
            </section>
          )}
        </div>

        {/* Contact Section */}
        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Contact Me</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Telegram Channel</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Subscribe for new articles and updates</p>
              <a 
                href={`https://t.me/${aboutMePage.telegram_channel?.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl text-lg font-medium"
              >
                📱 {aboutMePage.telegram_channel || '@muhammadaliaiblog'}
              </a>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Direct Message</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Contact for collaboration</p>
              <a 
                href="https://t.me/muhammadaliaiblog"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl text-lg font-medium"
              >
                💬 Write Message
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AboutMe
