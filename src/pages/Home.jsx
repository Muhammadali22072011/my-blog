import { Link } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { translations } from '../translations'
import { ProfileSkeleton } from '../components/Skeleton'
import SEOHead from '../components/SEOHead'

function Home() {
  const t = translations.en
  const { profile, loading, error } = useData()

  // Показываем загрузку с skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center px-4 py-8">
        <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 p-8 fade-in w-full">
          <ProfileSkeleton />
        </div>
      </div>
    )
  }

  // Показываем ошибку, если что-то пошло не так
  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4 py-8">
        <div className="max-w-4xl mx-auto bg-white p-8 text-center fade-in">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Error Loading Profile</h1>
          <p className="text-gray-600 mb-4">{error}</p>
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

  // Проверяем, что profile существует
  if (!profile) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4 py-8">
        <div className="max-w-4xl mx-auto bg-white p-8 text-center fade-in">
          <div className="text-gray-500 text-6xl mb-4">👤</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Profile Not Found</h1>
          <p className="text-gray-600">Profile data is not available. Please check your database connection.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center px-4 py-8">
      <SEOHead 
        title="Home" 
        description={profile.about_me || profile.aboutMe || 'Personal blog about web development and technology'}
        type="website"
      />
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 p-8 fade-in">
        <div className="flex flex-col lg:flex-row items-center lg:items-start space-y-8 lg:space-y-0 lg:space-x-12">

          {/* Profile Picture - Left Side */}
          <div className="flex-shrink-0 scale-in">
            <div className="profile-avatar">
              {profile.avatar_url || profile.avatarUrl ? (
                <img
                  src={profile.avatar_url || profile.avatarUrl}
                  alt={`${profile.name || 'User'} profile`}
                />
              ) : (
                <span>
                  {profile.avatar_letter || profile.avatarLetter || 'M'}
                </span>
              )}
            </div>
          </div>

          {/* Profile Information - Right Side */}
          <div className="flex-1 text-center lg:text-left slide-up">

            {/* Name */}
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-2 slide-up" style={{ animationDelay: '0.1s' }}>
              {profile.name || 'User'}
            </h1>

            {/* Position */}
            <p className="text-lg text-gray-600 mb-6 slide-up" style={{ animationDelay: '0.2s' }}>
              {profile.position || 'Developer'}
            </p>

            {/* Social Media Icons */}
            <div className="flex justify-center lg:justify-start space-x-4 mb-6">
              {profile.youtube && (
                <a
                  href={profile.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-icon scale-in"
                  style={{ animationDelay: '0.1s' }}
                >
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>
              )}

              {profile.github && (
                <a
                  href={profile.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-icon scale-in"
                  style={{ animationDelay: '0.2s' }}
                >
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                </a>
              )}

              {profile.linkedin && (
                <a
                  href={profile.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-icon scale-in"
                  style={{ animationDelay: '0.3s' }}
                >
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
              )}

              {profile.telegram && (
                <a
                  href={profile.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-icon scale-in"
                  style={{ animationDelay: '0.4s' }}
                >
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                  </svg>
                </a>
              )}
            </div>

            {/* Bio/Tagline */}
            <p className="text-lg text-gray-700 mb-8 leading-relaxed max-w-2xl slide-up" style={{ animationDelay: '0.3s' }}>
              {profile.about_me || profile.aboutMe || 'I write about non-technical stuff in the technical world.'}
            </p>

            {/* Call-to-Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-center lg:justify-start space-y-3 sm:space-y-0 sm:space-x-4 mb-8">
              <Link
                to="/blogs"
                className="btn-primary scale-in"
                style={{ animationDelay: '0.5s' }}
              >
                {t.readBlog || 'Read Blog'}
              </Link>
              <Link
                to="/about"
                className="btn-secondary scale-in"
                style={{ animationDelay: '0.6s' }}
              >
                {t.aboutMeBtn || 'About Me'}
              </Link>
            </div>

            {/* Subscribe info */}
            <div className="text-center lg:text-left pt-6 border-t border-gray-200 slide-up" style={{ animationDelay: '0.7s' }}>
              <p className="text-gray-600 text-sm mb-2">
                {t.subscribeInfo || 'Subscribe to my Telegram channel for new articles and updates'}
              </p>
              {profile.telegram_channel ? (
                <a
                  href={`https://t.me/${profile.telegram_channel.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm inline-flex items-center"
                >
                  {profile.telegram_channel}
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              ) : (
                <p className="text-gray-500 text-sm">No Telegram channel available</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
