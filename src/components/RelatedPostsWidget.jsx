import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../context/DataContext'

function RelatedPostsWidget({ currentPostId, category, tags = [] }) {
  const { posts } = useData()
  const [related, setRelated] = useState([])

  useEffect(() => {
    const calculateRelevance = (post) => {
      let score = 0
      if (post.category === category) score += 3
      if (post.tags) {
        const commonTags = post.tags.filter(t => tags.includes(t))
        score += commonTags.length * 2
      }
      return score
    }

    const relatedPosts = posts
      .filter(p => p.id !== currentPostId && p.status === 'published')
      .map(p => ({ ...p, relevance: calculateRelevance(p) }))
      .filter(p => p.relevance > 0)
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 4)

    setRelated(relatedPosts)
  }, [posts, currentPostId, category, tags])

  const getPostTitle = (post) => {
    if (post.content) {
      const lines = post.content.split('\n')
      for (const line of lines) {
        if (line.trim().startsWith('# ')) {
          return line.trim().substring(2)
        }
      }
    }
    return post.excerpt || 'Untitled'
  }

  const getExcerpt = (content) => {
    const text = content.replace(/^#+ .*/gm, '').replace(/[*`]/g, '').trim()
    return text.substring(0, 100) + (text.length > 100 ? '...' : '')
  }

  if (related.length === 0) return null

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg sticky top-24">
      <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Related Posts
      </h3>
      <div className="space-y-3">
        {related.map(post => (
          <Link
            key={post.id}
            to={`/post/${post.id}`}
            className="block p-3 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-all group"
          >
            <h4 className="font-medium text-gray-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 mb-1">
              {getPostTitle(post)}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
              {getExcerpt(post.content)}
            </p>
            <div className="flex items-center gap-2 mt-2">
              {post.category && (
                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs">
                  {post.category}
                </span>
              )}
              <span className="text-xs text-gray-400">
                {new Date(post.created_at).toLocaleDateString()}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default RelatedPostsWidget
