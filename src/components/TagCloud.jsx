import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../context/DataContext'

function TagCloud() {
  const { posts } = useData()
  const [tags, setTags] = useState([])

  useEffect(() => {
    const tagCount = {}
    posts
      .filter(p => p.status === 'published')
      .forEach(post => {
        const postTags = post.tags || []
        postTags.forEach(tag => {
          tagCount[tag] = (tagCount[tag] || 0) + 1
        })
      })

    const tagArray = Object.entries(tagCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20)

    setTags(tagArray)
  }, [posts])

  const getTagSize = (count) => {
    const max = Math.max(...tags.map(t => t.count))
    const min = Math.min(...tags.map(t => t.count))
    const ratio = (count - min) / (max - min || 1)
    return 0.8 + ratio * 1.2 // от 0.8 до 2
  }

  const getTagColor = (index) => {
    const colors = [
      'from-blue-500 to-cyan-500',
      'from-purple-500 to-pink-500',
      'from-green-500 to-emerald-500',
      'from-orange-500 to-red-500',
      'from-indigo-500 to-purple-500',
      'from-yellow-500 to-orange-500'
    ]
    return colors[index % colors.length]
  }

  if (tags.length === 0) return null

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
        Popular Tags
      </h2>
      <div className="flex flex-wrap gap-3">
        {tags.map((tag, index) => (
          <Link
            key={tag.name}
            to={`/blogs?tag=${encodeURIComponent(tag.name)}`}
            className="group relative"
            style={{ fontSize: `${getTagSize(tag.count)}rem` }}
          >
            <span className={`inline-block px-4 py-2 bg-gradient-to-r ${getTagColor(index)} text-white rounded-full font-medium hover:scale-110 transition-transform shadow-md`}>
              #{tag.name}
            </span>
            <span className="absolute -top-2 -right-2 bg-gray-800 dark:bg-gray-700 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold opacity-0 group-hover:opacity-100 transition-opacity">
              {tag.count}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default TagCloud
