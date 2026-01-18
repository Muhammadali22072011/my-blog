import { useState, useEffect } from 'react'
import { useData } from '../context/DataContext'

function CategoryFilter({ onFilterChange, selectedCategory = 'all' }) {
  const { posts } = useData()
  const [categories, setCategories] = useState([])

  useEffect(() => {
    const categoryCount = {}
    posts
      .filter(p => p.status === 'published')
      .forEach(post => {
        const cat = post.category || 'uncategorized'
        categoryCount[cat] = (categoryCount[cat] || 0) + 1
      })

    const categoryArray = Object.entries(categoryCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    setCategories([
      { name: 'all', count: posts.filter(p => p.status === 'published').length },
      ...categoryArray
    ])
  }, [posts])

  const getCategoryIcon = (category) => {
    const icons = {
      all: '📚',
      technology: '💻',
      design: '🎨',
      business: '💼',
      lifestyle: '🌟',
      travel: '✈️',
      food: '🍔',
      health: '💪',
      education: '🎓',
      entertainment: '🎬',
      uncategorized: '📝'
    }
    return icons[category.toLowerCase()] || '📄'
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        Categories
      </h2>
      <div className="space-y-2">
        {categories.map(category => (
          <button
            key={category.name}
            onClick={() => onFilterChange(category.name)}
            className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
              selectedCategory === category.name
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105'
                : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{getCategoryIcon(category.name)}</span>
              <span className="font-medium capitalize">
                {category.name === 'all' ? 'All Posts' : category.name}
              </span>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
              selectedCategory === category.name
                ? 'bg-white/20'
                : 'bg-gray-200 dark:bg-gray-600'
            }`}>
              {category.count}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default CategoryFilter
