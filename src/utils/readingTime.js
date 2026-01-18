/**
 * Calculate reading time for a text
 * @param {string} text - The text content
 * @param {number} wordsPerMinute - Average reading speed (default: 200)
 * @returns {number} - Reading time in minutes
 */
export function calculateReadingTime(text, wordsPerMinute = 200) {
  if (!text) return 0
  
  // Remove HTML tags
  const plainText = text.replace(/<[^>]*>/g, '')
  
  // Count words
  const words = plainText.trim().split(/\s+/).length
  
  // Calculate reading time
  const minutes = Math.ceil(words / wordsPerMinute)
  
  return minutes
}

/**
 * Format reading time as string
 * @param {number} minutes - Reading time in minutes
 * @returns {string} - Formatted string like "5 min read"
 */
export function formatReadingTime(minutes) {
  if (minutes < 1) return '< 1 min read'
  if (minutes === 1) return '1 min read'
  return `${minutes} min read`
}
