import { useParams, Link } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { translations } from '../translations'
import { useState, useEffect } from 'react'
import { supabase } from '../config/supabase'
import { renderMarkdown } from '../utils/markdownRenderer.jsx'
import TableOfContents from '../components/TableOfContents'
import Reactions from '../components/Reactions'
import Comments from '../components/Comments'
import { BookmarkButton } from '../components/Bookmarks'
import ViewCounter from '../components/ViewCounter'
import SEOHead from '../components/SEOHead'
import SEOKeywords from '../components/SEOKeywords'
import FloatingTOC from '../components/FloatingTOC'
import { extractKeywords } from '../utils/seoKeywordExtractor'
import ExportPost from '../components/ExportPost'
import QuoteShare from '../components/QuoteShare'
import PostRating from '../components/PostRating'
import SocialShare from '../components/SocialShare'
import PostStats from '../components/PostStats'
import RelatedPostsWidget from '../components/RelatedPostsWidget'

function BlogPost() {
  const { id } = useParams()
  const { posts, loading, error } = useData()
  const t = translations.en
  const [post, setPost] = useState(null)
  const [postLoading, setPostLoading] = useState(false)
  const [postError, setPostError] = useState(null)
  const [readingProgress, setReadingProgress] = useState(0)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [copied, setCopied] = useState(false)

  // Reading progress bar
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0
      setReadingProgress(Math.min(progress, 100))
      setShowBackToTop(scrollTop > 400)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const loadPost = async () => {
      if (!id || isNaN(parseInt(id))) {
        setPostError('Invalid post ID')
        return
      }
      
      const parsedId = parseInt(id)
      
      if (posts && posts.length > 0) {
        const foundPost = posts.find(p => p.id === parsedId)
        if (foundPost) {
          setPost(foundPost)
          setPostError(null)
          return
        }
      }
      
      setPostLoading(true)
      setPostError(null)
      
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('id', parsedId)
          .single()
        
        if (error) {
          setPostError(error.message)
        } else if (data) {
          if (data.status !== 'published') {
            setPostError(`Post is not published`)
          } else {
            setPost(data)
          }
        } else {
          setPostError('Post not found')
        }
      } catch (error) {
        setPostError(error.message)
      } finally {
        setPostLoading(false)
      }
    }

    if (id && !isNaN(parseInt(id))) {
      setPost(null)
      setPostLoading(false)
      setPostError(null)
      loadPost()
    }
  }, [posts, id])

  if (loading || postLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading post...</p>
        </div>
      </div>
    )
  }

  if (error || postError) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Post</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error || postError}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!post && !loading && !postLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Post Not Found</h2>
          <Link to="/blogs" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Back to Blogs
          </Link>
        </div>
      </div>
    )
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'No Date'
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Invalid Date'
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

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

  const deduplicateContent = (content) => {
    if (!content) return content
    const lines = content.split('\n')
    const filteredLines = []
    let foundMainTitle = false
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmed = line.trim()
      if (trimmed.startsWith('# ') && !foundMainTitle) {
        foundMainTitle = true
        continue
      }
      filteredLines.push(line)
    }
    return filteredLines.join('\n')
  }

  const cleanContent = post.content ? deduplicateContent(post.content) : ''

  const getReadingTime = (content) => {
    if (!content) return 1
    const words = content.trim().split(/\s+/).length
    const time = Math.ceil(words / 200)
    return time < 1 ? 1 : time
  }

  const getExcerpt = (content, maxLength = 160) => {
    if (!content) return ''
    const plainText = content
      .replace(/^#+ .*/gm, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/>\s.*/g, '')
      .replace(/- .*/g, '')
      .replace(/\n+/g, ' ')
      .trim()
    return plainText.length <= maxLength ? plainText : plainText.substring(0, maxLength).trim() + '...'
  }

  const getRelatedPosts = () => {
    if (!post || !posts) return []
    return posts
      .filter(p => p.id !== post.id && p.status === 'published' && p.category === post.category)
      .slice(0, 3)
  }

  const relatedPosts = getRelatedPosts()

  const getAdjacentPosts = () => {
    if (!post || !posts) return { prev: null, next: null }
    const publishedPosts = posts
      .filter(p => p.status === 'published')
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    const currentIndex = publishedPosts.findIndex(p => p.id === post.id)
    return {
      prev: currentIndex < publishedPosts.length - 1 ? publishedPosts[currentIndex + 1] : null,
      next: currentIndex > 0 ? publishedPosts[currentIndex - 1] : null
    }
  }

  const { prev: prevPost, next: nextPost } = getAdjacentPosts()

  const getAdjacentPostTitle = (adjacentPost) => {
    if (!adjacentPost) return ''
    if (adjacentPost.content) {
      const lines = adjacentPost.content.split('\n')
      for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed.startsWith('# ')) {
          const title = trimmed.substring(2)
          return title.length > 50 ? title.substring(0, 50) + '...' : title
        }
      }
    }
    return adjacentPost.excerpt || 'Untitled Post'
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getRelatedPostTitle = (relatedPost) => {
    if (relatedPost.content) {
      const lines = relatedPost.content.split('\n')
      for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed.startsWith('# ')) return trimmed.substring(2)
      }
    }
    return relatedPost.excerpt || 'Untitled Post'
  }

  const postTitle = getPostTitle()
  const keywords = extractKeywords(post.content, 15)

  return (
    <div className="max-w-7xl mx-auto px-4">
      {/* SEO */}
      <SEOHead
        title={postTitle}
        description={getExcerpt(post.content)}
        image={post.og_image}
        url={window.location.href}
        type="article"
        publishedTime={post.created_at}
        modifiedTime={post.updated_at}
        tags={post.tags || [post.category].filter(Boolean)}
      />
      
      {/* SEO Keywords & Structured Data */}
      <SEOKeywords
        keywords={keywords}
        post={{
          title: postTitle,
          description: getExcerpt(post.content),
          content: post.content,
          image: post.og_image,
          publishedTime: post.created_at,
          modifiedTime: post.updated_at,
          category: post.category,
          author: 'Muhammadali'
        }}
        type="article"
      />

      {/* Floating TOC */}
      <FloatingTOC content={post.content} />

      {/* Quote Share */}
      <QuoteShare />

      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 dark:bg-gray-700 z-50">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-150"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      <div className="flex gap-8">
        {/* Main Content */}
        <div className="flex-1 max-w-4xl">
          {/* Back navigation */}
          <div className="mb-6 sm:mb-8 pt-8 sm:pt-12 flex items-center justify-between gap-2">
            <Link 
              to="/blogs" 
              className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white font-medium transition-colors inline-flex items-center gap-1 sm:gap-2 text-sm sm:text-base"
            >
              <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden xs:inline">{t.backToBlogs || 'Back to Blogs'}</span>
              <span className="xs:hidden">Back</span>
            </Link>
            <div className="flex items-center gap-1 sm:gap-2">
              <ExportPost post={post} title={postTitle} />
              <BookmarkButton postId={post.id} postTitle={postTitle} />
            </div>
          </div>

          {/* Post header */}
          <header className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-white leading-tight mb-4">{postTitle}</h1>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-gray-600 dark:text-gray-400 text-sm">
              <span>{formatDate(post.created_at)}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {getReadingTime(post.content)} min read
              </span>
              <span>•</span>
              <ViewCounter postId={post.id} />
              {post.category && (
                <>
                  <span>•</span>
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs capitalize">{post.category}</span>
                </>
              )}
            </div>
          </header>

          {/* Table of Contents */}
          <TableOfContents content={post.content} />

          {/* Post content */}
          <article className="prose prose-lg dark:prose-invert max-w-none">
            <div className="text-gray-800 dark:text-gray-200 leading-relaxed bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-8 shadow-sm border border-gray-100 dark:border-gray-700">
              {cleanContent && renderMarkdown(cleanContent, { emptyText: 'No content available' })}
            </div>
          </article>

          {/* Post Stats */}
          <div className="mt-8">
            <PostStats postId={post.id} />
          </div>

          {/* Reactions */}
          <div className="mt-8 py-6 sm:py-8 border-t border-b border-gray-200 dark:border-gray-700">
            <Reactions postId={post.id} />
          </div>

          {/* Post Rating */}
          <div className="mt-8">
            <PostRating postId={post.id} />
          </div>

          {/* Social Share */}
          <div className="mt-8">
            <SocialShare 
              url={window.location.href} 
              title={postTitle}
              description={getExcerpt(post.content)}
            />
          </div>

          {/* Post footer */}
          <footer className="mt-8">
            {/* Post Navigation */}
            {(prevPost || nextPost) && (
              <div className="mb-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {prevPost ? (
                    <Link
                      to={`/post/${prevPost.id}`}
                      className="group p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                        <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Previous Post
                      </div>
                      <h4 className="font-semibold text-gray-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {getAdjacentPostTitle(prevPost)}
                      </h4>
                    </Link>
                  ) : <div></div>}
                  
                  {nextPost ? (
                    <Link
                      to={`/post/${nextPost.id}`}
                      className="group p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all border border-gray-200 dark:border-gray-700 text-right"
                    >
                      <div className="flex items-center justify-end gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                        Next Post
                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      <h4 className="font-semibold text-gray-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {getAdjacentPostTitle(nextPost)}
                      </h4>
                    </Link>
                  ) : <div></div>}
                </div>
              </div>
            )}

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
              <div className="mb-12">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 text-center">Related Posts</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {relatedPosts.map(relatedPost => (
                    <Link
                      key={relatedPost.id}
                      to={`/post/${relatedPost.id}`}
                      className="block p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all hover:shadow-md group"
                    >
                      <h4 className="font-medium text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 mb-2">
                        {getRelatedPostTitle(relatedPost)}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>{formatDate(relatedPost.created_at)}</span>
                        <span>•</span>
                        <span>{getReadingTime(relatedPost.content)} min read</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Comments */}
            <Comments postId={post.id} />
          </footer>
        </div>

        {/* Sidebar */}
        <div className="hidden lg:block w-80 flex-shrink-0">
          <div className="sticky top-24 space-y-6">
            <RelatedPostsWidget 
              currentPostId={post.id} 
              category={post.category}
              tags={post.tags || []}
            />
          </div>
        </div>
      </div>
      
      {/* Back to top button */}
      <div className={`fixed bottom-8 right-8 transition-all duration-300 z-40 ${showBackToTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-110"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default BlogPost