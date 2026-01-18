import React from 'react'
import { Link } from 'react-router-dom'
import { translations } from '../translations'

function NotFound() {
  const t = translations.en
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Number */}
        <div className="text-9xl font-bold text-gray-300 mb-4">404</div>
        
        {/* Error Message */}
        <h1 className="text-3xl font-semibold text-gray-800 mb-4">
          {t.pageNotFound}
        </h1>
        
        {/* Description */}
        <p className="text-gray-600 mb-8 text-lg">
          {t.pageNotFoundDescription}
        </p>
        
        {/* Action Buttons */}
        <div className="space-y-4">
          <Link
            to="/"
            className="inline-block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
          >
            {t.goHome}
          </Link>
          
          <Link
            to="/blogs"
            className="inline-block w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-6 rounded-lg transition-colors duration-200"
          >
            {t.browseBlogs}
          </Link>
        </div>
        
        {/* Helpful Links */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-3">{t.tryPopularPages}</p>
          <div className="flex justify-center space-x-4 text-sm">
            <Link to="/news" className="text-blue-600 hover:text-blue-800 hover:underline">
              {t.news}
            </Link>
            <Link to="/blogs" className="text-blue-600 hover:text-blue-800 hover:underline">
              {t.blogs}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotFound